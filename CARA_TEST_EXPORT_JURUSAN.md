# Cara Test Export Jurusan Pendidikan

## ✅ Status Saat Ini

### Backend (Database)
- ✅ Migration SQL berhasil
- ✅ RPC function mengembalikan field `major`
- ✅ Data di-fetch dengan benar (test script verified)

### Frontend (Aplikasi)
- ✅ Kode sudah benar (verified di source code)
- ✅ Build berhasil (file PetaJabatan-BuP1BKje.js sudah ter-update)
- ✅ Kode di build file sudah mengandung logik yang benar

### Masalah
**Browser masih menggunakan cache lama** → Perubahan belum terlihat

---

## 🚀 Solusi: Clear Cache & Test

### Opsi 1: Hard Refresh (Tercepat)

1. **Buka aplikasi** di browser
2. **Tekan kombinasi tombol**:
   - Windows: `Ctrl + Shift + R`
   - Mac: `Cmd + Shift + R`
3. **Login** sebagai Admin Pusat
4. **Test export** (lihat langkah testing di bawah)

### Opsi 2: Clear Browser Cache (Recommended)

#### Chrome/Edge:
1. Tekan `Ctrl + Shift + Delete`
2. Pilih **"Cached images and files"**
3. Time range: **"All time"**
4. Klik **"Clear data"**
5. Refresh halaman (`F5`)

#### Firefox:
1. Tekan `Ctrl + Shift + Delete`
2. Pilih **"Cache"**
3. Time range: **"Everything"**
4. Klik **"Clear Now"**
5. Refresh halaman (`F5`)

### Opsi 3: Incognito/Private Window (Untuk Test)

1. **Buka Incognito**:
   - Chrome/Edge: `Ctrl + Shift + N`
   - Firefox: `Ctrl + Shift + P`
2. **Buka aplikasi** di incognito window
3. **Login** sebagai Admin Pusat
4. **Test export**

### Opsi 4: Disable Cache di DevTools (Untuk Development)

1. Buka **DevTools** (`F12`)
2. Buka tab **Network**
3. **Centang** "Disable cache"
4. **Refresh** halaman (`F5`)
5. **Test export**

---

## 🧪 Cara Testing

### 1. Login
- Login sebagai **Admin Pusat**
- Pastikan role Anda bisa melihat semua unit

### 2. Buka Peta Jabatan
- Klik menu **"Peta Jabatan"**
- Pilih tab **"Peta Jabatan ASN"** (tab pertama)

### 3. Export Semua Unit
- Scroll ke atas
- Klik tombol **"Export Semua Unit"** (warna biru/primary)
- Tunggu proses export (bisa 5-10 detik untuk ribuan pegawai)
- File Excel akan otomatis ter-download

### 4. Buka File Excel
- Buka file yang ter-download
- Nama file: `Peta_Jabatan_ASN_Semua_Unit_YYYYMMDD.xlsx`

### 5. Cek Kolom "Pendidikan Terakhir"
- Buka sheet unit kerja mana saja (contoh: "BBPVP Bekasi")
- Cari kolom **"Pendidikan Terakhir"** (kolom J)
- Scroll ke bawah untuk melihat data pegawai

### 6. Verifikasi Format

**✅ BENAR** (harus seperti ini):
```
S1 Sains
S1 Informatika
S2 Manajemen
D3 Akuntansi
SLTA/SMA Sederajat
```

**❌ SALAH** (jika masih seperti ini, cache belum clear):
```
S1
S2
D3
SLTA/SMA Sederajat
```

---

## 📊 Expected Results

Berdasarkan test script:
- **35% pegawai** (1136 dari 3237) memiliki jurusan → akan tampil "S1 Informatika"
- **65% pegawai** (2101 dari 3237) tidak memiliki jurusan → akan tampil "S1" saja

Jadi **wajar** jika sebagian data hanya menampilkan jenjang tanpa jurusan.

---

## 🔍 Troubleshooting

### Masalah: Jurusan masih tidak muncul setelah clear cache

#### Cek 1: Verifikasi di Network Tab
1. Buka **DevTools** (`F12`)
2. Tab **Network**
3. Klik **"Export Semua Unit"**
4. Cari request ke `get_latest_education_per_employee`
5. Klik request → Tab **"Response"**
6. **Verifikasi**: Response harus memiliki field `"major"`

**Contoh response yang benar:**
```json
[
  {
    "employee_id": "xxx-xxx",
    "level": "S1",
    "major": "Informatika",
    "graduation_year": 2020
  }
]
```

**Jika field `major` tidak ada** → Ada masalah di backend (hubungi developer)

#### Cek 2: Verifikasi Build File
```bash
# Cek timestamp file build
ls -la dist/assets/PetaJabatan-*.js

# Harus menunjukkan timestamp hari ini
```

#### Cek 3: Restart Dev Server (Jika Development)
```bash
# Stop server yang sedang berjalan (Ctrl+C)
# Lalu jalankan ulang:
npm run dev
```

### Masalah: Semua data pendidikan kosong ("-")

**Penyebab**: Pegawai belum memiliki data di tabel `education_history`

**Solusi**: Import data pendidikan via halaman **Import**

---

## 📝 Catatan Penting

1. **Cache adalah penyebab paling umum** → Selalu clear cache dulu
2. **Incognito mode** adalah cara tercepat untuk test tanpa clear cache
3. **DevTools "Disable cache"** berguna untuk development
4. **Data jurusan kosong** adalah normal jika belum di-import
5. **Format "Level Major"** sudah benar di backend (verified)

---

## ✅ Checklist

- [ ] Clear browser cache atau buka incognito
- [ ] Login sebagai Admin Pusat
- [ ] Buka Peta Jabatan → Tab ASN
- [ ] Klik "Export Semua Unit"
- [ ] Buka file Excel yang ter-download
- [ ] Cek kolom "Pendidikan Terakhir"
- [ ] Verifikasi format: "S1 Informatika" (bukan hanya "S1")

---

## 🆘 Jika Masih Bermasalah

Berikan screenshot:
1. Kolom "Pendidikan Terakhir" di Excel
2. Network tab → Response dari `get_latest_education_per_employee`
3. Console log (jika ada error)

---

**Tanggal**: 8 Mei 2026  
**Status**: ✅ Backend & Frontend sudah benar, tinggal clear cache  
**Estimasi**: 2-5 menit untuk test setelah clear cache
