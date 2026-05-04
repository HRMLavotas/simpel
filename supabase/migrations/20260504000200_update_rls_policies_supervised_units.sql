-- Update RLS policies to use get_accessible_departments function
-- This allows admin_unit to access employees in their supervised Satpel/Workshop units

-- Update RLS policy for employees SELECT to include supervised units
DROP POLICY IF EXISTS "Admin unit can view own department employees" ON public.employees;

CREATE POLICY "Admin unit can view own department employees"
ON public.employees FOR SELECT
USING (
  public.has_role(auth.uid(), 'admin_unit') 
  AND (
    -- Employee in user's accessible departments (own + supervised units)
    department = ANY(public.get_accessible_departments(auth.uid()))
    OR
    -- Grace period for recently updated employees (for mutation operations)
    updated_at > NOW() - INTERVAL '5 minutes'
  )
);

-- Update RLS policy for employees INSERT to allow creating in supervised units
DROP POLICY IF EXISTS "Admin unit can insert own department employees" ON public.employees;

CREATE POLICY "Admin unit can insert own department employees"
ON public.employees FOR INSERT
WITH CHECK (
  public.has_role(auth.uid(), 'admin_unit') 
  AND department = ANY(public.get_accessible_departments(auth.uid()))
);

-- Update RLS policy for employees UPDATE to allow updating in supervised units
DROP POLICY IF EXISTS "Admin unit can update own department employees" ON public.employees;

CREATE POLICY "Admin unit can update own department employees"
ON public.employees FOR UPDATE
USING (
  public.has_role(auth.uid(), 'admin_unit') 
  AND department = ANY(public.get_accessible_departments(auth.uid()))
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin_unit')
  -- Allow mutation out: employee can be moved to any department if they were originally in accessible departments
);

-- Update RLS policy for employees DELETE to allow deleting in supervised units
DROP POLICY IF EXISTS "Admin unit can delete own department employees" ON public.employees;

CREATE POLICY "Admin unit can delete own department employees"
ON public.employees FOR DELETE
USING (
  public.has_role(auth.uid(), 'admin_unit') 
  AND department = ANY(public.get_accessible_departments(auth.uid()))
);

-- Update position_references policies to include supervised units
DROP POLICY IF EXISTS "Admin unit can view own department positions" ON public.position_references;

CREATE POLICY "Admin unit can view own department positions"
ON public.position_references FOR SELECT
USING (
  public.has_role(auth.uid(), 'admin_unit') 
  AND department = ANY(public.get_accessible_departments(auth.uid()))
);

-- Also update related history tables policies
-- mutation_history
DROP POLICY IF EXISTS "Admin unit can view own dept mutation history" ON public.mutation_history;
CREATE POLICY "Admin unit can view own dept mutation history" 
ON public.mutation_history FOR SELECT 
USING (
  has_role(auth.uid(), 'admin_unit') 
  AND employee_id IN (
    SELECT id FROM employees 
    WHERE department = ANY(public.get_accessible_departments(auth.uid()))
  )
);

DROP POLICY IF EXISTS "Admin unit can insert own dept mutation history" ON public.mutation_history;
CREATE POLICY "Admin unit can insert own dept mutation history" 
ON public.mutation_history FOR INSERT 
WITH CHECK (
  has_role(auth.uid(), 'admin_unit') 
  AND employee_id IN (
    SELECT id FROM employees 
    WHERE department = ANY(public.get_accessible_departments(auth.uid()))
  )
);

DROP POLICY IF EXISTS "Admin unit can update own dept mutation history" ON public.mutation_history;
CREATE POLICY "Admin unit can update own dept mutation history" 
ON public.mutation_history FOR UPDATE 
USING (
  has_role(auth.uid(), 'admin_unit') 
  AND employee_id IN (
    SELECT id FROM employees 
    WHERE department = ANY(public.get_accessible_departments(auth.uid()))
  )
);

DROP POLICY IF EXISTS "Admin unit can delete own dept mutation history" ON public.mutation_history;
CREATE POLICY "Admin unit can delete own dept mutation history" 
ON public.mutation_history FOR DELETE 
USING (
  has_role(auth.uid(), 'admin_unit') 
  AND employee_id IN (
    SELECT id FROM employees 
    WHERE department = ANY(public.get_accessible_departments(auth.uid()))
  )
);

-- position_history
DROP POLICY IF EXISTS "Admin unit can view own dept position history" ON public.position_history;
CREATE POLICY "Admin unit can view own dept position history" 
ON public.position_history FOR SELECT 
USING (
  has_role(auth.uid(), 'admin_unit') 
  AND employee_id IN (
    SELECT id FROM employees 
    WHERE department = ANY(public.get_accessible_departments(auth.uid()))
  )
);

