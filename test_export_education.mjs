#!/usr/bin/env node

/**
 * Test script untuk memverifikasi data pendidikan yang di-fetch
 * untuk export peta jabatan
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

console.log('🧪 Testing Export Education Data Flow...\n');

// Simulate export flow
console.log('Step 1: Fetch education data dengan pagination (seperti di handleExportAllDepartments)');
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
    console.error('   ❌ Error:', eduError.message);
    throw eduError;
  }
  
  if (!eduBatch || eduBatch.length === 0) {
    console.log('   ✅ No more data');
    break;
  }
  
  console.log(`   ✅ Fetched ${eduBatch.length} records`);
  allEdu.push(...eduBatch);
  
  if (eduBatch.length < eduBatchSize) break;
  eduOffset += eduBatchSize;
}

console.log(`\n📊 Total education records fetched: ${allEdu.length}\n`);

// Step 2: Build eduMap (seperti di kode)
console.log('Step 2: Build eduMap dengan format "Level Major"');
console.log('═══════════════════════════════════════════════════════════\n');

const eduMap = new Map();
allEdu.forEach(e => {
  if (!eduMap.has(e.employee_id)) {
    // Format: "Level Major" atau hanya "Level" jika major kosong
    const eduText = e.major ? `${e.level} ${e.major}` : e.level;
    eduMap.set(e.employee_id, eduText);
  }
});

console.log(`📊 eduMap size: ${eduMap.size}\n`);

// Step 3: Show sample
console.log('Step 3: Sample data dari eduMap (10 records pertama)');
console.log('═══════════════════════════════════════════════════════════\n');

const samples = Array.from(eduMap.entries()).slice(0, 10);
console.table(samples.map(([employee_id, eduText]) => ({
  employee_id: employee_id.substring(0, 8) + '...',
  education: eduText
})));

// Step 4: Statistics
console.log('\nStep 4: Statistik');
console.log('═══════════════════════════════════════════════════════════\n');

const withMajor = Array.from(eduMap.values()).filter(v => v.includes(' ')).length;
const withoutMajor = eduMap.size - withMajor;

console.log(`📊 Dari ${eduMap.size} pegawai:`);
console.log(`   - Dengan jurusan (ada spasi): ${withMajor} (${Math.round(withMajor/eduMap.size*100)}%)`);
console.log(`   - Tanpa jurusan (hanya level): ${withoutMajor} (${Math.round(withoutMajor/eduMap.size*100)}%)`);

// Step 5: Show examples
console.log('\n\nStep 5: Contoh format output');
console.log('═══════════════════════════════════════════════════════════\n');

const withMajorExamples = Array.from(eduMap.values()).filter(v => v.includes(' ')).slice(0, 5);
const withoutMajorExamples = Array.from(eduMap.values()).filter(v => !v.includes(' ')).slice(0, 5);

console.log('✅ Dengan jurusan (format: "Level Major"):');
withMajorExamples.forEach(e => console.log(`   - "${e}"`));

console.log('\n⚠️  Tanpa jurusan (format: "Level" saja):');
withoutMajorExamples.forEach(e => console.log(`   - "${e}"`));

console.log('\n\n✅ Test selesai!');
console.log('\n💡 Jika hasil di atas menunjukkan format "Level Major" (contoh: "S1 Informatika"),');
console.log('   maka kode sudah benar. Coba hard refresh browser (Ctrl+Shift+R) atau clear cache.');
