-- Test query untuk melihat apakah data pegawai bisa diakses

-- 1. Check total pegawai aktif
SELECT 
  'Total Active Employees' as test,
  COUNT(*) as count
FROM employees
WHERE is_active = true;

-- 2. Check struktur column
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'employees'
ORDER BY ordinal_position;

-- 3. Sample data pegawai
SELECT 
  id,
  name,
  nip,
  asn_status,
  rank,
  rank_group,
  position_type,
  position_name,
  department
FROM employees
WHERE is_active = true
LIMIT 5;

-- 4. Count by ASN status
SELECT 
  asn_status,
  COUNT(*) as count
FROM employees
WHERE is_active = true
GROUP BY asn_status
ORDER BY count DESC;

-- 5. Test dengan escaped rank
SELECT 
  name,
  "rank",
  rank_group,
  asn_status
FROM employees
WHERE is_active = true
LIMIT 3;
