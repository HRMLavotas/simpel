# Validasi Koneksi Kasus Pegawai dengan Data Pegawai

## Ringkasan
Sistem validasi dan perbaikan otomatis untuk memastikan semua kasus pegawai terhubung dengan benar ke data pegawai yang valid di database.

## Masalah yang Diselesaikan

### Potensi Masalah Koneksi:
1. **Employee ID tidak valid**: Kasus mereferensikan `employee_id` yang tidak ada di tabel `employees`
2. **Data pegawai dihapus**: Pegawai dihapus dari sistem tetapi kasusnya masih ada
3. **Migrasi data**: Perubahan struktur ID saat migrasi dari sistem lama
4. **Entry manual**: Kasus dibuat dengan employee_id yang salah

## Fitur yang Diimplementasikan

### 1. **Validasi Koneksi**
- Memeriksa semua kasus di tabel `employee_cases`
- Memverifikasi bahwa setiap `employee_id` ada di tabel `employees`
- Menghitung statistik:
  - Total kasus
  - Kasus terhubung (valid)
  - Kasus tidak terhubung (invalid)
- Menampilkan daftar detail kasus yang tidak terhubung

### 2. **Perbaikan Otomatis**
- Mencoba mencocokkan kasus yang tidak terhubung dengan pegawai yang ada
- Metode pencocokan:
  - **By NIP**: Mencocokkan berdasarkan NIP pegawai (prioritas utama)
  - **By Name**: Mencocokkan berdasarkan nama pegawai (fallback)
- Update otomatis `employee_id` jika ditemukan kecocokan
- Laporan detail hasil perbaikan

### 3. **Halaman Admin Utility**
- Interface visual untuk validasi dan perbaikan
- Statistik real-time
- Tabel detail kasus yang bermasalah
- Tombol aksi untuk validasi dan perbaikan
- Laporan hasil perbaikan

## File yang Dibuat

### 1. **Utility Functions**
**File**: `src/lib/validateCaseEmployeeConnection.ts`

**Fungsi:**
- `validateCaseEmployeeConnections()`: Validasi semua koneksi
- `fixDisconnectedCases()`: Perbaiki koneksi yang rusak
- `getCaseEmployeeConnectionReport()`: Generate laporan lengkap

### 2. **Admin Page**
**File**: `src/pages/CaseConnectionValidator.tsx`

**Fitur:**
- Dashboard validasi koneksi
- Tombol validasi dan perbaikan
- Statistik visual (cards)
- Tabel kasus yang tidak terhubung
- Laporan hasil perbaikan

### 3. **SQL Check Script**
**File**: `check_case_employee_connection.sql`

**Query:**
- Total kasus
- Kasus dengan employee_id valid
- Kasus dengan employee_id invalid
- Detail kasus bermasalah
- Format employee_id (UUID vs TEXT)
- Koneksi disciplinary actions
- Summary report

### 4. **Routing**
**File**: `src/App.tsx` (modified)

**Route baru:**
```tsx
/admin/kasus-pegawai-validator
```

## Cara Menggunakan

### Melalui UI (Recommended)

1. **Login sebagai Admin Pusat**
2. **Buka halaman Kasus Pegawai** (`/admin/kasus-pegawai`)
3. **Klik tombol "Validasi Koneksi"** di header
4. **Atau akses langsung** ke `/admin/kasus-pegawai-validator`

#### Langkah Validasi:
1. Klik tombol **"Validasi Koneksi"**
2. Sistem akan memeriksa semua kasus
3. Lihat hasil di cards statistik:
   - Total Kasus
   - Terhubung (hijau)
   - Tidak Terhubung (merah)

#### Langkah Perbaikan:
1. Jika ada kasus tidak terhubung, klik **"Perbaiki Otomatis"**
2. Sistem akan mencoba mencocokkan dengan pegawai yang ada
3. Lihat hasil perbaikan:
   - Berhasil diperbaiki (hijau)
   - Gagal diperbaiki (merah)
4. Tabel detail menunjukkan:
   - Case ID
   - Status (Fixed/Failed)
   - Match Type (nip/name)
   - Old/New Employee ID
   - Reason (jika gagal)

### Melalui SQL (Manual Check)

```bash
# Jalankan script SQL di Supabase SQL Editor
psql -f check_case_employee_connection.sql
```

### Melalui Code (Programmatic)

```typescript
import {
  validateCaseEmployeeConnections,
  fixDisconnectedCases,
  getCaseEmployeeConnectionReport,
} from "@/lib/validateCaseEmployeeConnection";

// Validasi
const validation = await validateCaseEmployeeConnections();
console.log(`Total: ${validation.totalCases}`);
console.log(`Connected: ${validation.connectedCases}`);
console.log(`Disconnected: ${validation.disconnectedCases}`);

// Perbaiki
const fixResult = await fixDisconnectedCases();
console.log(`Fixed: ${fixResult.fixed}`);
console.log(`Failed: ${fixResult.failed}`);

// Laporan lengkap
const report = await getCaseEmployeeConnectionReport();
console.log(report);
```

## Logika Perbaikan Otomatis

### Algoritma Pencocokan:

```
FOR EACH invalid case:
  1. Try match by NIP:
     - Query employees WHERE nip = case.employee_nip
     - If found → Update case.employee_id → Mark as FIXED (match_type: nip)
  
  2. If not found, try match by Name:
     - Query employees WHERE name ILIKE case.employee_name
     - If found → Update case.employee_id → Mark as FIXED (match_type: name)
  
  3. If still not found:
     - Mark as FAILED (reason: "No matching employee found")
```

