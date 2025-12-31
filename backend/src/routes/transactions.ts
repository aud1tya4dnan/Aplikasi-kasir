import { Hono } from 'hono'
import prisma from '../lib/prisma.js'
import { authMiddleware } from '../middleware/auth.js'
import { validateData, createTransactionSchema } from '../utils/validators.js'
import { updateStock } from '../services/stock.service.js'
import { generateQRIS } from '../services/qris.service.js'
import { generateReceipt, prepareReceiptData } from '../services/receipt.service.js'
import { Decimal } from '@prisma/client/runtime/library'

const transactions = new Hono()

transactions.use('/*', authMiddleware)

// Get all transactions with filters
transactions.get('/', async (c) => {
    try {
        const { startDate, endDate, customerId, paymentMethod } = c.req.query()

        const where: any = {}

        if (startDate || endDate) {
            where.createdAt = {}
            if (startDate) where.createdAt.gte = new Date(startDate)
            if (endDate) where.createdAt.lte = new Date(endDate)
        }

        if (customerId) where.customerId = customerId
        if (paymentMethod) where.paymentMethod = paymentMethod

        const transactionList = await prisma.transaction.findMany({
            where,
            include: {
                customer: true,
                items: {
                    include: {
                        product: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        })

        return c.json(transactionList)
    } catch (error: any) {
        return c.json({ error: error.message || 'Failed to fetch transactions' }, 400)
    }
})

// Get transaction by ID
transactions.get('/:id', async (c) => {
    try {
        const id = c.req.param('id')

        const transaction = await prisma.transaction.findUnique({
            where: { id },
            include: {
                customer: true,
                items: {
                    include: {
                        product: true,
                    },
                },
                debt: true,
            },
        })

        if (!transaction) {
            return c.json({ error: 'Transaction not found' }, 404)
        }

        return c.json(transaction)
    } catch (error: any) {
        return c.json({ error: error.message || 'Failed to fetch transaction' }, 400)
    }
})

// Create transaction
transactions.post('/', async (c) => {
    try {
        const body = await c.req.json()
        const data = validateData(createTransactionSchema, body)

        // Validate products exist and are active
        for (const item of data.items) {
            const product = await prisma.product.findUnique({
                where: { id: item.productId },
            })

            if (!product) {
                return c.json({ error: `Product ${item.productId} not found` }, 404)
            }

            if (product.status !== 'ACTIVE') {
                return c.json({ error: `Product ${product.name} is not available for sale` }, 400)
            }

            if (product.stock < item.quantity) {
                return c.json({ error: `Insufficient stock for ${product.name}` }, 400)
            }
        }
        const totalAmount = data.items.reduce((sum, item) => sum + (item.quantity * item.pricePerUnit), 0)

        // Generate invoice number
        const invoiceNumber = `INV-${Date.now()}`

        // For cash payment, calculate change
        let changeAmount = 0
        if (data.paymentMethod === 'cash' && data.paymentAmount) {
            changeAmount = data.paymentAmount - totalAmount
            if (changeAmount < 0) {
                return c.json({ error: 'Jumlah pembayaran kurang dari total' }, 400)
            }
        }

        // For QRIS, generate QR code
        let qrisData: string | undefined
        if (data.paymentMethod === 'qris') {
            qrisData = await generateQRIS(totalAmount)
        }

        // Create transaction with items
        const transaction = await prisma.$transaction(async (tx: any) => {
            // Create main transaction
            const newTransaction = await tx.transaction.create({
                data: {
                    invoiceNumber,
                    customerId: data.customerId,
                    totalAmount: new Decimal(totalAmount),
                    paymentMethod: data.paymentMethod,
                    paymentAmount: data.paymentAmount ? new Decimal(data.paymentAmount) : null,
                    changeAmount: changeAmount > 0 ? new Decimal(changeAmount) : null,
                    qrisData,
                    notes: data.notes,
                    items: {
                        create: data.items.map(item => ({
                            productId: item.productId,
                            quantity: item.quantity,
                            pricePerUnit: new Decimal(item.pricePerUnit),
                            subtotal: new Decimal(item.quantity * item.pricePerUnit),
                        })),
                    },
                },
                include: {
                    customer: true,
                    items: {
                        include: {
                            product: true,
                        },
                    },
                },
            })

            // Update stock
            await updateStock(
                data.items.map(item => ({
                    productId: item.productId,
                    quantity: item.quantity,
                    type: 'decrease',
                }))
            )

            // If credit, create debt record
            if (data.paymentMethod === 'credit' && data.customerId) {
                await tx.debt.create({
                    data: {
                        transactionId: newTransaction.id,
                        customerId: data.customerId,
                        totalDebt: new Decimal(totalAmount),
                        paidAmount: new Decimal(0),
                        remainingDebt: new Decimal(totalAmount),
                        status: 'unpaid',
                    },
                })
            }

            return newTransaction
        })

        return c.json(transaction, 201)
    } catch (error: any) {
        return c.json({ error: error.message || 'Failed to create transaction' }, 400)
    }
})

// Generate receipt
transactions.get('/:id/receipt', async (c) => {
    try {
        const id = c.req.param('id')

        const transaction = await prisma.transaction.findUnique({
            where: { id },
            include: {
                customer: true,
                items: {
                    include: {
                        product: true,
                    },
                },
            },
        })

        if (!transaction) {
            return c.json({ error: 'Transaction not found' }, 404)
        }

        const storeSettings = await prisma.storeSettings.findFirst()
        const receiptData = await prepareReceiptData(transaction, storeSettings || {})
        const receiptText = generateReceipt(receiptData)

        return c.json({ receipt: receiptText })
    } catch (error: any) {
        return c.json({ error: error.message || 'Failed to generate receipt' }, 400)
    }
})

export default transactions

