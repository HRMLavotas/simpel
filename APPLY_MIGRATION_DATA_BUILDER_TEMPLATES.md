# Apply Migration: Data Builder Templates

## Error yang Terjadi
```
Failed to load resource: the server responded with a status of 400
Error loading templates
Error saving template
```

Error ini terjadi karena kolom `data_builder_templates` belum ada di table `profiles`.

## Solusi: Apply Migration

### Opsi 1: Via Supabase Dashboard (RECOMMENDED)

1. Buka Supabase Dashboard: https://supabase.com/dashboard
2. Pilih project Anda
3. Klik "SQL Editor" di sidebar kiri
4. Klik "New Query"
5. Copy-paste SQL berikut:

```sql
-- Add data_builder_templates column to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS data_builder_templates jsonb DEFAULT '[]'::jsonb;

-- Add comment
COMMENT ON COLUMN profiles.data_builder_templates IS 'User saved query templates for Data Builder stored as JSON array';
```

6. Klik "Run" atau tekan Ctrl+Enter
7. Tunggu sampai muncul "Success. No rows returned"

### Opsi 2: Via Supabase CLI

Jika Anda menggunakan Supabase CLI:

```bash
# Apply all pending migrations
supabase db push

# Atau apply migration specific
supabase migration up
```

### Opsi 3: Manual via psql

Jika Anda punya akses direct ke database:

```bash
psql "postgresql://postgres:[YOUR-PASSWORD]@db.mauyygrbdopmpdpnwzra.supabase.co:5432/postgres"
```

Lalu jalankan SQL di atas.

## Verifikasi Migration Berhasil

Setelah apply migration, verifikasi dengan query berikut di SQL Editor:

```sql
-- Check if column exists
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'profiles' 
  AND column_name = 'data_builder_templates';
```

Expected result:
```
column_name              | data_type | column_default
-------------------------|-----------|----------------
data_builder_templates   | jsonb     | '[]'::jsonb
```

## Test Setelah Migration

1. Refresh browser (Ctrl+F5 atau Cmd+Shift+R)
2. Buka menu Data Builder
3. Setup kolom dan filter
4. Klik "Simpan Query"
5. Isi nama template
6. Klik "Simpan Template"
7. Seharusnya muncul toast "Template berhasil disimpan"

## Troubleshooting

### Error: permission denied for table profiles
Pastikan user yang digunakan punya permission untuk ALTER TABLE.
Gunakan user postgres atau superuser.

### Error: column already exists
Itu bagus! Artinya kolom sudah ada. Coba refresh browser dan test lagi.

### Error masih 400 setelah migration
1. Clear browser cache (Ctrl+Shift+Delete)
2. Hard refresh (Ctrl+F5)
3. Check di SQL Editor apakah kolom benar-benar ada
4. Restart development server

## File Migration
Migration file sudah dibuat di:
`supabase/migrations/20260407000000_add_data_builder_templates.sql`

Jika menggunakan Supabase CLI, file ini akan otomatis ter-apply saat `supabase db push`.
