-- Verifikasi Migration Pegawai Non Aktif

-- 1. Cek kolom baru di tabel employees
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns
WHERE table_name = 'employees'
AND column_name IN ('is_active', 'inactive_date', 'inactive_reason')
ORDER BY column_name;

-- 2. Cek tabel inactive_history
SELECT 
  table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'inactive_history'
ORDER BY ordinal_position;

-- 3. Cek index yang dibuat
SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'employees'
AND indexname LIKE '%inactive%';

-- 4. Test fungsi get_dashboard_stats dengan parameter baru
SELECT get_dashboard_stats(
  NULL,  -- department
  NULL,  -- asn_status
  FALSE  -- include_inactive (default: exclude inactive employees)
);

-- 5. Cek RLS policies untuk inactive_history
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'inactive_history'
ORDER BY policyname;
