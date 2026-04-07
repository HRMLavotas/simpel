-- Check all distinct asn_status values
SELECT 
  asn_status,
  COUNT(*) as count
FROM employees
GROUP BY asn_status
ORDER BY count DESC;

-- Check employees with rank_group but potentially wrong asn_status
-- PPPK should have rank_group like 'V', 'VII', 'IX'
-- PNS should have rank_group like 'Pembina Tk I (IV/b)' or similar format
SELECT 
  id,
  nip,
  name,
  rank_group,
  asn_status,
  department
FROM employees
WHERE rank_group IS NOT NULL
  AND (
    -- PPPK pattern but not marked as PPPK
    (rank_group ~ '^(V|VII|IX)$' AND asn_status != 'PPPK')
    OR
    -- PNS pattern but not marked as PNS or CPNS
    (rank_group ~ '\([IVX]+/[a-z]\)' AND asn_status NOT IN ('PNS', 'CPNS'))
  )
LIMIT 50;
