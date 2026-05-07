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

async function auditFinal() {
  console.log('='.repeat(100));
  console.log('AUDIT FINAL: DENGAN PAGINATION YANG BENAR');
  console.log('='.repeat(100));
  console.log('');

  // 1. Ambil SEMUA position_references dengan pagination
  console.log('📊 Mengambil SEMUA data peta jabatan dengan pagination...');
  
  const allPosRefs = [];
  let page = 0;
  const pageSize = 1000;
  let hasMore = true;

  while (hasMore) {
    const from = page * pageSize;
    const to = from + pageSize - 1;

    console.log(`   Mengambil jabatan ${from + 1} - ${to + 1}...`);

    const { data, error } = await supabase
      .from('position_references')
      .select('*')
      .range(from, to);

    if (error) {
      console.error(`   ❌ Error: ${error.message}`);
      break;
    }

    if (data && data.length > 0) {
      allPosRefs.push(...data);
      page++;
      hasMore = data.length === pageSize;
    } else {
      hasMore = false;
    }
  }

  console.log(`\n✅ Berhasil mengambil ${allPosRefs.length} jabatan di peta jabatan\n`);

  // Buat Map
  const posRefMap = new Map();
  allPosRefs.forEach(pos => {
    const key = `${pos.department}|||${normalizeString(pos.position_name)}`;
    posRefMap.set(key, pos);
  });

  // 2. Ambil SEMUA pegawai ASN dengan pagination
  console.log('📊 Mengambil SEMUA pegawai ASN dengan pagination...');
  
  const allEmployees = [];
  page = 0;
  hasMore = true;

  while (hasMore) {
    const from = page * pageSize;
    const to = from + pageSize - 1;

    console.log(`   Mengambil pegawai ${from + 1} - ${to + 1}...`);

    const { data, error } = await supabase
      .from('employees')
      .select('id, name, nip, department, position_name, position_type, asn_status')
      .in('asn_status', ['PNS', 'CPNS', 'PPPK'])
      .not('position_name', 'is', null)
      .range(from, to);

    if (error) {
      console.error(`   ❌ Error: ${error.message}`);
      break;
    }

    if (data && data.length > 0) {
      allEmployees.push(...data);
      page++;
      hasMore = data.length === pageSize;
    } else {
      hasMore = false;
    }
  }

  console.log(`\n✅ Berhasil mengambil ${allEmployees.length} pegawai ASN\n`);

  // 3. Analisis
  console.log('='.repeat(100));
  console.log('🔍 ANALISIS KETIDAKSESUAIAN');
  console.log('='.repeat(100));
  console.log('');

  const employeesWithoutPosRef = [];
  const inconsistencies = [];
  
  allEmployees.forEach(emp => {
    const key = `${emp.department}|||${normalizeString(emp.position_name)}`;
    const posRef = posRefMap.get(key);

    if (!posRef) {
      employeesWithoutPosRef.push(emp);
    } else {
      // Cek konsistensi position_type
      if (emp.position_type !== posRef.position_category) {
        inconsistencies.push({
          employee: emp,
          posRef: posRef,
          empType: emp.position_type || 'KOSONG',
          posCategory: posRef.position_category
        });
      }
    }
  });

  console.log('📊 HASIL AUDIT FINAL:');
  console.log('-'.repeat(100));
  console.log(`Total Pegawai ASN: ${allEmployees.length}`);
  console.log(`Pegawai DENGAN Peta Jabatan: ${allEmployees.length - employeesWithoutPosRef.length}`);
  console.log(`Pegawai TANPA Peta Jabatan: ${employeesWithoutPosRef.length}`);
  console.log(`Ketidaksesuaian position_type: ${inconsistencies.length}`);
  console.log('');

  // 4. Cek khusus Bandung Barat
  console.log('='.repeat(100));
  console.log('🔍 CEK KHUSUS: BANDUNG BARAT - PENATA LAYANAN OPERASIONAL');
  console.log('='.repeat(100));
  console.log('');

  const bandungBaratPenata = allEmployees.filter(emp => 
    emp.department === 'BPVP Bandung Barat' && 
    normalizeString(emp.position_name) === 'penata layanan operasional'
  );

  console.log(`Ditemukan ${bandungBaratPenata.length} pegawai:\n`);

  bandungBaratPenata.forEach((emp, idx) => {
    const key = `${emp.department}|||${normalizeString(emp.position_name)}`;
    const posRef = posRefMap.get(key);
    
    console.log(`${idx + 1}. ${emp.name}`);
    console.log(`   Ada di Peta? ${posRef ? '✅ YA' : '❌ TIDAK'}`);
    if (posRef) {
      console.log(`   Kategori Peta: ${posRef.position_category}`);
      console.log(`   Kategori Pegawai: ${emp.position_type}`);
      console.log(`   Konsisten? ${emp.position_type === posRef.position_category ? '✅ YA' : '❌ TIDAK'}`);
    }
    console.log('');
  });

  // 5. Perbaiki ketidaksesuaian jika ada
  if (inconsistencies.length > 0) {
    console.log('='.repeat(100));
    console.log('🔧 PERBAIKAN KETIDAKSESUAIAN');
    console.log('='.repeat(100));
    console.log('');
    console.log(`Ditemukan ${inconsistencies.length} ketidaksesuaian. Memperbaiki...\n`);

    let fixedCount = 0;
    for (const item of inconsistencies) {
      const { error } = await supabase
        .from('employees')
        .update({ position_type: item.posCategory })
        .eq('id', item.employee.id);

      if (!error) {
        fixedCount++;
      }
    }

    console.log(`✅ Berhasil memperbaiki ${fixedCount} pegawai\n`);
  }

  // 6. Ringkasan
  console.log('='.repeat(100));
  console.log('📊 RINGKASAN FINAL');
  console.log('='.repeat(100));
  console.log('');
  console.log(`Total Jabatan di Peta: ${allPosRefs.length}`);
  console.log(`Total Pegawai ASN: ${allEmployees.length}`);
  console.log(`Pegawai dengan Peta Jabatan: ${allEmployees.length - employeesWithoutPosRef.length} (${((allEmployees.length - employeesWithoutPosRef.length) / allEmployees.length * 100).toFixed(1)}%)`);
  console.log(`Pegawai tanpa Peta Jabatan: ${employeesWithoutPosRef.length} (${(employeesWithoutPosRef.length / allEmployees.length * 100).toFixed(1)}%)`);
  console.log(`Ketidaksesuaian Diperbaiki: ${inconsistencies.length}`);
  console.log('');
  console.log('✅ Audit selesai dengan data LENGKAP!');
  console.log('');
}

auditFinal().catch(console.error);
