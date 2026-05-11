# ✅ Fix: Merge Cells pada Export Peta Jabatan Individual Unit

## 🐛 Masalah

Export Peta Jabatan untuk **unit kerja individual** (per unit) belum menerapkan **vertical merge cells** untuk jabatan dengan multiple pemangku, berbeda dengan export "Semua Unit" yang sudah menerapkan merge cells dengan sempurna.

### Before Fix
Ketika satu jabatan memiliki 2+ pemangku:
```
┌────────────────────────────────────────────┐
│ No │ Jabatan │ ABK │ Existing │ Pemangku  │
├────────────────────────────────────────────┤
│ 1  │ Kepala  │ 1   │ 2        │ John Doe  │  <- No merge
│    │         │     │          │ Jane Doe  │  <- Empty cells
└────────────────────────────────────────────┘
```

### After Fix ✅
```
┌────────────────────────────────────────────┐
│ No │ Jabatan │ ABK │ Existing │ Pemangku  │
├────────────────────────────────────────────┤
│ 1  │ Kepala  │ 1   │ 2        │ John Doe  │  <- Merged vertically
│    │ (merged)│(mrg)│ (merged) │ Jane Doe  │
└────────────────────────────────────────────┘
```

## ✅ Solusi

### 1. Track Merge Ranges
Tambahkan tracking untuk jabatan dengan multiple pemangku:

```typescript
const mergeRanges: Array<{ 
  startRow: number; 
  endRow: number; 
  columns: number[] 
}> = [];
let currentRowIndex = 0; // Track current row index
```

### 2. Identify Positions with Multiple Employees
Ketika ada jabatan dengan 2+ pemangku, simpan range untuk di-merge:

```typescript
if (matched.length > 1) {
  mergeRanges.push({
    startRow: startRow,
    endRow: currentRowIndex - 1,
    columns: [0, 1, 2, 3, 4, 11] // Columns to merge
  });
}
```

### 3. Apply Vertical Merges
Setelah worksheet dibuat, apply merge cells:

```typescript
// Apply vertical merges for positions with multiple employees
if (!ws['!merges']) ws['!merges'] = [];
mergeRanges.forEach(range => {
  range.columns.forEach(colIdx => {
    ws['!merges']!.push({
      s: { r: range.startRow + 1, c: colIdx }, // +1 for header
      e: { r: range.endRow + 1, c: colIdx },
    });
  });
});
```

## 📊 Kolom yang Di-Merge

Ketika satu jabatan memiliki multiple pemangku, kolom berikut di-merge secara vertikal:

| Column Index | Column Name | Reason |
|--------------|-------------|--------|
| 0 | No | Nomor urut jabatan (sama untuk semua pemangku) |
| 1 | Jabatan Sesuai Kepmen 202 Tahun 2024 | Nama jabatan (sama) |
| 2 | Grade/Kelas Jabatan | Grade jabatan (sama) |
| 3 | Jumlah ABK | ABK jabatan (sama) |
| 4 | Jumlah Existing | Total pemangku (sama) |
| 11 | Keterangan Formasi | Status formasi (sama) |

**Kolom yang TIDAK di-merge** (berbeda per pemangku):
- Nama Pemangku
- Kriteria ASN
- NIP
- Pangkat Golongan
- Pendidikan Terakhir
- Jenis Kelamin
- Keterangan Penempatan
- Keterangan Penugasan Tambahan
- Keterangan Perubahan

## 📝 File yang Diubah

**File:** `src/pages/PetaJabatan.tsx`
**Fungsi:** `handleExportASN()`

**Changes:**
1. ✅ Added `mergeRanges` array to track positions with multiple employees
2. ✅ Added `currentRowIndex` to track row position in data array
3. ✅ Added logic to identify and record merge ranges
4. ✅ Added code to apply vertical merges after worksheet creation

**Lines Changed:** ~30 lines

## ✅ Build Status

```bash
npm run build
```

