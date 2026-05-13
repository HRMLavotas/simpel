-- Script untuk memperbaiki manual entries dengan multiple NIPs (kasus perceraian)
-- Handles cases like: "199512012025212018 / 199608042025211010"

-- Step 1: Check manual entries dengan multiple NIPs
SELECT 
  id,
  case_number,
  employee_id,
  employee_name,
  employee_nip,
  case_type,
  CASE 
    WHEN employee_nip LIKE '%/%' OR employee_nip LIKE '%,%' OR employee_nip LIKE '%;%' THEN 'MULTIPLE_NIPS'
    ELSE 'SINGLE_NIP'
  END as nip_type
FROM employee_cases 
WHERE employee_id LIKE 'MANUAL_%'
ORDER BY nip_type DESC, case_number;

-- Step 2: Fix manual entries dengan single NIP
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
  AND ec.employee_nip NOT LIKE '%/%'
  AND ec.employee_nip NOT LIKE '%,%'
  AND ec.employee_nip NOT LIKE '%;%'
  AND TRIM(e.nip) = TRIM(ec.employee_nip);

-- Step 3: Fix manual entries dengan multiple NIPs - try first NIP
-- Extract first NIP before separator (/, ,, ;)
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
  AND (
    ec.employee_nip LIKE '%/%' 
    OR ec.employee_nip LIKE '%,%' 
    OR ec.employee_nip LIKE '%;%'
  )
  AND TRIM(e.nip) = TRIM(
    SPLIT_PART(
      SPLIT_PART(
        SPLIT_PART(ec.employee_nip, '/', 1),
        ',', 1
      ),
      ';', 1
    )
  );

-- Step 4: Fix remaining manual entries dengan multiple NIPs - try second NIP
-- Extract second NIP after separator
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
  AND ec.employee_nip LIKE '%/%'
  AND TRIM(e.nip) = TRIM(
    SPLIT_PART(ec.employee_nip, '/', 2)
  );

-- Step 5: Try match by name for remaining manual entries
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
  AND LOWER(TRIM(e.name)) = LOWER(TRIM(
    CASE 
      WHEN ec.employee_name LIKE '%/%' THEN SPLIT_PART(ec.employee_name, '/', 1)
      ELSE ec.employee_name
    END
  ));

-- Step 6: Final check - manual entries yang masih tersisa
SELECT 
  'Manual Entries Remaining' as status,
  COUNT(*) as count
FROM employee_cases 
WHERE employee_id LIKE 'MANUAL_%';

-- Step 7: Show remaining manual entries detail
SELECT 
  id,
  case_number,
  employee_id,
  employee_name,
  employee_nip,
  case_type,
  status,
  case_details->>'isManualEntry' as is_manual_flag
FROM employee_cases 
WHERE employee_id LIKE 'MANUAL_%'
ORDER BY case_number;

-- Step 8: Summary report
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
  'Manual Entries' as metric,
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
