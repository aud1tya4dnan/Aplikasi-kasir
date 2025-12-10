<template>
  <div>
    <div class="flex justify-between items-center mb-8">
      <div>
        <h1>Produk</h1>
        <p class="text-gray-600 mt-1">Kelola produk dan stok</p>
      </div>
      <button @click="showModal = true" class="btn btn-primary">
        <v-icon name="bi-plus" class="mr-2" />
        Tambah Produk
      </button>
    </div>

    <!-- Filters -->
    <div class="card mb-6">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Kategori</label>
          <select v-model="selectedCategory" class="input">
            <option value="">Semua Kategori</option>
            <option v-for="cat in categories" :key="cat.id" :value="cat.id">
              {{ cat.name }}
            </option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Status</label>
          <select v-model="statusFilter" class="input">
            <option value="ACTIVE">Aktif</option>
            <option value="INACTIVE">Arsip</option>
            <option value="ALL">Semua</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Pencarian</label>
          <input v-model="searchQuery" type="text" class="input" placeholder="Cari produk..." />
        </div>
        <div class="flex items-end">
          <label class="flex items-center">
            <input v-model="showLowStock" type="checkbox" class="mr-2" />
            <span class="text-sm">Stok Menipis Saja</span>
          </label>
        </div>
      </div>
    </div>

    <!-- Products Table -->
    <div class="card">
      <div v-if="loading" class="text-center py-12">
        <p class="text-gray-600">Loading...</p>
      </div>

      <div v-else-if="filteredProducts.length === 0" class="text-center py-12">
        <p class="text-gray-600">Tidak ada produk</p>
      </div>

      <table v-else class="w-full">
        <thead class="bg-gray-50 border-b">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kode</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nama</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kategori</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stok</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Harga Beli</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Harga Jual</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Aksi</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200">
          <tr v-for="product in filteredProducts" :key="product.id" class="hover:bg-gray-50">
            <td class="px-6 py-4 text-sm">{{ product.code }}</td>
            <td class="px-6 py-4 text-sm font-medium">{{ product.name }}</td>
            <td class="px-6 py-4 text-sm">{{ product.category?.name }}</td>
            <td class="px-6 py-4 text-sm">
              <span :class="product.status === 'ACTIVE' ? 'badge badge-success' : 'badge badge-secondary'">
                {{ product.status === 'ACTIVE' ? 'Aktif' : 'Arsip' }}
              </span>
            </td>
            <td class="px-6 py-4 text-sm">
              <span :class="product.stock <= product.minStock ? 'badge badge-danger' : 'badge badge-success'">
                {{ product.stock }}
              </span>
            </td>
            <td class="px-6 py-4 text-sm">{{ formatCurrency(product.buyPrice) }}</td>
            <td class="px-6 py-4 text-sm font-semibold text-green-600">{{ formatCurrency(product.sellPrice) }}</td>
            <td class="px-6 py-4 text-sm">
              <button @click="editProduct(product)" class="text-blue-600 hover:text-blue-800 mr-3">
                <v-icon name="bi-pencil" />
              </button>
              <button @click="toggleProductStatus(product)"
                :class="product.status === 'ACTIVE' ? 'text-orange-600 hover:text-orange-800' : 'text-green-600 hover:text-green-800'"
                :title="product.status === 'ACTIVE' ? 'Arsipkan' : 'Aktifkan'">
                <v-icon :name="product.status === 'ACTIVE' ? 'bi-archive' : 'bi-arrow-counterclockwise'" />
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modal -->
    <div v-if="showModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 class="text-xl font-bold mb-4">{{ editingProduct ? 'Edit Produk' : 'Tambah Produk' }}</h2>

        <form @submit.prevent="saveProduct" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Kode Produk</label>
            <input v-model="form.code" type="text" required class="input" :disabled="!!editingProduct" />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Nama Produk</label>
            <input v-model="form.name" type="text" required class="input" />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Kategori</label>
            <select v-model="form.categoryId" required class="input">
              <option value="">Pilih Kategori</option>
              <option v-for="cat in categories" :key="cat.id" :value="cat.id">
                {{ cat.name }}
              </option>
            </select>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Stok</label>
              <input v-model.number="form.stock" type="number" required min="0" class="input" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Min. Stok</label>
              <input v-model.number="form.minStock" type="number" required min="0" class="input" />
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Harga Beli</label>
              <input v-model.number="form.buyPrice" type="number" required min="0" class="input" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Harga Jual</label>
              <input v-model.number="form.sellPrice" type="number" required min="0" class="input" />
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
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { productsAPI, categoriesAPI } from '@/services/api'

const loading = ref(false)
const saving = ref(false)
const showModal = ref(false)
const editingProduct = ref<any>(null)
const products = ref<any[]>([])
const categories = ref<any[]>([])
const selectedCategory = ref('')
const searchQuery = ref('')
const showLowStock = ref(false)
const statusFilter = ref('ACTIVE')

const form = ref({
  code: '',
  name: '',
  categoryId: '',
  stock: 0,
  minStock: 5,
  buyPrice: 0,
  sellPrice: 0,
})

const filteredProducts = computed(() => {
  let filtered = products.value

  if (selectedCategory.value) {
    filtered = filtered.filter(p => p.categoryId === selectedCategory.value)
  }

  if (statusFilter.value !== 'ALL') {
    filtered = filtered.filter(p => p.status === statusFilter.value)
  }

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(p =>
      p.name.toLowerCase().includes(query) ||
      p.code.toLowerCase().includes(query)
    )
  }

  if (showLowStock.value) {
    filtered = filtered.filter(p => p.stock <= p.minStock)
  }

  return filtered
})

async function fetchProducts() {
  try {
    loading.value = true
    // Fetch both active and inactive for full list
    const response = await productsAPI.getAll({ status: 'ALL' })
    products.value = response.data
  } catch (error) {
    console.error('Failed to fetch products:', error)
  } finally {
    loading.value = false
  }
}

async function fetchCategories() {
  try {
    const response = await categoriesAPI.getAll()
    categories.value = response.data
  } catch (error) {
    console.error('Failed to fetch categories:', error)
  }
}

function editProduct(product: any) {
  editingProduct.value = product
  form.value = { ...product, categoryId: product.categoryId }
  showModal.value = true
}

async function saveProduct() {
  try {
    saving.value = true

    if (editingProduct.value) {
      await productsAPI.update(editingProduct.value.id, form.value)
    } else {
      await productsAPI.create(form.value)
    }

    await fetchProducts()
    closeModal()
  } catch (error: any) {
    alert(error.response?.data?.error || 'Gagal menyimpan produk')
  } finally {
    saving.value = false
  }
}

async function toggleProductStatus(product: any) {
  const action = product.status === 'ACTIVE' ? 'arsipkan' : 'aktifkan'
  if (!confirm(`${action.charAt(0).toUpperCase() + action.slice(1)} produk ${product.name}?`)) return

  try {
    await productsAPI.toggleStatus(product.id)
    await fetchProducts()
  } catch (error: any) {
    alert(error.response?.data?.error || `Gagal ${action} produk`)
  }
}

function closeModal() {
  showModal.value = false
  editingProduct.value = null
  form.value = {
    code: '',
    name: '',
    categoryId: '',
    stock: 0,
    minStock: 5,
    buyPrice: 0,
    sellPrice: 0,
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
  fetchProducts()
  fetchCategories()
})
</script>
