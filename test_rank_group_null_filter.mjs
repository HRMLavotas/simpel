#!/usr/bin/env node

/**
 * Script untuk test filter rank_group dengan nilai "(Tidak Ada)"
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mauyygrbdopmpdpnwzra.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1hdXl5Z3JiZG9wbXBkcG53enJhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDkzMTM4NCwiZXhwIjoyMDkwNTA3Mzg0fQ.qMJoz6Xuy4PKwS-LKWpjf_WM5o0fuNtEE4hsgLjJX4Q';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testFilter() {
  console.log('🧪 Testing rank_group filter with "(Tidak Ada)"\n');
  
  // Test 1: Count Non ASN employees
  console.log('Test 1: Count employees with rank_group = NULL (Non ASN)');
  const { data: nullData, error: nullError, count: nullCount } = await supabase
    .from('employees')
    .select('name, asn_status, rank_group', { count: 'exact' })
    .is('rank_group', null)
    .limit(10);
  
  if (nullError) {
    console.error('Error:', nullError);
  } else {
    console.log(`  Found ${nullCount} employees with rank_group = NULL`);
    console.log('  Sample data:');
    nullData?.forEach((emp, i) => {
      console.log(`    ${i + 1}. ${emp.name} - Status: ${emp.asn_status || 'NULL'} - Rank: ${emp.rank_group || 'NULL'}`);
    });
  }
  
  console.log('\n');
  
  // Test 2: Filter with specific rank + NULL (simulating "(Tidak Ada)")
  console.log('Test 2: Filter with "Penata Muda (III/a)" OR rank_group IS NULL');
  
  const { data: combinedData, error: combinedError, count: combinedCount } = await supabase
    .from('employees')
    .select('name, asn_status, rank_group', { count: 'exact' })
    .or('rank_group.in.("Penata Muda (III/a)"),rank_group.is.null')
    .limit(20);
  
  if (combinedError) {
    console.error('Error:', combinedError);
  } else {
    console.log(`  Found ${combinedCount} employees`);
    console.log('  Sample data:');
    combinedData?.forEach((emp, i) => {
      console.log(`    ${i + 1}. ${emp.name} - Status: ${emp.asn_status || 'NULL'} - Rank: ${emp.rank_group || 'NULL'}`);
    });
  }
  
  console.log('\n');
  
  // Test 3: Check if query syntax is correct
  console.log('Test 3: Testing query syntax variations');
  
  // Variation 1: Using .or() with .in() and .is()
  try {
    const { count: count1 } = await supabase
      .from('employees')
      .select('*', { count: 'exact', head: true })
      .or('rank_group.in.("Penata Muda (III/a)"),rank_group.is.null');
    console.log(`  ✅ Variation 1 (or with in and is): ${count1} results`);
  } catch (e) {
    console.log(`  ❌ Variation 1 failed: ${e.message}`);
  }
  
  // Variation 2: Using separate filters
  try {
    let q = supabase
      .from('employees')
      .select('*', { count: 'exact', head: true });
    
    // This is what the code should do
    const vals = ['Penata Muda (III/a)'];
    q = q.or(`rank_group.in.(${vals.map(v => `"${v}"`).join(',')}),rank_group.is.null`);
    
    const { count: count2 } = await q;
    console.log(`  ✅ Variation 2 (template string): ${count2} results`);
  } catch (e) {
    console.log(`  ❌ Variation 2 failed: ${e.message}`);
  }
  
  console.log('\n');
  
  // Test 4: Check actual Non ASN data
  console.log('Test 4: Check Non ASN employees');
  const { data: nonAsnData, count: nonAsnCount } = await supabase
    .from('employees')
    .select('name, asn_status, rank_group', { count: 'exact' })
    .eq('asn_status', 'Non ASN')
    .limit(10);
  
  console.log(`  Found ${nonAsnCount} employees with asn_status = 'Non ASN'`);
  console.log('  Sample data:');
  nonAsnData?.forEach((emp, i) => {
    console.log(`    ${i + 1}. ${emp.name} - Status: ${emp.asn_status} - Rank: ${emp.rank_group || 'NULL'}`);
  });
  
  console.log('\n');
  console.log('Summary:');
  console.log(`  - Employees with rank_group = NULL: ${nullCount}`);
  console.log(`  - Employees with asn_status = 'Non ASN': ${nonAsnCount}`);
  console.log(`  - Combined filter (rank + NULL): ${combinedCount}`);
}

testFilter();
