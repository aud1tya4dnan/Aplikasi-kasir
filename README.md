# Aplikasi POS (Point of Sale) - Warung Kelontong

Aplikasi Point of Sale berbasis web untuk warung kelontong dengan fitur lengkap: manajemen produk, stok otomatis, transaksi penjualan (tunai/QRIS/kredit), pencatatan belanja, manajemen utang pelanggan, dan laporan.

## 🚀 Fitur Utama

- ✅ **Kasir/Transaksi Penjualan**
  - Pembayaran tunai dengan perhitungan kembalian otomatis
  - Pembayaran QRIS dengan QR code dinamis
  - Pembayaran kredit (bayar nanti) dengan pencatatan utang
  - Generate struk digital
  
- ✅ **Manajemen Produk & Stok**
  - CRUD produk dengan kategori
  - Update stok otomatis saat transaksi/belanja
  - Peringatan stok menipis
  
- ✅ **Pencatatan Belanja/Kulakan**
  - Catat pembelian stok dari supplier
  - Update stok otomatis saat belanja
  
- ✅ **Manajemen Pelanggan & Utang**
  - Daftar pelanggan dengan riwayat transaksi
  - Pencatatan utang otomatis
  - Pembayaran cicilan utang
  - Status utang (lunas/sebagian/belum bayar)
  
- ✅ **Laporan & Dashboard**
  - Dashboard dengan metrik harian (pendapatan, laba, transaksi)
  - Laporan penjualan (harian/mingguan/bulanan)
  - Produk terlaris
  - Ringkasan belanja
  
- ✅ **Autentikasi & Keamanan**
  - JWT-based authentication
  - Role-based access (admin/kasir)

## 🛠️ Tech Stack

### Backend
- **Framework**: Hono.js (Node.js)
- **ORM**: Prisma
- **Database**: PostgreSQL
- **Auth**: JWT + bcrypt
- **QRIS**: @agungjsp/qris-dinamis
- **Validation**: Zod

### Frontend
- **Framework**: Vue 3 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **State Management**: Pinia
- **HTTP Client**: Axios
- **Icons**: Oh Vue Icons

### DevOps
- **Containerization**: Docker + Docker Compose
- **Web Server**: Nginx (reverse proxy)
- **Network**: Bridge network untuk inter-service communication

## 📁 Struktur Proyek

```
Aplikasi-kasir/
├── backend/                 # Backend API
│   ├── prisma/
│   │   ├── schema.prisma   # Database schema
│   │   └── seed.ts         # Database seeding
│   ├── src/
│   │   ├── routes/         # API endpoints
│   │   ├── services/       # Business logic
│   │   ├── middleware/     # Auth middleware
│   │   ├── utils/          # Validators
│   │   └── index.ts        # Entry point
│   ├── Dockerfile
│   └── package.json
├── frontend/                # Frontend Web
│   ├── src/
│   │   ├── views/          # Pages
│   │   ├── layouts/        # Layout components
│   │   ├── stores/         # Pinia stores
│   │   ├── services/       # API client
│   │   └── router/         # Vue Router
│   ├── nginx-cloudflare.conf
│   ├── nginx-vps.conf
│   ├── Dockerfile
│   └── package.json
└── docker-compose.yml       # Orchestration
```

## 🚀 Quick Start dengan Docker (Recommended)

### Prerequisites
- Docker & Docker Compose installed
- Git

### 1. Clone Repository
```bash
git clone <repository-url>
cd Aplikasi-kasir
```

### 2. Setup Environment Variables

**Backend** (`backend/.env`):
```bash
cp backend/.env.example backend/.env
# Edit backend/.env sesuai kebutuhan
```

**Frontend** (`frontend/.env`):
```bash
cp frontend/.env.example frontend/.env
# Untuk Docker, gunakan: VITE_API_URL=/api
```

### 3. Run dengan Docker Compose
```bash
docker-compose up --build
```

Aplikasi akan berjalan di:
- **Frontend**: http://localhost
- **Backend API**: http://localhost/api (via reverse proxy)
- **Database**: PostgreSQL di port 5432 (internal)

### 4. Login

Default credentials:
- **Admin**: `admin` / `admin123`
- **Kasir**: `kasir` / `kasir123`

