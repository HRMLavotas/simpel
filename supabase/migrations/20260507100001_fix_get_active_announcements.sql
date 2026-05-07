-- Drop existing function
DROP FUNCTION IF EXISTS public.get_active_announcements();

-- Recreate function with correct return type
CREATE OR REPLACE FUNCTION public.get_active_announcements()
RETURNS TABLE (
  id UUID,
  title TEXT,
  message TEXT,
  type TEXT,
  priority INTEGER,
  created_at TIMESTAMPTZ,
  created_by_name TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.id,
    a.title,
    a.message,
    a.type,
    a.priority,
    a.created_at,
    COALESCE(p.full_name::TEXT, 'Admin Pusat'::TEXT) as created_by_name
  FROM public.announcements a
  LEFT JOIN public.profiles p ON p.id = a.created_by
  WHERE a.is_active = true
    AND (a.expires_at IS NULL OR a.expires_at > now())
    AND NOT EXISTS (
      SELECT 1 FROM public.announcement_dismissals ad
      WHERE ad.announcement_id = a.id
      AND ad.user_id = auth.uid()
    )
  ORDER BY a.priority DESC, a.created_at DESC;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_active_announcements() TO authenticated;

-- Add comment
COMMENT ON FUNCTION public.get_active_announcements() IS 'Returns active announcements for the current user, excluding dismissed ones';
