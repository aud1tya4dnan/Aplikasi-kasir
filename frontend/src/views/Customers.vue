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
                            <button v-if="customer.totalDebt > 0" @click="showDebtDetails(customer)"
                                class="text-purple-600 hover:text-purple-800 mr-3" title="Lihat Detail Utang">
                                <v-icon name="bi-list-ul" />
                            </button>
                            <button v-if="customer.totalDebt > 0" @click="showPaymentModal(customer)"
                                class="text-green-600 hover:text-green-800 mr-3" title="Bayar Utang">
                                <v-icon name="bi-cash-coin" />
                            </button>
                            <button @click="deleteCustomer(customer)" class="text-red-600 hover:text-red-800">
                                <v-icon name="bi-trash" class="mr-1" />
                                Hapus
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
                        <label class="block text-sm font-medium text-gray-700 mb-2">Nama *</label>
                        <input v-model="form.name" type="text" required class="input" />
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Telepon</label>
                        <input v-model="form.phone" type="tel" class="input" />
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Alamat</label>
                        <textarea v-model="form.address" class="input" rows="3"></textarea>
                    </div>

                    <!-- Debt Adjustment Section -->
                    <div v-if="editingCustomer && editingCustomer.totalDebt > 0" class="pt-4 border-t">
                        <h4 class="text-sm font-semibold text-gray-700 mb-3">Adjustasi Utang (Opsional)</h4>

                        <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-3">
                            <p class="text-xs text-yellow-800">
                                ⚠️ <strong>Perhatian:</strong> Mengubah total utang akan menimpa perhitungan otomatis.
                                Gunakan fitur ini hanya untuk koreksi manual atau penghapusan utang.
                            </p>
                        </div>

                        <div class="flex items-end gap-3">
                            <div class="flex-1">
                                <label class="block text-sm font-medium text-gray-700 mb-2">
                                    Total Utang Baru
                                </label>
                                <CurrencyInput v-model="debtAdjustment.newTotal" :show-prefix="true"
                                    placeholder="Biarkan kosong jika tidak ingin mengubah" />
                                <p class="text-xs text-gray-500 mt-1">
                                    Utang saat ini: {{ formatCurrency(editingCustomer.totalDebt) }}
                                </p>
                            </div>
                        </div>

                        <div class="mt-3">
                            <label class="block text-sm font-medium text-gray-700 mb-2">
                                Alasan Adjustasi (Opsional)
                            </label>
                            <textarea v-model="debtAdjustment.reason" class="input" rows="2"
                                placeholder="Contoh: Penghapusan utang, Koreksi pencatatan, dll"></textarea>
                        </div>
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
                        <CurrencyInput v-model="paymentForm.amount" :show-prefix="true" required />
                        <p class="text-xs text-gray-500 mt-1">Sisa utang: {{ formatCurrency(payingCustomer?.totalDebt ||
                            0) }}</p>
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

        <!-- Debt Details Modal -->
        <div v-if="showDebtDetailsModal"
            class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
            <div class="bg-white rounded-lg p-6 w-full max-w-3xl m-4">
                <h2 class="text-xl font-bold mb-4">Detail Utang - {{ selectedCustomer?.name }}</h2>

                <!-- Debt Summary -->
                <div class="grid grid-cols-3 gap-4 mb-6">
                    <div class="bg-red-50 p-4 rounded-lg border border-red-200">
                        <p class="text-sm text-gray-600">Total Utang</p>
                        <p class="text-2xl font-bold text-red-600">{{ formatCurrency(debtDetails?.totalDebt || 0) }}</p>
                    </div>
                    <div class="bg-green-50 p-4 rounded-lg border border-green-200">
                        <p class="text-sm text-gray-600">Sudah Dibayar</p>
                        <p class="text-2xl font-bold text-green-600">{{ formatCurrency(debtDetails?.paidAmount || 0) }}
                        </p>
                    </div>
                    <div class="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                        <p class="text-sm text-gray-600">Sisa Utang</p>
                        <p class="text-2xl font-bold text-yellow-600">{{ formatCurrency(debtDetails?.remainingDebt || 0)
                            }}</p>
                    </div>
                </div>

                <!-- Payment History -->
                <div class="mb-4">
                    <h3 class="font-semibold mb-3">Riwayat Pembayaran</h3>
                    <div v-if="payments.length === 0" class="text-center py-8 text-gray-500">
                        Belum ada pembayaran
                    </div>
                    <table v-else class="w-full">
                        <thead class="bg-gray-50 border-b">
                            <tr>
                                <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Tanggal</th>
                                <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Jumlah</th>
                                <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Metode</th>
                                <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Catatan</th>
                                <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Aksi</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y">
                            <tr v-for="payment in payments" :key="payment.id" class="hover:bg-gray-50">
                                <td class="px-4 py-3 text-sm">{{ formatDateTime(payment.createdAt) }}</td>
                                <td class="px-4 py-3 text-sm font-semibold text-green-600">{{
                                    formatCurrency(payment.amount) }}</td>
                                <td class="px-4 py-3 text-sm">
                                    <span class="badge badge-primary">{{ payment.paymentMethod === 'cash' ? 'Tunai' :
                                        'Transfer' }}</span>
                                </td>
                                <td class="px-4 py-3 text-sm text-gray-600">{{ payment.notes || '-' }}</td>
                                <td class="px-4 py-3 text-sm">
                                    <button @click="editPayment(payment)"
                                        class="text-blue-600 hover:text-blue-800 mr-2">
                                        <v-icon name="bi-pencil" scale="0.9" />
                                    </button>
                                    <button @click="deletePayment(payment)" class="text-red-600 hover:text-red-800">
                                        <v-icon name="bi-trash" scale="0.9" />
                                    </button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div class="flex justify-end gap-3">
                    <button @click="closeDebtDetails" class="btn btn-secondary">Tutup</button>
                    <button @click="showPaymentModalFromDetails" class="btn btn-success">
                        <v-icon name="bi-plus" class="mr-1" />
                        Tambah Pembayaran
                    </button>
                </div>
            </div>
        </div>

        <!-- Edit Payment Modal -->
        <div v-if="showEditPaymentModal"
            class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div class="bg-white rounded-lg p-6 w-full max-w-md">
                <h2 class="text-xl font-bold mb-4">Edit Pembayaran</h2>

                <form @submit.prevent="updatePayment" class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Jumlah Bayar *</label>
                        <CurrencyInput v-model="editPaymentForm.amount" :show-prefix="true" required />
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Metode Pembayaran</label>
                        <select v-model="editPaymentForm.paymentMethod" class="input">
                            <option value="cash">Tunai</option>
                            <option value="transfer">Transfer</option>
                        </select>
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Catatan</label>
                        <textarea v-model="editPaymentForm.notes" class="input" rows="2"></textarea>
                    </div>

                    <div class="flex justify-end gap-3 mt-6">
                        <button type="button" @click="closeEditPayment" class="btn btn-secondary">Batal</button>
                        <button type="submit" class="btn btn-primary" :disabled="saving">
                            {{ saving ? 'Menyimpan...' : 'Simpan' }}
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
import CurrencyInput from '@/components/CurrencyInput.vue'

