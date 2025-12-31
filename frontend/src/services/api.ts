import axios from 'axios'
import { useAuthStore } from '../stores/auth'

const apiClient = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
    headers: {
        'Content-Type': 'application/json',
    },
})

// Request interceptor to add authorization token
apiClient.interceptors.request.use(
    (config) => {
        const authStore = useAuthStore()
        if (authStore.token) {
            config.headers.Authorization = `Bearer ${authStore.token}`
        }
        return config
    },
    (error) => Promise.reject(error)
)

// Response interceptor to handle errors
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Token expired or invalid
            const authStore = useAuthStore()
            authStore.logout()
            window.location.href = '/login'
        }
        return Promise.reject(error)
    }
)

export default apiClient

// API endpoints
export const authAPI = {
    login: (credentials: { username: string; password: string }) =>
        apiClient.post('/auth/login', credentials),
    getMe: () => apiClient.get('/auth/me'),
}

// Products
export const productsAPI = {
    getAll: (params?: { categoryId?: string; lowStock?: boolean; status?: string }) =>
        apiClient.get('/products', { params }),
    getById: (id: string) => apiClient.get(`/products/${id}`),
    create: (data: any) => apiClient.post('/products', data),
    update: (id: string, data: any) => apiClient.put(`/products/${id}`, data),
    delete: (id: string) => apiClient.delete(`/products/${id}`),
    toggleStatus: (id: string) => apiClient.patch(`/products/${id}/status`),
    getLowStock: () => apiClient.get('/products/alerts/low-stock'),
}

// Categories
export const categoriesAPI = {
    getAll: () => apiClient.get('/categories'),
    create: (data: any) => apiClient.post('/categories', data),
    update: (id: string, data: any) => apiClient.put(`/categories/${id}`, data),
    delete: (id: string) => apiClient.delete(`/categories/${id}`),
}

// Customers
export const customersAPI = {
    getAll: () => apiClient.get('/customers'),
    getById: (id: string) => apiClient.get(`/customers/${id}`),
    create: (data: any) => apiClient.post('/customers', data),
    update: (id: string, data: any) => apiClient.put(`/customers/${id}`, data),
    delete: (id: string) => apiClient.delete(`/customers/${id}`),
}

// Transactions
export const transactionsAPI = {
    getAll: (params?: any) => apiClient.get('/transactions', { params }),
    getById: (id: string) => apiClient.get(`/transactions/${id}`),
    create: (data: any) => apiClient.post('/transactions', data),
    getReceipt: (id: string) => apiClient.get(`/transactions/${id}/receipt`),
}

// Purchases
export const purchasesAPI = {
    getAll: (params?: any) => apiClient.get('/purchases', { params }),
    getById: (id: string) => apiClient.get(`/purchases/${id}`),
    create: (data: any) => apiClient.post('/purchases', data),
}

// Debts
export const debtsAPI = {
    getAll: (params?: any) => apiClient.get('/debts', { params }),
    getById: (id: string) => apiClient.get(`/debts/${id}`),
    addPayment: (data: any) => apiClient.post('/debts/payments', data),
    updatePayment: (id: string, data: any) => apiClient.put(`/debts/payments/${id}`, data),
    deletePayment: (id: string) => apiClient.delete(`/debts/payments/${id}`),
    getPayments: (id: string) => apiClient.get(`/debts/${id}/payments`),
    adjustDebt: (id: string, data: { newTotalDebt: number; reason?: string }) =>
        apiClient.post(`/debts/${id}/adjust`, data),
}

// Reports
export const reportsAPI = {
    getDashboard: () => apiClient.get('/reports/dashboard'),
    getSales: (params?: any) => apiClient.get('/reports/sales', { params }),
    getBestSellers: (params?: any) => apiClient.get('/reports/best-sellers', { params }),
    getPurchases: (params?: any) => apiClient.get('/reports/purchases', { params }),
}

// Settings
export const settingsAPI = {
    get: () => apiClient.get('/settings'),
    update: (data: any) => apiClient.put('/settings', data),
}
