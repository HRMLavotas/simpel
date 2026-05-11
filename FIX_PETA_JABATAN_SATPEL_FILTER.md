# Fix Peta Jabatan untuk Satuan Pelayanan

## Problem
Ketika admin Satpel (misalnya "Satuan Pelayanan Palu") membuka menu Peta Jabatan, yang ditampilkan adalah **semua peta jabatan dari unit pembina** (BBPVP Makassar), bukan hanya jabatan dari pegawai yang ditugaskan di Satpel tersebut.

### Contoh Masalah
- Admin Satuan Pelayanan Palu login
- Buka menu Peta Jabatan
- **Yang muncul**: Semua 50+ jabatan dari BBPVP Makassar
- **Yang seharusnya**: Hanya jabatan dari 8 pegawai yang ditugaskan di Satpel Palu

## Root Cause

Di file `src/pages/PetaJabatan.tsx`, line 268-305:

**✅ Employees sudah di-filter dengan benar:**
```typescript
const filteredEmployees = activeSatpelFilter
  ? rawEmployees.filter(emp => {
      // Filter by satuan_kerja_penugasan
      return emp.satuan_kerja_penugasan === activeSatpelFilter;
    })
  : rawEmployees;
```

**❌ Positions TIDAK di-filter:**
```typescript
setPositions(posRes.data || []); // ← Set SEMUA positions dari unit pembina
```

Akibatnya:
- Employees: hanya 8 pegawai di Satpel Palu ✅
- Positions: 50+ jabatan dari BBPVP Makassar ❌
- Peta Jabatan menampilkan banyak jabatan kosong yang tidak relevan

## Solution Applied

### 1. Filter Positions Berdasarkan Employees yang Ada

Tambahkan filter untuk `positions` agar hanya menampilkan jabatan yang **benar-benar ada pegawainya** di Satpel tersebut:

```typescript
// Filter positions: for Satpel, only show positions that have employees assigned
// This ensures Peta Jabatan only shows actual positions filled in the Satpel
const allPositions = posRes.data || [];
const filteredPositions = activeSatpelFilter
  ? allPositions.filter(pos => {
      // Check if any employee in this Satpel has this position
      return filteredEmployees.some(emp => 
        normalizeString(emp.position_name || '') === normalizeString(pos.position_name)
      );
    })
  : allPositions;

setPositions(filteredPositions);
```

### 2. Refactor Normalization Function

Extract normalization function untuk reuse:

```typescript
const normalizeForComparison = (name: string) => {
  return name.replace(/^Satpel\s+/, 'Satuan Pelayanan ');
};
```

### 3. Update Debug Logging

Tambahkan logging untuk positions filter:

```typescript
logger.debug('Positions loaded (before Satpel filter):', posRes.data?.length || 0);
logger.debug('Positions loaded (after Satpel filter):', filteredPositions.length);
logger.debug('Employees loaded (before Satpel filter):', empRes.data?.length || 0);
logger.debug('Employees loaded (after Satpel filter):', filteredEmployees.length);
logger.debug('Non-ASN loaded (before filter):', nonAsnRes.data?.length || 0);
logger.debug('Non-ASN loaded (after filter):', filteredNonAsnEmployees.length);
```

## Changes Made

### File: `src/pages/PetaJabatan.tsx`

**Lines 268-305**: Updated `fetchData` function

**Before:**
```typescript
setPositions(posRes.data || []); // No filter

const filteredEmployees = activeSatpelFilter
  ? rawEmployees.filter(emp => { /* filter logic */ })
  : rawEmployees;
```

**After:**
```typescript
// Extract normalization function
const normalizeForComparison = (name: string) => {
  return name.replace(/^Satpel\s+/, 'Satuan Pelayanan ');
};

// Filter employees
const filteredEmployees = activeSatpelFilter
  ? rawEmployees.filter(emp => { /* filter logic */ })
  : rawEmployees;

// Filter positions based on filtered employees
const allPositions = posRes.data || [];
const filteredPositions = activeSatpelFilter
  ? allPositions.filter(pos => {
      return filteredEmployees.some(emp => 
        normalizeString(emp.position_name || '') === normalizeString(pos.position_name)
      );
    })
  : allPositions;

setPositions(filteredPositions);
```

