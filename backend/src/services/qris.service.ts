import QRCode from 'qrcode'
import prisma from '../lib/prisma.js'

/**
 * Calculate CRC16-CCITT checksum for QRIS
 * Polynomial: 0x1021
 */
function calculateCRC16(data: string): string {
    const polynomial = 0x1021
    let crc = 0xFFFF

    for (let i = 0; i < data.length; i++) {
        crc ^= data.charCodeAt(i) << 8
        for (let j = 0; j < 8; j++) {
            if (crc & 0x8000) {
                crc = (crc << 1) ^ polynomial
            } else {
                crc = crc << 1
            }
        }
    }

    crc = crc & 0xFFFF
    return crc.toString(16).toUpperCase().padStart(4, '0')
}

/**
 * Add or update a tag in QRIS string
 */
function setQRISTag(qrisString: string, tag: string, value: string): string {
    // Remove CRC tag (63) if present
    let qris = qrisString
    const crcIndex = qris.indexOf('6304')
    if (crcIndex !== -1) {
        qris = qris.substring(0, crcIndex)
    }

    // Find and remove existing tag if present
    const tagRegex = new RegExp(tag + '\\d{2}[^6]*')
    qris = qris.replace(tagRegex, '')

    // Add new tag with value
    const length = value.length.toString().padStart(2, '0')
    qris += tag + length + value

    // Add CRC
    const crcData = qris + '6304'
    const crc = calculateCRC16(crcData)
    qris += '6304' + crc

    return qris
}

/**
 * Generate dynamic QRIS QR code with embedded amount
 * Manually modifies QRIS string instead of using buggy library
 */
export async function generateQRIS(amount: number): Promise<string> {
    try {
        // Get QRIS static string from database
        let qrisStatic = ''

        try {
            const settings = await prisma.storeSettings.findFirst()
            qrisStatic = settings?.qrisStaticString || ''
        } catch (dbError) {
            console.warn('Failed to fetch settings from DB:', dbError)
        }

        // Fallback to environment variable
        if (!qrisStatic) {
            qrisStatic = process.env.QRIS_STATIC_STRING || ''
        }

        if (!qrisStatic) {
            throw new Error('QRIS static string not configured. Please set it in Settings page.')
        }

        console.log('Generating QRIS with amount:', amount)
        console.log('QRIS Static String length:', qrisStatic.length)

        // Modify QRIS string to embed transaction amount
        // Tag 54 = Transaction Amount
        const amountStr = amount.toFixed(2) // Format: "25000.00"
        const qrisDynamic = setQRISTag(qrisStatic, '54', amountStr)

        console.log('Modified QRIS length:', qrisDynamic.length)

        // Generate QR code as base64 data URL
        const qrDataURL = await QRCode.toDataURL(qrisDynamic, {
            errorCorrectionLevel: 'M',
            type: 'image/png',
            width: 300,
            margin: 1,
        })

        return qrDataURL
    } catch (error: any) {
        console.error('Error generating QRIS:', error)
        throw new Error(`Failed to generate QRIS code: ${error.message}`)
    }
}

/**
 * Get QRIS configuration
 */
export async function getQRISConfig() {
    let qrisStatic = ''

    try {
        const settings = await prisma.storeSettings.findFirst()
        qrisStatic = settings?.qrisStaticString || ''
    } catch (error) {
        console.warn('Failed to fetch QRIS from DB')
    }

    return {
        merchantId: process.env.QRIS_MERCHANT_ID || 'ID1234567890',
        merchantName: process.env.QRIS_MERCHANT_NAME || 'Warung Kelontong',
        merchantCity: process.env.QRIS_MERCHANT_CITY || 'Jakarta',
        staticString: qrisStatic || process.env.QRIS_STATIC_STRING || '',
    }
}
