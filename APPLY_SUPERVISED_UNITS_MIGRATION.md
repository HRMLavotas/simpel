# Migrasi Akses Unit Binaan untuk Admin Unit

## Deskripsi
Migration ini menambahkan dukungan untuk admin unit agar dapat mengakses dan mengelola data pegawai di unit binaan mereka (Satpel/Workshop).

## Perubahan yang Dilakukan

### 1. Fungsi Database Baru
- **`get_accessible_departments(user_id)`**: Mengembalikan array department yang bisa diakses user
  - Admin pusat/pimpinan: NULL (semua unit)
  - Admin unit: Department sendiri + Satpel/Workshop yang dibina

### 2. Update RLS Policies
- **employees SELECT**: Admin unit bisa melihat pegawai di unit sendiri + unit binaan
- **employees INSERT**: Admin unit bisa menambah pegawai di unit sendiri + unit binaan
- **employees UPDATE**: Admin unit bisa mengupdate pegawai di unit sendiri + unit binaan
- **employees DELETE**: Admin unit bisa menghapus pegawai di unit sendiri + unit binaan
- **position_references SELECT**: Admin unit bisa melihat referensi jabatan di unit sendiri + unit binaan

### 3. Mapping Unit Pembina → Unit Binaan
- **BBPVP Serang**: Satpel Lubuklinggau, Satpel Lampung, Workshop Prabumulih
- **BBPVP Bekasi**: Satpel Bengkulu, Satpel Kotawaringin Timur
- **BBPVP Makassar**: Satpel Majene, Satpel Mamuju, Satpel Palu, Workshop Gorontalo, Satpel Morowali, Satpel Morowali Utara
- **BBPVP Medan**: Satpel Pekanbaru, Workshop Batam
- **BPVP Surakarta**: Satpel Bantul
- **BPVP Padang**: Satpel Jambi, Satpel Sawahlunto
- **BPVP Lombok Timur**: Satpel Kupang, Satpel Bali
- **BPVP Ternate**: Satpel Sofifi, Satpel Minahasa Utara, Satpel Halmahera Selatan
- **BPVP Sorong**: Satpel Jayapura
- **BPVP Samarinda**: Satpel Tanah Bumbu, Satpel Bulungan

## Cara Menjalankan Migration

### Opsi 1: Menggunakan Script (Otomatis)
```bash
node apply_supervised_units_migration.mjs
```

### Opsi 2: Manual via Supabase Dashboard
1. Buka Supabase Dashboard → SQL Editor
2. Buka file: `supabase/migrations/20260504000000_add_supervised_units_access.sql`
3. Copy seluruh isi file
4. Paste ke SQL Editor
5. Klik "Run" untuk execute

## Verifikasi

Setelah migration berhasil, cek dengan:

```sql
-- Test fungsi get_accessible_departments
SELECT public.get_accessible_departments(auth.uid());

-- Cek policy yang aktif
SELECT * FROM pg_policies WHERE tablename = 'employees';
```

## Testing

1. Login sebagai admin unit yang punya unit binaan (contoh: BBPVP Serang)
2. Buka menu "Data Pegawai"
3. Dropdown "Unit Kerja" seharusnya muncul dengan pilihan:
   - BBPVP Serang
   - Satpel Lubuklinggau
   - Satpel Lampung
   - Workshop Prabumulih
4. Pilih salah satu unit binaan
5. Data pegawai dari unit tersebut seharusnya muncul

## Rollback

Jika perlu rollback, jalankan:

```sql
-- Restore original policies
DROP POLICY IF EXISTS "Admin unit can view own department employees" ON public.employees;

CREATE POLICY "Admin unit can view own department employees"
ON public.employees FOR SELECT
USING (
  public.has_role(auth.uid(), 'admin_unit') 
  AND (
    department = public.get_user_department(auth.uid())
    OR
    updated_at > NOW() - INTERVAL '5 minutes'
  )
);

-- Drop function
DROP FUNCTION IF EXISTS public.get_accessible_departments(UUID);
```

## Catatan Keamanan

- RLS policies tetap membatasi akses sesuai role
- Admin unit hanya bisa akses unit sendiri + unit binaan yang sudah didefinisikan
- Grace period 5 menit tetap ada untuk operasi mutasi
- Admin pusat/pimpinan tidak terpengaruh (tetap akses semua unit)
