-- Check divorce cases
SELECT 
  id,
  case_number,
  employee_name,
  employee_nip,
  case_type,
  status,
  LEFT(description, 100) as description_preview
FROM employee_cases
WHERE case_type = 'perceraian'
ORDER BY created_at DESC;
