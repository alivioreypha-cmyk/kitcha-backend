# Kitch-A Backend

Backend REST API untuk aplikasi Flutter Kitch-A — Kitchen Assistant.

## Stack
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL via Supabase (free tier)
- **ORM**: Prisma
- **Auth**: JWT
- **AI Proxy**: Gemini 2.5 Flash (API key aman di server)

---

## Struktur Folder

```
kitcha-backend/
├── prisma/
│   └── schema.prisma       ← definisi tabel database
├── src/
│   ├── index.js            ← entry point server
│   ├── lib/
│   │   └── prisma.js       ← Prisma client singleton
│   ├── middleware/
│   │   └── auth.js         ← JWT verification middleware
│   └── routes/
│       ├── auth.js         ← register, login, change-password, delete-account
│       ├── foods.js        ← CRUD makanan (getAllFoods, insert, update, delete)
│       ├── ai.js           ← proxy ke Gemini (analyze-image, analyze-text, detect-category)
│       └── profile.js      ← get & update profil user
├── .env.example            ← template environment variables
├── .gitignore
└── package.json
```

---

## Setup Local (Development)

### 1. Clone & Install
```bash
git clone <repo>
cd kitcha-backend
npm install
```

### 2. Setup Database di Supabase
1. Buat akun di [supabase.com](https://supabase.com)
2. Buat project baru
3. Masuk ke **Settings → Database → Connection String → URI**
4. Copy connection string (format: `postgresql://postgres:[password]@[host]:5432/postgres`)

### 3. Setup Environment Variables
```bash
cp .env.example .env
```
Isi `.env`:
```env
DATABASE_URL="postgresql://postgres:PASSWORD@HOST:5432/postgres"
JWT_SECRET="string_random_panjang_minimal_32_karakter"
JWT_EXPIRES_IN="30d"
GEMINI_API_KEY="API_KEY_GEMINI_KAMU"
GEMINI_MODEL="gemini-2.5-flash"
PORT=3000
```

### 4. Sync Database Schema
```bash
npx prisma generate
npx prisma db push
```

### 5. Jalankan Server
```bash
npm run dev    # development (nodemon)
npm start      # production
```

Test: buka `http://localhost:3000` → harus muncul `{"status":"ok"}`

---

## Deploy ke Railway (Gratis)

1. Push kode ke GitHub
2. Buka [railway.app](https://railway.app) → New Project → Deploy from GitHub
3. Pilih repo `kitcha-backend`
4. Di tab **Variables**, tambahkan semua isi `.env`
5. Railway otomatis detect Node.js dan deploy
6. Copy URL deploy (contoh: `https://kitcha-backend-production.up.railway.app`)

---

## Setup Flutter

Setelah backend deploy, update satu baris di Flutter:

**`lib/helpers/api_client.dart`**:
```dart
static const String baseUrl = 'https://kitcha-backend-production.up.railway.app';
```

### File Flutter yang Perlu Diganti
Salin semua file dari folder `kitcha-flutter/lib/helpers/` ke project Flutter:

| File | Fungsi |
|------|--------|
| `api_client.dart` | HTTP client terpusat (baru) |
| `auth_service.dart` | Register, login, logout (baru) |
| `db_helper.dart` | Ganti sqflite → API calls |
| `gemini_config.dart` | Hapus API key (tidak lagi butuh) |
| `ai_service.dart` | Proxy AI ke backend (baru) |
| `profile_service.dart` | Sync profil ke server (baru) |
| `notification_helper.dart` | Tidak berubah (tetap lokal) |

### Hapus Dependency sqflite dari pubspec.yaml
```yaml
# HAPUS baris ini:
sqflite: ^2.3.0
path: ^1.8.3
```
sqflite tidak lagi dibutuhkan karena data disimpan di server.

---

## API Endpoints

### Auth
| Method | Endpoint | Body | Auth |
|--------|----------|------|------|
| POST | `/auth/register` | `{email, password, name}` | ❌ |
| POST | `/auth/login` | `{email, password}` | ❌ |
| POST | `/auth/change-password` | `{oldPassword, newPassword}` | ✅ |
| DELETE | `/auth/delete-account` | — | ✅ |

### Foods
| Method | Endpoint | Keterangan | Auth |
|--------|----------|------------|------|
| GET | `/foods` | Ambil semua makanan user | ✅ |
| POST | `/foods` | Tambah makanan baru | ✅ |
| PUT | `/foods/:id` | Update makanan | ✅ |
| DELETE | `/foods/:id` | Hapus makanan | ✅ |

### AI Proxy
| Method | Endpoint | Body | Auth |
|--------|----------|------|------|
| POST | `/ai/analyze-image` | `{imageBase64}` | ✅ |
| POST | `/ai/analyze-text` | `{foodName}` | ✅ |
| POST | `/ai/detect-category` | `{foodName}` | ✅ |

### Profile
| Method | Endpoint | Body | Auth |
|--------|----------|------|------|
| GET | `/profile` | — | ✅ |
| PUT | `/profile` | `{name, phone, profileImage}` | ✅ |

---

## Cara Kerja JWT

1. User register/login → server buat token JWT, kirim ke Flutter
2. Flutter simpan token di `SharedPreferences` dengan key `auth_token`
3. Setiap request berikutnya, `ApiClient` otomatis attach header: `Authorization: Bearer <token>`
4. Middleware `requireAuth` di server verifikasi token sebelum proses request
5. Token expired (30 hari) → Flutter perlu login ulang

---

## Catatan Penting

- **API key Gemini** tidak pernah ada di Flutter lagi — hanya ada di `.env` server
- **Data makanan** tersimpan di PostgreSQL cloud, bukan di SQLite HP lagi
- **Notifikasi** tetap dihandle lokal di Flutter (tidak berubah)
- **Screen Flutter** tidak ada yang perlu diubah — hanya file di `helpers/`
