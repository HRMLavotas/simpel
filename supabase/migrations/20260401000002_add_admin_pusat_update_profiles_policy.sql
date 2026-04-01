-- Add policy to allow admin_pusat to update any profile
CREATE POLICY "Admin pusat can update all profiles"
ON public.profiles FOR UPDATE
USING (public.has_role(auth.uid(), 'admin_pusat'))
WITH CHECK (public.has_role(auth.uid(), 'admin_pusat'));
