<template>
    <div>
        <div class="flex justify-between items-center mb-8">
            <div>
                <h1>Pelanggan</h1>
                <p class="text-gray-600 mt-1">Kelola data pelanggan dan utang</p>
            </div>
            <button @click="showModal = true" class="btn btn-primary">
                <v-icon name="bi-plus" class="mr-2" />
                Tambah Pelanggan
            </button>
        </div>

        <!-- Customers List -->
        <div class="card">
            <div v-if="loading" class="text-center py-12">
                <p class="text-gray-600">Loading...</p>
            </div>

            <table v-else-if="customers.length > 0" class="w-full">
                <thead class="bg-gray-50 border-b">
                    <tr>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nama</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Telepon</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Alamat</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Utang</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Transaksi</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Aksi</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-gray-200">
                    <tr v-for="customer in customers" :key="customer.id" class="hover:bg-gray-50">
                        <td class="px-6 py-4 text-sm font-medium">{{ customer.name }}</td>
                        <td class="px-6 py-4 text-sm">{{ customer.phone || '-' }}</td>
                        <td class="px-6 py-4 text-sm">{{ customer.address || '-' }}</td>
                        <td class="px-6 py-4 text-sm">
                            <span v-if="customer.totalDebt > 0" class="badge badge-warning">
                                {{ formatCurrency(customer.totalDebt) }}
                            </span>
                            <span v-else class="text-gray-500">-</span>
                        </td>
                        <td class="px-6 py-4 text-sm">{{ customer._count?.transactions || 0 }}</td>
                        <td class="px-6 py-4 text-sm">
                            <button @click="editCustomer(customer)" class="text-blue-600 hover:text-blue-800 mr-3">
                                <v-icon name="bi-pencil" />
                            </button>
                            <button v-if="customer.totalDebt > 0" @click="showPaymentModal(customer)"
                                class="text-green-600 hover:text-green-800 mr-3" title="Bayar Utang">
                                <v-icon name="bi-cash-coin" />
                            </button>
                            <button @click="deleteCustomer(customer)" class="text-red-600 hover:text-red-800">
                                <v-icon name="bi-trash" />
                            </button>
                        </td>
                    </tr>
                </tbody>
            </table>

            <div v-else class="text-center py-12">
                <p class="text-gray-600">Belum ada pelanggan</p>
            </div>
        </div>

        <!-- Modal -->
        <div v-if="showModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div class="bg-white rounded-lg p-6 w-full max-w-md">
                <h2 class="text-xl font-bold mb-4">{{ editingCustomer ? 'Edit Pelanggan' : 'Tambah Pelanggan' }}</h2>

                <form @submit.prevent="saveCustomer" class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Nama Pelanggan *</label>
                        <input v-model="form.name" type="text" required class="input" />
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Nomor Telepon</label>
                        <input v-model="form.phone" type="tel" class="input" placeholder="08xxxxxxxxxx" />
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Alamat</label>
                        <textarea v-model="form.address" class="input" rows="3"></textarea>
                    </div>

                    <div class="flex justify-end gap-3 mt-6">
                        <button type="button" @click="closeModal" class="btn btn-secondary">Batal</button>
                        <button type="submit" class="btn btn-primary" :disabled="saving">
                            {{ saving ? 'Menyimpan...' : 'Simpan' }}
                        </button>
                    </div>
                </form>
            </div>
        </div>

        <!-- Payment Modal -->
        <div v-if="showPaymentModalFlag"
            class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div class="bg-white rounded-lg p-6 w-full max-w-md">
                <h2 class="text-xl font-bold mb-4">Bayar Utang - {{ payingCustomer?.name }}</h2>

                <div class="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded">
                    <p class="text-sm text-gray-600">Total Utang:</p>
                    <p class="text-2xl font-bold text-yellow-600">{{ formatCurrency(payingCustomer?.totalDebt) }}</p>
                </div>

                <form @submit.prevent="processPayment" class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Jumlah Bayar *</label>
                        <input v-model.number="paymentForm.amount" type="number" required min="1"
                            :max="payingCustomer?.totalDebt" class="input" />
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Metode Pembayaran</label>
                        <select v-model="paymentForm.paymentMethod" class="input">
                            <option value="cash">Tunai</option>
                            <option value="transfer">Transfer</option>
                        </select>
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Catatan</label>
                        <textarea v-model="paymentForm.notes" class="input" rows="2"></textarea>
                    </div>

                    <div class="flex justify-end gap-3 mt-6">
                        <button type="button" @click="closePaymentModal" class="btn btn-secondary">Batal</button>
                        <button type="submit" class="btn btn-success" :disabled="saving">
                            {{ saving ? 'Memproses...' : 'Bayar' }}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { customersAPI, debtsAPI } from '@/services/api'

const loading = ref(false)
const saving = ref(false)
const showModal = ref(false)
const showPaymentModalFlag = ref(false)
const editingCustomer = ref<any>(null)
const payingCustomer = ref<any>(null)
const customers = ref<any[]>([])

const form = ref({
    name: '',
    phone: '',
    address: '',
})

const paymentForm = ref({
    amount: 0,
    paymentMethod: 'cash',
    notes: '',
})

async function fetchCustomers() {
    try {
        loading.value = true
        const response = await customersAPI.getAll()
        customers.value = response.data
    } catch (error) {
        console.error('Failed to fetch customers:', error)
    } finally {
        loading.value = false
    }
}

function editCustomer(customer: any) {
    editingCustomer.value = customer
    form.value = { ...customer }
    showModal.value = true
}

async function saveCustomer() {
    try {
        saving.value = true

        if (editingCustomer.value) {
            await customersAPI.update(editingCustomer.value.id, form.value)
        } else {
            await customersAPI.create(form.value)
        }

        await fetchCustomers()
        closeModal()
    } catch (error: any) {
        alert(error.response?.data?.error || 'Gagal menyimpan pelanggan')
    } finally {
        saving.value = false
    }
}

async function deleteCustomer(customer: any) {
    if (!confirm(`Hapus pelanggan ${customer.name}?`)) return

    try {
        await customersAPI.delete(customer.id)
        await fetchCustomers()
    } catch (error: any) {
        alert(error.response?.data?.error || 'Gagal menghapus pelanggan')
    }
}

function showPaymentModal(customer: any) {
    payingCustomer.value = customer
    paymentForm.value = {
        amount: 0,
        paymentMethod: 'cash',
        notes: '',
    }
    showPaymentModalFlag.value = true
}

async function processPayment() {
    try {
        saving.value = true

        await debtsAPI.addPayment({
            customerId: payingCustomer.value.id,
            amount: paymentForm.value.amount,
            paymentMethod: paymentForm.value.paymentMethod,
            notes: paymentForm.value.notes,
        })

        await fetchCustomers()
        closePaymentModal()
        alert('Pembayaran berhasil dicatat')
    } catch (error: any) {
        alert(error.response?.data?.error || 'Gagal memproses pembayaran')
    } finally {
        saving.value = false
    }
}

function closePaymentModal() {
    showPaymentModalFlag.value = false
    payingCustomer.value = null
}

function closeModal() {
    showModal.value = false
    editingCustomer.value = null
    form.value = { name: '', phone: '', address: '' }
}

function formatCurrency(value: any) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
    }).format(Number(value))
}

onMounted(() => {
    fetchCustomers()
})
</script>
