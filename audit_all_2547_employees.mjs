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

async function auditAllEmployees() {
  console.log('='.repeat(100));
  console.log('AUDIT MENYELURUH: SEMUA 2547 PEGAWAI ASN');
  console.log('='.repeat(100));
  console.log('');

  // 1. Hitung total pegawai ASN
  console.log('📊 Menghitung total pegawai ASN...');
  const { count: totalCount, error: countError } = await supabase
    .from('employees')
    .select('*', { count: 'exact', head: true })
    .in('asn_status', ['PNS', 'CPNS', 'PPPK']);

  if (countError) {
    console.error('❌ Error:', countError.message);
    return;
  }

  console.log(`✅ Total Pegawai ASN: ${totalCount} orang\n`);

  // 2. Ambil semua position_references
  console.log('📊 Mengambil data peta jabatan...');
  const { data: posRefs, error: posError } = await supabase
    .from('position_references')
    .select('*');

  if (posError) {
    console.error('❌ Error:', posError.message);
    return;
  }

  console.log(`✅ Ditemukan ${posRefs.length} jabatan di peta jabatan\n`);

  // Buat map untuk lookup cepat
  const posRefMap = new Map();
  posRefs.forEach(pos => {
    const key = `${pos.department}|||${normalizeString(pos.position_name)}`;
    posRefMap.set(key, pos);
  });

  // 3. Ambil SEMUA pegawai ASN dengan pagination
  console.log('📊 Mengambil SEMUA data pegawai ASN...');
  console.log('   (Menggunakan pagination untuk menghindari timeout)\n');

  const allEmployees = [];
  const pageSize = 1000;
  let page = 0;
  let hasMore = true;

  while (hasMore) {
    const from = page * pageSize;
    const to = from + pageSize - 1;

    console.log(`   Mengambil pegawai ${from + 1} - ${Math.min(to + 1, totalCount)}...`);

    const { data, error } = await supabase
      .from('employees')
      .select('id, name, nip, department, position_name, position_type, asn_status')
      .in('asn_status', ['PNS', 'CPNS', 'PPPK'])
      .range(from, to)
      .order('department, name');

    if (error) {
      console.error(`   ❌ Error pada page ${page}:`, error.message);
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

  // 4. Analisis ketidaksesuaian
  console.log('='.repeat(100));
  console.log('🔍 ANALISIS KETIDAKSESUAIAN');
  console.log('='.repeat(100));
  console.log('');

  const inconsistencies = [];
  const employeesWithoutPosRef = [];
  const employeesWithoutPositionName = [];
  const summary = {
    total: allEmployees.length,
    consistent: 0,
    inconsistent: 0,
    noPosRef: 0,
    noPositionName: 0,
    byUnit: {}
  };

  allEmployees.forEach(emp => {
    // Skip jika tidak ada position_name
    if (!emp.position_name || emp.position_name.trim() === '') {
      employeesWithoutPositionName.push(emp);
      summary.noPositionName++;
      return;
    }

    const key = `${emp.department}|||${normalizeString(emp.position_name)}`;
    const posRef = posRefMap.get(key);

    if (!posRef) {
      employeesWithoutPosRef.push(emp);
      summary.noPosRef++;
      return;
    }

    // Bandingkan position_type dengan position_category
    const empType = emp.position_type || '';
    const posCategory = posRef.position_category || '';

    if (empType !== posCategory) {
      inconsistencies.push({
        employee: emp,
        posRef: posRef,
        empType: empType,
        posCategory: posCategory
      });
      summary.inconsistent++;

      // Track by unit
      if (!summary.byUnit[emp.department]) {
        summary.byUnit[emp.department] = { consistent: 0, inconsistent: 0 };
      }
      summary.byUnit[emp.department].inconsistent++;
    } else {
      summary.consistent++;
      if (!summary.byUnit[emp.department]) {
        summary.byUnit[emp.department] = { consistent: 0, inconsistent: 0 };
      }
      summary.byUnit[emp.department].consistent++;
    }
  });

  // 5. Tampilkan ringkasan
  console.log('📊 RINGKASAN AUDIT:');
  console.log('-'.repeat(100));
  console.log(`Total Pegawai ASN              : ${summary.total.toLocaleString()} orang`);
  console.log(`✅ Konsisten                   : ${summary.consistent.toLocaleString()} orang (${((summary.consistent/summary.total)*100).toFixed(1)}%)`);
  console.log(`❌ Tidak Konsisten             : ${summary.inconsistent.toLocaleString()} orang (${((summary.inconsistent/summary.total)*100).toFixed(1)}%)`);
  console.log(`⚠️  Tidak Ada di Peta Jabatan  : ${summary.noPosRef.toLocaleString()} orang (${((summary.noPosRef/summary.total)*100).toFixed(1)}%)`);
  console.log(`⚠️  Tidak Ada Nama Jabatan     : ${summary.noPositionName.toLocaleString()} orang (${((summary.noPositionName/summary.total)*100).toFixed(1)}%)`);
  console.log('');

  if (inconsistencies.length === 0) {
    console.log('🎉 SEMPURNA! Semua data sudah konsisten!');
    console.log('');
    return;
  }

  // 6. Tampilkan ketidaksesuaian per unit
  console.log('='.repeat(100));
  console.log('📋 KETIDAKSESUAIAN PER UNIT:');
  console.log('='.repeat(100));
  console.log('');

  const unitsSorted = Object.entries(summary.byUnit)
    .filter(([_, stats]) => stats.inconsistent > 0)
    .sort((a, b) => b[1].inconsistent - a[1].inconsistent);

  console.log(`Ditemukan ${unitsSorted.length} unit dengan ketidaksesuaian:\n`);

  unitsSorted.forEach(([unit, stats], idx) => {
    console.log(`${idx + 1}. ${unit}`);
    console.log(`   ❌ Tidak Konsisten: ${stats.inconsistent} pegawai`);
    console.log(`   ✅ Konsisten: ${stats.consistent} pegawai`);
  });

  // 7. Tampilkan detail ketidaksesuaian (max 100)
  console.log('');
  console.log('='.repeat(100));
  console.log(`📋 DETAIL KETIDAKSESUAIAN (Top 100 dari ${inconsistencies.length}):`);
  console.log('='.repeat(100));
  console.log('');

  inconsistencies.slice(0, 100).forEach((item, idx) => {
    console.log(`${idx + 1}. ${item.employee.name} (${item.employee.nip || 'No NIP'})`);
    console.log(`   Unit: ${item.employee.department}`);
    console.log(`   Jabatan: ${item.employee.position_name}`);
    console.log(`   ❌ Data Pegawai: ${item.empType || 'KOSONG'}`);
    console.log(`   📍 Peta Jabatan: ${item.posCategory}`);
    console.log('');
  });

  if (inconsistencies.length > 100) {
    console.log(`... dan ${inconsistencies.length - 100} ketidaksesuaian lainnya\n`);
  }

  // 8. Perbaikan
  console.log('='.repeat(100));
  console.log('🔧 PERBAIKAN OTOMATIS');
  console.log('='.repeat(100));
  console.log('');
  console.log(`Akan memperbaiki ${inconsistencies.length} ketidaksesuaian...\n`);

  let fixedCount = 0;
  const fixErrors = [];
  const batchSize = 100;

  for (let i = 0; i < inconsistencies.length; i += batchSize) {
    const batch = inconsistencies.slice(i, i + batchSize);
    console.log(`Memperbaiki batch ${Math.floor(i/batchSize) + 1} (${batch.length} pegawai)...`);

    for (const item of batch) {
      const { error } = await supabase
        .from('employees')
        .update({ position_type: item.posCategory })
        .eq('id', item.employee.id);

      if (error) {
        fixErrors.push({ employee: item.employee, error: error.message });
      } else {
        fixedCount++;
      }
    }
  }

  console.log('');
  console.log('='.repeat(100));
  console.log('✅ HASIL PERBAIKAN');
  console.log('='.repeat(100));
  console.log('');
  console.log(`✅ Berhasil diperbaiki: ${fixedCount} pegawai`);
  
  if (fixErrors.length > 0) {
    console.log(`❌ Gagal diperbaiki: ${fixErrors.length} pegawai`);
    console.log('');
    console.log('Detail error (Top 10):');
    fixErrors.slice(0, 10).forEach((item, idx) => {
      console.log(`${idx + 1}. ${item.employee.name}: ${item.error}`);
    });
  }

  // 9. Verifikasi ulang
  console.log('');
  console.log('='.repeat(100));
  console.log('🔍 VERIFIKASI ULANG');
  console.log('='.repeat(100));
  console.log('');
  console.log('Mengambil data terbaru untuk verifikasi...\n');

  let stillInconsistent = 0;
  page = 0;
  hasMore = true;

  while (hasMore) {
    const from = page * pageSize;
    const to = from + pageSize - 1;

    const { data, error } = await supabase
      .from('employees')
      .select('id, department, position_name, position_type')
      .in('asn_status', ['PNS', 'CPNS', 'PPPK'])
      .not('position_name', 'is', null)
      .range(from, to);

    if (error) break;

    if (data && data.length > 0) {
      data.forEach(emp => {
        const key = `${emp.department}|||${normalizeString(emp.position_name)}`;
        const posRef = posRefMap.get(key);
        if (posRef && emp.position_type !== posRef.position_category) {
          stillInconsistent++;
        }
      });
      page++;
      hasMore = data.length === pageSize;
    } else {
      hasMore = false;
    }
  }

  if (stillInconsistent === 0) {
    console.log('🎉 SEMPURNA! Semua data sudah konsisten!');
  } else {
    console.log(`⚠️  Masih ada ${stillInconsistent} ketidaksesuaian`);
    console.log('   Akan dilakukan perbaikan manual...');
  }

  console.log('');
  console.log('='.repeat(100));
  console.log('📊 RINGKASAN AKHIR');
  console.log('='.repeat(100));
  console.log('');
  console.log(`Total Pegawai ASN: ${summary.total.toLocaleString()}`);
  console.log(`Ketidaksesuaian Ditemukan: ${summary.inconsistent.toLocaleString()}`);
  console.log(`Berhasil Diperbaiki: ${fixedCount.toLocaleString()}`);
  console.log(`Masih Bermasalah: ${stillInconsistent.toLocaleString()}`);
  console.log(`Tidak Ada di Peta: ${summary.noPosRef.toLocaleString()}`);
  console.log(`Tidak Ada Nama Jabatan: ${summary.noPositionName.toLocaleString()}`);
  console.log('');
  console.log('✅ Audit dan perbaikan selesai!');
  console.log('');
  console.log('⚠️  PENTING: Refresh browser (Ctrl+F5) untuk melihat perubahan!');
  console.log('');
}

auditAllEmployees().catch(console.error);
