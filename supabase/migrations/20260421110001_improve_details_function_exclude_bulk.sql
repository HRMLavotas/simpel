-- Improvement: Update get_unit_monthly_details to exclude bulk imports
-- Only show manual updates by admin units

DROP FUNCTION IF EXISTS get_unit_monthly_details(TEXT, DATE);

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
  WITH bulk_import_times AS (
    -- Identify bulk import timestamps (10+ records in same second)
    SELECT DATE_TRUNC('second', created_at) as bulk_time
    FROM (
      SELECT created_at FROM mutation_history
      UNION ALL
      SELECT created_at FROM position_history
      UNION ALL
      SELECT created_at FROM rank_history
      UNION ALL
      SELECT created_at FROM training_history
      UNION ALL
      SELECT created_at FROM education_history
    ) all_history
    WHERE created_at >= DATE_TRUNC('month', p_month)
      AND created_at < DATE_TRUNC('month', p_month) + INTERVAL '1 month'
    GROUP BY DATE_TRUNC('second', created_at)
    HAVING COUNT(*) >= 10
  )
  -- Mutations
  SELECT 
    'Mutasi'::TEXT as change_type,
    e.name::TEXT as employee_name,
    COALESCE(e.nip, '')::TEXT as employee_nip,
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
    AND NOT EXISTS (
      SELECT 1 FROM bulk_import_times bit
      WHERE bit.bulk_time = DATE_TRUNC('second', mh.created_at)
    )
  
  UNION ALL
  
  -- Position changes
  SELECT 
    'Perubahan Jabatan'::TEXT,
    e.name::TEXT,
    COALESCE(e.nip, '')::TEXT,
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
    AND NOT EXISTS (
      SELECT 1 FROM bulk_import_times bit
      WHERE bit.bulk_time = DATE_TRUNC('second', ph.created_at)
    )
  
  UNION ALL
  
  -- Rank changes
  SELECT 
    'Kenaikan Pangkat'::TEXT,
    e.name::TEXT,
    COALESCE(e.nip, '')::TEXT,
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
    AND NOT EXISTS (
      SELECT 1 FROM bulk_import_times bit
      WHERE bit.bulk_time = DATE_TRUNC('second', rh.created_at)
    )
  
  UNION ALL
  
  -- Training
  SELECT 
    'Diklat/Pelatihan'::TEXT,
    e.name::TEXT,
    COALESCE(e.nip, '')::TEXT,
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
    AND NOT EXISTS (
      SELECT 1 FROM bulk_import_times bit
      WHERE bit.bulk_time = DATE_TRUNC('second', th.created_at)
    )
  
  UNION ALL
  
  -- Education
  SELECT 
    'Pendidikan'::TEXT,
    e.name::TEXT,
    COALESCE(e.nip, '')::TEXT,
    eh.created_at,
    jsonb_build_object(
      'level', eh.level,
      'institution_name', eh.institution_name,
      'major', eh.major,
      'graduation_year', eh.graduation_year
    )
  FROM education_history eh
  JOIN employees e ON eh.employee_id = e.id
  WHERE e.department = p_department
    AND DATE_TRUNC('month', eh.created_at) = DATE_TRUNC('month', p_month)
    AND NOT EXISTS (
      SELECT 1 FROM bulk_import_times bit
      WHERE bit.bulk_time = DATE_TRUNC('second', eh.created_at)
    )
  
  ORDER BY change_date DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION get_unit_monthly_details(TEXT, DATE) TO authenticated;

COMMENT ON FUNCTION get_unit_monthly_details IS 'Get detailed changes for a specific department and month. Excludes bulk imports (10+ records in same second).';
