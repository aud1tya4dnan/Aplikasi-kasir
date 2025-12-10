<template>
    <div>
        <div class="flex justify-between items-center mb-8">
            <div>
                <h1>Belanja / Kulakan</h1>
                <p class="text-gray-600 mt-1">Catat pembelian stok dari supplier</p>
            </div>
            <button @click="showModal = true" class="btn btn-primary">
                <v-icon name="bi-plus" class="mr-2" />
                Tambah Belanja
            </button>
        </div>

        <!-- Purchase List -->
        <div class="card">
            <div v-if="loading" class="text-center py-12">
                <p class="text-gray-600">Loading...</p>
            </div>

            <div v-else-if="purchases.length === 0" class="text-center py-12">
                <p class="text-gray-600">Belum ada data belanja</p>
            </div>

            <div v-else class="space-y-4">
                <div v-for="purchase in purchases" :key="purchase.id" class="border rounded-lg p-4 hover:bg-gray-50">
                    <div class="flex justify-between items-start mb-3">
                        <div>
                            <p class="font-semibold text-lg">{{ purchase.purchaseNumber }}</p>
                            <p class="text-sm text-gray-600">{{ purchase.supplier }}</p>
                            <p class="text-xs text-gray-500 mt-1">
                                {{ new Date(purchase.createdAt).toLocaleString('id-ID') }}
                            </p>
                        </div>
                        <div class="text-right">
                            <p class="text-sm text-gray-600">Total</p>
                            <p class="text-xl font-bold text-green-600">{{ formatCurrency(purchase.totalAmount) }}</p>
                        </div>
                    </div>

                    <!-- Items -->
                    <div class="border-t pt-3 mt-3">
                        <p class="text-sm font-medium mb-2">Item:</p>
                        <div class="space-y-1">
                            <div v-for="item in purchase.items" :key="item.id" class="flex justify-between text-sm">
                                <span>{{ item.product.name }} ({{ item.quantity }} pcs)</span>
                                <span class="font-medium">{{ formatCurrency(item.subtotal) }}</span>
                            </div>
                        </div>
                    </div>

                    <p v-if="purchase.notes" class="text-sm text-gray-600 mt-3 italic">
                        Catatan: {{ purchase.notes }}
                    </p>
                </div>
            </div>
        </div>

        <!-- Modal -->
        <div v-if="showModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div class="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <h2 class="text-xl font-bold mb-4">Tambah Belanja</h2>

                <form @submit.prevent="savePurchase" class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Nama Supplier</label>
                        <input v-model="form.supplier" type="text" required class="input"
                            placeholder="Toko Grosir XYZ" />
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Catatan</label>
                        <textarea v-model="form.notes" class="input" rows="2" placeholder="Optional"></textarea>
                    </div>

                    <!-- Items -->
                    <div class="border-t pt-4">
                        <div class="flex justify-between items-center mb-3">
                            <label class="block text-sm font-medium text-gray-700">Item Belanja</label>
                            <button type="button" @click="addItem" class="text-sm text-blue-600 hover:text-blue-800">
                                + Tambah Item
                            </button>
                        </div>

                        <div v-for="(item, index) in form.items" :key="index" class="grid grid-cols-12 gap-2 mb-2">
                            <div class="col-span-5">
                                <select v-model="item.productId" required class="input text-sm">
                                    <option value="">Pilih Produk</option>
                                    <option v-for="product in products" :key="product.id" :value="product.id">
                                        {{ product.name }}
                                    </option>
                                </select>
                            </div>
                            <div class="col-span-2">
                                <input v-model.number="item.quantity" type="number" required min="1"
                                    class="input text-sm" placeholder="Qty" />
                            </div>
                            <div class="col-span-3">
                                <input v-model.number="item.pricePerUnit" type="number" required min="0"
                                    class="input text-sm" placeholder="Harga" />
                            </div>
                            <div class="col-span-2 flex items-center justify-between">
                                <span class="text-xs font-medium">{{ formatCurrency(item.quantity * item.pricePerUnit)
                                    }}</span>
                                <button type="button" @click="removeItem(index)"
                                    class="text-red-600 hover:text-red-800">
                                    <v-icon name="bi-x" scale="1.2" />
                                </button>
                            </div>
                        </div>

                        <div v-if="form.items.length === 0" class="text-center py-4 text-gray-500 text-sm">
                            Belum ada item
                        </div>
                    </div>

                    <!-- Total -->
                    <div class="border-t pt-4">
                        <div class="flex justify-between items-center">
                            <span class="font-semibold">Total Belanja:</span>
                            <span class="text-2xl font-bold text-green-600">{{ formatCurrency(totalAmount) }}</span>
                        </div>
                    </div>

                    <div class="flex justify-end gap-3 mt-6">
                        <button type="button" @click="closeModal" class="btn btn-secondary">Batal</button>
                        <button type="submit" class="btn btn-primary" :disabled="saving || form.items.length === 0">
                            {{ saving ? 'Menyimpan...' : 'Simpan' }}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { purchasesAPI, productsAPI } from '@/services/api'

const loading = ref(false)
const saving = ref(false)
const showModal = ref(false)
const purchases = ref<any[]>([])
const products = ref<any[]>([])

const form = ref({
    supplier: '',
    notes: '',
    items: [] as any[],
})

const totalAmount = computed(() => {
    return form.value.items.reduce((sum, item) => sum + (item.quantity * item.pricePerUnit), 0)
})

async function fetchPurchases() {
    try {
        loading.value = true
        const response = await purchasesAPI.getAll()
        purchases.value = response.data
    } catch (error) {
        console.error('Failed to fetch purchases:', error)
    } finally {
        loading.value = false
    }
}

async function fetchProducts() {
    try {
        const response = await productsAPI.getAll()
        products.value = response.data
    } catch (error) {
        console.error('Failed to fetch products:', error)
    }
}

function addItem() {
    form.value.items.push({
        productId: '',
        quantity: 1,
        pricePerUnit: 0,
    })
}

function removeItem(index: number) {
    form.value.items.splice(index, 1)
}

async function savePurchase() {
    try {
        saving.value = true
        await purchasesAPI.create(form.value)
        await fetchPurchases()
        closeModal()
    } catch (error: any) {
        alert(error.response?.data?.error || 'Gagal menyimpan belanja')
    } finally {
        saving.value = false
    }
}

function closeModal() {
    showModal.value = false
    form.value = {
        supplier: '',
        notes: '',
        items: [],
    }
}

function formatCurrency(value: any) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
    }).format(Number(value))
}

onMounted(() => {
    fetchPurchases()
    fetchProducts()
})
</script>
