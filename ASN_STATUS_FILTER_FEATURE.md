# Fitur Filter Status ASN di Dashboard - 2 April 2026

## Overview

Menambahkan filter Status ASN di Dashboard untuk memisahkan data ASN (PNS + PPPK) dan Non ASN. Ini penting karena data jenjang pendidikan dan statistik lainnya perlu dibedakan berdasarkan status kepegawaian.

## Motivasi

Sebelumnya, dashboard menampilkan semua pegawai tanpa membedakan status ASN. Ini menyebabkan:
- Data jenjang pendidikan tercampur antara ASN dan Non ASN
- Tidak bisa melihat distribusi khusus untuk ASN saja
- Analisis data kurang akurat untuk keperluan perencanaan SDM ASN

## Implementasi

### 1. UI Filter di Dashboard

Menambahkan dropdown filter Status ASN di samping filter Unit Kerja:

```tsx
<Select value={selectedAsnStatus} onValueChange={setSelectedAsnStatus}>
  <SelectTrigger className="w-full sm:w-[200px] h-9 sm:h-10">
    <SelectValue placeholder="Status ASN" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="all">Semua Status</SelectItem>
    <SelectItem value="asn">ASN (PNS + PPPK)</SelectItem>
    <SelectItem value="PNS">PNS</SelectItem>
    <SelectItem value="PPPK">PPPK</SelectItem>
    <SelectItem value="Non ASN">Non ASN</SelectItem>
  </SelectContent>
</Select>
```

**Opsi Filter:**
- **Semua Status**: Menampilkan semua pegawai (default)
- **ASN (PNS + PPPK)**: Hanya pegawai ASN (gabungan PNS dan PPPK)
- **PNS**: Hanya Pegawai Negeri Sipil
- **PPPK**: Hanya Pegawai Pemerintah dengan Perjanjian Kerja
- **Non ASN**: Hanya pegawai Non ASN

### 2. Backend Logic di useDashboardData

#### Helper Functions

```typescript
// Get ASN status filter
const getAsnStatusFilter = useCallback(() => {
  if (selectedAsnStatus === 'all') return null;
  if (selectedAsnStatus === 'asn') return ['PNS', 'PPPK']; // ASN includes both
  return [selectedAsnStatus]; // Single status
}, [selectedAsnStatus]);

// Apply ASN status filter to query
const applyAsnStatusFilter = useCallback((query: any) => {
  const asnFilter = getAsnStatusFilter();
  if (asnFilter) {
    return query.in('asn_status', asnFilter);
  }
  return query;
}, [getAsnStatusFilter]);
```

#### Updated Cache Key

Cache key sekarang include ASN status untuk menghindari cache collision:

```typescript
const getCacheKey = useCallback((dataType: string) => {
  const filter = getDepartmentFilter() || 'all';
  const asnFilter = selectedAsnStatus || 'all';
  return `${dataType}_${filter}_${asnFilter}`;
}, [getDepartmentFilter, selectedAsnStatus]);
```

### 3. Apply Filter ke Semua Fetch Functions

Semua fetch functions di-update untuk apply ASN status filter:

**Functions Updated:**
- ✅ `fetchStats` - Total pegawai, PNS, PPPK, Non ASN
- ✅ `fetchRankData` - Distribusi golongan
- ✅ `fetchPositionTypeData` - Jenis jabatan
- ✅ `fetchJoinYearData` - Tahun bergabung
- ✅ `fetchGenderData` - Jenis kelamin
- ✅ `fetchReligionData` - Agama
- ✅ `fetchEducationData` - Jenjang pendidikan (PENTING!)
- ⚠️ `fetchDepartmentData` - Tidak perlu filter (sudah per department)
- ⚠️ `fetchPositionKepmenData` - Perlu review (jabatan ASN vs Non ASN)
- ⚠️ `fetchTmtCpnsData` - Hanya relevan untuk PNS
- ⚠️ `fetchTmtPnsData` - Hanya relevan untuk PNS
- ⚠️ `fetchWorkDurationData` - Perlu review
- ⚠️ `fetchGradeData` - Perlu review
- ⚠️ `fetchAgeData` - Bisa untuk semua
- ⚠️ `fetchRetirementYearData` - Hanya relevan untuk ASN

**Contoh Implementation:**

```typescript
const fetchEducationData = useCallback(async () => {
  const deptFilter = getDepartmentFilter();
  
  let employeeQuery = supabase
    .from('employees')
    .select('id')
    .range(offset, offset + PAGE_SIZE - 1);
  
  // Apply department filter
  if (deptFilter) {
    employeeQuery = employeeQuery.eq('department', deptFilter);
  }

  // Apply ASN status filter
  employeeQuery = applyAsnStatusFilter(employeeQuery);
  
  // ... rest of the logic
}, [getDepartmentFilter, selectedAsnStatus, applyAsnStatusFilter]);
```

## Use Cases

### 1. Analisis Jenjang Pendidikan ASN

**Sebelum:**
- Data pendidikan tercampur ASN dan Non ASN
- Tidak bisa melihat distribusi pendidikan khusus ASN

**Sesudah:**
- Pilih filter "ASN (PNS + PPPK)"
- Lihat distribusi jenjang pendidikan khusus untuk ASN
- Analisis lebih akurat untuk perencanaan pengembangan SDM ASN

### 2. Perbandingan PNS vs PPPK

