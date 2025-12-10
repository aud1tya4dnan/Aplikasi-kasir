# API Documentation - POS Application

Base URL: `http://localhost:3000/api`

## Table of Contents
1. [Authentication](#authentication)
2. [Products](#products)
3. [Categories](#categories)
4. [Customers](#customers)
5. [Transactions](#transactions)
6. [Purchases](#purchases)
7. [Debts](#debts)
8. [Reports](#reports)
9. [Settings](#settings)

---

## Authentication

### Login
**POST** `/auth/login`

Authenticate user and get JWT token.

**Request Body:**
```json
{
  "username": "admin",
  "password": "admin123"
}
```

**Response (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "clx123...",
    "username": "admin",
    "name": "Administrator",
    "role": "admin"
  }
}
```

**Error (401):**
```json
{
  "error": "Username atau password salah"
}
```

---

### Get Current User
**GET** `/auth/me`

Get current authenticated user info.

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "id": "clx123...",
  "username": "admin",
  "name": "Administrator",
  "role": "admin",
  "createdAt": "2025-12-04T10:00:00.000Z"
}
```

---

### Register New User (Admin Only)
**POST** `/auth/register`

Create new user. Only accessible by admin role.

**Headers:**
```
Authorization: Bearer {admin-token}
```

**Request Body:**
```json
{
  "username": "kasir2",
  "password": "kasir123",
  "name": "Kasir Dua",
  "role": "kasir"
}
```

**Response (201):**
```json
{
  "id": "clx456...",
  "username": "kasir2",
  "name": "Kasir Dua",
  "role": "kasir",
  "createdAt": "2025-12-04T10:05:00.000Z"
}
```

---

## Products

All product endpoints require authentication.

### Get All Products
**GET** `/products`

Get list of all products.

**Headers:**
```
Authorization: Bearer {token}
```

**Query Parameters:**
- `categoryId` (optional) - Filter by category ID
- `lowStock` (optional) - Set to "true" to get only low stock products

**Response (200):**
```json
[
  {
    "id": "clx789...",
    "code": "PRD001",
    "name": "Indomie Goreng",
    "categoryId": "clxcat1...",
    "category": {
      "id": "clxcat1...",
      "name": "Makanan"
    },
    "stock": 50,
    "minStock": 10,
    "buyPrice": "2500",
    "sellPrice": "3000",
    "createdAt": "2025-12-04T08:00:00.000Z",
    "updatedAt": "2025-12-04T08:00:00.000Z"
  }
]
```

---

### Get Product by ID
**GET** `/products/:id`

Get single product details.

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "id": "clx789...",
  "code": "PRD001",
  "name": "Indomie Goreng",
  "categoryId": "clxcat1...",
  "category": {
    "id": "clxcat1...",
    "name": "Makanan",
    "description": "Produk makanan"
  },
  "stock": 50,
  "minStock": 10,
  "buyPrice": "2500",
  "sellPrice": "3000",
  "createdAt": "2025-12-04T08:00:00.000Z",
  "updatedAt": "2025-12-04T08:00:00.000Z"
}
```

---

### Create Product
**POST** `/products`

Create new product.

**Headers:**
```
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "code": "PRD002",
  "name": "Aqua 600ml",
  "categoryId": "clxcat2...",
  "stock": 30,
  "minStock": 15,
  "buyPrice": 3000,
  "sellPrice": 4000
}
```

**Response (201):**
```json
{
  "id": "clxabc...",
  "code": "PRD002",
  "name": "Aqua 600ml",
  "categoryId": "clxcat2...",
  "category": {
    "id": "clxcat2...",
    "name": "Minuman"
  },
  "stock": 30,
  "minStock": 15,
  "buyPrice": "3000",
  "sellPrice": "4000",
  "createdAt": "2025-12-04T10:10:00.000Z",
  "updatedAt": "2025-12-04T10:10:00.000Z"
}
```

---

### Update Product
**PUT** `/products/:id`

Update existing product.

**Headers:**
```
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "sellPrice": 4500,
  "stock": 25
}
```

**Response (200):**
```json
{
  "id": "clxabc...",
  "code": "PRD002",
  "name": "Aqua 600ml",
  "categoryId": "clxcat2...",
  "category": {
    "id": "clxcat2...",
    "name": "Minuman"
  },
  "stock": 25,
  "minStock": 15,
  "buyPrice": "3000",
  "sellPrice": "4500",
  "createdAt": "2025-12-04T10:10:00.000Z",
  "updatedAt": "2025-12-04T10:15:00.000Z"
}
```

---

### Delete Product
**DELETE** `/products/:id`

Delete product.

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "message": "Product deleted successfully"
}
```

---

### Get Low Stock Alerts
**GET** `/products/alerts/low-stock`

Get products with stock below minimum threshold.

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200):**
```json
[
  {
    "id": "clxdef...",
    "name": "Teh Pucuk",
    "code": "PRD003",
    "category": "Minuman",
    "currentStock": 5,
    "minStock": 10,
    "deficit": 5,
    "severity": "high"
  }
]
```

---

## Categories

### Get All Categories
**GET** `/categories`

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200):**
```json
[
  {
    "id": "clxcat1...",
    "name": "Makanan",
    "description": "Produk makanan",
    "createdAt": "2025-12-04T07:00:00.000Z",
    "updatedAt": "2025-12-04T07:00:00.000Z",
    "_count": {
      "products": 15
    }
  }
]
```

---

### Create Category
**POST** `/categories`

**Headers:**
```
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "name": "Kebutuhan Rumah",
  "description": "Kebutuhan rumah tangga"
}
```

**Response (201):**
```json
{
  "id": "clxcat3...",
  "name": "Kebutuhan Rumah",
  "description": "Kebutuhan rumah tangga",
  "createdAt": "2025-12-04T10:20:00.000Z",
  "updatedAt": "2025-12-04T10:20:00.000Z"
}
```

---

### Update Category
**PUT** `/categories/:id`

**Headers:**
```
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "description": "Produk kebutuhan rumah tangga sehari-hari"
}
```

---

### Delete Category
**DELETE** `/categories/:id`

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "message": "Category deleted successfully"
}
```

---

## Customers

### Get All Customers
**GET** `/customers`

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200):**
```json
[
  {
    "id": "clxcust1...",
    "name": "Ibu Siti",
    "phone": "081234567890",
    "address": "Jl. Mawar No. 5",
    "createdAt": "2025-12-01T10:00:00.000Z",
    "updatedAt": "2025-12-01T10:00:00.000Z",
    "_count": {
      "transactions": 10,
      "debts": 2
    },
    "debts": [
      {
        "remainingDebt": "50000"
      }
    ],
    "totalDebt": 50000
  }
]
```

---

### Get Customer by ID
**GET** `/customers/:id`

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "id": "clxcust1...",
  "name": "Ibu Siti",
  "phone": "081234567890",
  "address": "Jl. Mawar No. 5",
  "createdAt": "2025-12-01T10:00:00.000Z",
  "updatedAt": "2025-12-01T10:00:00.000Z",
  "debts": [
    {
      "id": "clxdebt1...",
      "totalDebt": "75000",
      "paidAmount": "25000",
      "remainingDebt": "50000",
      "status": "partial",
      "createdAt": "2025-12-03T14:00:00.000Z",
      "transaction": {
        "invoiceNumber": "INV-1733234567890",
        "totalAmount": "75000"
      },
      "payments": [
        {
          "id": "clxpay1...",
          "amount": "25000",
          "paymentMethod": "cash",
          "createdAt":  "2025-12-04T09:00:00.000Z"
        }
      ]
    }
  ],
  "transactions": []
}
```

---

### Create Customer
**POST** `/customers`

**Headers:**
```
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "name": "Pak Budi",
  "phone": "081298765432",
  "address": "Jl. Melati No. 10"
}
```

**Response (201):**
```json
{
  "id": "clxcust2...",
  "name": "Pak Budi",
  "phone": "081298765432",
  "address": "Jl. Melati No. 10",
  "createdAt": "2025-12-04T10:30:00.000Z",
  "updatedAt": "2025-12-04T10:30:00.000Z"
}
```

---

### Update Customer
**PUT** `/customers/:id`

**Headers:**
```
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "phone": "081298765433"
}
```

---

### Delete Customer
**DELETE** `/customers/:id`

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "message": "Customer deleted successfully"
}
```

---

## Transactions

### Get All Transactions
**GET** `/transactions`

**Headers:**
```
Authorization: Bearer {token}
```

**Query Parameters:**
- `startDate` (optional) - Filter by start date (ISO format)
- `endDate` (optional) - Filter by end date (ISO format)
- `customerId` (optional) - Filter by customer ID
- `paymentMethod` (optional) - Filter by payment method (cash/qris/credit)

**Response (200):**
```json
[
  {
    "id": "clxtrx1...",
    "invoiceNumber": "INV-1733234567890",
    "customerId": null,
    "customer": null,
    "totalAmount": "15000",
    "paymentMethod": "cash",
    "paymentAmount": "20000",
    "changeAmount": "5000",
    "qrisData": null,
    "status": "completed",
    "notes": null,
    "createdAt": "2025-12-04T09:30:00.000Z",
    "updatedAt": "2025-12-04T09:30:00.000Z",
    "items": [
      {
        "id": "clxitem1...",
        "productId": "clx789...",
        "product": {
          "id": "clx789...",
          "name": "Indomie Goreng",
          "code": "PRD001"
        },
        "quantity": 5,
        "pricePerUnit": "3000",
        "subtotal": "15000",
        "createdAt": "2025-12-04T09:30:00.000Z"
      }
    ]
  }
]
```

---

### Get Transaction by ID
**GET** `/transactions/:id`

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "id": "clxtrx1...",
  "invoiceNumber": "INV-1733234567890",
  "customerId": null,
  "customer": null,
  "totalAmount": "15000",
  "paymentMethod": "cash",
  "paymentAmount": "20000",
  "changeAmount": "5000",
  "qrisData": null,
  "status": "completed",
  "notes": null,
  "createdAt": "2025-12-04T09:30:00.000Z",
  "updatedAt": "2025-12-04T09:30:00.000Z",
  "items": [],
  "debt": null
}
```

---

### Create Transaction (Cash)
**POST** `/transactions`

**Headers:**
```
Authorization: Bearer {token}
```

**Request Body (Cash Payment):**
```json
{
  "paymentMethod": "cash",
  "paymentAmount": 20000,
  "notes": "Pembelian regular",
  "items": [
    {
      "productId": "clx789...",
      "quantity": 5,
      "pricePerUnit": 3000
    }
  ]
}
```

**Response (201):**
```json
{
  "id": "clxtrx2...",
  "invoiceNumber": "INV-1733235678901",
  "customerId": null,
  "customer": null,
  "totalAmount": "15000",
  "paymentMethod": "cash",
  "paymentAmount": "20000",
  "changeAmount": "5000",
  "qrisData": null,
  "status": "completed",
  "notes": "Pembelian regular",
  "createdAt": "2025-12-04T10:00:00.000Z",
  "updatedAt": "2025-12-04T10:00:00.000Z",
  "items": [
    {
      "id": "clxitem2...",
      "productId": "clx789...",
      "product": {
        "id": "clx789...",
        "name": "Indomie Goreng",
        "code": "PRD001",
        "buyPrice": "2500",
        "sellPrice": "3000"
      },
      "quantity": 5,
      "pricePerUnit": "3000",
      "subtotal": "15000",
      "createdAt": "2025-12-04T10:00:00.000Z"
    }
  ]
}
```

---

### Create Transaction (QRIS)
**POST** `/transactions`

**Note:** Requires `QRIS_STATIC_STRING` to be configured in `.env`

**Request Body (QRIS Payment):**
```json
{
  "paymentMethod": "qris",
  "notes": "Pembayaran QRIS",
  "items": [
    {
      "productId": "clxabc...",
      "quantity": 2,
      "pricePerUnit": 4000
    }
  ]
}
```

**Response (201):**
```json
{
  "id": "clxtrx3...",
  "invoiceNumber": "INV-1733236789012",
  "customerId": null,
  "customer": null,
  "totalAmount": "8000",
  "paymentMethod": "qris",
  "paymentAmount": null,
  "changeAmount": null,
  "qrisData": "data:image/png;base64,iVBORw0KGgo...",
  "status": "completed",
  "notes": "Pembayaran QRIS",
  "createdAt": "2025-12-04T10:05:00.000Z",
  "updatedAt": "2025-12-04T10:05:00.000Z",
  "items": []
}
```

---

### Create Transaction (Credit/Bayar Nanti)
**POST** `/transactions`

**Request Body (Credit Payment):**
```json
{
  "customerId": "clxcust1...",
  "paymentMethod": "credit",
  "notes": "Bayar nanti",
  "items": [
    {
      "productId": "clx789...",
      "quantity": 10,
      "pricePerUnit": 3000
    }
  ]
}
```

**Response (201):**
Creates transaction and automatically creates debt record.

---

### Get Transaction Receipt
**GET** `/transactions/:id/receipt`

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "receipt": "========================================\n  WARUNG KELONTONG BERKAH\n  Jl. Contoh No. 123, Jakarta\n  Telp: 081234567890\n========================================\n\nNo. Invoice: INV-1733234567890\nTanggal: 12/4/2025, 9:30:00 AM\n\n----------------------------------------\nItem                    Qty  Harga  Total\n----------------------------------------\nIndomie Goreng             5    Rp3,000  Rp15,000\n----------------------------------------\nTOTAL                                  Rp15,000\nBayar                                  Rp20,000\nKembali                                 Rp5,000\n\n========================================\n   Terima kasih atas kunjungan Anda!\n========================================"
}
```

---

## Purchases

### Get All Purchases
**GET** `/purchases`

**Headers:**
```
Authorization: Bearer {token}
```

**Query Parameters:**
- `startDate` (optional)
- `endDate` (optional)

**Response (200):**
```json
[
  {
    "id": "clxpur1...",
    "purchaseNumber": "PUR-1733237890123",
    "supplier": "Toko Grosir ABC",
    "totalAmount": "250000",
    "notes": "Kulakan bulanan",
    "createdAt": "2025-12-04T08:00:00.000Z",
    "updatedAt": "2025-12-04T08:00:00.000Z",
    "items": [
      {
        "id": "clxpuri1...",
        "productId": "clx789...",
        "product": {
          "id": "clx789...",
          "name": "Indomie Goreng",
          "code": "PRD001"
        },
        "quantity": 100,
        "pricePerUnit": "2500",
        "subtotal": "250000",
        "createdAt": "2025-12-04T08:00:00.000Z"
      }
    ]
  }
]
```

---

### Create Purchase
**POST** `/purchases`

**Headers:**
```
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "supplier": "Toko Grosir XYZ",
  "notes": "Restock mingguan",
  "items": [
    {
      "productId": "clxabc...",
      "quantity": 50,
      "pricePerUnit": 3000
    },
    {
      "productId": "clx789...",
      "quantity": 100,
      "pricePerUnit": 2500
    }
  ]
}
```

**Response (201):**
```json
{
  "id": "clxpur2...",
  "purchaseNumber": "PUR-1733238901234",
  "supplier": "Toko Grosir XYZ",
  "totalAmount": "400000",
  "notes": "Restock mingguan",
  "createdAt": "2025-12-04T10:40:00.000Z",
  "updatedAt": "2025-12-04T10:40:00.000Z",
  "items": [
    {
      "id": "clxpuri2...",
      "productId": "clxabc...",
      "product": {
        "id": "clxabc...",
        "name": "Aqua 600ml",
        "code": "PRD002"
      },
      "quantity": 50,
      "pricePerUnit": "3000",
      "subtotal": "150000",
      "createdAt": "2025-12-04T10:40:00.000Z"
    },
    {
      "id": "clxpuri3...",
      "productId": "clx789...",
      "product": {
        "id": "clx789...",
        "name": "Indomie Goreng",
        "code": "PRD001"
      },
      "quantity": 100,
      "pricePerUnit": "2500",
      "subtotal": "250000",
      "createdAt": "2025-12-04T10:40:00.000Z"
    }
  ]
}
```

---

## Debts

### Get All Debts
**GET** `/debts`

**Headers:**
```
Authorization: Bearer {token}
```

**Query Parameters:**
- `status` (optional) - Filter by status (unpaid/partial/paid)
- `customerId` (optional) - Filter by customer ID

**Response (200):**
```json
[
  {
    "id": "clxdebt1...",
    "transactionId": "clxtrx4...",
    "customerId": "clxcust1...",
    "customer": {
      "id": "clxcust1...",
      "name": "Ibu Siti",
      "phone": "081234567890"
    },
    "transaction": {
      "invoiceNumber": "INV-1733234567890",
      "createdAt": "2025-12-03T14:00:00.000Z"
    },
    "totalDebt": "75000",
    "paidAmount": "25000",
    "remainingDebt": "50000",
    "status": "partial",
    "createdAt": "2025-12-03T14:00:00.000Z",
    "updatedAt": "2025-12-04T09:00:00.000Z",
    "payments": [
      {
        "id": "clxpay1...",
        "amount": "25000",
        "paymentMethod": "cash",
        "notes": "Cicilan pertama",
        "createdAt": "2025-12-04T09:00:00.000Z"
      }
    ]
  }
]
```

---

### Get Debt by ID
**GET** `/debts/:id`

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200):**
Similar to the debt object in the list above, with full transaction and payment details.

---

### Add Debt Payment
**POST** `/debts/payments`

**Headers:**
```
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "debtId": "clxdebt1...",
  "amount": 30000,
  "paymentMethod": "cash",
  "notes": "Cicilan kedua"
}
```

**Response (201):**
```json
{
  "payment": {
    "id": "clxpay2...",
    "debtId": "clxdebt1...",
    "amount": "30000",
    "paymentMethod": "cash",
    "notes": "Cicilan kedua",
    "createdAt": "2025-12-04T10:50:00.000Z"
  },
  "debt": {
    "id": "clxdebt1...",
    "transactionId": "clxtrx4...",
    "customerId": "clxcust1...",
    "customer": {
      "id": "clxcust1...",
      "name": "Ibu Siti"
    },
    "transaction": {
      "invoiceNumber": "INV-1733234567890"
    },
    "totalDebt": "75000",
    "paidAmount": "55000",
    "remainingDebt": "20000",
    "status": "partial",
    "createdAt": "2025-12-03T14:00:00.000Z",
    "updatedAt": "2025-12-04T10:50:00.000Z",
    "payments": []
  }
}
```

---

### Get Debt Payments
**GET** `/debts/:id/payments`

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200):**
```json
[
  {
    "id": "clxpay1...",
    "debtId": "clxdebt1...",
    "amount": "25000",
    "paymentMethod": "cash",
    "notes": "Cicilan pertama",
    "createdAt": "2025-12-04T09:00:00.000Z"
  },
  {
    "id": "clxpay2...",
    "debtId": "clxdebt1...",
    "amount": "30000",
    "paymentMethod": "cash",
    "notes": "Cicilan kedua",
    "createdAt": "2025-12-04T10:50:00.000Z"
  }
]
```

---

## Reports

### Get Dashboard Summary
**GET** `/reports/dashboard`

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "todayRevenue": 150000,
  "todayProfit": 35000,
  "todayTransactionsCount": 12,
  "lowStockCount": 3,
  "totalUnpaidDebt": 125000
}
```

