-- ============================================================================
-- FIX EMPLOYEE_CASES FOREIGN KEY CONSTRAINT
-- Migration: Remove FK constraint and change employee_id to TEXT
-- Created: 2026-05-13
-- ============================================================================

-- Drop the existing foreign key constraint
ALTER TABLE public.employee_cases 
DROP CONSTRAINT IF EXISTS employee_cases_employee_id_fkey;

-- Change employee_id from UUID to TEXT for flexibility
-- This allows us to reference both employees table (UUID) and manual entries (TEXT)
ALTER TABLE public.employee_cases 
ALTER COLUMN employee_id TYPE TEXT USING employee_id::TEXT;

-- Add comment
COMMENT ON COLUMN public.employee_cases.employee_id IS 'Employee ID - can be UUID from employees table or manual text ID';

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
