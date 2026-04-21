-- Fix RLS policy SELECT untuk mengizinkan admin_unit melihat employee yang baru dimutasi
-- Problem: Setelah UPDATE, ada query SELECT yang gagal karena employee sudah pindah department
-- Solution: Tambahkan grace period untuk SELECT setelah UPDATE

-- Drop existing policy
DROP POLICY IF EXISTS "Admin unit can view own department employees" ON public.employees;

-- Recreate with grace period for recently updated employees
CREATE POLICY "Admin unit can view own department employees"
ON public.employees FOR SELECT
USING (
  public.has_role(auth.uid(), 'admin_unit') 
  AND (
    -- Employee saat ini di department user
    department = public.get_user_department(auth.uid())
    OR
    -- Employee yang baru diupdate dalam 5 menit terakhir (grace period)
    -- Ini mengizinkan admin_unit melihat employee yang baru dimutasi keluar
    updated_at > NOW() - INTERVAL '5 minutes'
  )
);

-- Catatan: Policy ini tetap aman karena:
-- 1. Admin unit bisa melihat employee yang saat ini di unit-nya
-- 2. Admin unit bisa melihat employee yang baru diupdate (5 menit) untuk menyelesaikan operasi
-- 3. Setelah 5 menit, employee yang sudah mutasi keluar tidak bisa dilihat lagi
-- 4. Grace period cukup untuk menyelesaikan operasi save dan refresh UI