---

### Get Sales Report
**GET** `/reports/sales`

**Headers:**
```
Authorization: Bearer {token}
```

**Query Parameters:**
- `period` (optional) - daily/weekly/monthly (default: daily)
- `startDate` (optional) - Custom start date (ISO format)
- `endDate` (optional) - Custom end date (ISO format)

**Response (200):**
```json
{
  "period": "daily",
  "startDate": "2025-12-04T00:00:00.000Z",
  "endDate": "2025-12-04T23:59:59.000Z",
  "totalTransactions": 12,
  "totalRevenue": 150000,
  "totalProfit": 35000,
  "byPaymentMethod": {
    "cash": {
      "count": 8,
      "total": 100000
    },
    "qris": {
      "count": 3,
      "total": 30000
    },
    "credit": {
      "count": 1,
      "total": 20000
    }
  },
  "transactions": []
}
```

---

### Get Best Sellers
**GET** `/reports/best-sellers`

**Headers:**
```
Authorization: Bearer {token}
```

**Query Parameters:**
- `limit` (optional) - Number of products to return (default: 10)
- `period` (optional) - daily/weekly/monthly (default: monthly)

**Response (200):**
```json
[
  {
    "product": {
      "id": "clx789...",
      "name": "Indomie Goreng",
      "code": "PRD001",
      "category": {
        "id": "clxcat1...",
        "name": "Makanan"
      }
    },
    "totalQuantity": 150,
    "totalRevenue": 450000,
    "transactionCount": 35
  },
  {
    "product": {
      "id": "clxabc...",
      "name": "Aqua 600ml",
      "code": "PRD002",
      "category": {
        "id": "clxcat2...",
        "name": "Minuman"
      }
    },
    "totalQuantity": 120,
    "totalRevenue": 480000,
    "transactionCount": 28
  }
]
```

