#!/usr/bin/env node

/**
 * Debug script untuk melihat EXACT data yang di-fetch saat export
 * Simulasi persis seperti handleExportAllDepartments
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

// Read .env file manually
const envContent = readFileSync('.env', 'utf-8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) return;
  
  const match = trimmed.match(/^([^=]+)=(.*)$/);
  if (match) {
    const key = match[1].trim();
    let value = match[2].trim();
    if ((value.startsWith('"') && value.endsWith('"')) || 
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    envVars[key] = value;
  }
});

const supabaseUrl = envVars.VITE_SUPABASE_URL;
const supabaseKey = envVars.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY harus diset di .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔍 DEBUG: Simulasi Export Flow (EXACT seperti handleExportAllDepartments)\n');

// EXACT COPY dari handleExportAllDepartments
console.log('Step 1: Fetch education data dengan pagination');
console.log('═══════════════════════════════════════════════════════════\n');

const allEdu = [];
let eduOffset = 0;
const eduBatchSize = 1000;

while (true) {
  console.log(`   Fetching batch: offset ${eduOffset}...`);
  
  const { data: eduBatch, error: eduError } = await supabase
    .rpc('get_latest_education_per_employee')
    .range(eduOffset, eduOffset + eduBatchSize - 1);
  
  if (eduError) {
    console.error('   ❌ Error:', eduError);
    throw eduError;
  }
  
  if (!eduBatch || eduBatch.length === 0) {
    console.log('   ✅ No more data');
    break;
  }
  
  console.log(`   ✅ Fetched ${eduBatch.length} records`);
  
  // DEBUG: Print first record structure
  if (eduOffset === 0 && eduBatch.length > 0) {
    console.log('\n   📋 First record structure:');
    console.log('   ', JSON.stringify(eduBatch[0], null, 2));
    console.log('\n   📋 Keys in first record:', Object.keys(eduBatch[0]));
    console.log('   📋 Has "major" field?', 'major' in eduBatch[0]);
    console.log('   📋 Has "level" field?', 'level' in eduBatch[0]);
    console.log('');
  }
  
  allEdu.push(...eduBatch);
  
  if (eduBatch.length < eduBatchSize) break;
  eduOffset += eduBatchSize;
}

console.log(`\n📊 Total education records fetched: ${allEdu.length}\n`);

// EXACT COPY: Build eduMap
console.log('Step 2: Build eduMap (EXACT seperti di kode)');
console.log('═══════════════════════════════════════════════════════════\n');

const eduMap = new Map();
allEdu.forEach(e => {
  if (!eduMap.has(e.employee_id)) {
    // EXACT COPY dari kode
    const eduText = e.major ? `${e.level} ${e.major}` : e.level;
    eduMap.set(e.employee_id, eduText);
  }
});

console.log(`📊 eduMap size: ${eduMap.size}\n`);

// Sample 20 records
console.log('Step 3: Sample 20 records dari eduMap');
console.log('═══════════════════════════════════════════════════════════\n');

const samples = Array.from(eduMap.entries()).slice(0, 20);
console.table(samples.map(([employee_id, eduText]) => ({
  employee_id: employee_id.substring(0, 13) + '...',
  education: eduText,
  has_space: eduText.includes(' ') ? '✅ YES' : '❌ NO',
  length: eduText.length
})));

// Statistics
console.log('\nStep 4: Statistik Detail');
console.log('═══════════════════════════════════════════════════════════\n');

const withMajor = Array.from(eduMap.values()).filter(v => v.includes(' ')).length;
const withoutMajor = eduMap.size - withMajor;

console.log(`📊 Total pegawai: ${eduMap.size}`);
console.log(`   ✅ Dengan jurusan (ada spasi): ${withMajor} (${Math.round(withMajor/eduMap.size*100)}%)`);
console.log(`   ❌ Tanpa jurusan (hanya level): ${withoutMajor} (${Math.round(withoutMajor/eduMap.size*100)}%)`);

// Show examples
console.log('\n\nStep 5: Contoh Data');
console.log('═══════════════════════════════════════════════════════════\n');

const withMajorExamples = Array.from(eduMap.values()).filter(v => v.includes(' ')).slice(0, 10);
const withoutMajorExamples = Array.from(eduMap.values()).filter(v => !v.includes(' ')).slice(0, 10);

console.log('✅ DENGAN JURUSAN (10 contoh):');
withMajorExamples.forEach((e, i) => console.log(`   ${i+1}. "${e}"`));

console.log('\n❌ TANPA JURUSAN (10 contoh):');
withoutMajorExamples.forEach((e, i) => console.log(`   ${i+1}. "${e}"`));

// Check specific employees from screenshot
console.log('\n\nStep 6: Cek Pegawai Spesifik dari Screenshot');
console.log('═══════════════════════════════════════════════════════════\n');

const specificNames = [
  'Reni Rosyida Muthmainah',
  'Dimas Radhitya Pramudya Wardana',
  'Tonggo Oradoa Hutauruk',
  'Mohamad Septiawan',
  'Rizal Effendi'
];

console.log('Mencari pegawai dari screenshot...\n');

// Fetch employees with these names
const { data: employees, error: empError } = await supabase
  .from('employees')
  .select('id, name, nip')
  .or(specificNames.map(name => `name.ilike.%${name}%`).join(','))
  .limit(10);

if (empError) {
  console.error('Error fetching employees:', empError);
} else if (employees && employees.length > 0) {
  console.log(`Found ${employees.length} employees:\n`);
  
  employees.forEach(emp => {
    const eduText = eduMap.get(emp.id) || 'NOT FOUND IN EDUMAP';
    console.log(`👤 ${emp.name}`);
    console.log(`   NIP: ${emp.nip || 'N/A'}`);
    console.log(`   ID: ${emp.id}`);
    console.log(`   Pendidikan: "${eduText}"`);
    console.log(`   Has Major: ${eduText.includes(' ') ? '✅ YES' : '❌ NO'}`);
    console.log('');
  });
} else {
  console.log('❌ Tidak ada pegawai yang ditemukan dengan nama tersebut');
}

console.log('\n✅ Debug selesai!\n');
console.log('💡 KESIMPULAN:');
console.log('   - Jika "Has Major" = YES tapi di Excel tidak muncul → Ada bug di export logic');
console.log('   - Jika "Has Major" = NO → Data memang tidak ada major di database');
console.log('   - Jika "NOT FOUND IN EDUMAP" → Pegawai tidak punya data pendidikan\n');
