import { PrismaClient } from '@prisma/client'
import { hash } from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
    console.log('🌱 Start seeding...')

    // Create default admin user
    const adminPassword = await hash('admin123', 10)
    const admin = await prisma.user.upsert({
        where: { username: 'admin' },
        update: {},
        create: {
            username: 'admin',
            password: adminPassword,
            name: 'Administrator',
            role: 'admin',
        },
    })
    console.log('✅ Created admin user:', admin.username)

    // Create default kasir user
    const kasirPassword = await hash('kasir123', 10)
    const kasir = await prisma.user.upsert({
        where: { username: 'kasir' },
        update: {},
        create: {
            username: 'kasir',
            password: kasirPassword,
            name: 'Kasir',
            role: 'kasir',
        },
    })
    console.log('✅ Created kasir user:', kasir.username)

    // Create default categories
    const categories = await Promise.all([
        prisma.category.upsert({
            where: { name: 'Makanan' },
            update: {},
            create: { name: 'Makanan', description: 'Produk makanan' },
        }),
        prisma.category.upsert({
            where: { name: 'Minuman' },
            update: {},
            create: { name: 'Minuman', description: 'Produk minuman' },
        }),
        prisma.category.upsert({
            where: { name: 'Kebutuhan Rumah' },
            update: {},
            create: { name: 'Kebutuhan Rumah', description: 'Kebutuhan rumah tangga' },
        }),
    ])
    console.log('✅ Created categories:', categories.length)

    // Create sample products
    const makananCategory = categories[0]
    const minumanCategory = categories[1]

    await prisma.product.createMany({
        data: [
            {
                code: 'PRD001',
                name: 'Indomie Goreng',
                categoryId: makananCategory.id,
                stock: 50,
                minStock: 10,
                buyPrice: 2500,
                sellPrice: 3000,
            },
            {
                code: 'PRD002',
                name: 'Aqua 600ml',
                categoryId: minumanCategory.id,
                stock: 30,
                minStock: 15,
                buyPrice: 3000,
                sellPrice: 4000,
            },
            {
                code: 'PRD003',
                name: 'Teh Pucuk',
                categoryId: minumanCategory.id,
                stock: 20,
                minStock: 10,
                buyPrice: 4000,
                sellPrice: 5000,
            },
        ],
        skipDuplicates: true,
    })
    console.log('✅ Created sample products')

    // Create store settings
    const storeSettings = await prisma.storeSettings.upsert({
        where: { id: '1' },
        update: {},
        create: {
            id: '1',
            storeName: 'Warung Kelontong Berkah',
            address: 'Jl. Contoh No. 123, Jakarta',
            phone: '081234567890',
            minStockAlert: 5,
        },
    })
    console.log('✅ Created store settings:', storeSettings.storeName)

    console.log('🎉 Seeding finished.')
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error('❌ Seeding failed:', e)
        await prisma.$disconnect()
        process.exit(1)
    })
