-- Fix RLS policies for announcements table
-- Issue: Admin Pusat cannot view all announcements in management page

-- Drop existing policies
DROP POLICY IF EXISTS "Admin Pusat can manage announcements" ON public.announcements;
DROP POLICY IF EXISTS "All users can view active announcements" ON public.announcements;

-- Recreate policies with correct logic

-- 1. Admin Pusat can do everything (including viewing inactive announcements)
CREATE POLICY "Admin Pusat can manage all announcements"
  ON public.announcements
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin_pusat'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin_pusat'
    )
  );

-- 2. All authenticated users can view active announcements
CREATE POLICY "Authenticated users can view active announcements"
  ON public.announcements
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND is_active = true
    AND (expires_at IS NULL OR expires_at > now())
  );

COMMENT ON POLICY "Admin Pusat can manage all announcements" ON public.announcements IS 
'Admin Pusat can create, read, update, and delete all announcements (including inactive ones)';

COMMENT ON POLICY "Authenticated users can view active announcements" ON public.announcements IS 
'All authenticated users can view active announcements that have not expired';
