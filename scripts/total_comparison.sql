-- Total comparison: Database vs Excel Rekap
SELECT 
  'Database' as source,
  COUNT(CASE WHEN asn_status IN ('PNS', 'CPNS') THEN 1 END) as pns_cpns,
  COUNT(CASE WHEN asn_status = 'PNS' THEN 1 END) as pns_only,
  COUNT(CASE WHEN asn_status = 'CPNS' THEN 1 END) as cpns_only,
  COUNT(CASE WHEN asn_status = 'PPPK' THEN 1 END) as pppk,
  COUNT(CASE WHEN asn_status IN ('PNS', 'CPNS', 'PPPK') THEN 1 END) as total_asn,
  COUNT(CASE WHEN asn_status = 'Non ASN' THEN 1 END) as non_asn,
  COUNT(*) as grand_total
FROM employees

UNION ALL

SELECT 
  'Excel Rekap' as source,
  2067 as pns_cpns,
  NULL as pns_only,
  NULL as cpns_only,
  471 as pppk,
  2538 as total_asn,
  760 as non_asn,
  3298 as grand_total;
