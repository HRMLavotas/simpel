-- =============================================
-- AI Analysis Functions
-- For detailed analysis queries
-- =============================================

-- 1. Get employees by position name and department
CREATE OR REPLACE FUNCTION public.ai_get_employees_by_position_and_department(
  p_position_name TEXT,
  p_department TEXT,
  p_limit INTEGER DEFAULT 100
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
    AND e.position_name ILIKE '%' || p_position_name || '%'
    AND e.department = p_department
  ORDER BY e.name
  LIMIT p_limit;
END;
$$;

-- 2. Count employees by position name and department
CREATE OR REPLACE FUNCTION public.ai_count_employees_by_position_and_department(
  p_position_name TEXT,
  p_department TEXT
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM employees e
  WHERE e.is_active = true
    AND e.position_name ILIKE '%' || p_position_name || '%'
    AND e.department = p_department;
  
  RETURN v_count;
END;
$$;

-- 3. Get detailed breakdown by position in a department
CREATE OR REPLACE FUNCTION public.ai_get_position_breakdown_by_department(
  p_department TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSON;
BEGIN
  SELECT json_build_object(
    'department', p_department,
    'total_employees', COUNT(*),
    'by_position', (
      SELECT json_object_agg(position_name, count)
      FROM (
        SELECT position_name, COUNT(*) as count
        FROM employees
        WHERE is_active = true
          AND department = p_department
          AND position_name IS NOT NULL
        GROUP BY position_name
        ORDER BY count DESC
      ) sub
    ),
    'by_position_type', (
      SELECT json_object_agg(position_type, count)
      FROM (
        SELECT position_type, COUNT(*) as count
        FROM employees
        WHERE is_active = true
          AND department = p_department
          AND position_type IS NOT NULL
        GROUP BY position_type
      ) sub
    )
  ) INTO v_result
  FROM employees
  WHERE is_active = true
    AND department = p_department;
  
  RETURN v_result;
END;
$$;

-- 4. Search employees with flexible filters
CREATE OR REPLACE FUNCTION public.ai_search_employees_flexible(
  p_department TEXT DEFAULT NULL,
  p_position_name TEXT DEFAULT NULL,
  p_asn_status TEXT DEFAULT NULL,
  p_rank_group TEXT DEFAULT NULL,
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
    AND (p_department IS NULL OR e.department = p_department)
    AND (p_position_name IS NULL OR e.position_name ILIKE '%' || p_position_name || '%')
    AND (p_asn_status IS NULL OR e.asn_status = p_asn_status)
    AND (p_rank_group IS NULL OR e.rank_group ILIKE '%' || p_rank_group || '%')
  ORDER BY e.name
  LIMIT p_limit;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.ai_get_employees_by_position_and_department(TEXT, TEXT, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.ai_get_employees_by_position_and_department(TEXT, TEXT, INTEGER) TO service_role;

GRANT EXECUTE ON FUNCTION public.ai_count_employees_by_position_and_department(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.ai_count_employees_by_position_and_department(TEXT, TEXT) TO service_role;

GRANT EXECUTE ON FUNCTION public.ai_get_position_breakdown_by_department(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.ai_get_position_breakdown_by_department(TEXT) TO service_role;

GRANT EXECUTE ON FUNCTION public.ai_search_employees_flexible(TEXT, TEXT, TEXT, TEXT, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.ai_search_employees_flexible(TEXT, TEXT, TEXT, TEXT, INTEGER) TO service_role;

-- Add comments
COMMENT ON FUNCTION public.ai_get_employees_by_position_and_department IS 'Get list of employees by position name and department (for AI chatbot)';
COMMENT ON FUNCTION public.ai_count_employees_by_position_and_department IS 'Count employees by position name and department (for AI chatbot)';
COMMENT ON FUNCTION public.ai_get_position_breakdown_by_department IS 'Get detailed position breakdown for a department (for AI chatbot)';
COMMENT ON FUNCTION public.ai_search_employees_flexible IS 'Flexible employee search with multiple filters (for AI chatbot)';