DROP POLICY IF EXISTS "Admin unit can insert own dept position history" ON public.position_history;
CREATE POLICY "Admin unit can insert own dept position history" 
ON public.position_history FOR INSERT 
WITH CHECK (
  has_role(auth.uid(), 'admin_unit') 
  AND employee_id IN (
    SELECT id FROM employees 
    WHERE department = ANY(public.get_accessible_departments(auth.uid()))
  )
);

DROP POLICY IF EXISTS "Admin unit can update own dept position history" ON public.position_history;
CREATE POLICY "Admin unit can update own dept position history" 
ON public.position_history FOR UPDATE 
USING (
  has_role(auth.uid(), 'admin_unit') 
  AND employee_id IN (
    SELECT id FROM employees 
    WHERE department = ANY(public.get_accessible_departments(auth.uid()))
  )
);

DROP POLICY IF EXISTS "Admin unit can delete own dept position history" ON public.position_history;
CREATE POLICY "Admin unit can delete own dept position history" 
ON public.position_history FOR DELETE 
USING (
  has_role(auth.uid(), 'admin_unit') 
  AND employee_id IN (
    SELECT id FROM employees 
    WHERE department = ANY(public.get_accessible_departments(auth.uid()))
  )
);

-- rank_history
DROP POLICY IF EXISTS "Admin unit can view own dept rank history" ON public.rank_history;
CREATE POLICY "Admin unit can view own dept rank history" 
ON public.rank_history FOR SELECT 
USING (
  has_role(auth.uid(), 'admin_unit') 
  AND employee_id IN (
    SELECT id FROM employees 
    WHERE department = ANY(public.get_accessible_departments(auth.uid()))
  )
);

DROP POLICY IF EXISTS "Admin unit can insert own dept rank history" ON public.rank_history;
CREATE POLICY "Admin unit can insert own dept rank history" 
ON public.rank_history FOR INSERT 
WITH CHECK (
  has_role(auth.uid(), 'admin_unit') 
  AND employee_id IN (
    SELECT id FROM employees 
    WHERE department = ANY(public.get_accessible_departments(auth.uid()))
  )
);

DROP POLICY IF EXISTS "Admin unit can update own dept rank history" ON public.rank_history;
CREATE POLICY "Admin unit can update own dept rank history" 
ON public.rank_history FOR UPDATE 
USING (
  has_role(auth.uid(), 'admin_unit') 
  AND employee_id IN (
    SELECT id FROM employees 
    WHERE department = ANY(public.get_accessible_departments(auth.uid()))
  )
);

DROP POLICY IF EXISTS "Admin unit can delete own dept rank history" ON public.rank_history;
CREATE POLICY "Admin unit can delete own dept rank history" 
ON public.rank_history FOR DELETE 
USING (
  has_role(auth.uid(), 'admin_unit') 
  AND employee_id IN (
    SELECT id FROM employees 
    WHERE department = ANY(public.get_accessible_departments(auth.uid()))
  )
);

-- education_history
DROP POLICY IF EXISTS "Admin unit can view own dept education history" ON public.education_history;
CREATE POLICY "Admin unit can view own dept education history" 
ON public.education_history FOR SELECT 
USING (
  has_role(auth.uid(), 'admin_unit') 
  AND employee_id IN (
    SELECT id FROM employees 
    WHERE department = ANY(public.get_accessible_departments(auth.uid()))
  )
);

DROP POLICY IF EXISTS "Admin unit can insert own dept education history" ON public.education_history;
CREATE POLICY "Admin unit can insert own dept education history" 
ON public.education_history FOR INSERT 
WITH CHECK (
  has_role(auth.uid(), 'admin_unit') 
  AND employee_id IN (
    SELECT id FROM employees 
    WHERE department = ANY(public.get_accessible_departments(auth.uid()))
  )
);

DROP POLICY IF EXISTS "Admin unit can update own dept education history" ON public.education_history;
CREATE POLICY "Admin unit can update own dept education history" 
ON public.education_history FOR UPDATE 
USING (
  has_role(auth.uid(), 'admin_unit') 
  AND employee_id IN (
    SELECT id FROM employees 
    WHERE department = ANY(public.get_accessible_departments(auth.uid()))
  )
);

DROP POLICY IF EXISTS "Admin unit can delete own dept education history" ON public.education_history;
CREATE POLICY "Admin unit can delete own dept education history" 
ON public.education_history FOR DELETE 
USING (
  has_role(auth.uid(), 'admin_unit') 
  AND employee_id IN (
    SELECT id FROM employees 
    WHERE department = ANY(public.get_accessible_departments(auth.uid()))
  )
);
