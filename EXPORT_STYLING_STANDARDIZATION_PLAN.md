# Rencana Standardisasi Styling Export Excel

## 📋 Overview

Berdasarkan analisis implementasi export di menu **Peta Jabatan**, telah ditemukan standar kualitas export yang sangat baik dengan fitur:

✅ **Styling lengkap:**
- Border pada semua cell
- Header berwarna biru (#4472C4) dengan teks putih bold
- Category header berwarna orange/gold (#FFC000) dengan teks hitam bold
- Merge cells untuk header kategori dan data dengan multiple rows
- Column width yang optimal
- Text alignment (center untuk header, wrap text untuk data)
- Tabel agregasi dengan styling terpisah (header hijau #70AD47)

✅ **Struktur data:**
- Header yang jelas dan deskriptif
- Kategori yang terorganisir dengan baik
- Tabel agregasi tambahan di bawah data utama
- Kompresi file untuk ukuran lebih kecil

## 🎯 Standar Styling yang Akan Diterapkan

### 1. Border Style
```typescript
const borderStyle = {
  top: { style: 'thin', color: { rgb: '000000' } },
  bottom: { style: 'thin', color: { rgb: '000000' } },
  left: { style: 'thin', color: { rgb: '000000' } },
  right: { style: 'thin', color: { rgb: '000000' } },
};
```

### 2. Header Style (Row Pertama)
```typescript
const headerStyle = {
  fill: { fgColor: { rgb: '4472C4' } }, // Blue
  font: { bold: true, color: { rgb: 'FFFFFF' }, sz: 11 },
  alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
  border: borderStyle,
};
```

### 3. Category Header Style (Jika Ada Kategori)
```typescript
const categoryStyle = {
  fill: { fgColor: { rgb: 'FFC000' } }, // Orange/Gold
  font: { bold: true, color: { rgb: '000000' }, sz: 11 },
  alignment: { horizontal: 'center', vertical: 'center' },
  border: borderStyle,
};
```

### 4. Data Cell Style
```typescript
const dataStyle = {
  alignment: { vertical: 'center', wrapText: true },
  border: borderStyle,
};
```

### 5. Aggregation Table Header Style (Jika Ada Tabel Agregasi)
```typescript
const aggHeaderStyle = {
  fill: { fgColor: { rgb: '70AD47' } }, // Green
  font: { bold: true, color: { rgb: 'FFFFFF' }, sz: 10 },
  alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
  border: borderStyle,
};
```

## 📁 File yang Perlu Diupdate

### 1. ✅ **src/pages/PetaJabatan.tsx** - SUDAH SEMPURNA
**Status:** Sudah menggunakan `xlsx-js-style` dengan styling lengkap
**Fitur Export:**
- ✅ Export Peta Jabatan ASN per unit (handleExportASN) - **PERLU STYLING**
- ✅ Export Formasi Non-ASN per unit (handleExportNonASN) - **PERLU STYLING**
- ✅ Export Summary ASN (handleExportSummary) - **PERLU STYLING**
- ✅ Export Summary Non-ASN (handleExportSummaryNonASN) - **PERLU STYLING**
- ✅ Export Semua Unit (handleExportAllDepartments) - **SUDAH SEMPURNA** ⭐

### 2. 🔧 **src/pages/Employees.tsx** - PERLU UPDATE
**Status:** Menggunakan `xlsx` biasa (bukan `xlsx-js-style`)
**Fitur Export:**
- Export data pegawai dengan multiple sheets
**Yang Perlu Ditambahkan:**
- Import `xlsx-js-style` instead of `xlsx`
- Tambahkan border pada semua cell
- Tambahkan header styling (biru dengan teks putih)
- Tambahkan column width optimal
- Tambahkan text alignment

### 3. 🔧 **src/pages/DataBuilder.tsx** - PERLU UPDATE
**Status:** Menggunakan `xlsx` biasa
**Fitur Export:**
- Export query builder results dengan multiple sheets
- Export related tables
- Export statistics
**Yang Perlu Ditambahkan:**
- Import `xlsx-js-style` instead of `xlsx`
- Tambahkan border pada semua cell
- Tambahkan header styling (biru dengan teks putih)
- Tambahkan column width optimal
- Tambahkan text alignment untuk semua sheets

### 4. 🔧 **src/components/data-builder/QuickAggregation.tsx** - PERLU UPDATE
**Status:** Menggunakan `xlsx` biasa
**Fitur Export:**
- Export agregasi cepat dengan multiple sheets (12 sheets)
- Tabel ringkasan, detail per unit, dan breakdown
**Yang Perlu Ditambahkan:**
- Import `xlsx-js-style` instead of `xlsx`
- Tambahkan border pada semua cell
- Tambahkan header styling (biru dengan teks putih)
- Tambahkan aggregation table styling (hijau untuk header)
- Tambahkan column width optimal
- Tambahkan text alignment untuk semua sheets

### 5. ℹ️ **src/pages/Import.tsx** - TEMPLATE ONLY
**Status:** Hanya download template (tidak perlu styling fancy)
**Catatan:** Template import sebaiknya tetap simple agar mudah diisi user

### 6. ℹ️ **src/pages/ImportNonAsn.tsx** - TEMPLATE ONLY
**Status:** Hanya download template (tidak perlu styling fancy)
**Catatan:** Template import sebaiknya tetap simple agar mudah diisi user

## 🔄 Urutan Implementasi (Prioritas)

### Priority 1: PetaJabatan.tsx - Export Functions yang Belum Styled
**Estimasi:** 2-3 jam
- [ ] handleExportASN() - Export per unit ASN
- [ ] handleExportNonASN() - Export per unit Non-ASN
- [ ] handleExportSummary() - Export summary ASN (4 sheets)
- [ ] handleExportSummaryNonASN() - Export summary Non-ASN (3 sheets)

### Priority 2: DataBuilder.tsx
**Estimasi:** 2-3 jam
- [ ] Update import dari `xlsx` ke `xlsx-js-style`
- [ ] Tambahkan styling helper functions
- [ ] Apply styling ke main data sheet
- [ ] Apply styling ke related tables sheets
- [ ] Apply styling ke statistics sheets

### Priority 3: QuickAggregation.tsx
**Estimasi:** 2-3 jam
- [ ] Update import dari `xlsx` ke `xlsx-js-style`
- [ ] Tambahkan styling helper functions
- [ ] Apply styling ke 12 sheets (ringkasan + detail per unit + breakdown)
- [ ] Tambahkan aggregation table styling

### Priority 4: Employees.tsx
**Estimasi:** 1-2 jam
- [ ] Update import dari `xlsx` ke `xlsx-js-style`
- [ ] Tambahkan styling helper functions
- [ ] Apply styling ke data pegawai sheet
- [ ] Apply styling ke related sheets

## 🛠️ Helper Functions yang Akan Dibuat

Untuk menghindari duplikasi kode, kita akan membuat helper functions di file terpisah:

**File:** `src/lib/excelStyles.ts`

```typescript
import type { CellStyle } from 'xlsx-js-style';

export const borderStyle = {
  top: { style: 'thin', color: { rgb: '000000' } },
  bottom: { style: 'thin', color: { rgb: '000000' } },
  left: { style: 'thin', color: { rgb: '000000' } },
  right: { style: 'thin', color: { rgb: '000000' } },
} as const;

export const headerStyle: CellStyle = {
  fill: { fgColor: { rgb: '4472C4' } },
  font: { bold: true, color: { rgb: 'FFFFFF' }, sz: 11 },
  alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
  border: borderStyle,
};

export const categoryStyle: CellStyle = {
  fill: { fgColor: { rgb: 'FFC000' } },
  font: { bold: true, color: { rgb: '000000' }, sz: 11 },
  alignment: { horizontal: 'center', vertical: 'center' },
  border: borderStyle,
};

export const dataStyle: CellStyle = {
  alignment: { vertical: 'center', wrapText: true },
  border: borderStyle,
};

export const aggHeaderStyle: CellStyle = {
  fill: { fgColor: { rgb: '70AD47' } },
  font: { bold: true, color: { rgb: 'FFFFFF' }, sz: 10 },
  alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
  border: borderStyle,
};

export const aggDataStyle: CellStyle = {
  alignment: { horizontal: 'center', vertical: 'center' },
  border: borderStyle,
};

export const aggLabelStyle: CellStyle = {
  font: { bold: true, sz: 10 },
  alignment: { horizontal: 'left', vertical: 'center' },
  border: borderStyle,
};

/**
 * Apply styling to all cells in a worksheet
 * @param ws - Worksheet object
 * @param headerRow - Row index for header (default: 0)
 * @param categoryRows - Array of row indices for category headers (optional)
 */
export function applyWorksheetStyling(
  ws: XLSX.WorkSheet,
  options: {
    headerRow?: number;
    categoryRows?: number[];
    startRow?: number;
    endRow?: number;
    startCol?: number;
    endCol?: number;
  } = {}
) {
  const {
    headerRow = 0,
    categoryRows = [],
    startRow,
    endRow,
    startCol,
    endCol,
  } = options;

  const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
  const sRow = startRow ?? range.s.r;
  const eRow = endRow ?? range.e.r;
  const sCol = startCol ?? range.s.c;
  const eCol = endCol ?? range.e.c;

  for (let R = sRow; R <= eRow; ++R) {
    const isCategoryRow = categoryRows.includes(R);

    for (let C = sCol; C <= eCol; ++C) {
      const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });

      if (ws[cellAddress]) {
        if (R === headerRow) {
          ws[cellAddress].s = headerStyle;
        } else if (isCategoryRow) {
          ws[cellAddress].s = categoryStyle;
        } else {
          ws[cellAddress].s = dataStyle;
        }
      }
    }
  }
}

/**
 * Apply styling to aggregation table
 * @param ws - Worksheet object
 * @param startRow - Starting row of aggregation table
 * @param endRow - Ending row of aggregation table
 * @param headerRows - Array of row indices for aggregation headers
 * @param labelCol - Column index for labels (default: 0)
 */
export function applyAggregationStyling(
  ws: XLSX.WorkSheet,
  startRow: number,
  endRow: number,
  headerRows: number[],
  labelCol: number = 0
) {
  const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');

  for (let R = startRow; R <= endRow; ++R) {
    const isHeaderRow = headerRows.includes(R);

    for (let C = range.s.c; C <= range.e.c; ++C) {
      const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });

      if (ws[cellAddress]) {
        if (isHeaderRow) {
          ws[cellAddress].s = aggHeaderStyle;
        } else if (C === labelCol) {
          ws[cellAddress].s = aggLabelStyle;
        } else {
          ws[cellAddress].s = aggDataStyle;
        }
      }
    }
  }
}
```

## 📝 Checklist Implementasi

### Phase 1: Setup Helper Functions
- [ ] Buat file `src/lib/excelStyles.ts`
- [ ] Implementasi semua style constants
- [ ] Implementasi helper functions
- [ ] Test helper functions

### Phase 2: Update PetaJabatan.tsx
- [ ] Update handleExportASN()
- [ ] Update handleExportNonASN()
- [ ] Update handleExportSummary()
- [ ] Update handleExportSummaryNonASN()
- [ ] Test semua export functions

### Phase 3: Update DataBuilder.tsx
- [ ] Update import statement
- [ ] Apply styling ke main sheet
- [ ] Apply styling ke related tables
- [ ] Apply styling ke statistics
- [ ] Test export dengan berbagai query

### Phase 4: Update QuickAggregation.tsx
- [ ] Update import statement
- [ ] Apply styling ke semua 12 sheets
- [ ] Test export dengan berbagai agregasi

### Phase 5: Update Employees.tsx
- [ ] Update import statement
- [ ] Apply styling ke semua sheets
- [ ] Test export data pegawai

### Phase 6: Testing & Verification
- [ ] Test semua export functions di semua pages
- [ ] Verify styling consistency
- [ ] Verify file size (dengan compression)
- [ ] Verify compatibility dengan Excel/LibreOffice
- [ ] User acceptance testing

## 🎨 Contoh Before & After

### Before (Tanpa Styling)
```
┌─────────────────────────────────┐
│ No │ Nama │ Jabatan │ Unit     │  <- Plain text, no color
├─────────────────────────────────┤
│ 1  │ John │ Staff   │ IT       │  <- No border
│ 2  │ Jane │ Manager │ HR       │
└─────────────────────────────────┘
```

### After (Dengan Styling)
```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ No │ Nama │ Jabatan │ Unit     ┃  <- Blue header, white text, bold
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
┃ 1  │ John │ Staff   │ IT       ┃  <- Border on all cells
┃ 2  │ Jane │ Manager │ HR       ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
```

## 📊 Estimasi Total Waktu

| Phase | Estimasi | Status |
|-------|----------|--------|
| Phase 1: Helper Functions | 1 jam | ⏳ Pending |
| Phase 2: PetaJabatan.tsx | 2-3 jam | ⏳ Pending |
| Phase 3: DataBuilder.tsx | 2-3 jam | ⏳ Pending |
| Phase 4: QuickAggregation.tsx | 2-3 jam | ⏳ Pending |
| Phase 5: Employees.tsx | 1-2 jam | ⏳ Pending |
| Phase 6: Testing | 2 jam | ⏳ Pending |
| **TOTAL** | **10-14 jam** | ⏳ Pending |

## 🚀 Manfaat Setelah Implementasi

1. ✅ **Konsistensi Visual** - Semua export memiliki tampilan yang sama
2. ✅ **Profesional** - File Excel terlihat lebih profesional dan mudah dibaca
3. ✅ **User Experience** - User tidak perlu format manual lagi
4. ✅ **Branding** - Warna dan styling yang konsisten mencerminkan brand aplikasi
5. ✅ **Maintainability** - Helper functions membuat kode lebih mudah di-maintain
6. ✅ **Reusability** - Style dapat digunakan kembali untuk fitur export baru

## 📌 Catatan Penting

1. **Package Dependency:** Pastikan semua file menggunakan `xlsx-js-style` bukan `xlsx` biasa
2. **Performance:** Styling tidak signifikan mempengaruhi performa karena sudah menggunakan compression
3. **Compatibility:** `xlsx-js-style` kompatibel dengan Excel 2007+ dan LibreOffice
4. **File Size:** Dengan compression, file size tetap optimal meskipun ada styling
5. **Browser Support:** Semua modern browsers support (Chrome, Firefox, Safari, Edge)

---

**Dibuat:** 11 Mei 2026
**Status:** 📋 Planning Phase
**Next Action:** Mulai implementasi Phase 1 (Helper Functions)
