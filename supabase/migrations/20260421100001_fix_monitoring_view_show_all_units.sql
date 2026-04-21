-- Fix: Show all units even if they have no activity
-- This ensures all departments appear in monitoring, even with 0 changes

-- Drop existing view
DROP VIEW IF EXISTS unit_activity_summary;

-- Recreate view with all departments included
CREATE OR REPLACE VIEW unit_activity_summary AS
WITH all_departments AS (
  -- Get all unique departments from employees table
  SELECT DISTINCT department
  FROM employees
  WHERE department IS NOT NULL AND department != ''
),
recent_months AS (
  -- Generate last 12 months
  SELECT DATE_TRUNC('month', CURRENT_DATE - (n || ' months')::INTERVAL) as month
  FROM generate_series(0, 11) n
),
all_dept_months AS (
  -- Cross join to get all combinations of departments and months
  SELECT d.department, m.month
  FROM all_departments d
  CROSS JOIN recent_months m
),
employee_changes AS (
  SELECT 
    e.department,
    DATE_TRUNC('month', e.updated_at) as month,
    COUNT(DISTINCT e.id) as employees_updated,
    MAX(e.updated_at) as last_update
  FROM employees e
  WHERE e.updated_at >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '12 months')
    AND e.updated_at != e.created_at -- Only count actual updates
  GROUP BY e.department, DATE_TRUNC('month', e.updated_at)
),
mutation_changes AS (
  SELECT 
    e.department,
    DATE_TRUNC('month', mh.created_at) as month,
    COUNT(*) as mutation_count
  FROM mutation_history mh
  JOIN employees e ON mh.employee_id = e.id
  WHERE mh.created_at >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '12 months')
  GROUP BY e.department, DATE_TRUNC('month', mh.created_at)
),
position_changes AS (
  SELECT 
    e.department,
    DATE_TRUNC('month', ph.created_at) as month,
    COUNT(*) as position_count
  FROM position_history ph
  JOIN employees e ON ph.employee_id = e.id
  WHERE ph.created_at >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '12 months')
  GROUP BY e.department, DATE_TRUNC('month', ph.created_at)
),
rank_changes AS (
  SELECT 
    e.department,
    DATE_TRUNC('month', rh.created_at) as month,
    COUNT(*) as rank_count
  FROM rank_history rh
  JOIN employees e ON rh.employee_id = e.id
  WHERE rh.created_at >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '12 months')
  GROUP BY e.department, DATE_TRUNC('month', rh.created_at)
),
training_changes AS (
  SELECT 
    e.department,
    DATE_TRUNC('month', th.created_at) as month,
    COUNT(*) as training_count
  FROM training_history th
  JOIN employees e ON th.employee_id = e.id
  WHERE th.created_at >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '12 months')
  GROUP BY e.department, DATE_TRUNC('month', th.created_at)
),
education_changes AS (
  SELECT 
    e.department,
    DATE_TRUNC('month', eh.created_at) as month,
    COUNT(*) as education_count
  FROM education_history eh
  JOIN employees e ON eh.employee_id = e.id
  WHERE eh.created_at >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '12 months')
  GROUP BY e.department, DATE_TRUNC('month', eh.created_at)
)
SELECT 
  adm.department,
  adm.month,
  COALESCE(ec.employees_updated, 0) as employees_updated,
  COALESCE(mc.mutation_count, 0) as mutations,
  COALESCE(pc.position_count, 0) as position_changes,
  COALESCE(rc.rank_count, 0) as rank_changes,
  COALESCE(tc.training_count, 0) as training_records,
  COALESCE(edc.education_count, 0) as education_records,
  (COALESCE(mc.mutation_count, 0) + 
   COALESCE(pc.position_count, 0) + 
   COALESCE(rc.rank_count, 0) + 
   COALESCE(tc.training_count, 0) + 
   COALESCE(edc.education_count, 0)) as total_changes,
  ec.last_update
FROM all_dept_months adm
LEFT JOIN employee_changes ec ON adm.department = ec.department AND adm.month = ec.month
LEFT JOIN mutation_changes mc ON adm.department = mc.department AND adm.month = mc.month
LEFT JOIN position_changes pc ON adm.department = pc.department AND adm.month = pc.month
LEFT JOIN rank_changes rc ON adm.department = rc.department AND adm.month = rc.month
LEFT JOIN training_changes tc ON adm.department = tc.department AND adm.month = tc.month
LEFT JOIN education_changes edc ON adm.department = edc.department AND adm.month = edc.month
ORDER BY adm.month DESC, adm.department;

-- Grant access
GRANT SELECT ON unit_activity_summary TO authenticated;

COMMENT ON VIEW unit_activity_summary IS 'Monitoring aktivitas update data per unit kerja per bulan. Menampilkan semua unit termasuk yang tidak ada aktivitas.';
