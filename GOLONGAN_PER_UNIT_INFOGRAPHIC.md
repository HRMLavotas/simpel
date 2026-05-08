# Infographic Golongan ASN per Unit Kerja

## Overview
Komponen visualisasi interaktif untuk menampilkan distribusi golongan PNS (I-IV) dan PPPK (III, V, VII, IX) per unit kerja di Dashboard.

## Fitur

### 1. **4 Mode Tampilan**
- **Stacked**: Bar chart bertumpuk menampilkan semua golongan dalam satu bar per unit
- **Grouped**: Bar chart terkelompok membandingkan Jumlah PNS vs Jumlah PPPK
- **Total**: Bar chart sederhana menampilkan Total ASN per unit
- **Tabel**: Tabel lengkap dengan breakdown detail semua golongan

### 2. **Data Akurat**
- Pegawai di **Satpel/Workshop dihitung ke unit pembina** (rollup otomatis)
- Hanya menghitung pegawai **aktif** (`is_active = true`)
- Hanya ASN: PNS, CPNS, PPPK (Non ASN tidak termasuk)
- **Jumlah PNS** dan **Jumlah PPPK** dihitung langsung dari status, bukan penjumlahan golongan
  - Ini memastikan pegawai dengan `rank_group` kosong/tidak dikenali tetap terhitung

### 3. **Urutan Unit**
Unit kerja diurutkan sesuai `OFFICIAL_DEPT_ORDER`:
1. Setditjen Binalavotas
2. 6 Direktorat
3. Sekretariat BNSP
4. BBPVP (6 unit)
5. BPVP (20 unit)

Unit yang tidak ada di daftar resmi diletakkan di akhir secara alfabetis.

### 4. **Summary Badges**
- Total ASN
- Total PNS+CPNS
- Total PPPK

### 5. **Responsive Design**
- Mobile: label unit disingkat, font lebih kecil
- Desktop: label lengkap, spacing optimal
- Chart height dinamis berdasarkan jumlah unit

### 6. **Interactive Tooltip**
- Hover pada bar untuk melihat detail per golongan
- Total ASN otomatis dihitung di tooltip

## Integrasi ke Dashboard

### 1. Tambah ke Chart Categories
```typescript
{ 
  id: 'golongan_per_unit', 
  label: 'Golongan ASN per Unit', 
  description: 'Distribusi PNS Gol I–IV dan PPPK per unit kerja' 
}
```

### 2. Render di Grid
```tsx
{selectedCharts.includes('golongan_per_unit') && canViewAll && (
  <GolonganPerUnitChart 
    userDepartment={profile?.department} 
    isAdminPusat={canViewAll} 
  />
)}
```

### 3. Grid Layout
Grid menggunakan `col-span-full` untuk chart full-width:
```tsx
<div className="grid gap-6 grid-cols-1 md:grid-cols-2 [&>.col-span-full]:col-span-1 md:[&>.col-span-full]:col-span-2">
```

## Props

```typescript
interface GolonganPerUnitChartProps {
  /** Department user (untuk non-admin, filter ke unit sendiri) */
  userDepartment?: string | null;
  
  /** Apakah user admin pusat (bisa lihat semua unit) */
  isAdminPusat?: boolean;
}
```

## Data Fetching

- **Lazy loading**: Data hanya di-fetch saat komponen pertama kali di-render
- **Pagination**: Fetch 1000 records per batch untuk handle dataset besar
- **Filter**: Non-admin hanya melihat unit sendiri
- **Caching**: Data di-cache di state, tidak re-fetch kecuali reload

## Agregasi Logic

```typescript
// 1. Rollup Satpel → Pembina
const unit = getEffectiveDept(emp.department);

// 2. Hitung per golongan
if (status === 'PNS' || status === 'CPNS') {
  const gol = getPnsGolongan(emp.rank_group);
  if (gol === 'I') row.pns_I++;
  // ... dst
  row.jumlah_pns++; // Hitung langsung dari status
}

// 3. Total ASN
row.total_asn = row.jumlah_pns + row.jumlah_pppk;
```

## Color Scheme

### PNS (Blue gradient)
- Gol I:   `hsl(217, 91%, 75%)` (lightest)
- Gol II:  `hsl(217, 91%, 60%)`
- Gol III: `hsl(217, 91%, 45%)`
- Gol IV:  `hsl(217, 91%, 30%)` (darkest)

### PPPK (Green gradient)
- Gol III: `hsl(142, 76%, 65%)` (lightest)
- Gol V:   `hsl(142, 76%, 50%)`
- Gol VII: `hsl(142, 76%, 36%)`
- Gol IX:  `hsl(142, 76%, 22%)` (darkest)

## Usage Example

```tsx
import { GolonganPerUnitChart } from '@/components/dashboard/GolonganPerUnitChart';

// Di Dashboard
<GolonganPerUnitChart 
  userDepartment={profile?.department} 
  isAdminPusat={canViewAll} 
/>
```

## File Locations

- **Component**: `src/components/dashboard/GolonganPerUnitChart.tsx`
- **Integration**: `src/pages/Dashboard.tsx`
- **Constants**: `src/lib/constants.ts` (UNIT_PEMBINA_MAPPING, OFFICIAL_DEPT_ORDER)

## Dependencies

- `recharts`: Bar chart rendering
- `@/components/ui/card`: Card wrapper
- `@/components/ui/button`: Mode toggle buttons
- `@/components/ui/badge`: Summary badges
- `@/hooks/use-mobile`: Responsive detection
- `@/integrations/supabase/client`: Data fetching
- `@/lib/constants`: Unit mapping & order

## Performance

- **Initial load**: ~1-2s untuk 3000+ pegawai
- **Mode switch**: Instant (hanya re-render, tidak re-fetch)
- **Memory**: ~500KB untuk 3000 records (raw data + aggregated)

## Future Enhancements

1. **Export to Excel**: Tambah tombol export tabel ke Excel
2. **Drill-down**: Klik unit untuk lihat detail pegawai
3. **Comparison**: Bandingkan 2 unit side-by-side
4. **Trend**: Tampilkan perubahan dari bulan sebelumnya
5. **Filter by Status**: Toggle PNS/CPNS/PPPK on/off