**Result:** ✅ Build successful
- ✅ No TypeScript errors
- ✅ No compilation warnings
- ✅ File: `PetaJabatan-CfXwIaU9.js` (81.74 kB)

## 🧪 Testing

### Test Scenario 1: Jabatan dengan 1 Pemangku
1. Login ke aplikasi
2. Buka menu **Peta Jabatan** → Tab **Formasi ASN**
3. Pilih unit kerja yang memiliki jabatan dengan 1 pemangku
4. Klik tombol **Export**
5. Buka file Excel

**Expected:**
- ✅ Tidak ada merge cells (normal row)
- ✅ Semua kolom terisi

### Test Scenario 2: Jabatan dengan 2+ Pemangku
1. Pilih unit kerja yang memiliki jabatan dengan 2+ pemangku
2. Klik tombol **Export**
3. Buka file Excel

**Expected:**
- ✅ Kolom No, Jabatan, Grade, ABK, Existing, Keterangan Formasi di-merge vertikal
- ✅ Kolom Nama Pemangku, NIP, Pangkat, dll TIDAK di-merge (berbeda per pemangku)
- ✅ Styling tetap konsisten (border, warna header, dll)

### Test Scenario 3: Jabatan Kosong (Tidak Ada Pemangku)
1. Pilih unit kerja yang memiliki jabatan kosong
2. Klik tombol **Export**
3. Buka file Excel

**Expected:**
- ✅ Tidak ada merge cells
- ✅ Kolom pemangku menampilkan "-"

### Test Scenario 4: Mixed (Jabatan dengan 0, 1, 2+ Pemangku)
1. Pilih unit kerja dengan berbagai kondisi jabatan
2. Klik tombol **Export**
3. Buka file Excel

**Expected:**
- ✅ Merge cells hanya diterapkan pada jabatan dengan 2+ pemangku
- ✅ Jabatan dengan 0 atau 1 pemangku tidak di-merge
- ✅ Styling konsisten di semua rows

## 📊 Comparison

### Export Semua Unit (handleExportAllDepartments)
- ✅ Horizontal merge untuk category headers
- ✅ Vertical merge untuk jabatan dengan multiple pemangku
- ✅ Border, warna, column widths

### Export Individual Unit (handleExportASN) - BEFORE
- ✅ Horizontal merge untuk category headers
- ❌ Vertical merge untuk jabatan dengan multiple pemangku
- ✅ Border, warna, column widths

### Export Individual Unit (handleExportASN) - AFTER ✅
- ✅ Horizontal merge untuk category headers
- ✅ Vertical merge untuk jabatan dengan multiple pemangku ⭐
- ✅ Border, warna, column widths

## 🎯 Impact

### Before
- ❌ Jabatan dengan multiple pemangku menampilkan empty cells
- ❌ Tidak konsisten dengan export "Semua Unit"
- ❌ Terlihat kurang profesional

### After
- ✅ Jabatan dengan multiple pemangku di-merge dengan benar
- ✅ Konsisten dengan export "Semua Unit"
- ✅ Terlihat profesional dan mudah dibaca

## 📝 Notes

1. **Merge Logic:** Hanya diterapkan pada jabatan dengan 2+ pemangku
2. **Column Selection:** Hanya kolom yang nilainya sama untuk semua pemangku yang di-merge
3. **Performance:** Tidak ada impact signifikan pada performa export
4. **Compatibility:** Compatible dengan Excel 2007+ dan LibreOffice

## 🔗 Related

- `STANDARDISASI_EXPORT_EXCEL_COMPLETED.md` - Summary lengkap standardisasi
- `HASIL_STANDARDISASI_EXPORT_EXCEL.md` - User guide
- `src/lib/excelStyles.ts` - Helper functions

---

**Status:** ✅ FIXED
**Date:** 11 Mei 2026
**Build Status:** ✅ Successful
**Ready for Testing:** ✅ Yes

**Export Peta Jabatan individual unit sekarang memiliki merge cells yang sama dengan export "Semua Unit"!** 🎉
