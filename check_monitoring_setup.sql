-- Quick Check: Apakah Monitoring Setup Sudah Benar
-- Jalankan di Supabase SQL Editor

-- ============================================
-- 1. CHECK VIEW EXISTS
-- ============================================
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT FROM pg_views 
      WHERE schemaname = 'public' 
      AND viewname = 'unit_activity_summary'
    ) THEN '✅ View unit_activity_summary sudah ada'
    ELSE '❌ View unit_activity_summary BELUM ada - Jalankan migration!'
  END as status;

-- ============================================
-- 2. CHECK FUNCTION EXISTS
-- ============================================
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT FROM pg_proc 
      WHERE proname = 'get_unit_monthly_details'
    ) THEN '✅ Function get_unit_monthly_details sudah ada'
    ELSE '❌ Function get_unit_monthly_details BELUM ada - Jalankan migration!'
  END as status;

-- ============================================
-- 3. TEST VIEW - Sample Data
-- ============================================
SELECT 
  '✅ Test View - Sample Data (5 records terbaru)' as info;

SELECT 
  department,
  TO_CHAR(month, 'Mon YYYY') as bulan,
  total_changes,
  employees_updated,
  mutations,
  position_changes,
  rank_changes,
  training_records,
  education_records
FROM unit_activity_summary
ORDER BY month DESC, total_changes DESC
LIMIT 5;

-- ============================================
-- 4. COUNT TOTAL RECORDS
-- ============================================
SELECT 
  COUNT(*) as total_records,
  COUNT(DISTINCT department) as total_departments,
  COUNT(DISTINCT month) as total_months,
  MIN(month) as oldest_month,
  MAX(month) as newest_month
FROM unit_activity_summary;

-- ============================================
-- 5. CHECK CURRENT MONTH DATA
-- ============================================
SELECT 
  '✅ Data Bulan Ini' as info;

SELECT 
  department,
  total_changes,
  CASE 
    WHEN total_changes = 0 THEN '🔴 Tidak Ada Aktivitas'
    WHEN total_changes < 5 THEN '🟡 Aktivitas Rendah'
    WHEN total_changes < 20 THEN '🔵 Aktivitas Sedang'
    ELSE '🟢 Aktivitas Tinggi'
  END as status
FROM unit_activity_summary
WHERE month = DATE_TRUNC('month', CURRENT_DATE)
ORDER BY total_changes DESC;

-- ============================================
-- 6. SUMMARY STATISTICS
-- ============================================
SELECT 
  '✅ Summary Statistik Bulan Ini' as info;

SELECT 
  COUNT(*) as total_units,
  SUM(CASE WHEN total_changes > 0 THEN 1 ELSE 0 END) as units_aktif,
  SUM(CASE WHEN total_changes = 0 THEN 1 ELSE 0 END) as units_tidak_aktif,
  SUM(total_changes) as total_perubahan,
  SUM(employees_updated) as total_pegawai_diupdate
FROM unit_activity_summary
WHERE month = DATE_TRUNC('month', CURRENT_DATE);

-- ============================================
-- 7. CHECK USER PERMISSIONS
-- ============================================
SELECT 
  '✅ Check User Role' as info;

SELECT 
  auth.uid() as user_id,
  p.email,
  p.full_name,
  p.department,
  ur.role
FROM profiles p
LEFT JOIN user_roles ur ON ur.user_id = p.id
WHERE p.id = auth.uid();

-- ============================================
-- HASIL EXPECTED:
-- ============================================
-- Jika semua OK, Anda akan melihat:
-- 1. ✅ View sudah ada
-- 2. ✅ Function sudah ada  
-- 3. Data sample muncul (atau kosong jika belum ada history)
-- 4. Total records > 0
-- 5. Data bulan ini muncul (semua unit, termasuk yang 0 aktivitas)
-- 6. Summary statistik muncul
-- 7. User role Anda (harus admin_pusat atau admin_pimpinan)
