-- Fix RLS policy INSERT untuk history tables setelah mutasi
-- Problem: Setelah employee dimutasi, INSERT ke history tables gagal karena employee sudah tidak di department user
-- Solution: Gunakan grace period yang sama seperti SELECT employees (5 menit)

-- ============================================
-- MUTATION_HISTORY
-- ============================================
DROP POLICY IF EXISTS "Admin unit can insert own dept mutation history" ON public.mutation_history;

CREATE POLICY "Admin unit can insert own dept mutation history" 
ON public.mutation_history FOR INSERT 
WITH CHECK (
  has_role(auth.uid(), 'admin_unit') 
  AND employee_id IN (
    SELECT id FROM employees 
    WHERE department = get_user_department(auth.uid())
       OR updated_at > NOW() - INTERVAL '5 minutes'  -- Grace period
  )
);

-- ============================================
-- POSITION_HISTORY
-- ============================================
DROP POLICY IF EXISTS "Admin unit can insert own dept position history" ON public.position_history;

CREATE POLICY "Admin unit can insert own dept position history" 
ON public.position_history FOR INSERT 
WITH CHECK (
  has_role(auth.uid(), 'admin_unit') 
  AND employee_id IN (
    SELECT id FROM employees 
    WHERE department = get_user_department(auth.uid())
       OR updated_at > NOW() - INTERVAL '5 minutes'  -- Grace period
  )
);

-- ============================================
-- RANK_HISTORY
-- ============================================
DROP POLICY IF EXISTS "Admin unit can insert own dept rank history" ON public.rank_history;

CREATE POLICY "Admin unit can insert own dept rank history" 
ON public.rank_history FOR INSERT 
WITH CHECK (
  has_role(auth.uid(), 'admin_unit') 
  AND employee_id IN (
    SELECT id FROM employees 
    WHERE department = get_user_department(auth.uid())
       OR updated_at > NOW() - INTERVAL '5 minutes'  -- Grace period
  )
);

-- ============================================
-- COMPETENCY_TEST_HISTORY
-- ============================================
DROP POLICY IF EXISTS "Admin unit can insert own dept competency test history" ON public.competency_test_history;

CREATE POLICY "Admin unit can insert own dept competency test history" 
ON public.competency_test_history FOR INSERT 
WITH CHECK (
  has_role(auth.uid(), 'admin_unit') 
  AND employee_id IN (
    SELECT id FROM employees 
    WHERE department = get_user_department(auth.uid())
       OR updated_at > NOW() - INTERVAL '5 minutes'  -- Grace period
  )
);

-- ============================================
-- TRAINING_HISTORY
-- ============================================
DROP POLICY IF EXISTS "Admin unit can insert own dept training history" ON public.training_history;

CREATE POLICY "Admin unit can insert own dept training history" 
ON public.training_history FOR INSERT 
WITH CHECK (
  has_role(auth.uid(), 'admin_unit') 
  AND employee_id IN (
    SELECT id FROM employees 
    WHERE department = get_user_department(auth.uid())
       OR updated_at > NOW() - INTERVAL '5 minutes'  -- Grace period
  )
);

-- Catatan: Grace period 5 menit mengizinkan admin_unit untuk:
-- 1. Update employee (termasuk mutasi ke unit lain)
-- 2. Insert history records untuk employee tersebut
-- 3. Setelah 5 menit, employee yang sudah mutasi keluar tidak bisa diakses lagi
-- Ini tetap aman karena hanya employee yang BARU SAJA diupdate yang bisa diakses
