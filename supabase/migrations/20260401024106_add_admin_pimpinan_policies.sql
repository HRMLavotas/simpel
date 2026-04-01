-- Step 2: Add RLS policies for admin_pimpinan role
-- This role has read-only access to all data across all units

-- 1. Add RLS policies for admin_pimpinan role on employees table
CREATE POLICY "Admin pimpinan can view all employees" 
ON public.employees FOR SELECT 
USING (has_role(auth.uid(), 'admin_pimpinan'));

-- 2. Add RLS policies for admin_pimpinan on all history tables

-- Education history
CREATE POLICY "Admin pimpinan can view all education history" 
ON public.education_history FOR SELECT 
USING (has_role(auth.uid(), 'admin_pimpinan'));

-- Mutation history
CREATE POLICY "Admin pimpinan can view all mutation history" 
ON public.mutation_history FOR SELECT 
USING (has_role(auth.uid(), 'admin_pimpinan'));

-- Position history
CREATE POLICY "Admin pimpinan can view all position history" 
ON public.position_history FOR SELECT 
USING (has_role(auth.uid(), 'admin_pimpinan'));

-- Rank history
CREATE POLICY "Admin pimpinan can view all rank history" 
ON public.rank_history FOR SELECT 
USING (has_role(auth.uid(), 'admin_pimpinan'));

-- Competency test history
CREATE POLICY "Admin pimpinan can view all competency test history" 
ON public.competency_test_history FOR SELECT 
USING (has_role(auth.uid(), 'admin_pimpinan'));

-- Training history
CREATE POLICY "Admin pimpinan can view all training history" 
ON public.training_history FOR SELECT 
USING (has_role(auth.uid(), 'admin_pimpinan'));

-- 3. Add RLS policies for notes tables

-- Placement notes
CREATE POLICY "Admin pimpinan can view all placement notes" 
ON public.placement_notes FOR SELECT 
USING (has_role(auth.uid(), 'admin_pimpinan'));

-- Assignment notes
CREATE POLICY "Admin pimpinan can view all assignment notes" 
ON public.assignment_notes FOR SELECT 
USING (has_role(auth.uid(), 'admin_pimpinan'));

-- Change notes
CREATE POLICY "Admin pimpinan can view all change notes" 
ON public.change_notes FOR SELECT 
USING (has_role(auth.uid(), 'admin_pimpinan'));

-- 4. Add RLS policy for position_references table (Peta Jabatan)
CREATE POLICY "Admin pimpinan can view all position references" 
ON public.position_references FOR SELECT 
USING (has_role(auth.uid(), 'admin_pimpinan'));

-- 5. Add RLS policy for profiles table (can view own profile only)
CREATE POLICY "Admin pimpinan can view own profile" 
ON public.profiles FOR SELECT 
USING (has_role(auth.uid(), 'admin_pimpinan') AND id = auth.uid());

CREATE POLICY "Admin pimpinan can update own profile" 
ON public.profiles FOR UPDATE 
USING (has_role(auth.uid(), 'admin_pimpinan') AND id = auth.uid());
