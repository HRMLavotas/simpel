#!/usr/bin/env node

/**
 * Test get_unit_monthly_details function
 */

import https from 'https';

const SUPABASE_URL = 'https://mauyygrbdopmpdpnwzra.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1hdXl5Z3JiZG9wbXBkcG53enJhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDkzMTM4NCwiZXhwIjoyMDkwNTA3Mzg0fQ.qMJoz6Xuy4PKwS-LKWpjf_WM5o0fuNtEE4hsgLjJX4Q';

async function testFunction(department, month) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      p_department: department,
      p_month: month
    });
    
    const options = {
      hostname: 'mauyygrbdopmpdpnwzra.supabase.co',
      path: '/rest/v1/rpc/get_unit_monthly_details',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        console.log(`Status: ${res.statusCode}`);
        console.log(`Response: ${data}\n`);
        
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(JSON.parse(data || '[]'));
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function test() {
  console.log('🧪 Testing get_unit_monthly_details function\n');
  
  try {
    // Test with a known department and current month
    const department = 'BBPVP Bandung';
    const month = '2026-04-01';
    
    console.log(`Testing with:`);
    console.log(`  Department: ${department}`);
    console.log(`  Month: ${month}\n`);
    
    const result = await testFunction(department, month);
    
    console.log(`✅ Function works! Found ${result.length} records\n`);
    
    if (result.length > 0) {
      console.log('Sample records:');
      result.slice(0, 3).forEach((record, i) => {
        console.log(`\n${i + 1}. ${record.change_type}`);
        console.log(`   Employee: ${record.employee_name} (${record.employee_nip})`);
        console.log(`   Date: ${record.change_date}`);
        console.log(`   Details:`, JSON.stringify(record.details, null, 2));
      });
    } else {
      console.log('⚠️  No records found for this department/month');
      console.log('This might be normal if there are no changes in this period.');
    }
    
  } catch (error) {
    console.error('❌ Function test failed:', error.message);
    console.error('\nPossible issues:');
    console.error('  1. Function not created');
    console.error('  2. Function has syntax error');
    console.error('  3. RLS blocking access');
    console.error('  4. Wrong parameters\n');
  }
}

test();
