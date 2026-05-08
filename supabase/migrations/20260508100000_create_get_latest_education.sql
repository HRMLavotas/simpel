-- =============================================
-- Function: get_latest_education_per_employee
-- Returns the latest education record per employee
-- using DISTINCT ON (employee_id) ordered by graduation_year DESC
-- This avoids fetching all education_history rows and hitting the 1000-row limit
-- =============================================

CREATE OR REPLACE FUNCTION get_latest_education_per_employee()
RETURNS TABLE (
  employee_id UUID,
  level       TEXT,
  graduation_year INT
)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT DISTINCT ON (employee_id)
    employee_id,
    level,
    graduation_year
  FROM education_history
  ORDER BY employee_id, graduation_year DESC NULLS LAST;
$$;

-- Grant access to authenticated users
GRANT EXECUTE ON FUNCTION get_latest_education_per_employee() TO authenticated;
GRANT EXECUTE ON FUNCTION get_latest_education_per_employee() TO anon;

COMMENT ON FUNCTION get_latest_education_per_employee() IS
  'Returns one education record per employee — the latest by graduation_year. Used for export to avoid the 1000-row Supabase default limit.';
