-- Recreate get_accessible_departments function with fixed parameter name
-- Use DROP CASCADE to remove function and all dependent policies, then recreate everything

-- Drop function with CASCADE to remove all dependent policies
DROP FUNCTION IF EXISTS public.get_accessible_departments(UUID) CASCADE;

-- Recreate function with fixed parameter name (input_user_id instead of user_id)
CREATE OR REPLACE FUNCTION public.get_accessible_departments(input_user_id UUID)
RETURNS TEXT[] AS $$
DECLARE
  user_dept TEXT;
  user_role TEXT;
  supervised_units TEXT[];
  result TEXT[];
BEGIN
  -- Get user's department and role
  SELECT p.department, ur.role
  INTO user_dept, user_role
  FROM public.profiles p
  LEFT JOIN public.user_roles ur ON ur.user_id = p.id
  WHERE p.id = input_user_id;
  
  -- If admin_pusat or admin_pimpinan, return NULL (means all departments)
  IF user_role IN ('admin_pusat', 'admin_pimpinan') THEN
    RETURN NULL;
  END IF;
  
  -- Start with user's own department
  result := ARRAY[user_dept];
  
  -- Add supervised Satpel/Workshop based on UNIT_PEMBINA_MAPPING
  IF user_dept = 'BBPVP Serang' THEN
    supervised_units := ARRAY['Satpel Lubuklinggau', 'Satpel Lampung', 'Workshop Prabumulih'];
  ELSIF user_dept = 'BBPVP Bekasi' THEN
    supervised_units := ARRAY['Satpel Bengkulu', 'Satpel Kotawaringin Timur'];
  ELSIF user_dept = 'BBPVP Makassar' THEN
    supervised_units := ARRAY['Satpel Majene', 'Satpel Mamuju', 'Satpel Palu', 'Workshop Gorontalo', 'Satpel Morowali', 'Satpel Morowali Utara'];
  ELSIF user_dept = 'BBPVP Medan' THEN
    supervised_units := ARRAY['Satpel Pekanbaru', 'Workshop Batam'];
  ELSIF user_dept = 'BPVP Surakarta' THEN
    supervised_units := ARRAY['Satpel Bantul'];
  ELSIF user_dept = 'BPVP Padang' THEN
    supervised_units := ARRAY['Satpel Jambi', 'Satpel Sawahlunto'];
  ELSIF user_dept = 'BPVP Lombok Timur' THEN
    supervised_units := ARRAY['Satpel Kupang', 'Satpel Bali'];
  ELSIF user_dept = 'BPVP Ternate' THEN
    supervised_units := ARRAY['Satpel Sofifi', 'Satpel Minahasa Utara', 'Satpel Halmahera Selatan'];
  ELSIF user_dept = 'BPVP Sorong' THEN
    supervised_units := ARRAY['Satpel Jayapura'];
  ELSIF user_dept = 'BPVP Samarinda' THEN
    supervised_units := ARRAY['Satpel Tanah Bumbu', 'Satpel Bulungan'];
  ELSE
    supervised_units := ARRAY[]::TEXT[];
  END IF;
  
  IF array_length(supervised_units, 1) > 0 THEN
    result := result || supervised_units;
  END IF;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.get_accessible_departments(UUID) TO authenticated;

COMMENT ON FUNCTION public.get_accessible_departments(UUID) IS 
'Returns array of department names that a user can access. For admin_unit, includes own department plus supervised Satpel/Workshop. For admin_pusat/admin_pimpinan, returns NULL (all departments).';

-- Recreate all RLS policies that were dropped by CASCADE

-- employees table policies
CREATE POLICY "Admin unit can view own department employees"
ON public.employees FOR SELECT
USING (
  public.has_role(auth.uid(), 'admin_unit') 
  AND (
    department = ANY(public.get_accessible_departments(auth.uid()))
    OR
    updated_at > NOW() - INTERVAL '5 minutes'
  )
);

CREATE POLICY "Admin unit can insert own department employees"
ON public.employees FOR INSERT
WITH CHECK (
  public.has_role(auth.uid(), 'admin_unit') 
  AND department = ANY(public.get_accessible_departments(auth.uid()))
);

CREATE POLICY "Admin unit can update own department employees"
ON public.employees FOR UPDATE
USING (
  public.has_role(auth.uid(), 'admin_unit') 
  AND department = ANY(public.get_accessible_departments(auth.uid()))
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin_unit')
);

CREATE POLICY "Admin unit can delete own department employees"
ON public.employees FOR DELETE
USING (
  public.has_role(auth.uid(), 'admin_unit') 
  AND department = ANY(public.get_accessible_departments(auth.uid()))
);

-- position_references table policy
CREATE POLICY "Admin unit can view own department positions"
ON public.position_references FOR SELECT
USING (
  public.has_role(auth.uid(), 'admin_unit') 
  AND department = ANY(public.get_accessible_departments(auth.uid()))
);

