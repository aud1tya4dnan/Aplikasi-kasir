<template>
  <div>
    <h1 class="mb-6">Kasir</h1>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Products Selection -->
      <div class="lg:col-span-2">
        <div class="card">
          <div class="mb-4">
            <input v-model="searchProduct" type="text" class="input" placeholder="Cari produk..."
              @input="debouncedSearch" />
          </div>

          <div v-if="loadingProducts" class="text-center py-8">
            <p class="text-gray-600">Loading...</p>
          </div>

          <div v-else class="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[500px] overflow-y-auto">
            <button v-for="product in filteredProducts" :key="product.id" @click="addToCart(product)"
              :disabled="product.stock === 0"
              class="p-4 border rounded-lg hover:bg-blue-50 hover:border-blue-500 transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed">
              <p class="font-semibold text-sm">{{ product.name }}</p>
              <p class="text-xs text-gray-600 mt-1">{{ product.code }}</p>
              <p class="text-lg font-bold text-green-600 mt-2">{{ formatCurrency(product.sellPrice) }}</p>
              <p class="text-xs text-gray-500 mt-1">
                Stok: <span :class="product.stock <= product.minStock ? 'text-red-600' : ''">{{ product.stock }}</span>
              </p>
            </button>
          </div>
        </div>
      </div>

      <!-- Cart & Checkout -->
      <div class="lg:col-span-1">
        <div class="card sticky top-4">
          <h2 class="text-lg font-semibold mb-4 pb-3 border-b">Keranjang</h2>

          <!-- Cart Items -->
          <div v-if="cart.length === 0" class="text-center py-8 text-gray-500">
            Keranjang kosong
          </div>

          <div v-else class="space-y-3 max-h-[250px] overflow-y-auto mb-4">
            <div v-for="(item, index) in cart" :key="index" class="flex justify-between items-start border-b pb-2">
              <div class="flex-1">
                <p class="font-medium text-sm">{{ item.product.name }}</p>
                <div class="flex items-center gap-2 mt-1">
                  <button @click="decreaseQty(index)" class="w-6 h-6 rounded bg-gray-200 hover:bg-gray-300 text-sm">
                    -
                  </button>
                  <span class="text-sm font-medium">{{ item.quantity }}</span>
                  <button @click="increaseQty(index)" class="w-6 h-6 rounded bg-gray-200 hover:bg-gray-300 text-sm">
                    +
                  </button>
                </div>
              </div>
              <div class="text-right">
                <p class="font-semibold text-sm">{{ formatCurrency(item.quantity * item.pricePerUnit) }}</p>
                <button @click="removeFromCart(index)" class="text-red-600 text-xs hover:text-red-800 mt-1">
                  Hapus
                </button>
              </div>
            </div>
          </div>

          <!-- Total -->
          <div class="border-t pt-3 mb-4">
            <div class="flex justify-between items-center">
              <span class="font-semibold">Total:</span>
              <span class="text-2xl font-bold text-green-600">{{ formatCurrency(totalAmount) }}</span>
            </div>
          </div>

          <!-- Payment Method -->
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-2">Metode Pembayaran</label>
            <select v-model="paymentMethod" class="input">
              <option value="cash">Tunai</option>
              <option value="qris">QRIS</option>
              <option value="credit">Credit (Bayar Nanti)</option>
            </select>
          </div>

          <!-- Customer (for credit) -->
          <div v-if="paymentMethod === 'credit'" class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-2">Pelanggan</label>
            <select v-model="customerId" class="input" required>
              <option value="">Pilih Pelanggan</option>
              <option v-for="customer in customers" :key="customer.id" :value="customer.id">
                {{ customer.name }}
              </option>
            </select>
          </div>

          <!-- Cash Payment Amount -->
          <div v-if="paymentMethod === 'cash'" class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-2">Jumlah Bayar</label>
            <input v-model.number="paymentAmount" type="number" class="input" min="0" />
            <p v-if="paymentAmount >= totalAmount" class="text-sm text-green-600 mt-1">
              Kembalian: {{ formatCurrency(paymentAmount - totalAmount) }}
            </p>
            <p v-else-if="paymentAmount > 0" class="text-sm text-red-600 mt-1">
              Kurang: {{ formatCurrency(totalAmount - paymentAmount) }}
            </p>
          </div>

          <!-- Notes -->
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-2">Catatan (Opsional)</label>
            <textarea v-model="notes" class="input" rows="2"></textarea>
          </div>

          <!-- Action Buttons -->
          <div class="space-y-2">
            <button @click="processTransaction" :disabled="!canCheckout || processing" class="btn btn-success w-full">
              {{ processing ? 'Memproses...' : 'Proses Transaksi' }}
            </button>
            <button @click="clearCart" class="btn btn-secondary w-full">
              Kosongkan Keranjang
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Success Modal -->
    <div v-if="showSuccessModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg p-6 w-full max-w-md">
        <div class="text-center">
          <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <v-icon name="bi-check" class="text-green-600" scale="2" />
          </div>
          <h2 class="text-2xl font-bold mb-2">Transaksi Berhasil!</h2>
          <p class="text-gray-600 mb-4">No. Invoice: {{ lastInvoice }}</p>

          <div v-if="qrisData" class="mb-4">
            <p class="text-sm text-gray-600 mb-2">Scan QRIS untuk pembayaran:</p>
            <img :src="qrisData" alt="QRIS" class="mx-auto max-w-xs" />
          </div>

          <div v-if="paymentMethod === 'cash' && change > 0" class="mb-4 p-4 bg-blue-50 rounded-lg">
            <p class="text-sm text-gray-600">Kembalian:</p>
            <p class="text-3xl font-bold text-blue-600">{{ formatCurrency(change) }}</p>
          </div>

          <div class="flex gap-3">
            <button @click="printReceipt" class="btn btn-secondary flex-1">
              <v-icon name="bi-receipt" class="mr-2" />
              Cetak Struk
            </button>
            <button @click="newTransaction" class="btn btn-primary flex-1">
              Transaksi Baru
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { productsAPI, customersAPI, transactionsAPI } from '@/services/api'

