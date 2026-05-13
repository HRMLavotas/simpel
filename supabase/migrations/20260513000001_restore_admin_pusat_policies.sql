-- Restore missing admin_pusat policies for employees table
-- These were accidentally dropped when recreating get_accessible_departments function with CASCADE

-- Check if policies exist first, then create if missing
DO $$ 
BEGIN
  -- Admin pusat can view all employees
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'employees' 
    AND policyname = 'Admin pusat can view all employees'
  ) THEN
    CREATE POLICY "Admin pusat can view all employees"
    ON public.employees FOR SELECT
    USING (public.has_role(auth.uid(), 'admin_pusat'));
  END IF;

  -- Admin pusat can insert any employee
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'employees' 
    AND policyname = 'Admin pusat can insert any employee'
  ) THEN
    CREATE POLICY "Admin pusat can insert any employee"
    ON public.employees FOR INSERT
    WITH CHECK (public.has_role(auth.uid(), 'admin_pusat'));
  END IF;

  -- Admin pusat can update any employee (THIS IS THE CRITICAL ONE)
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'employees' 
    AND policyname = 'Admin pusat can update any employee'
  ) THEN
    CREATE POLICY "Admin pusat can update any employee"
    ON public.employees FOR UPDATE
    USING (public.has_role(auth.uid(), 'admin_pusat'));
  END IF;

  -- Admin pusat can delete any employee
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'employees' 
    AND policyname = 'Admin pusat can delete any employee'
  ) THEN
    CREATE POLICY "Admin pusat can delete any employee"
    ON public.employees FOR DELETE
    USING (public.has_role(auth.uid(), 'admin_pusat'));
  END IF;
END $$;

-- Verify policies are created
DO $$
DECLARE
  policy_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies 
  WHERE schemaname = 'public' 
  AND tablename = 'employees' 
  AND policyname LIKE 'Admin pusat%';
  
  RAISE NOTICE 'Total admin_pusat policies on employees table: %', policy_count;
  
  IF policy_count < 4 THEN
    RAISE WARNING 'Expected 4 admin_pusat policies but found %', policy_count;
  END IF;
END $$;
