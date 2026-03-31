# Deployment Summary - SIMPEL Application

## Tanggal Deployment
31 Maret 2026

## Supabase Project Details
- **Project ID**: mauyygrbdopmpdpnwzra
- **Project URL**: https://mauyygrbdopmpdpnwzra.supabase.co
- **Dashboard**: https://supabase.com/dashboard/project/mauyygrbdopmpdpnwzra

## Environment Variables
File `.env` telah diupdate dengan:
- `VITE_SUPABASE_URL`: https://mauyygrbdopmpdpnwzra.supabase.co
- `VITE_SUPABASE_PUBLISHABLE_KEY`: sb_publishable_ihKNfhqseKSHb7fRK3kyaw_ccCHmKAA
- `SUPABASE_ACCESS_TOKEN`: sbp_df72ebc9cae53c148193f88736ea05f4e0feab89
- `SUPABASE_SERVICE_ROLE_KEY`: [configured]

## Database Migrations Deployed ✅

Semua 5 migrasi berhasil di-deploy:

1. **20260112102112** - Initial schema
   - Created tables: profiles, user_roles, departments, employees, audit_logs
   - Created enum: app_role (admin_unit, admin_pusat)
   - Enabled RLS on all tables
   - Created security functions: has_role(), get_user_department()
   - Created RLS policies for all tables
   - Created trigger: handle_new_user()
   - Inserted master data departments (29 departments)

2. **20260317000219** - Employee extensions
   - Added columns to employees: birth_place, birth_date, gender, religion, front_title, back_title, tmt_cpns, tmt_pns, tmt_pensiun
   - Created table: education_history
   - Added RLS policies for education_history

3. **20260317034521** - Position references
   - Created table: position_references
   - Added columns to employees: keterangan_formasi, keterangan_penempatan, keterangan_penugasan, keterangan_perubahan
   - Added RLS policies for position_references

4. **20260317045038** - History tables
   - Created tables: mutation_history, position_history, rank_history, competency_test_history, training_history
   - Added RLS policies for all history tables
   - Enabled realtime for all history tables

5. **20260318032449** - Cleanup migration
   - Removed duplicate trigger (already created in first migration)

## Edge Functions Deployed ✅

Semua 4 edge functions berhasil di-deploy menggunakan `--use-api` flag (tanpa Docker):

1. **create-admin-user** (ACTIVE)
   - Endpoint: https://mauyygrbdopmpdpnwzra.supabase.co/functions/v1/create-admin-user
   - Function: Membuat admin user baru (hanya admin_pusat)

2. **delete-admin-user** (ACTIVE)
   - Endpoint: https://mauyygrbdopmpdpnwzra.supabase.co/functions/v1/delete-admin-user
   - Function: Menghapus admin user (hanya admin_pusat)

3. **update-admin-user** (ACTIVE)
   - Endpoint: https://mauyygrbdopmpdpnwzra.supabase.co/functions/v1/update-admin-user
   - Function: Update admin user profile dan role (hanya admin_pusat)

4. **seed-admin** (ACTIVE)
   - Endpoint: https://mauyygrbdopmpdpnwzra.supabase.co/functions/v1/seed-admin
   - Function: Membuat admin_pusat pertama kali (hanya jika belum ada)

## Database Schema Overview

### Tables Created:
- `profiles` - Admin user profiles
- `user_roles` - User role assignments
- `departments` - Master data unit kerja (29 departments)
- `employees` - Data pegawai
- `education_history` - Riwayat pendidikan pegawai
- `position_references` - Referensi jabatan per department
- `mutation_history` - Riwayat mutasi pegawai
- `position_history` - Riwayat jabatan pegawai
- `rank_history` - Riwayat kepangkatan pegawai
- `competency_test_history` - Riwayat uji kompetensi
- `training_history` - Riwayat diklat/pelatihan
- `audit_logs` - Log aktivitas sistem

### Security Features:
- Row Level Security (RLS) enabled on all tables
- Role-based access control (admin_unit vs admin_pusat)
- Department-based data isolation for admin_unit
- Full access for admin_pusat
- Audit logging for all changes

## Next Steps

1. **Buat Admin Pusat Pertama**
   ```bash
   curl -X POST https://mauyygrbdopmpdpnwzra.supabase.co/functions/v1/seed-admin \
     -H "Content-Type: application/json" \
     -d '{"email":"admin@example.com","password":"password123","full_name":"Admin Pusat","department":"Pusat"}'
   ```

2. **Test Login**
   - Buka aplikasi di browser
   - Login dengan credentials admin yang baru dibuat

3. **Verifikasi Fitur**
   - Dashboard statistics
   - Employee management
   - Admin management
   - Data import/export
   - Peta jabatan

## Deployment Commands Reference

```bash
# Link project
npx supabase link --project-ref mauyygrbdopmpdpnwzra

# Deploy migrations
npx supabase db push

# Deploy edge functions (tanpa Docker)
npx supabase functions deploy <function-name> --use-api

# List deployed functions
npx supabase functions list
```

## Notes
- Deployment berhasil tanpa memerlukan Docker Desktop
- Menggunakan flag `--use-api` untuk deploy edge functions
- Semua migrasi duplikat telah diperbaiki
- RLS policies sudah aktif untuk keamanan data
