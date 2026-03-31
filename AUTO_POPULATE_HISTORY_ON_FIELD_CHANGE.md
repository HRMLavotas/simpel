# Auto-Populate History on Field Change

## Overview
Form edit pegawai sekarang otomatis mendeteksi perubahan pada field penting di section "Data Kepegawaian" dan membuat entry riwayat secara otomatis.

## How It Works

### Automatic Change Detection
Ketika user mengubah field tertentu saat **edit pegawai**, sistem akan:
1. **Detect perubahan** dari nilai lama ke nilai baru
2. **Auto-create entry** di section riwayat yang relevan
3. **Pre-fill data** dengan nilai lama dan baru
4. **Set tanggal** ke hari ini
5. **Add keterangan** "Perubahan data - Auto-generated"

### Triggered Fields

#### 1. Golongan/Pangkat → Riwayat Kenaikan Pangkat
**When:** User mengubah field "Golongan/Pangkat"
**Action:** Auto-create entry di "Riwayat Kenaikan Pangkat"

**Example:**
```
User Action:
  Old Value: Penata (III/c)
  New Value: Penata Tk I (III/d)

Auto-Generated Entry:
  Tanggal: 2026-03-31 (today)
  Pangkat Lama: Penata (III/c)
  Pangkat Baru: Penata Tk I (III/d)
  TMT: 2026-03-31
  Nomor SK: (empty - user can fill)
  Keterangan: Perubahan data - Auto-generated
```

#### 2. Nama Jabatan → Riwayat Jabatan
**When:** User mengubah field "Nama Jabatan"
**Action:** Auto-create entry di "Riwayat Jabatan"

**Example:**
```
User Action:
  Old Value: Analis Kebijakan Ahli Muda
  New Value: Analis Kebijakan Ahli Madya

Auto-Generated Entry:
  Tanggal: 2026-03-31 (today)
  Jabatan Lama: Analis Kebijakan Ahli Muda
  Jabatan Baru: Analis Kebijakan Ahli Madya
  Nomor SK: (empty - user can fill)
  Keterangan: Perubahan data - Auto-generated
```

#### 3. Unit Kerja → Riwayat Mutasi
**When:** User mengubah field "Unit Kerja"
**Action:** Auto-create entry di "Riwayat Mutasi"

**Example:**
```
User Action:
  Old Value: Setditjen Binalavotas
  New Value: Direktorat Bina Stankomproglat

Auto-Generated Entry:
  Tanggal: 2026-03-31 (today)
  Dari Unit: Setditjen Binalavotas
  Ke Unit: Direktorat Bina Stankomproglat
  Nomor SK: (empty - user can fill)
  Keterangan: Mutasi - Auto-generated
```

## Features

### 1. Duplicate Prevention
- System checks if identical change already exists in history
- Won't create duplicate entries
- Compares old value + new value combination

### 2. Only for Edits
- Auto-generation **ONLY** works when editing existing employee
- New employee creation doesn't trigger this (no old values to compare)

### 3. User Can Modify
- Auto-generated entries are editable
- User can:
  - Update tanggal
  - Add Nomor SK
  - Edit keterangan
  - Delete entry if not needed

### 4. Console Logging
- Changes are logged to console for debugging
- Format: `✅ Riwayat [Type] otomatis ditambahkan: [entry]`

## User Workflow

### Scenario 1: Kenaikan Pangkat
1. User opens edit form for employee
2. Current Pangkat: "Penata (III/c)"
3. User changes to: "Penata Tk I (III/d)"
4. **System auto-adds entry** to "Riwayat Kenaikan Pangkat"
5. User scrolls down to verify
6. User can add Nomor SK and adjust tanggal
7. User clicks Save

### Scenario 2: Mutasi Unit Kerja
1. User opens edit form for employee
2. Current Unit: "Setditjen Binalavotas"
3. User changes to: "BBPVP Bekasi"
4. **System auto-adds entry** to "Riwayat Mutasi"
5. Entry shows: Dari "Setditjen Binalavotas" Ke "BBPVP Bekasi"
6. User adds Nomor SK mutasi
7. User clicks Save

