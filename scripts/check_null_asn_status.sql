-- Check employees with NULL asn_status
SELECT 
  id,
  nip,
  name,
  rank_group,
  asn_status,
  department,
  position_name
FROM employees
WHERE asn_status IS NULL
ORDER BY department, rank_group;
