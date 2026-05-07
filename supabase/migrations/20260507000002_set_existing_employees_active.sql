-- =============================================
-- Set all existing employees as active
-- Ensure is_active is TRUE for all existing records
-- =============================================

-- Update all existing employees to be active (if NULL or not set)
UPDATE public.employees
SET is_active = TRUE
WHERE is_active IS NULL OR is_active = FALSE;

-- Verify the update
DO $$
DECLARE
  v_total_employees INT;
  v_active_employees INT;
  v_inactive_employees INT;
BEGIN
  SELECT COUNT(*) INTO v_total_employees FROM public.employees;
  SELECT COUNT(*) INTO v_active_employees FROM public.employees WHERE is_active = TRUE;
  SELECT COUNT(*) INTO v_inactive_employees FROM public.employees WHERE is_active = FALSE;
  
  RAISE NOTICE 'Total employees: %', v_total_employees;
  RAISE NOTICE 'Active employees: %', v_active_employees;
  RAISE NOTICE 'Inactive employees: %', v_inactive_employees;
END $$;
