-- =============================================
-- Function: get_latest_education_per_employee (Updated)
-- Returns the latest education record per employee
-- NOW INCLUDES: major (jurusan) field
-- =============================================

-- Drop existing function first (required when changing return type)
DROP FUNCTION IF EXISTS get_latest_education_per_employee();

-- Create new function with updated return type
CREATE OR REPLACE FUNCTION get_latest_education_per_employee()
RETURNS TABLE (
  employee_id UUID,
  level       TEXT,
  major       TEXT,
  graduation_year INT
)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT DISTINCT ON (employee_id)
    employee_id,
    level,
    major,
    graduation_year
  FROM education_history
  ORDER BY employee_id, graduation_year DESC NULLS LAST;
$$;

-- Grant access to authenticated users
GRANT EXECUTE ON FUNCTION get_latest_education_per_employee() TO authenticated;
GRANT EXECUTE ON FUNCTION get_latest_education_per_employee() TO anon;

COMMENT ON FUNCTION get_latest_education_per_employee() IS
  'Returns one education record per employee — the latest by graduation_year. Includes level and major (jurusan). Used for export to avoid the 1000-row Supabase default limit.';
