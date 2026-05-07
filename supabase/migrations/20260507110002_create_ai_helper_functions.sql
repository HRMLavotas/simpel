-- =============================================
-- AI Helper Functions
-- Optimized backend functions for AI to call
-- =============================================

-- 1. Search employee by name (fuzzy search)
CREATE OR REPLACE FUNCTION public.ai_search_employee_by_name(
  p_search_name TEXT,
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  nip TEXT,
  asn_status TEXT,
  rank_group TEXT,
  position_type TEXT,
  position_name TEXT,
  department TEXT,
  gender TEXT,
  birth_date DATE,
  phone TEXT,
  mobile_phone TEXT,
  address TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    e.id,
    e.name::TEXT,
    e.nip::TEXT,
    e.asn_status::TEXT,
    e.rank_group::TEXT,
    e.position_type::TEXT,
    e.position_name::TEXT,
    e.department::TEXT,
    e.gender::TEXT,
    e.birth_date,
    e.phone::TEXT,
    e.mobile_phone::TEXT,
    e.address::TEXT
  FROM employees e
  WHERE e.is_active = true
    AND e.name ILIKE '%' || p_search_name || '%'
  ORDER BY 
    CASE 
      WHEN e.name ILIKE p_search_name THEN 1
      WHEN e.name ILIKE p_search_name || '%' THEN 2
      WHEN e.name ILIKE '%' || p_search_name THEN 3
      ELSE 4
    END,
    e.name
  LIMIT p_limit;
END;
$$;

-- 2. Get employee statistics
CREATE OR REPLACE FUNCTION public.ai_get_employee_statistics(
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
    'pns', COUNT(*) FILTER (WHERE asn_status = 'PNS'),
    'cpns', COUNT(*) FILTER (WHERE asn_status = 'CPNS'),
    'pppk', COUNT(*) FILTER (WHERE asn_status = 'PPPK'),
    'non_asn', COUNT(*) FILTER (WHERE asn_status = 'Non ASN'),
    'by_department', (
      SELECT json_object_agg(department, count)
      FROM (
        SELECT department, COUNT(*) as count
        FROM employees
        WHERE is_active = true
          AND (p_department IS NULL OR department = p_department)
        GROUP BY department
        ORDER BY count DESC
      ) sub
    ),
    'by_rank_group', (
      SELECT json_object_agg(rank_group, count)
      FROM (
        SELECT rank_group, COUNT(*) as count
        FROM employees
        WHERE is_active = true
          AND (p_department IS NULL OR department = p_department)
          AND rank_group IS NOT NULL
        GROUP BY rank_group
        ORDER BY count DESC
      ) sub
    ),
    'by_position_type', (
      SELECT json_object_agg(position_type, count)
      FROM (
        SELECT position_type, COUNT(*) as count
        FROM employees
        WHERE is_active = true
          AND (p_department IS NULL OR department = p_department)
          AND position_type IS NOT NULL
        GROUP BY position_type
        ORDER BY count DESC
      ) sub
    ),
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

-- 3. Get employees by department
CREATE OR REPLACE FUNCTION public.ai_get_employees_by_department(
  p_department TEXT,
  p_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
  name TEXT,
  nip TEXT,
  asn_status TEXT,
  rank_group TEXT,
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
    e.asn_status::TEXT,
    e.rank_group::TEXT,
    e.position_name::TEXT
  FROM employees e
  WHERE e.is_active = true
    AND e.department = p_department
  ORDER BY e.name
  LIMIT p_limit;
END;
$$;

-- 4. Get employees by ASN status
CREATE OR REPLACE FUNCTION public.ai_get_employees_by_status(
  p_asn_status TEXT,
  p_department TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
  name TEXT,
  nip TEXT,
  department TEXT,
  rank_group TEXT,
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
    e.department::TEXT,
    e.rank_group::TEXT,
    e.position_name::TEXT
  FROM employees e
  WHERE e.is_active = true
    AND e.asn_status = p_asn_status
    AND (p_department IS NULL OR e.department = p_department)
  ORDER BY e.name
  LIMIT p_limit;
END;
$$;

-- 5. Search employee by NIP
CREATE OR REPLACE FUNCTION public.ai_search_employee_by_nip(
  p_nip TEXT
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  nip TEXT,
  asn_status TEXT,
  rank_group TEXT,
  position_type TEXT,
  position_name TEXT,
  department TEXT,
  gender TEXT,
  birth_date DATE,
  join_date DATE,
  tmt_cpns DATE,
  tmt_pns DATE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    e.id,
    e.name::TEXT,
    e.nip::TEXT,
    e.asn_status::TEXT,
    e.rank_group::TEXT,
    e.position_type::TEXT,
    e.position_name::TEXT,
    e.department::TEXT,
    e.gender::TEXT,
    e.birth_date,
    e.join_date,
    e.tmt_cpns,
    e.tmt_pns
  FROM employees e
  WHERE e.is_active = true
    AND e.nip LIKE '%' || p_nip || '%'
  LIMIT 5;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.ai_search_employee_by_name(TEXT, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.ai_search_employee_by_name(TEXT, INTEGER) TO service_role;

GRANT EXECUTE ON FUNCTION public.ai_get_employee_statistics(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.ai_get_employee_statistics(TEXT) TO service_role;

GRANT EXECUTE ON FUNCTION public.ai_get_employees_by_department(TEXT, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.ai_get_employees_by_department(TEXT, INTEGER) TO service_role;

GRANT EXECUTE ON FUNCTION public.ai_get_employees_by_status(TEXT, TEXT, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.ai_get_employees_by_status(TEXT, TEXT, INTEGER) TO service_role;

GRANT EXECUTE ON FUNCTION public.ai_search_employee_by_nip(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.ai_search_employee_by_nip(TEXT) TO service_role;

-- Add comments
COMMENT ON FUNCTION public.ai_search_employee_by_name IS 'Search employees by name with fuzzy matching (for AI chatbot)';
COMMENT ON FUNCTION public.ai_get_employee_statistics IS 'Get comprehensive employee statistics (for AI chatbot)';
COMMENT ON FUNCTION public.ai_get_employees_by_department IS 'Get employees by department (for AI chatbot)';
COMMENT ON FUNCTION public.ai_get_employees_by_status IS 'Get employees by ASN status (for AI chatbot)';
COMMENT ON FUNCTION public.ai_search_employee_by_nip IS 'Search employee by NIP (for AI chatbot)';
