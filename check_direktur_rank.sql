-- Check rank_group for Direktur at Direktorat Bina Stankomproglat
SELECT 
  id,
  name,
  nip,
  asn_status,
  rank_group,
  CASE 
    WHEN rank_group IS NULL THEN 'NULL'
    WHEN rank_group = '' THEN 'EMPTY STRING'
    ELSE 'HAS VALUE'
  END as rank_status,
  LENGTH(rank_group) as rank_length,
  position_name,
  department
FROM employees 
WHERE position_name = 'Direktur' 
  AND department = 'Direktorat Bina Stankomproglat'
LIMIT 5;
