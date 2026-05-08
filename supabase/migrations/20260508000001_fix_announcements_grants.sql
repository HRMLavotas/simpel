-- Fix missing INSERT, UPDATE, DELETE grants for announcements table
-- Issue: Admin Pusat can create/edit/delete announcements via RLS policy,
-- but the table-level GRANT only allows SELECT for authenticated users.
-- This causes INSERT/UPDATE/DELETE to silently fail or return permission errors.

-- Grant full DML permissions to authenticated users
-- (RLS policies still enforce that only admin_pusat can actually write)
GRANT INSERT, UPDATE, DELETE ON public.announcements TO authenticated;

-- Also ensure SELECT is still granted (in case it was missed)
GRANT SELECT ON public.announcements TO authenticated;

COMMENT ON TABLE public.announcements IS 
'System-wide announcements created by Admin Pusat. RLS policies restrict write access to admin_pusat role only.';
