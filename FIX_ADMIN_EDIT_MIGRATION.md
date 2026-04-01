# Fix Admin Edit - Migration Guide

## Problem
Admin Pusat tidak bisa mengedit profil admin lain. Update tampak berhasil di UI tapi database tidak berubah.

## Root Cause
RLS policy yang dibuat sebelumnya terlalu ketat dengan `WITH CHECK` clause yang membatasi update.

## Solution
Migration baru telah dibuat: `20260401000003_fix_admin_pusat_update_profiles_policy.sql`

Migration ini:
1. Menghapus policy lama yang terlalu ketat
2. Membuat policy baru yang lebih sederhana (hanya USING clause)
3. Memperbaiki policy user_roles untuk memastikan WITH CHECK ada

## Cara Push Migration

### Jika menggunakan Supabase CLI:
```bash
# Push migration ke database
supabase db push

# Atau jika sudah link project
supabase migration up
```

### Jika tidak ada Supabase CLI:
1. Buka Supabase Dashboard: https://supabase.com/dashboard/project/mauyygrbdopmpdpnwzra
2. Pergi ke SQL Editor
3. Copy isi file `supabase/migrations/20260401000003_fix_admin_pusat_update_profiles_policy.sql`
4. Paste dan jalankan di SQL Editor

## Testing Steps

Setelah migration di-push:

1. Login sebagai Admin Pusat
2. Buka halaman Kelola Admin
3. Edit salah satu admin unit (misalnya ubah department dari Setditjen ke Satankom)
4. Klik Simpan
5. Refresh halaman
6. Verifikasi bahwa perubahan tersimpan di tabel

## Expected Result
- ✅ Nama admin berubah di tabel
- ✅ Department berubah di tabel
- ✅ Role berubah di tabel (jika diubah)
- ✅ Perubahan persisten setelah refresh

## Jika Masih Tidak Berhasil

Coba langkah berikut:
1. Logout dan login kembali
2. Clear browser cache
3. Periksa console browser untuk error
4. Periksa Supabase logs untuk error RLS

## Migration Content

```sql
-- Drop the previous policy that might be too restrictive
DROP POLICY IF EXISTS "Admin pusat can update all profiles" ON public.profiles;

-- Recreate the policy with only USING clause (matching the pattern of existing policies)
CREATE POLICY "Admin pusat can update all profiles"
ON public.profiles FOR UPDATE
USING (public.has_role(auth.uid(), 'admin_pusat'));

-- Also ensure user_roles policy has WITH CHECK for completeness
DROP POLICY IF EXISTS "Admin pusat can manage roles" ON public.user_roles;

CREATE POLICY "Admin pusat can manage roles"
ON public.user_roles FOR ALL
USING (public.has_role(auth.uid(), 'admin_pusat'))
WITH CHECK (public.has_role(auth.uid(), 'admin_pusat'));
```
