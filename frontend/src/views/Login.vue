<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-500 to-primary-700">
    <div class="card w-full max-w-md">
      <div class="text-center mb-8">
        <h1 class="text-3xl font-bold text-gray-900">POS Kasir</h1>
        <p class="text-gray-600 mt-2">Aplikasi Kasir Warung Kelontong</p>
      </div>

      <form @submit.prevent="handleLogin" class="space-y-4">
        <div v-if="error" class="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {{ error }}
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Username</label>
          <input v-model="credentials.username" type="text" required class="input" placeholder="Masukkan username"
            :disabled="loading" />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Password</label>
          <input v-model="credentials.password" type="password" required class="input" placeholder="Masukkan password"
            :disabled="loading" />
        </div>

        <button type="submit" class="btn btn-primary w-full" :disabled="loading">
          <span v-if="loading">Loading...</span>
          <span v-else>Login</span>
        </button>
      </form>

      <div class="mt-6 p-4 bg-gray-50 rounded-lg text-xs text-gray-600">
        <p class="font-semibold mb-1">Default Credentials:</p>
        <p>Admin: admin / admin123</p>
        <p>Kasir: kasir / kasir123</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const credentials = ref({ username: '', password: '' })
const loading = ref(false)
const error = ref('')

async function handleLogin() {
  try {
    loading.value = true
    error.value = ''
    await authStore.login(credentials.value)
    router.push('/')
  } catch (err: any) {
    error.value = err.message || 'Login gagal'
  } finally {
    loading.value = false
  }
}
</script>
