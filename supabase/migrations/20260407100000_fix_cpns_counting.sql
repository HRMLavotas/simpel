-- =============================================
-- Fix CPNS counting in dashboard stats
-- CPNS should be counted as part of PNS/ASN
-- =============================================

CREATE OR REPLACE FUNCTION get_dashboard_stats(
  p_department TEXT DEFAULT NULL,
  p_asn_status TEXT[] DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSONB;
  v_total INT;
  v_pns INT;
  v_pppk INT;
  v_non_asn INT;
BEGIN
  -- === STATS COUNTS ===
  SELECT COUNT(*) INTO v_total
  FROM employees e
  WHERE (p_department IS NULL OR e.department = p_department)
    AND (p_asn_status IS NULL OR e.asn_status = ANY(p_asn_status));

  -- Count PNS (includes CPNS as they are also ASN)
  SELECT COUNT(*) INTO v_pns
  FROM employees e
  WHERE e.asn_status IN ('PNS', 'CPNS')
    AND (p_department IS NULL OR e.department = p_department);

  SELECT COUNT(*) INTO v_pppk
  FROM employees e
  WHERE e.asn_status = 'PPPK'
    AND (p_department IS NULL OR e.department = p_department);

  SELECT COUNT(*) INTO v_non_asn
  FROM employees e
  WHERE e.asn_status = 'Non ASN'
    AND (p_department IS NULL OR e.department = p_department);

  -- === BUILD FULL RESULT ===
  result = jsonb_build_object(
    'stats', jsonb_build_object(
      'total', v_total,
      'pns', v_pns,
      'pppk', v_pppk,
      'nonAsn', v_non_asn
    ),

    -- Rank distribution
    'rankData', (
      SELECT COALESCE(jsonb_agg(row_to_json(t)::jsonb ORDER BY t.count DESC), '[]'::jsonb)
      FROM (
        SELECT rank_group AS rank, COUNT(*)::int AS count
        FROM employees e
        WHERE rank_group IS NOT NULL
          AND (p_department IS NULL OR e.department = p_department)
          AND (p_asn_status IS NULL OR e.asn_status = ANY(p_asn_status))
        GROUP BY rank_group
        ORDER BY count DESC
        LIMIT 10
      ) t
    ),

    -- Department distribution
    'departmentData', (
      SELECT COALESCE(jsonb_agg(row_to_json(t)::jsonb ORDER BY t.count DESC), '[]'::jsonb)
      FROM (
        SELECT department, COUNT(*)::int AS count
        FROM employees e
        WHERE (p_department IS NULL)
          AND (p_asn_status IS NULL OR e.asn_status = ANY(p_asn_status))
        GROUP BY department
        ORDER BY count DESC
      ) t
    ),

    -- Position type distribution
    'positionTypeData', (
      SELECT COALESCE(jsonb_agg(row_to_json(t)::jsonb ORDER BY t.count DESC), '[]'::jsonb)
      FROM (
        SELECT COALESCE(position_type, 'Tidak Diketahui') AS type, COUNT(*)::int AS count
        FROM employees e
        WHERE (p_department IS NULL OR e.department = p_department)
          AND (p_asn_status IS NULL OR e.asn_status = ANY(p_asn_status))
        GROUP BY COALESCE(position_type, 'Tidak Diketahui')
        ORDER BY count DESC
      ) t
    ),

    -- Join year distribution (last 10 years)
    'joinYearData', (
      SELECT COALESCE(jsonb_agg(row_to_json(t)::jsonb ORDER BY t.year ASC), '[]'::jsonb)
      FROM (
        SELECT EXTRACT(YEAR FROM join_date)::text AS year, COUNT(*)::int AS count
        FROM employees e
        WHERE join_date IS NOT NULL
          AND (p_department IS NULL OR e.department = p_department)
          AND (p_asn_status IS NULL OR e.asn_status = ANY(p_asn_status))
        GROUP BY EXTRACT(YEAR FROM join_date)
        ORDER BY year ASC
      ) t
    ),

    -- Gender distribution
    'genderData', (
      SELECT COALESCE(jsonb_agg(row_to_json(t)::jsonb ORDER BY t.count DESC), '[]'::jsonb)
      FROM (
        SELECT COALESCE(gender, 'Tidak Diketahui') AS gender, COUNT(*)::int AS count
        FROM employees e
        WHERE (p_department IS NULL OR e.department = p_department)
          AND (p_asn_status IS NULL OR e.asn_status = ANY(p_asn_status))
        GROUP BY COALESCE(gender, 'Tidak Diketahui')
        ORDER BY count DESC
      ) t
    ),

    -- Religion distribution
    'religionData', (
      SELECT COALESCE(jsonb_agg(row_to_json(t)::jsonb ORDER BY t.count DESC), '[]'::jsonb)
      FROM (
        SELECT COALESCE(religion, 'Tidak Diketahui') AS religion, COUNT(*)::int AS count
        FROM employees e
        WHERE (p_department IS NULL OR e.department = p_department)
          AND (p_asn_status IS NULL OR e.asn_status = ANY(p_asn_status))
        GROUP BY COALESCE(religion, 'Tidak Diketahui')
        ORDER BY count DESC
      ) t
    ),

    -- TMT CPNS year distribution (last 15 years)
    'tmtCpnsData', (
      SELECT COALESCE(jsonb_agg(row_to_json(t)::jsonb ORDER BY t.year ASC), '[]'::jsonb)
      FROM (
        SELECT EXTRACT(YEAR FROM tmt_cpns)::text AS year, COUNT(*)::int AS count
        FROM employees e
        WHERE tmt_cpns IS NOT NULL
          AND (p_department IS NULL OR e.department = p_department)
          AND (p_asn_status IS NULL OR e.asn_status = ANY(p_asn_status))
        GROUP BY EXTRACT(YEAR FROM tmt_cpns)
        ORDER BY year ASC
      ) t
    ),

    -- TMT PNS year distribution (last 15 years)
    'tmtPnsData', (
      SELECT COALESCE(jsonb_agg(row_to_json(t)::jsonb ORDER BY t.year ASC), '[]'::jsonb)
      FROM (
        SELECT EXTRACT(YEAR FROM tmt_pns)::text AS year, COUNT(*)::int AS count
        FROM employees e
        WHERE tmt_pns IS NOT NULL
          AND (p_department IS NULL OR e.department = p_department)
          AND (p_asn_status IS NULL OR e.asn_status = ANY(p_asn_status))
        GROUP BY EXTRACT(YEAR FROM tmt_pns)
        ORDER BY year ASC
      ) t
    ),

    -- Work duration distribution
    'workDurationData', (
      SELECT COALESCE(jsonb_agg(row_to_json(t)::jsonb ORDER BY t."order" ASC), '[]'::jsonb)
      FROM (
        SELECT
          CASE
            WHEN diff < 5 THEN '< 5 tahun'
            WHEN diff < 10 THEN '5-10 tahun'
            WHEN diff < 20 THEN '10-20 tahun'
            WHEN diff < 30 THEN '20-30 tahun'
            ELSE '> 30 tahun'
          END AS category,
          COUNT(*)::int AS count,
          CASE
            WHEN diff < 5 THEN 1
            WHEN diff < 10 THEN 2
            WHEN diff < 20 THEN 3
            WHEN diff < 30 THEN 4
            ELSE 5
          END AS "order"
        FROM (
          SELECT EXTRACT(YEAR FROM age(NOW(), COALESCE(tmt_cpns, tmt_pns))) AS diff
          FROM employees e
          WHERE (tmt_cpns IS NOT NULL OR tmt_pns IS NOT NULL)
            AND (p_department IS NULL OR e.department = p_department)
            AND (p_asn_status IS NULL OR e.asn_status = ANY(p_asn_status))
        ) sub
        GROUP BY 1, 3
        ORDER BY 3
      ) t
    ),

    -- Age distribution
    'ageData', (
      SELECT COALESCE(jsonb_agg(row_to_json(t)::jsonb ORDER BY t."order" ASC), '[]'::jsonb)
      FROM (
        SELECT
          CASE
            WHEN age_years < 25 THEN '< 25 tahun'
            WHEN age_years < 35 THEN '25-35 tahun'
            WHEN age_years < 45 THEN '35-45 tahun'
            WHEN age_years < 55 THEN '45-55 tahun'
            ELSE '> 55 tahun'
          END AS category,
          COUNT(*)::int AS count,
          CASE
            WHEN age_years < 25 THEN 1
            WHEN age_years < 35 THEN 2
            WHEN age_years < 45 THEN 3
            WHEN age_years < 55 THEN 4
            ELSE 5
          END AS "order"
        FROM (
          SELECT EXTRACT(YEAR FROM age(NOW(), birth_date)) AS age_years
          FROM employees e
          WHERE birth_date IS NOT NULL
            AND (p_department IS NULL OR e.department = p_department)
            AND (p_asn_status IS NULL OR e.asn_status = ANY(p_asn_status))
        ) sub
        GROUP BY 1, 3
        ORDER BY 3
      ) t
    ),

    -- Retirement year distribution
    'retirementYearData', (
      SELECT COALESCE(jsonb_agg(row_to_json(t)::jsonb ORDER BY t.year ASC), '[]'::jsonb)
      FROM (
        SELECT EXTRACT(YEAR FROM tmt_pensiun)::text AS year, COUNT(*)::int AS count
        FROM employees e
        WHERE tmt_pensiun IS NOT NULL
          AND (p_department IS NULL OR e.department = p_department)
          AND (p_asn_status IS NULL OR e.asn_status = ANY(p_asn_status))
        GROUP BY EXTRACT(YEAR FROM tmt_pensiun)
        ORDER BY year ASC
      ) t
    ),

    -- Position Kepmen data
    'positionKepmenData', (
      SELECT COALESCE(jsonb_agg(row_to_json(t)::jsonb ORDER BY t.count DESC), '[]'::jsonb)
      FROM (
        SELECT pr.position_name AS position,
               COUNT(e.id)::int AS count
        FROM position_references pr
        LEFT JOIN employees e ON LOWER(TRIM(e.position_name)) = LOWER(TRIM(pr.position_name))
          AND (p_department IS NULL OR e.department = p_department)
          AND (p_asn_status IS NULL OR e.asn_status = ANY(p_asn_status))
        WHERE (p_department IS NULL OR pr.department = p_department)
        GROUP BY pr.position_name
        ORDER BY count DESC
      ) t
    ),

    -- Grade distribution
    'gradeData', (
      SELECT COALESCE(jsonb_agg(row_to_json(t)::jsonb ORDER BY t.grade_num ASC), '[]'::jsonb)
      FROM (
        SELECT 'Grade ' || pr.grade::text AS grade,
               pr.grade AS grade_num,
               COUNT(e.id)::int AS count
        FROM employees e
        JOIN position_references pr ON LOWER(TRIM(e.position_name)) = LOWER(TRIM(pr.position_name))
          AND (p_department IS NULL OR pr.department = p_department)
        WHERE pr.grade IS NOT NULL
          AND (p_department IS NULL OR e.department = p_department)
          AND (p_asn_status IS NULL OR e.asn_status = ANY(p_asn_status))
        GROUP BY pr.grade
        ORDER BY pr.grade ASC
      ) t
    ),

    -- Education distribution
    'educationData', (
      SELECT COALESCE(jsonb_agg(row_to_json(t)::jsonb ORDER BY t.count DESC), '[]'::jsonb)
      FROM (
        SELECT eh.level, COUNT(DISTINCT eh.employee_id)::int AS count
        FROM education_history eh
        JOIN employees e ON e.id = eh.employee_id
        WHERE (p_department IS NULL OR e.department = p_department)
          AND (p_asn_status IS NULL OR e.asn_status = ANY(p_asn_status))
          AND eh.id = (
            SELECT eh2.id FROM education_history eh2
            WHERE eh2.employee_id = eh.employee_id
            ORDER BY eh2.graduation_year DESC NULLS LAST
            LIMIT 1
          )
        GROUP BY eh.level
        ORDER BY count DESC
      ) t
    )
  );

  RETURN result;
END;
$$;
