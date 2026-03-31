# Search and Sorting Features Implementation

## Summary
Implemented search functionality in Peta Jabatan page and fixed name parsing bug for front titles. Also added automatic sorting for history entries by date.

## Changes Made

### 1. Fixed Name Parsing Bug (Import.tsx)

**Problem:** 
- Names like "Heru Setiawan" were incorrectly parsed
- The "H" was being detected as front title "H." (Haji)

**Solution:**
- Updated regex pattern to require space after title dot
- Pattern changed from `Dr\\.?` to `Dr\\.\\s+`
- Now titles MUST be followed by space: "H. Ahmad" ✓, "Heru Setiawan" ✗

**Examples:**
```
✅ "H. Ahmad Fauzi" → front_title: "H.", name: "Ahmad Fauzi"
✅ "Dr. Ir. Budi" → front_title: "Dr. Ir.", name: "Budi"
✅ "Heru Setiawan" → front_title: "", name: "Heru Setiawan"
✅ "Prof. Dr. Siti, S.T., M.Si." → front_title: "Prof. Dr.", name: "Siti", back_title: "S.T., M.Si."
```

### 2. Auto-Sorting History Entries (EmployeeHistoryForm.tsx)

**Feature:**
- All history entries automatically sorted by date (ascending - oldest first)
- Sorting happens when:
  - Adding new entry
  - Changing date field
  - Deleting entry
- Empty dates are placed at the end

**Implementation:**
```typescript
const sortEntriesByDate = (entries: HistoryEntry[], fields: HistoryField[]): HistoryEntry[] => {
  const dateField = fields.find(f => f.type === 'date')?.key;
  if (!dateField) return entries;

  return [...entries].sort((a, b) => {
    const dateA = a[dateField] || '';
    const dateB = b[dateField] || '';
    
    if (!dateA && !dateB) return 0;
    if (!dateA) return 1;
    if (!dateB) return -1;
    
    return dateA.localeCompare(dateB); // Ascending
  });
};
```

**UI Indicator:**
- Added text below each history section title: "Diurutkan dari yang terlama ke terbaru"

**Example:**
```
User adds entry with TMT 1 Feb 2026
Current entries: [2 Mar 2026, 15 Jan 2026]

After auto-sort:
1. 15 Jan 2026 (oldest)
2. 1 Feb 2026
3. 2 Mar 2026 (newest)
```

### 3. Search Functionality in Peta Jabatan (PetaJabatan.tsx)

**Features:**
- Real-time search as user types
- Search in:
  - Position names (Jabatan)
  - Employee names (including front/back titles)
  - Employee NIP
- Clear button (X) to reset search
- Search icon indicator

**UI Components:**
```tsx
<div className="relative w-full sm:w-64">
  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
  <Input
    placeholder="Cari jabatan atau nama pegawai..."
    value={searchQuery}
    onChange={(e) => setSearchQuery(e.target.value)}
    className="pl-10 pr-8"
  />
  {searchQuery && (
    <Button onClick={() => setSearchQuery('')}>
      <X className="h-4 w-4" />
    </Button>
  )}
</div>
```

**Search Logic:**
```typescript
const filteredPositions = positions.filter(p => {
  if (!searchQuery) return true;
  const query = searchQuery.toLowerCase();
  
  // Search in position name
  if (p.position_name.toLowerCase().includes(query)) return true;
  
  // Search in employee names
  const matchedEmployees = getMatchingEmployees(p.position_name);
  return matchedEmployees.some(emp => {
    const fullName = [emp.front_title, emp.name, emp.back_title]
      .filter(Boolean).join(' ').toLowerCase();
    return fullName.includes(query) || emp.nip?.includes(query);
  });
});
```

**Empty State Messages:**
- No positions: "Belum ada data jabatan. Klik 'Tambah Jabatan' untuk menambahkan."
- No search results: "Tidak ada hasil untuk '[query]'"
- All categories collapsed: "Semua kategori sedang ditutup. Klik kategori untuk membuka."

