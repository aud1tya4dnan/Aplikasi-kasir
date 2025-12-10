import { makeFile } from '@agungjsp/qris-dinamis'

interface QRISData {
    merchantId: string
    merchantName: string
    merchantCity: string
    amount: number
}

/**
 * Generate dynamic QRIS QR code with embedded amount
 * Uses makeFile to generate base64 QR image
 */
export async function generateQRIS(data: QRISData): Promise<string> {
    try {
        const { amount } = data

        // Get static QRIS string from environment
        // This should be your merchant's static QRIS code
        const qrisStatic = process.env.QRIS_STATIC_STRING || ''

        if (!qrisStatic) {
            throw new Error('QRIS_STATIC_STRING not configured in environment')
        }

        // Generate dynamic QRIS with nominal using makeFile
        const qrisDynamic = await makeFile(qrisStatic, {
            nominal: amount,
            base64: true,
        })

        return qrisDynamic as string
    } catch (error) {
        console.error('Error generating QRIS:', error)
        throw new Error('Failed to generate QRIS code')
    }
}

/**
 * Get QRIS configuration from environment
 */
export function getQRISConfig() {
    return {
        merchantId: process.env.QRIS_MERCHANT_ID || 'ID1234567890',
        merchantName: process.env.QRIS_MERCHANT_NAME || 'Warung Kelontong',
        merchantCity: process.env.QRIS_MERCHANT_CITY || 'Jakarta',
        staticString: process.env.QRIS_STATIC_STRING || '',
    }
}

