-- Migration: Add Admin Unit Update Department RLS Policy and Fix get_accessible_departments
-- Allows Admin Unit to update fields (such as 'sarpras') in departments they have access to

-- 1. Correct the get_accessible_departments function mapping from 'Satpel' to 'Satuan Pelayanan'
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
  
  -- Add supervised Satpel/Workshop based on UNIT_PEMBINA_MAPPING (Corrected from 'Satpel' to 'Satuan Pelayanan')
  IF user_dept = 'BBPVP Serang' THEN
    supervised_units := ARRAY['Satuan Pelayanan Lubuklinggau', 'Satuan Pelayanan Lampung', 'Workshop Prabumulih'];
  ELSIF user_dept = 'BBPVP Bekasi' THEN
    supervised_units := ARRAY['Satuan Pelayanan Bengkulu', 'Satuan Pelayanan Kotawaringin Timur'];
  ELSIF user_dept = 'BBPVP Makassar' THEN
    supervised_units := ARRAY['Satuan Pelayanan Majene', 'Satuan Pelayanan Mamuju', 'Satuan Pelayanan Palu', 'Workshop Gorontalo', 'Satuan Pelayanan Morowali', 'Satuan Pelayanan Morowali Utara'];
  ELSIF user_dept = 'BBPVP Medan' THEN
    supervised_units := ARRAY['Satuan Pelayanan Pekanbaru', 'Workshop Batam'];
  ELSIF user_dept = 'BPVP Surakarta' THEN
    supervised_units := ARRAY['Satuan Pelayanan Bantul'];
  ELSIF user_dept = 'BPVP Padang' THEN
    supervised_units := ARRAY['Satuan Pelayanan Jambi', 'Satuan Pelayanan Sawahlunto'];
  ELSIF user_dept = 'BPVP Lombok Timur' THEN
    supervised_units := ARRAY['Satuan Pelayanan Kupang', 'Satuan Pelayanan Bali'];
  ELSIF user_dept = 'BPVP Ternate' THEN
    supervised_units := ARRAY['Satuan Pelayanan Sofifi', 'Satuan Pelayanan Minahasa Utara', 'Satuan Pelayanan Halmahera Selatan'];
  ELSIF user_dept = 'BPVP Sorong' THEN
    supervised_units := ARRAY['Satuan Pelayanan Jayapura'];
  ELSIF user_dept = 'BPVP Samarinda' THEN
    supervised_units := ARRAY['Satuan Pelayanan Tanah Bumbu', 'Satuan Pelayanan Bulungan'];
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

-- 2. Create the UPDATE policy for departments
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'departments' 
    AND policyname = 'Admin unit can update accessible departments'
  ) THEN
    CREATE POLICY "Admin unit can update accessible departments"
    ON public.departments FOR UPDATE
    USING (
      public.has_role(auth.uid(), 'admin_unit')
      AND name = ANY(public.get_accessible_departments(auth.uid()))
    );
    RAISE NOTICE 'Policy "Admin unit can update accessible departments" successfully created.';
  ELSE
    RAISE NOTICE 'Policy "Admin unit can update accessible departments" already exists.';
  END IF;
END $$;

