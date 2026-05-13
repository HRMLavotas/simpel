# Panduan Memperbaiki Manual Entries di Database

## 🔍 Masalah

Fungsi "Perbaiki Otomatis" di aplikasi belum bisa menangani manual entries dengan baik. Kita perlu memperbaiki data langsung di database.

## ⚠️ PENTING - Backup Data Dulu!

Sebelum menjalankan script apapun, **WAJIB backup data terlebih dahulu**:

```bash
# Backup employee_cases table
npx supabase db dump --db-url "postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres" --data-only > backup_employee_cases_$(date +%Y%m%d_%H%M%S).sql
```

## 📋 Langkah-Langkah Perbaikan

### Opsi 1: Menggunakan Supabase SQL Editor (RECOMMENDED)

1. **Login ke Supabase Dashboard**
   - Buka: https://supabase.com/dashboard
   - Login dengan akun Anda
   - Pilih project: `qxnpjqzhiafnnkyaawhw`

2. **Buka SQL Editor**
   - Klik menu "SQL Editor" di sidebar kiri
   - Klik "New Query"

3. **Jalankan Script Pengecekan Dulu**
   - Copy isi file `check_manual_entries.sql`
   - Paste ke SQL Editor
   - Klik "Run" atau tekan Ctrl+Enter
   - Lihat hasilnya:
     - Berapa total manual entries?
     - Apakah ada yang bisa di-match?

4. **Jalankan Script Perbaikan**
   - Copy isi file `fix_manual_entries_with_multiple_nips.sql`
   - Paste ke SQL Editor
   - **REVIEW DULU** sebelum run!
   - Klik "Run" atau tekan Ctrl+Enter
   - Tunggu sampai selesai

5. **Verifikasi Hasil**
   - Lihat summary report di hasil query
   - Check apakah manual entries berkurang
   - Check apakah connected cases bertambah

### Opsi 2: Menggunakan CLI (Alternative)

```bash
# Set environment variables
$env:SUPABASE_ACCESS_TOKEN="[YOUR_ACCESS_TOKEN]"
$env:SUPABASE_DB_PASSWORD="[YOUR_DB_PASSWORD]"

# Check manual entries
Get-Content check_manual_entries.sql | npx supabase db execute --db-url "postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres"

# Fix manual entries (HATI-HATI!)
Get-Content fix_manual_entries_with_multiple_nips.sql | npx supabase db execute --db-url "postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres"
```

## 🔧 Apa yang Dilakukan Script?

### Script: `check_manual_entries.sql`
✅ **AMAN** - Hanya membaca data, tidak mengubah apapun

- Menampilkan semua manual entries
- Menghitung total manual entries
- Mengecek apakah ada employee yang cocok di database

### Script: `fix_manual_entries_direct.sql`
⚠️ **MENGUBAH DATA** - Backup dulu!

- Update manual entries yang bisa di-match by NIP
- Update manual entries yang bisa di-match by name
- Menghapus flag `isManualEntry` dari `case_details`
- Menampilkan summary hasil

### Script: `fix_manual_entries_with_multiple_nips.sql`
⚠️ **MENGUBAH DATA** - Backup dulu! (RECOMMENDED)

- Handle single NIP cases
- Handle multiple NIPs (perceraian) - try first NIP
- Handle multiple NIPs - try second NIP
- Fallback to name matching
- Menampilkan summary hasil

## 📊 Contoh Output

### Sebelum Fix:
```
Total Cases: 96
Connected Cases: 69
Manual Entries: 27
Disconnected Cases: 0
```

### Sesudah Fix:
```
Total Cases: 96
Connected Cases: 89
Manual Entries: 7
Disconnected Cases: 0
```

## 🎯 Matching Logic

Script akan mencoba match dengan urutan prioritas:

1. **Match by NIP (Single)** - Priority 1
   - Exact match: `employee_nip = employees.nip`

2. **Match by NIP (Multiple - First)** - Priority 2
   - Extract first NIP: `"199512012025212018 / 199608042025211010"` → `"199512012025212018"`
   - Match dengan database

3. **Match by NIP (Multiple - Second)** - Priority 3
   - Extract second NIP: `"199512012025212018 / 199608042025211010"` → `"199608042025211010"`
   - Match dengan database

4. **Match by Name** - Priority 4 (Fallback)
   - Case-insensitive match: `LOWER(employee_name) = LOWER(employees.name)`
   - Handle multiple names: `"Desti Wulan Sari / Hendy Pranata"` → `"Desti Wulan Sari"`

## 🔄 Update Process

Untuk setiap manual entry yang berhasil di-match:

```sql
UPDATE employee_cases SET
  employee_id = <matched_employee_id>,      -- UUID dari database
  employee_name = <matched_employee_name>,  -- Nama canonical
  employee_nip = <matched_employee_nip>,    -- NIP canonical
  case_details = case_details - 'isManualEntry',  -- Hapus flag manual
  updated_at = NOW()
WHERE employee_id LIKE 'MANUAL_%';
```

## ✅ Verifikasi Hasil

Setelah menjalankan script, verifikasi dengan query ini:

```sql
-- Check manual entries yang tersisa
SELECT COUNT(*) as remaining_manual_entries
FROM employee_cases 
WHERE employee_id LIKE 'MANUAL_%';

-- Check connected cases
SELECT COUNT(*) as connected_cases
FROM employee_cases ec
WHERE EXISTS (SELECT 1 FROM employees e WHERE e.id = ec.employee_id);

-- Check detail manual entries yang tersisa
SELECT 
  case_number,
  employee_name,
  employee_nip,
  case_type
FROM employee_cases 
WHERE employee_id LIKE 'MANUAL_%'
ORDER BY case_number;
```

## 🚨 Troubleshooting

### Problem: Script tidak jalan
**Solution**: 
- Check koneksi database
- Check credentials (access token & password)
- Check apakah ada typo di SQL

### Problem: Tidak ada yang ter-update
**Solution**:
- Check apakah benar ada manual entries: `SELECT COUNT(*) FROM employee_cases WHERE employee_id LIKE 'MANUAL_%'`
- Check apakah ada matching employees di database
- Jalankan `check_manual_entries.sql` untuk analisis detail

### Problem: Beberapa manual entries tidak bisa di-match
**Solution**:
- Normal! Tidak semua manual entries punya data yang cocok di database
- Review manual entries yang tersisa
- Mungkin perlu input manual atau data employee belum ada di database

## 📝 Rollback (Jika Ada Masalah)

Jika ada masalah setelah update, restore dari backup:

```bash
# Restore from backup
psql "postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres" < backup_employee_cases_YYYYMMDD_HHMMSS.sql
```

## 🎯 Next Steps

Setelah manual entries diperbaiki di database:

1. ✅ Refresh halaman validator di aplikasi
2. ✅ Klik "Validasi Koneksi" untuk verify
3. ✅ Check apakah jumlah manual entries berkurang
4. ✅ Check apakah connected cases bertambah

## 📞 Support

Jika ada masalah atau pertanyaan:
- Check console logs untuk error messages
- Review SQL query results
- Pastikan backup sudah dibuat sebelum fix

---

**INGAT**: Selalu backup data sebelum menjalankan UPDATE queries!
