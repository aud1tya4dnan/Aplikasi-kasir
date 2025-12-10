import { Hono } from 'hono'
import prisma from '../lib/prisma.js'
import { authMiddleware } from '../middleware/auth.js'

const reports = new Hono()

reports.use('/*', authMiddleware)

// Dashboard summary
reports.get('/dashboard', async (c) => {
    try {
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        // Today's transactions
        const todayTransactions = await prisma.transaction.findMany({
            where: {
                createdAt: { gte: today },
                status: 'completed',
            },
            include: {
                items: {
                    include: {
                        product: true,
                    },
                },
            },
        })

        // Calculate today's revenue
        const todayRevenue = todayTransactions.reduce(
            (sum, t) => sum + Number(t.totalAmount),
            0
        )

        // Calculate today's profit (revenue - cost)
        const todayProfit = todayTransactions.reduce((sum, t) => {
            const transactionProfit = t.items.reduce((itemSum, item) => {
                const profit = (Number(item.pricePerUnit) - Number(item.product.buyPrice)) * item.quantity
                return itemSum + profit
            }, 0)
            return sum + transactionProfit
        }, 0)

        // Low stock products count
        const lowStockCount = await prisma.product.count({
            where: {
                stock: {
                    lte: prisma.product.fields.minStock,
                },
            },
        })

        // Unpaid debts total
        const unpaidDebts = await prisma.debt.findMany({
            where: {
                status: { in: ['unpaid', 'partial'] },
            },
        })
        const totalUnpaidDebt = unpaidDebts.reduce(
            (sum, d) => sum + Number(d.remainingDebt),
            0
        )

        return c.json({
            todayRevenue,
            todayProfit,
            todayTransactionsCount: todayTransactions.length,
            lowStockCount,
            totalUnpaidDebt,
        })
    } catch (error: any) {
        return c.json({ error: error.message || 'Failed to fetch dashboard data' }, 400)
    }
})

// Sales report (daily, weekly, monthly)
reports.get('/sales', async (c) => {
    try {
        const { period = 'daily', startDate, endDate } = c.req.query()

        let dateFilter: any = {}
        const now = new Date()

        if (startDate && endDate) {
            dateFilter = {
                gte: new Date(startDate),
                lte: new Date(endDate),
            }
        } else if (period === 'daily') {
            const today = new Date()
            today.setHours(0, 0, 0, 0)
            dateFilter = { gte: today }
        } else if (period === 'weekly') {
            const weekAgo = new Date()
            weekAgo.setDate(weekAgo.getDate() - 7)
            dateFilter = { gte: weekAgo }
        } else if (period === 'monthly') {
            const monthAgo = new Date()
            monthAgo.setMonth(monthAgo.getMonth() - 1)
            dateFilter = { gte: monthAgo }
        }

        const transactions = await prisma.transaction.findMany({
            where: {
                createdAt: dateFilter,
                status: 'completed',
            },
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

        const totalRevenue = transactions.reduce((sum, t) => sum + Number(t.totalAmount), 0)

        const totalProfit = transactions.reduce((sum, t) => {
            const transactionProfit = t.items.reduce((itemSum, item) => {
                const profit = (Number(item.pricePerUnit) - Number(item.product.buyPrice)) * item.quantity
                return itemSum + profit
            }, 0)
            return sum + transactionProfit
        }, 0)

        // Group by payment method
        const byPaymentMethod = transactions.reduce((acc: any, t) => {
            if (!acc[t.paymentMethod]) {
                acc[t.paymentMethod] = { count: 0, total: 0 }
            }
            acc[t.paymentMethod].count++
            acc[t.paymentMethod].total += Number(t.totalAmount)
            return acc
        }, {})

        return c.json({
            period,
            startDate: dateFilter.gte,
            endDate: dateFilter.lte || now,
            totalTransactions: transactions.length,
            totalRevenue,
            totalProfit,
            byPaymentMethod,
            transactions,
        })
    } catch (error: any) {
        return c.json({ error: error.message || 'Failed to fetch sales report' }, 400)
    }
})

// Best selling products
reports.get('/best-sellers', async (c) => {
    try {
        const { limit = '10', period = 'monthly' } = c.req.query()

        let dateFilter: any = {}
        if (period === 'daily') {
            const today = new Date()
            today.setHours(0, 0, 0, 0)
            dateFilter = { gte: today }
        } else if (period === 'weekly') {
            const weekAgo = new Date()
            weekAgo.setDate(weekAgo.getDate() - 7)
            dateFilter = { gte: weekAgo }
        } else if (period === 'monthly') {
            const monthAgo = new Date()
            monthAgo.setMonth(monthAgo.getMonth() - 1)
            dateFilter = { gte: monthAgo }
        }

        const transactionItems = await prisma.transactionItem.findMany({
            where: {
                transaction: {
                    createdAt: dateFilter,
                    status: 'completed',
                },
            },
            include: {
                product: {
                    include: {
                        category: true,
                    },
                },
            },
        })

        // Aggregate by product
        const productSales = transactionItems.reduce((acc: any, item) => {
            const productId = item.productId
            if (!acc[productId]) {
                acc[productId] = {
                    product: item.product,
                    totalQuantity: 0,
                    totalRevenue: 0,
                    transactionCount: 0,
                }
            }
            acc[productId].totalQuantity += item.quantity
            acc[productId].totalRevenue += Number(item.subtotal)
            acc[productId].transactionCount++
            return acc
        }, {})

        // Convert to array and sort
        const bestSellers = Object.values(productSales)
            .sort((a: any, b: any) => b.totalQuantity - a.totalQuantity)
            .slice(0, parseInt(limit as string))

        return c.json(bestSellers)
    } catch (error: any) {
        return c.json({ error: error.message || 'Failed to fetch best sellers' }, 400)
    }
})

// Purchase summary
reports.get('/purchases', async (c) => {
    try {
        const { period = 'monthly' } = c.req.query()

        let dateFilter: any = {}
        if (period === 'daily') {
            const today = new Date()
            today.setHours(0, 0, 0, 0)
            dateFilter = { gte: today }
        } else if (period === 'weekly') {
            const weekAgo = new Date()
            weekAgo.setDate(weekAgo.getDate() - 7)
            dateFilter = { gte: weekAgo }
        } else if (period === 'monthly') {
            const monthAgo = new Date()
            monthAgo.setMonth(monthAgo.getMonth() - 1)
            dateFilter = { gte: monthAgo }
        }

        const purchases = await prisma.purchase.findMany({
            where: {
                createdAt: dateFilter,
            },
        })

        const totalPurchases = purchases.length
        const totalExpense = purchases.reduce((sum, p) => sum + Number(p.totalAmount), 0)

        return c.json({
            period,
            totalPurchases,
            totalExpense,
        })
    } catch (error: any) {
        return c.json({ error: error.message || 'Failed to fetch purchase report' }, 400)
    }
})

export default reports

