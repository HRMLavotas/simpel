-- Check rank_group data in employees table
-- Run with: npx supabase db execute --file check_rank_data.sql --linked

\echo '=== CHECKING RANK_GROUP DATA ==='
\echo ''

-- Count employees with rank_group
SELECT 
  COUNT(*) as total_with_rank,
  COUNT(CASE WHEN rank_group IS NOT NULL AND rank_group != '' THEN 1 END) as non_empty_rank
FROM employees;

\echo ''
\echo '=== SAMPLE EMPLOYEES WITH RANK_GROUP ==='
\echo ''

-- Show sample employees with their rank_group
SELECT 
  id,
  name,
  asn_status,
  rank_group,
  LENGTH(rank_group) as rank_length,
  department
FROM employees
WHERE rank_group IS NOT NULL 
  AND rank_group != ''
ORDER BY created_at DESC
LIMIT 10;

\echo ''
\echo '=== RANK_GROUP VALUE DISTRIBUTION ==='
\echo ''

-- Show distribution of rank_group values
SELECT 
  rank_group,
  asn_status,
  COUNT(*) as count
FROM employees
WHERE rank_group IS NOT NULL 
  AND rank_group != ''
GROUP BY rank_group, asn_status
ORDER BY count DESC
LIMIT 20;

\echo ''
\echo '=== CHECK FOR DATA QUALITY ISSUES ==='
\echo ''

-- Check for rank_group with leading/trailing spaces
SELECT 
  'Ranks with spaces' as issue_type,
  COUNT(*) as count
FROM employees
WHERE rank_group != TRIM(rank_group);

-- Check for empty strings
SELECT 
  'Empty string ranks' as issue_type,
  COUNT(*) as count
FROM employees
WHERE rank_group = '';

\echo ''
\echo '=== VALID RANK OPTIONS (PNS) ==='
\echo ''
SELECT unnest(ARRAY[
  'Juru Muda (I/a)',
  'Juru Muda Tk I (I/b)',
  'Juru (I/c)',
  'Juru Tk I (I/d)',
  'Pengatur Muda (II/a)',
  'Pengatur Muda Tk I (II/b)',
  'Pengatur (II/c)',
  'Pengatur Tk I (II/d)',
  'Penata Muda (III/a)',
  'Penata Muda Tk I (III/b)',
  'Penata (III/c)',
  'Penata Tk I (III/d)',
  'Pembina (IV/a)',
  'Pembina Tk I (IV/b)',
  'Pembina Muda (IV/c)',
  'Pembina Madya (IV/d)',
  'Pembina Utama (IV/e)'
]) as valid_pns_ranks;

\echo ''
\echo '=== VALID RANK OPTIONS (PPPK) ==='
\echo ''
SELECT unnest(ARRAY['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI', 'XVII']) as valid_pppk_ranks;
