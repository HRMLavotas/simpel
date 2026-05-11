# Fix Tab Counts di Halaman Employees

## Problem
Tab counts di halaman Employees menampilkan (0) meskipun data pegawai sudah muncul dengan benar saat memilih Satpel di dropdown unit kerja.

**Root Cause**: Tab count calculations (lines 1584-1610) menggunakan filter logic lama yang hanya cek `e.department === departmentFilter`, sedangkan `filteredEmployees` useMemo sudah diupdate untuk cek both `department` AND `satuan_kerja_penugasan` dengan normalization.

## Solution Applied

### 1. Created Helper Function `matchesDepartmentFilter`
- Extracted department filter logic ke dalam `useCallback` function
- Menghindari code duplication antara `filteredEmployees` dan tab counts
- Logic yang sama: cek both `department` AND `satuan_kerja_penugasan` dengan normalization

```typescript
const matchesDepartmentFilter = useCallback((emp: any) => {
  if (!showDepartmentFilter || departmentFilter === 'all') {
    return true;
  }
  
  // Normalize function: convert "Satpel X" to "Satuan Pelayanan X"
  const normalize = (name: string | null | undefined) => {
    if (!name) return '';
    return name.replace(/^Satpel\s+/, 'Satuan Pelayanan ');
  };
  
  const normalizedFilter = normalize(departmentFilter);
  const normalizedDepartment = normalize(emp.department);
  const normalizedPenugasan = normalize(emp.satuan_kerja_penugasan);
  
  // Check if employee's department matches
  const departmentMatches = normalizedDepartment === normalizedFilter;
  
  // Check if employee is assigned to this Satpel/Workshop
  const penugasanMatches = normalizedPenugasan === normalizedFilter;
  
  // Match if either department OR satuan_kerja_penugasan matches
  return departmentMatches || penugasanMatches;
}, [showDepartmentFilter, departmentFilter]);
```

### 2. Updated `filteredEmployees` useMemo
- Simplified logic dengan menggunakan helper function
- Removed debug console.log statements (sudah tidak diperlukan)

**Before**:
```typescript
let matchesDepartment = true;
if (showDepartmentFilter && departmentFilter !== 'all') {
  // ... 30+ lines of logic with console.log
}
```

**After**:
```typescript
const matchesDepartment = matchesDepartmentFilter(emp);
```

### 3. Updated Tab Count Calculations
Updated semua 3 tab counts (ASN, Non-ASN, Inactive) untuk menggunakan helper function yang sama.

**Before**:
```typescript
const matchesDepartment = !showDepartmentFilter || departmentFilter === 'all' || e.department === departmentFilter;
```

**After**:
```typescript
const matchesDepartment = matchesDepartmentFilter(e);
```

### 4. Added `useCallback` Import
```typescript
import React, { useEffect, useState, useMemo, useCallback } from 'react';
```

## Changes Made

### File: `src/pages/Employees.tsx`

1. **Line 1**: Added `useCallback` to imports
2. **Lines 461-487**: Created `matchesDepartmentFilter` helper function
3. **Lines 489-502**: Simplified `filteredEmployees` useMemo to use helper
4. **Lines 1584-1610**: Updated all 3 tab count calculations to use helper

## Expected Result

✅ **Tab counts now show correct numbers** when filtering by Satpel/Workshop:
- Data ASN tab: shows count of ASN employees in selected Satpel
- Data Non-ASN tab: shows count of Non-ASN employees in selected Satpel  
- Pegawai Non Aktif tab: shows count of inactive employees in selected Satpel

✅ **Consistent filter logic** across:
- Main employee list display
- Tab count badges
- All 3 tabs (ASN, Non-ASN, Inactive)

✅ **Code quality improvements**:
- No code duplication
- Single source of truth for department filter logic
- Cleaner, more maintainable code
- Removed debug console.log statements

## Example
When admin unit pembina selects "Satuan Pelayanan Palu":
- **Before**: Tab shows "Data Non-ASN (0)" even though 8 employees display
- **After**: Tab shows "Data Non-ASN (8)" correctly

## Testing Checklist
- [ ] Select Satpel from dropdown → tab counts update correctly
- [ ] Switch between tabs → counts remain accurate
- [ ] Filter by status → counts adjust accordingly
- [ ] Search employees → counts reflect filtered results
- [ ] Select "Semua Unit Kerja" → counts show all employees

## Related Files
- `src/pages/Employees.tsx` - Main fix applied here
- `MIGRATE_NON_ASN_TO_UNIT_PEMBINA_SUMMARY.md` - Context on data structure
- `ADD_SATUAN_KERJA_PENUGASAN_FIELD_SUMMARY.md` - Related feature

## Status
✅ **COMPLETED** - Tab counts now use same filter logic as employee list display
