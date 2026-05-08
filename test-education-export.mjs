/**
 * Script untuk test apakah data pendidikan (dengan major/jurusan) 
 * sudah bisa diambil dengan benar dari RPC function
 */

import fs from 'fs';

// Baca .env file manual
function loadEnv() {
  try {
    const envContent = fs.readFileSync('.env', 'utf-8');
    const env = {};
    envContent.split('\n').forEach(line => {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        env[key.trim()] = valueParts.join('=').trim();
      }
    });
    return env;
  } catch (error) {
    console.error('❌ Error membaca file .env:', error.message);
    return {};
  }
}

const env = loadEnv();
const SUPABASE_URL = env.VITE_SUPABASE_URL?.replace(/"/g, '') || 'https://mauyygrbdopmpdpnwzra.supabase.co';
const SUPABASE_SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY?.replace(/"/g, '');

console.log('🔑 Supabase URL:', SUPABASE_URL);
console.log('🔑 Service Key:', SUPABASE_SERVICE_KEY?.substring(0, 20) + '...');
console.log();

async function testEducationData() {
  try {
    console.log('📊 Testing RPC function: get_latest_education_per_employee()');
    console.log('─'.repeat(60));
    
    // Call RPC function
    const url = `${SUPABASE_URL}/rest/v1/rpc/get_latest_education_per_employee?limit=10`;
    const response = await fetch(url, {
      headers: {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(`RPC call failed: ${JSON.stringify(error)}`);
    }
    
    const data = await response.json();
    
    console.log(`✅ Total records returned: ${data.length}`);
    console.log();
    
    // Analyze data
    const withMajor = data.filter(d => d.major && d.major.trim() !== '');
    const withoutMajor = data.filter(d => !d.major || d.major.trim() === '');
    
    console.log('📈 Statistics:');
    console.log(`   - Records with major (jurusan): ${withMajor.length}`);
    console.log(`   - Records without major: ${withoutMajor.length}`);
    console.log();
    
    // Show sample data
    console.log('📋 Sample data (first 5 records):');
    console.log('─'.repeat(60));
    
    data.slice(0, 5).forEach((record, idx) => {
      const eduText = record.major ? `${record.level} ${record.major}` : record.level;
      console.log(`${idx + 1}. Employee ID: ${record.employee_id}`);
      console.log(`   Level: ${record.level}`);
      console.log(`   Major: ${record.major || '(kosong)'}`);
      console.log(`   Combined: "${eduText}"`);
      console.log();
    });
    
    // Test dengan employee yang baru kita update
    console.log('🔍 Testing specific employee (NIP: 198804292018012002):');
    console.log('─'.repeat(60));
    
    // Get employee ID
    const empUrl = `${SUPABASE_URL}/rest/v1/employees?select=id,name,nip&nip=eq.198804292018012002&limit=1`;
    const empResponse = await fetch(empUrl, {
      headers: {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
      }
    });
    
    const empData = await empResponse.json();
    
    if (empData && empData.length > 0) {
      const employee = empData[0];
      console.log(`✅ Employee found: ${employee.name} (${employee.nip})`);
      
      // Get education data
      const eduRecord = data.find(d => d.employee_id === employee.id);
      
      if (eduRecord) {
        console.log(`✅ Education data found:`);
        console.log(`   Level: ${eduRecord.level}`);
        console.log(`   Major: ${eduRecord.major || '(kosong)'}`);
        console.log(`   Institution: ${eduRecord.institution_name || '(kosong)'}`);
        console.log(`   Combined: "${eduRecord.major ? `${eduRecord.level} ${eduRecord.major}` : eduRecord.level}"`);
      } else {
        console.log(`⚠️  Education data not found in RPC result`);
      }
    } else {
      console.log(`⚠️  Employee not found`);
    }
    
    console.log();
    console.log('═'.repeat(60));
    console.log('✅ TEST COMPLETED');
    console.log('═'.repeat(60));
    
    if (withMajor.length > 0) {
      console.log(`\n✨ SUCCESS: ${withMajor.length} records have major/jurusan data!`);
      console.log(`📊 Export peta jabatan will show education with major/jurusan.`);
    } else {
      console.log(`\n⚠️  WARNING: No records with major/jurusan found.`);
      console.log(`   This might be normal if data hasn't been imported yet.`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testEducationData();
