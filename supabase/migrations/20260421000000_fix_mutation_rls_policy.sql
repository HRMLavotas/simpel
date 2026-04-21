-- Fix RLS policy untuk mengizinkan admin_unit melakukan mutasi pegawai keluar dari unit-nya
-- Problem: WITH CHECK clause memblokir perubahan department ke unit lain
-- Solution: Ubah WITH CHECK untuk mengizinkan mutasi keluar (department lama = user department)

-- Drop existing policy
DROP POLICY IF EXISTS "Admin unit can update own department employees" ON public.employees;

-- Recreate with fixed WITH CHECK
-- USING: Hanya bisa update employee yang saat ini di department-nya
-- WITH CHECK: Mengizinkan perubahan department (mutasi keluar) selama employee awalnya dari department user
CREATE POLICY "Admin unit can update own department employees"
ON public.employees FOR UPDATE
USING (
  public.has_role(auth.uid(), 'admin_unit') 
  AND department = public.get_user_department(auth.uid())
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin_unit')
  -- Tidak perlu cek department di WITH CHECK karena USING sudah memastikan
  -- employee awalnya dari department user, jadi mutasi keluar diizinkan
);
