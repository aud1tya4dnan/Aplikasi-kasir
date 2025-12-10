import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'

// Import routes
import auth from './routes/auth.js'
import products from './routes/products.js'
import categories from './routes/categories.js'
import customers from './routes/customers.js'
import transactions from './routes/transactions.js'
import purchases from './routes/purchases.js'
import debts from './routes/debts.js'
import reports from './routes/reports.js'
import settings from './routes/settings.js'

const app = new Hono()

// Middleware
app.use('/*', logger())
app.use('/*', cors({
    origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:5173', 'http://localhost:4173'],
    credentials: true,
}))

// Health check
app.get('/', (c) => {
    return c.json({
        message: 'POS API Server',
        version: '1.0.0',
        status: 'running'
    })
})

app.get('/health', (c) => {
    return c.json({ status: 'OK', timestamp: new Date().toISOString() })
})

// API routes
app.route('/api/auth', auth)
app.route('/api/products', products)
app.route('/api/categories', categories)
app.route('/api/customers', customers)
app.route('/api/transactions', transactions)
app.route('/api/purchases', purchases)
app.route('/api/debts', debts)
app.route('/api/reports', reports)
app.route('/api/settings', settings)

// 404 handler
app.notFound((c) => {
    return c.json({ error: 'Not Found' }, 404)
})

// Error handler
app.onError((err, c) => {
    console.error('Server error:', err)
    return c.json({ error: 'Internal Server Error', message: err.message }, 500)
})

const port = parseInt(process.env.PORT || '3000')

console.log(`🚀 Server is running on port ${port}`)

serve({
    fetch: app.fetch,
    port
})

