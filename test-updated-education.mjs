/**
 * Script untuk test data pendidikan yang baru diupdate
 */

import fs from 'fs';

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
    return {};
  }
}

const env = loadEnv();
const SUPABASE_URL = env.VITE_SUPABASE_URL?.replace(/"/g, '') || 'https://mauyygrbdopmpdpnwzra.supabase.co';
const SUPABASE_SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY?.replace(/"/g, '');

async function testUpdatedEducation() {
  try {
    console.log('🔍 Testing recently updated education data...\n');
    
    // Test beberapa NIP yang baru kita update
    const testNIPs = [
      '198804292018012002',
      '198501222018011001',
      '198708172018011001',
      '199307092018011003',
      '199306302018012001'
    ];
    
    for (const nip of testNIPs) {
      // Get employee
      const empUrl = `${SUPABASE_URL}/rest/v1/employees?select=id,name,nip&nip=eq.${nip}&limit=1`;
      const empResponse = await fetch(empUrl, {
        headers: {
          'apikey': SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
        }
      });
      
      const empData = await empResponse.json();
      
      if (!empData || empData.length === 0) {
        console.log(`⚠️  NIP ${nip}: Employee not found`);
        continue;
      }
      
      const employee = empData[0];
      
      // Get education via RPC
      const rpcUrl = `${SUPABASE_URL}/rest/v1/rpc/get_latest_education_per_employee`;
      const rpcResponse = await fetch(rpcUrl, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
      });
      
      const allEdu = await rpcResponse.json();
      const eduRecord = allEdu.find(e => e.employee_id === employee.id);
      
      if (eduRecord) {
        const combined = eduRecord.major ? `${eduRecord.level} ${eduRecord.major}` : eduRecord.level;
        console.log(`✅ ${employee.name} (${nip})`);
        console.log(`   Pendidikan: ${combined}`);
        console.log(`   Institusi: ${eduRecord.institution_name || '-'}`);
      } else {
        console.log(`⚠️  ${employee.name} (${nip}): No education data`);
      }
      console.log();
    }
    
    // Get statistics
    console.log('─'.repeat(60));
    console.log('📊 Overall Statistics:\n');
    
    const rpcUrl = `${SUPABASE_URL}/rest/v1/rpc/get_latest_education_per_employee`;
    const rpcResponse = await fetch(rpcUrl, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({})
    });
    
    const allEdu = await rpcResponse.json();
    const withMajor = allEdu.filter(e => e.major && e.major.trim() !== '');
    const withoutMajor = allEdu.filter(e => !e.major || e.major.trim() === '');
    
    console.log(`Total education records: ${allEdu.length}`);
    console.log(`✅ With major/jurusan: ${withMajor.length} (${(withMajor.length / allEdu.length * 100).toFixed(1)}%)`);
    console.log(`⚠️  Without major: ${withoutMajor.length} (${(withoutMajor.length / allEdu.length * 100).toFixed(1)}%)`);
    
    console.log('\n✨ Data pendidikan siap untuk export peta jabatan!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testUpdatedEducation();
