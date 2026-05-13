-- ============================================================================
-- UPDATE CASE TYPES
-- Migration: Update case_type enum values
-- Created: 2026-05-13
-- ============================================================================

-- Drop the old constraint
ALTER TABLE public.employee_cases 
DROP CONSTRAINT IF EXISTS employee_cases_case_type_check;

-- Add new constraint with updated case types
ALTER TABLE public.employee_cases 
ADD CONSTRAINT employee_cases_case_type_check 
CHECK (case_type IN (
  'perceraian',
  'hutang',
  'pinjaman_online',
  'presensi',
  'pengunduran_diri',
  'temuan',
  'lainnya'
));

-- Add comment
COMMENT ON COLUMN public.employee_cases.case_type IS 'Case type: perceraian, hutang, pinjaman_online, presensi, pengunduran_diri, temuan, lainnya';

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
