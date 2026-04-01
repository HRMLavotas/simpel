-- Drop the previous policy that might be too restrictive
DROP POLICY IF EXISTS "Admin pusat can update all profiles" ON public.profiles;

-- Recreate the policy with only USING clause (matching the pattern of existing policies)
CREATE POLICY "Admin pusat can update all profiles"
ON public.profiles FOR UPDATE
USING (public.has_role(auth.uid(), 'admin_pusat'));

-- Also ensure user_roles policy has WITH CHECK for completeness
DROP POLICY IF EXISTS "Admin pusat can manage roles" ON public.user_roles;

CREATE POLICY "Admin pusat can manage roles"
ON public.user_roles FOR ALL
USING (public.has_role(auth.uid(), 'admin_pusat'))
WITH CHECK (public.has_role(auth.uid(), 'admin_pusat'));
