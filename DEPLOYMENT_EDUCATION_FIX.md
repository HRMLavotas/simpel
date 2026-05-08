# Deployment: Perbaikan Data Pendidikan dengan Jurusan

## ✅ Status

### Backend (Database)
- ✅ Migration SQL berhasil dijalankan
- ✅ RPC function `get_latest_education_per_employee()` sudah mengembalikan field `major`
- ✅ Data di-fetch dengan benar (3237 pegawai, 35% dengan jurusan)

### Frontend (Aplikasi)
- ✅ Kode sudah diupdate untuk menampilkan format "Level Major"
- ✅ Build berhasil (`npm run build`)
- ⚠️ **Perlu deployment** agar perubahan terlihat di browser

---

## 🚀 Cara Deploy

### Opsi 1: Deploy ke Vercel (Production)

```bash
# Jika menggunakan Vercel CLI
vercel --prod

# Atau push ke Git (jika auto-deploy aktif)
git add .
git commit -m "fix: Tambah jurusan pendidikan di ekspor peta jabatan"
git push origin main
```

### Opsi 2: Test Lokal (Development)

```bash
# Stop development server yang sedang berjalan (Ctrl+C)
# Lalu jalankan ulang
npm run dev
```

**PENTING**: Setelah server jalan, buka browser dan:
1. **Hard refresh**: `Ctrl + Shift + R` (Windows) atau `Cmd + Shift + R` (Mac)
2. Atau **Clear cache**: 
   - Chrome: `F12` → Network tab → Centang "Disable cache"
   - Firefox: `F12` → Network tab → Centang "Disable HTTP cache"

---

## 🧪 Testing Setelah Deploy

### 1. Verifikasi di Browser
1. Login sebagai **Admin Pusat**
2. Buka **Peta Jabatan** → Tab **Formasi ASN**
3. Klik **Export Semua Unit**
4. Tunggu proses export selesai
5. Buka file Excel yang dihasilkan
6. Cek kolom **"Pendidikan Terakhir"**

### 2. Expected Results
✅ **Harus muncul**:
- "S1 Sains"
- "S1 Informatika"
- "S2 Manajemen"
- "D3 Akuntansi"

❌ **Bukan**:
- "S1" saja (tanpa jurusan) - kecuali memang data jurusan kosong

### 3. Statistik yang Diharapkan
Berdasarkan test script:
- **35% pegawai** (1136 dari 3237) memiliki jurusan
- **65% pegawai** (2101 dari 3237) tidak memiliki jurusan (akan tampil hanya level)

---

## 🔍 Troubleshooting

### Masalah: Jurusan masih tidak muncul setelah deploy

#### Solusi 1: Clear Browser Cache
```
1. Tekan Ctrl + Shift + Delete
2. Pilih "Cached images and files"
3. Pilih "All time"
4. Klik "Clear data"
5. Refresh halaman (F5)
```

#### Solusi 2: Test di Incognito/Private Window
```
1. Buka browser dalam mode incognito (Ctrl + Shift + N)
2. Login ke aplikasi
3. Test export peta jabatan
```

#### Solusi 3: Verifikasi Build
```bash
# Cek apakah file PetaJabatan sudah ter-update
ls -la dist/assets/PetaJabatan-*.js

# Cek timestamp file (harus baru)
```

#### Solusi 4: Verifikasi di Network Tab
```
1. Buka DevTools (F12)
2. Tab Network
3. Klik "Export Semua Unit"
4. Cari request ke RPC "get_latest_education_per_employee"
5. Klik request → Tab "Response"
6. Verifikasi response memiliki field "major"
```

### Masalah: Data jurusan kosong untuk semua pegawai

Ini normal jika data belum diisi. Untuk mengisi data jurusan:

#### Cara 1: Re-import Data Pegawai
1. Buka halaman **Import**
2. Upload file Excel dengan kolom:
   - `Pendidikan Terakhir`: "S1 Teknik Informatika"
   - Atau pisah: `Jenjang Pendidikan` + `Jurusan Pendidikan`
3. Sistem akan otomatis parse dan isi field `major`

#### Cara 2: Update Manual via SQL
Jika data pendidikan sudah ada tapi dalam format "S1 Teknik Informatika" di kolom `level`:

```sql
-- Backup dulu
CREATE TABLE education_history_backup AS SELECT * FROM education_history;

-- Extract major dari level
UPDATE education_history
SET major = TRIM(SUBSTRING(level FROM POSITION(' ' IN level) + 1))
WHERE level LIKE '% %' 
  AND (major IS NULL OR major = '');

-- Bersihkan level agar hanya jenjang
UPDATE education_history
SET level = TRIM(SPLIT_PART(level, ' ', 1))
WHERE level LIKE '% %';
```

---

## 📊 Verifikasi Backend (Opsional)

Jika ingin memastikan backend sudah benar:

```bash
# Jalankan test script
node test_export_education.mjs
```

Expected output:
```
✅ Dengan jurusan (format: "Level Major"):
   - "S1 Sains"
   - "S1 Informatika"
   - "S2 Manajemen"
```

---

## 📝 File yang Diubah

### Backend (Database)
- ✅ `supabase/migrations/20260508100001_update_get_latest_education_with_major.sql`

### Frontend (Aplikasi)
- ✅ `src/pages/PetaJabatan.tsx` (2 lokasi)
  - Line ~282: `loadData()` function
  - Line ~1284: `handleExportAllDepartments()` function

### Build Output
- ✅ `dist/assets/PetaJabatan-*.js` (file baru setelah build)

---

## ✅ Checklist Deployment

- [x] Migration SQL dijalankan di database
- [x] Kode frontend diupdate
- [x] Build berhasil (`npm run build`)
- [x] Test script menunjukkan data benar
- [ ] **Deploy ke production** (Vercel/hosting)
- [ ] **Clear browser cache**
- [ ] **Test di browser** (export peta jabatan)
- [ ] **Verifikasi Excel** (kolom pendidikan terakhir)

---

## 🎯 Next Steps

1. **Deploy aplikasi** ke production (Vercel)
2. **Clear cache** browser
3. **Test export** peta jabatan
4. **Verifikasi** kolom "Pendidikan Terakhir" di Excel

Jika masih ada masalah setelah langkah di atas, hubungi developer dengan:
- Screenshot kolom "Pendidikan Terakhir" di Excel
- Screenshot Network tab (request RPC function)
- Screenshot console log (jika ada error)

---

**Tanggal**: 8 Mei 2026  
**Status**: ✅ Backend selesai, ⏳ Menunggu deployment frontend  
**Testing**: Backend verified, frontend perlu deployment + cache clear
