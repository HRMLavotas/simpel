-- Migration: Add Unit Activity Monitoring
-- Purpose: Track data changes per unit for admin pusat monitoring

-- Create a view that aggregates all data changes per unit per month
CREATE OR REPLACE VIEW unit_activity_summary AS
WITH employee_changes AS (
  SELECT 
    e.department,
    DATE_TRUNC('month', e.updated_at) as month,
    COUNT(DISTINCT e.id) as employees_updated,
    MAX(e.updated_at) as last_update
  FROM employees e
  WHERE e.updated_at >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '12 months')
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
),
all_months AS (
  SELECT DISTINCT department, month
  FROM (
    SELECT department, month FROM employee_changes
    UNION SELECT department, month FROM mutation_changes
    UNION SELECT department, month FROM position_changes
    UNION SELECT department, month FROM rank_changes
    UNION SELECT department, month FROM training_changes
    UNION SELECT department, month FROM education_changes
  ) combined
)
SELECT 
  am.department,
  am.month,
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
FROM all_months am
LEFT JOIN employee_changes ec ON am.department = ec.department AND am.month = ec.month
LEFT JOIN mutation_changes mc ON am.department = mc.department AND am.month = mc.month
LEFT JOIN position_changes pc ON am.department = pc.department AND am.month = pc.month
LEFT JOIN rank_changes rc ON am.department = rc.department AND am.month = rc.month
LEFT JOIN training_changes tc ON am.department = tc.department AND am.month = tc.month
LEFT JOIN education_changes edc ON am.department = edc.department AND am.month = edc.month
ORDER BY am.month DESC, am.department;

-- Grant access to authenticated users
GRANT SELECT ON unit_activity_summary TO authenticated;

-- Create a function to get detailed changes for a specific unit and month
CREATE OR REPLACE FUNCTION get_unit_monthly_details(
  p_department TEXT,
  p_month DATE
)
RETURNS TABLE (
  change_type TEXT,
  employee_name TEXT,
  employee_nip TEXT,
  change_date TIMESTAMPTZ,
  details JSONB
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  -- Mutations
  SELECT 
    'Mutasi'::TEXT as change_type,
    e.name as employee_name,
    e.nip as employee_nip,
    mh.created_at as change_date,
    jsonb_build_object(
      'dari_unit', mh.dari_unit,
      'ke_unit', mh.ke_unit,
      'nomor_sk', mh.nomor_sk,
      'tanggal', mh.tanggal
    ) as details
  FROM mutation_history mh
  JOIN employees e ON mh.employee_id = e.id
  WHERE e.department = p_department
    AND DATE_TRUNC('month', mh.created_at) = DATE_TRUNC('month', p_month)
  
  UNION ALL
  
  -- Position changes
  SELECT 
    'Perubahan Jabatan'::TEXT,
    e.name,
    e.nip,
    ph.created_at,
    jsonb_build_object(
      'jabatan_lama', ph.jabatan_lama,
      'jabatan_baru', ph.jabatan_baru,
      'nomor_sk', ph.nomor_sk,
      'tanggal', ph.tanggal
    )
  FROM position_history ph
  JOIN employees e ON ph.employee_id = e.id
  WHERE e.department = p_department
    AND DATE_TRUNC('month', ph.created_at) = DATE_TRUNC('month', p_month)
  
  UNION ALL
  
  -- Rank changes
  SELECT 
    'Kenaikan Pangkat'::TEXT,
    e.name,
    e.nip,
    rh.created_at,
    jsonb_build_object(
      'pangkat_lama', rh.pangkat_lama,
      'pangkat_baru', rh.pangkat_baru,
      'nomor_sk', rh.nomor_sk,
      'tmt', rh.tmt
    )
  FROM rank_history rh
  JOIN employees e ON rh.employee_id = e.id
  WHERE e.department = p_department
    AND DATE_TRUNC('month', rh.created_at) = DATE_TRUNC('month', p_month)
  
  UNION ALL
  
  -- Training
  SELECT 
    'Diklat/Pelatihan'::TEXT,
    e.name,
    e.nip,
    th.created_at,
    jsonb_build_object(
      'nama_diklat', th.nama_diklat,
      'penyelenggara', th.penyelenggara,
      'tanggal_mulai', th.tanggal_mulai,
      'tanggal_selesai', th.tanggal_selesai
    )
  FROM training_history th
  JOIN employees e ON th.employee_id = e.id
  WHERE e.department = p_department
    AND DATE_TRUNC('month', th.created_at) = DATE_TRUNC('month', p_month)
  
  UNION ALL
  
  -- Education
  SELECT 
    'Pendidikan'::TEXT,
    e.name,
    e.nip,
    eh.created_at,
    jsonb_build_object(
      'jenjang', eh.jenjang,
      'institusi', eh.institusi,
      'jurusan', eh.jurusan,
      'tahun_lulus', eh.tahun_lulus
    )
  FROM education_history eh
  JOIN employees e ON eh.employee_id = e.id
  WHERE e.department = p_department
    AND DATE_TRUNC('month', eh.created_at) = DATE_TRUNC('month', p_month)
  
  ORDER BY change_date DESC;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_unit_monthly_details(TEXT, DATE) TO authenticated;

-- Note: RLS policies cannot be applied directly to views
-- Access control is handled through the underlying tables' RLS policies
-- Only admin_pusat and admin_pimpinan can access this view through application logic