## Expected Results

### Before Fix
**Satuan Pelayanan Palu** (8 pegawai):
- Positions shown: 50+ jabatan (semua dari BBPVP Makassar)
- Employees shown: 8 pegawai ✅
- Result: Banyak jabatan kosong tidak relevan

### After Fix
**Satuan Pelayanan Palu** (8 pegawai):
- Positions shown: ~5-8 jabatan (hanya yang ada pegawainya) ✅
- Employees shown: 8 pegawai ✅
- Result: Hanya jabatan yang relevan dan terisi

## Logic Flow

```
1. Fetch all positions from unit pembina (BBPVP Makassar)
   └─> posRes.data = [50+ positions]

2. Fetch all employees from unit pembina
   └─> empRes.data = [230 employees]

3. Filter employees by satuan_kerja_penugasan
   └─> filteredEmployees = [8 employees in Satpel Palu]

4. Filter positions: only keep positions that have employees ⭐ NEW
   └─> filteredPositions = [5-8 positions with employees in Satpel Palu]

5. Display filtered data
   └─> Peta Jabatan shows only relevant positions
```

## Benefits

✅ **Relevant Data Only**: Satpel hanya melihat jabatan yang ada pegawainya  
✅ **Cleaner UI**: Tidak ada jabatan kosong yang membingungkan  
✅ **Better UX**: Admin Satpel fokus pada data yang relevan  
✅ **Consistent Logic**: Positions dan employees di-filter dengan cara yang sama  
✅ **Performance**: Lebih sedikit data yang di-render di UI  

## Testing Checklist

- [ ] Login sebagai admin unit pembina (e.g., BBPVP Makassar)
  - [ ] Peta Jabatan menampilkan semua jabatan unit pembina ✅
  
- [ ] Login sebagai admin Satpel (e.g., Satuan Pelayanan Palu)
  - [ ] Peta Jabatan hanya menampilkan jabatan yang ada pegawainya ✅
  - [ ] Jumlah positions sesuai dengan jumlah unique jabatan dari employees ✅
  - [ ] Tidak ada jabatan kosong yang tidak relevan ✅
  
- [ ] Switch between different Satpel
  - [ ] Each Satpel shows only their own positions ✅
  
- [ ] Tab Non-ASN
  - [ ] Same filter logic applies ✅

## Example Data

### Satuan Pelayanan Palu (8 pegawai)

**Employees:**
1. Andri - Teknisi
2. Azam - Teknisi
3. Fuad - Teknisi
4. Jefry - Teknisi
5. Mohammad Yusrin - Teknisi
6. Nola Anisa - Teknisi
7. Rinaldin - Teknisi
8. Ronaldiansyah - Teknisi

**Positions shown (after fix):**
- Teknisi (8 pegawai)
- (Hanya jabatan yang benar-benar ada pegawainya)

**Positions NOT shown:**
- Kepala Satpel (tidak ada pegawai dengan jabatan ini)
- Instruktur (tidak ada pegawai dengan jabatan ini)
- Dll. (semua jabatan lain dari BBPVP Makassar yang tidak terisi)

## Related Files

- `src/pages/PetaJabatan.tsx` - Main fix applied here
- `src/lib/utils.ts` - `normalizeString` function used for comparison
- `MIGRATE_NON_ASN_TO_UNIT_PEMBINA_SUMMARY.md` - Context on data structure
- `FIX_TAB_COUNTS_EMPLOYEES_PAGE.md` - Related filter fix

## Status

✅ **COMPLETED** - Peta Jabatan now filters positions based on employees assigned to Satpel

## Notes

- Filter hanya berlaku untuk Satpel/Workshop (when `activeSatpelFilter` is set)
- Unit pembina tetap menampilkan semua positions (no filter)
- Filter menggunakan `normalizeString` untuk case-insensitive comparison
- Filter check: `emp.position_name` matches `pos.position_name`
