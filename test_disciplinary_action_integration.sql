-- ============================================================================
-- TEST SCRIPT: Disciplinary Action Database Integration
-- Purpose: Verify that disciplinary actions are properly stored and retrieved
-- ============================================================================

-- 1. Check if employee_cases table has case_details column (JSONB)
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'employee_cases'
  AND column_name = 'case_details';

-- Expected: case_details | jsonb | YES

-- 2. Check existing cases with disciplinary actions
SELECT 
  id,
  case_number,
  employee_name,
  employee_nip,
  case_type,
  status,
  case_details->'disciplinaryActions' as disciplinary_actions,
  jsonb_array_length(COALESCE(case_details->'disciplinaryActions', '[]'::jsonb)) as action_count,
  created_at
FROM employee_cases
WHERE case_details->'disciplinaryActions' IS NOT NULL
ORDER BY created_at DESC
LIMIT 10;

-- 3. Check timeline entries for disciplinary actions
SELECT 
  ct.id,
  ct.case_id,
  ec.employee_name,
  ct.date,
  ct.description,
  ct.status,
  ct.documents,
  ct.created_at
FROM case_timeline ct
JOIN employee_cases ec ON ec.id = ct.case_id
WHERE ct.status = 'Hukuman Disiplin Diterbitkan'
ORDER BY ct.created_at DESC
LIMIT 10;

-- 4. Detailed view of disciplinary actions (expanded)
SELECT 
  ec.id as case_id,
  ec.case_number,
  ec.employee_name,
  ec.employee_nip,
  da.value->>'level' as level,
  da.value->>'type' as type,
  da.value->>'decisionNumber' as decision_number,
  da.value->>'decisionDate' as decision_date,
  da.value->>'effectiveDate' as effective_date,
  da.value->>'endDate' as end_date,
  da.value->>'issuedBy' as issued_by,
  da.value->>'violation' as violation,
  da.value->>'addedAt' as added_at
FROM employee_cases ec,
     jsonb_array_elements(COALESCE(ec.case_details->'disciplinaryActions', '[]'::jsonb)) as da(value)
ORDER BY da.value->>'addedAt' DESC
LIMIT 20;

-- 5. Statistics: Count of disciplinary actions by level
SELECT 
  da.value->>'level' as level,
  COUNT(*) as total_actions
FROM employee_cases ec,
     jsonb_array_elements(COALESCE(ec.case_details->'disciplinaryActions', '[]'::jsonb)) as da(value)
GROUP BY da.value->>'level'
ORDER BY total_actions DESC;

-- 6. Statistics: Count of disciplinary actions by type
SELECT 
  da.value->>'level' as level,
  da.value->>'type' as type,
  COUNT(*) as total_actions
FROM employee_cases ec,
     jsonb_array_elements(COALESCE(ec.case_details->'disciplinaryActions', '[]'::jsonb)) as da(value)
GROUP BY da.value->>'level', da.value->>'type'
ORDER BY total_actions DESC;

-- 7. Cases with multiple disciplinary actions
SELECT 
  ec.id,
  ec.case_number,
  ec.employee_name,
  jsonb_array_length(ec.case_details->'disciplinaryActions') as action_count,
  ec.created_at
FROM employee_cases ec
WHERE jsonb_array_length(COALESCE(ec.case_details->'disciplinaryActions', '[]'::jsonb)) > 1
ORDER BY action_count DESC;

-- 8. Recent disciplinary actions (last 30 days)
SELECT 
  ec.case_number,
  ec.employee_name,
  da.value->>'level' as level,
  da.value->>'decisionNumber' as decision_number,
  da.value->>'decisionDate' as decision_date,
  da.value->>'addedAt' as added_at
FROM employee_cases ec,
     jsonb_array_elements(COALESCE(ec.case_details->'disciplinaryActions', '[]'::jsonb)) as da(value)
WHERE (da.value->>'addedAt')::timestamp > NOW() - INTERVAL '30 days'
ORDER BY (da.value->>'addedAt')::timestamp DESC;

-- 9. Verify RLS policies allow reading case_details
-- Run this as authenticated user
SELECT 
  id,
  case_number,
  employee_name,
  case_details
FROM employee_cases
WHERE case_details IS NOT NULL
LIMIT 5;

-- 10. Test update case_details (DO NOT RUN IN PRODUCTION)
-- This is just a template for testing
/*
UPDATE employee_cases
SET case_details = jsonb_set(
  COALESCE(case_details, '{}'::jsonb),
  '{disciplinaryActions}',
  COALESCE(case_details->'disciplinaryActions', '[]'::jsonb) || 
  '[{
    "level": "sedang",
    "type": "penundaan_kenaikan_gaji_berkala_6_bulan",
    "decisionNumber": "TEST-123/SK/2026",
    "decisionDate": "2026-05-13",
    "effectiveDate": "2026-05-15",
    "endDate": "2026-11-15",
    "issuedBy": "Test Admin",
    "violation": "Test violation",
    "notes": "Test notes",
    "documentLink": "https://example.com/test.pdf",
    "addedAt": "2026-05-13T10:00:00.000Z"
  }]'::jsonb
)
WHERE id = 'YOUR_CASE_ID_HERE'
RETURNING id, case_number, case_details->'disciplinaryActions';
*/

-- ============================================================================
-- VALIDATION QUERIES
-- ============================================================================

-- Check if case_details structure is valid
SELECT 
  id,
  case_number,
  jsonb_typeof(case_details) as case_details_type,
  jsonb_typeof(case_details->'disciplinaryActions') as actions_type,
  CASE 
    WHEN jsonb_typeof(case_details->'disciplinaryActions') = 'array' THEN 'Valid'
    WHEN case_details->'disciplinaryActions' IS NULL THEN 'No actions'
    ELSE 'Invalid structure'
  END as validation_status
FROM employee_cases
WHERE case_details IS NOT NULL
LIMIT 10;

-- ============================================================================
-- CLEANUP (Optional - for testing only)
-- ============================================================================

-- Remove all disciplinary actions from a specific case (TESTING ONLY)
/*
UPDATE employee_cases
SET case_details = case_details - 'disciplinaryActions'
WHERE id = 'YOUR_CASE_ID_HERE';
*/

-- Remove specific disciplinary action by index (TESTING ONLY)
/*
UPDATE employee_cases
SET case_details = jsonb_set(
  case_details,
  '{disciplinaryActions}',
  (case_details->'disciplinaryActions') - 0  -- Remove first item (index 0)
)
WHERE id = 'YOUR_CASE_ID_HERE';
*/
