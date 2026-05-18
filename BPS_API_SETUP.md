# Setup BPS API untuk Analisis Kebutuhan SDM

## Masalah
API BPS tidak berfungsi di menu **Analisis Kebutuhan SDM** karena `VITE_BPS_API_KEY` belum dikonfigurasi di file `.env`.

## Solusi

### 1. Dapatkan API Key dari BPS

1. Kunjungi website BPS Developer Portal: **https://webapi.bps.go.id/developer/**
2. Klik tombol **"Daftar"** atau **"Register"** untuk membuat akun
3. Isi formulir pendaftaran dengan data yang valid:
   - Nama Lengkap
   - Email
   - Nomor Telepon
   - Instansi/Organisasi
   - Tujuan Penggunaan API
4. Verifikasi email Anda
5. Login ke dashboard developer
6. Buat aplikasi baru atau gunakan aplikasi default
7. Copy **API Key** yang diberikan

### 2. Konfigurasi di File .env

Buka file `.env` di root project dan tambahkan/update baris berikut:

```env
# BPS (Badan Pusat Statistik) API Configuration
# Get your API key from: https://webapi.bps.go.id/developer/
VITE_BPS_API_KEY="paste_api_key_anda_disini"
```

**Contoh:**
```env
VITE_BPS_API_KEY="1234567890abcdef1234567890abcdef"
```

### 3. Restart Development Server

Setelah menambahkan API key, restart development server:

```bash
# Stop server (Ctrl+C)
# Start ulang
npm run dev
```

### 4. Test API BPS

1. Buka aplikasi di browser: `http://localhost:8080`
2. Login sebagai admin
3. Navigasi ke menu **"Analisis Kebutuhan SDM"**
4. Pilih **Provinsi** dari dropdown
5. Klik tombol **"Generate Data BPS"**
6. Data dari BPS API seharusnya muncul (TPT, NEET, TIK, dll)

## Fitur yang Menggunakan BPS API

Menu **Analisis Kebutuhan SDM** menggunakan BPS API untuk mendapatkan data:

### Data Wilayah:
- ✅ Daftar Provinsi
- ✅ Daftar Kabupaten/Kota per Provinsi

### Data Statistik (SDDS/SDGs):
- 📊 **TPT** (Tingkat Pengangguran Terbuka)
- 📊 **NEET** (Not in Education, Employment, or Training)
- 📊 **TIK** (Teknologi Informasi dan Komunikasi)
- 📊 **Sektor Dominan** (Industri, Pertanian, Jasa, dll)
- 📊 **Profil Industri** per sektor
- 📊 **Angkatan Kerja** baru
- 📊 **Lulusan Sekolah** (SMK, SMA, dll)
- 📊 **Kemiskinan** & kesejahteraan
- 📊 **Infrastruktur** & konektivitas

## Troubleshooting

### API Key Tidak Valid
**Error:** `BPS API returned error status`

**Solusi:**
1. Pastikan API key sudah benar (copy-paste tanpa spasi)
2. Cek apakah API key masih aktif di dashboard BPS
3. Pastikan quota API belum habis

### CORS Error
**Error:** `Access to fetch at 'https://webapi.bps.go.id' has been blocked by CORS policy`

**Solusi:**
- Proxy sudah dikonfigurasi di `vite.config.ts`
- Pastikan development server berjalan dengan benar
- Gunakan endpoint `/bps-api/...` bukan `https://webapi.bps.go.id/...`

### WAF Block (403 Forbidden)
**Error:** `BPS WAF Block or 500 Error`

**Solusi:**
- BPS API kadang memblokir request yang terlalu cepat
- Aplikasi sudah memiliki **fallback mechanism** yang akan generate data simulasi jika API BPS tidak tersedia
- Data simulasi tetap realistis dan mengikuti format SDDS/SDGs

### Data Tidak Muncul
**Solusi:**
1. Buka Developer Console (F12)
2. Cek tab **Network** untuk melihat request ke BPS API
3. Cek tab **Console** untuk melihat error message
4. Pastikan provinsi sudah dipilih sebelum klik "Generate Data BPS"

## Catatan Penting

⚠️ **API Key adalah Rahasia**
- Jangan commit file `.env` ke Git
- File `.env` sudah ada di `.gitignore`
- Jangan share API key di public repository

⚠️ **Quota API**
- BPS API memiliki limit request per hari
- Gunakan dengan bijak
- Aplikasi sudah memiliki fallback jika quota habis

⚠️ **Fallback Mechanism**
- Jika BPS API tidak tersedia, aplikasi akan otomatis generate data simulasi
- Data simulasi tetap realistis berdasarkan karakteristik wilayah
- User akan tetap bisa melanjutkan analisis SDM

## Dokumentasi BPS API

Untuk informasi lebih lanjut tentang BPS API:
- **Developer Portal:** https://webapi.bps.go.id/developer/
- **Dokumentasi API:** https://webapi.bps.go.id/documentation/
- **Support:** Hubungi tim BPS melalui portal developer

---

**Status:** ✅ Konfigurasi proxy sudah benar di `vite.config.ts`
**Action Required:** Tambahkan `VITE_BPS_API_KEY` di file `.env`
