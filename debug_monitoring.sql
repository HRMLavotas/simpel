-- Debug Script untuk Monitoring Unit
-- Jalankan query ini di Supabase SQL Editor untuk troubleshooting

-- 1. Check apakah view sudah ada
SELECT EXISTS (
  SELECT FROM pg_views 
  WHERE schemaname = 'public' 
  AND viewname = 'unit_activity_summary'
) as view_exists;

-- 2. Check apakah function sudah ada
SELECT EXISTS (
  SELECT FROM pg_proc 
  WHERE proname = 'get_unit_monthly_details'
) as function_exists;

-- 3. Check data di tabel history (12 bulan terakhir)
SELECT 
  'mutation_history' as table_name,
  COUNT(*) as total_records,
  COUNT(DISTINCT e.department) as unique_departments,
  MIN(mh.created_at) as oldest_record,
  MAX(mh.created_at) as newest_record
FROM mutation_history mh
JOIN employees e ON mh.employee_id = e.id
WHERE mh.created_at >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '12 months')

UNION ALL

SELECT 
  'position_history',
  COUNT(*),
  COUNT(DISTINCT e.department),
  MIN(ph.created_at),
  MAX(ph.created_at)
FROM position_history ph
JOIN employees e ON ph.employee_id = e.id
WHERE ph.created_at >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '12 months')

UNION ALL

SELECT 
  'rank_history',
  COUNT(*),
  COUNT(DISTINCT e.department),
  MIN(rh.created_at),
  MAX(rh.created_at)
FROM rank_history rh
JOIN employees e ON rh.employee_id = e.id
WHERE rh.created_at >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '12 months')

UNION ALL

SELECT 
  'training_history',
  COUNT(*),
  COUNT(DISTINCT e.department),
  MIN(th.created_at),
  MAX(th.created_at)
FROM training_history th
JOIN employees e ON th.employee_id = e.id
WHERE th.created_at >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '12 months')

UNION ALL

SELECT 
  'education_history',
  COUNT(*),
  COUNT(DISTINCT e.department),
  MIN(eh.created_at),
  MAX(eh.created_at)
FROM education_history eh
JOIN employees e ON eh.employee_id = e.id
WHERE eh.created_at >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '12 months');

-- 4. Check employees updated in last 12 months
SELECT 
  COUNT(*) as total_employees_updated,
  COUNT(DISTINCT department) as departments_with_updates,
  MIN(updated_at) as oldest_update,
  MAX(updated_at) as newest_update
FROM employees
WHERE updated_at >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '12 months')
  AND updated_at != created_at; -- Only actual updates, not initial creation

-- 5. Try to query the view directly
SELECT * FROM unit_activity_summary 
ORDER BY month DESC, department
LIMIT 10;

-- 6. Check current user role
SELECT 
  auth.uid() as user_id,
  (SELECT role FROM user_roles WHERE user_id = auth.uid()) as user_role;

-- 7. Check if there's any data for current month
SELECT 
  department,
  month,
  total_changes,
  employees_updated,
  mutations,
  position_changes,
  rank_changes,
  training_records,
  education_records,
  last_update
FROM unit_activity_summary
WHERE month = DATE_TRUNC('month', CURRENT_DATE)
ORDER BY total_changes DESC;

-- 8. Check all departments
SELECT DISTINCT department 
FROM employees 
ORDER BY department;
