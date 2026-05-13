-- Script untuk memperbaiki manual entries langsung di database
-- HATI-HATI: Backup data sebelum menjalankan script ini!

-- Step 1: Update manual entries yang bisa di-match by NIP
UPDATE employee_cases ec
SET 
  employee_id = e.id,
  employee_name = e.name,
  employee_nip = e.nip,
  case_details = CASE 
    WHEN ec.case_details IS NOT NULL THEN 
      ec.case_details - 'isManualEntry'
    ELSE 
      NULL
  END,
  updated_at = NOW()
FROM employees e
WHERE 
  ec.employee_id LIKE 'MANUAL_%'
  AND ec.employee_nip IS NOT NULL
  AND ec.employee_nip != '-'
  AND e.nip = ec.employee_nip;

-- Check hasil update by NIP
SELECT 
  'Updated by NIP' as action,
  COUNT(*) as count
FROM employee_cases ec
JOIN employees e ON e.id = ec.employee_id
WHERE ec.updated_at > NOW() - INTERVAL '1 minute';

-- Step 2: Update manual entries yang tersisa, match by name (case-insensitive)
UPDATE employee_cases ec
SET 
  employee_id = e.id,
  employee_name = e.name,
  employee_nip = e.nip,
  case_details = CASE 
    WHEN ec.case_details IS NOT NULL THEN 
      ec.case_details - 'isManualEntry'
    ELSE 
      NULL
  END,
  updated_at = NOW()
FROM employees e
WHERE 
  ec.employee_id LIKE 'MANUAL_%'
  AND LOWER(TRIM(e.name)) = LOWER(TRIM(ec.employee_name));

-- Check hasil update by name
SELECT 
  'Updated by Name' as action,
  COUNT(*) as count
FROM employee_cases ec
JOIN employees e ON e.id = ec.employee_id
WHERE ec.updated_at > NOW() - INTERVAL '1 minute';

-- Step 3: Check manual entries yang masih tersisa (tidak bisa di-match)
SELECT 
  id,
  case_number,
  employee_id,
  employee_name,
  employee_nip,
  case_type,
  status
FROM employee_cases 
WHERE employee_id LIKE 'MANUAL_%'
ORDER BY case_number;

-- Summary
SELECT 
  'Total Cases' as metric,
  COUNT(*) as count
FROM employee_cases
UNION ALL
SELECT 
  'Connected Cases' as metric,
  COUNT(*) as count
FROM employee_cases ec
WHERE EXISTS (SELECT 1 FROM employees e WHERE e.id = ec.employee_id)
UNION ALL
SELECT 
  'Manual Entries Remaining' as metric,
  COUNT(*) as count
FROM employee_cases
WHERE employee_id LIKE 'MANUAL_%'
UNION ALL
SELECT 
  'Disconnected Cases' as metric,
  COUNT(*) as count
FROM employee_cases ec
WHERE NOT EXISTS (SELECT 1 FROM employees e WHERE e.id = ec.employee_id)
  AND employee_id NOT LIKE 'MANUAL_%';
