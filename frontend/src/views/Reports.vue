<template>
    <div>
        <div class="mb-8">
            <h1>Laporan</h1>
            <p class="text-gray-600 mt-1">Laporan penjualan dan performa toko</p>
        </div>

        <!-- Period Filter -->
        <div class="card mb-6">
            <div class="flex gap-4">
                <button v-for="p in periods" :key="p.value" @click="selectedPeriod = p.value"
                    :class="selectedPeriod === p.value ? 'btn btn-primary' : 'btn btn-secondary'">
                    {{ p.label }}
                </button>
            </div>
        </div>

        <!-- Sales Summary -->
        <div v-if="salesReport" class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div class="card">
                <p class="text-sm text-gray-600">Total Transaksi</p>
                <p class="text-3xl font-bold text-gray-900 mt-2">{{ salesReport.totalTransactions }}</p>
            </div>
            <div class="card">
                <p class="text-sm text-gray-600">Total Pendapatan</p>
                <p class="text-3xl font-bold text-green-600 mt-2">{{ formatCurrency(salesReport.totalRevenue) }}</p>
            </div>
            <div class="card">
                <p class="text-sm text-gray-600">Total Laba</p>
                <p class="text-3xl font-bold text-blue-600 mt-2">{{ formatCurrency(salesReport.totalProfit) }}</p>
            </div>
        </div>

        <!-- Payment Method Breakdown -->
        <div v-if="salesReport" class="card mb-8">
            <h2 class="text-lg font-semibold mb-4">Metode Pembayaran</h2>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div v-for="(method, key) in salesReport.byPaymentMethod" :key="key" class="border rounded-lg p-4">
                    <p class="text-sm text-gray-600 capitalize">{{ key }}</p>
                    <p class="text-xl font-bold mt-1">{{ method.count }} transaksi</p>
                    <p class="text-sm text-gray-600 mt-1">{{ formatCurrency(method.total) }}</p>
                </div>
            </div>
        </div>

        <!-- Best Sellers -->
        <div class="card">
            <h2 class="text-lg font-semibold mb-4">Produk Terlaris</h2>

            <div v-if="loadingBestSellers" class="text-center py-8">
                <p class="text-gray-600">Loading...</p>
            </div>

            <table v-else-if="bestSellers.length > 0" class="w-full">
                <thead class="bg-gray-50 border-b">
                    <tr>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Produk</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kategori</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Terjual</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pendapatan</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Transaksi</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-gray-200">
                    <tr v-for="(item, index) in bestSellers" :key="index" class="hover:bg-gray-50">
                        <td class="px-6 py-4 text-sm font-medium">{{ item.product.name }}</td>
                        <td class="px-6 py-4 text-sm">{{ item.product.category?.name }}</td>
                        <td class="px-6 py-4 text-sm">
                            <span class="badge badge-primary">{{ item.totalQuantity }} pcs</span>
                        </td>
                        <td class="px-6 py-4 text-sm font-semibold text-green-600">
                            {{ formatCurrency(item.totalRevenue) }}
                        </td>
                        <td class="px-6 py-4 text-sm">{{ item.transactionCount }}x</td>
                    </tr>
                </tbody>
            </table>

            <div v-else class="text-center py-8">
                <p class="text-gray-600">Belum ada data</p>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { reportsAPI } from '@/services/api'

const selectedPeriod = ref('daily')
const salesReport = ref<any>(null)
const bestSellers = ref<any[]>([])
const loadingBestSellers = ref(false)

const periods = [
    { value: 'daily', label: 'Hari Ini' },
    { value: 'weekly', label: 'Minggu Ini' },
    { value: 'monthly', label: 'Bulan Ini' },
]

async function fetchSalesReport() {
    try {
        const response = await reportsAPI.getSales({ period: selectedPeriod.value })
        salesReport.value = response.data
    } catch (error) {
        console.error('Failed to fetch sales report:', error)
    }
}

async function fetchBestSellers() {
    try {
        loadingBestSellers.value = true
        const response = await reportsAPI.getBestSellers({
            period: selectedPeriod.value,
            limit: 10
        })
        bestSellers.value = response.data
    } catch (error) {
        console.error('Failed to fetch best sellers:', error)
    } finally {
        loadingBestSellers.value = false
    }
}

function formatCurrency(value: any) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
    }).format(Number(value))
}

watch(selectedPeriod, () => {
    fetchSalesReport()
    fetchBestSellers()
})

onMounted(() => {
    fetchSalesReport()
    fetchBestSellers()
})
</script>
