<template>
  <div ref="receiptRef" class="receipt-container">
    <div class="receipt">
      <!-- Store Header -->
      <div class="store-header">
        <h1>{{ receipt.storeName }}</h1>
        <p v-if="receipt.storeAddress">{{ receipt.storeAddress }}</p>
        <p v-if="receipt.storePhone">Telp: {{ receipt.storePhone }}</p>
      </div>

      <div class="divider"></div>

      <!-- Transaction Info -->
      <div class="transaction-info">
        <div class="info-row">
          <span>No. Invoice:</span>
          <span>{{ receipt.invoiceNumber }}</span>
        </div>
        <div class="info-row">
          <span>Tanggal:</span>
          <span>{{ formatDate(receipt.date) }}</span>
        </div>
        <div v-if="receipt.customerName" class="info-row">
          <span>Pelanggan:</span>
          <span>{{ receipt.customerName }}</span>
        </div>
      </div>

      <div class="divider"></div>

      <!-- Items -->
      <table class="items-table">
        <thead>
          <tr>
            <th>Item</th>
            <th>Qty</th>
            <th>Harga</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, index) in receipt.items" :key="index">
            <td>{{ item.name }}</td>
            <td class="text-center">{{ item.quantity }}</td>
            <td class="text-right">{{ formatCurrency(item.price) }}</td>
            <td class="text-right">{{ formatCurrency(item.subtotal) }}</td>
          </tr>
        </tbody>
      </table>

      <div class="divider"></div>

      <!-- Total -->
      <div class="total-section">
        <div class="total-row">
          <span class="total-label">TOTAL:</span>
          <span class="total-amount">{{ formatCurrency(receipt.totalAmount) }}</span>
        </div>

        <!-- Cash Payment Details -->
        <div v-if="receipt.paymentMethod === 'cash' && receipt.paymentAmount">
          <div class="payment-row">
            <span>Bayar:</span>
            <span>{{ formatCurrency(receipt.paymentAmount) }}</span>
          </div>
          <div v-if="receipt.changeAmount !== undefined" class="payment-row">
            <span>Kembali:</span>
            <span>{{ formatCurrency(receipt.changeAmount) }}</span>
          </div>
        </div>

        <!-- Other Payment Methods -->
        <div v-else class="payment-method">
          <span v-if="receipt.paymentMethod === 'qris'">Pembayaran: QRIS</span>
          <span v-else-if="receipt.paymentMethod === 'credit'">Pembayaran: Utang/Bayar Nanti</span>
        </div>
      </div>

      <div class="divider"></div>

      <!-- Footer -->
      <div class="footer">
        <p>Terima kasih atas kunjungan Anda!</p>
        <p class="small-text">{{ formatDate(new Date()) }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

interface ReceiptItem {
  name: string
  quantity: number
  price: number
  subtotal: number
}

interface Receipt {
  storeName: string
  storeAddress?: string
  storePhone?: string
  invoiceNumber: string
  date: Date | string
  items: ReceiptItem[]
  totalAmount: number
  paymentMethod: string
  paymentAmount?: number
  changeAmount?: number
  customerName?: string
}

const props = defineProps<{
  receipt: Receipt
}>()

const receiptRef = ref<HTMLElement>()

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(value)
}

function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleString('id-ID', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function print() {
  window.print()
}

defineExpose({ print })
</script>

<style scoped>
.receipt-container {
  max-width: 58mm;
  margin: 0 auto;
  padding: 10px;
  font-family: 'Courier New', monospace;
  background: white;
}

.receipt {
  font-size: 12px;
  line-height: 1.4;
}

.store-header {
  text-align: center;
  margin-bottom: 10px;
}

.store-header h1 {
  font-size: 18px;
  font-weight: bold;
  margin: 0 0 5px 0;
  text-transform: uppercase;
}

.store-header p {
  margin: 2px 0;
  font-size: 11px;
}

.divider {
  border-top: 1px dashed #000;
  margin: 8px 0;
}

.transaction-info {
  margin-bottom: 8px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  margin: 3px 0;
  font-size: 11px;
}

.items-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 10px;
}

.items-table th {
  text-align: left;
  border-bottom: 1px solid #000;
  padding: 3px 0;
  font-weight: bold;
}

.items-table td {
  padding: 3px 0;
}

.text-center {
  text-align: center;
}

.text-right {
  text-align: right;
}

.total-section {
  margin-top: 8px;
}

.total-row {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
  font-weight: bold;
  margin-bottom: 5px;
}

.total-label {
  font-size: 14px;
}

.total-amount {
  font-size: 16px;
}

.payment-row {
  display: flex;
  justify-content: space-between;
  margin: 3px 0;
  font-size: 12px;
}

.payment-method {
  text-align: center;
  margin: 5px 0;
  font-size: 11px;
}

.footer {
  text-align: center;
  margin-top: 10px;
}

.footer p {
  margin: 3px 0;
  font-size: 11px;
}

.small-text {
  font-size: 9px;
  color: #666;
}

/* Print Styles */
@media print {
  .receipt-container {
    max-width: 58mm;
    padding: 0;
    margin: 0;
  }

  .receipt {
    font-size: 10px;
  }

  .store-header h1 {
    font-size: 16px;
  }

  .divider {
    border-top: 1px dashed #000;
  }

  /* Hide everything except receipt when printing */
  body * {
    visibility: hidden;
  }

  .receipt-container,
  .receipt-container * {
    visibility: visible;
  }

  .receipt-container {
    position: absolute;
    left: 0;
    top: 0;
  }
}
</style>
