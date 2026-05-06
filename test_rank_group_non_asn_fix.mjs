#!/usr/bin/env node

/**
 * Script untuk test filter rank_group dengan "(Tidak Ada)" yang sudah diperbaiki
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mauyygrbdopmpdpnwzra.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1hdXl5Z3JiZG9wbXBkcG53enJhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDkzMTM4NCwiZXhwIjoyMDkwNTA3Mzg0fQ.qMJoz6Xuy4PKwS-LKWpjf_WM5o0fuNtEE4hsgLjJX4Q';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testFixedFilter() {
  console.log('🧪 Testing FIXED rank_group filter with "(Tidak Ada)"\n');
  
  // Test 1: Filter with only "(Tidak Ada)" - should include NULL + "Tenaga Alih Daya" + "Tidak Ada"
  console.log('Test 1: Filter with only "(Tidak Ada)"');
  console.log('  Query: rank_group IN ("Tenaga Alih Daya", "Tidak Ada") OR rank_group IS NULL\n');
  
  const { data: tidakAdaData, count: tidakAdaCount } = await supabase
    .from('employees')
    .select('name, asn_status, rank_group', { count: 'exact' })
    .or('rank_group.in.("Tenaga Alih Daya","Tidak Ada"),rank_group.is.null')
    .limit(15);
  
  console.log(`  Found ${tidakAdaCount} employees`);
  console.log('  Sample data:');
  tidakAdaData?.forEach((emp, i) => {
    console.log(`    ${i + 1}. ${emp.name} - Status: ${emp.asn_status || 'NULL'} - Rank: ${emp.rank_group || 'NULL'}`);
  });
  
  console.log('\n');
  
  // Test 2: Filter with "Penata Muda (III/a)" + "(Tidak Ada)"
  console.log('Test 2: Filter with "Penata Muda (III/a)" + "(Tidak Ada)"');
  console.log('  Query: rank_group IN ("Penata Muda (III/a)", "Tenaga Alih Daya", "Tidak Ada") OR rank_group IS NULL\n');
  
  const { data: combinedData, count: combinedCount } = await supabase
    .from('employees')
    .select('name, asn_status, rank_group', { count: 'exact' })
    .or('rank_group.in.("Penata Muda (III/a)","Tenaga Alih Daya","Tidak Ada"),rank_group.is.null')
    .limit(20);
  
  console.log(`  Found ${combinedCount} employees`);
  console.log('  Sample data (showing mix of ranks):');
  combinedData?.forEach((emp, i) => {
    console.log(`    ${i + 1}. ${emp.name} - Status: ${emp.asn_status || 'NULL'} - Rank: ${emp.rank_group || 'NULL'}`);
  });
  
  console.log('\n');
  
  // Test 3: Count by rank_group for Non ASN
  console.log('Test 3: Distribution of rank_group for Non ASN employees');
  
  const { data: nonAsnRanks } = await supabase
    .from('employees')
    .select('rank_group')
    .eq('asn_status', 'Non ASN');
  
  const rankCounts = {};
  nonAsnRanks?.forEach(emp => {
    const rank = emp.rank_group || 'NULL';
    rankCounts[rank] = (rankCounts[rank] || 0) + 1;
  });
  
  console.log('  Distribution:');
  Object.entries(rankCounts)
    .sort((a, b) => b[1] - a[1])
    .forEach(([rank, count]) => {
      console.log(`    ${rank}: ${count} employees`);
    });
  
  console.log('\n');
  console.log('Summary:');
  console.log(`  - Filter "(Tidak Ada)" only: ${tidakAdaCount} employees`);
  console.log(`  - Filter "Penata Muda (III/a)" + "(Tidak Ada)": ${combinedCount} employees`);
  console.log(`  - This should now include Non ASN employees! ✅`);
}

testFixedFilter();
