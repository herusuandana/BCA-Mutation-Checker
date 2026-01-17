# Quick Start - Testing dengan Akun BCA Real

## 🚀 Langkah Cepat (5 Menit)

### 1. Edit Config (WAJIB!)

Buka file `config/config.json` dan ganti:

```json
{
  "credentials": {
    "username": "GANTI_INI",  ← Username BCA Anda
    "password": "GANTI_INI"   ← Password BCA Anda
  },
  "interval": 300000,
  "browsers": ["chromium"],
  "logging": {
    "level": "info"
  }
}
```

**Cara buka file:**

- Windows: `notepad config\config.json`
- VS Code: `code config\config.json`
- Manual: Buka folder `config/` → double-click `config.json`

### 2. Jalankan!

```bash
npm start
```

### 3. Monitor

Anda akan melihat log seperti ini:

```
[INFO] Starting BCA Mutation Checker
[INFO] Configuration loaded successfully
[INFO] Starting scheduler
[INFO] Starting mutation check
[INFO] Browser session created
[INFO] Login successful
[INFO] Successfully navigated to mutation page
[INFO] Mutation scraping completed {"count":10}
[INFO] Mutations retrieved {"count":10}
[INFO] Logout successful
[INFO] Browser session closed
[INFO] Mutation check completed successfully
```

### 4. Stop

Tekan `Ctrl+C` untuk stop.

## ✅ Checklist

Sebelum start:

- [ ] Sudah edit `config/config.json`
- [ ] Username & password BCA sudah benar
- [ ] Koneksi internet stabil
- [ ] Sudah run `npm install` dan `npm run build`

## ❓ Troubleshooting Cepat

**Login gagal?**
→ Cek username & password di config.json

**Browser tidak muncul?**
→ Run: `npx playwright install chromium`

**Error lain?**
→ Baca `TESTING_GUIDE.md` untuk detail lengkap

## 🎯 What's Next?

Setelah testing berhasil:

1. Biarkan berjalan untuk monitoring otomatis
2. Setup webhook untuk notifikasi real-time
3. Deploy ke server untuk 24/7 monitoring

---

**Need help?** Baca `TESTING_GUIDE.md` untuk panduan lengkap!
