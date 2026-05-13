-- ============================================================================
-- REMOVE FK CONSTRAINT ON issued_by_id
-- Migration: Remove foreign key constraint to allow employee IDs from employees table
-- Created: 2026-05-13
-- Reason: issued_by_id can reference either profiles.id OR employees.id
--         We store name and position anyway, so FK is not needed
-- ============================================================================

-- Drop the foreign key constraint on issued_by_id
ALTER TABLE public.leadership_directives 
  DROP CONSTRAINT IF EXISTS leadership_directives_issued_by_id_fkey;

-- Update comment to reflect the change
COMMENT ON COLUMN public.leadership_directives.issued_by_id IS 
  'ID of the person who issued the directive (can be from employees or profiles table, used for reference only)';

-- Note: We keep the index for performance
-- The index idx_leadership_directives_issued_by_id is still useful for queries
