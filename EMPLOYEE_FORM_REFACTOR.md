# Employee Form Refactor - Keterangan Fields

## Changes Made

### 1. Removed Fields
- ❌ **Jabatan Lama** (old_position) - Redundant karena sudah ada "Riwayat Jabatan"
- ❌ **Keterangan Formasi** (keterangan_formasi) - Tidak diperlukan di form pegawai, hanya di peta jabatan

### 2. New Dynamic Keterangan Fields
Mengubah 3 field keterangan dari single input menjadi dynamic list dengan tombol +Tambah:

- ✅ **Keterangan Penempatan** → Dynamic list (placement_notes)
- ✅ **Keterangan Penugasan Tambahan** → Dynamic list (assignment_notes)  
- ✅ **Keterangan Perubahan** → Dynamic list (change_notes)

### 3. New Component: NotesForm
Created `src/components/employees/NotesForm.tsx` - Komponen reusable untuk dynamic notes list.

**Features:**
- Tombol +Tambah untuk menambah note baru
- Tombol Trash untuk menghapus note
- Textarea untuk input note (multi-line)
- Numbered entries (#1, #2, #3, ...)
- Empty state message

**Usage:**
```tsx
<NotesForm
  title="Keterangan Penempatan"
  entries={placementNotes}
  onChange={setPlacementNotes}
  placeholder="Contoh: Ditempatkan di Subbag Kepegawaian sejak 2020"
/>
```

### 4. Database Migration
Created `supabase/migrations/20260331180000_add_employee_notes_tables.sql`

**New Tables:**
- `placement_notes` - Keterangan Penempatan
- `assignment_notes` - Keterangan Penugasan Tambahan
- `change_notes` - Keterangan Perubahan

**Schema:**
```sql
CREATE TABLE placement_notes (
  id UUID PRIMARY KEY,
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  note TEXT NOT NULL,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

**Migration Features:**
- Auto-migrate existing data from old single-value fields
- RLS policies for authenticated users
- Indexes for performance
- Cascade delete when employee is deleted
- Old columns kept for backward compatibility (can be removed later)

### 5. Updated Files

#### `src/components/employees/EmployeeFormModal.tsx`
- Removed `old_position` field from schema and form
- Removed `keterangan_formasi` field from schema and form
- Removed `keterangan_penempatan`, `keterangan_penugasan`, `keterangan_perubahan` from schema
- Added state for 3 notes arrays: `placementNotes`, `assignmentNotes`, `changeNotes`
- Added NotesForm components for each keterangan type
- Updated `EmployeeFormData` type to include notes arrays
- Updated `handleSubmit` to include notes in submission
- Added props for initial notes data

#### `src/components/employees/NotesForm.tsx` (NEW)
- Reusable component for dynamic notes list
- Similar pattern to EmployeeHistoryForm but simpler (single textarea)
- Add/remove functionality
- Numbered entries with delete button

## UI Changes

### Before:
```
┌─ Keterangan ─────────────────────────────┐
│ [Keterangan Formasi        ]             │
│ [Keterangan Penempatan     ]             │
│ [Keterangan Penugasan      ]             │
│ [Keterangan Perubahan      ]             │
└──────────────────────────────────────────┘
```

### After:
```
┌─ Keterangan Penempatan ──────────────────┐
│ [+ Tambah]                                │
│ ┌─ #1 ──────────────────────── [🗑️] ─┐  │
│ │ [Textarea: Ditempatkan di...]        │  │
│ └──────────────────────────────────────┘  │
│ ┌─ #2 ──────────────────────── [🗑️] ─┐  │
│ │ [Textarea: Pindah ke...]             │  │
│ └──────────────────────────────────────┘  │
└──────────────────────────────────────────┘

┌─ Keterangan Penugasan Tambahan ──────────┐
│ [+ Tambah]                                │
│ ┌─ #1 ──────────────────────── [🗑️] ─┐  │
│ │ [Textarea: Sertigas sebagai...]      │  │
│ └──────────────────────────────────────┘  │
└──────────────────────────────────────────┘

┌─ Keterangan Perubahan ───────────────────┐
│ [+ Tambah]                                │
│ ┌─ #1 ──────────────────────── [🗑️] ─┐  │
│ │ [Textarea: PPPK TMT 1 Mei 2025]      │  │
│ └──────────────────────────────────────┘  │
└──────────────────────────────────────────┘
```

## Benefits

1. **Better UX**: User bisa menambahkan multiple keterangan per kategori
2. **More Flexible**: Tidak terbatas pada 1 keterangan per kategori
3. **Cleaner Form**: Menghapus field yang redundant (old_position, keterangan_formasi)
4. **Consistent Pattern**: Menggunakan pattern yang sama dengan Riwayat (Mutasi, Jabatan, dll)
5. **Better Data Structure**: Normalized database design (separate tables)

## Next Steps (TODO)

### 1. Update Employees.tsx ✅ DONE
- [x] Fetch notes data when loading employee for edit
- [x] Save notes data when creating/updating employee
- [x] Handle notes deletion when employee is deleted (already handled by CASCADE)

### 2. Update Import.tsx
- [ ] Remove `keterangan_formasi` from import logic
- [ ] Keep `keterangan_penempatan`, `keterangan_penugasan`, `keterangan_perubahan` for backward compatibility
- [ ] Import single keterangan values as first note in respective tables

### 3. Update PetaJabatan.tsx
- [ ] Remove references to `keterangan_formasi` from employees query
- [ ] Fetch notes data if needed for display
- [ ] Or keep using old columns for backward compatibility

### 4. Update Export/CSV
- [ ] Update CSV export to include notes (comma-separated or numbered)
- [ ] Format: "1. Note one; 2. Note two; 3. Note three"

### 5. Database Cleanup (After Testing)
- [ ] Verify migration successful
- [ ] Verify all features working with new tables
- [ ] Remove old columns from employees table:
  ```sql
  ALTER TABLE employees DROP COLUMN keterangan_formasi;
  ALTER TABLE employees DROP COLUMN keterangan_penempatan;
  ALTER TABLE employees DROP COLUMN keterangan_penugasan;
  ALTER TABLE employees DROP COLUMN keterangan_perubahan;
  ALTER TABLE employees DROP COLUMN old_position;
  ```

## Testing Checklist

- [ ] Form loads correctly without errors
- [ ] Can add new employee without keterangan
- [ ] Can add new employee with multiple keterangan
- [ ] Can edit existing employee and see existing keterangan
- [ ] Can add more keterangan to existing employee
- [ ] Can delete keterangan from employee
- [ ] Can save employee with updated keterangan
- [ ] Migration runs successfully
- [ ] Old data migrated correctly to new tables
- [ ] RLS policies work correctly
- [ ] Cascade delete works when employee is deleted

## Migration Instructions

### 1. Run Migration
```bash
# If using Supabase CLI
supabase db push

# Or manually in Supabase Dashboard → SQL Editor
# Copy paste content of: supabase/migrations/20260331180000_add_employee_notes_tables.sql
```

### 2. Verify Migration
```sql
-- Check tables created
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('placement_notes', 'assignment_notes', 'change_notes');

-- Check data migrated
SELECT COUNT(*) FROM placement_notes;
SELECT COUNT(*) FROM assignment_notes;
SELECT COUNT(*) FROM change_notes;

-- Check sample data
SELECT e.name, pn.note 
FROM employees e 
JOIN placement_notes pn ON e.id = pn.employee_id 
LIMIT 5;
```

### 3. Test in UI
1. Open employee form
2. Verify old fields removed (Jabatan Lama, Keterangan Formasi)
3. Verify new dynamic keterangan sections appear
4. Try adding/removing notes
5. Save and verify data persisted

## Rollback Plan

If issues occur, you can rollback by:

1. **Keep old columns**: Migration already keeps old columns for backward compatibility
2. **Revert code changes**: Git revert to previous commit
3. **Drop new tables** (if needed):
```sql
DROP TABLE IF EXISTS placement_notes CASCADE;
DROP TABLE IF EXISTS assignment_notes CASCADE;
DROP TABLE IF EXISTS change_notes CASCADE;
```

## Status
✅ NotesForm component created
✅ EmployeeFormModal updated
✅ Database migration created and applied
✅ Employees.tsx updated for data fetching/saving
⏳ Import.tsx needs update
⏳ Testing required