const loading = ref(false)
const saving = ref(false)
const showModal = ref(false)
const showPaymentModalFlag = ref(false)
const showDebtDetailsModal = ref(false)
const showEditPaymentModal = ref(false)
const editingCustomer = ref<any>(null)
const payingCustomer = ref<any>(null)
const selectedCustomer = ref<any>(null)
const customers = ref<any[]>([])
const debtDetails = ref<any>(null)
const payments = ref<any[]>([])
const editingPayment = ref<any>(null)

const form = ref({
    name: '',
    email: '',
    phone: '',
    address: '',
})

const debtAdjustment = ref({
    newTotal: 0,
    reason: '',
})

const paymentForm = ref({
    amount: 0,
    paymentMethod: 'cash',
    notes: '',
})

const editPaymentForm = ref({
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
    // Reset debt adjustment form when opening for edit
    debtAdjustment.value = { newTotal: 0, reason: '' }
    showModal.value = true
}

async function saveCustomer() {
    try {
        saving.value = true

        if (editingCustomer.value) {
            await customersAPI.update(editingCustomer.value.id, form.value)

            // If debt adjustment is provided, apply it
            if (debtAdjustment.value.newTotal > 0 && debtAdjustment.value.newTotal !== editingCustomer.value.totalDebt) {
                // Find the debt record for this customer
                const debtsResponse = await debtsAPI.getAll({ customerId: editingCustomer.value.id })
                if (debtsResponse.data.length > 0) {
                    const debtId = debtsResponse.data[0].id
                    await debtsAPI.adjustDebt(debtId, {
                        newTotalDebt: debtAdjustment.value.newTotal,
                        reason: debtAdjustment.value.reason || 'Manual adjustment from edit customer',
                    })
                    alert('Utang berhasil disesuaikan')
                }
            }
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

async function showDebtDetails(customer: any) {
    try {
        selectedCustomer.value = customer
        loading.value = true

        // Get all debts for this customer
        const debtsResponse = await debtsAPI.getAll({ customerId: customer.id, status: 'partial' })

        if (debtsResponse.data.length > 0) {
            debtDetails.value = debtsResponse.data[0]
            payments.value = debtDetails.value.payments || []
        } else {
            // Try to get paid debts too
            const allDebtsResponse = await debtsAPI.getAll({ customerId: customer.id })
            if (allDebtsResponse.data.length > 0) {
                debtDetails.value = allDebtsResponse.data[0]
                payments.value = debtDetails.value.payments || []
            }
        }

        showDebtDetailsModal.value = true
    } catch (error: any) {
        console.error('Failed to fetch debt details:', error)
        alert('Gagal memuat detail utang')
    } finally {
        loading.value = false
    }
}

function closeDebtDetails() {
    showDebtDetailsModal.value = false
    selectedCustomer.value = null
    debtDetails.value = null
    payments.value = []
}

function showPaymentModalFromDetails() {
    payingCustomer.value = selectedCustomer.value
    paymentForm.value = {
        amount: 0,
        paymentMethod: 'cash',
        notes: '',
    }
    showPaymentModalFlag.value = true
    showDebtDetailsModal.value = false
}

function editPayment(payment: any) {
    editingPayment.value = payment
    editPaymentForm.value = {
        amount: Number(payment.amount),
        paymentMethod: payment.paymentMethod,
        notes: payment.notes || '',
    }
    showEditPaymentModal.value = true
}

async function updatePayment() {
    try {
        saving.value = true

        await debtsAPI.updatePayment(editingPayment.value.id, editPaymentForm.value)

        // Refresh data
        await showDebtDetails(selectedCustomer.value)
        await fetchCustomers()

        closeEditPayment()
        alert('Pembayaran berhasil diperbarui')
    } catch (error: any) {
        alert(error.response?.data?.error || 'Gagal memperbarui pembayaran')
    } finally {
        saving.value = false
    }
}

function closeEditPayment() {
    showEditPaymentModal.value = false
    editingPayment.value = null
}

async function deletePayment(payment: any) {
    if (!confirm('Hapus pembayaran ini?')) return

    try {
        await debtsAPI.deletePayment(payment.id)

        // Refresh data
        await showDebtDetails(selectedCustomer.value)
        await fetchCustomers()

        alert('Pembayaran berhasil dihapus')
    } catch (error: any) {
        alert(error.response?.data?.error || 'Gagal menghapus pembayaran')
    }
}

function closeModal() {
    showModal.value = false
    editingCustomer.value = null
    form.value = { name: '', email: '', phone: '', address: '' }
    debtAdjustment.value = { newTotal: 0, reason: '' }
}

function formatCurrency(value: any) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
    }).format(Number(value))
}

function formatDateTime(dateString: string) {
    const date = new Date(dateString)
    return date.toLocaleString('id-ID', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
    })
}

onMounted(() => {
    fetchCustomers()
})
</script>
