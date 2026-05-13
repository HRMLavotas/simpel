-- ============================================================================
-- CREATE LEADERSHIP DIRECTIVES TABLE
-- Migration: Create dedicated table for multiple leadership directives
-- Created: 2026-05-13
-- ============================================================================

-- Drop the old single-field column (we'll migrate data later if needed)
-- ALTER TABLE public.employee_cases DROP COLUMN IF EXISTS leadership_directive;

-- Create leadership_directives table
CREATE TABLE IF NOT EXISTS public.leadership_directives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES public.employee_cases(id) ON DELETE CASCADE,
  directive_text TEXT NOT NULL,
  directive_date DATE NOT NULL,
  issued_by_id UUID REFERENCES public.profiles(id),
  issued_by_name TEXT NOT NULL,
  issued_by_position TEXT,
  created_by UUID NOT NULL REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add comments
COMMENT ON TABLE public.leadership_directives IS 
  'Stores leadership directives (Arahan Pimpinan) for employee cases - supports multiple directives per case';

COMMENT ON COLUMN public.leadership_directives.case_id IS 
  'Reference to the employee case';

COMMENT ON COLUMN public.leadership_directives.directive_text IS 
  'The actual directive/instruction from leadership';

COMMENT ON COLUMN public.leadership_directives.directive_date IS 
  'Date when the directive was issued';

COMMENT ON COLUMN public.leadership_directives.issued_by_id IS 
  'ID of the person who issued the directive (optional, for auto-fill)';

COMMENT ON COLUMN public.leadership_directives.issued_by_name IS 
  'Name of the person who issued the directive';

COMMENT ON COLUMN public.leadership_directives.issued_by_position IS 
  'Position/title of the person who issued the directive';

COMMENT ON COLUMN public.leadership_directives.created_by IS 
  'User who created this record';

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_leadership_directives_case_id 
  ON public.leadership_directives(case_id);

CREATE INDEX IF NOT EXISTS idx_leadership_directives_issued_by_id 
  ON public.leadership_directives(issued_by_id);

CREATE INDEX IF NOT EXISTS idx_leadership_directives_directive_date 
  ON public.leadership_directives(directive_date DESC);

CREATE INDEX IF NOT EXISTS idx_leadership_directives_text_search 
  ON public.leadership_directives USING gin(to_tsvector('indonesian', directive_text));

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_leadership_directives_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_leadership_directives_updated_at
  BEFORE UPDATE ON public.leadership_directives
  FOR EACH ROW
  EXECUTE FUNCTION update_leadership_directives_updated_at();

-- Enable RLS
ALTER TABLE public.leadership_directives ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Admin Pusat can do everything
CREATE POLICY "Admin Pusat can view all leadership directives"
  ON public.leadership_directives
  FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin_pusat'));

CREATE POLICY "Admin Pusat can insert leadership directives"
  ON public.leadership_directives
  FOR INSERT
  TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin_pusat'));

CREATE POLICY "Admin Pusat can update leadership directives"
  ON public.leadership_directives
  FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'admin_pusat'))
  WITH CHECK (has_role(auth.uid(), 'admin_pusat'));

CREATE POLICY "Admin Pusat can delete leadership directives"
  ON public.leadership_directives
  FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'admin_pusat'));

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.leadership_directives TO authenticated;

-- Migrate existing data from employee_cases.leadership_directive
-- This will create one directive entry for each case that has the old field populated
INSERT INTO public.leadership_directives (
  case_id,
  directive_text,
  directive_date,
  issued_by_name,
  created_by,
  created_at
)
SELECT 
  id as case_id,
  leadership_directive as directive_text,
  report_date as directive_date, -- Use report date as fallback
  'Pimpinan' as issued_by_name, -- Generic name since we don't have this data
  created_by,
  created_at
FROM public.employee_cases
WHERE leadership_directive IS NOT NULL 
  AND leadership_directive != ''
  AND NOT EXISTS (
    SELECT 1 FROM public.leadership_directives ld 
    WHERE ld.case_id = employee_cases.id
  );

COMMENT ON TABLE public.leadership_directives IS 
  'Migrated from employee_cases.leadership_directive field on 2026-05-13';