### Scenario 3: Perubahan Jabatan
1. User opens edit form for employee
2. Current Jabatan: "Analis Kebijakan"
3. User changes to: "Kepala Subbagian"
4. **System auto-adds entry** to "Riwayat Jabatan"
5. User verifies and adds details
6. User clicks Save

## Technical Implementation

### Change Detection Logic
```typescript
useEffect(() => {
  if (!isEditing || !employee) return;

  const subscription = form.watch((value, { name: fieldName }) => {
    const today = new Date().toISOString().split('T')[0];

    // Detect Rank change
    if (fieldName === 'rank_group' && value.rank_group !== originalValues.rank_group) {
      // Create rank history entry
    }

    // Detect Position change
    if (fieldName === 'position_name' && value.position_name !== originalValues.position_name) {
      // Create position history entry
    }

    // Detect Department change
    if (fieldName === 'department' && value.department !== originalValues.department) {
      // Create mutation history entry
    }
  });

  return () => subscription.unsubscribe();
}, [isEditing, employee, form, originalValues, ...]);
```

### Original Values Tracking
```typescript
const [originalValues, setOriginalValues] = useState<{
  rank_group: string;
  position_name: string;
  department: string;
}>({ rank_group: '', position_name: '', department: '' });

// Set when form loads
useEffect(() => {
  if (employee) {
    setOriginalValues({
      rank_group: employee.rank_group || '',
      position_name: employee.position_name || '',
      department: employee.department || '',
    });
  }
}, [employee]);
```

## Benefits

1. **Automatic Record Keeping:** No manual entry needed for history
2. **Consistent Data:** Every change is tracked
3. **Time Saving:** Pre-filled with old and new values
4. **Audit Trail:** Clear indication of data changes
5. **User Friendly:** Can still edit or delete auto-generated entries

## Limitations

1. **Only for Edits:** Doesn't work for new employee creation
2. **Single Field:** Only tracks individual field changes, not bulk changes
3. **No Undo:** Once generated, user must manually delete if not needed
4. **Console Only:** No visual notification (yet) - only console log

## Future Enhancements

Possible improvements:
- [ ] Visual toast notification when entry is auto-added
- [ ] Auto-scroll to the relevant history section
- [ ] Highlight newly added entry with animation
- [ ] Batch change detection (multiple fields at once)
- [ ] Confirmation dialog before auto-adding
- [ ] Option to disable auto-generation in settings

## Testing Instructions

### Test 1: Change Pangkat
1. Edit any employee
2. Note current Pangkat (e.g., "III/c")
3. Change to different Pangkat (e.g., "III/d")
4. Scroll to "Riwayat Kenaikan Pangkat"
5. Verify new entry appears with old and new values
6. Check console for log message

### Test 2: Change Jabatan
1. Edit any employee
2. Note current Jabatan
3. Change to different Jabatan
4. Scroll to "Riwayat Jabatan"
5. Verify new entry appears
6. Try changing back - should create another entry

### Test 3: Change Unit Kerja (Admin Pusat only)
1. Login as Admin Pusat
2. Edit any employee
3. Change Unit Kerja
4. Scroll to "Riwayat Mutasi"
5. Verify entry shows "Dari [old] Ke [new]"

### Test 4: Duplicate Prevention
1. Edit employee
2. Change Pangkat from A to B
3. Verify entry created
4. Change Pangkat back to A
5. Change again to B
6. Verify: Should NOT create duplicate A→B entry

### Test 5: Edit Auto-Generated Entry
1. Trigger auto-generation (change any tracked field)
2. Scroll to relevant history section
3. Edit the auto-generated entry:
   - Change tanggal
   - Add Nomor SK
   - Update keterangan
4. Save form
5. Re-open and verify changes persisted

## Status
✅ Change detection implemented
✅ Auto-populate for rank_group, position_name, department
✅ Duplicate prevention
✅ Console logging
✅ No diagnostics errors
⏳ Ready for testing
