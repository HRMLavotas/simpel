# Cara Apply Migration Unit Activity Monitoring

## Opsi 1: Via Supabase Dashboard (Recommended)

1. Login ke Supabase Dashboard: https://supabase.com/dashboard
2. Pilih project Anda
3. Klik "SQL Editor" di sidebar kiri
4. Klik "New Query"
5. Copy-paste isi file `supabase/migrations/20260421100000_add_unit_activity_monitoring.sql`
6. Klik "Run" atau tekan Ctrl+Enter
7. Pastikan tidak ada error

## Opsi 2: Via Supabase CLI

```bash
# Pastikan Supabase CLI sudah terinstall
# Install jika belum: npm install -g supabase

# Login ke Supabase
supabase login

# Link project (jika belum)
supabase link --project-ref YOUR_PROJECT_REF

# Push migration
supabase db push
```

## Opsi 3: Via Script API (Jika sudah ada)

```bash
# Jika Anda sudah punya script apply_migration_via_api.mjs
node apply_migration_via_api.mjs supabase/migrations/20260421100000_add_unit_activity_monitoring.sql
```

## Verifikasi Migration Berhasil

Setelah apply migration, verifikasi dengan query berikut di SQL Editor:

```sql
-- Check view exists
SELECT * FROM unit_activity_summary LIMIT 5;

-- Check function exists
SELECT get_unit_monthly_details('NAMA_UNIT', '2026-04-01');

-- Check data
SELECT 
  department,
  month,
  total_changes,
  last_update
FROM unit_activity_summary
WHERE month = DATE_TRUNC('month', CURRENT_DATE)
ORDER BY total_changes DESC;
```

## Troubleshooting

### Error: "relation does not exist"
- Pastikan semua tabel history sudah ada (mutation_history, position_history, dll)
- Check migration sebelumnya sudah dijalankan

### Error: "function has_role does not exist"
- Pastikan migration untuk user roles sudah dijalankan
- Function has_role harus sudah ada dari migration sebelumnya

### Error: "permission denied"
- Pastikan Anda login sebagai admin/owner project
- Check RLS policies pada tabel employees dan history tables

## Setelah Migration Berhasil

1. Restart development server (jika sedang running)
2. Login sebagai admin_pusat atau admin_pimpinan
3. Akses menu "Monitoring Unit" di sidebar
4. Pilih bulan dan lihat data aktivitas unit

## Rollback (Jika Diperlukan)

Jika perlu rollback migration:

```sql
-- Drop function
DROP FUNCTION IF EXISTS get_unit_monthly_details(TEXT, DATE);

-- Drop view
DROP VIEW IF EXISTS unit_activity_summary;
```

## Notes

- Migration ini aman dan tidak mengubah data existing
- Hanya menambahkan view dan function baru
- Tidak ada perubahan pada tabel atau data
- Performance impact minimal karena view hanya agregasi
