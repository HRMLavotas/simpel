# Troubleshooting: Riwayat Jabatan Tambahan Tidak Muncul

## 🔍 Masalah

Data jabatan tambahan yang sudah ada di database tidak dimuat di tab "Riwayat Jabatan Tambahan".

---

## ✅ Yang Sudah Dilakukan

1. ✅ Kode fetch data dari database sudah benar
2. ✅ Kode processing data (mapRows, inferOldValues) sudah benar
3. ✅ Auto-inject untuk data saat ini sudah diimplementasikan
4. ✅ Logging untuk debugging sudah ditambahkan

---

## 🧪 Cara Debug

### 1. Cek Console Browser

Buka form edit pegawai yang memiliki jabatan tambahan, lalu buka Console (F12) dan cari log:

```
[EmployeeFormModal] Additional Position History - Raw response: { data: [...], error: null, count: X }
[EmployeeFormModal] Additional Position History - After mapRows: [...]
[EmployeeFormModal] Additional Position History - After inferOldValues: [...]
[EmployeeFormModal] Additional Position History - Final entries to set: [...]
```

**Yang Harus Dicek:**
- Apakah `data` berisi array dengan records?
- Apakah `error` null atau ada error message?
- Apakah `count` > 0?
- Apakah data berhasil di-map dan di-set ke state?

---

### 2. Cek Database Langsung

Jalankan query di Supabase Dashboard atau pgAdmin:

```sql
-- Cek apakah ada data di table additional_position_history
SELECT COUNT(*) FROM additional_position_history;

-- Cek sample data
SELECT * FROM additional_position_history LIMIT 10;

-- Cek employees dengan jabatan tambahan
SELECT id, name, additional_position 
FROM employees 
WHERE additional_position IS NOT NULL 
  AND additional_position != ''
LIMIT 10;

-- Cek apakah employee tertentu punya history
SELECT aph.* 
FROM additional_position_history aph
JOIN employees e ON e.id = aph.employee_id
WHERE e.name LIKE '%nama_pegawai%';
```

---

### 3. Cek dengan Script Node.js

Jalankan script yang sudah dibuat:

```bash
node check_additional_position_history.mjs
node check_additional_position_detailed.mjs
```

**Output yang diharapkan:**
- Total records > 0
- List employees dengan additional_position
- History records untuk setiap employee

---

## 🔧 Kemungkinan Penyebab & Solusi

### Penyebab 1: Data Belum Ada di Database ❌

**Gejala:**
- Query mengembalikan 0 records
- Script menunjukkan "No records found"

**Solusi:**
Data memang belum ada. Auto-inject akan membuat entry "Data saat ini" saat form dibuka.

**Cara Test:**
1. Buka form edit pegawai yang memiliki `additional_position`
2. Cek tab "Riwayat" → "Riwayat Jabatan Tambahan"
3. Seharusnya muncul 1 entry dengan keterangan "Data saat ini"

---

### Penyebab 2: RLS (Row Level Security) Memblokir Query ⚠️

**Gejala:**
- Query mengembalikan 0 records padahal data ada
- Error di console: "permission denied" atau "policy violation"

**Solusi:**
Cek RLS policy untuk table `additional_position_history`:

```sql
-- Cek policy yang ada
SELECT * FROM pg_policies 
WHERE tablename = 'additional_position_history';

-- Jika perlu, tambahkan policy untuk SELECT
CREATE POLICY "Allow authenticated users to read additional_position_history"
ON additional_position_history
FOR SELECT
TO authenticated
USING (true);
```

---

### Penyebab 3: Field `employee_id` Tidak Match 🔍

**Gejala:**
- Data ada di table
- Tapi tidak muncul untuk employee tertentu

**Solusi:**
Cek apakah `employee_id` di table history match dengan `id` di table employees:

```sql
-- Cek employee_id yang ada di history
SELECT DISTINCT employee_id FROM additional_position_history;

-- Cek apakah employee_id valid
SELECT aph.*, e.name
FROM additional_position_history aph
LEFT JOIN employees e ON e.id = aph.employee_id
WHERE e.id IS NULL;  -- Ini akan menunjukkan orphaned records
```

---

### Penyebab 4: Query Error Tidak Terlihat 🐛

**Gejala:**
- Tidak ada error di console
- Data tidak muncul

**Solusi:**
Cek error response dari Supabase:

```typescript
// Di console browser, cek:
console.log('addPosRes:', addPosRes);
console.log('addPosRes.error:', addPosRes.error);
console.log('addPosRes.data:', addPosRes.data);
```

---

### Penyebab 5: State Tidak Ter-update 🔄

**Gejala:**
- Data berhasil di-fetch
- Log menunjukkan data ada
- Tapi UI tidak update

**Solusi:**
Cek apakah `setAdditionalPositionHistoryEntries` dipanggil:

```typescript
// Tambahkan log setelah setState
setAdditionalPositionHistoryEntries(additionalPositionWithOld);
console.log('State updated with:', additionalPositionWithOld);
```

Cek di React DevTools apakah state `additionalPositionHistoryEntries` berisi data.

