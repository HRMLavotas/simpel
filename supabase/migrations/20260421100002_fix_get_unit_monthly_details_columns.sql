-- Fix: Correct column names in get_unit_monthly_details function
-- education_history uses: level, institution_name, major, graduation_year
-- NOT: jenjang, institusi, jurusan, tahun_lulus

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
  
  -- Education (FIXED COLUMN NAMES)
  SELECT 
    'Pendidikan'::TEXT,
    e.name,
    e.nip,
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
  
  ORDER BY change_date DESC;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_unit_monthly_details(TEXT, DATE) TO authenticated;

COMMENT ON FUNCTION get_unit_monthly_details IS 'Get detailed changes for a specific department and month. Returns all types of changes with employee info and details.';