-- mutation_history policies
CREATE POLICY "Admin unit can view own dept mutation history" 
ON public.mutation_history FOR SELECT 
USING (
  has_role(auth.uid(), 'admin_unit') 
  AND employee_id IN (
    SELECT id FROM employees 
    WHERE department = ANY(public.get_accessible_departments(auth.uid()))
  )
);

CREATE POLICY "Admin unit can insert own dept mutation history" 
ON public.mutation_history FOR INSERT 
WITH CHECK (
  has_role(auth.uid(), 'admin_unit') 
  AND employee_id IN (
    SELECT id FROM employees 
    WHERE department = ANY(public.get_accessible_departments(auth.uid()))
  )
);

CREATE POLICY "Admin unit can update own dept mutation history" 
ON public.mutation_history FOR UPDATE 
USING (
  has_role(auth.uid(), 'admin_unit') 
  AND employee_id IN (
    SELECT id FROM employees 
    WHERE department = ANY(public.get_accessible_departments(auth.uid()))
  )
);

CREATE POLICY "Admin unit can delete own dept mutation history" 
ON public.mutation_history FOR DELETE 
USING (
  has_role(auth.uid(), 'admin_unit') 
  AND employee_id IN (
    SELECT id FROM employees 
    WHERE department = ANY(public.get_accessible_departments(auth.uid()))
  )
);

-- position_history policies
CREATE POLICY "Admin unit can view own dept position history" 
ON public.position_history FOR SELECT 
USING (
  has_role(auth.uid(), 'admin_unit') 
  AND employee_id IN (
    SELECT id FROM employees 
    WHERE department = ANY(public.get_accessible_departments(auth.uid()))
  )
);

CREATE POLICY "Admin unit can insert own dept position history" 
ON public.position_history FOR INSERT 
WITH CHECK (
  has_role(auth.uid(), 'admin_unit') 
  AND employee_id IN (
    SELECT id FROM employees 
    WHERE department = ANY(public.get_accessible_departments(auth.uid()))
  )
);

CREATE POLICY "Admin unit can update own dept position history" 
ON public.position_history FOR UPDATE 
USING (
  has_role(auth.uid(), 'admin_unit') 
  AND employee_id IN (
    SELECT id FROM employees 
    WHERE department = ANY(public.get_accessible_departments(auth.uid()))
  )
);

CREATE POLICY "Admin unit can delete own dept position history" 
ON public.position_history FOR DELETE 
USING (
  has_role(auth.uid(), 'admin_unit') 
  AND employee_id IN (
    SELECT id FROM employees 
    WHERE department = ANY(public.get_accessible_departments(auth.uid()))
  )
);

-- rank_history policies
CREATE POLICY "Admin unit can view own dept rank history" 
ON public.rank_history FOR SELECT 
USING (
  has_role(auth.uid(), 'admin_unit') 
  AND employee_id IN (
    SELECT id FROM employees 
    WHERE department = ANY(public.get_accessible_departments(auth.uid()))
  )
);

CREATE POLICY "Admin unit can insert own dept rank history" 
ON public.rank_history FOR INSERT 
WITH CHECK (
  has_role(auth.uid(), 'admin_unit') 
  AND employee_id IN (
    SELECT id FROM employees 
    WHERE department = ANY(public.get_accessible_departments(auth.uid()))
  )
);

CREATE POLICY "Admin unit can update own dept rank history" 
ON public.rank_history FOR UPDATE 
USING (
  has_role(auth.uid(), 'admin_unit') 
  AND employee_id IN (
    SELECT id FROM employees 
    WHERE department = ANY(public.get_accessible_departments(auth.uid()))
  )
);

CREATE POLICY "Admin unit can delete own dept rank history" 
ON public.rank_history FOR DELETE 
USING (
  has_role(auth.uid(), 'admin_unit') 
  AND employee_id IN (
    SELECT id FROM employees 
    WHERE department = ANY(public.get_accessible_departments(auth.uid()))
  )
);

-- education_history policies
CREATE POLICY "Admin unit can view own dept education history" 
ON public.education_history FOR SELECT 
USING (
  has_role(auth.uid(), 'admin_unit') 
  AND employee_id IN (
    SELECT id FROM employees 
    WHERE department = ANY(public.get_accessible_departments(auth.uid()))
  )
);

CREATE POLICY "Admin unit can insert own dept education history" 
ON public.education_history FOR INSERT 
WITH CHECK (
  has_role(auth.uid(), 'admin_unit') 
  AND employee_id IN (
    SELECT id FROM employees 
    WHERE department = ANY(public.get_accessible_departments(auth.uid()))
  )
);

CREATE POLICY "Admin unit can update own dept education history" 
ON public.education_history FOR UPDATE 
USING (
  has_role(auth.uid(), 'admin_unit') 
  AND employee_id IN (
    SELECT id FROM employees 
    WHERE department = ANY(public.get_accessible_departments(auth.uid()))
  )
);

CREATE POLICY "Admin unit can delete own dept education history" 
ON public.education_history FOR DELETE 
USING (
  has_role(auth.uid(), 'admin_unit') 
  AND employee_id IN (
    SELECT id FROM employees 
    WHERE department = ANY(public.get_accessible_departments(auth.uid()))
  )
);
