-- Fix get_employees_for_ai function to only use existing columns
-- Remove education_level which doesn't exist in the employees table

DROP FUNCTION IF EXISTS public.get_employees_for_ai(TEXT, INTEGER);

CREATE OR REPLACE FUNCTION public.get_employees_for_ai(
  p_department TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 300
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  nip TEXT,
  asn_status TEXT,
  rank_value TEXT,
  rank_group TEXT,
  position_type TEXT,
  position_name TEXT,
  department TEXT,
  gender TEXT,
  birth_date DATE
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
    e.rank::TEXT as rank_value,
    e.rank_group::TEXT,
    e.position_type::TEXT,
    e.position_name::TEXT,
    e.department::TEXT,
    e.gender::TEXT,
    e.birth_date
  FROM employees e
  WHERE e.is_active = true
    AND (p_department IS NULL OR e.department = p_department)
  ORDER BY e.name
  LIMIT p_limit;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_employees_for_ai(TEXT, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_employees_for_ai(TEXT, INTEGER) TO service_role;

-- Add comment
COMMENT ON FUNCTION public.get_employees_for_ai IS 'Returns employee data for AI chatbot, bypassing RLS (fixed to use only existing columns)';
