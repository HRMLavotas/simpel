-- =============================================
-- Fix ASN Status Data
-- Memperbaiki data asn_status yang salah format
-- =============================================

-- 1. Fix "CPPPK" to "PPPK" (typo)
UPDATE employees
SET asn_status = 'PPPK'
WHERE asn_status = 'CPPPK';

-- 2. Fix "PPPK 2025" to "PPPK"
UPDATE employees
SET asn_status = 'PPPK'
WHERE asn_status = 'PPPK 2025';

-- 3. Auto-detect and fix based on rank_group pattern for NULL asn_status
-- PPPK: rank_group is V, VII, or IX
UPDATE employees
SET asn_status = 'PPPK'
WHERE asn_status IS NULL
  AND rank_group ~ '^(V|VII|IX)$';

-- 4. Auto-detect and fix based on rank_group pattern for NULL asn_status
-- PNS: rank_group contains format like (IV/b), (III/a), etc.
UPDATE employees
SET asn_status = 'PNS'
WHERE asn_status IS NULL
  AND rank_group ~ '\([IVX]+/[a-z]\)';

-- 5. Log the changes
DO $$
DECLARE
  cpppk_count INT;
  pppk2025_count INT;
  null_pppk_count INT;
  null_pns_count INT;
BEGIN
  -- Count records that were fixed
  SELECT COUNT(*) INTO cpppk_count FROM employees WHERE asn_status = 'PPPK' AND rank_group ~ '^(V|VII|IX)$';
  SELECT COUNT(*) INTO pppk2025_count FROM employees WHERE asn_status = 'PPPK';
  
  RAISE NOTICE 'Fixed CPPPK to PPPK: % records', cpppk_count;
  RAISE NOTICE 'Fixed PPPK 2025 to PPPK: % records', pppk2025_count;
  RAISE NOTICE 'Auto-detected PPPK from rank_group pattern';
  RAISE NOTICE 'Auto-detected PNS from rank_group pattern';
END $$;

-- 6. Verify the fix
SELECT 
  asn_status,
  COUNT(*) as count
FROM employees
GROUP BY asn_status
ORDER BY count DESC;