## 💻 Development Setup (Tanpa Docker)

### Prerequisites
- Node.js 20+
- PostgreSQL 16+
- npm atau yarn

### Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Setup database
createdb pos_db

# Configure .env
cp .env.example .env
# Edit DATABASE_URL di .env

# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Seed database
npm run db:seed

# Start development server
npm run dev
```

Backend akan berjalan di `http://localhost:3000`

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Configure .env
cp .env.example .env
# Set VITE_API_URL=http://localhost:3000/api

# Start development server
npm run dev
```

Frontend akan berjalan di `http://localhost:5173`

## 🌐 Deployment

### Deployment ke VPS dengan IP Public

1. **Gunakan nginx-vps.conf** di frontend Dockerfile:
```dockerfile
# Ubah line di frontend/Dockerfile
COPY nginx-vps.conf /etc/nginx/conf.d/default.conf
```

2. **Setup SSL certificates** di VPS:
```bash
# Install certbot
sudo apt install certbot

# Generate SSL certificates
sudo certbot certonly --standalone -d yourdomain.com

# Copy ke docker volume atau mount
```

3. **Update docker-compose.yml** untuk production:
```yaml
frontend:
  volumes:
    - /etc/letsencrypt:/etc/nginx/ssl:ro
```

### Deployment dengan Cloudflare Tunnel (Behind NAT)

1. **Gunakan nginx-cloudflare.conf** (default di Dockerfile)

2. **Setup Cloudflare Tunnel**:
```bash
# Install cloudflared
# Follow: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/tunnel-guide/

cloudflared tunnel create pos-tunnel
cloudflared tunnel route dns pos-tunnel yourdomain.com
```

3. **Run aplikasi**:
```bash
docker-compose up -d
cloudflared tunnel run pos-tunnel
```

## 📚 API Documentation

### Authentication
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/register` - Register user (admin only)

### Products
- `GET /api/products` - List products
- `POST /api/products` - Create product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product
- `GET /api/products/alerts/low-stock` - Get low stock alerts

### Transactions
- `GET /api/transactions` - List transactions
- `POST /api/transactions` - Create transaction
- `GET /api/transactions/:id/receipt` - Get receipt

### Customers
- `GET /api/customers` - List customers
- `POST /api/customers` - Create customer

### Debts
- `GET /api/debts` - List debts
- `POST /api/debts/payments` - Add debt payment

### Reports
- `GET /api/reports/dashboard` - Dashboard metrics
- `GET /api/reports/sales` - Sales report
- `GET /api/reports/best-sellers` - Best selling products

Lihat [backend/API_DOCUMENTATION.md](backend/API_DOCUMENTATION.md) untuk detail lengkap.

## 🔧 Database Schema

Database menggunakan PostgreSQL dengan 11 tabel utama:
- `users` - Pengguna sistem
- `categories` - Kategori produk
- `products` - Data produk
- `customers` - Data pelanggan
- `transactions` - Transaksi penjualan
- `transaction_items` - Detail item transaksi
- `purchases` - Pembelian stok
- `purchase_items` - Detail item belanja
- `debts` - Utang pelanggan
- `debt_payments` - Pembayaran cicilan
- `store_settings` - Pengaturan toko

Lihat [backend/prisma/schema.prisma](backend/prisma/schema.prisma) untuk detail schema.

## 🐛 Troubleshooting

### Docker Issues

**Container tidak bisa start:**
```bash
# Lihat logs
docker-compose logs backend
docker-compose logs frontend

# Restart containers
docker-compose restart
```

**Database migration error:**
```bash
# Akses backend container
docker-compose exec backend sh

# Run migration manual
npx prisma migrate deploy
```

### Development Issues

**CORS error:**
- Pastikan `CORS_ORIGIN` di backend sesuai dengan frontend URL
- Untuk development: `CORS_ORIGIN=http://localhost:5173`

**JWT token expired:**
- Login ulang
- Adjust `JWT_EXPIRES_IN` di backend .env

## 📝 License

MIT

## 👥 Credits

- QRIS package: [@agungjsp/qris-dinamis](https://www.npmjs.com/package/@agungjsp/qris-dinamis)
