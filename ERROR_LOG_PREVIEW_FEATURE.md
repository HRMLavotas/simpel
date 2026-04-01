# ✅ Error Log di Preview Import Non-ASN

## Fitur Baru

Error log sekarang ditampilkan di frontend, tepat di bawah section preview data.

## Tampilan Error Log

### 1. Alert Summary
Ketika ada error, muncul alert merah dengan informasi:
```
⚠️ Ditemukan 15 Error

Perbaiki error di bawah ini sebelum melakukan import. 
Data dengan error tidak akan diimport.

[NIK kosong: 5] [Nama kosong: 3] [Jabatan kosong: 4] [Unit kerja tidak valid: 3]
```

### 2. Detail Error Table
Tabel dengan kolom:
- **Baris**: Nomor baris di Excel
- **NIK**: NIK pegawai (jika ada)
- **Nama**: Nama pegawai (jika ada)
- **Error**: Pesan error yang jelas

Contoh:
```
┌───────┬──────────────────┬─────────────────────┬──────────────────────────────┐
│ Baris │ NIK              │ Nama                │ Error                        │
├───────┼──────────────────┼─────────────────────┼──────────────────────────────┤
│ 5     │ -                │ Ahmad Fauzi         │ NIK wajib diisi              │
│ 12    │ 3276012302800010 │ -                   │ Nama wajib diisi             │
│ 28    │ 3174091103750012 │ Budi Santoso        │ Jabatan wajib diisi          │
│ 45    │ 3275034406000021 │ Citra Dewi          │ Unit kerja "XYZ" tidak       │
│       │                  │                     │ ditemukan. Gunakan nama      │
│       │                  │                     │ unit kerja yang sesuai.      │
└───────┴──────────────────┴─────────────────────┴──────────────────────────────┘
```

## Jenis Error yang Ditampilkan

### 1. NIK Kosong
```
Error: NIK wajib diisi
```
**Solusi**: Isi kolom NIK di baris yang error

### 2. Nama Kosong
```
Error: Nama wajib diisi
```
**Solusi**: Isi kolom Nama di baris yang error

### 3. Jabatan Kosong
```
Error: Jabatan wajib diisi
```
**Solusi**: Isi kolom Jabatan di baris yang error

### 4. Unit Kerja Tidak Valid (Admin Pusat)
```
Error: Unit kerja "Direktorat XYZ" tidak ditemukan. 
       Gunakan nama unit kerja yang sesuai.
```
**Solusi**: 
- Periksa ejaan unit kerja
- Gunakan nama unit kerja yang valid
- Lihat daftar unit kerja di template

## Fitur Error Log

### ✅ Summary Error by Type
Menampilkan jumlah error per kategori:
- NIK kosong: X
- Nama kosong: X
- Jabatan kosong: X
- Unit kerja tidak valid: X
- Lainnya: X

### ✅ Scrollable Table
- Max height: 256px (max-h-64)
- Sticky header tetap terlihat saat scroll
- Background merah muda untuk highlight error

### ✅ Informasi Lengkap
Setiap error menampilkan:
- Nomor baris Excel (untuk mudah mencari di file)
- NIK (jika ada)
- Nama (jika ada)
- Pesan error yang jelas dan actionable

### ✅ Visual Feedback
- Border merah untuk error section
- Background merah muda (destructive/5)
- Text merah untuk pesan error
- Icon alert circle

## Workflow

### 1. Upload File Excel
```
[Upload File] → Parsing...
```

### 2. Preview Muncul
```
┌─────────────────────────────────────────────┐
│ Preview Data Non-ASN                        │
│ (750 valid, 22 error dari 772 total)       │
└─────────────────────────────────────────────┘

[Distribusi Unit Kerja] (jika Admin Pusat)

[Preview Table - Semua Data]
```

### 3. Error Log Muncul (Jika Ada Error)
```
┌─────────────────────────────────────────────┐
│ ⚠️ Ditemukan 22 Error                       │
│                                             │
│ Perbaiki error di bawah ini sebelum import  │
│                                             │
│ [NIK kosong: 8] [Nama kosong: 5]           │
│ [Jabatan kosong: 6] [Unit kerja: 3]        │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ Detail Error                                │
│                                             │
│ [Error Table - Hanya Data Error]           │
└─────────────────────────────────────────────┘
```

### 4. Tombol Import
```
[Import 750 Data Valid]
(Disabled jika semua data error)
```

## Keuntungan

### 1. ✅ Mudah Identifikasi Error
Tidak perlu buka console browser, semua error terlihat jelas di UI

### 2. ✅ Mudah Perbaiki
Nomor baris Excel memudahkan mencari dan memperbaiki data yang error

### 3. ✅ Summary Error
Tahu berapa banyak error per kategori, bisa prioritaskan perbaikan

### 4. ✅ Tidak Perlu Import Ulang
Setelah perbaiki Excel, upload ulang dan lihat error berkurang

### 5. ✅ Validasi Sebelum Import
Tidak ada surprise error saat import, semua sudah tervalidasi di preview

## Contoh Penggunaan

### Scenario 1: Ada Error
1. Upload file Excel dengan 772 baris
2. Preview muncul: "750 valid, 22 error dari 772 total"
3. Scroll ke bawah, lihat error log
4. Lihat summary: "NIK kosong: 8, Nama kosong: 5, Jabatan kosong: 6, Unit kerja: 3"
5. Buka Excel, perbaiki baris yang error
6. Upload ulang
7. Preview muncul: "772 valid, 0 error dari 772 total"
8. Klik "Import 772 Data Valid"

### Scenario 2: Semua Data Valid
1. Upload file Excel dengan 772 baris
2. Preview muncul: "772 valid, 0 error dari 772 total"
3. Tidak ada error log section
4. Klik "Import 772 Data Valid"

### Scenario 3: Semua Data Error
1. Upload file Excel dengan format salah
2. Preview muncul: "0 valid, 772 error dari 772 total"
3. Alert merah: "Semua Data Error"
4. Error log menampilkan semua 772 error
5. Tombol import disabled
6. Download template baru, copy data dengan benar

## Styling

### Colors
- Error border: `border-destructive/30`
- Error background: `bg-destructive/5`
- Error text: `text-destructive`
- Error badge: `bg-destructive/20`

### Layout
- Error log di bawah preview table
- Max height 256px dengan scroll
- Sticky header untuk mudah lihat kolom
- Responsive untuk mobile

---

**Status**: ✅ Fitur Lengkap dan Siap Digunakan

Silakan hard refresh browser (Ctrl+Shift+R) untuk melihat fitur baru ini!
