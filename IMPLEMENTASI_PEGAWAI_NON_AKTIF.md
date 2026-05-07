# Implementasi Fitur Pegawai Non Aktif

## 📋 Ringkasan
Fitur ini menambahkan kemampuan untuk menandai pegawai sebagai **non-aktif** (pensiun, resign, meninggal dunia, dll) dan **mengecualikan mereka dari semua perhitungan agregasi** di aplikasi.

## ✨ Fitur Utama

### 1. **Tab Baru: "Pegawai Non Aktif"**
- Tab ketiga di menu Data Pegawai
- Menampilkan semua pegawai yang sudah di-non-aktifkan
- Counter otomatis menunjukkan jumlah pegawai non-aktif

### 2. **Quick Action: Non-Aktifkan Pegawai**
- Tersedia di tab "Quick Action" saat edit pegawai
- Pilihan alasan non-aktif:
  - ✅ Pensiun
  - ✅ Resign / Mengundurkan Diri
  - ✅ Meninggal Dunia
  - ✅ Diberhentikan
  - ✅ Lainnya
- Input tanggal non-aktif
- Input nomor SK (opsional)
- Input keterangan tambahan (opsional)
- Konfirmasi dialog sebelum apply

### 3. **Logika Agregasi Otomatis**
Pegawai non-aktif **TIDAK DIHITUNG** dalam:
- ✅ Dashboard statistics (total pegawai, PNS, PPPK, Non-ASN)
- ✅ Grafik distribusi pangkat
- ✅ Grafik distribusi departemen
- ✅ Grafik jenis jabatan
- ✅ Grafik gender, agama, pendidikan
- ✅ Grafik masa kerja dan usia
- ✅ Proyeksi pensiun
- ✅ Semua agregasi data lainnya

### 4. **History Tracking**
- Tabel `inactive_history` mencatat:
  - Tanggal non-aktif
  - Alasan non-aktif
  - Nomor SK
  - Catatan tambahan
  - User yang melakukan perubahan
  - Timestamp

## 🗄️ Perubahan Database

### Tabel `employees`
Ditambahkan 3 kolom baru:
```sql
is_active BOOLEAN DEFAULT TRUE NOT NULL
inactive_date DATE
inactive_reason VARCHAR(50)
```

### Tabel Baru: `inactive_history`
```sql
CREATE TABLE inactive_history (
  id UUID PRIMARY KEY,
  employee_id UUID REFERENCES employees(id),
  inactive_date DATE NOT NULL,
  inactive_reason VARCHAR(50) NOT NULL,
  sk_number VARCHAR(100),
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)
```

### Fungsi `get_dashboard_stats()`
Ditambahkan parameter baru:
```sql
p_include_inactive BOOLEAN DEFAULT FALSE
```

**Default behavior**: Pegawai non-aktif **TIDAK** dihitung dalam statistik.

## 📁 File yang Dimodifikasi

### 1. **Migration SQL**
- `supabase/migrations/20260507000000_add_employee_inactive_status.sql`
  - Menambah kolom is_active, inactive_date, inactive_reason
  - Membuat tabel inactive_history
  - Update fungsi get_dashboard_stats()
  - RLS policies untuk inactive_history

### 2. **Frontend Components**
- `src/components/employees/QuickActionForm.tsx`
  - Tab baru "Non-Aktifkan Pegawai"
  - Form input alasan, tanggal, SK, keterangan
  - Dialog konfirmasi
  - Callback `onInactiveChange`

- `src/components/employees/EmployeeFormModal.tsx`
  - Handler `handleQuickInactiveChange`
  - Integrasi dengan form submission
  - Menyimpan data inactive ke change_notes

### 3. **Pages**
- `src/pages/Employees.tsx`
  - Tab "Pegawai Non Aktif" (tab ketiga)
  - Filter pegawai berdasarkan `is_active`
  - Counter untuk setiap tab
  - Update `doExecuteSave` untuk handle inactive data
  - Simpan ke `inactive_history` table

### 4. **Types**
- `src/types/employee.ts`
  - Tambah field `is_active`, `inactive_date`, `inactive_reason` ke interface `Employee`

## 🚀 Cara Menggunakan

### Untuk Admin/User:

