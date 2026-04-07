-- Compare database data with Excel rekap (Maret 2026)
-- Expected totals from Excel:
-- PNS: 2,067 | PPPK: 471 | Total ASN: 2,538 | Non ASN: 760 | Total: 3,298

-- 1. Overall totals comparison
SELECT 
  'Database Total' as source,
  COUNT(CASE WHEN asn_status IN ('PNS', 'CPNS') THEN 1 END) as pns_total,
  COUNT(CASE WHEN asn_status = 'PPPK' THEN 1 END) as pppk_total,
  COUNT(CASE WHEN asn_status IN ('PNS', 'CPNS', 'PPPK') THEN 1 END) as asn_total,
  COUNT(CASE WHEN asn_status = 'Non ASN' THEN 1 END) as non_asn_total,
  COUNT(*) as grand_total
FROM employees

UNION ALL

SELECT 
  'Excel Rekap' as source,
  2067 as pns_total,
  471 as pppk_total,
  2538 as asn_total,
  760 as non_asn_total,
  3298 as grand_total

UNION ALL

SELECT 
  'Difference' as source,
  COUNT(CASE WHEN asn_status IN ('PNS', 'CPNS') THEN 1 END) - 2067 as pns_diff,
  COUNT(CASE WHEN asn_status = 'PPPK' THEN 1 END) - 471 as pppk_diff,
  COUNT(CASE WHEN asn_status IN ('PNS', 'CPNS', 'PPPK') THEN 1 END) - 2538 as asn_diff,
  COUNT(CASE WHEN asn_status = 'Non ASN' THEN 1 END) - 760 as non_asn_diff,
  COUNT(*) - 3298 as grand_diff
FROM employees;

-- 2. Breakdown by department
SELECT 
  department,
  COUNT(CASE WHEN asn_status IN ('PNS', 'CPNS') THEN 1 END) as pns,
  COUNT(CASE WHEN asn_status = 'PPPK' THEN 1 END) as pppk,
  COUNT(CASE WHEN asn_status IN ('PNS', 'CPNS', 'PPPK') THEN 1 END) as total_asn,
  COUNT(CASE WHEN asn_status = 'Non ASN' THEN 1 END) as non_asn,
  COUNT(*) as total_pegawai
FROM employees
GROUP BY department
ORDER BY department;

-- 3. Check for CPNS separately (not in Excel rekap)
SELECT 
  'CPNS Count (not in Excel)' as note,
  COUNT(*) as cpns_count
FROM employees
WHERE asn_status = 'CPNS';

-- 4. PNS breakdown by rank_group (Golongan I, II, III, IV)
SELECT 
  'PNS by Golongan' as category,
  COUNT(CASE WHEN rank_group ~ '\(I/' THEN 1 END) as gol_i,
  COUNT(CASE WHEN rank_group ~ '\(II/' THEN 1 END) as gol_ii,
  COUNT(CASE WHEN rank_group ~ '\(III/' THEN 1 END) as gol_iii,
  COUNT(CASE WHEN rank_group ~ '\(IV/' THEN 1 END) as gol_iv,
  COUNT(*) as total_pns
FROM employees
WHERE asn_status IN ('PNS', 'CPNS');

-- 5. PPPK breakdown by rank_group (III, V, VII, IX)
SELECT 
  'PPPK by Golongan' as category,
  COUNT(CASE WHEN rank_group = 'III' THEN 1 END) as gol_iii,
  COUNT(CASE WHEN rank_group = 'V' THEN 1 END) as gol_v,
  COUNT(CASE WHEN rank_group = 'VII' THEN 1 END) as gol_vii,
  COUNT(CASE WHEN rank_group = 'IX' THEN 1 END) as gol_ix,
  COUNT(*) as total_pppk
FROM employees
WHERE asn_status = 'PPPK';
