-- Final verification: Check if all CPPPK and PPPK 2025 are fixed

-- 1. Check for any remaining problematic asn_status values
SELECT 
  'Problematic Status Check' as verification_type,
  COUNT(CASE WHEN asn_status = 'CPPPK' THEN 1 END) as cpppk_count,
  COUNT(CASE WHEN asn_status = 'PPPK 2025' THEN 1 END) as pppk_2025_count,
  COUNT(CASE WHEN asn_status LIKE '%PPPK%' AND asn_status != 'PPPK' THEN 1 END) as other_pppk_variants,
  COUNT(CASE WHEN asn_status IS NULL THEN 1 END) as null_count
FROM employees;

-- 2. Show all distinct asn_status values
SELECT 
  asn_status,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM employees
GROUP BY asn_status
ORDER BY count DESC;

-- 3. Verify PPPK data is correct
SELECT 
  'PPPK Verification' as check_type,
  COUNT(*) as total_pppk,
  COUNT(CASE WHEN rank_group IN ('V', 'VII', 'IX') THEN 1 END) as with_correct_rank,
  COUNT(CASE WHEN rank_group NOT IN ('V', 'VII', 'IX') OR rank_group IS NULL THEN 1 END) as with_incorrect_rank
FROM employees
WHERE asn_status = 'PPPK';

-- 4. Sample of PPPK employees to verify
SELECT 
  nip,
  name,
  rank_group,
  asn_status,
  department
FROM employees
WHERE asn_status = 'PPPK'
LIMIT 10;
