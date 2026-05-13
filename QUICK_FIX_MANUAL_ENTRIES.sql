-- ============================================
-- QUICK FIX: Manual Entries to Integrated Data
-- ============================================
-- BACKUP DATA DULU SEBELUM JALANKAN!
-- ============================================

-- Step 1: CHECK - Lihat manual entries yang ada
SELECT 
  '=== MANUAL ENTRIES ===' as info,
  COUNT(*) as total
FROM employee_cases 
WHERE employee_id LIKE 'MANUAL_%';

-- Step 2: CHECK - Detail manual entries
SELECT 
  case_number,
  employee_name,
  employee_nip,
  case_type,
  status
FROM employee_cases 
WHERE employee_id LIKE 'MANUAL_%'
ORDER BY case_number;

-- ============================================
-- FIX 1: Match by Single NIP (Exact Match)
-- ============================================
UPDATE employee_cases ec
SET 
  employee_id = e.id,
  employee_name = e.name,
  employee_nip = e.nip,
  updated_at = NOW()
FROM employees e
WHERE 
  ec.employee_id LIKE 'MANUAL_%'
  AND ec.employee_nip IS NOT NULL
  AND ec.employee_nip != '-'
  AND ec.employee_nip NOT LIKE '%/%'
  AND ec.employee_nip NOT LIKE '%,%'
  AND TRIM(e.nip) = TRIM(ec.employee_nip);

-- Check hasil Fix 1
SELECT 'Fix 1: Single NIP Match' as step, COUNT(*) as updated
FROM employee_cases 
WHERE updated_at > NOW() - INTERVAL '10 seconds'
  AND employee_id NOT LIKE 'MANUAL_%';

-- ============================================
-- FIX 2: Match by Multiple NIPs - First NIP
-- ============================================
UPDATE employee_cases ec
SET 
  employee_id = e.id,
  employee_name = e.name,
  employee_nip = e.nip,
  updated_at = NOW()
FROM employees e
WHERE 
  ec.employee_id LIKE 'MANUAL_%'
  AND ec.employee_nip LIKE '%/%'
  AND TRIM(e.nip) = TRIM(SPLIT_PART(ec.employee_nip, '/', 1));

-- Check hasil Fix 2
SELECT 'Fix 2: Multiple NIP (First)' as step, COUNT(*) as updated
FROM employee_cases 
WHERE updated_at > NOW() - INTERVAL '10 seconds'
  AND employee_id NOT LIKE 'MANUAL_%';

-- ============================================
-- FIX 3: Match by Multiple NIPs - Second NIP
-- ============================================
UPDATE employee_cases ec
SET 
  employee_id = e.id,
  employee_name = e.name,
  employee_nip = e.nip,
  updated_at = NOW()
FROM employees e
WHERE 
  ec.employee_id LIKE 'MANUAL_%'
  AND ec.employee_nip LIKE '%/%'
  AND TRIM(e.nip) = TRIM(SPLIT_PART(ec.employee_nip, '/', 2));

-- Check hasil Fix 3
SELECT 'Fix 3: Multiple NIP (Second)' as step, COUNT(*) as updated
FROM employee_cases 
WHERE updated_at > NOW() - INTERVAL '10 seconds'
  AND employee_id NOT LIKE 'MANUAL_%';

-- ============================================
-- FIX 4: Match by Name (Fallback)
-- ============================================
UPDATE employee_cases ec
SET 
  employee_id = e.id,
  employee_name = e.name,
  employee_nip = e.nip,
  updated_at = NOW()
FROM employees e
WHERE 
  ec.employee_id LIKE 'MANUAL_%'
  AND LOWER(TRIM(e.name)) = LOWER(TRIM(
    CASE 
      WHEN ec.employee_name LIKE '%/%' THEN SPLIT_PART(ec.employee_name, '/', 1)
      ELSE ec.employee_name
    END
  ));

-- Check hasil Fix 4
SELECT 'Fix 4: Name Match' as step, COUNT(*) as updated
FROM employee_cases 
WHERE updated_at > NOW() - INTERVAL '10 seconds'
  AND employee_id NOT LIKE 'MANUAL_%';

-- ============================================
-- FINAL CHECK: Manual entries yang tersisa
-- ============================================
SELECT 
  '=== REMAINING MANUAL ENTRIES ===' as info,
  COUNT(*) as total
FROM employee_cases 
WHERE employee_id LIKE 'MANUAL_%';

-- Detail manual entries yang tersisa
SELECT 
  case_number,
  employee_name,
  employee_nip,
  case_type,
  'NO MATCH FOUND' as reason
FROM employee_cases 
WHERE employee_id LIKE 'MANUAL_%'
ORDER BY case_number;

-- ============================================
-- SUMMARY REPORT
-- ============================================
SELECT 
  'Total Cases' as metric,
  COUNT(*) as count
FROM employee_cases
UNION ALL
SELECT 
  'Connected Cases',
  COUNT(*)
FROM employee_cases ec
WHERE EXISTS (SELECT 1 FROM employees e WHERE e.id = ec.employee_id)
UNION ALL
SELECT 
  'Manual Entries Remaining',
  COUNT(*)
FROM employee_cases
WHERE employee_id LIKE 'MANUAL_%'
UNION ALL
SELECT 
  'Disconnected Cases',
  COUNT(*)
FROM employee_cases ec
WHERE NOT EXISTS (SELECT 1 FROM employees e WHERE e.id = ec.employee_id)
  AND employee_id NOT LIKE 'MANUAL_%';
