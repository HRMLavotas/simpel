# Dashboard - Summary Peta Jabatan dengan Toggle View

## Status: ✅ SELESAI

## Deskripsi
Menambahkan fitur toggle view pada card "Summary Peta Jabatan ASN" di Dashboard untuk menampilkan data dalam dua format berbeda:
1. **Per Jabatan** - Menampilkan data per jabatan (implementasi existing)
2. **Per Unit Kerja** - Menampilkan data agregasi per unit kerja

## Implementasi

### 1. Update Interface `PetaJabatanStat`
**File**: `src/hooks/usePetaJabatanStats.ts`

Menambahkan field opsional untuk mendukung view per unit kerja:
```typescript
export interface PetaJabatanStat {
  position_name: string;
  position_category?: string;  // ✅ BARU
  department?: string;          // ✅ BARU
  abk: number;
  existing_pns: number;
  existing_pppk: number;
  total_existing: number;
  gap: number;
}
```

### 2. Update Data Fetching
**File**: `src/hooks/usePetaJabatanStats.ts`

Mengupdate query untuk mengambil field tambahan:
- Query position_references: menambahkan `position_category` dan `department`
- Query employees: menambahkan `department`
- Menyimpan field tambahan ke dalam state

### 3. Komponen `PetaJabatanAsnTable` dengan Tabs
**File**: `src/components/dashboard/PetaJabatanCharts.tsx`

#### Fitur Utama:
- **State Management**: `viewMode` untuk toggle antara 'position' dan 'department'
- **Tabs Component**: Menggunakan Shadcn Tabs dengan icon Briefcase dan Building
- **Data Aggregation**: Mengelompokkan data per department dengan perhitungan otomatis

#### View "Per Jabatan":
- Menampilkan data per jabatan (existing implementation)
- Kolom: No, Nama Jabatan, ABK Target, PNS/CPNS, PPPK, Total Eksisting, Kekurangan
- Status kekurangan:
  - Gap > 0: "-X" (red/destructive) - Kurang pegawai
  - Gap < 0: "Lebih X" (blue) - Lebih pegawai dari ABK
  - Gap = 0: "Terpenuhi" (green) - Sesuai ABK
- Responsive: Card layout untuk mobile, table untuk desktop

#### View "Per Unit Kerja":
- Agregasi data per department
- Kolom: No, Unit Kerja, Jumlah Jabatan, ABK Target, PNS/CPNS, PPPK, Total Eksisting, Status
- Menampilkan persentase terisi
- Badge status dengan color coding:
  - Orange: Kurang pegawai
  - Blue: Lebih pegawai
  - Green: Sesuai ABK

### 4. Summary Badges
Menampilkan 3 badge di atas tabs dengan status dinamis:
- **Total ABK**: Jumlah total ABK
- **Total ASN Eksisting**: Total PNS + PPPK
- **Status Formasi**:
  - Jika gap > 0: "Kesiapan/Formasi Tersedia: X" (orange)
  - Jika gap < 0: "Lebih X dari ABK" (blue)
  - Jika gap = 0: "Sesuai ABK" (green)

## Struktur Data

### Data Agregasi Per Unit Kerja
```typescript
{
  department: string;
  abk: number;
  existing_pns: number;
  existing_pppk: number;
  total_existing: number;
  gap: number;
  count: number;  // Jumlah jabatan
}
```

### Perhitungan:
- **ABK**: Sum dari semua abk_count per department
- **Existing PNS**: Count pegawai PNS per department
- **Existing PPPK**: Count pegawai PPPK per department
- **Total Existing**: PNS + PPPK
- **Gap**: ABK - Total Existing
- **Persentase**: (Total Existing / ABK) × 100

## UI/UX

### Tabs Navigation
```
┌─────────────────────────────────────────┐
│ [📋 Per Jabatan] [🏢 Per Unit Kerja]   │
└─────────────────────────────────────────┘
```

### Status Badge Color Coding
- **Kurang (Gap > 0)**: Orange/Red background, orange/red text, menampilkan "-X"
- **Lebih (Gap < 0)**: Blue background, blue text, menampilkan "Lebih X"
- **Sesuai (Gap = 0)**: Green background, green text, menampilkan "Sesuai" atau "Terpenuhi"

### Responsive Design
- Mobile: Card layout dengan label inline
- Desktop: Table layout dengan header sticky

## Empty States
- View Per Jabatan: "Belum ada data peta jabatan untuk ditampilkan"
- View Per Unit Kerja: "Belum ada data unit kerja untuk ditampilkan"

## Konsistensi dengan Peta Jabatan
Implementasi mengikuti pola yang sama dengan tab "Summary Semua Unit" di halaman Peta Jabatan:
- Struktur data yang sama
- Perhitungan yang sama
- UI pattern yang konsisten
- Color coding yang sama

## Testing Checklist
- [x] Interface PetaJabatanStat updated dengan field opsional
- [x] Data fetching include position_category dan department
- [x] Toggle tabs berfungsi dengan baik
- [x] View Per Jabatan menampilkan data dengan benar
- [x] View Per Unit Kerja menampilkan agregasi dengan benar
- [x] Perhitungan gap dan persentase akurat
- [x] Status badge dengan color coding yang tepat
- [x] Responsive design untuk mobile dan desktop
- [x] Empty states ditampilkan dengan baik
- [x] No TypeScript diagnostics

## Files Modified
1. `src/hooks/usePetaJabatanStats.ts` - Update interface dan data fetching
2. `src/components/dashboard/PetaJabatanCharts.tsx` - Implementasi toggle view dengan tabs
3. `src/pages/Dashboard.tsx` - No changes needed (sudah menggunakan komponen yang diupdate)

## Keunggulan Implementasi
1. **Reusable**: Menggunakan data yang sama untuk kedua view
2. **Efficient**: Client-side aggregation, tidak perlu query tambahan
3. **Consistent**: Mengikuti pattern yang sudah ada di Peta Jabatan
4. **Responsive**: Optimal untuk semua ukuran layar
5. **Maintainable**: Code yang clean dan well-structured

## User Experience
- Toggle view mudah digunakan dengan tabs yang jelas
- Icon yang intuitif (Briefcase untuk jabatan, Building untuk unit kerja)
- Data agregasi membantu leadership melihat overview per unit kerja
- Detail per jabatan tetap tersedia untuk analisis mendalam
- Color coding memudahkan identifikasi status dengan cepat

---
**Tanggal**: 6 April 2026
**Status**: Implementasi selesai dan siap digunakan
