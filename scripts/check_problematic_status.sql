-- Check for problematic status values
SELECT 
  'NULL asn_status' as issue,
  COUNT(*) as count
FROM employees
WHERE asn_status IS NULL

UNION ALL

SELECT 
  'CPPPK (typo)' as issue,
  COUNT(*) as count
FROM employees
WHERE asn_status = 'CPPPK'

UNION ALL

SELECT 
  'PPPK 2025' as issue,
  COUNT(*) as count
FROM employees
WHERE asn_status = 'PPPK 2025'

UNION ALL

SELECT 
  'Other PPPK variants' as issue,
  COUNT(*) as count
FROM employees
WHERE asn_status LIKE '%PPPK%' AND asn_status NOT IN ('PPPK', 'CPPPK', 'PPPK 2025')

UNION ALL

SELECT 
  'Valid PPPK' as issue,
  COUNT(*) as count
FROM employees
WHERE asn_status = 'PPPK';
