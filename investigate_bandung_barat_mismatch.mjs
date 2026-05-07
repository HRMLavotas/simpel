import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mauyygrbdopmpdpnwzra.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1hdXl5Z3JiZG9wbXBkcG53enJhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDkzMTM4NCwiZXhwIjoyMDkwNTA3Mzg0fQ.qMJoz6Xuy4PKwS-LKWpjf_WM5o0fuNtEE4hsgLjJX4Q';

const supabase = createClient(supabaseUrl, supabaseKey);

function normalizeString(str) {
  if (!str) return '';
  return str
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

async function investigate() {
  console.log('='.repeat(100));
  console.log('INVESTIGASI: BANDUNG BARAT - PENATA LAYANAN OPERASIONAL');
  console.log('='.repeat(100));
  console.log('');

  // 1. Cek di position_references
  console.log('1️⃣  CEK DI PETA JABATAN (position_references):');
  console.log('-'.repeat(100));
  console.log('');

  const { data: posRefs, error: posError } = await supabase
    .from('position_references')
    .select('*')
    .eq('department', 'BPVP Bandung Barat')
    .ilike('position_name', '%penata layanan operasional%');

  if (posError) {
    console.error('❌ Error:', posError.message);
    return;
  }

  if (posRefs && posRefs.length > 0) {
    console.log(`✅ Ditemukan ${posRefs.length} jabatan di peta:\n`);
    posRefs.forEach((pos, idx) => {
      console.log(`${idx + 1}. ID: ${pos.id}`);
      console.log(`   Department: "${pos.department}"`);
      console.log(`   Position Name: "${pos.position_name}"`);
      console.log(`   Position Category: ${pos.position_category}`);
      console.log(`   Grade: ${pos.grade}`);
      console.log(`   Normalized: "${normalizeString(pos.position_name)}"`);
      console.log('');
    });
  } else {
    console.log('❌ TIDAK DITEMUKAN di peta jabatan!');
    console.log('');
  }

  // 2. Cek pegawai dengan jabatan tersebut
  console.log('2️⃣  CEK PEGAWAI DI BANDUNG BARAT:');
  console.log('-'.repeat(100));
  console.log('');

  const { data: employees, error: empError } = await supabase
    .from('employees')
    .select('*')
    .eq('department', 'BPVP Bandung Barat')
    .ilike('position_name', '%penata layanan operasional%')
    .in('asn_status', ['PNS', 'CPNS', 'PPPK']);

  if (empError) {
    console.error('❌ Error:', empError.message);
    return;
  }

  if (employees && employees.length > 0) {
    console.log(`✅ Ditemukan ${employees.length} pegawai:\n`);
    employees.forEach((emp, idx) => {
      console.log(`${idx + 1}. ${emp.name} (${emp.nip || 'No NIP'})`);
      console.log(`   Department: "${emp.department}"`);
      console.log(`   Position Name: "${emp.position_name}"`);
      console.log(`   Position Type: ${emp.position_type}`);
      console.log(`   Normalized: "${normalizeString(emp.position_name)}"`);
      console.log('');
    });
  } else {
    console.log('❌ TIDAK DITEMUKAN pegawai!');
    console.log('');
  }

  // 3. Bandingkan string
  console.log('3️⃣  PERBANDINGAN STRING:');
  console.log('-'.repeat(100));
  console.log('');

  if (posRefs && posRefs.length > 0 && employees && employees.length > 0) {
    const posRefName = posRefs[0].position_name;
    const empName = employees[0].position_name;
    
    console.log('String Asli:');
    console.log(`  Peta Jabatan : "${posRefName}"`);
    console.log(`  Data Pegawai : "${empName}"`);
    console.log('');

    console.log('String Normalized:');
    console.log(`  Peta Jabatan : "${normalizeString(posRefName)}"`);
    console.log(`  Data Pegawai : "${normalizeString(empName)}"`);
    console.log('');

    console.log('Perbandingan Karakter:');
    const posNorm = normalizeString(posRefName);
    const empNorm = normalizeString(empName);
    
    console.log(`  Panjang Peta : ${posNorm.length} karakter`);
    console.log(`  Panjang Pegawai : ${empNorm.length} karakter`);
    console.log(`  Sama? ${posNorm === empNorm ? '✅ YA' : '❌ TIDAK'}`);
    console.log('');

    if (posNorm !== empNorm) {
      console.log('Perbedaan Karakter:');
      const maxLen = Math.max(posNorm.length, empNorm.length);
      for (let i = 0; i < maxLen; i++) {
        const posChar = posNorm[i] || '(kosong)';
        const empChar = empNorm[i] || '(kosong)';
        if (posChar !== empChar) {
          console.log(`  Posisi ${i}: Peta="${posChar}" (${posChar.charCodeAt(0)}) vs Pegawai="${empChar}" (${empChar.charCodeAt(0)})`);
        }
      }
      console.log('');
    }

    // 4. Cek dengan kunci yang digunakan sistem
    console.log('4️⃣  CEK KUNCI PENCARIAN SISTEM:');
    console.log('-'.repeat(100));
    console.log('');

    const posKey = `${posRefs[0].department}|||${normalizeString(posRefs[0].position_name)}`;
    const empKey = `${employees[0].department}|||${normalizeString(employees[0].position_name)}`;

    console.log('Kunci Peta Jabatan:');
    console.log(`  "${posKey}"`);
    console.log('');
    console.log('Kunci Data Pegawai:');
    console.log(`  "${empKey}"`);
    console.log('');
    console.log(`Cocok? ${posKey === empKey ? '✅ YA' : '❌ TIDAK'}`);
    console.log('');

    if (posKey !== empKey) {
      console.log('🔍 PENYEBAB KETIDAKCOCOKAN:');
      console.log('');
      
      // Cek department
      if (posRefs[0].department !== employees[0].department) {
        console.log('❌ DEPARTMENT BERBEDA:');
        console.log(`   Peta: "${posRefs[0].department}"`);
        console.log(`   Pegawai: "${employees[0].department}"`);
        console.log('');
      }

      // Cek position_name
      if (normalizeString(posRefs[0].position_name) !== normalizeString(employees[0].position_name)) {
        console.log('❌ POSITION NAME BERBEDA (setelah normalisasi):');
        console.log(`   Peta: "${normalizeString(posRefs[0].position_name)}"`);
        console.log(`   Pegawai: "${normalizeString(employees[0].position_name)}"`);
        console.log('');
      }
    }
  }

  // 5. Cek semua jabatan di Bandung Barat
  console.log('5️⃣  SEMUA JABATAN DI PETA JABATAN BANDUNG BARAT:');
  console.log('-'.repeat(100));
  console.log('');

  const { data: allPosRefs } = await supabase
    .from('position_references')
    .select('position_name, position_category')
    .eq('department', 'BPVP Bandung Barat')
    .order('position_name');

  if (allPosRefs && allPosRefs.length > 0) {
    console.log(`Total ${allPosRefs.length} jabatan:\n`);
    allPosRefs.forEach((pos, idx) => {
      console.log(`${idx + 1}. ${pos.position_name} (${pos.position_category})`);
    });
  }

  console.log('');
  console.log('='.repeat(100));
}

investigate().catch(console.error);
