-- Investigation: Missing data analysis

-- 1. Check last input date per department
SELECT 
  department,
  COUNT(*) as total_pegawai,
  MAX(created_at) as last_input_date,
  MIN(created_at) as first_input_date
FROM employees
GROUP BY department
ORDER BY total_pegawai ASC
LIMIT 10;

-- 2. Check departments with very low counts (potential missing data)
SELECT 
  department,
  COUNT(CASE WHEN asn_status IN ('PNS', 'CPNS') THEN 1 END) as pns_count,
  COUNT(CASE WHEN asn_status = 'PPPK' THEN 1 END) as pppk_count,
  COUNT(CASE WHEN asn_status = 'Non ASN' THEN 1 END) as non_asn_count,
  COUNT(*) as total
FROM employees
GROUP BY department
HAVING COUNT(*) < 50
ORDER BY total ASC;

-- 3. Check for employees without NIP (incomplete data)
SELECT 
  department,
  COUNT(*) as employees_without_nip
FROM employees
WHERE nip IS NULL OR nip = ''
GROUP BY department
ORDER BY employees_without_nip DESC
LIMIT 10;

-- 4. Check for duplicate NIPs
SELECT 
  nip,
  COUNT(*) as duplicate_count,
  STRING_AGG(name, ', ') as names
FROM employees
WHERE nip IS NOT NULL AND nip != ''
GROUP BY nip
HAVING COUNT(*) > 1
LIMIT 10;
