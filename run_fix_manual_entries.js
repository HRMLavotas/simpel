#!/usr/bin/env node

/**
 * Script untuk memperbaiki manual entries langsung ke database
 * Usage: node run_fix_manual_entries.js
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://qxnpjqzhiafnnkyaawhw.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF4bnBqcXpoaWFmbm5reWFhd2h3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU3MTU5NzcsImV4cCI6MjA1MTI5MTk3N30.VYl_VqJXDqLqzqQqQqQqQqQqQqQqQqQqQqQqQqQ';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkManualEntries() {
  console.log('🔍 Checking manual entries...\n');
  
  const { data, error } = await supabase
    .from('employee_cases')
    .select('id, case_number, employee_id, employee_name, employee_nip, case_type, status')
    .like('employee_id', 'MANUAL_%');
  
  if (error) {
    console.error('❌ Error:', error);
    return null;
  }
  
  console.log(`📊 Found ${data.length} manual entries\n`);
  
  if (data.length > 0) {
    console.log('Sample manual entries:');
    data.slice(0, 5).forEach(c => {
      console.log(`  - ${c.case_number}: ${c.employee_name} (NIP: ${c.employee_nip})`);
    });
    console.log('');
  }
  
  return data;
}

async function fixManualEntry(caseData) {
  const { id, case_number, employee_name, employee_nip } = caseData;
  
  console.log(`🔧 Fixing ${case_number}...`);
  
  // Try match by NIP first
  if (employee_nip && employee_nip !== '-') {
    // Split multiple NIPs
    const nips = employee_nip.split(/[,;\/\s]+/).map(n => n.trim()).filter(n => n.length > 0);
    
    for (const nip of nips) {
      const { data: employee } = await supabase
        .from('employees')
        .select('id, name, nip')
        .eq('nip', nip)
        .maybeSingle();
      
      if (employee) {
        console.log(`  ✅ Matched by NIP: ${employee.name}`);
        return { employee, matchType: 'nip' };
      }
    }
  }
  
  // Try match by name
  if (employee_name) {
    const names = employee_name.split(/[\/]/).map(n => n.trim());
    
    for (const name of names) {
      const { data: employee } = await supabase
        .from('employees')
        .select('id, name, nip')
        .ilike('name', name)
        .maybeSingle();
      
      if (employee) {
        console.log(`  ✅ Matched by name: ${employee.name}`);
        return { employee, matchType: 'name' };
      }
    }
  }
  
  console.log(`  ❌ No match found`);
  return null;
}

async function updateCase(caseId, employee) {
  const { error } = await supabase
    .from('employee_cases')
    .update({
      employee_id: employee.id,
      employee_name: employee.name,
      employee_nip: employee.nip,
    })
    .eq('id', caseId);
  
  if (error) {
    console.error(`  ❌ Update failed:`, error.message);
    return false;
  }
  
  console.log(`  💾 Updated successfully`);
  return true;
}

async function main() {
  console.log('🚀 Starting manual entry fix process...\n');
  
  // Check manual entries
  const manualEntries = await checkManualEntries();
  
  if (!manualEntries || manualEntries.length === 0) {
    console.log('✅ No manual entries to fix!');
    return;
  }
  
  console.log(`📋 Processing ${manualEntries.length} manual entries...\n`);
  
  let fixed = 0;
  let failed = 0;
  
  for (const caseData of manualEntries) {
    const match = await fixManualEntry(caseData);
    
    if (match) {
      const success = await updateCase(caseData.id, match.employee);
      if (success) {
        fixed++;
      } else {
        failed++;
      }
    } else {
      failed++;
    }
    
    console.log('');
  }
  
  console.log('📊 Summary:');
  console.log(`  ✅ Fixed: ${fixed}`);
  console.log(`  ❌ Failed: ${failed}`);
  console.log(`  📈 Success rate: ${((fixed / manualEntries.length) * 100).toFixed(1)}%`);
}

main().catch(console.error);
