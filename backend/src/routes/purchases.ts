import { Hono } from 'hono'
import prisma from '../lib/prisma.js'
import { authMiddleware } from '../middleware/auth.js'
import { validateData, createPurchaseSchema } from '../utils/validators.js'
import { updateStock } from '../services/stock.service.js'
import { Decimal } from '@prisma/client/runtime/library'

const purchases = new Hono()

purchases.use('/*', authMiddleware)

// Get all purchases
purchases.get('/', async (c) => {
    try {
        const { startDate, endDate } = c.req.query()

        const where: any = {}

        if (startDate || endDate) {
            where.createdAt = {}
            if (startDate) where.createdAt.gte = new Date(startDate)
            if (endDate) where.createdAt.lte = new Date(endDate)
        }

        const purchaseList = await prisma.purchase.findMany({
            where,
            include: {
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

        return c.json(purchaseList)
    } catch (error: any) {
        return c.json({ error: error.message || 'Failed to fetch purchases' }, 400)
    }
})

// Get purchase by ID
purchases.get('/:id', async (c) => {
    try {
        const id = c.req.param('id')

        const purchase = await prisma.purchase.findUnique({
            where: { id },
            include: {
                items: {
                    include: {
                        product: true,
                    },
                },
            },
        })

        if (!purchase) {
            return c.json({ error: 'Purchase not found' }, 404)
        }

        return c.json(purchase)
    } catch (error: any) {
        return c.json({ error: error.message || 'Failed to fetch purchase' }, 400)
    }
})

// Create purchase (Kulakan)
purchases.post('/', async (c) => {
    try {
        const body = await c.req.json()
        const data = validateData(createPurchaseSchema, body)

        // Calculate total
        const totalAmount = data.items.reduce((sum, item) => sum + (item.quantity * item.pricePerUnit), 0)

        // Generate purchase number
        const purchaseNumber = `PUR-${Date.now()}`

        // Create purchase with transaction
        const purchase = await prisma.$transaction(async (tx) => {
            // Create purchase
            const newPurchase = await tx.purchase.create({
                data: {
                    purchaseNumber,
                    supplier: data.supplier,
                    totalAmount: new Decimal(totalAmount),
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
                    items: {
                        include: {
                            product: true,
                        },
                    },
                },
            })

            // Update stock (increase)
            await updateStock(
                data.items.map(item => ({
                    productId: item.productId,
                    quantity: item.quantity,
                    type: 'increase',
                }))
            )

            return newPurchase
        })

        return c.json(purchase, 201)
    } catch (error: any) {
        return c.json({ error: error.message || 'Failed to create purchase' }, 400)
    }
})

// Update purchase
purchases.put('/:id', async (c) => {
    try {
        const id = c.req.param('id')
        const body = await c.req.json()
        const data = validateData(createPurchaseSchema, body)

        // Get existing purchase
        const existingPurchase = await prisma.purchase.findUnique({
            where: { id },
            include: { items: true },
        })

        if (!existingPurchase) {
            return c.json({ error: 'Purchase not found' }, 404)
        }

        // Calculate new total
        const totalAmount = data.items.reduce((sum, item) => sum + (item.quantity * item.pricePerUnit), 0)

        const purchase = await prisma.$transaction(async (tx) => {
            // Delete old items
            await tx.purchaseItem.deleteMany({
                where: { purchaseId: id },
            })

            // Reverse old stock changes
            for (const oldItem of existingPurchase.items) {
                await updateStock([{
                    productId: oldItem.productId,
                    quantity: oldItem.quantity,
                    type: 'decrease', // Reverse the increase
                }])
            }

            // Update purchase with new items
            const updatedPurchase = await tx.purchase.update({
                where: { id },
                data: {
                    supplier: data.supplier,
                    totalAmount: new Decimal(totalAmount),
                    notes: data.notes,
                    items: {
                        create: data.items.map(item => ({
                            productId: item.productId,
                            quantity: Number(item.quantity),
                            pricePerUnit: new Decimal(item.pricePerUnit),
                            subtotal: new Decimal(Number(item.quantity) * item.pricePerUnit),
                        })),
                    },
                },
                include: {
                    items: {
                        include: {
                            product: true,
                        },
                    },
                },
            })

            // Apply new stock changes
            await updateStock(
                data.items.map(item => ({
                    productId: item.productId,
                    quantity: Number(item.quantity),
                    type: 'increase',
                }))
            )

            return updatedPurchase
        })

        return c.json(purchase)
    } catch (error: any) {
        return c.json({ error: error.message || 'Failed to update purchase' }, 400)
    }
})

export default purchases

