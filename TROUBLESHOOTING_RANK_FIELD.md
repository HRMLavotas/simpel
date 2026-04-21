# Troubleshooting: Rank Field Not Loading

## Issue
Field pangkat/golongan gagal dimuat saat edit data pegawai di Quick Action tab dan tab Data Utama.

## Debug Steps

### 1. Check Browser Console
Buka browser console (F12) dan cari log berikut saat membuka form edit:

```
=== EMPLOYEE DATA FOR EDIT ===
Gender: ...
Religion: ...
ASN Status: ...
Rank Group: ...
Full employee: {...}
```

**Check:**
- Apakah `Rank Group` memiliki nilai?
- Apakah `ASN Status` terisi?

### 2. Check Form Values After Reset
```
=== FORM VALUES AFTER RESET ===
Gender: ...
Religion: ...
ASN Status: ...
Rank Group: ...
Position Name: ...
Department: ...
```

**Check:**
- Apakah `Rank Group` masih ada setelah form reset?
- Apakah nilai berubah dari employee data?

### 3. Check QuickActionForm Props
```
=== QuickActionForm Props ===
currentRank: ...
currentPosition: ...
currentDepartment: ...
asnStatus: ...
```

**Check:**
- Apakah `currentRank` kosong atau ada nilai?
- Apakah `asnStatus` terisi?

### 4. Check getRankOptions
```
=== getRankOptions DEBUG ===
ASN Status: ...
Current Rank: ...
PNS Options: [...]
Current rank in options? true/false
```

**Check:**
- Apakah options sesuai dengan ASN Status?
- Apakah current rank ada dalam options?

## Common Issues & Solutions

### Issue 1: rank_group NULL di database
**Symptom:** Log menunjukkan `Rank Group: null` atau `Rank Group: undefined`

**Solution:** 
```sql
-- Check data di database
SELECT id, name, asn_status, rank_group 
FROM employees 
WHERE id = 'EMPLOYEE_ID_HERE';
```

### Issue 2: ASN Status tidak sesuai dengan rank_group
**Symptom:** 
- ASN Status = 'PNS' tapi rank_group = 'IX' (PPPK rank)
- ASN Status = 'PPPK' tapi rank_group = 'Penata (III/c)' (PNS rank)

**Solution:**
```sql
-- Fix mismatched data
UPDATE employees 
SET rank_group = 'Penata Muda (III/a)' 
WHERE id = 'EMPLOYEE_ID_HERE' AND asn_status = 'PNS';
```

### Issue 3: rank_group format tidak standar
**Symptom:** rank_group = '-' atau '(IV/a)' atau format lain

**Solution:** Sudah diperbaiki dengan script `fix_rank_group_data.sql`

### Issue 4: Form reset timing issue
**Symptom:** QuickActionForm render sebelum form reset selesai

**Solution:** Sudah diperbaiki dengan `isFormReady` state

### Issue 5: Select component tidak menerima value
**Symptom:** Value ada di form tapi tidak muncul di Select

**Check:**
```javascript
// Di renderSelectField
rank_group - currentValue: "..."
rank_group - options: [...]
rank_group - value in options? false  // <-- Ini masalahnya!
```

**Solution:** Sudah diperbaiki dengan fallback mechanism di getRankOptions

## Manual Test Query

Jalankan query ini untuk check data employee tertentu:

```sql
-- Ganti dengan NIP atau nama employee
SELECT 
  id,
  name,
  nip,
  asn_status,
  rank_group,
  position_name,
  department,
  LENGTH(rank_group) as rank_length,
  rank_group = TRIM(rank_group) as no_extra_spaces
FROM employees
WHERE name ILIKE '%NAMA_PEGAWAI%'
LIMIT 5;
```

## Expected Behavior

1. Modal dibuka → Loading spinner muncul
2. Data di-fetch dari database
3. Form di-reset dengan data employee
4. `isFormReady` set to true setelah 50ms
5. QuickActionForm render dengan data lengkap
6. Field "Pangkat Saat Ini" menampilkan nilai dari database
7. Field rank_group di tab "Data Utama" menampilkan nilai yang sama

## Files Modified

1. `src/components/employees/EmployeeFormModal.tsx`
   - Added `isFormReady` state
   - Enhanced debug logging
   - Fixed getRankOptions with fallback
   - Added Non ASN support

2. `src/components/employees/QuickActionForm.tsx`
   - Added debug logging for props

3. `fix_rank_group_data.sql`
   - Clean up invalid rank_group values

## Next Steps if Still Not Working

1. **Copy all console logs** dan kirim ke developer
2. **Screenshot** form yang bermasalah
3. **Provide employee ID** yang bermasalah untuk query langsung
4. **Check network tab** di browser untuk melihat response dari Supabase
