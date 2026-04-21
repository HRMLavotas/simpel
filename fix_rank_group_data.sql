-- Fix rank_group data that doesn't match standard format
-- Run with: $env:SUPABASE_ACCESS_TOKEN="sbp_6eaf6953a119b37dbbd73524a520cf76183ca56f"; $env:SUPABASE_DB_PASSWORD="Aliham251118!"; Get-Content fix_rank_group_data.sql | npx -y supabase@2.93.0 db query --linked

BEGIN;

-- 1. Fix rank_group with value "-" to NULL
UPDATE employees 
SET rank_group = NULL 
WHERE rank_group = '-';

-- 2. Fix incomplete rank format "(IV/a)" to full format "Pembina (IV/a)"
UPDATE employees 
SET rank_group = 'Pembina (IV/a)' 
WHERE rank_group = '(IV/a)';

-- 3. Ensure Non ASN employees have appropriate rank_group
UPDATE employees 
SET rank_group = 'Tenaga Alih Daya' 
WHERE asn_status = 'Non ASN' 
  AND (rank_group IS NULL OR rank_group = '' OR rank_group = '-');

-- 4. Check for any remaining invalid formats
SELECT 
  'Invalid formats remaining' as status,
  rank_group,
  asn_status,
  COUNT(*) as count
FROM employees
WHERE rank_group IS NOT NULL 
  AND rank_group != ''
  AND rank_group NOT IN (
    -- Valid PNS ranks
    'Juru Muda (I/a)', 'Juru Muda Tk I (I/b)', 'Juru (I/c)', 'Juru Tk I (I/d)',
    'Pengatur Muda (II/a)', 'Pengatur Muda Tk I (II/b)', 'Pengatur (II/c)', 'Pengatur Tk I (II/d)',
    'Penata Muda (III/a)', 'Penata Muda Tk I (III/b)', 'Penata (III/c)', 'Penata Tk I (III/d)',
    'Pembina (IV/a)', 'Pembina Tk I (IV/b)', 'Pembina Muda (IV/c)', 'Pembina Madya (IV/d)', 'Pembina Utama (IV/e)',
    -- Valid PPPK ranks
    'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI', 'XVII',
    -- Valid Non ASN
    'Tenaga Alih Daya', 'Tidak Ada'
  )
GROUP BY rank_group, asn_status
ORDER BY count DESC;

-- Summary of rank_group distribution after fix
SELECT 
  'Summary' as report,
  CASE 
    WHEN asn_status = 'PNS' THEN 'PNS'
    WHEN asn_status = 'PPPK' THEN 'PPPK'
    WHEN asn_status = 'Non ASN' THEN 'Non ASN'
    ELSE 'Other'
  END as category,
  COUNT(*) as total_employees,
  COUNT(rank_group) as with_rank_group,
  COUNT(*) - COUNT(rank_group) as without_rank_group
FROM employees
GROUP BY category
ORDER BY category;

COMMIT;
