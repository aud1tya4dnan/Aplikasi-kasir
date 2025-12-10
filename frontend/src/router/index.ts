import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
    history: createWebHistory(),
    routes: [
        {
            path: '/login',
            name: 'Login',
            component: () => import('@/views/Login.vue'),
            meta: { requiresAuth: false },
        },
        {
            path: '/',
            component: () => import('@/layouts/MainLayout.vue'),
            meta: { requiresAuth: true },
            children: [
                {
                    path: '',
                    name: 'Dashboard',
                    component: () => import('@/views/Dashboard.vue'),
                },
                {
                    path: 'cashier',
                    name: 'Cashier',
                    component: () => import('@/views/Cashier.vue'),
                },
                {
                    path: 'products',
                    name: 'Products',
                    component: () => import('@/views/Products.vue'),
                },
                {
                    path: 'categories',
                    name: 'Categories',
                    component: () => import('@/views/Categories.vue'),
                },
                {
                    path: 'purchases',
                    name: 'Purchases',
                    component: () => import('@/views/Purchases.vue'),
                },
                {
                    path: 'customers',
                    name: 'Customers',
                    component: () => import('@/views/Customers.vue'),
                },
                {
                    path: 'reports',
                    name: 'Reports',
                    component: () => import('@/views/Reports.vue'),
                },
                {
                    path: 'settings',
                    name: 'Settings',
                    component: () => import('@/views/Settings.vue'),
                },
            ],
        },
    ],
})

router.beforeEach((to, from, next) => {
    const authStore = useAuthStore()
    const requiresAuth = to.matched.some(record => record.meta.requiresAuth !== false)

    if (requiresAuth && !authStore.isAuthenticated) {
        next('/login')
    } else if (to.path === '/login' && authStore.isAuthenticated) {
        next('/')
    } else {
        next()
    }
})

export default router
