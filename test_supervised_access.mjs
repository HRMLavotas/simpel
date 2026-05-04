#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mauyygrbdopmpdpnwzra.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1hdXl5Z3JiZG9wbXBkcG53enJhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDkzMTM4NCwiZXhwIjoyMDkwNTA3Mzg0fQ.qMJoz6Xuy4PKwS-LKWpjf_WM5o0fuNtEE4hsgLjJX4Q';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testAccess() {
  console.log('🧪 Testing supervised units access for BBPVP Makassar...\n');

  try {
    // Find a BBPVP Makassar admin_unit user
    console.log('1️⃣ Finding BBPVP Makassar admin_unit user...');
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id, email, full_name, department')
      .eq('department', 'BBPVP Makassar')
      .limit(1);

    if (profileError || !profiles || profiles.length === 0) {
      console.log('   ❌ No BBPVP Makassar user found');
      return;
    }

    const user = profiles[0];
    console.log(`   ✅ Found user: ${user.full_name} (${user.email})`);

    // Check their role
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    console.log(`   📋 Role: ${roleData?.role || 'none'}`);

    // Test get_accessible_departments function
    console.log('\n2️⃣ Testing get_accessible_departments function...');
    const { data: accessibleDepts, error: funcError } = await supabase
      .rpc('get_accessible_departments', { input_user_id: user.id });

    if (funcError) {
      console.log('   ❌ Error calling function:', funcError.message);
    } else {
      console.log('   ✅ Accessible departments:');
      if (accessibleDepts && Array.isArray(accessibleDepts)) {
        accessibleDepts.forEach(dept => {
          console.log(`      - ${dept}`);
        });
      } else {
        console.log('      (All departments - admin_pusat/pimpinan)');
      }
    }

    // Count employees in each supervised unit
    console.log('\n3️⃣ Counting employees in supervised units...');
    const units = [
      'BBPVP Makassar',
      'Satpel Majene',
      'Satpel Mamuju',
      'Satpel Palu',
      'Workshop Gorontalo',
      'Satpel Morowali',
      'Satpel Morowali Utara'
    ];

    let totalAccessible = 0;
    for (const unit of units) {
      const { count } = await supabase
        .from('employees')
        .select('*', { count: 'exact', head: true })
        .eq('department', unit);

      totalAccessible += count || 0;
      console.log(`   ${count > 0 ? '✅' : '⚠️ '} ${unit}: ${count || 0} employees`);
    }

    console.log(`\n   📊 Total accessible employees: ${totalAccessible}`);

    console.log('\n✅ Test completed!');
    console.log('\n💡 Next steps:');
    console.log('   1. Login as BBPVP Makassar admin_unit');
    console.log('   2. Go to Data Pegawai menu');
    console.log('   3. Select "Workshop Gorontalo" from dropdown');
    console.log('   4. You should see 2 employees');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
  }
}

testAccess();
