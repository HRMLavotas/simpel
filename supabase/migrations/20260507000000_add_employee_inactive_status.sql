-- =============================================
-- Add Non-Active Employee Status Feature
-- Adds ability to mark employees as inactive (retired, resigned, deceased)
-- =============================================

-- Add columns to employees table
ALTER TABLE public.employees
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE NOT NULL,
ADD COLUMN IF NOT EXISTS inactive_date DATE,
ADD COLUMN IF NOT EXISTS inactive_reason VARCHAR(50);

-- Add comment for documentation
COMMENT ON COLUMN public.employees.is_active IS 'Whether employee is currently active (TRUE) or inactive (FALSE)';
COMMENT ON COLUMN public.employees.inactive_date IS 'Date when employee became inactive';
COMMENT ON COLUMN public.employees.inactive_reason IS 'Reason for inactive status: Pensiun, Resign, Meninggal, Lainnya';

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_employees_is_active ON public.employees(is_active);
CREATE INDEX IF NOT EXISTS idx_employees_inactive_date ON public.employees(inactive_date) WHERE inactive_date IS NOT NULL;

-- Create inactive_history table to track status changes
CREATE TABLE IF NOT EXISTS public.inactive_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  inactive_date DATE NOT NULL,
  inactive_reason VARCHAR(50) NOT NULL,
  sk_number VARCHAR(100),
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add indexes for inactive_history
CREATE INDEX IF NOT EXISTS idx_inactive_history_employee_id ON public.inactive_history(employee_id);
CREATE INDEX IF NOT EXISTS idx_inactive_history_inactive_date ON public.inactive_history(inactive_date);

-- Enable RLS on inactive_history
ALTER TABLE public.inactive_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for inactive_history (mirror employees policies)
CREATE POLICY "Admin pusat can view all inactive history"
ON public.inactive_history FOR SELECT
USING (public.has_role(auth.uid(), 'admin_pusat'));

CREATE POLICY "Admin unit can view own department inactive history"
ON public.inactive_history FOR SELECT
USING (
  public.has_role(auth.uid(), 'admin_unit') 
  AND EXISTS (
    SELECT 1 FROM public.employees e
    WHERE e.id = inactive_history.employee_id
    AND e.department = ANY(public.get_accessible_departments(auth.uid()))
  )
);

CREATE POLICY "Admin pimpinan can view all inactive history"
ON public.inactive_history FOR SELECT
USING (public.has_role(auth.uid(), 'admin_pimpinan'));

CREATE POLICY "Admin pusat can insert inactive history"
ON public.inactive_history FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin_pusat'));

CREATE POLICY "Admin unit can insert own department inactive history"
ON public.inactive_history FOR INSERT
WITH CHECK (
  public.has_role(auth.uid(), 'admin_unit')
  AND EXISTS (
    SELECT 1 FROM public.employees e
    WHERE e.id = inactive_history.employee_id
    AND e.department = ANY(public.get_accessible_departments(auth.uid()))
  )
);

CREATE POLICY "Admin pusat can update inactive history"
ON public.inactive_history FOR UPDATE
USING (public.has_role(auth.uid(), 'admin_pusat'));

CREATE POLICY "Admin unit can update own department inactive history"
ON public.inactive_history FOR UPDATE
USING (
  public.has_role(auth.uid(), 'admin_unit')
  AND EXISTS (
    SELECT 1 FROM public.employees e
    WHERE e.id = inactive_history.employee_id
    AND e.department = ANY(public.get_accessible_departments(auth.uid()))
  )
);

-- Update get_dashboard_stats function to exclude inactive employees by default
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
  v_pppk INT;
  v_non_asn INT;
  v_inactive INT;
BEGIN
  -- === STATS COUNTS (EXCLUDE INACTIVE BY DEFAULT) ===
  SELECT COUNT(*) INTO v_total
  FROM employees e
  WHERE (p_department IS NULL OR e.department = p_department)
    AND (p_asn_status IS NULL OR e.asn_status = ANY(p_asn_status))
    AND (p_include_inactive OR e.is_active = TRUE);

  -- Count PNS (includes CPNS as they are also ASN)
  SELECT COUNT(*) INTO v_pns
  FROM employees e
  WHERE e.asn_status IN ('PNS', 'CPNS')
    AND (p_department IS NULL OR e.department = p_department)
    AND (p_include_inactive OR e.is_active = TRUE);

  SELECT COUNT(*) INTO v_pppk
  FROM employees e
  WHERE e.asn_status = 'PPPK'
    AND (p_department IS NULL OR e.department = p_department)
    AND (p_include_inactive OR e.is_active = TRUE);

  SELECT COUNT(*) INTO v_non_asn
  FROM employees e
  WHERE e.asn_status = 'Non ASN'
    AND (p_department IS NULL OR e.department = p_department)
    AND (p_include_inactive OR e.is_active = TRUE);

  -- Count inactive employees
  SELECT COUNT(*) INTO v_inactive
  FROM employees e
  WHERE e.is_active = FALSE
    AND (p_department IS NULL OR e.department = p_department)
    AND (p_asn_status IS NULL OR e.asn_status = ANY(p_asn_status));

  -- === BUILD FULL RESULT ===
  result = jsonb_build_object(
    'stats', jsonb_build_object(
      'total', v_total,
      'pns', v_pns,
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
          AND (p_include_inactive OR e.is_active = TRUE)
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
          AND (p_include_inactive OR e.is_active = TRUE)
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
          AND (p_include_inactive OR e.is_active = TRUE)
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
          AND (p_include_inactive OR e.is_active = TRUE)
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
          AND (p_include_inactive OR e.is_active = TRUE)
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
          AND (p_include_inactive OR e.is_active = TRUE)
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
          AND (p_include_inactive OR e.is_active = TRUE)
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
          AND (p_include_inactive OR e.is_active = TRUE)
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
          AND (p_include_inactive OR e.is_active = TRUE)
          AND birth_date IS NOT NULL
          AND asn_status IN ('PNS', 'CPNS')
        GROUP BY retirement_year
        ORDER BY retirement_year
      ) sub
    ),
    'byEducation', (
      SELECT COALESCE(jsonb_object_agg(education_level, count), '{}'::jsonb)
      FROM (
        SELECT education_level, COUNT(*) as count
        FROM employees e
        WHERE (p_department IS NULL OR e.department = p_department)
          AND (p_asn_status IS NULL OR e.asn_status = ANY(p_asn_status))
          AND (p_include_inactive OR e.is_active = TRUE)
          AND education_level IS NOT NULL
        GROUP BY education_level
      ) sub
    )
  );

  RETURN result;
END;
$$;

-- Add trigger to update updated_at on inactive_history
CREATE OR REPLACE FUNCTION update_inactive_history_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_inactive_history_updated_at
BEFORE UPDATE ON public.inactive_history
FOR EACH ROW
EXECUTE FUNCTION update_inactive_history_updated_at();

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON public.inactive_history TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
