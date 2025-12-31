# QRIS Integration Documentation

## Overview
The POS application uses `@agungjsp/qris-dinamis` package to generate dynamic QRIS QR codes for payment transactions.

## QRIS Service (`backend/src/services/qris.service.ts`)

### Main Function: `generateDynamicQRIS()`

**Purpose**: Generates a dynamic QRIS QR code for a specific transaction amount.

**Parameters**:
- `amount: number` - Transaction amount in IDR

**Returns**:
```typescript
{
  qrisString: string,  // QRIS string with embedded amount
  qrisImage: string    // Base64 encoded QR code image
}
```

### How It Works:

1. **Load Static QRIS String**:
   - Reads `QRIS_STATIC_STRING` from environment variable
   - This is the merchant's base QRIS code from payment provider
   - Format: Standard QRIS EMV format

2. **Generate Dynamic QR**:
   ```typescript
   const qrisData = makeFile({
     merchantAccountInformation: QRIS_STATIC_STRING,
     transactionAmount: amount.toString(),
   })
   ```
   - `makeFile()` modifies the static QRIS to include transaction amount
   - Returns base64 QR image

3. **Return Data**:
   - `qrisString`: Modified QRIS string
   - `qrisImage`: Base64 image (`data:image/png;base64,...`)

## Usage in Transaction Flow

### 1. Transaction Creation
**File**: `backend/src/routes/transactions.ts`

```typescript
// When payment method is 'qris'
if (paymentMethod === 'qris') {
  // Generate dynamic QRIS with transaction amount
  const qrisData = await generateDynamicQRIS(totalAmount)
  
  // Store in transaction
  transaction.qrisData = qrisData.qrisImage
}
```

### 2. Frontend Display
**File**: `frontend/src/views/Cashier.vue`

```vue
<!-- Success modal shows QR if payment is QRIS -->
<div v-if="qrisData">
  <p>Scan QRIS untuk pembayaran:</p>
  <img :src="qrisData" alt="QRIS" />
</div>
```

## Configuration

### Environment Variables
**Required in `.env` or `docker-compose.yml`**:

```env
# Merchant's static QRIS string from payment provider
QRIS_STATIC_STRING="00020101021126570011ID.DANA..."

# Optional merchant info (currently in code, could be env vars)
QRIS_MERCHANT_ID="ID1234567890"
QRIS_MERCHANT_NAME="Warung Kelontong"
QRIS_MERCHANT_CITY="Jakarta"
```

### Getting Your QRIS Static String

1. **From Payment Provider** (DANA, GoPay, OVO, etc.):
   - Request merchant QRIS from your provider
   - They will give you a static QRIS string
   - Format: EMV QRIS standard (starts with `00020101...`)

2. **Extract from Existing QR**:
   - If you have existing QRIS QR code image
   - Use QR scanner to get string
   - That's your static string

## Troubleshooting

### Error: "QRIS_STATIC_STRING is not configured"
**Solution**: Set environment variable in `.env` or `docker-compose.yml`

### Error: "Failed to generate QRIS"
**Possible causes**:
1. Invalid QRIS static string format
2. Amount is 0 or negative
3. `@agungjsp/qris-dinamis` package issue

**Debug steps**:
```typescript
console.log('QRIS Static String:', QRIS_STATIC_STRING.substring(0, 20) + '...')
console.log('Transaction Amount:', amount)
```

### QR Code Not Displayed
**Check**:
1. Transaction payment method is 'qris'
2. `qrisData` is returned from API
3. Base64 image format is correct: `data:image/png;base64,...`

## Production Considerations

### 1. Security
- ✅ QRIS static string is sensitive - keep in env vars
- ✅ Never expose in frontend code
- ✅ Validate amounts before generating QR

### 2. Performance
- ⚠️ QR generation is synchronous - may block for large amounts
- ⚠️ Consider caching for same amounts (not recommended for security)

### 3. Error Handling
```typescript
try {
  const qrisData = await generateDynamicQRIS(amount)
  // Use qrisData
} catch (error) {
  // Log error
  console.error('QRIS generation failed:', error)
  // Fall back to cash/other payment
}
```

### 4. Testing
**Test scenarios**:
- ✅ Small amount (< 1000)
- ✅ Large amount (> 1,000,000)
- ✅ Decimal amounts (150.50)
- ✅ Missing QRIS_STATIC_STRING
- ✅ Invalid static string format

## Manual Debugging

### Check QRIS Generation
```bash
# In Docker
docker exec pos-backend node -e "
const qris = require('./dist/services/qris.service.js');
qris.generateDynamicQRIS(50000).then(console.log).catch(console.error);
"
```

### Verify Static String
```bash
echo $QRIS_STATIC_STRING | head -c 50
# Should output: 00020101021126570011ID...
```

### Check Dependencies
```bash
npm list @agungjsp/qris-dinamis
# Should show version installed
```

## API Reference

### POST `/api/transactions`
With `paymentMethod: 'qris'`:

**Request**:
```json
{
  "paymentMethod": "qris",
  "items": [
    { "productId": "...", "quantity": 2, "pricePerUnit": 5000 }
  ]
}
```

**Response** includes:
```json
{
  "qrisData": "data:image/png;base64,iVBORw0KGgo...",
  "invoiceNumber": "INV-2025-001"
}
```

## Common Issues in Production

### 1. QR Code Not Scannable
- Verify QRIS static string is from valid provider
- Check amount is formatted correctly (integer, no decimals if provider doesn't support)
- Ensure QR image quality (size/resolution)

### 2. Wrong Merchant Info Displayed
- Update merchant details in code or move to env vars
- Regenerate static QRIS with provider

### 3. Amount Mismatch
- Frontend sends amount in full number (no decimals for IDR)
- Backend receives as number, converts to string for QRIS
- Verify: `console.log(typeof amount, amount)`

## Future Improvements

1. **Settings UI** - Move QRIS config to database
2. **Validation** - Add QRIS string format validation
3. **Caching** - Cache QR images (with expiration)
4. **Multiple Providers** - Support different QRIS providers
5. **Callback** - Handle payment confirmation webhook
