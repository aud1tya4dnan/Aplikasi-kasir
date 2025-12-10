import { Hono } from 'hono'
import prisma from '../lib/prisma.js'
import { authMiddleware } from '../middleware/auth.js'
import { validateData, createProductSchema, updateProductSchema } from '../utils/validators.js'
import { getStockAlerts } from '../services/stock.service.js'

const products = new Hono()

// All routes require authentication
products.use('/*', authMiddleware)

// Get all products with optional filters
products.get('/', async (c) => {
    try {
        const { categoryId, lowStock, status } = c.req.query()

        const where: any = {}

        if (categoryId) {
            where.categoryId = categoryId
        }

        // Filter by status (default to ACTIVE only, but allow ALL)
        if (status && status !== 'ALL') {
            where.status = status
        } else if (!status) {
            where.status = 'ACTIVE'
        }

        const productList = await prisma.product.findMany({
            where,
            include: {
                category: true,
            },
            orderBy: {
                name: 'asc',
            },
        })

        // Filter low stock if requested
        let result = productList
        if (lowStock === 'true') {
            result = productList.filter(p => p.stock <= p.minStock)
        }

        return c.json(result)
    } catch (error: any) {
        return c.json({ error: error.message || 'Failed to fetch products' }, 400)
    }
})

// Get product by ID
products.get('/:id', async (c) => {
    try {
        const id = c.req.param('id')

        const product = await prisma.product.findUnique({
            where: { id },
            include: {
                category: true,
            },
        })

        if (!product) {
            return c.json({ error: 'Product not found' }, 404)
        }

        return c.json(product)
    } catch (error: any) {
        return c.json({ error: error.message || 'Failed to fetch product' }, 400)
    }
})

// Create product
products.post('/', async (c) => {
    try {
        const body = await c.req.json()
        const data = validateData(createProductSchema, body)

        const product = await prisma.product.create({
            data: {
                code: data.code,
                name: data.name,
                categoryId: data.categoryId,
                stock: data.stock || 0,
                minStock: data.minStock || 5,
                buyPrice: data.buyPrice,
                sellPrice: data.sellPrice,
            },
            include: {
                category: true,
            },
        })

        return c.json(product, 201)
    } catch (error: any) {
        if (error.code === 'P2002') {
            return c.json({ error: 'Product code already exists' }, 400)
        }
        if (error.code === 'P2003') {
            return c.json({ error: 'Category not found' }, 400)
        }
        return c.json({ error: error.message || 'Failed to create product' }, 400)
    }
})

// Update product
products.put('/:id', async (c) => {
    try {
        const id = c.req.param('id')
        const body = await c.req.json()
        const data = validateData(updateProductSchema, body)

        const product = await prisma.product.update({
            where: { id },
            data,
            include: {
                category: true,
            },
        })

        return c.json(product)
    } catch (error: any) {
        if (error.code === 'P2025') {
            return c.json({ error: 'Product not found' }, 404)
        }
        if (error.code === 'P2002') {
            return c.json({ error: 'Product code already exists' }, 400)
        }
        return c.json({ error: error.message || 'Failed to update product' }, 400)
    }
})

// Toggle product status (soft delete/restore)
products.patch('/:id/status', async (c) => {
    try {
        const id = c.req.param('id')

        const product = await prisma.product.findUnique({
            where: { id },
        })

        if (!product) {
            return c.json({ error: 'Product not found' }, 404)
        }

        // Toggle status
        const newStatus = product.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'

        const updated = await prisma.product.update({
            where: { id },
            data: { status: newStatus },
            include: {
                category: true,
            },
        })

        return c.json({
            message: `Product ${newStatus === 'ACTIVE' ? 'activated' : 'archived'}`,
            product: updated,
        })
    } catch (error: any) {
        return c.json({ error: error.message || 'Failed to toggle product status' }, 400)
    }
})

// Get stock alerts
products.get('/alerts/low-stock', async (c) => {
    try {
        const alerts = await getStockAlerts()
        return c.json(alerts)
    } catch (error: any) {
        return c.json({ error: error.message || 'Failed to fetch stock alerts' }, 400)
    }
})

export default products
