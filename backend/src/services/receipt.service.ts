interface ReceiptData {
    storeName: string
    storeAddress?: string
    storePhone?: string
    invoiceNumber: string
    date: Date
    items: Array<{
        name: string
        quantity: number
        price: number
        subtotal: number
    }>
    totalAmount: number
    paymentMethod: string
    paymentAmount?: number
    changeAmount?: number
    customerName?: string
}

/**
 * Generate text receipt for display or print
 */
export function generateReceipt(data: ReceiptData): string {
    const {
        storeName,
        storeAddress,
        storePhone,
        invoiceNumber,
        date,
        items,
        totalAmount,
        paymentMethod,
        paymentAmount,
        changeAmount,
        customerName,
    } = data

    const separator = '='.repeat(40)
    const dash = '-'.repeat(40)

    let receipt = `${separator}\n`
    receipt += `  ${storeName.toUpperCase()}\n`
    if (storeAddress) {
        receipt += `  ${storeAddress}\n`
    }
    if (storePhone) {
        receipt += `  Telp: ${storePhone}\n`
    }
    receipt += `${separator}\n\n`

    receipt += `No. Invoice: ${invoiceNumber}\n`
    receipt += `Tanggal: ${date.toLocaleString('id-ID')}\n`
    if (customerName) {
        receipt += `Pelanggan: ${customerName}\n`
    }
    receipt += `\n${dash}\n`

    // Items
    receipt += `Item                    Qty  Harga  Total\n`
    receipt += `${dash}\n`

    items.forEach(item => {
        const itemName = item.name.substring(0, 20).padEnd(20)
        const qty = item.quantity.toString().padStart(4)
        const price = formatCurrency(item.price).padStart(8)
        const subtotal = formatCurrency(item.subtotal).padStart(10)
        receipt += `${itemName} ${qty} ${price} ${subtotal}\n`
    })

    receipt += `${dash}\n`

    // Total
    receipt += `${'TOTAL'.padEnd(36)}${formatCurrency(totalAmount).padStart(10)}\n`

    // Payment details
    if (paymentMethod === 'cash' && paymentAmount && changeAmount !== undefined) {
        receipt += `${'Bayar'.padEnd(36)}${formatCurrency(paymentAmount).padStart(10)}\n`
        receipt += `${'Kembali'.padEnd(36)}${formatCurrency(changeAmount).padStart(10)}\n`
    } else if (paymentMethod === 'qris') {
        receipt += `Pembayaran: QRIS\n`
    } else if (paymentMethod === 'credit') {
        receipt += `Pembayaran: Utang/Bayar Nanti\n`
    }

    receipt += `\n${separator}\n`
    receipt += `   Terima kasih atas kunjungan Anda!\n`
    receipt += `${separator}\n`

    return receipt
}

/**
 * Format number to Indonesian Rupiah
 */
function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
    }).format(amount).replace('Rp', 'Rp')
}

/**
 * Generate receipt data from transaction
 */
export async function prepareReceiptData(
    transaction: any,
    storeSettings: any
): Promise<ReceiptData> {
    return {
        storeName: storeSettings.storeName || 'Warung',
        storeAddress: storeSettings.address,
        storePhone: storeSettings.phone,
        invoiceNumber: transaction.invoiceNumber,
        date: transaction.createdAt,
        items: transaction.items.map((item: any) => ({
            name: item.product.name,
            quantity: item.quantity,
            price: Number(item.pricePerUnit),
            subtotal: Number(item.subtotal),
        })),
        totalAmount: Number(transaction.totalAmount),
        paymentMethod: transaction.paymentMethod,
        paymentAmount: transaction.paymentAmount ? Number(transaction.paymentAmount) : undefined,
        changeAmount: transaction.changeAmount ? Number(transaction.changeAmount) : undefined,
        customerName: transaction.customer?.name,
    }
}

