-- Detailed comparison per department
WITH db_data AS (
  SELECT 
    department,
    COUNT(CASE WHEN asn_status IN ('PNS', 'CPNS') THEN 1 END) as pns,
    COUNT(CASE WHEN asn_status = 'PPPK' THEN 1 END) as pppk,
    COUNT(CASE WHEN asn_status = 'Non ASN' THEN 1 END) as non_asn,
    COUNT(*) as total
  FROM employees
  GROUP BY department
),
excel_data AS (
  SELECT 'Setditjen Binalavotas' as department, 76 as pns, 20 as pppk, 48 as non_asn, 144 as total
  UNION ALL SELECT 'Direktorat Bina Stankomproglat', 40, 12, 3, 55
  UNION ALL SELECT 'Direktorat Bina Lemlatvok', 37, 21, 10, 68
  UNION ALL SELECT 'Direktorat Bina Lavogan', 39, 10, 14, 63
  UNION ALL SELECT 'Direktorat Bina Intala', 41, 9, 6, 56
  UNION ALL SELECT 'Direktorat Bina Peningkatan Produktivitas', 35, 10, 7, 52
  UNION ALL SELECT 'Sekretariat BNSP', 58, 12, 33, 103
  UNION ALL SELECT 'BBPVP Bekasi', 164, 38, 55, 257
  UNION ALL SELECT 'BBPVP Bandung', 124, 24, 45, 193
  UNION ALL SELECT 'BBPVP Serang', 132, 22, 27, 181
  UNION ALL SELECT 'BBPVP Medan', 109, 23, 45, 177
  UNION ALL SELECT 'BBPVP Semarang', 152, 16, 32, 200
  UNION ALL SELECT 'BBPVP Makassar', 145, 28, 55, 228
  UNION ALL SELECT 'BPVP Surakarta', 115, 7, 55, 177
  UNION ALL SELECT 'BPVP Ambon', 53, 18, 16, 87
  UNION ALL SELECT 'BPVP Ternate', 67, 10, 28, 105
  UNION ALL SELECT 'BPVP Banda Aceh', 75, 15, 24, 114
  UNION ALL SELECT 'BPVP Sorong', 65, 3, 17, 85
  UNION ALL SELECT 'BPVP Kendari', 55, 29, 9, 93
  UNION ALL SELECT 'BPVP Samarinda', 60, 14, 30, 104
  UNION ALL SELECT 'BPVP Padang', 98, 15, 39, 152
  UNION ALL SELECT 'BPVP Bandung Barat', 43, 20, 28, 91
  UNION ALL SELECT 'BPVP Lotim', 63, 33, 37, 133
  UNION ALL SELECT 'BPVP Bantaeng', 46, 13, 19, 78
  UNION ALL SELECT 'BPVP Banyuwangi', 36, 20, 19, 75
  UNION ALL SELECT 'BPVP Sidoarjo', 59, 13, 22, 94
  UNION ALL SELECT 'BPVP Pangkep', 43, 9, 13, 65
  UNION ALL SELECT 'BPVP Belitung', 37, 7, 24, 68
)
SELECT 
  COALESCE(db.department, ex.department) as department,
  db.pns as db_pns,
  ex.pns as excel_pns,
  (db.pns - ex.pns) as pns_diff,
  db.pppk as db_pppk,
  ex.pppk as excel_pppk,
  (db.pppk - ex.pppk) as pppk_diff,
  db.non_asn as db_non_asn,
  ex.non_asn as excel_non_asn,
  (db.non_asn - ex.non_asn) as non_asn_diff,
  db.total as db_total,
  ex.total as excel_total,
  (db.total - ex.total) as total_diff
FROM db_data db
FULL OUTER JOIN excel_data ex ON db.department = ex.department
WHERE db.pns != ex.pns OR db.pppk != ex.pppk OR db.non_asn != ex.non_asn OR db.total != ex.total
ORDER BY ABS(COALESCE(db.total, 0) - COALESCE(ex.total, 0)) DESC;