### Prioritas Pencocokan:
1. **NIP** (lebih akurat, unique identifier)
2. **Name** (fallback, bisa ada duplikat)

## Struktur Database

### Tabel `employee_cases`
```sql
CREATE TABLE employee_cases (
  id UUID PRIMARY KEY,
  employee_id TEXT NOT NULL,  -- No FK constraint for flexibility
  employee_name TEXT NOT NULL,
  employee_nip TEXT NOT NULL,
  case_type TEXT NOT NULL,
  status TEXT NOT NULL,
  ...
);
```

**Catatan**: `employee_id` adalah TEXT tanpa foreign key constraint untuk fleksibilitas (mendukung manual entry dan non-ASN).

### Tabel `employees`
```sql
CREATE TABLE employees (
  id UUID PRIMARY KEY,
  nip TEXT,
  name TEXT NOT NULL,
  ...
);
```

## Skenario Penggunaan

### Skenario 1: Setelah Import Data
```
1. Import data pegawai baru
2. Jalankan validasi koneksi
3. Jika ada kasus lama yang tidak terhubung, perbaiki otomatis
```

### Skenario 2: Setelah Migrasi
```
1. Migrasi dari sistem lama ke baru
2. Employee ID mungkin berubah
3. Jalankan validasi dan perbaikan
4. Verifikasi semua kasus terhubung
```

### Skenario 3: Maintenance Rutin
```
1. Jalankan validasi setiap bulan
2. Pastikan tidak ada kasus yang terputus
3. Perbaiki jika ditemukan masalah
```

### Skenario 4: Troubleshooting
```
1. User melaporkan kasus tidak muncul
2. Jalankan validasi untuk cek koneksi
3. Perbaiki koneksi yang rusak
4. Verifikasi kasus muncul kembali
```

## Monitoring & Logging

### Console Logs:
```
🔍 Validating employee case connections...
📊 Found 150 cases
👥 Found 120 employees
✅ Validation complete: { totalCases: 150, connectedCases: 145, disconnectedCases: 5 }

🔧 Attempting to fix disconnected cases...
🔍 Found 5 disconnected cases
🔍 Trying to fix case CASE-2024-001...
✅ Found match by NIP: John Doe
✅ Fixed case CASE-2024-001
✅ Fix complete: 4 fixed, 1 failed
```

### Toast Notifications:
- ✅ "Semua kasus terhubung dengan benar!"
- ⚠️ "Ditemukan 5 kasus yang tidak terhubung"
- ✅ "Berhasil memperbaiki 4 kasus"
- ⚠️ "Tidak ada kasus yang dapat diperbaiki secara otomatis"

## Keamanan & Akses

### Role Access:
- **Admin Pusat**: Full access (validasi + perbaikan)
- **Admin Unit**: No access
- **Admin Pimpinan**: No access
- **User**: No access

### RLS Policies:
Menggunakan RLS policies yang sudah ada di tabel `employee_cases` dan `employees`.

## Troubleshooting

### Masalah: Perbaikan otomatis gagal
**Solusi:**
1. Periksa apakah pegawai benar-benar ada di database
2. Verifikasi NIP dan nama pegawai di kasus
3. Jika pegawai tidak ada, tambahkan pegawai terlebih dahulu
4. Atau update manual `employee_id` di kasus

### Masalah: Validasi menunjukkan banyak kasus tidak terhubung
**Solusi:**
1. Periksa apakah ada migrasi data yang belum selesai
2. Verifikasi format `employee_id` (UUID vs TEXT)
3. Jalankan perbaikan otomatis
4. Untuk kasus yang gagal, perbaiki manual

### Masalah: Kasus dengan manual entry
**Solusi:**
Kasus dengan `isManualEntry: true` di `case_details` mungkin tidak memiliki `employee_id` yang valid. Ini normal untuk pegawai non-ASN atau entry manual.

## Best Practices

1. **Jalankan validasi secara berkala** (minimal 1x per bulan)
2. **Validasi setelah import data** pegawai baru
3. **Backup database** sebelum menjalankan perbaikan otomatis
4. **Verifikasi hasil perbaikan** dengan melihat detail laporan
5. **Dokumentasikan kasus yang gagal** diperbaiki untuk investigasi lebih lanjut

## Metrics & KPIs

### Target Metrics:
- **Connection Rate**: > 95% (kasus terhubung dengan benar)
- **Auto-Fix Success Rate**: > 80% (perbaikan otomatis berhasil)
- **Manual Intervention**: < 5% (kasus yang perlu perbaikan manual)

### Monitoring:
```sql
-- Check connection rate
SELECT 
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE EXISTS (
    SELECT 1 FROM employees e WHERE e.id = ec.employee_id
  )) as connected,
  ROUND(
    COUNT(*) FILTER (WHERE EXISTS (
      SELECT 1 FROM employees e WHERE e.id = ec.employee_id
    ))::numeric / COUNT(*)::numeric * 100, 
    2
  ) as connection_rate_percent
FROM employee_cases ec;
```

## Future Enhancements

1. **Scheduled Validation**: Cron job untuk validasi otomatis
2. **Email Notifications**: Notifikasi jika ditemukan kasus tidak terhubung
3. **Audit Log**: Log semua perbaikan yang dilakukan
4. **Bulk Operations**: Perbaiki multiple kasus sekaligus dengan konfirmasi
5. **Advanced Matching**: Fuzzy matching untuk nama pegawai
6. **Dashboard Widget**: Widget di dashboard untuk monitoring real-time

---

**Tanggal Implementasi**: 13 Mei 2026
**Developer**: Kiro AI Assistant
**Status**: ✅ Production Ready
