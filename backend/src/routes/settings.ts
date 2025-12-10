import { Hono } from 'hono'
import prisma from '../lib/prisma.js'
import { authMiddleware } from '../middleware/auth.js'
import { validateData, updateStoreSettingsSchema } from '../utils/validators.js'

const settings = new Hono()

settings.use('/*', authMiddleware)

// Get store settings
settings.get('/', async (c) => {
    try {
        let storeSettings = await prisma.storeSettings.findFirst()

        // Create default settings if none exist
        if (!storeSettings) {
            storeSettings = await prisma.storeSettings.create({
                data: {
                    storeName: 'Warung Kelontong',
                    minStockAlert: 5,
                },
            })
        }

        return c.json(storeSettings)
    } catch (error: any) {
        return c.json({ error: error.message || 'Failed to fetch settings' }, 400)
    }
})

// Update store settings
settings.put('/', async (c) => {
    try {
        const body = await c.req.json()
        const data = validateData(updateStoreSettingsSchema, body)

        let storeSettings = await prisma.storeSettings.findFirst()

        if (!storeSettings) {
            // Create if not exists
            storeSettings = await prisma.storeSettings.create({
                data: {
                    storeName: data.storeName || 'Warung Kelontong',
                    address: data.address,
                    phone: data.phone,
                    minStockAlert: data.minStockAlert || 5,
                },
            })
        } else {
            // Update existing
            storeSettings = await prisma.storeSettings.update({
                where: { id: storeSettings.id },
                data,
            })
        }

        return c.json(storeSettings)
    } catch (error: any) {
        return c.json({ error: error.message || 'Failed to update settings' }, 400)
    }
})

export default settings

