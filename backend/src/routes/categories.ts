import { Hono } from 'hono'
import prisma from '../lib/prisma.js'
import { authMiddleware } from '../middleware/auth.js'
import { validateData, createCategorySchema } from '../utils/validators.js'

const categories = new Hono()

// All routes require authentication
categories.use('/*', authMiddleware)

// Get all categories
categories.get('/', async (c) => {
    try {
        const categoryList = await prisma.category.findMany({
            include: {
                _count: {
                    select: { products: true },
                },
            },
            orderBy: {
                name: 'asc',
            },
        })

        return c.json(categoryList)
    } catch (error: any) {
        return c.json({ error: error.message || 'Failed to fetch categories' }, 400)
    }
})

// Create category
categories.post('/', async (c) => {
    try {
        const body = await c.req.json()
        const data = validateData(createCategorySchema, body)

        const category = await prisma.category.create({
            data,
        })

        return c.json(category, 201)
    } catch (error: any) {
        if (error.code === 'P2002') {
            return c.json({ error: 'Category name already exists' }, 400)
        }
        return c.json({ error: error.message || 'Failed to create category' }, 400)
    }
})

// Update category
categories.put('/:id', async (c) => {
    try {
        const id = c.req.param('id')
        const body = await c.req.json()
        const data = validateData(createCategorySchema.partial(), body)

        const category = await prisma.category.update({
            where: { id },
            data,
        })

        return c.json(category)
    } catch (error: any) {
        if (error.code === 'P2025') {
            return c.json({ error: 'Category not found' }, 404)
        }
        return c.json({ error: error.message || 'Failed to update category' }, 400)
    }
})

// Delete category
categories.delete('/:id', async (c) => {
    try {
        const id = c.req.param('id')

        await prisma.category.delete({
            where: { id },
        })

        return c.json({ message: 'Category deleted successfully' })
    } catch (error: any) {
        if (error.code === 'P2025') {
            return c.json({ error: 'Category not found' }, 404)
        }
        if (error.code === 'P2003') {
            return c.json({ error: 'Cannot delete category with existing products' }, 400)
        }
        return c.json({ error: error.message || 'Failed to delete category' }, 400)
    }
})

export default categories

