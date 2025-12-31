<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Sidebar -->
    <aside class="fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-200 overflow-y-auto">
      <div class="p-6">
        <h1 class="text-xl font-bold text-primary-600">POS Kasir</h1>
        <p class="text-sm text-gray-600 mt-1">{{ user?.name }}</p>
      </div>

      <nav class="px-3 space-y-1">
        <router-link v-for="item in menuItems" :key="item.path" :to="item.path"
          class="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
          active-class="bg-primary-50 text-primary-700 font-medium">
          <v-icon :name="item.icon" scale="1.2" />
          <span>{{ item.label }}</span>
        </router-link>
      </nav>

      <div class="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
        <button @click="handleLogout" class="w-full btn btn-secondary text-sm">
          Logout
        </button>
      </div>
    </aside>

    <!-- Main content -->
    <main class="ml-64 p-8">
      <router-view />
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const user = computed(() => authStore.user)

const menuItems = [
  { path: '/', label: 'Dashboard', icon: 'bi-house-door' },
  { path: '/cashier', label: 'Kasir', icon: 'bi-cart' },
  { path: '/products', label: 'Produk', icon: 'bi-box-seam' },
  { path: '/categories', label: 'Kategori', icon: 'bi-tag' },
  { path: '/purchases', label: 'Belanja', icon: 'bi-truck' },
  { path: '/customers', label: 'Pelanggan', icon: 'bi-people' },
  { path: '/reports', label: 'Laporan', icon: 'bi-graph-up' },
  { path: '/settings', label: 'Pengaturan', icon: 'bi-gear' },
]

function handleLogout() {
  authStore.logout()
  router.push('/login')
}
</script>
