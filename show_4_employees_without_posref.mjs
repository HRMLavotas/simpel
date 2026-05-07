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

async function show4Employees() {
  console.log('='.repeat(100));
  console.log('4 PEGAWAI YANG TIDAK ADA DI PETA JABATAN');
  console.log('='.repeat(100));
  console.log('');

  // 1. Ambil SEMUA position_references dengan pagination
  console.log('📊 Mengambil SEMUA data peta jabatan...');
  
  const allPosRefs = [];
  let page = 0;
  const pageSize = 1000;
  let hasMore = true;

  while (hasMore) {
    const from = page * pageSize;
    const to = from + pageSize - 1;

    const { data } = await supabase
      .from('position_references')
      .select('*')
      .range(from, to);

    if (data && data.length > 0) {
      allPosRefs.push(...data);
      page++;
      hasMore = data.length === pageSize;
    } else {
      hasMore = false;
    }
  }

  console.log(`✅ ${allPosRefs.length} jabatan\n`);

  // Buat Map
  const posRefMap = new Map();
  allPosRefs.forEach(pos => {
    const key = `${pos.department}|||${normalizeString(pos.position_name)}`;
    posRefMap.set(key, pos);
  });

  // 2. Ambil SEMUA pegawai ASN
  console.log('📊 Mengambil SEMUA pegawai ASN...');
  
  const allEmployees = [];
  page = 0;
  hasMore = true;

  while (hasMore) {
    const from = page * pageSize;
    const to = from + pageSize - 1;

    const { data } = await supabase
      .from('employees')
      .select('*')
      .in('asn_status', ['PNS', 'CPNS', 'PPPK'])
      .not('position_name', 'is', null)
      .range(from, to);

    if (data && data.length > 0) {
      allEmployees.push(...data);
      page++;
      hasMore = data.length === pageSize;
    } else {
      hasMore = false;
    }
  }

  console.log(`✅ ${allEmployees.length} pegawai\n`);

  // 3. Cari yang tidak ada di peta
  const employeesWithoutPosRef = [];
  
  allEmployees.forEach(emp => {
    const key = `${emp.department}|||${normalizeString(emp.position_name)}`;
    const posRef = posRefMap.get(key);

    if (!posRef) {
      employeesWithoutPosRef.push(emp);
    }
  });

  console.log('='.repeat(100));
  console.log('📋 DETAIL 4 PEGAWAI YANG TIDAK ADA DI PETA JABATAN');
  console.log('='.repeat(100));
  console.log('');

  if (employeesWithoutPosRef.length === 0) {
    console.log('🎉 SEMPURNA! Semua pegawai sudah ada di peta jabatan!');
    console.log('');
    return;
  }

  console.log(`Ditemukan ${employeesWithoutPosRef.length} pegawai:\n`);

  employeesWithoutPosRef.forEach((emp, idx) => {
    console.log('='.repeat(100));
    console.log(`${idx + 1}. ${emp.name}`);
    console.log('='.repeat(100));
    console.log('');
    console.log('📋 DATA PEGAWAI:');
    console.log(`   NIP                : ${emp.nip || 'Tidak ada'}`);
    console.log(`   Unit Kerja         : ${emp.department}`);
    console.log(`   Jabatan            : ${emp.position_name}`);
    console.log(`   Jenis Jabatan      : ${emp.position_type || 'Tidak ada'}`);
    console.log(`   Status ASN         : ${emp.asn_status}`);
    console.log(`   Golongan           : ${emp.rank_group || 'Tidak ada'}`);
    console.log(`   Pangkat            : ${emp.rank || 'Tidak ada'}`);
    console.log('');
    
    console.log('🔍 ANALISIS:');
    const key = `${emp.department}|||${normalizeString(emp.position_name)}`;
    console.log(`   Kunci Pencarian    : "${key}"`);
    console.log(`   Status             : ❌ TIDAK DITEMUKAN di peta jabatan`);
    console.log('');

    // Cek apakah ada jabatan serupa di unit yang sama
    const similarInSameUnit = allPosRefs.filter(pos => 
      pos.department === emp.department &&
      normalizeString(pos.position_name).includes(normalizeString(emp.position_name).substring(0, 10))
    );

    if (similarInSameUnit.length > 0) {
      console.log('⚠️  JABATAN SERUPA DI UNIT YANG SAMA:');
      similarInSameUnit.forEach(pos => {
        console.log(`   - ${pos.position_name} (${pos.position_category})`);
      });
      console.log('');
      console.log('💡 KEMUNGKINAN: Nama jabatan tidak persis sama (typo/variasi)');
    } else {
      console.log('💡 KEMUNGKINAN: Jabatan ini memang belum terdaftar di peta jabatan unit ini');
    }
    console.log('');

    // Cek apakah jabatan ini ada di unit lain
    const samePositionOtherUnit = allPosRefs.filter(pos => 
      normalizeString(pos.position_name) === normalizeString(emp.position_name)
    );

    if (samePositionOtherUnit.length > 0) {
      console.log('✅ JABATAN INI ADA DI UNIT LAIN:');
      samePositionOtherUnit.slice(0, 5).forEach(pos => {
        console.log(`   - ${pos.department} (${pos.position_category})`);
      });
      if (samePositionOtherUnit.length > 5) {
        console.log(`   ... dan ${samePositionOtherUnit.length - 5} unit lainnya`);
      }
      console.log('');
      console.log('💡 REKOMENDASI: Tambahkan jabatan ini ke peta jabatan unit ini');
      console.log(`   Kategori yang disarankan: ${samePositionOtherUnit[0].position_category}`);
      console.log(`   Grade yang disarankan: ${samePositionOtherUnit[0].grade || 'N/A'}`);
    } else {
      console.log('⚠️  JABATAN INI TIDAK ADA DI UNIT MANAPUN');
      console.log('');
      console.log('💡 REKOMENDASI: Review apakah nama jabatan benar atau perlu dikoreksi');
    }
    console.log('');
  });

  // Ringkasan
  console.log('='.repeat(100));
  console.log('📊 RINGKASAN');
  console.log('='.repeat(100));
  console.log('');
  console.log(`Total Pegawai ASN: ${allEmployees.length}`);
  console.log(`Pegawai dengan Peta Jabatan: ${allEmployees.length - employeesWithoutPosRef.length} (${((allEmployees.length - employeesWithoutPosRef.length) / allEmployees.length * 100).toFixed(2)}%)`);
  console.log(`Pegawai tanpa Peta Jabatan: ${employeesWithoutPosRef.length} (${(employeesWithoutPosRef.length / allEmployees.length * 100).toFixed(2)}%)`);
  console.log('');

  // Rekomendasi action
  console.log('='.repeat(100));
  console.log('💡 REKOMENDASI ACTION');
  console.log('='.repeat(100));
  console.log('');

  employeesWithoutPosRef.forEach((emp, idx) => {
    const samePositionOtherUnit = allPosRefs.filter(pos => 
      normalizeString(pos.position_name) === normalizeString(emp.position_name)
    );

    if (samePositionOtherUnit.length > 0) {
      const template = samePositionOtherUnit[0];
      console.log(`${idx + 1}. ${emp.name} (${emp.department})`);
      console.log(`   Jabatan: ${emp.position_name}`);
      console.log(`   Action: Tambahkan ke peta jabatan`);
      console.log('');
      console.log('   SQL:');
      console.log(`   INSERT INTO position_references (department, position_name, position_category, grade)`);
      console.log(`   VALUES ('${emp.department}', '${emp.position_name}', '${template.position_category}', ${template.grade || 'NULL'});`);
      console.log('');
    } else {
      console.log(`${idx + 1}. ${emp.name} (${emp.department})`);
      console.log(`   Jabatan: ${emp.position_name}`);
      console.log(`   Action: Review nama jabatan - mungkin ada typo atau perlu koreksi`);
      console.log('');
    }
  });

  console.log('='.repeat(100));
}

show4Employees().catch(console.error);
