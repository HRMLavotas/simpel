-- Fix RLS mutation_history (dan history terkait) setelah Quick Action mutasi.
-- Masalah: employee di-update ke unit tujuan dulu, lalu INSERT mutation_history gagal (42501)
-- karena pegawai sudah tidak ada di get_accessible_departments().
-- Solusi: grace period 5 menit + izinkan insert/delete jika dari_unit masih unit yang dapat diakses admin.

-- ============================================
-- MUTATION_HISTORY
-- ============================================
DROP POLICY IF EXISTS "Admin unit can insert own dept mutation history" ON public.mutation_history;
CREATE POLICY "Admin unit can insert own dept mutation history"
ON public.mutation_history FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'admin_unit')
  AND (
    employee_id IN (
      SELECT id FROM employees
      WHERE department = ANY(public.get_accessible_departments(auth.uid()))
         OR updated_at > NOW() - INTERVAL '5 minutes'
    )
    OR COALESCE(dari_unit, '') = ANY(public.get_accessible_departments(auth.uid()))
  )
);

DROP POLICY IF EXISTS "Admin unit can update own dept mutation history" ON public.mutation_history;
CREATE POLICY "Admin unit can update own dept mutation history"
ON public.mutation_history FOR UPDATE
USING (
  has_role(auth.uid(), 'admin_unit')
  AND (
    employee_id IN (
      SELECT id FROM employees
      WHERE department = ANY(public.get_accessible_departments(auth.uid()))
         OR updated_at > NOW() - INTERVAL '5 minutes'
    )
    OR COALESCE(dari_unit, '') = ANY(public.get_accessible_departments(auth.uid()))
    OR COALESCE(ke_unit, '') = ANY(public.get_accessible_departments(auth.uid()))
  )
);

DROP POLICY IF EXISTS "Admin unit can delete own dept mutation history" ON public.mutation_history;
CREATE POLICY "Admin unit can delete own dept mutation history"
ON public.mutation_history FOR DELETE
USING (
  has_role(auth.uid(), 'admin_unit')
  AND (
    employee_id IN (
      SELECT id FROM employees
      WHERE department = ANY(public.get_accessible_departments(auth.uid()))
         OR updated_at > NOW() - INTERVAL '5 minutes'
    )
    OR COALESCE(dari_unit, '') = ANY(public.get_accessible_departments(auth.uid()))
    OR COALESCE(ke_unit, '') = ANY(public.get_accessible_departments(auth.uid()))
  )
);

-- ============================================
-- POSITION_HISTORY, RANK_HISTORY, EDUCATION, TRAINING, COMPETENCY
-- (grace period saja — tidak punya dari_unit)
-- ============================================
DROP POLICY IF EXISTS "Admin unit can insert own dept position history" ON public.position_history;
CREATE POLICY "Admin unit can insert own dept position history"
ON public.position_history FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'admin_unit')
  AND employee_id IN (
    SELECT id FROM employees
    WHERE department = ANY(public.get_accessible_departments(auth.uid()))
       OR updated_at > NOW() - INTERVAL '5 minutes'
  )
);

DROP POLICY IF EXISTS "Admin unit can delete own dept position history" ON public.position_history;
CREATE POLICY "Admin unit can delete own dept position history"
ON public.position_history FOR DELETE
USING (
  has_role(auth.uid(), 'admin_unit')
  AND employee_id IN (
    SELECT id FROM employees
    WHERE department = ANY(public.get_accessible_departments(auth.uid()))
       OR updated_at > NOW() - INTERVAL '5 minutes'
  )
);

DROP POLICY IF EXISTS "Admin unit can insert own dept rank history" ON public.rank_history;
CREATE POLICY "Admin unit can insert own dept rank history"
ON public.rank_history FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'admin_unit')
  AND employee_id IN (
    SELECT id FROM employees
    WHERE department = ANY(public.get_accessible_departments(auth.uid()))
       OR updated_at > NOW() - INTERVAL '5 minutes'
  )
);

DROP POLICY IF EXISTS "Admin unit can delete own dept rank history" ON public.rank_history;
CREATE POLICY "Admin unit can delete own dept rank history"
ON public.rank_history FOR DELETE
USING (
  has_role(auth.uid(), 'admin_unit')
  AND employee_id IN (
    SELECT id FROM employees
    WHERE department = ANY(public.get_accessible_departments(auth.uid()))
       OR updated_at > NOW() - INTERVAL '5 minutes'
  )
);

DROP POLICY IF EXISTS "Admin unit can insert own dept education history" ON public.education_history;
CREATE POLICY "Admin unit can insert own dept education history"
ON public.education_history FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'admin_unit')
  AND employee_id IN (
    SELECT id FROM employees
    WHERE department = ANY(public.get_accessible_departments(auth.uid()))
       OR updated_at > NOW() - INTERVAL '5 minutes'
  )
);

DROP POLICY IF EXISTS "Admin unit can delete own dept education history" ON public.education_history;
CREATE POLICY "Admin unit can delete own dept education history"
ON public.education_history FOR DELETE
USING (
  has_role(auth.uid(), 'admin_unit')
  AND employee_id IN (
    SELECT id FROM employees
    WHERE department = ANY(public.get_accessible_departments(auth.uid()))
       OR updated_at > NOW() - INTERVAL '5 minutes'
  )
);

DROP POLICY IF EXISTS "Admin unit can insert own dept training history" ON public.training_history;
CREATE POLICY "Admin unit can insert own dept training history"
ON public.training_history FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'admin_unit')
  AND employee_id IN (
    SELECT id FROM employees
    WHERE department = ANY(public.get_accessible_departments(auth.uid()))
       OR updated_at > NOW() - INTERVAL '5 minutes'
  )
);

DROP POLICY IF EXISTS "Admin unit can delete own dept training history" ON public.training_history;
CREATE POLICY "Admin unit can delete own dept training history"
ON public.training_history FOR DELETE
USING (
  has_role(auth.uid(), 'admin_unit')
  AND employee_id IN (
    SELECT id FROM employees
    WHERE department = ANY(public.get_accessible_departments(auth.uid()))
       OR updated_at > NOW() - INTERVAL '5 minutes'
  )
);

DROP POLICY IF EXISTS "Admin unit can insert own dept competency test history" ON public.competency_test_history;
CREATE POLICY "Admin unit can insert own dept competency test history"
ON public.competency_test_history FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'admin_unit')
  AND employee_id IN (
    SELECT id FROM employees
    WHERE department = ANY(public.get_accessible_departments(auth.uid()))
       OR updated_at > NOW() - INTERVAL '5 minutes'
  )
);

DROP POLICY IF EXISTS "Admin unit can delete own dept competency test history" ON public.competency_test_history;
CREATE POLICY "Admin unit can delete own dept competency test history"
ON public.competency_test_history FOR DELETE
USING (
  has_role(auth.uid(), 'admin_unit')
  AND employee_id IN (
    SELECT id FROM employees
    WHERE department = ANY(public.get_accessible_departments(auth.uid()))
       OR updated_at > NOW() - INTERVAL '5 minutes'
  )
);
