-- =============================================
-- Comprehensive AI Functions
-- Complete set of functions for various scenarios
-- =============================================

-- 1. Get employees by rank/golongan
CREATE OR REPLACE FUNCTION public.ai_get_employees_by_rank(
  p_rank_group TEXT,
  p_department TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
  name TEXT,
  nip TEXT,
  asn_status TEXT,
  rank_group TEXT,
  position_name TEXT,
  department TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    e.name::TEXT,
    e.nip::TEXT,
    e.asn_status::TEXT,
    e.rank_group::TEXT,
    e.position_name::TEXT,
    e.department::TEXT
  FROM employees e
  WHERE e.is_active = true
    AND e.rank_group ILIKE '%' || p_rank_group || '%'
    AND (p_department IS NULL OR e.department = p_department)
  ORDER BY e.name
  LIMIT p_limit;
END;
$$;

-- 2. Get employees by gender
CREATE OR REPLACE FUNCTION public.ai_count_employees_by_gender(
  p_department TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSON;
BEGIN
  SELECT json_build_object(
    'total', COUNT(*),
    'laki_laki', COUNT(*) FILTER (WHERE gender = 'Laki-laki' OR gender = 'Laki/Laki'),
    'perempuan', COUNT(*) FILTER (WHERE gender = 'Perempuan'),
    'by_gender', (
      SELECT json_object_agg(gender, count)
      FROM (
        SELECT gender, COUNT(*) as count
        FROM employees
        WHERE is_active = true
          AND (p_department IS NULL OR department = p_department)
          AND gender IS NOT NULL
        GROUP BY gender
      ) sub
    )
  ) INTO v_result
  FROM employees
  WHERE is_active = true
    AND (p_department IS NULL OR department = p_department);
  
  RETURN v_result;
END;
$$;

-- 3. Get retirement forecast (pegawai yang akan pensiun)
CREATE OR REPLACE FUNCTION public.ai_get_retirement_forecast(
  p_years_ahead INTEGER DEFAULT 5,
  p_department TEXT DEFAULT NULL
)
RETURNS TABLE (
  retirement_year INTEGER,
  count BIGINT,
  names TEXT[]
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    EXTRACT(YEAR FROM (e.birth_date + INTERVAL '58 years'))::INTEGER as retirement_year,
    COUNT(*) as count,
    ARRAY_AGG(e.name::TEXT ORDER BY e.name) as names
  FROM employees e
  WHERE e.is_active = true
    AND e.birth_date IS NOT NULL
    AND e.asn_status IN ('PNS', 'CPNS')
    AND (p_department IS NULL OR e.department = p_department)
    AND EXTRACT(YEAR FROM (e.birth_date + INTERVAL '58 years')) BETWEEN 
        EXTRACT(YEAR FROM CURRENT_DATE) AND 
        EXTRACT(YEAR FROM CURRENT_DATE) + p_years_ahead
  GROUP BY retirement_year
  ORDER BY retirement_year;
END;
$$;

-- 4. Get employees by age range
CREATE OR REPLACE FUNCTION public.ai_get_employees_by_age_range(
  p_min_age INTEGER,
  p_max_age INTEGER,
  p_department TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
  name TEXT,
  nip TEXT,
  age INTEGER,
  birth_date DATE,
  department TEXT,
  position_name TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    e.name::TEXT,
    e.nip::TEXT,
    EXTRACT(YEAR FROM AGE(CURRENT_DATE, e.birth_date))::INTEGER as age,
    e.birth_date,
    e.department::TEXT,
    e.position_name::TEXT
  FROM employees e
  WHERE e.is_active = true
    AND e.birth_date IS NOT NULL
    AND EXTRACT(YEAR FROM AGE(CURRENT_DATE, e.birth_date)) BETWEEN p_min_age AND p_max_age
    AND (p_department IS NULL OR e.department = p_department)
  ORDER BY e.birth_date DESC
  LIMIT p_limit;
END;
$$;

-- 5. Get newest employees (by join date)
CREATE OR REPLACE FUNCTION public.ai_get_newest_employees(
  p_limit INTEGER DEFAULT 10,
  p_department TEXT DEFAULT NULL
)
RETURNS TABLE (
  name TEXT,
  nip TEXT,
  join_date DATE,
  asn_status TEXT,
  position_name TEXT,
  department TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    e.name::TEXT,
    e.nip::TEXT,
    e.join_date,
    e.asn_status::TEXT,
    e.position_name::TEXT,
    e.department::TEXT
  FROM employees e
  WHERE e.is_active = true
    AND e.join_date IS NOT NULL
    AND (p_department IS NULL OR e.department = p_department)
  ORDER BY e.join_date DESC
  LIMIT p_limit;
END;
$$;

-- 6. Get senior employees (by join date)
CREATE OR REPLACE FUNCTION public.ai_get_senior_employees(
  p_limit INTEGER DEFAULT 10,
  p_department TEXT DEFAULT NULL
)
RETURNS TABLE (
  name TEXT,
  nip TEXT,
  join_date DATE,
  years_of_service INTEGER,
  asn_status TEXT,
  position_name TEXT,
  department TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    e.name::TEXT,
    e.nip::TEXT,
    e.join_date,
    EXTRACT(YEAR FROM AGE(CURRENT_DATE, e.join_date))::INTEGER as years_of_service,
    e.asn_status::TEXT,
    e.position_name::TEXT,
    e.department::TEXT
  FROM employees e
  WHERE e.is_active = true
    AND e.join_date IS NOT NULL
    AND (p_department IS NULL OR e.department = p_department)
  ORDER BY e.join_date ASC
  LIMIT p_limit;
END;
$$;

-- 7. Compare two departments
CREATE OR REPLACE FUNCTION public.ai_compare_departments(
  p_department1 TEXT,
  p_department2 TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSON;
BEGIN
  SELECT json_build_object(
    'department1', json_build_object(
      'name', p_department1,
      'total', (SELECT COUNT(*) FROM employees WHERE is_active = true AND department = p_department1),
      'pns', (SELECT COUNT(*) FROM employees WHERE is_active = true AND department = p_department1 AND asn_status = 'PNS'),
      'cpns', (SELECT COUNT(*) FROM employees WHERE is_active = true AND department = p_department1 AND asn_status = 'CPNS'),
      'pppk', (SELECT COUNT(*) FROM employees WHERE is_active = true AND department = p_department1 AND asn_status = 'PPPK'),
      'non_asn', (SELECT COUNT(*) FROM employees WHERE is_active = true AND department = p_department1 AND asn_status = 'Non ASN')
    ),
    'department2', json_build_object(
      'name', p_department2,
      'total', (SELECT COUNT(*) FROM employees WHERE is_active = true AND department = p_department2),
      'pns', (SELECT COUNT(*) FROM employees WHERE is_active = true AND department = p_department2 AND asn_status = 'PNS'),
      'cpns', (SELECT COUNT(*) FROM employees WHERE is_active = true AND department = p_department2 AND asn_status = 'CPNS'),
      'pppk', (SELECT COUNT(*) FROM employees WHERE is_active = true AND department = p_department2 AND asn_status = 'PPPK'),
      'non_asn', (SELECT COUNT(*) FROM employees WHERE is_active = true AND department = p_department2 AND asn_status = 'Non ASN')
    )
  ) INTO v_result;
  
  RETURN v_result;
END;
$$;

-- 8. Get all unique departments
CREATE OR REPLACE FUNCTION public.ai_get_all_departments()
RETURNS TABLE (
  department TEXT,
  employee_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    e.department::TEXT,
    COUNT(*) as employee_count
  FROM employees e
  WHERE e.is_active = true
    AND e.department IS NOT NULL
  GROUP BY e.department
  ORDER BY employee_count DESC;
END;
$$;

-- 9. Get all unique positions
CREATE OR REPLACE FUNCTION public.ai_get_all_positions(
  p_department TEXT DEFAULT NULL
)
RETURNS TABLE (
  position_name TEXT,
  employee_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    e.position_name::TEXT,
    COUNT(*) as employee_count
  FROM employees e
  WHERE e.is_active = true
    AND e.position_name IS NOT NULL
    AND (p_department IS NULL OR e.department = p_department)
  GROUP BY e.position_name
  ORDER BY employee_count DESC;
END;
$$;

-- 10. Get summary for a specific employee (by name or NIP)
CREATE OR REPLACE FUNCTION public.ai_get_employee_summary(
  p_search TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSON;
  v_employee RECORD;
BEGIN
  -- Try to find employee by name or NIP
  SELECT * INTO v_employee
  FROM employees
  WHERE is_active = true
    AND (name ILIKE '%' || p_search || '%' OR nip LIKE '%' || p_search || '%')
  LIMIT 1;
  
  IF v_employee IS NULL THEN
    RETURN json_build_object('found', false, 'message', 'Employee not found');
  END IF;
  
  SELECT json_build_object(
    'found', true,
    'employee', json_build_object(
      'name', v_employee.name,
      'nip', v_employee.nip,
      'asn_status', v_employee.asn_status,
      'rank_group', v_employee.rank_group,
      'position_type', v_employee.position_type,
      'position_name', v_employee.position_name,
      'department', v_employee.department,
      'gender', v_employee.gender,
      'birth_date', v_employee.birth_date,
      'age', EXTRACT(YEAR FROM AGE(CURRENT_DATE, v_employee.birth_date)),
      'join_date', v_employee.join_date,
      'years_of_service', EXTRACT(YEAR FROM AGE(CURRENT_DATE, v_employee.join_date)),
      'phone', v_employee.phone,
      'mobile_phone', v_employee.mobile_phone,
      'address', v_employee.address
    )
  ) INTO v_result;
  
  RETURN v_result;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.ai_get_employees_by_rank(TEXT, TEXT, INTEGER) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.ai_count_employees_by_gender(TEXT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.ai_get_retirement_forecast(INTEGER, TEXT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.ai_get_employees_by_age_range(INTEGER, INTEGER, TEXT, INTEGER) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.ai_get_newest_employees(INTEGER, TEXT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.ai_get_senior_employees(INTEGER, TEXT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.ai_compare_departments(TEXT, TEXT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.ai_get_all_departments() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.ai_get_all_positions(TEXT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.ai_get_employee_summary(TEXT) TO authenticated, service_role;

-- Add comments
COMMENT ON FUNCTION public.ai_get_employees_by_rank IS 'Get employees by rank/golongan';
COMMENT ON FUNCTION public.ai_count_employees_by_gender IS 'Count employees by gender';
COMMENT ON FUNCTION public.ai_get_retirement_forecast IS 'Get retirement forecast for next N years';
COMMENT ON FUNCTION public.ai_get_employees_by_age_range IS 'Get employees within age range';
COMMENT ON FUNCTION public.ai_get_newest_employees IS 'Get newest employees by join date';
COMMENT ON FUNCTION public.ai_get_senior_employees IS 'Get most senior employees by join date';
COMMENT ON FUNCTION public.ai_compare_departments IS 'Compare statistics between two departments';
COMMENT ON FUNCTION public.ai_get_all_departments IS 'Get list of all departments with employee count';
COMMENT ON FUNCTION public.ai_get_all_positions IS 'Get list of all positions with employee count';
COMMENT ON FUNCTION public.ai_get_employee_summary IS 'Get comprehensive summary for a specific employee';