**Use Case:**
- Bandingkan distribusi jenjang pendidikan PNS vs PPPK
- Analisis perbedaan karakteristik kedua kelompok

**Cara:**
1. Pilih filter "PNS" → Lihat data PNS
2. Pilih filter "PPPK" → Lihat data PPPK
3. Bandingkan hasilnya

### 3. Monitoring Non ASN

**Use Case:**
- Lihat karakteristik pegawai Non ASN
- Analisis untuk perencanaan konversi ke ASN

**Cara:**
- Pilih filter "Non ASN"
- Lihat distribusi pendidikan, usia, dll

## Benefits

1. **Data Lebih Akurat**: Pemisahan ASN dan Non ASN memberikan analisis yang lebih tepat
2. **Fleksibilitas Analisis**: Bisa melihat data per kategori atau gabungan
3. **Perencanaan SDM**: Memudahkan perencanaan pengembangan SDM ASN
4. **Compliance**: Memenuhi kebutuhan pelaporan yang membedakan ASN dan Non ASN

## Technical Details

### State Management

```typescript
const [selectedAsnStatus, setSelectedAsnStatus] = useState<string>('all');
```

### Props Interface

```typescript
interface UseDashboardDataProps {
  department: string | null;
  isAdminPusat: boolean;
  selectedDepartment: string;
  selectedAsnStatus: string; // New
}
```

### Filter Logic

```typescript
// ASN filter returns array of statuses to include
getAsnStatusFilter():
  - 'all' → null (no filter)
  - 'asn' → ['PNS', 'PPPK']
  - 'PNS' → ['PNS']
  - 'PPPK' → ['PPPK']
  - 'Non ASN' → ['Non ASN']

// Apply to query using .in() operator
query.in('asn_status', asnFilter)
```

## Future Improvements

### 1. Chart-Specific Filters

Beberapa chart mungkin perlu logic khusus:

**TMT CPNS/PNS:**
- Hanya relevan untuk PNS
- Bisa auto-filter ke PNS saat chart ini dipilih

**Tahun Pensiun:**
- Hanya relevan untuk ASN
- Bisa auto-filter ke ASN saat chart ini dipilih

**Grade Jabatan:**
- Perlu review apakah Non ASN punya grade

### 2. Filter Presets

Tambahkan preset filter untuk use case umum:
- "ASN Aktif" (PNS + PPPK, exclude yang akan pensiun)
- "Calon Pensiun" (ASN yang akan pensiun dalam 2 tahun)
- "Pegawai Baru" (Bergabung dalam 1 tahun terakhir)

### 3. Filter Combination Logic

Tambahkan logic untuk kombinasi filter yang tidak valid:
- Jika pilih chart "TMT CPNS" → auto-filter ke PNS
- Jika pilih chart "Tahun Pensiun" → auto-filter ke ASN
- Show warning jika kombinasi filter tidak menghasilkan data

### 4. Save Filter Preferences

Save filter preferences ke database:
```typescript
dashboard_preferences: {
  charts: string[],
  defaultAsnStatus: string, // New
  defaultDepartment: string  // New
}
```

## Testing Checklist

### Manual Testing

- [x] Filter "Semua Status" menampilkan semua pegawai
- [x] Filter "ASN (PNS + PPPK)" hanya menampilkan PNS dan PPPK
- [x] Filter "PNS" hanya menampilkan PNS
- [x] Filter "PPPK" hanya menampilkan PPPK
- [x] Filter "Non ASN" hanya menampilkan Non ASN
- [x] Kombinasi filter Unit Kerja + ASN Status bekerja
- [x] Data jenjang pendidikan ter-filter dengan benar
- [x] Stats cards update sesuai filter
- [x] Cache key berbeda untuk setiap kombinasi filter

### Edge Cases

- [ ] Unit kerja tanpa ASN
- [ ] Unit kerja tanpa Non ASN
- [ ] Filter ASN tapi tidak ada data pendidikan
- [ ] Performa dengan dataset besar

### Regression Testing

- [ ] Filter Unit Kerja masih berfungsi normal
- [ ] Chart lain tidak terpengaruh
- [ ] Mobile responsive
- [ ] Loading states

## Files Modified

1. **src/pages/Dashboard.tsx**
   - Added `selectedAsnStatus` state
   - Added ASN status filter UI
   - Pass `selectedAsnStatus` to `useDashboardData`

2. **src/hooks/useDashboardData.ts**
   - Added `selectedAsnStatus` to props interface
   - Added `getAsnStatusFilter` helper
   - Added `applyAsnStatusFilter` helper
   - Updated cache key to include ASN status
   - Applied ASN filter to all relevant fetch functions

3. **ASN_STATUS_FILTER_FEATURE.md** (this file)
   - Complete documentation

## Deployment Notes

1. Test dengan berbagai kombinasi filter
2. Verify data accuracy dengan query manual
3. Monitor performance dengan filter aktif
4. Check cache behavior
5. Verify dengan user (admin pusat dan admin pimpinan)

## Conclusion

Fitur filter Status ASN memberikan fleksibilitas analisis yang lebih baik dan data yang lebih akurat. Implementasi menggunakan helper functions yang reusable dan cache-aware untuk performance optimal.

**Key Achievement:**
- ✅ Data jenjang pendidikan sekarang bisa difilter berdasarkan status ASN
- ✅ Analisis lebih akurat untuk perencanaan SDM
- ✅ UI yang intuitif dan mudah digunakan
- ✅ Performance optimal dengan caching
