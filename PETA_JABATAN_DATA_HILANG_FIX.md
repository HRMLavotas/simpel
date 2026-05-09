# Perbaikan Data Jabatan Hilang

## Masalah

Setelah implementasi merge cells dan styling, banyak data jabatan yang hilang dari file export.

## Penyebab

### 1. Row Index Tracking Salah
**Masalah**: `currentRowIndex` dimulai dari 0, padahal setelah `json_to_sheet`, row 0 adalah header
**Dampak**: Merge range salah, menyebabkan data di-merge ke posisi yang salah

**Sebelum:**
```typescript
let currentRowIndex = 0; // Salah! Row 0 adalah header
```

**Sesudah:**
```typescript
let currentRowIndex = 1; // Benar! Row 1 adalah data pertama
```

### 2. Cell Di-overwrite Saat Styling
**Masalah**: Di first pass, kita membuat cell baru dengan nilai kosong yang menghapus data yang sudah ada

**Sebelum:**
```typescript
// First pass: identify category rows
for (let R = range.s.r; R <= range.e.r; ++R) {
  for (let C = range.s.c; C <= range.e.c; ++C) {
    const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
    
    // MASALAH: Ini menghapus nilai yang sudah ada!
    if (!ws[cellAddress]) {
      ws[cellAddress] = { t: 's', v: '', s: {} };
    }
    
    // Check kategori...
  }
}
```

**Sesudah:**
```typescript
// First pass: identify category rows (HANYA BACA, JANGAN UBAH)
for (let R = range.s.r; R <= range.e.r; ++R) {
  const cellAddress = XLSX.utils.encode_cell({ r: R, c: 0 }); // Check column A only
  
  // HANYA BACA, tidak membuat cell baru
  if (ws[cellAddress] && ws[cellAddress].v && 
      ['STRUKTURAL', 'FUNGSIONAL', 'PELAKSANA'].includes(String(ws[cellAddress].v).toUpperCase())) {
    categoryRows.push(R);
  }
}

// Second pass: apply styling (HANYA KE CELL YANG ADA)
for (let R = range.s.r; R <= range.e.r; ++R) {
  const isCategoryRow = categoryRows.includes(R);
  
  for (let C = range.s.c; C <= range.e.c; ++C) {
    const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
    
    // HANYA style cell yang sudah ada
    if (ws[cellAddress]) {
      // Apply styling...
    }
  }
}
```

## Solusi

### 1. Perbaiki Row Index Tracking
- Mulai dari 1 (bukan 0) karena row 0 adalah header
- Increment setiap kali menambah row ke array `rows`

### 2. Jangan Overwrite Cell Saat Styling
- **First pass**: Hanya baca kolom A untuk identifikasi kategori, tidak membuat cell baru
- **Second pass**: Hanya apply styling ke cell yang sudah ada (tidak membuat cell baru)

## Prinsip Penting

### ❌ JANGAN:
```typescript
// Jangan buat cell baru saat styling
if (!ws[cellAddress]) {
  ws[cellAddress] = { t: 's', v: '', s: {} }; // Ini akan hapus data!
}
```

### ✅ LAKUKAN:
```typescript
// Hanya style cell yang sudah ada
if (ws[cellAddress]) {
  ws[cellAddress].s = myStyle; // Aman, tidak hapus data
}
```

## Testing

1. Login sebagai Admin Pusat
2. Buka Peta Jabatan → tab "Formasi ASN"
3. Klik "Export Semua Unit"
4. Buka file Excel
5. Verifikasi:
   - ✅ Semua jabatan muncul (tidak ada yang hilang)
   - ✅ Kategori (STRUKTURAL, FUNGSIONAL, PELAKSANA) muncul dengan styling
   - ✅ Merge vertikal untuk jabatan dengan banyak pemangku bekerja
   - ✅ Semua data pemangku muncul lengkap

## File yang Dimodifikasi
- `src/pages/PetaJabatan.tsx`

## Tanggal
9 Mei 2026
