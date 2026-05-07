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

async function recheck() {
  console.log('='.repeat(100));
  console.log('RE-CHECK: APAKAH MASIH ADA 503 PEGAWAI TANPA PETA JABATAN?');
  console.log('='.repeat(100));
  console.log('');

  // Ambil semua position_references
  console.log('📊 Mengambil data peta jabatan...');
  const { data: posRefs } = await supabase
    .from('position_references')
    .select('*');

  const posRefMap = new Map();
  posRefs.forEach(pos => {
    const key = `${pos.department}|||${normalizeString(pos.position_name)}`;
    posRefMap.set(key, pos);
  });

  console.log(`✅ ${posRefs.length} jabatan di peta\n`);

  // Ambil semua pegawai ASN
  console.log('📊 Mengambil semua pegawai ASN...');
  const allEmployees = [];
  const pageSize = 1000;
  let page = 0;
  let hasMore = true;

  while (hasMore) {
    const from = page * pageSize;
    const to = from + pageSize - 1;

    const { data } = await supabase
      .from('employees')
      .select('id, name, nip, department, position_name, position_type, asn_status')
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

  console.log(`✅ ${allEmployees.length} pegawai ASN\n`);

  // Cek yang tidak ada di peta
  const employeesWithoutPosRef = [];
  
  allEmployees.forEach(emp => {
    const key = `${emp.department}|||${normalizeString(emp.position_name)}`;
    const posRef = posRefMap.get(key);

    if (!posRef) {
      employeesWithoutPosRef.push(emp);
    }
  });

  console.log('='.repeat(100));
  console.log('📊 HASIL RE-CHECK');
  console.log('='.repeat(100));
  console.log('');
  console.log(`Total Pegawai ASN: ${allEmployees.length}`);
  console.log(`Pegawai DENGAN Peta Jabatan: ${allEmployees.length - employeesWithoutPosRef.length}`);
  console.log(`Pegawai TANPA Peta Jabatan: ${employeesWithoutPosRef.length}`);
  console.log('');

  // Cek khusus Bandung Barat - Penata Layanan Operasional
  console.log('='.repeat(100));
  console.log('🔍 CEK KHUSUS: BANDUNG BARAT - PENATA LAYANAN OPERASIONAL');
  console.log('='.repeat(100));
  console.log('');

  const bandungBaratPenata = allEmployees.filter(emp => 
    emp.department === 'BPVP Bandung Barat' && 
    normalizeString(emp.position_name) === 'penata layanan operasional'
  );

  console.log(`Ditemukan ${bandungBaratPenata.length} pegawai dengan jabatan ini:\n`);

  bandungBaratPenata.forEach((emp, idx) => {
    const key = `${emp.department}|||${normalizeString(emp.position_name)}`;
    const posRef = posRefMap.get(key);
    
    console.log(`${idx + 1}. ${emp.name}`);
    console.log(`   Key: "${key}"`);
    console.log(`   Ada di Peta? ${posRef ? '✅ YA' : '❌ TIDAK'}`);
    if (posRef) {
      console.log(`   Peta ID: ${posRef.id}`);
      console.log(`   Kategori: ${posRef.position_category}`);
    }
    console.log('');
  });

  // Tampilkan sample pegawai tanpa peta (Top 20)
  if (employeesWithoutPosRef.length > 0) {
    console.log('='.repeat(100));
    console.log('📋 SAMPLE PEGAWAI TANPA PETA JABATAN (Top 20):');
    console.log('='.repeat(100));
    console.log('');

    employeesWithoutPosRef.slice(0, 20).forEach((emp, idx) => {
      const key = `${emp.department}|||${normalizeString(emp.position_name)}`;
      console.log(`${idx + 1}. ${emp.name} (${emp.department})`);
      console.log(`   Jabatan: ${emp.position_name}`);
      console.log(`   Key: "${key}"`);
      console.log('');
    });
  }

  console.log('='.repeat(100));
}

recheck().catch(console.error);
