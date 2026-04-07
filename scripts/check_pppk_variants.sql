-- Check for any PPPK variants that are not standardized
SELECT 
  asn_status,
  COUNT(*) as count
FROM employees
WHERE asn_status LIKE '%PPPK%' OR asn_status LIKE '%pppk%'
GROUP BY asn_status
ORDER BY count DESC;
