-- Fix get_accessible_departments function to include all supervised units mapping
-- This fixes the issue where BBPVP Makassar and other units cannot access their supervised Satpel/Workshop

-- Drop and recreate the function with complete mapping
DROP FUNCTION IF EXISTS public.get_accessible_departments(UUID);

CREATE OR REPLACE FUNCTION public.get_accessible_departments(user_id UUID)
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
  WHERE p.id = user_id;
  
  -- If admin_pusat or admin_pimpinan, return NULL (means all departments)
  IF user_role IN ('admin_pusat', 'admin_pimpinan') THEN
    RETURN NULL;
  END IF;
  
  -- Start with user's own department
  result := ARRAY[user_dept];
  
  -- Add supervised Satpel/Workshop based on UNIT_PEMBINA_MAPPING
  -- BBPVP Serang supervises: Satpel Lubuklinggau, Satpel Lampung, Workshop Prabumulih
  IF user_dept = 'BBPVP Serang' THEN
    supervised_units := ARRAY['Satpel Lubuklinggau', 'Satpel Lampung', 'Workshop Prabumulih'];
  -- BBPVP Bekasi supervises: Satpel Bengkulu, Satpel Kotawaringin Timur
  ELSIF user_dept = 'BBPVP Bekasi' THEN
    supervised_units := ARRAY['Satpel Bengkulu', 'Satpel Kotawaringin Timur'];
  -- BBPVP Makassar supervises: Satpel Majene, Satpel Mamuju, Satpel Palu, Workshop Gorontalo, Satpel Morowali, Satpel Morowali Utara
  ELSIF user_dept = 'BBPVP Makassar' THEN
    supervised_units := ARRAY['Satpel Majene', 'Satpel Mamuju', 'Satpel Palu', 'Workshop Gorontalo', 'Satpel Morowali', 'Satpel Morowali Utara'];
  -- BBPVP Medan supervises: Satpel Pekanbaru, Workshop Batam
  ELSIF user_dept = 'BBPVP Medan' THEN
    supervised_units := ARRAY['Satpel Pekanbaru', 'Workshop Batam'];
  -- BPVP Surakarta supervises: Satpel Bantul
  ELSIF user_dept = 'BPVP Surakarta' THEN
    supervised_units := ARRAY['Satpel Bantul'];
  -- BPVP Padang supervises: Satpel Jambi, Satpel Sawahlunto
  ELSIF user_dept = 'BPVP Padang' THEN
    supervised_units := ARRAY['Satpel Jambi', 'Satpel Sawahlunto'];
  -- BPVP Lombok Timur supervises: Satpel Kupang, Satpel Bali
  ELSIF user_dept = 'BPVP Lombok Timur' THEN
    supervised_units := ARRAY['Satpel Kupang', 'Satpel Bali'];
  -- BPVP Ternate supervises: Satpel Sofifi, Satpel Minahasa Utara, Satpel Halmahera Selatan
  ELSIF user_dept = 'BPVP Ternate' THEN
    supervised_units := ARRAY['Satpel Sofifi', 'Satpel Minahasa Utara', 'Satpel Halmahera Selatan'];
  -- BPVP Sorong supervises: Satpel Jayapura
  ELSIF user_dept = 'BPVP Sorong' THEN
    supervised_units := ARRAY['Satpel Jayapura'];
  -- BPVP Samarinda supervises: Satpel Tanah Bumbu, Satpel Bulungan
  ELSIF user_dept = 'BPVP Samarinda' THEN
    supervised_units := ARRAY['Satpel Tanah Bumbu', 'Satpel Bulungan'];
  ELSE
    supervised_units := ARRAY[]::TEXT[];
  END IF;
  
  -- Combine own department with supervised units
  IF array_length(supervised_units, 1) > 0 THEN
    result := result || supervised_units;
  END IF;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_accessible_departments(UUID) TO authenticated;

-- Add comment
COMMENT ON FUNCTION public.get_accessible_departments(UUID) IS 
'Returns array of department names that a user can access. For admin_unit, includes own department plus supervised Satpel/Workshop. For admin_pusat/admin_pimpinan, returns NULL (all departments).';
