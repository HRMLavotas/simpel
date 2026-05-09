# Perbaikan Styling Export Peta Jabatan Semua Unit

## Ringkasan
Telah dilakukan perbaikan pada fitur export data peta jabatan semua unit kerja untuk menambahkan:
1. ✅ **Merge cells** untuk header kategori dan judul
2. ✅ **Warna pada header** (biru untuk header utama, orange untuk kategori)
3. ✅ **Border pada seluruh cell** (thin border hitam)

## Perubahan Library

### Dari `xlsx` ke `xlsx-js-style`
Library `xlsx` standar tidak mendukung styling (warna, border, merge cells). Oleh karena itu, dilakukan perubahan:

```typescript
// SEBELUM
import * as XLSX from 'xlsx';

// SESUDAH
import * as XLSX from 'xlsx-js-style';
```

**Instalasi:**
```bash
npm install xlsx-js-style
```

## Perbaikan Implementasi

### Masalah yang Diperbaiki
1. **Cell kosong menghapus data**: Sebelumnya, saat membuat cell kosong dengan `{ t: 's', v: '' }`, data yang sudah ada terhapus
2. **Kategori jabatan hilang**: Merge cell menyebabkan nilai kategori (STRUKTURAL, FUNGSIONAL, PELAKSANA) hilang
3. **Styling tidak muncul**: Library `xlsx` standar tidak support styling

### Solusi
1. **Hanya style cell yang sudah ada**: Menggunakan kondisi `if (ws[cellAddress] && ws[cellAddress].v !== undefined)` untuk hanya menerapkan styling pada cell yang memiliki nilai
2. **Two-pass styling**: 
   - Pass 1: Identifikasi baris kategori dengan memeriksa kolom B
   - Pass 2: Terapkan styling berdasarkan tipe baris
3. **Gunakan library yang tepat**: `xlsx-js-style` mendukung semua fitur styling yang dibutuhkan

## Detail Perbaikan

### 1. Sheet Per Unit Kerja (28+ sheets)

#### Header Utama (Row 0)
- **Warna**: Biru (`#4472C4`)
- **Font**: Bold, putih, ukuran 11
- **Border**: Thin border hitam pada semua sisi
- **Alignment**: Center horizontal dan vertical

#### Header Kategori (STRUKTURAL, FUNGSIONAL, PELAKSANA)
- **Warna**: Orange/Gold (`#FFC000`)
- **Font**: Bold, hitam, ukuran 11
- **Border**: Thin border hitam pada semua sisi
- **Merge**: Digabung dari kolom A sampai O (15 kolom)
- **Alignment**: Center horizontal dan vertical
- **Deteksi**: Memeriksa kolom B (index 1) untuk nilai kategori

#### Data Cells
- **Border**: Thin border hitam pada semua sisi
- **Alignment**: Vertical center, wrap text

#### Tabel Agregasi (Golongan, Pendidikan, Jenis Kelamin)
- **Header**: Hijau (`#70AD47`), font bold putih
- **Data**: Border hitam, center alignment
- **Merge**: "PENDIDIKAN ASN" digabung dari kolom A-J

### 2. Sheet SUMMARY

#### Header Row
- **Warna**: Biru (`#4472C4`)
- **Font**: Bold, putih, ukuran 11
- **Border**: Thin border hitam
- **Alignment**: Center

#### Data Rows
- **Border**: Thin border hitam
- **Alignment**: Vertical center

### 3. Sheet Tabel Golongan per Unit

#### Header Row
- **Warna**: Biru (`#4472C4`)
- **Font**: Bold, putih, ukuran 11
- **Border**: Thin border hitam
- **Alignment**: Center

#### Data Rows
- **Border**: Thin border hitam
- **Alignment**: Center

#### Baris JUMLAH (Last Row)
- **Warna**: Kuning muda (`#FFF2CC`)
- **Font**: Bold
- **Border**: Thin border hitam
- **Alignment**: Center

### 4. Sheet Tabel Pendidikan per Unit

#### Judul Utama (Row 0)
- **Warna**: Biru (`#4472C4`)
- **Font**: Bold, putih, ukuran 14
- **Border**: Thin border hitam
- **Merge**: Digabung dari kolom A-N (14 kolom)
- **Alignment**: Center
- **Teks**: "REKAP PEGAWAI DITJEN BULAN [BULAN] [TAHUN]"

