<template>
    <div>
        <div class="flex justify-between items-center mb-8">
            <div>
                <h1>Kategori Produk</h1>
                <p class="text-gray-600 mt-1">Kelola kategori untuk produk</p>
            </div>
            <button @click="showModal = true" class="btn btn-primary">
                <v-icon name="bi-plus" class="mr-2" />
                Tambah Kategori
            </button>
        </div>

        <!-- Categories List -->
        <div class="card">
            <div v-if="loading" class="text-center py-12">
                <p class="text-gray-600">Loading...</p>
            </div>

            <table v-else-if="categories.length > 0" class="w-full">
                <thead class="bg-gray-50 border-b">
                    <tr>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nama</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Deskripsi</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Jumlah Produk</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Aksi</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-gray-200">
                    <tr v-for="category in categories" :key="category.id" class="hover:bg-gray-50">
                        <td class="px-6 py-4 text-sm font-medium">{{ category.name }}</td>
                        <td class="px-6 py-4 text-sm">{{ category.description || '-' }}</td>
                        <td class="px-6 py-4 text-sm">
                            <span class="badge badge-primary">{{ category._count?.products || 0 }} produk</span>
                        </td>
                        <td class="px-6 py-4 text-sm">
                            <button @click="editCategory(category)" class="text-blue-600 hover:text-blue-800 mr-3">
                                <v-icon name="bi-pencil" />
                            </button>
                            <button @click="deleteCategory(category)" class="text-red-600 hover:text-red-800">
                                <v-icon name="bi-trash" />
                            </button>
                        </td>
                    </tr>
                </tbody>
            </table>

            <div v-else class="text-center py-12">
                <p class="text-gray-600">Belum ada kategori</p>
            </div>
        </div>

        <!-- Modal -->
        <div v-if="showModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div class="bg-white rounded-lg p-6 w-full max-w-md">
                <h2 class="text-xl font-bold mb-4">{{ editingCategory ? 'Edit Kategori' : 'Tambah Kategori' }}</h2>

                <form @submit.prevent="saveCategory" class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Icon (Emoji)</label>
                        <input v-model="form.icon" type="text" class="input" placeholder="Contoh: 🍎 📱 🛒"
                            maxlength="2" />
                        <p class="text-xs text-gray-500 mt-1">Gunakan emoji untuk icon kategori</p>
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Nama Kategori *</label>
                        <input v-model="form.name" type="text" required class="input" />
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Deskripsi</label>
                        <textarea v-model="form.description" class="input" rows="3"></textarea>
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
import { ref, onMounted } from 'vue'
import { categoriesAPI } from '@/services/api'

const loading = ref(false)
const saving = ref(false)
const showModal = ref(false)
const editingCategory = ref<any>(null)
const categories = ref<any[]>([])

const form = ref({
    icon: '',
    name: '',
    description: '',
})

async function fetchCategories() {
    try {
        loading.value = true
        const response = await categoriesAPI.getAll()
        categories.value = response.data
    } catch (error) {
        console.error('Failed to fetch categories:', error)
    } finally {
        loading.value = false
    }
}

function editCategory(category: any) {
    editingCategory.value = category
    form.value = { ...category }
    showModal.value = true
}

async function saveCategory() {
    try {
        saving.value = true

        if (editingCategory.value) {
            await categoriesAPI.update(editingCategory.value.id, form.value)
        } else {
            await categoriesAPI.create(form.value)
        }

        await fetchCategories()
        closeModal()
    } catch (error: any) {
        alert(error.response?.data?.error || 'Gagal menyimpan kategori')
    } finally {
        saving.value = false
    }
}

async function deleteCategory(category: any) {
    if (category._count?.products > 0) {
        alert(`Tidak dapat menghapus kategori ${category.name} karena masih ada ${category._count.products} produk terkait`)
        return
    }

    if (!confirm(`Hapus kategori ${category.name}?`)) return

    try {
        await categoriesAPI.delete(category.id)
        await fetchCategories()
    } catch (error: any) {
        alert(error.response?.data?.error || 'Gagal menghapus kategori')
    }
}

function closeModal() {
    showModal.value = false
    editingCategory.value = null
    form.value = { icon: '', name: '', description: '' }
}

onMounted(() => {
    fetchCategories()
})
</script>
