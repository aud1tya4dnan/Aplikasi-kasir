import { Hono } from 'hono'
import prisma from '../lib/prisma.js'
import { authMiddleware } from '../middleware/auth.js'
import { validateData, createDebtPaymentSchema } from '../utils/validators.js'
import { Decimal } from '@prisma/client/runtime/library'

const debts = new Hono()

debts.use('/*', authMiddleware)

// Get all debts
debts.get('/', async (c) => {
    try {
        const { status, customerId } = c.req.query()

        const where: any = {}
        if (status) where.status = status
        if (customerId) where.customerId = customerId

        const debtList = await prisma.debt.findMany({
            where,
            include: {
                customer: true,
                transaction: {
                    select: {
                        invoiceNumber: true,
                        createdAt: true,
                    },
                },
                payments: {
                    orderBy: {
                        createdAt: 'desc',
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        })

        return c.json(debtList)
    } catch (error: any) {
        return c.json({ error: error.message || 'Failed to fetch debts' }, 400)
    }
})

// Get debt by ID
debts.get('/:id', async (c) => {
    try {
        const id = c.req.param('id')

        const debt = await prisma.debt.findUnique({
            where: { id },
            include: {
                customer: true,
                transaction: {
                    include: {
                        items: {
                            include: {
                                product: true,
                            },
                        },
                    },
                },
                payments: {
                    orderBy: {
                        createdAt: 'desc',
                    },
                },
            },
        })

        if (!debt) {
            return c.json({ error: 'Debt not found' }, 404)
        }

        return c.json(debt)
    } catch (error: any) {
        return c.json({ error: error.message || 'Failed to fetch debt' }, 400)
    }
})

// Add debt payment
debts.post('/payments', async (c) => {
    try {
        const body = await c.req.json()
        const data = validateData(createDebtPaymentSchema, body)

        const result = await prisma.$transaction(async (tx) => {
            // Get current debt
            const debt = await tx.debt.findUnique({
                where: { id: data.debtId },
            })

            if (!debt) {
                throw new Error('Debt not found')
            }

            if (debt.status === 'paid') {
                throw new Error('Debt already fully paid')
            }

            if (data.amount > Number(debt.remainingDebt)) {
                throw new Error('Payment amount exceeds remaining debt')
            }

            // Create payment record
            const payment = await tx.debtPayment.create({
                data: {
                    debtId: data.debtId,
                    amount: new Decimal(data.amount),
                    paymentMethod: data.paymentMethod || 'cash',
                    notes: data.notes,
                },
            })

            // Update debt
            const newPaidAmount = Number(debt.paidAmount) + data.amount
            const newRemainingDebt = Number(debt.totalDebt) - newPaidAmount

            let newStatus = debt.status
            if (newRemainingDebt === 0) {
                newStatus = 'paid'
            } else if (newPaidAmount > 0) {
                newStatus = 'partial'
            }

            const updatedDebt = await tx.debt.update({
                where: { id: data.debtId },
                data: {
                    paidAmount: new Decimal(newPaidAmount),
                    remainingDebt: new Decimal(newRemainingDebt),
                    status: newStatus,
                },
                include: {
                    customer: true,
                    transaction: true,
                    payments: true,
                },
            })

            return { payment, debt: updatedDebt }
        })

        return c.json(result, 201)
    } catch (error: any) {
        return c.json({ error: error.message || 'Failed to add payment' }, 400)
    }
})

// Get payment history for a debt
debts.get('/:id/payments', async (c) => {
    try {
        const id = c.req.param('id')

        const payments = await prisma.debtPayment.findMany({
            where: { debtId: id },
            orderBy: {
                createdAt: 'desc',
            },
        })

        return c.json(payments)
    } catch (error: any) {
        return c.json({ error: error.message || 'Failed to fetch payments' }, 400)
    }
})

// Update debt payment
debts.put('/payments/:id', async (c) => {
    try {
        const id = c.req.param('id')
        const body = await c.req.json()
        const { amount, paymentMethod, notes } = body

        const result = await prisma.$transaction(async (tx) => {
            // Get the payment to update
            const oldPayment = await tx.debtPayment.findUnique({
                where: { id },
                include: { debt: true },
            })

            if (!oldPayment) {
                throw new Error('Payment not found')
            }

            // Calculate the difference
            const oldAmount = Number(oldPayment.amount)
            const newAmount = Number(amount)
            const difference = newAmount - oldAmount

            // Update payment
            const updatedPayment = await tx.debtPayment.update({
                where: { id },
                data: {
                    amount: new Decimal(newAmount),
                    paymentMethod: paymentMethod || oldPayment.paymentMethod,
                    notes: notes !== undefined ? notes : oldPayment.notes,
                },
            })

            // Recalculate debt
            const debt = oldPayment.debt
            const newPaidAmount = Number(debt.paidAmount) + difference
            const newRemainingDebt = Number(debt.totalDebt) - newPaidAmount

            if (newRemainingDebt < 0) {
                throw new Error('Payment amount exceeds total debt')
            }

            let newStatus = debt.status
            if (newRemainingDebt === 0) {
                newStatus = 'paid'
            } else if (newPaidAmount > 0) {
                newStatus = 'partial'
            } else {
                newStatus = 'unpaid'
            }

            await tx.debt.update({
                where: { id: debt.id },
                data: {
                    paidAmount: new Decimal(newPaidAmount),
                    remainingDebt: new Decimal(newRemainingDebt),
                    status: newStatus,
                },
            })

            return updatedPayment
        })

        return c.json(result)
    } catch (error: any) {
        return c.json({ error: error.message || 'Failed to update payment' }, 400)
    }
})

// Delete debt payment
debts.delete('/payments/:id', async (c) => {
    try {
        const id = c.req.param('id')

        const result = await prisma.$transaction(async (tx) => {
            // Get payment to delete
            const payment = await tx.debtPayment.findUnique({
                where: { id },
                include: { debt: true },
            })

            if (!payment) {
                throw new Error('Payment not found')
            }

            // Delete the payment
            await tx.debtPayment.delete({
                where: { id },
            })

            // Recalculate debt
            const debt = payment.debt
            const newPaidAmount = Number(debt.paidAmount) - Number(payment.amount)
            const newRemainingDebt = Number(debt.totalDebt) - newPaidAmount

            let newStatus = debt.status
            if (newRemainingDebt === Number(debt.totalDebt)) {
                newStatus = 'unpaid'
            } else if (newRemainingDebt > 0) {
                newStatus = 'partial'
            } else {
                newStatus = 'paid'
            }

            await tx.debt.update({
                where: { id: debt.id },
                data: {
                    paidAmount: new Decimal(newPaidAmount),
                    remainingDebt: new Decimal(newRemainingDebt),
                    status: newStatus,
                },
            })

            return { message: 'Payment deleted successfully' }
        })

        return c.json(result)
    } catch (error: any) {
        return c.json({ error: error.message || 'Failed to delete payment' }, 400)
    }
})

// Manual debt adjustment
debts.post('/:id/adjust', async (c) => {
    try {
        const id = c.req.param('id')
        const body = await c.req.json()
        const { newTotalDebt, reason } = body

        const result = await prisma.$transaction(async (tx) => {
            // Get current debt
            const debt = await tx.debt.findUnique({
                where: { id },
            })

            if (!debt) {
                throw new Error('Debt not found')
            }

            const oldTotal = Number(debt.totalDebt)
            const paidAmount = Number(debt.paidAmount)
            const newTotal = Number(newTotalDebt)
            const newRemaining = newTotal - paidAmount

            // Determine new status
            let newStatus = debt.status
            if (newRemaining <= 0) {
                newStatus = 'paid'
            } else if (paidAmount > 0) {
                newStatus = 'partial'
            } else {
                newStatus = 'unpaid'
            }

            // Update debt with adjustment note
            const adjustmentNote = reason
                ? `Manual adjustment: ${reason}. Old total: ${oldTotal}, New total: ${newTotal}`
                : `Manual adjustment from ${oldTotal} to ${newTotal}`

            await tx.debt.update({
                where: { id },
                data: {
                    totalDebt: new Decimal(newTotal),
                    remainingDebt: new Decimal(newRemaining),
                    status: newStatus,
                    notes: debt.notes
                        ? `${debt.notes}\n${adjustmentNote}`
                        : adjustmentNote,
                },
            })

            return {
                message: 'Debt adjusted successfully',
                oldTotal,
                newTotal,
                paidAmount,
                newRemaining,
                status: newStatus,
            }
        })

        return c.json(result)
    } catch (error: any) {
        return c.json({ error: error.message || 'Failed to adjust debt' }, 400)
    }
})

export default debts

