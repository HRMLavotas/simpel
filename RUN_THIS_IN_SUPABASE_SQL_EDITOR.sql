-- =============================================
-- JALANKAN SCRIPT INI DI SUPABASE DASHBOARD
-- SQL Editor → New Query → Paste → Run
-- =============================================

-- Step 1: Update RPC function untuk mengembalikan field 'major'
CREATE OR REPLACE FUNCTION get_latest_education_per_employee()
RETURNS TABLE (
  employee_id UUID,
  level       TEXT,
  major       TEXT,
  graduation_year INT
)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT DISTINCT ON (employee_id)
    employee_id,
    level,
    major,
    graduation_year
  FROM education_history
  ORDER BY employee_id, graduation_year DESC NULLS LAST;
$$;

-- Step 2: Grant permissions
GRANT EXECUTE ON FUNCTION get_latest_education_per_employee() TO authenticated;
GRANT EXECUTE ON FUNCTION get_latest_education_per_employee() TO anon;

-- Step 3: Add comment
COMMENT ON FUNCTION get_latest_education_per_employee() IS
  'Returns one education record per employee — the latest by graduation_year. Includes level and major (jurusan). Used for export to avoid the 1000-row Supabase default limit.';

-- =============================================
-- VERIFIKASI: Jalankan query ini setelah migration
-- =============================================

-- Test 1: Cek struktur return value (harus ada kolom 'major')
SELECT * FROM get_latest_education_per_employee() LIMIT 5;

-- Test 2: Cek data di tabel education_history
SELECT 
  COUNT(*) as total_records,
  COUNT(major) as records_with_major,
  COUNT(*) - COUNT(major) as records_without_major
FROM education_history;

-- =============================================
-- SELESAI!
-- Setelah migration berhasil, refresh aplikasi frontend
-- =============================================