1. **Buka halaman Data Pegawai**
2. **Klik Edit pada pegawai yang ingin di-non-aktifkan**
3. **Pilih tab "Quick Action"**
4. **Pilih tab "Non-Aktifkan"**
5. **Isi form:**
   - Pilih alasan (Pensiun/Resign/Meninggal/dll)
   - Pilih tanggal non-aktif
   - Isi nomor SK (opsional)
   - Isi keterangan (opsional)
6. **Klik "Non-Aktifkan Pegawai"**
7. **Konfirmasi di dialog**
8. **Klik "Simpan Perubahan" di bawah form**

### Melihat Pegawai Non Aktif:

1. **Buka halaman Data Pegawai**
2. **Klik tab "Pegawai Non Aktif"**
3. **Lihat daftar pegawai yang sudah non-aktif**

## 🔧 Deployment

### 1. Jalankan Migration
```bash
# Pastikan Supabase CLI sudah terinstall
supabase db push

# Atau manual via Supabase Dashboard:
# - Buka SQL Editor
# - Copy paste isi file migration
# - Execute
```

### 2. Verifikasi Database
```sql
-- Cek kolom baru di tabel employees
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'employees'
AND column_name IN ('is_active', 'inactive_date', 'inactive_reason');

-- Cek tabel inactive_history
SELECT * FROM inactive_history LIMIT 1;

-- Test fungsi get_dashboard_stats
SELECT get_dashboard_stats(NULL, NULL, FALSE);
```

### 3. Deploy Frontend
```bash
# Build aplikasi
npm run build

# Deploy ke Vercel/hosting
vercel --prod
```

## 📊 Contoh Query

### Hitung pegawai aktif vs non-aktif:
```sql
SELECT 
  is_active,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE asn_status = 'PNS') as pns,
  COUNT(*) FILTER (WHERE asn_status = 'PPPK') as pppk
FROM employees
GROUP BY is_active;
```

### Lihat riwayat pegawai non-aktif:
```sql
SELECT 
  e.name,
  e.nip,
  e.department,
  ih.inactive_date,
  ih.inactive_reason,
  ih.sk_number,
  p.full_name as created_by_name
FROM inactive_history ih
JOIN employees e ON e.id = ih.employee_id
LEFT JOIN profiles p ON p.id = ih.created_by
ORDER BY ih.inactive_date DESC;
```

### Dashboard stats (exclude inactive):
```sql
SELECT get_dashboard_stats(
  NULL,  -- department (NULL = all)
  NULL,  -- asn_status (NULL = all)
  FALSE  -- include_inactive (FALSE = exclude)
);
```

## ⚠️ Catatan Penting

1. **Pegawai non-aktif TIDAK DIHAPUS** dari database, hanya ditandai dengan `is_active = FALSE`
2. **Data historis tetap tersimpan** (riwayat jabatan, mutasi, pendidikan, dll)
3. **Dapat di-reaktifkan** dengan mengubah `is_active` kembali ke `TRUE` (fitur ini bisa ditambahkan nanti)
4. **RLS policies** memastikan hanya admin yang berhak mengakses data inactive_history
5. **Agregasi otomatis** mengecualikan pegawai non-aktif tanpa perlu perubahan kode di tempat lain

## 🎯 Manfaat

✅ **Data lebih akurat** - Statistik hanya menghitung pegawai aktif
✅ **Audit trail lengkap** - Semua perubahan status tercatat
✅ **Fleksibel** - Berbagai alasan non-aktif tersedia
✅ **User-friendly** - Quick Action memudahkan proses
✅ **Aman** - Konfirmasi dialog mencegah kesalahan
✅ **Scalable** - Mudah ditambahkan fitur reaktivasi nanti

## 🔮 Pengembangan Selanjutnya (Opsional)

1. **Fitur Reaktivasi Pegawai**
   - Quick Action untuk mengaktifkan kembali pegawai non-aktif
   - Update `is_active` menjadi `TRUE`

2. **Laporan Pegawai Non Aktif**
   - Export Excel khusus pegawai non-aktif
   - Grafik tren pensiun per tahun

3. **Notifikasi Otomatis**
   - Reminder sebelum tanggal pensiun
   - Notifikasi ke admin saat pegawai di-non-aktifkan

4. **Filter Lanjutan**
   - Filter berdasarkan alasan non-aktif
   - Filter berdasarkan rentang tanggal

## 📞 Support

Jika ada pertanyaan atau masalah, silakan hubungi tim development.

---

**Status**: ✅ Ready for Production
**Tanggal**: 7 Mei 2026
**Versi**: 1.0.0
