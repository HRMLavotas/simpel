-- Create notifications table
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_role VARCHAR(50) NOT NULL, -- 'admin_pusat' or 'admin_unit'
  recipient_department VARCHAR(255), -- NULL = semua admin_pusat, filled = admin_unit tertentu
  type VARCHAR(50) NOT NULL, -- 'employee_created', 'employee_updated', 'employee_deleted', 'mutation_in'
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  employee_id UUID REFERENCES public.employees(id) ON DELETE SET NULL,
  employee_name VARCHAR(255),
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_name VARCHAR(255),
  actor_department VARCHAR(255),
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Admin pusat can see all notifications targeted to admin_pusat
CREATE POLICY "Admin pusat can view their notifications"
ON public.notifications FOR SELECT
USING (
  public.has_role(auth.uid(), 'admin_pusat')
  AND recipient_role = 'admin_pusat'
);

-- Admin unit can see notifications targeted to their department
CREATE POLICY "Admin unit can view their notifications"
ON public.notifications FOR SELECT
USING (
  public.has_role(auth.uid(), 'admin_unit')
  AND recipient_role = 'admin_unit'
  AND recipient_department = public.get_user_department(auth.uid())
);

-- Admin pusat can mark their notifications as read
CREATE POLICY "Admin pusat can update their notifications"
ON public.notifications FOR UPDATE
USING (
  public.has_role(auth.uid(), 'admin_pusat')
  AND recipient_role = 'admin_pusat'
);

-- Admin unit can mark their notifications as read
CREATE POLICY "Admin unit can update their notifications"
ON public.notifications FOR UPDATE
USING (
  public.has_role(auth.uid(), 'admin_unit')
  AND recipient_role = 'admin_unit'
  AND recipient_department = public.get_user_department(auth.uid())
);

-- Any authenticated user can insert notifications (needed for admin_unit to notify admin_pusat)
CREATE POLICY "Authenticated users can insert notifications"
ON public.notifications FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Index for performance
CREATE INDEX idx_notifications_recipient ON public.notifications(recipient_role, recipient_department, is_read, created_at DESC);
CREATE INDEX idx_notifications_employee ON public.notifications(employee_id);
