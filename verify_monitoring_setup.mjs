#!/usr/bin/env node

/**
 * Verify Monitoring Setup
 * Check if view and function are created successfully
 */

import https from 'https';

const SUPABASE_URL = 'https://mauyygrbdopmpdpnwzra.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1hdXl5Z3JiZG9wbXBkcG53enJhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDkzMTM4NCwiZXhwIjoyMDkwNTA3Mzg0fQ.qMJoz6Xuy4PKwS-LKWpjf_WM5o0fuNtEE4hsgLjJX4Q';

async function querySupabase(path, method = 'GET') {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'mauyygrbdopmpdpnwzra.supabase.co',
      path: path,
      method: method,
      headers: {
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(JSON.parse(data || '[]'));
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

async function verify() {
  console.log('🔍 Verifying Monitoring Setup');
  console.log('==============================\n');
  
  try {
    // Test 1: Query the view
    console.log('1️⃣ Testing view: unit_activity_summary');
    const viewData = await querySupabase('/rest/v1/unit_activity_summary?limit=5');
    console.log(`   ✅ View accessible! Found ${viewData.length} records`);
    
    if (viewData.length > 0) {
      console.log('\n   Sample data:');
      viewData.forEach((row, i) => {
        console.log(`   ${i + 1}. ${row.department} - ${row.total_changes} changes`);
      });
    }
    
    // Test 2: Count total records
    console.log('\n2️⃣ Counting total records...');
    const allData = await querySupabase('/rest/v1/unit_activity_summary?select=department,month,total_changes');
    console.log(`   ✅ Total records: ${allData.length}`);
    
    const uniqueDepts = [...new Set(allData.map(r => r.department))];
    console.log(`   ✅ Unique departments: ${uniqueDepts.length}`);
    
    const uniqueMonths = [...new Set(allData.map(r => r.month))];
    console.log(`   ✅ Unique months: ${uniqueMonths.length}`);
    
    // Test 3: Current month data
    console.log('\n3️⃣ Checking current month data...');
    const currentMonth = new Date().toISOString().slice(0, 7) + '-01';
    const currentData = allData.filter(r => r.month.startsWith(currentMonth.slice(0, 7)));
    console.log(`   ✅ Records for current month: ${currentData.length}`);
    
    const activeUnits = currentData.filter(r => r.total_changes > 0).length;
    const inactiveUnits = currentData.filter(r => r.total_changes === 0).length;
    console.log(`   📊 Active units: ${activeUnits}`);
    console.log(`   📊 Inactive units: ${inactiveUnits}`);
    
    console.log('\n✨ Verification completed successfully!\n');
    console.log('📝 Next steps:');
    console.log('   1. Refresh your browser (Ctrl+F5)');
    console.log('   2. Login as admin_pusat or admin_pimpinan');
    console.log('   3. Click "Monitoring Unit" in sidebar');
    console.log('   4. You should see all units with their activity data\n');
    
  } catch (error) {
    console.error('\n❌ Verification failed:', error.message);
    console.error('\n💡 This might mean:');
    console.error('   1. Migration not applied yet');
    console.error('   2. View not accessible via REST API');
    console.error('   3. RLS policies blocking access\n');
    process.exit(1);
  }
}

verify();