#### Sub-Judul (Row 1)
- **Warna**: Biru muda (`#5B9BD5`)
- **Font**: Bold, putih, ukuran 12
- **Border**: Thin border hitam
- **Merge**: Digabung dari kolom A-N (14 kolom)
- **Alignment**: Center
- **Teks**: "Dukungan Personil Berdasarkan Tingkat Pendidikan"

#### Header Kolom (Row 2)
- **Warna**: Biru (`#4472C4`)
- **Font**: Bold, putih, ukuran 11
- **Border**: Thin border hitam
- **Alignment**: Center

#### Data Rows
- **Border**: Thin border hitam
- **Alignment**: Center

#### Baris JUMLAH (Last Row)
- **Warna**: Kuning muda (`#FFF2CC`)
- **Font**: Bold
- **Border**: Thin border hitam
- **Alignment**: Center

### 5. Sheet Jumlah ASN per Unit

#### Header Row
- **Warna**: Biru (`#4472C4`)
- **Font**: Bold, putih, ukuran 11
- **Border**: Thin border hitam
- **Alignment**: Center

#### Data Rows
- **Border**: Thin border hitam
- **Alignment**: Center

#### Baris JUMLAH (Last Row)
- **Warna**: Kuning muda (`#FFF2CC`)
- **Font**: Bold
- **Border**: Thin border hitam
- **Alignment**: Center

## Implementasi Teknis

### Border Style
```typescript
const borderStyle = {
  top: { style: 'thin', color: { rgb: '000000' } },
  bottom: { style: 'thin', color: { rgb: '000000' } },
  left: { style: 'thin', color: { rgb: '000000' } },
  right: { style: 'thin', color: { rgb: '000000' } },
};
```

### Merge Cells
```typescript
ws['!merges'] = [
  { s: { r: rowIdx, c: 0 }, e: { r: rowIdx, c: 14 } }
];
```

### Cell Styling (Hanya Cell yang Ada)
```typescript
// Hanya style cell yang memiliki nilai
if (ws[cellAddress] && ws[cellAddress].v !== undefined) {
  ws[cellAddress].s = headerStyle;
}
```

### Two-Pass Styling untuk Kategori
```typescript
// Pass 1: Identifikasi baris kategori
const categoryRows: number[] = [];
for (let R = range.s.r; R <= range.e.r; ++R) {
  for (let C = range.s.c; C <= range.e.c; ++C) {
    const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
    if (C === 1 && ws[cellAddress].v && 
        ['STRUKTURAL', 'FUNGSIONAL', 'PELAKSANA'].includes(String(ws[cellAddress].v).toUpperCase())) {
      if (!categoryRows.includes(R)) {
        categoryRows.push(R);
      }
    }
  }
}

// Pass 2: Terapkan styling
for (let R = range.s.r; R <= range.e.r; ++R) {
  const isCategoryRow = categoryRows.includes(R);
  // ... apply styling based on row type
}
```

## Hasil

File export `Peta_Jabatan_ASN_Semua_Unit_[TANGGAL].xlsx` sekarang memiliki:
- ✅ Header berwarna biru dengan teks putih bold
- ✅ Kategori jabatan berwarna orange dengan merge cell (STRUKTURAL, FUNGSIONAL, PELAKSANA tetap muncul)
- ✅ Border hitam tipis pada semua cell yang memiliki data
- ✅ Tabel agregasi dengan header hijau
- ✅ Baris JUMLAH dengan background kuning muda
- ✅ Judul dan sub-judul dengan merge cell dan warna berbeda

## Testing

Untuk menguji perbaikan:
1. Login sebagai Admin Pusat
2. Buka halaman Peta Jabatan
3. Klik tab "Formasi ASN"
4. Klik tombol "Export Semua Unit"
5. Tunggu proses export selesai
6. Buka file Excel yang dihasilkan
7. Verifikasi:
   - Header berwarna biru dengan teks putih
   - Kategori (STRUKTURAL, FUNGSIONAL, PELAKSANA) berwarna orange, merged, dan teksnya muncul
   - Semua cell yang berisi data memiliki border hitam
   - Tabel agregasi memiliki styling yang sesuai
   - Sheet Summary, Golongan, Pendidikan, dan Jumlah ASN memiliki styling

## File yang Dimodifikasi
- `src/pages/PetaJabatan.tsx` - Update import dan implementasi styling
- `package.json` - Tambah dependency `xlsx-js-style`

## Dependencies Baru
```json
{
  "xlsx-js-style": "^1.2.0"
}
```

## Tanggal
9 Mei 2026
