-- =============================================
-- Fix: Only set NULL is_active to TRUE
-- Don't override employees that are already set to FALSE (inactive)
-- =============================================

-- Update only employees with NULL is_active to TRUE
-- This preserves employees that were intentionally set to inactive (FALSE)
UPDATE public.employees
SET is_active = TRUE
WHERE is_active IS NULL;

-- Verify the update
DO $$
DECLARE
  v_total_employees INT;
  v_active_employees INT;
  v_inactive_employees INT;
  v_null_employees INT;
BEGIN
  SELECT COUNT(*) INTO v_total_employees FROM public.employees;
  SELECT COUNT(*) INTO v_active_employees FROM public.employees WHERE is_active = TRUE;
  SELECT COUNT(*) INTO v_inactive_employees FROM public.employees WHERE is_active = FALSE;
  SELECT COUNT(*) INTO v_null_employees FROM public.employees WHERE is_active IS NULL;
  
  RAISE NOTICE 'Total employees: %', v_total_employees;
  RAISE NOTICE 'Active employees: %', v_active_employees;
  RAISE NOTICE 'Inactive employees: %', v_inactive_employees;
  RAISE NOTICE 'NULL is_active: %', v_null_employees;
END $$;
