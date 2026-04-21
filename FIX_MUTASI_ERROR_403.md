# Fix Error 403 pada Quick Action Pindah/Mutasi

## Masalah

Saat menggunakan Quick Action Pindah/Mutasi untuk memindahkan pegawai ke unit lain, muncul error:
```
Failed to load resource: the server responded with a status of 403
/rest/v1/employees?id=eq.0a3c46fb-d5dc-4ed4-a2a5-fd32e6a5e9b3
```

## Penyebab

RLS (Row Level Security) policy untuk UPDATE pada tabel `employees` memiliki `WITH CHECK` clause yang terlalu ketat:

```sql
CREATE POLICY "Admin unit can update own department employees"
ON public.employees FOR UPDATE
USING (
  public.has_role(auth.uid(), 'admin_unit') 
  AND department = public.get_user_department(auth.uid())
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin_unit') 
  AND department = public.get_user_department(auth.uid())  -- ❌ Ini yang bermasalah
);
```

Penjelasan:
- `USING` clause: Memeriksa apakah employee yang akan diupdate berada di department user (OK ✅)
- `WITH CHECK` clause: Memeriksa apakah setelah update, department employee masih sama dengan department user (❌ Ini memblokir mutasi keluar)

Ketika admin_unit mencoba mutasi pegawai ke unit lain:
1. Employee awalnya di department A (sesuai dengan user department) → USING OK ✅
2. Setelah update, employee pindah ke department B → WITH CHECK GAGAL ❌
3. Database menolak update dengan error 403

## Solusi

Migration baru `20260421000000_fix_mutation_rls_policy.sql` mengubah policy UPDATE:

```sql
CREATE POLICY "Admin unit can update own department employees"
ON public.employees FOR UPDATE
USING (
  public.has_role(auth.uid(), 'admin_unit') 
  AND department = public.get_user_department(auth.uid())
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin_unit')
  -- Tidak perlu cek department di WITH CHECK
  -- USING sudah memastikan employee awalnya dari department user
  -- Jadi mutasi keluar diizinkan ✅
);
```

Perubahan:
- `USING` tetap sama: Hanya bisa update employee yang saat ini di department-nya
- `WITH CHECK` dihapus pengecekan department: Mengizinkan perubahan department (mutasi keluar)

Dengan ini, admin_unit bisa:
- ✅ Update data pegawai di unit-nya
- ✅ Mutasi pegawai keluar ke unit lain
- ❌ Tidak bisa update pegawai di unit lain (karena USING clause)

## Cara Menerapkan

### Opsi 1: Via Script Otomatis (Recommended) ⚡
```bash
node apply_fix_mutasi_rls.mjs
```

Script ini akan:
- Membaca migration SQL dari file
- Menerapkan via Supabase REST API
- Verifikasi policy berhasil diupdate
- Menampilkan status dan next steps

### Opsi 2: Via Supabase Dashboard
1. Buka [Supabase Dashboard](https://supabase.com/dashboard)
2. Pilih project: mauyygrbdopmpdpnwzra
3. Masuk ke SQL Editor
4. Copy-paste isi file `supabase/migrations/20260421000000_fix_mutation_rls_policy.sql`:

```sql
-- Fix RLS policy untuk mengizinkan admin_unit melakukan mutasi pegawai keluar dari unit-nya
-- Problem: WITH CHECK clause memblokir perubahan department ke unit lain
-- Solution: Ubah WITH CHECK untuk mengizinkan mutasi keluar (department lama = user department)

-- Drop existing policy
DROP POLICY IF EXISTS "Admin unit can update own department employees" ON public.employees;

-- Recreate with fixed WITH CHECK
-- USING: Hanya bisa update employee yang saat ini di department-nya
-- WITH CHECK: Mengizinkan perubahan department (mutasi keluar) selama employee awalnya dari department user
CREATE POLICY "Admin unit can update own department employees"
ON public.employees FOR UPDATE
USING (
  public.has_role(auth.uid(), 'admin_unit') 
  AND department = public.get_user_department(auth.uid())
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin_unit')
  -- Tidak perlu cek department di WITH CHECK karena USING sudah memastikan
  -- employee awalnya dari department user, jadi mutasi keluar diizinkan
);
```

5. Klik "Run" atau tekan Ctrl+Enter

### Opsi 3: Via Supabase CLI
```bash
# Pastikan Supabase CLI sudah terinstall dan linked
supabase db push
```

## Status Migration

✅ **MIGRATION BERHASIL DITERAPKAN** (21 April 2026)

Migration telah berhasil diterapkan ke database production menggunakan:
```bash
$env:SUPABASE_DB_PASSWORD="Aliham251118!"; npx -y supabase@2.93.0 db push --linked
```

Output:
```
Applying migration 20260421000000_fix_mutation_rls_policy.sql...
Finished supabase db push.
```

## Testing

Setelah migration diterapkan, test dengan:
1. **Refresh browser** (Ctrl+F5 atau Cmd+Shift+R)
2. Login sebagai admin_unit
3. Buka halaman Employees
4. Edit pegawai di unit Anda
5. Gunakan Quick Action → Pindah/Mutasi
6. Pilih unit kerja tujuan yang berbeda
7. Klik "Terapkan Mutasi"
8. Klik "Simpan Perubahan"
9. Seharusnya berhasil tanpa error 403 ✅

## Catatan Keamanan

Policy ini tetap aman karena:
- Admin_unit hanya bisa update pegawai yang AWALNYA di unit-nya (via USING clause)
- Admin_unit tidak bisa "mencuri" pegawai dari unit lain
- Admin_pusat tetap bisa update semua pegawai (policy terpisah)
- Mutasi masuk ke unit lain akan memicu notifikasi ke admin_unit penerima
