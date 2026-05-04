#!/usr/bin/env node

/**
 * Script untuk memperbaiki pegawai dengan position_type kosong/null
 * Akan menampilkan pegawai yang perlu diperbaiki
 * 
 * Jalankan: node fix_position_type_null.mjs
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

// Read .env file manually
const envContent = readFileSync('.env', 'utf-8');
const envVars = {};
envContent.split('\n').forEach(line => {
  // Skip comments and empty lines
  if (line.trim().startsWith('#') || !line.trim()) return;
  
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    const key = match[1].trim();
    let value = match[2].trim();
    // Remove quotes if present
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
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

async function checkInvalidPositionTypes() {
  console.log('🔍 Memeriksa pegawai dengan position_type tidak valid...\n');

  // Query pegawai dengan position_type kosong atau tidak valid
  const { data: employees, error } = await supabase
    .from('employees')
    .select('id, nip, name, position_type, position_name, department, asn_status')
    .or('position_type.is.null,position_type.eq.')
    .order('department', { ascending: true })
    .order('name', { ascending: true });

  if (error) {
    console.error('❌ Error fetching employees:', error);
    return;
  }

  if (!employees || employees.length === 0) {
    console.log('✅ Tidak ada pegawai dengan position_type kosong/null');
    return;
  }

  console.log(`⚠️  Ditemukan ${employees.length} pegawai dengan position_type kosong/null:\n`);
  
  // Group by department
  const byDept = employees.reduce((acc, emp) => {
    const dept = emp.department || 'Tidak Ada Unit';
    if (!acc[dept]) acc[dept] = [];
    acc[dept].push(emp);
    return acc;
  }, {});

  Object.entries(byDept).forEach(([dept, emps]) => {
    console.log(`\n📍 ${dept} (${emps.length} pegawai):`);
    emps.forEach((emp, idx) => {
      console.log(`   ${idx + 1}. ${emp.name || 'Tanpa Nama'}`);
      console.log(`      - NIP: ${emp.nip || '-'}`);
      console.log(`      - Status ASN: ${emp.asn_status || '-'}`);
      console.log(`      - Jabatan: ${emp.position_name || '-'}`);
      console.log(`      - Position Type: ${emp.position_type || '(kosong)'}`);
    });
  });

  console.log('\n\n📋 REKOMENDASI:');
  console.log('1. Periksa data pegawai di atas');
  console.log('2. Edit setiap pegawai dan pilih Jenis Jabatan yang sesuai:');
  console.log('   - Struktural: untuk jabatan pimpinan/manajerial');
  console.log('   - Fungsional: untuk jabatan teknis/profesional (Instruktur, Analis, dll)');
  console.log('   - Pelaksana: untuk jabatan pelaksana/staf');
  console.log('3. Setelah semua pegawai memiliki Jenis Jabatan yang valid,');
  console.log('   kategori "LAINNYA" tidak akan muncul lagi di menu Data Pegawai');
}

checkInvalidPositionTypes();
