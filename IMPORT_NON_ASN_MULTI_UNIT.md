# Import Non-ASN Multi Unit Kerja (Admin Pusat)

## ✅ Fitur Sudah Diimplementasikan

Sebagai Admin Pusat, Anda dapat mengimport data pegawai Non-ASN ke berbagai unit kerja sekaligus dalam satu file Excel.

## 🎯 Cara Kerja

### 1. Download Template
- Klik tombol "Download Template"
- Template untuk Admin Pusat berisi 3 contoh dengan unit kerja berbeda:
  - Contoh 1: Setditjen Binalavotas
  - Contoh 2: Direktorat Bina Stankomproglat
  - Contoh 3: Direktorat Bina Marga

### 2. Isi Data Excel
Pastikan kolom "Unit Kerja" diisi dengan nama unit kerja yang sesuai:

**Unit Kerja yang Valid:**
- Setditjen Binalavotas
- Direktorat Bina Marga
- Direktorat Bina Stankomproglat
- Direktorat Bina Penataan Bangunan
- Direktorat Bina Sumber Daya Air
- Direktorat Bina Cipta Karya
- Direktorat Bina Tata Ruang
- Inspektorat Jenderal

### 3. Upload File
- Upload file Excel yang sudah diisi
- Sistem akan otomatis mendeteksi unit kerja dari kolom "Unit Kerja"

### 4. Preview Data
Setelah upload, Anda akan melihat:

**a. Distribusi Unit Kerja**
```
┌─────────────────────────────────────────────────┐
│ Distribusi Unit Kerja                           │
│ • Setditjen Binalavotas: 150 pegawai           │
│ • Direktorat Bina Stankomproglat: 200 pegawai  │
│ • Direktorat Bina Marga: 180 pegawai           │
│ • Direktorat Bina Penataan Bangunan: 120 pegawai│
└─────────────────────────────────────────────────┘
```

**b. Preview Tabel**
Menampilkan semua data dengan kolom "Unit Kerja" yang jelas

### 5. Import
- Klik tombol "Import X Data Valid"
- Setiap pegawai akan masuk ke unit kerjanya masing-masing
- Duplikat NIK akan dilewati otomatis

## 🔍 Matching Unit Kerja

Sistem menggunakan 3 strategi matching untuk mencocokkan nama unit kerja:

### 1. Exact Match (Prioritas Tertinggi)
```
Excel: "Direktorat Bina Marga"
Match: "Direktorat Bina Marga" ✅
```

### 2. Partial Match
```
Excel: "Bina Marga"
Match: "Direktorat Bina Marga" ✅

Excel: "Stankomproglat"
Match: "Direktorat Bina Stankomproglat" ✅
```

### 3. Keyword Match (Minimal 2 kata kunci)
```
Excel: "Direktorat Stankomproglat"
Match: "Direktorat Bina Stankomproglat" ✅

Excel: "Bina Penataan"
Match: "Direktorat Bina Penataan Bangunan" ✅
```

## ⚠️ Validasi

### Error: Unit Kerja Tidak Ditemukan
Jika nama unit kerja tidak cocok dengan daftar yang valid:
```
Error: Unit kerja "Direktorat XYZ" tidak ditemukan. 
       Gunakan nama unit kerja yang sesuai.
```

**Solusi:**
- Periksa ejaan nama unit kerja
- Gunakan nama unit kerja yang sesuai dengan daftar di atas
- Atau gunakan nama singkat yang jelas (contoh: "Bina Marga", "Stankomproglat")

## 📊 Contoh Excel untuk Admin Pusat

| No | NIK | Nama | Jabatan | ... | Unit Kerja | Type Non ASN |
|----|-----|------|---------|-----|------------|--------------|
| 1 | 3276012302800010 | Wachyudi Maulana | Pengemudi | ... | Setditjen Binalavotas | Tenaga Alih Daya |
| 2 | 3174091103750012 | Teguh Prihatin | Petugas Kebersihan | ... | Direktorat Bina Stankomproglat | Tenaga Alih Daya |
| 3 | 3275034406000021 | Jenita Permata Arini | Pramubakti | ... | Direktorat Bina Marga | Tenaga Ahli |
| 4 | 3201234567890123 | Ahmad Fauzi | Pengemudi | ... | Direktorat Bina Penataan Bangunan | Tenaga Alih Daya |
| 5 | 3301234567890124 | Siti Nurhaliza | Pramubakti | ... | Setditjen Binalavotas | Tenaga Alih Daya |

## 🎯 Hasil Import

Setelah import berhasil:

```
✅ Import selesai
150 data berhasil diimport, 5 duplikat dilewati, 2 error

Distribusi:
• Setditjen Binalavotas: 50 pegawai
• Direktorat Bina Stankomproglat: 40 pegawai
• Direktorat Bina Marga: 35 pegawai
• Direktorat Bina Penataan Bangunan: 25 pegawai
```

## 🔄 Verifikasi

Untuk memverifikasi data sudah masuk ke unit kerja yang benar:

1. Buka menu "Peta Jabatan"
2. Pilih unit kerja dari dropdown
3. Klik tab "Formasi Non-ASN"
4. Lihat daftar pegawai Non-ASN di unit kerja tersebut

## 💡 Tips

### 1. Gunakan Nama Singkat
Tidak perlu menulis nama lengkap, cukup kata kunci:
- ✅ "Bina Marga" → Direktorat Bina Marga
- ✅ "Stankomproglat" → Direktorat Bina Stankomproglat
- ✅ "Setditjen" → Setditjen Binalavotas

### 2. Copy-Paste Unit Kerja
Untuk menghindari typo, copy-paste nama unit kerja dari template

### 3. Periksa Preview
Selalu periksa bagian "Distribusi Unit Kerja" di preview untuk memastikan unit kerja terdeteksi dengan benar

### 4. Import Bertahap
Jika file sangat besar (>1000 baris), pertimbangkan untuk import per unit kerja agar lebih mudah diverifikasi

## 🐛 Troubleshooting

### Semua Data Masuk ke Unit Kerja yang Sama
**Penyebab:** Kolom "Unit Kerja" tidak diisi atau tidak terdeteksi

**Solusi:**
1. Pastikan header kolom adalah "Unit Kerja" (case-insensitive)
2. Pastikan setiap baris memiliki nilai di kolom "Unit Kerja"
3. Download template baru dan copy data Anda ke template tersebut

### Unit Kerja Tidak Ditemukan
**Penyebab:** Nama unit kerja tidak cocok dengan daftar yang valid

**Solusi:**
1. Periksa ejaan
2. Gunakan nama singkat yang jelas
3. Lihat daftar unit kerja yang valid di atas
4. Gunakan nama dari template

### Data Tidak Muncul di Unit Kerja
**Penyebab:** Browser cache belum di-refresh

**Solusi:**
1. Hard refresh browser: `Ctrl + Shift + R` (Windows) atau `Cmd + Shift + R` (Mac)
2. Buka Peta Jabatan
3. Pilih unit kerja
4. Klik tab "Formasi Non-ASN"

## 📝 Catatan Penting

1. **Hanya Admin Pusat** yang dapat mengimport ke berbagai unit kerja
2. **Admin Unit** hanya dapat mengimport ke unit kerjanya sendiri
3. **Duplikat NIK** akan dilewati otomatis (tidak error)
4. **Validasi unit kerja** dilakukan saat parsing, bukan saat insert
5. **Preview** menampilkan distribusi unit kerja untuk verifikasi sebelum import

---

**Status**: ✅ Fitur Lengkap dan Siap Digunakan
