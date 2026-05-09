# Perbaikan Merge Cells Export Peta Jabatan

## Masalah yang Diperbaiki

### 1. Teks Kategori Tidak Muncul ❌
**Masalah**: Teks kategori (STRUKTURAL, FUNGSIONAL, PELAKSANA) tidak muncul setelah merge cell
**Penyebab**: Nilai kategori ada di kolom B, tapi saat merge cell horizontal, Excel hanya menampilkan nilai dari cell pertama (kolom A)

### 2. Tidak Ada Merge Vertikal untuk Jabatan dengan Banyak Pemangku ❌
**Masalah**: Jika 1 jabatan memiliki 15 pemangku, kolom No, Jabatan, Grade, ABK, Existing, dan Keterangan Formasi tidak di-merge vertikal
**Contoh**: 
```
No 3: Instruktur Ahli Madya
- Pemangku 1: John Doe
- Pemangku 2: Jane Smith
- ... (15 pemangku)

Seharusnya kolom No, Jabatan, Grade, ABK, Existing, Keterangan Formasi di-merge dari baris pemangku 1 sampai 15
```

## Solusi

### 1. Pindahkan Nilai Kategori ke Kolom A ✅

**Sebelum:**
```typescript
rows.push({
  'No': '',                                          // Kolom A kosong
  'Jabatan Sesuai Kepmen 202 Tahun 2024': 'STRUKTURAL', // Kolom B
  // ... kolom lainnya kosong
});
```

**Sesudah:**
```typescript
rows.push({
  'No': 'STRUKTURAL',                                // Kolom A berisi kategori
  'Jabatan Sesuai Kepmen 202 Tahun 2024': '',       // Kolom B kosong
  // ... kolom lainnya kosong
});
```

**Hasil**: Saat merge horizontal dari A-O, nilai "STRUKTURAL" di kolom A akan muncul di seluruh baris yang di-merge

### 2. Implementasi Merge Vertikal ✅

#### Tracking Merge Ranges
```typescript
// Track merge ranges untuk jabatan dengan multiple pemangku
const mergeRanges: Array<{ startRow: number; endRow: number; columns: number[] }> = [];
let currentRowIndex = 0; // Track row index in worksheet (0-based)
```

#### Saat Membuat Rows
```typescript
if (matched.length > 1) {
  mergeRanges.push({
    startRow: startRow,
    endRow: currentRowIndex - 1,
    columns: [0, 1, 2, 3, 4, 11] // No, Jabatan, Grade, ABK, Existing, Keterangan Formasi
  });
}
```

#### Kolom yang Di-merge Vertikal
- **Kolom 0**: No
- **Kolom 1**: Jabatan Sesuai Kepmen 202 Tahun 2024
- **Kolom 2**: Grade/Kelas Jabatan
- **Kolom 3**: Jumlah ABK
- **Kolom 4**: Jumlah Existing
- **Kolom 11**: Keterangan Formasi

#### Kolom yang TIDAK Di-merge (Per Pemangku)
- **Kolom 5**: Nama Pemangku
- **Kolom 6**: Kriteria ASN
- **Kolom 7**: NIP
- **Kolom 8**: Pangkat Golongan
- **Kolom 9**: Pendidikan Terakhir
- **Kolom 10**: Jenis Kelamin
- **Kolom 12**: Keterangan Penempatan
- **Kolom 13**: Keterangan Penugasan Tambahan
- **Kolom 14**: Keterangan Perubahan

#### Aplikasi Merge
```typescript
// Add vertical merges for positions with multiple employees
mergeRanges.forEach(range => {
  range.columns.forEach(colIdx => {
    ws['!merges']!.push({
      s: { r: range.startRow, c: colIdx },
      e: { r: range.endRow, c: colIdx },
    });
  });
});
```

### 3. Update Deteksi Kategori ✅

**Sebelum:**
```typescript
// Check column B (index 1)
if (C === 1 && ws[cellAddress].v && 
    ['STRUKTURAL', 'FUNGSIONAL', 'PELAKSANA'].includes(String(ws[cellAddress].v).toUpperCase())) {
  categoryRows.push(R);
}
```

**Sesudah:**
```typescript
// Check column A (index 0)
if (C === 0 && ws[cellAddress].v && 
    ['STRUKTURAL', 'FUNGSIONAL', 'PELAKSANA'].includes(String(ws[cellAddress].v).toUpperCase())) {
  categoryRows.push(R);
}
```

## Contoh Hasil

### Jabatan dengan 1 Pemangku
```
| No | Jabatan              | Grade | ABK | Existing | Nama Pemangku | ... |
|----|---------------------|-------|-----|----------|---------------|-----|
| 1  | Direktur Jenderal   | 17    | 1   | 1        | John Doe      | ... |
```

### Jabatan dengan 15 Pemangku (Merge Vertikal)
```
| No | Jabatan              | Grade | ABK | Existing | Nama Pemangku  | ... | Ket Formasi |
|----|---------------------|-------|-----|----------|----------------|-----|-------------|
|    |                     |       |     |          | Pemangku 1     | ... |             |
|    |                     |       |     |          | Pemangku 2     | ... |             |
| 3  | Instruktur Ahli     | 11    | 15  | 15       | Pemangku 3     | ... | Sesuai      |
|    | Madya               |       |     |          | Pemangku 4     | ... |             |
|    |                     |       |     |          | ...            | ... |             |
|    |                     |       |     |          | Pemangku 15    | ... |             |
```

**Catatan**: Kolom No, Jabatan, Grade, ABK, Existing, dan Keterangan Formasi di-merge vertikal dari baris pertama sampai baris ke-15

### Kategori Header (Merge Horizontal)
```
| STRUKTURAL                                                                    |
|-------------------------------------------------------------------------------|
| (Merge dari kolom A sampai O - 15 kolom)                                     |
```

## Testing

1. Login sebagai Admin Pusat
2. Buka Peta Jabatan → tab "Formasi ASN"
3. Klik "Export Semua Unit"
4. Buka file Excel yang dihasilkan
5. Verifikasi:
   - ✅ Teks "STRUKTURAL", "FUNGSIONAL", "PELAKSANA" muncul dengan background orange
   - ✅ Kategori di-merge horizontal dari kolom A-O
   - ✅ Jabatan dengan banyak pemangku memiliki merge vertikal di kolom No, Jabatan, Grade, ABK, Existing, Keterangan Formasi
   - ✅ Data pemangku (Nama, NIP, Pangkat, dll) tidak di-merge dan muncul per baris

## File yang Dimodifikasi
- `src/pages/PetaJabatan.tsx`

## Tanggal
9 Mei 2026
