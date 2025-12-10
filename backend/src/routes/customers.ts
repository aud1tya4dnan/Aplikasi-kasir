import { Hono } from 'hono'
import prisma from '../lib/prisma.js'
import { authMiddleware } from '../middleware/auth.js'
import { validateData, createCustomerSchema } from '../utils/validators.js'

const customers = new Hono()

customers.use('/*', authMiddleware)

// Get all customers
customers.get('/', async (c) => {
    try {
        const customerList = await prisma.customer.findMany({
            include: {
                _count: {
                    select: { transactions: true, debts: true },
                },
                debts: {
                    where: { status: { not: 'paid' } },
                    select: {
                        remainingDebt: true,
                    },
                },
            },
            orderBy: {
                name: 'asc',
            },
        })

        // Calculate total debt for each customer
        const customersWithDebt = customerList.map(customer => ({
            ...customer,
            totalDebt: customer.debts.reduce((sum, debt) => sum + Number(debt.remainingDebt), 0),
        }))

        return c.json(customersWithDebt)
    } catch (error: any) {
        return c.json({ error: error.message || 'Failed to fetch customers' }, 400)
    }
})

// Get customer by ID with debts
customers.get('/:id', async (c) => {
    try {
        const id = c.req.param('id')

        const customer = await prisma.customer.findUnique({
            where: { id },
            include: {
                debts: {
                    include: {
                        transaction: {
                            include: {
                                items: {
                                    include: {
                                        product: true,
                                    },
                                },
                            },
                        },
                        payments: true,
                    },
                    orderBy: {
                        createdAt: 'desc',
                    },
                },
                transactions: {
                    orderBy: {
                        createdAt: 'desc',
                    },
                    take: 10,
                },
            },
        })

        if (!customer) {
            return c.json({ error: 'Customer not found' }, 404)
        }

        return c.json(customer)
    } catch (error: any) {
        return c.json({ error: error.message || 'Failed to fetch customer' }, 400)
    }
})

// Create customer
customers.post('/', async (c) => {
    try {
        const body = await c.req.json()
        const data = validateData(createCustomerSchema, body)

        const customer = await prisma.customer.create({
            data,
        })

        return c.json(customer, 201)
    } catch (error: any) {
        return c.json({ error: error.message || 'Failed to create customer' }, 400)
    }
})

// Update customer
customers.put('/:id', async (c) => {
    try {
        const id = c.req.param('id')
        const body = await c.req.json()
        const data = validateData(createCustomerSchema.partial(), body)

        const customer = await prisma.customer.update({
            where: { id },
            data,
        })

        return c.json(customer)
    } catch (error: any) {
        if (error.code === 'P2025') {
            return c.json({ error: 'Customer not found' }, 404)
        }
        return c.json({ error: error.message || 'Failed to update customer' }, 400)
    }
})

// Delete customer
customers.delete('/:id', async (c) => {
    try {
        const id = c.req.param('id')

        await prisma.customer.delete({
            where: { id },
        })

        return c.json({ message: 'Customer deleted successfully' })
    } catch (error: any) {
        if (error.code === 'P2025') {
            return c.json({ error: 'Customer not found' }, 404)
        }
        if (error.code === 'P2003') {
            return c.json({ error: 'Cannot delete customer with existing transactions or debts' }, 400)
        }
        return c.json({ error: error.message || 'Failed to delete customer' }, 400)
    }
})

export default customers

