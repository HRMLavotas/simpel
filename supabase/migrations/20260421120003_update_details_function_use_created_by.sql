-- Update get_unit_monthly_details to only show records with created_by
-- This ensures only manual entries by admin users are shown

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
  details JSONB,
  created_by_email TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
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
    ) as details,
    p.email::TEXT as created_by_email
  FROM mutation_history mh
  JOIN employees e ON mh.employee_id = e.id
  LEFT JOIN profiles p ON mh.created_by = p.id
  WHERE e.department = p_department
    AND DATE_TRUNC('month', mh.created_at) = DATE_TRUNC('month', p_month)
    AND mh.created_by IS NOT NULL  -- Only manual entries
  
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
    ),
    p.email::TEXT
  FROM position_history ph
  JOIN employees e ON ph.employee_id = e.id
  LEFT JOIN profiles p ON ph.created_by = p.id
  WHERE e.department = p_department
    AND DATE_TRUNC('month', ph.created_at) = DATE_TRUNC('month', p_month)
    AND ph.created_by IS NOT NULL
  
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
    ),
    p.email::TEXT
  FROM rank_history rh
  JOIN employees e ON rh.employee_id = e.id
  LEFT JOIN profiles p ON rh.created_by = p.id
  WHERE e.department = p_department
    AND DATE_TRUNC('month', rh.created_at) = DATE_TRUNC('month', p_month)
    AND rh.created_by IS NOT NULL
  
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
    ),
    p.email::TEXT
  FROM training_history th
  JOIN employees e ON th.employee_id = e.id
  LEFT JOIN profiles p ON th.created_by = p.id
  WHERE e.department = p_department
    AND DATE_TRUNC('month', th.created_at) = DATE_TRUNC('month', p_month)
    AND th.created_by IS NOT NULL
  
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
    ),
    p.email::TEXT
  FROM education_history eh
  JOIN employees e ON eh.employee_id = e.id
  LEFT JOIN profiles p ON eh.created_by = p.id
  WHERE e.department = p_department
    AND DATE_TRUNC('month', eh.created_at) = DATE_TRUNC('month', p_month)
    AND eh.created_by IS NOT NULL
  
  ORDER BY change_date DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION get_unit_monthly_details(TEXT, DATE) TO authenticated;

COMMENT ON FUNCTION get_unit_monthly_details IS 'Get detailed changes for a specific department and month. Only shows manual entries (with created_by). Includes email of user who created the record.';
