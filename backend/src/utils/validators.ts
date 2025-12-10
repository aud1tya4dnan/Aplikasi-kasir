import { z } from 'zod'

// User validation schemas
export const loginSchema = z.object({
    username: z.string().min(3, 'Username minimal 3 karakter'),
    password: z.string().min(6, 'Password minimal 6 karakter'),
})

export const createUserSchema = z.object({
    username: z.string().min(3, 'Username minimal 3 karakter'),
    password: z.string().min(6, 'Password minimal 6 karakter'),
    name: z.string().min(1, 'Nama harus diisi'),
    role: z.enum(['kasir', 'admin']).optional(),
})

// Product validation schemas
export const createProductSchema = z.object({
    code: z.string().min(1, 'Kode produk harus diisi'),
    name: z.string().min(1, 'Nama produk harus diisi'),
    categoryId: z.string().min(1, 'Kategori harus dipilih'),
    stock: z.number().int().min(0, 'Stok tidak boleh negatif').optional(),
    minStock: z.number().int().min(0, 'Minimal stok tidak valid').optional(),
    buyPrice: z.number().positive('Harga beli harus lebih dari 0'),
    sellPrice: z.number().positive('Harga jual harus lebih dari 0'),
})

export const updateProductSchema = createProductSchema.partial()

// Category validation schemas
export const createCategorySchema = z.object({
    name: z.string().min(1, 'Nama kategori harus diisi'),
    description: z.string().optional(),
})

// Customer validation schemas
export const createCustomerSchema = z.object({
    name: z.string().min(1, 'Nama pelanggan harus diisi'),
    phone: z.string().optional(),
    address: z.string().optional(),
})

// Transaction validation schemas
export const createTransactionSchema = z.object({
    customerId: z.string().optional(),
    paymentMethod: z.enum(['cash', 'qris', 'credit'], {
        errorMap: () => ({ message: 'Metode pembayaran tidak valid' }),
    }),
    paymentAmount: z.number().optional(), // For cash
    notes: z.string().optional(),
    items: z.array(z.object({
        productId: z.string().min(1, 'Produk harus dipilih'),
        quantity: z.number().int().positive('Jumlah harus lebih dari 0'),
        pricePerUnit: z.number().positive('Harga harus lebih dari 0'),
    })).min(1, 'Minimal 1 produk harus ditambahkan'),
})

// Purchase validation schemas
export const createPurchaseSchema = z.object({
    supplier: z.string().optional(),
    notes: z.string().optional(),
    items: z.array(z.object({
        productId: z.string().min(1, 'Produk harus dipilih'),
        quantity: z.number().int().positive('Jumlah harus lebih dari 0'),
        pricePerUnit: z.number().positive('Harga harus lebih dari 0'),
    })).min(1, 'Minimal 1 produk harus ditambahkan'),
})

// Debt payment validation
export const createDebtPaymentSchema = z.object({
    debtId: z.string().min(1, 'Utang harus dipilih'),
    amount: z.number().positive('Jumlah pembayaran harus lebih dari 0'),
    paymentMethod: z.enum(['cash', 'transfer']).optional(),
    notes: z.string().optional(),
})

// Store settings validation
export const updateStoreSettingsSchema = z.object({
    storeName: z.string().min(1, 'Nama toko harus diisi').optional(),
    address: z.string().optional(),
    phone: z.string().optional(),
    minStockAlert: z.number().int().positive('Minimal stok alert harus lebih dari 0').optional(),
})

// Helper function to validate data
export function validateData<T>(schema: z.ZodSchema<T>, data: unknown): T {
    return schema.parse(data)
}

