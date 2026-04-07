-- Check all distinct asn_status values
SELECT 
  asn_status,
  COUNT(*) as total,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM employees
GROUP BY asn_status
ORDER BY total DESC;