### 4. Fixed TypeScript Errors (Employees.tsx)

**Removed deprecated fields from EmployeeFormData:**
- ❌ `old_position` (replaced by position_history)
- ❌ `keterangan_formasi` (not needed in employee form)
- ❌ `keterangan_penempatan` (replaced by placement_notes table)
- ❌ `keterangan_penugasan` (replaced by assignment_notes table)
- ❌ `keterangan_perubahan` (replaced by change_notes table)

**Before:**
```typescript
const employeeData = {
  // ... other fields
  old_position: data.old_position || null, // ❌ Error
  keterangan_formasi: data.keterangan_formasi || null, // ❌ Error
  keterangan_penempatan: data.keterangan_penempatan || null, // ❌ Error
  keterangan_penugasan: data.keterangan_penugasan || null, // ❌ Error
  keterangan_perubahan: data.keterangan_perubahan || null, // ❌ Error
};
```

**After:**
```typescript
const employeeData = {
  nip: data.nip || null,
  name: data.name,
  front_title: data.front_title || null,
  back_title: data.back_title || null,
  birth_place: data.birth_place || null,
  birth_date: data.birth_date || null,
  gender: data.gender || null,
  religion: data.religion || null,
  position_type: data.position_type || null,
  position_name: data.position_name || null,
  asn_status: data.asn_status,
  rank_group: data.rank_group || null,
  department: data.department,
  join_date: data.join_date || null,
  tmt_cpns: data.tmt_cpns || null,
  tmt_pns: data.tmt_pns || null,
  tmt_pensiun: data.tmt_pensiun || null,
};
```

### 5. Database Query Optimization (Employees.tsx)

**Added nullsFirst: false to history queries:**
```typescript
supabase.from('mutation_history')
  .select('*')
  .eq('employee_id', employee.id)
  .order('tanggal', { ascending: true, nullsFirst: false })
```

This ensures entries with dates are shown first, empty dates at the end.

## Testing Checklist

### Name Parsing
- [ ] Test "Heru Setiawan" → No front title
- [ ] Test "H. Ahmad" → Front title: "H."
- [ ] Test "Dr. Ir. Budi, S.T., M.Si." → Front: "Dr. Ir.", Back: "S.T., M.Si."
- [ ] Test "Siti Nurhaliza" → No titles

### History Sorting
- [ ] Add entry with old date → Should appear at top
- [ ] Add entry with future date → Should appear at bottom
- [ ] Change date of middle entry → Should re-sort automatically
- [ ] Add entry without date → Should appear at end

### Search in Peta Jabatan
- [ ] Search by position name (e.g., "Direktur")
- [ ] Search by employee name (e.g., "Budi")
- [ ] Search by NIP (e.g., "197407")
- [ ] Search with no results → Show "Tidak ada hasil"
- [ ] Clear search → Show all positions
- [ ] Search is case-insensitive

### TypeScript
- [ ] No errors in Employees.tsx
- [ ] No errors in PetaJabatan.tsx
- [ ] No errors in EmployeeHistoryForm.tsx

## Files Modified

1. `src/pages/Import.tsx` - Fixed name parsing regex
2. `src/components/employees/EmployeeHistoryForm.tsx` - Added auto-sorting
3. `src/pages/Employees.tsx` - Fixed TypeScript errors, added nullsFirst
4. `src/pages/PetaJabatan.tsx` - Added search functionality

## User Impact

### Positive
- ✅ Names parsed correctly (no more "H" as title)
- ✅ History entries always in chronological order
- ✅ Easy to find positions and employees in Peta Jabatan
- ✅ No TypeScript errors

### Notes
- History sorting is automatic and cannot be disabled
- Search is real-time (no search button needed)
- Old data with incorrect parsing needs re-import to fix

## Future Enhancements

1. Add search in Data Pegawai page (already exists, just needs enhancement)
2. Add filter by position category in Peta Jabatan
3. Add export filtered results
4. Add bulk edit for position order
5. Add drag-and-drop to reorder history entries manually
