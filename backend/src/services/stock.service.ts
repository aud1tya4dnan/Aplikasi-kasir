import prisma from '../lib/prisma.js'
import { Decimal } from '@prisma/client/runtime/library'

export interface StockUpdate {
    productId: string
    quantity: number
    type: 'increase' | 'decrease'
}

/**
 * Update product stock after transaction or purchase
 */
export async function updateStock(updates: StockUpdate[]): Promise<void> {
    for (const update of updates) {
        const product = await prisma.product.findUnique({
            where: { id: update.productId },
            select: { stock: true },
        })

        if (!product) {
            throw new Error(`Product with ID ${update.productId} not found`)
        }

        const newStock = update.type === 'increase'
            ? product.stock + update.quantity
            : product.stock - update.quantity

        if (newStock < 0) {
            throw new Error(`Insufficient stock for product ID ${update.productId}`)
        }

        await prisma.product.update({
            where: { id: update.productId },
            data: { stock: newStock },
        })
    }
}

/**
 * Get low stock products (stock <= minStock)
 */
export async function getLowStockProducts() {
    return await prisma.product.findMany({
        where: {
            stock: {
                lte: prisma.product.fields.minStock,
            },
        },
        include: {
            category: true,
        },
        orderBy: {
            stock: 'asc',
        },
    })
}

/**
 * Check if product has sufficient stock
 */
export async function checkStock(productId: string, quantity: number): Promise<boolean> {
    const product = await prisma.product.findUnique({
        where: { id: productId },
        select: { stock: true },
    })

    if (!product) {
        throw new Error(`Product with ID ${productId} not found`)
    }

    return product.stock >= quantity
}

/**
 * Get stock alerts for products below minimum
 */
export async function getStockAlerts() {
    const products = await getLowStockProducts()

    return products.map(product => ({
        id: product.id,
        name: product.name,
        code: product.code,
        category: product.category.name,
        currentStock: product.stock,
        minStock: product.minStock,
        deficit: product.minStock - product.stock,
        severity: product.stock === 0 ? 'critical' : product.stock < product.minStock / 2 ? 'high' : 'medium',
    }))
}

