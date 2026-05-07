-- Create announcements table for Admin Pusat to broadcast messages
CREATE TABLE IF NOT EXISTS public.announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'warning', 'success', 'error')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ,
  priority INTEGER NOT NULL DEFAULT 0 -- Higher number = higher priority
);

-- Create announcement_dismissals table to track which users have dismissed which announcements
CREATE TABLE IF NOT EXISTS public.announcement_dismissals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  announcement_id UUID NOT NULL REFERENCES public.announcements(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  dismissed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(announcement_id, user_id)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_announcements_active ON public.announcements(is_active, expires_at, priority DESC);
CREATE INDEX IF NOT EXISTS idx_announcements_created_at ON public.announcements(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_announcement_dismissals_user ON public.announcement_dismissals(user_id, announcement_id);

-- Enable RLS
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcement_dismissals ENABLE ROW LEVEL SECURITY;

-- RLS Policies for announcements table

-- Admin Pusat can do everything
CREATE POLICY "Admin Pusat can manage announcements"
  ON public.announcements
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin_pusat'
    )
  );

-- All authenticated users can view active announcements
CREATE POLICY "All users can view active announcements"
  ON public.announcements
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND is_active = true
    AND (expires_at IS NULL OR expires_at > now())
  );

-- RLS Policies for announcement_dismissals table

-- Users can insert their own dismissals
CREATE POLICY "Users can dismiss announcements"
  ON public.announcement_dismissals
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can view their own dismissals
CREATE POLICY "Users can view their dismissals"
  ON public.announcement_dismissals
  FOR SELECT
  USING (auth.uid() = user_id);

-- Admin Pusat can view all dismissals (for analytics)
CREATE POLICY "Admin Pusat can view all dismissals"
  ON public.announcement_dismissals
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin_pusat'
    )
  );

-- Function to get active announcements for current user (excluding dismissed ones)
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
    COALESCE(p.full_name, 'Admin Pusat') as created_by_name
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

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION public.update_announcements_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_announcements_updated_at
  BEFORE UPDATE ON public.announcements
  FOR EACH ROW
  EXECUTE FUNCTION public.update_announcements_updated_at();

-- Grant necessary permissions
GRANT SELECT ON public.announcements TO authenticated;
GRANT INSERT, SELECT ON public.announcement_dismissals TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_active_announcements() TO authenticated;

-- Add comment
COMMENT ON TABLE public.announcements IS 'System-wide announcements created by Admin Pusat';
COMMENT ON TABLE public.announcement_dismissals IS 'Tracks which users have dismissed which announcements';
COMMENT ON FUNCTION public.get_active_announcements() IS 'Returns active announcements for the current user, excluding dismissed ones';
