-- Migration: Add Admin Unit Update Department RLS Policy
-- Allows Admin Unit to update fields (such as 'sarpras') in departments they have access to

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