---

## 🧪 Test Case Manual

### Test 1: Employee Tanpa History, Dengan additional_position

**Setup:**
1. Pilih employee yang memiliki `additional_position` (misal: "PLT Direktur")
2. Pastikan tidak ada record di `additional_position_history` untuk employee ini

**Expected:**
- Tab "Riwayat" → "Riwayat Jabatan Tambahan" menampilkan 1 entry
- Entry dengan:
  - `jabatan_tambahan_baru` = "PLT Direktur"
  - `keterangan` = "Data saat ini"
  - `id` = "__current__"

**Actual:**
- [ ] Sesuai expected
- [ ] Tidak muncul (cek console untuk error)

---

### Test 2: Employee Dengan History di Database

**Setup:**
1. Insert data ke database:
```sql
INSERT INTO additional_position_history 
  (employee_id, tanggal, jabatan_tambahan_lama, jabatan_tambahan_baru, nomor_sk, tmt, keterangan)
VALUES 
  ('employee-id-here', '2024-01-01', '', 'PLT Kepala Bagian', 'SK-001/2024', '2024-01-01', 'Pengangkatan PLT');
```

2. Buka form edit untuk employee tersebut

**Expected:**
- Tab "Riwayat" → "Riwayat Jabatan Tambahan" menampilkan 1 entry dari database
- Entry dengan data sesuai yang di-insert

**Actual:**
- [ ] Sesuai expected
- [ ] Tidak muncul (cek console untuk error)

---

### Test 3: Employee Dengan Multiple History Records

**Setup:**
1. Insert multiple records:
```sql
INSERT INTO additional_position_history 
  (employee_id, tanggal, jabatan_tambahan_lama, jabatan_tambahan_baru, nomor_sk, tmt, keterangan)
VALUES 
  ('employee-id', '2024-01-01', '', 'PLT Kepala Bagian', 'SK-001/2024', '2024-01-01', 'Pengangkatan PLT'),
  ('employee-id', '2024-06-01', 'PLT Kepala Bagian', 'PLT Direktur', 'SK-050/2024', '2024-06-01', 'Promosi');
```

2. Buka form edit

**Expected:**
- Tab "Riwayat" menampilkan 2 entries
- Urutan dari lama ke baru (berdasarkan tanggal)
- Field "Jabatan Lama" di entry kedua otomatis terisi "PLT Kepala Bagian"

**Actual:**
- [ ] Sesuai expected
- [ ] Tidak muncul atau tidak lengkap

---

## 📋 Checklist Debugging

Ikuti checklist ini untuk menemukan masalah:

- [ ] **Step 1:** Buka form edit pegawai
- [ ] **Step 2:** Buka Console browser (F12)
- [ ] **Step 3:** Cari log `[EmployeeFormModal] Additional Position History`
- [ ] **Step 4:** Cek apakah `Raw response` menunjukkan data atau error
- [ ] **Step 5:** Jika error, catat error message
- [ ] **Step 6:** Jika data kosong, cek database langsung dengan SQL
- [ ] **Step 7:** Jika database juga kosong, test auto-inject dengan employee yang punya `additional_position`
- [ ] **Step 8:** Cek React DevTools untuk melihat state `additionalPositionHistoryEntries`
- [ ] **Step 9:** Jika state kosong tapi log menunjukkan data, ada masalah di setState
- [ ] **Step 10:** Jika state ada tapi UI tidak update, ada masalah di component render

---

## 🔧 Quick Fix

Jika masalahnya adalah **data belum ada di database**, Anda bisa:

### Opsi 1: Biarkan Auto-inject Bekerja
- Buka form edit untuk setiap pegawai yang punya jabatan tambahan
- Entry "Data saat ini" akan otomatis muncul
- Saat form di-save, entry ini akan tersimpan ke database

### Opsi 2: Bulk Insert Data Awal
Jalankan script untuk membuat entry awal untuk semua pegawai:

```sql
-- Insert entry awal untuk semua pegawai dengan additional_position
INSERT INTO additional_position_history 
  (employee_id, jabatan_tambahan_baru, keterangan, created_at)
SELECT 
  id,
  additional_position,
  'Data awal - Auto-generated',
  NOW()
FROM employees
WHERE additional_position IS NOT NULL 
  AND additional_position != ''
  AND NOT EXISTS (
    SELECT 1 FROM additional_position_history 
    WHERE employee_id = employees.id
  );
```

---

## 📞 Jika Masih Bermasalah

Kirimkan informasi berikut:

1. **Screenshot Console Browser** dengan log `[EmployeeFormModal] Additional Position History`
2. **Query Result** dari:
   ```sql
   SELECT COUNT(*) FROM additional_position_history;
   SELECT COUNT(*) FROM employees WHERE additional_position IS NOT NULL AND additional_position != '';
   ```
3. **Error Message** (jika ada)
4. **React DevTools Screenshot** menunjukkan state `additionalPositionHistoryEntries`

---

**Dibuat:** 20 Mei 2026  
**Status:** Debugging Guide