const loadingProducts = ref(false)
const processing = ref(false)
const showSuccessModal = ref(false)
const searchProduct = ref('')
const products = ref<any[]>([])
const customers = ref<any[]>([])
const cart = ref<any[]>([])
const paymentMethod = ref('cash')
const paymentAmount = ref(0)
const customerId = ref('')
const notes = ref('')
const lastInvoice = ref('')
const qrisData = ref('')
const change = ref(0)

const totalAmount = computed(() => {
  return cart.value.reduce((sum, item) => sum + (item.quantity * item.pricePerUnit), 0)
})

const filteredProducts = computed(() => {
  if (!searchProduct.value) return products.value

  const query = searchProduct.value.toLowerCase()
  return products.value.filter(p =>
    p.name.toLowerCase().includes(query) ||
    p.code.toLowerCase().includes(query)
  )
})

const canCheckout = computed(() => {
  if (cart.value.length === 0) return false
  if (paymentMethod.value === 'cash' && paymentAmount.value < totalAmount.value) return false
  if (paymentMethod.value === 'credit' && !customerId.value) return false
  return true
})

async function fetchProducts() {
  try {
    loadingProducts.value = true
    const response = await productsAPI.getAll()
    products.value = response.data
  } catch (error) {
    console.error('Failed to fetch products:', error)
  } finally {
    loadingProducts.value = false
  }
}

async function fetchCustomers() {
  try {
    const response = await customersAPI.getAll()
    customers.value = response.data
  } catch (error) {
    console.error('Failed to fetch customers:', error)
  }
}

function addToCart(product: any) {
  const existing = cart.value.find(item => item.product.id === product.id)

  if (existing) {
    if (existing.quantity < product.stock) {
      existing.quantity++
    }
  } else {
    cart.value.push({
      product,
      quantity: 1,
      productId: product.id,
      pricePerUnit: Number(product.sellPrice),
    })
  }
}

function increaseQty(index: number) {
  const item = cart.value[index]
  if (item.quantity < item.product.stock) {
    item.quantity++
  }
}

function decreaseQty(index: number) {
  const item = cart.value[index]
  if (item.quantity > 1) {
    item.quantity--
  }
}

function removeFromCart(index: number) {
  cart.value.splice(index, 1)
}

function clearCart() {
  if (confirm('Kosongkan keranjang?')) {
    cart.value = []
    paymentAmount.value = 0
    customerId.value = ''
    notes.value = ''
  }
}

async function processTransaction() {
  try {
    processing.value = true

    const transactionData: any = {
      paymentMethod: paymentMethod.value,
      notes: notes.value || undefined,
      items: cart.value.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        pricePerUnit: item.pricePerUnit,
      })),
    }

    if (paymentMethod.value === 'cash') {
      transactionData.paymentAmount = paymentAmount.value
    }

    if (paymentMethod.value === 'credit') {
      transactionData.customerId = customerId.value
    }

    const response = await transactionsAPI.create(transactionData)

    lastInvoice.value = response.data.invoiceNumber
    qrisData.value = response.data.qrisData || ''
    change.value = Number(response.data.changeAmount || 0)

    showSuccessModal.value = true

  } catch (error: any) {
    alert(error.response?.data?.error || 'Gagal memproses transaksi')
  } finally {
    processing.value = false
  }
}

async function printReceipt() {
  // In real app, this would trigger print dialog or send to printer
  alert('Fungsi cetak struk akan diimplementasikan')
}

function newTransaction() {
  showSuccessModal.value = false
  cart.value = []
  paymentAmount.value = 0
  paymentMethod.value = 'cash'
  customerId.value = ''
  notes.value = ''
  lastInvoice.value = ''
  qrisData.value = ''
  change.value = 0
  fetchProducts() // Refresh stock
}

let searchTimeout: any
function debouncedSearch() {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    // Search is reactive via computed property
  }, 300)
}

function formatCurrency(value: any) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(Number(value))
}

onMounted(() => {
  fetchProducts()
  fetchCustomers()
})
</script>
