-- Count employees with NULL asn_status
SELECT 
  COUNT(*) as total_null,
  COUNT(CASE WHEN rank_group IS NOT NULL THEN 1 END) as with_rank_group
FROM employees
WHERE asn_status IS NULL;

-- Sample of employees with NULL asn_status
SELECT 
  id,
  nip,
  name,
  rank_group,
  asn_status,
  department
FROM employees
WHERE asn_status IS NULL
LIMIT 20;
