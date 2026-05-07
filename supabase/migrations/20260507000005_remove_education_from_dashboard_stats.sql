-- =============================================
-- Remove education_level query from get_dashboard_stats
-- Column education_level does not exist in employees table
-- Education data is in separate education_history table
-- =============================================

CREATE OR REPLACE FUNCTION get_dashboard_stats(
  p_department TEXT DEFAULT NULL,
  p_asn_status TEXT[] DEFAULT NULL,
  p_include_inactive BOOLEAN DEFAULT FALSE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSONB;
  v_total INT;
  v_pns INT;
  v_cpns INT;
  v_pppk INT;
  v_non_asn INT;
  v_inactive INT;
BEGIN
  -- === STATS COUNTS (EXCLUDE INACTIVE BY DEFAULT) ===
  SELECT COUNT(*) INTO v_total
  FROM employees e
  WHERE (p_department IS NULL OR e.department = p_department)
    AND (p_asn_status IS NULL OR e.asn_status = ANY(p_asn_status))
    AND (p_include_inactive OR COALESCE(e.is_active, TRUE) = TRUE);

  -- Count PNS (excludes CPNS)
  SELECT COUNT(*) INTO v_pns
  FROM employees e
  WHERE e.asn_status = 'PNS'
    AND (p_department IS NULL OR e.department = p_department)
    AND (p_include_inactive OR COALESCE(e.is_active, TRUE) = TRUE);

  -- Count CPNS separately
  SELECT COUNT(*) INTO v_cpns
  FROM employees e
  WHERE e.asn_status = 'CPNS'
    AND (p_department IS NULL OR e.department = p_department)
    AND (p_include_inactive OR COALESCE(e.is_active, TRUE) = TRUE);

  SELECT COUNT(*) INTO v_pppk
  FROM employees e
  WHERE e.asn_status = 'PPPK'
    AND (p_department IS NULL OR e.department = p_department)
    AND (p_include_inactive OR COALESCE(e.is_active, TRUE) = TRUE);

  SELECT COUNT(*) INTO v_non_asn
  FROM employees e
  WHERE e.asn_status = 'Non ASN'
    AND (p_department IS NULL OR e.department = p_department)
    AND (p_include_inactive OR COALESCE(e.is_active, TRUE) = TRUE);

  -- Count inactive employees
  SELECT COUNT(*) INTO v_inactive
  FROM employees e
  WHERE COALESCE(e.is_active, TRUE) = FALSE
    AND (p_department IS NULL OR e.department = p_department)
    AND (p_asn_status IS NULL OR e.asn_status = ANY(p_asn_status));

  -- === BUILD FULL RESULT ===
  result = jsonb_build_object(
    'stats', jsonb_build_object(
      'total', v_total,
      'pns', v_pns,
      'cpns', v_cpns,
      'pppk', v_pppk,
      'nonAsn', v_non_asn,
      'inactive', v_inactive
    ),
    'byRank', (
      SELECT COALESCE(jsonb_object_agg(rank_group, count), '{}'::jsonb)
      FROM (
        SELECT rank_group, COUNT(*) as count
        FROM employees e
        WHERE (p_department IS NULL OR e.department = p_department)
          AND (p_asn_status IS NULL OR e.asn_status = ANY(p_asn_status))
          AND (p_include_inactive OR COALESCE(e.is_active, TRUE) = TRUE)
          AND rank_group IS NOT NULL
        GROUP BY rank_group
      ) sub
    ),
    'byDepartment', (
      SELECT COALESCE(jsonb_object_agg(department, count), '{}'::jsonb)
      FROM (
        SELECT department, COUNT(*) as count
        FROM employees e
        WHERE (p_department IS NULL OR e.department = p_department)
          AND (p_asn_status IS NULL OR e.asn_status = ANY(p_asn_status))
          AND (p_include_inactive OR COALESCE(e.is_active, TRUE) = TRUE)
        GROUP BY department
      ) sub
    ),
    'byPositionType', (
      SELECT COALESCE(jsonb_object_agg(position_type, count), '{}'::jsonb)
      FROM (
        SELECT position_type, COUNT(*) as count
        FROM employees e
        WHERE (p_department IS NULL OR e.department = p_department)
          AND (p_asn_status IS NULL OR e.asn_status = ANY(p_asn_status))
          AND (p_include_inactive OR COALESCE(e.is_active, TRUE) = TRUE)
          AND position_type IS NOT NULL
        GROUP BY position_type
      ) sub
    ),
    'byGender', (
      SELECT COALESCE(jsonb_object_agg(gender, count), '{}'::jsonb)
      FROM (
        SELECT gender, COUNT(*) as count
        FROM employees e
        WHERE (p_department IS NULL OR e.department = p_department)
          AND (p_asn_status IS NULL OR e.asn_status = ANY(p_asn_status))
          AND (p_include_inactive OR COALESCE(e.is_active, TRUE) = TRUE)
          AND gender IS NOT NULL
        GROUP BY gender
      ) sub
    ),
    'byReligion', (
      SELECT COALESCE(jsonb_object_agg(religion, count), '{}'::jsonb)
      FROM (
        SELECT religion, COUNT(*) as count
        FROM employees e
        WHERE (p_department IS NULL OR e.department = p_department)
          AND (p_asn_status IS NULL OR e.asn_status = ANY(p_asn_status))
          AND (p_include_inactive OR COALESCE(e.is_active, TRUE) = TRUE)
          AND religion IS NOT NULL
        GROUP BY religion
      ) sub
    ),
    'byWorkDuration', (
      SELECT COALESCE(jsonb_object_agg(duration_range, count), '{}'::jsonb)
      FROM (
        SELECT 
          CASE
            WHEN EXTRACT(YEAR FROM AGE(CURRENT_DATE, join_date)) < 5 THEN '0-5 tahun'
            WHEN EXTRACT(YEAR FROM AGE(CURRENT_DATE, join_date)) < 10 THEN '5-10 tahun'
            WHEN EXTRACT(YEAR FROM AGE(CURRENT_DATE, join_date)) < 15 THEN '10-15 tahun'
            WHEN EXTRACT(YEAR FROM AGE(CURRENT_DATE, join_date)) < 20 THEN '15-20 tahun'
            ELSE '20+ tahun'
          END as duration_range,
          COUNT(*) as count
        FROM employees e
        WHERE (p_department IS NULL OR e.department = p_department)
          AND (p_asn_status IS NULL OR e.asn_status = ANY(p_asn_status))
          AND (p_include_inactive OR COALESCE(e.is_active, TRUE) = TRUE)
          AND join_date IS NOT NULL
        GROUP BY duration_range
      ) sub
    ),
    'byGrade', (
      SELECT COALESCE(jsonb_object_agg(grade, count), '{}'::jsonb)
      FROM (
        SELECT 
          SUBSTRING(rank_group FROM 1 FOR POSITION('/' IN rank_group || '/') - 1) as grade,
          COUNT(*) as count
        FROM employees e
        WHERE (p_department IS NULL OR e.department = p_department)
          AND (p_asn_status IS NULL OR e.asn_status = ANY(p_asn_status))
          AND (p_include_inactive OR COALESCE(e.is_active, TRUE) = TRUE)
          AND rank_group IS NOT NULL
        GROUP BY grade
      ) sub
    ),
    'byAge', (
      SELECT COALESCE(jsonb_object_agg(age_range, count), '{}'::jsonb)
      FROM (
        SELECT 
          CASE
            WHEN EXTRACT(YEAR FROM AGE(CURRENT_DATE, birth_date)) < 25 THEN '<25'
            WHEN EXTRACT(YEAR FROM AGE(CURRENT_DATE, birth_date)) < 35 THEN '25-34'
            WHEN EXTRACT(YEAR FROM AGE(CURRENT_DATE, birth_date)) < 45 THEN '35-44'
            WHEN EXTRACT(YEAR FROM AGE(CURRENT_DATE, birth_date)) < 55 THEN '45-54'
            ELSE '55+'
          END as age_range,
          COUNT(*) as count
        FROM employees e
        WHERE (p_department IS NULL OR e.department = p_department)
          AND (p_asn_status IS NULL OR e.asn_status = ANY(p_asn_status))
          AND (p_include_inactive OR COALESCE(e.is_active, TRUE) = TRUE)
          AND birth_date IS NOT NULL
        GROUP BY age_range
      ) sub
    ),
    'byRetirementYear', (
      SELECT COALESCE(jsonb_object_agg(retirement_year::TEXT, count), '{}'::jsonb)
      FROM (
        SELECT 
          EXTRACT(YEAR FROM (birth_date + INTERVAL '58 years'))::INT as retirement_year,
          COUNT(*) as count
        FROM employees e
        WHERE (p_department IS NULL OR e.department = p_department)
          AND (p_asn_status IS NULL OR e.asn_status = ANY(p_asn_status))
          AND (p_include_inactive OR COALESCE(e.is_active, TRUE) = TRUE)
          AND birth_date IS NOT NULL
          AND asn_status IN ('PNS', 'CPNS')
        GROUP BY retirement_year
        ORDER BY retirement_year
      ) sub
    )
  );

  RETURN result;
END;
$$;

COMMENT ON FUNCTION get_dashboard_stats(TEXT, TEXT[], BOOLEAN) IS 'Get dashboard statistics excluding inactive employees by default. Education data removed as it is in separate table.';
