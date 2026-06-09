# 🔐 MayoPass

Aplikasi password manager berbasis web dengan penyimpanan aman menggunakan MongoDB. Dibangun dengan arsitektur fullstack — frontend static + backend serverless API — dan di-deploy di Vercel.

**Live:** [mayopass.vercel.app](https://mayopass.vercel.app)

---

## Fitur

- **Simpan Password** — Tambah dan simpan kredensial (username/password/catatan) ke database MongoDB
- **Lihat & Kelola** — Tampilkan daftar password yang tersimpan, edit, atau hapus
- **Pencarian** — Cari password berdasarkan nama akun atau platform
- **Tampil/Sembunyikan Password** — Toggle visibilitas password di UI
- **Serverless API** — Semua operasi data lewat satu endpoint serverless (`api/index.js`)
- **Deploy Vercel** — Frontend dan API live dalam satu repo

---

## Tech Stack

| Layer | Teknologi |
|---|---|
| Frontend | HTML, CSS, JavaScript (Vanilla) |
| Backend API | Node.js — Vercel Serverless Function |
| Database | MongoDB (MongoDB Node.js Driver) |
| Deploy | Vercel |
| Runtime | Node.js 24.x |

---

## Struktur Project

```
mayopass/
├── api/
│   └── index.js          # Serverless function — semua endpoint API
├── backend/              # Logic helper / koneksi MongoDB
├── frontend/
│   ├── index.html        # UI utama aplikasi
│   ├── style.css         # Styling
│   └── script.js         # Logic frontend
├── vercel.json           # Routing config Vercel
├── package.json
└── .gitignore
```

**Routing (vercel.json):**
- `/api/*` → `api/index.js` (serverless function)
- `/*` → `frontend/$1` (static file)

---

## Environment Variable

Set di Vercel dashboard atau file `.env` lokal:

```env
MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/<dbname>
```

> ⚠️ Jangan commit `MONGODB_URI` ke repo — pastikan sudah ada di `.gitignore`.

---

## Instalasi Lokal

```bash
# Clone repo
git clone https://github.com/cuakproject/mayopass.git
cd mayopass

# Install dependencies
npm install

# Buat file .env
echo "MONGODB_URI=mongodb+srv://..." > .env

# Jalankan dengan Vercel CLI
npx vercel dev
```

Aplikasi akan berjalan di `http://localhost:3000`.

---

## Deployment

Project ini auto-deploy ke Vercel setiap push ke branch `main`.

```bash
git add .
git commit -m "update"
git push origin main
```

Pastikan `MONGODB_URI` sudah diset di **Vercel → Settings → Environment Variables** sebelum deploy.

---

## Lisensi

Internal use only — [cuakproject](https://github.com/cuakproject)
