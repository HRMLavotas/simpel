-- ============================================================================
-- ADD LEADERSHIP DIRECTIVE FIELD
-- Migration: Add field for storing leadership directives (Arahan Pimpinan)
-- Created: 2026-05-13
-- ============================================================================

-- Add leadership_directive column to employee_cases table
ALTER TABLE public.employee_cases 
ADD COLUMN IF NOT EXISTS leadership_directive TEXT;

-- Add comment
COMMENT ON COLUMN public.employee_cases.leadership_directive IS 
  'Arahan langsung dari pimpinan terkait penanganan kasus (dari kolom Keterangan Kasus di Excel)';

-- Create index for searching
CREATE INDEX IF NOT EXISTS idx_employee_cases_leadership_directive 
  ON public.employee_cases USING gin(to_tsvector('indonesian', leadership_directive));

COMMENT ON INDEX idx_employee_cases_leadership_directive IS 
  'Full-text search index for leadership directives';