---

### Get Purchase Summary
**GET** `/reports/purchases`

**Headers:**
```
Authorization: Bearer {token}
```

**Query Parameters:**
- `period` (optional) - daily/weekly/monthly (default: monthly)

**Response (200):**
```json
{
  "period": "monthly",
  "totalPurchases": 5,
  "totalExpense": 2500000
}
```

---

## Settings

### Get Store Settings
**GET** `/settings`

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "id": "1",
  "storeName": "Warung Kelontong Berkah",
  "address": "Jl. Contoh No. 123, Jakarta",
  "phone": "081234567890",
  "minStockAlert": 5,
  "createdAt": "2025-12-04T07:00:00.000Z",
  "updatedAt": "2025-12-04T07:00:00.000Z"
}
```

---

### Update Store Settings
**PUT** `/settings`

**Headers:**
```
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "storeName": "Warung Kelontong Berkah Jaya",
  "phone": "081234567899",
  "minStockAlert": 10
}
```

**Response (200):**
```json
{
  "id": "1",
  "storeName": "Warung Kelontong Berkah Jaya",
  "address": "Jl. Contoh No. 123, Jakarta",
  "phone": "081234567899",
  "minStockAlert": 10,
  "createdAt": "2025-12-04T07:00:00.000Z",
  "updatedAt": "2025-12-04T11:00:00.000Z"
}
```

---

## Testing with cURL

### 1. Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"admin\",\"password\":\"admin123\"}"
```

Save the token from response.

### 2. Get Products
```bash
curl -X GET http://localhost:3000/api/products \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 3. Create Transaction
```bash
curl -X POST http://localhost:3000/api/transactions \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d "{\"paymentMethod\":\"cash\",\"paymentAmount\":20000,\"items\":[{\"productId\":\"PRODUCT_ID_HERE\",\"quantity\":2,\"pricePerUnit\":3000}]}"
```

---

## Error Responses

All endpoints may return these common errors:

**401 Unauthorized:**
```json
{
  "error": "Unauthorized - No token provided"
}
```

**403 Forbidden:**
```json
{
  "error": "Forbidden - Insufficient permissions"
}
```

**404 Not Found:**
```json
{
  "error": "Resource not found"
}
```

**400 Bad Request:**
```json
{
  "error": "Validation error message"
}
```

**500 Internal Server Error:**
```json
{
  "error": "Internal Server Error",
  "message": "Error details"
}
```
