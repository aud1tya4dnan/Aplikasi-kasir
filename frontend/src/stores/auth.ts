import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authAPI } from '../services/api'

export const useAuthStore = defineStore('auth', () => {
    const token = ref<string | null>(localStorage.getItem('token'))
    const user = ref<any>(null)

    const isAuthenticated = computed(() => !!token.value)

    async function login(credentials: { username: string; password: string }) {
        try {
            const response = await authAPI.login(credentials)
            token.value = response.data.token
            user.value = response.data.user
            localStorage.setItem('token', response.data.token)
            return true
        } catch (error: any) {
            throw new Error(error.response?.data?.error || 'Login gagal')
        }
    }

    async function fetchUser() {
        try {
            const response = await authAPI.getMe()
            user.value = response.data
        } catch (error) {
            logout()
        }
    }

    function logout() {
        token.value = null
        user.value = null
        localStorage.removeItem('token')
    }

    return {
        token,
        user,
        isAuthenticated,
        login,
        logout,
        fetchUser,
    }
})
