<template>
  <div>
    <div class="mb-8">
      <h1>Dashboard</h1>
      <p class="text-gray-600 mt-1">Ringkasan bisnis hari ini</p>
    </div>

    <!-- Loading state -->
    <div v-if="loading" class="flex justify-center items-center py-12">
      <div class="text-gray-600">Loading...</div>
    </div>

    <!-- Dashboard content -->
    <div v-else>
      <!-- Stats cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div class="card">
          <div class="flex justify-between items-start">
            <div>
              <p class="text-sm text-gray-600">Pendapatan Hari Ini</p>
              <p class="text-2xl font-bold text-gray-900 mt-2">
                {{ formatCurrency(stats.todayRevenue) }}
              </p>
            </div>
            <div class="p-3 bg-green-100 rounded-lg">
              <v-icon name="bi-cash" class="text-green-600" scale="1.5" />
            </div>
          </div>
        </div>

        <div class="card">
          <div class="flex justify-between items-start">
            <div>
              <p class="text-sm text-gray-600">Laba Hari Ini</p>
              <p class="text-2xl font-bold text-gray-900 mt-2">
                {{ formatCurrency(stats.todayProfit) }}
              </p>
            </div>
            <div class="p-3 bg-blue-100 rounded-lg">
              <v-icon name="bi-graph-up" class="text-blue-600" scale="1.5" />
            </div>
          </div>
        </div>

        <div class="card">
          <div class="flex justify-between items-start">
            <div>
              <p class="text-sm text-gray-600">Transaksi Hari Ini</p>
              <p class="text-2xl font-bold text-gray-900 mt-2">
                {{ stats.todayTransactionsCount }}
              </p>
            </div>
            <div class="p-3 bg-purple-100 rounded-lg">
              <v-icon name="bi-receipt" class="text-purple-600" scale="1.5" />
            </div>
          </div>
        </div>

        <div class="card">
          <div class="flex justify-between items-start">
            <div>
              <p class="text-sm text-gray-600">Total Utang</p>
              <p class="text-2xl font-bold text-gray-900 mt-2">
                {{ formatCurrency(stats.totalUnpaidDebt) }}
              </p>
            </div>
            <div class="p-3 bg-yellow-100 rounded-lg">
              <v-icon name="bi-wallet" class="text-yellow-600" scale="1.5" />
            </div>
          </div>
        </div>
      </div>

      <!-- Alerts -->
      <div v-if="stats.lowStockCount > 0" class="card bg-orange-50 border-orange-200 mb-8">
        <div class="flex items-center gap-3">
          <v-icon name="bi-exclamation-triangle" class="text-orange-600" scale="1.5" />
          <div>
            <p class="font-medium text-orange-900">Peringatan Stok</p>
            <p class="text-sm text-orange-700 mt-1">
              {{ stats.lowStockCount }} produk memiliki stok menipis
            </p>
          </div>
          <router-link to="/products" class="ml-auto btn btn-secondary text-sm">
            Lihat Produk
          </router-link>
        </div>
      </div>

      <!-- Quick actions -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <router-link to="/cashier" class="card hover:shadow-md transition-shadow cursor-pointer">
          <div class="flex items-center gap-4">
            <div class="p-4 bg-primary-100 rounded-lg">
              <v-icon name="bi-cart" class="text-primary-600" scale="2" />
            </div>
            <div>
              <p class="font-semibold text-gray-900">Kasir</p>
              <p class="text-sm text-gray-600 mt-1">Buat transaksi baru</p>
            </div>
          </div>
        </router-link>

        <router-link to="/purchases" class="card hover:shadow-md transition-shadow cursor-pointer">
          <div class="flex items-center gap-4">
            <div class="p-4 bg-green-100 rounded-lg">
              <v-icon name="bi-truck" class="text-green-600" scale="2" />
            </div>
            <div>
              <p class="font-semibold text-gray-900">Belanja</p>
              <p class="text-sm text-gray-600 mt-1">Catat pembelian stok</p>
            </div>
          </div>
        </router-link>

        <router-link to="/reports" class="card hover:shadow-md transition-shadow cursor-pointer">
          <div class="flex items-center gap-4">
            <div class="p-4 bg-purple-100 rounded-lg">
              <v-icon name="bi-graph-up" class="text-purple-600" scale="2" />
            </div>
            <div>
              <p class="font-semibold text-gray-900">Laporan</p>
              <p class="text-sm text-gray-600 mt-1">Lihat laporan penjualan</p>
            </div>
          </div>
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { reportsAPI } from '../services/api'

const loading = ref(false)
const stats = ref({
  todayRevenue: 0,
  todayProfit: 0,
  todayTransactionsCount: 0,
  lowStockCount: 0,
  totalUnpaidDebt: 0,
})

async function fetchDashboard() {
  try {
    loading.value = true
    const response = await reportsAPI.getDashboard()
    stats.value = response.data
  } catch (error) {
    console.error('Failed to fetch dashboard:', error)
  } finally {
    loading.value = false
  }
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(value)
}

onMounted(() => {
  fetchDashboard()
})
</script>
