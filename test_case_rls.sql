-- ============================================================================
-- TEST RLS POLICIES FOR EMPLOYEE CASES
-- Run this in Supabase SQL Editor while logged in as admin_pusat
-- ============================================================================

-- 1. Check if current user has admin_pusat role
SELECT 
  auth.uid() as current_user_id,
  has_role(auth.uid(), 'admin_pusat') as is_admin_pusat;

-- 2. Check user_roles table
SELECT * FROM user_roles WHERE user_id = auth.uid();

-- 3. Try to select all cases (should work if admin_pusat)
SELECT 
  id,
  case_number,
  employee_name,
  employee_nip,
  case_type,
  status,
  created_at
FROM employee_cases
ORDER BY created_at DESC;

-- 4. Count total cases
SELECT COUNT(*) as total_cases FROM employee_cases;

-- 5. Check if there are any cases at all (bypass RLS)
SELECT COUNT(*) as total_cases_no_rls 
FROM employee_cases;

-- 6. Test insert permission
-- This will fail if you don't have permission
-- Comment out if you don't want to create test data
/*
INSERT INTO employee_cases (
  employee_id,
  employee_name,
  employee_nip,
  case_type,
  status,
  description,
  report_date,
  created_by
) VALUES (
  'test_123',
  'Test Employee',
  '199001012020121001',
  'perceraian',
  'baru',
  'Test case untuk debugging',
  CURRENT_DATE,
  auth.uid()
) RETURNING *;
*/

-- 7. Check RLS policies on employee_cases
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'employee_cases';
