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

async function analyze503Employees() {
  console.log('='.repeat(100));
  console.log('ANALISIS DETAIL: 503 PEGAWAI YANG TIDAK ADA DI PETA JABATAN');
  console.log('='.repeat(100));
  console.log('');

  // 1. Ambil semua position_references
  console.log('📊 Mengambil data peta jabatan...');
  const { data: posRefs } = await supabase
    .from('position_references')
    .select('*');

  const posRefMap = new Map();
  posRefs.forEach(pos => {
    const key = `${pos.department}|||${normalizeString(pos.position_name)}`;
    posRefMap.set(key, pos);
  });

  console.log(`✅ Ditemukan ${posRefs.length} jabatan di peta jabatan\n`);

  // 2. Ambil semua pegawai ASN
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
      .range(from, to)
      .order('department, position_name');

    if (data && data.length > 0) {
      allEmployees.push(...data);
      page++;
      hasMore = data.length === pageSize;
    } else {
      hasMore = false;
    }
  }

  console.log(`✅ Ditemukan ${allEmployees.length} pegawai ASN\n`);

  // 3. Identifikasi pegawai tanpa peta jabatan
  const employeesWithoutPosRef = [];
  
  allEmployees.forEach(emp => {
    const key = `${emp.department}|||${normalizeString(emp.position_name)}`;
    const posRef = posRefMap.get(key);

    if (!posRef) {
      employeesWithoutPosRef.push(emp);
    }
  });

  console.log('='.repeat(100));
  console.log('📊 RINGKASAN');
  console.log('='.repeat(100));
  console.log('');
  console.log(`Total Pegawai ASN: ${allEmployees.length}`);
  console.log(`Pegawai DENGAN Peta Jabatan: ${allEmployees.length - employeesWithoutPosRef.length}`);
  console.log(`Pegawai TANPA Peta Jabatan: ${employeesWithoutPosRef.length}`);
  console.log('');

  // 4. Analisis per unit
  console.log('='.repeat(100));
  console.log('📋 ANALISIS PER UNIT');
  console.log('='.repeat(100));
  console.log('');

  const byUnit = {};
  employeesWithoutPosRef.forEach(emp => {
    if (!byUnit[emp.department]) {
      byUnit[emp.department] = [];
    }
    byUnit[emp.department].push(emp);
  });

  const unitsSorted = Object.entries(byUnit)
    .sort((a, b) => b[1].length - a[1].length);

  console.log(`Ditemukan ${unitsSorted.length} unit dengan pegawai tanpa peta jabatan:\n`);

  unitsSorted.forEach(([unit, employees], idx) => {
    console.log(`${idx + 1}. ${unit}: ${employees.length} pegawai`);
  });

  // 5. Analisis per jabatan
  console.log('');
  console.log('='.repeat(100));
  console.log('📋 ANALISIS PER JABATAN (Top 50)');
  console.log('='.repeat(100));
  console.log('');

  const byPosition = {};
  employeesWithoutPosRef.forEach(emp => {
    const posName = emp.position_name || 'Tidak Ada Nama Jabatan';
    if (!byPosition[posName]) {
      byPosition[posName] = {
        count: 0,
        units: new Set(),
        examples: []
      };
    }
    byPosition[posName].count++;
    byPosition[posName].units.add(emp.department);
    if (byPosition[posName].examples.length < 3) {
      byPosition[posName].examples.push(emp.name);
    }
  });

  const positionsSorted = Object.entries(byPosition)
    .sort((a, b) => b[1].count - a[1].count);

  console.log(`Ditemukan ${positionsSorted.length} jabatan unik yang tidak ada di peta:\n`);

  positionsSorted.slice(0, 50).forEach(([position, data], idx) => {
    console.log(`${idx + 1}. ${position}`);
    console.log(`   Jumlah Pegawai: ${data.count} orang`);
    console.log(`   Unit: ${data.units.size} unit (${Array.from(data.units).slice(0, 3).join(', ')}${data.units.size > 3 ? ', ...' : ''})`);
    console.log(`   Contoh: ${data.examples.join(', ')}`);
    console.log('');
  });

  if (positionsSorted.length > 50) {
    console.log(`... dan ${positionsSorted.length - 50} jabatan lainnya\n`);
  }

  // 6. Kategorisasi masalah
  console.log('='.repeat(100));
  console.log('🔍 KATEGORISASI MASALAH');
  console.log('='.repeat(100));
  console.log('');

  const categories = {
    'Jabatan PLT/Plt': [],
    'Jabatan dengan Typo/Variasi': [],
    'Jabatan Khusus/Unik': [],
    'Jabatan Baru': [],
    'Lainnya': []
  };

  employeesWithoutPosRef.forEach(emp => {
    const posName = (emp.position_name || '').toLowerCase();
    
    if (posName.includes('plt') || posName.includes('plh') || posName.includes('pj')) {
      categories['Jabatan PLT/Plt'].push(emp);
    } else if (posName.includes('(') || posName.includes(')') || posName.includes('-')) {
      categories['Jabatan dengan Typo/Variasi'].push(emp);
    } else {
      // Cek apakah ada jabatan serupa di peta
      let foundSimilar = false;
      for (const [key, posRef] of posRefMap.entries()) {
        const refName = normalizeString(posRef.position_name);
        const empName = normalizeString(emp.position_name);
        
        // Cek similarity sederhana
        if (refName.includes(empName.substring(0, 10)) || empName.includes(refName.substring(0, 10))) {
          categories['Jabatan dengan Typo/Variasi'].push(emp);
          foundSimilar = true;
          break;
        }
      }
      
      if (!foundSimilar) {
        categories['Jabatan Khusus/Unik'].push(emp);
      }
    }
  });

  console.log('Kategori masalah:\n');
  
  Object.entries(categories).forEach(([category, employees]) => {
    if (employees.length > 0) {
      console.log(`${category}: ${employees.length} pegawai`);
      
      // Tampilkan contoh
      const examples = employees.slice(0, 5);
      examples.forEach(emp => {
        console.log(`  - ${emp.name} (${emp.department}): ${emp.position_name}`);
      });
      
      if (employees.length > 5) {
        console.log(`  ... dan ${employees.length - 5} pegawai lainnya`);
      }
      console.log('');
    }
  });

  // 7. Rekomendasi
  console.log('='.repeat(100));
  console.log('💡 REKOMENDASI');
  console.log('='.repeat(100));
  console.log('');

  console.log('1. JABATAN PLT/PLH/PJ:');
  console.log('   - Ini NORMAL karena jabatan sementara tidak perlu ada di peta jabatan');
  console.log('   - Sistem sudah menangani PLT dengan baik');
  console.log('   - Tidak perlu action');
  console.log('');

  console.log('2. JABATAN DENGAN TYPO/VARIASI:');
  console.log('   - Perlu standardisasi nama jabatan');
  console.log('   - Update nama jabatan di employees agar sesuai dengan position_references');
  console.log('   - Atau tambahkan variasi nama ke position_references');
  console.log('');

  console.log('3. JABATAN KHUSUS/UNIK:');
  console.log('   - Review apakah jabatan ini memang khusus');
  console.log('   - Jika jabatan valid, tambahkan ke position_references');
  console.log('   - Jika jabatan salah, perbaiki nama jabatan di employees');
  console.log('');

  console.log('4. PRIORITAS PERBAIKAN:');
  console.log('   - Fokus pada jabatan dengan jumlah pegawai terbanyak');
  console.log('   - Mulai dari unit dengan pegawai terbanyak tanpa peta jabatan');
  console.log('');

  // 8. Export data untuk review
  console.log('='.repeat(100));
  console.log('📄 EXPORT DATA');
  console.log('='.repeat(100));
  console.log('');

  const exportData = {
    summary: {
      total_employees: allEmployees.length,
      with_posref: allEmployees.length - employeesWithoutPosRef.length,
      without_posref: employeesWithoutPosRef.length,
      percentage: ((employeesWithoutPosRef.length / allEmployees.length) * 100).toFixed(1) + '%'
    },
    by_unit: unitsSorted.map(([unit, employees]) => ({
      unit,
      count: employees.length,
      employees: employees.map(e => ({
        name: e.name,
        nip: e.nip,
        position_name: e.position_name,
        position_type: e.position_type
      }))
    })),
    by_position: positionsSorted.map(([position, data]) => ({
      position,
      count: data.count,
      units: Array.from(data.units),
      examples: data.examples
    })),
    categories: Object.entries(categories).map(([category, employees]) => ({
      category,
      count: employees.length,
      examples: employees.slice(0, 10).map(e => ({
        name: e.name,
        department: e.department,
        position_name: e.position_name
      }))
    }))
  };

  const fs = await import('fs');
  fs.writeFileSync(
    'analisis_503_pegawai_tanpa_peta_jabatan.json',
    JSON.stringify(exportData, null, 2)
  );

  console.log('✅ Data berhasil di-export ke: analisis_503_pegawai_tanpa_peta_jabatan.json');
  console.log('');
  console.log('File ini berisi:');
  console.log('- Ringkasan statistik');
  console.log('- Daftar per unit');
  console.log('- Daftar per jabatan');
  console.log('- Kategorisasi masalah');
  console.log('');
  console.log('Anda bisa membuka file JSON ini untuk review lebih detail.');
  console.log('');
}

analyze503Employees().catch(console.error);
