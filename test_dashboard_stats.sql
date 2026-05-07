-- Test get_dashboard_stats function
-- Run this in Supabase SQL Editor to see if function works

-- Test 1: Get all stats (no filters)
SELECT get_dashboard_stats(NULL, NULL, FALSE);

-- Test 2: Check if function exists and signature
SELECT 
  p.proname as function_name,
  pg_get_function_arguments(p.oid) as arguments,
  pg_get_function_result(p.oid) as return_type
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
AND p.proname = 'get_dashboard_stats';

-- Test 3: Check employees table structure
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'employees'
AND column_name IN ('is_active', 'inactive_date', 'inactive_reason', 'asn_status')
ORDER BY column_name;

-- Test 4: Count employees by is_active
SELECT 
  is_active,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE asn_status = 'PNS') as pns,
  COUNT(*) FILTER (WHERE asn_status = 'CPNS') as cpns,
  COUNT(*) FILTER (WHERE asn_status = 'PPPK') as pppk,
  COUNT(*) FILTER (WHERE asn_status = 'Non ASN') as non_asn
FROM employees
GROUP BY is_active
ORDER BY is_active DESC NULLS LAST;
