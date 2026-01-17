# Testing Guide - BCA Mutation Checker

Panduan lengkap untuk testing dengan akun BCA real Anda.

## ⚠️ PENTING - Baca Dulu!

### Keamanan

- ✅ File `config/config.json` sudah ada di `.gitignore` - AMAN tidak akan ter-commit
- ✅ Credentials akan otomatis di-sanitize di logs
- ✅ Browser berjalan dalam headless mode (tidak terlihat)
- ⚠️ **JANGAN PERNAH** commit atau share file `config/config.json`

### Persiapan

- ✅ Pastikan Anda punya akses ke BCA KlikBCA (https://ibank.klikbca.com)
- ✅ Siapkan username dan password BCA Anda
- ✅ Pastikan koneksi internet stabil
- ✅ Testing pertama sebaiknya dilakukan saat tidak ada transaksi penting

## 📋 Setup Awal (Sudah Selesai)

✅ Dependencies installed
✅ Playwright browser installed
✅ Project built
✅ Config file created

## 🔧 Konfigurasi

### 1. Edit Config File

Buka file `config/config.json` dan ganti dengan credentials Anda:

```json
{
  "credentials": {
    "username": "USERNAME_BCA_ANDA",
    "password": "PASSWORD_BCA_ANDA"
  },
  "interval": 300000,
  "browsers": ["chromium"],
  "logging": {
    "level": "info"
  }
}
```

**Cara edit:**

**Windows (Notepad):**

```cmd
notepad config\config.json
```

**Windows (VS Code):**

```cmd
code config\config.json
```

**Atau buka manual:**

- Buka folder `config/`
- Double-click `config.json`
- Edit dengan text editor favorit Anda

### 2. Verifikasi Config

Pastikan format JSON benar (tidak ada koma berlebih, kurung lengkap, dll).

**Test config:**

```bash
npm run build
```

Jika ada error, berarti format JSON salah.

## 🧪 Testing Pertama

### Test 1: Dry Run (Tanpa Credentials Real)

Untuk memastikan semua berjalan, test dulu dengan credentials dummy:

```json
{
  "credentials": {
    "username": "test-user",
    "password": "test-pass"
  },
  "interval": 300000,
  "browsers": ["chromium"],
  "logging": {
    "level": "debug"
  }
}
```

**Jalankan:**

```bash
npm start
```

**Expected result:**

- Browser akan launch
- Akan mencoba login ke BCA
- Akan gagal karena credentials salah (NORMAL!)
- Akan muncul error log
- Browser akan close otomatis

**Jika ini berhasil**, berarti setup Anda sudah benar!

### Test 2: Real Credentials (Single Run)

Sekarang ganti dengan credentials BCA real Anda:

```json
{
  "credentials": {
    "username": "USERNAME_REAL_ANDA",
    "password": "PASSWORD_REAL_ANDA"
  },
  "interval": 300000,
  "browsers": ["chromium"],
  "logging": {
    "level": "info"
  }
}
```

**Jalankan:**

```bash
npm start
```

**Expected flow:**

1. ✅ Browser launch
2. ✅ Navigate to BCA login page
3. ✅ Fill username & password
4. ✅ Submit login form
5. ✅ Wait for authentication
6. ✅ Navigate to mutation page
7. ✅ Scrape transaction data
8. ✅ Parse data
9. ✅ Logout
10. ✅ Close browser
11. ✅ Wait 5 minutes
12. ✅ Repeat...

**Stop dengan:** `Ctrl+C`

## 📊 Monitoring

### Log Levels

**Debug** (Paling detail):

```json
"logging": { "level": "debug" }
```

- Melihat semua detail eksekusi
- Selector queries
- Raw data
- Berguna untuk troubleshooting

**Info** (Recommended):

```json
"logging": { "level": "info" }
```

- Check start/completion
- Successful operations
- Rotation events
- Balance antara detail dan noise

**Warning** (Production):

```json
"logging": { "level": "warning" }
```

- Hanya error yang recoverable
- Fallback activations
- Retry attempts

**Error** (Minimal):

```json
"logging": { "level": "error" }
```

- Hanya critical errors
- Failed operations

### Contoh Log Output

**Successful check:**

```
[2026-01-17T10:00:00.000Z] [INFO] [Application] Starting BCA Mutation Checker
[2026-01-17T10:00:00.100Z] [INFO] [Application] Configuration loaded successfully
[2026-01-17T10:00:00.200Z] [INFO] [Scheduler] Starting scheduler {"interval":300000,"intervalMinutes":5}
[2026-01-17T10:00:00.300Z] [INFO] [Scheduler] Starting mutation check {"browserType":"chromium","hasProxy":false}
[2026-01-17T10:00:02.000Z] [INFO] [SessionManager] Browser session created {"browserType":"chromium"}
[2026-01-17T10:00:05.000Z] [INFO] [SessionManager] Login successful
[2026-01-17T10:00:07.000Z] [INFO] [MutationScraper] Successfully navigated to mutation page
[2026-01-17T10:00:08.000Z] [INFO] [MutationScraper] Mutation scraping completed {"count":10}
[2026-01-17T10:00:08.100Z] [INFO] [DataParser] Mutation parsing completed {"total":10,"success":10,"failed":0}
[2026-01-17T10:00:08.200Z] [INFO] [Scheduler] Mutations retrieved {"count":10}
[2026-01-17T10:00:09.000Z] [INFO] [SessionManager] Logout successful
[2026-01-17T10:00:09.100Z] [INFO] [SessionManager] Browser session closed
[2026-01-17T10:00:09.200Z] [INFO] [Scheduler] Mutation check completed successfully
```

**Failed login:**

```
[2026-01-17T10:00:00.000Z] [INFO] [Application] Starting BCA Mutation Checker
[2026-01-17T10:00:05.000Z] [ERROR] [SessionManager] Login failed {"error":"TimeoutError"}
[2026-01-17T10:00:05.100Z] [WARNING] [ErrorHandler] Recoverable error in mutation-check
[2026-01-17T10:00:05.200Z] [INFO] [SessionManager] Browser session closed
[2026-01-17T10:00:05.300Z] [ERROR] [Scheduler] Mutation check failed
```

## 🔍 Troubleshooting

### Problem 1: Login Gagal

**Symptoms:**

```
[ERROR] [SessionManager] Login failed
```

**Solutions:**

1. ✅ Cek username & password di config.json
2. ✅ Pastikan tidak ada spasi di awal/akhir
3. ✅ Test login manual di browser: https://ibank.klikbca.com
4. ✅ Cek apakah akun BCA Anda aktif
5. ✅ Coba dengan browser lain: `"browsers": ["chrome"]`

### Problem 2: Browser Tidak Launch

**Symptoms:**

```
[ERROR] Browser launch failed
```

**Solutions:**

```bash
# Reinstall Playwright browsers
npx playwright install chromium

# Atau install semua browsers
npx playwright install
```

### Problem 3: Timeout

**Symptoms:**

```
[ERROR] page.fill: Timeout 30000ms exceeded
```

**Solutions:**

1. ✅ Cek koneksi internet
2. ✅ Coba lagi (mungkin BCA server lambat)
3. ✅ Increase timeout (perlu modifikasi code)

### Problem 4: Scraping Gagal

**Symptoms:**

```
[ERROR] Failed to scrape mutations
```

**Solutions:**

1. ✅ BCA mungkin update UI - perlu update selector
2. ✅ Cek apakah ada transaksi di akun
3. ✅ Set log level ke "debug" untuk detail

### Problem 5: Credentials Terlihat di Log

**Symptoms:**
Melihat password di console

**Solutions:**

- ⚠️ Ini TIDAK SEHARUSNYA terjadi!
- ✅ Credentials otomatis di-sanitize
- ✅ Jika terjadi, report sebagai bug

## 🎯 Testing Scenarios

### Scenario 1: Basic Check (5 menit sekali)

```json
{
  "credentials": { "username": "...", "password": "..." },
  "interval": 300000,
  "browsers": ["chromium"],
  "logging": { "level": "info" }
}
```

**Use case:** Testing dasar, monitoring transaksi

### Scenario 2: Frequent Check (5 menit - minimum)

```json
{
  "credentials": { "username": "...", "password": "..." },
  "interval": 300000,
  "browsers": ["chromium"],
  "logging": { "level": "info" }
}
```

**Note:** 300000ms (5 menit) adalah minimum interval

### Scenario 3: Browser Rotation

```json
{
  "credentials": { "username": "...", "password": "..." },
  "interval": 300000,
  "browsers": ["chromium", "chrome", "edge"],
  "logging": { "level": "info" }
}
```

**Note:** Install browsers dulu:

```bash
npx playwright install chrome msedge
```

### Scenario 4: With Webhook

```json
{
  "credentials": { "username": "...", "password": "..." },
  "interval": 300000,
  "browsers": ["chromium"],
  "webhook": {
    "url": "https://your-webhook.com/mutations",
    "retryAttempts": 3
  },
  "logging": { "level": "info" }
}
```

**Use case:** Real-time notification ke server Anda

### Scenario 5: Debug Mode

```json
{
  "credentials": { "username": "...", "password": "..." },
  "interval": 300000,
  "browsers": ["chromium"],
  "logging": { "level": "debug" }
}
```

**Use case:** Troubleshooting, development

## 📈 Expected Results

### First Run

- Duration: ~10-15 seconds
- Browser launch: ~2 seconds
- Login: ~3-5 seconds
- Navigate & scrape: ~2-3 seconds
- Logout & cleanup: ~1-2 seconds

### Subsequent Runs

- Same duration per check
- Runs every 5 minutes (or your configured interval)
- Continues until you stop with Ctrl+C

### Data Retrieved

Anda akan mendapatkan data transaksi dengan format:

```json
{
  "date": "2026-01-17T00:00:00.000Z",
  "description": "TRANSFER FROM ACCOUNT",
  "amount": 1000000,
  "type": "credit",
  "balance": 5000000
}
```

## 🛡️ Security Checklist

Sebelum testing:

- [ ] Config file sudah di `.gitignore`
- [ ] Tidak ada credentials di code
- [ ] Log level tidak "debug" untuk production
- [ ] Webhook endpoint (jika ada) menggunakan HTTPS
- [ ] Password BCA tidak di-share ke siapapun

Setelah testing:

- [ ] Stop aplikasi dengan Ctrl+C
- [ ] Logout dari BCA (otomatis)
- [ ] Review logs untuk anomali
- [ ] Backup config.json ke tempat aman (encrypted)

## 🚀 Production Deployment

Jika testing berhasil dan ingin deploy:

### Option 1: Local Server (Windows)

```bash
# Install as Windows Service (requires node-windows)
npm install -g node-windows
# ... setup service
```

### Option 2: Cloud (Heroku, AWS, etc)

- Setup environment variables
- Deploy code (tanpa config.json)
- Configure credentials via env vars

### Option 3: Docker

```bash
# Build image
docker build -t bca-checker .

# Run container
docker run -d --env-file .env bca-checker
```

## 📞 Support

Jika ada masalah:

1. Cek log output
2. Set log level ke "debug"
3. Review troubleshooting section
4. Check GitHub issues
5. Create new issue dengan log output

## ⚠️ Disclaimer

- Tool ini untuk personal use
- Gunakan dengan bijak
- Ikuti terms of service BCA
- Author tidak bertanggung jawab atas penyalahgunaan
- Jangan gunakan untuk automated trading atau hal ilegal

---

**Ready to test?**

1. Edit `config/config.json` dengan credentials Anda
2. Run `npm start`
3. Monitor logs
4. Stop dengan `Ctrl+C`

Good luck! 🎉
