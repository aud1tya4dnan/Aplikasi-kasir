<template>
    <div>
        <div class="mb-8">
            <h1>Pengaturan</h1>
            <p class="text-gray-600 mt-1">Kelola informasi toko</p>
        </div>

        <div v-if="loading" class="card">
            <p class="text-center text-gray-600 py-8">Loading...</p>
        </div>

        <div v-else class="card max-w-2xl">
            <form @submit.prevent="saveSettings" class="space-y-6">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Nama Toko *</label>
                    <input v-model="form.storeName" type="text" required class="input" />
                </div>

                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Alamat</label>
                    <textarea v-model="form.address" class="input" rows="3"></textarea>
                </div>

                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Nomor Telepon</label>
                    <input v-model="form.phone" type="tel" class="input" placeholder="081234567890" />
                </div>

                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                        Batas Minimum Stok (untuk peringatan stok menipis)
                    </label>
                    <input v-model.number="form.minStockAlert" type="number" min="0" class="input" />
                    <p class="text-xs text-gray-500 mt-1">
                        Produk dengan stok di bawah nilai ini akan ditandai sebagai stok menipis
                    </p>
                </div>

                <div class="pt-4 border-t">
                    <button type="submit" class="btn btn-primary" :disabled="saving">
                        {{ saving ? 'Menyimpan...' : 'Simpan Pengaturan' }}
                    </button>
                </div>
            </form>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { settingsAPI } from '@/services/api'

const loading = ref(false)
const saving = ref(false)

const form = ref({
    storeName: '',
    address: '',
    phone: '',
    minStockAlert: 5,
})

async function fetchSettings() {
    try {
        loading.value = true
        const response = await settingsAPI.get()
        form.value = { ...response.data }
    } catch (error) {
        console.error('Failed to fetch settings:', error)
    } finally {
        loading.value = false
    }
}

async function saveSettings() {
    try {
        saving.value = true
        await settingsAPI.update(form.value)
        alert('Pengaturan berhasil disimpan')
    } catch (error: any) {
        alert(error.response?.data?.error || 'Gagal menyimpan pengaturan')
    } finally {
        saving.value = false
    }
}

onMounted(() => {
    fetchSettings()
})
</script>
