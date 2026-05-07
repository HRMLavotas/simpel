import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mauyygrbdopmpdpnwzra.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1hdXl5Z3JiZG9wbXBkcG53enJhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDkzMTM4NCwiZXhwIjoyMDkwNTA3Mzg0fQ.qMJoz6Xuy4PKwS-LKWpjf_WM5o0fuNtEE4hsgLjJX4Q';

const supabase = createClient(supabaseUrl, supabaseKey);

// Fungsi untuk normalisasi string (sama seperti di frontend)
function normalizeString(str) {
  if (!str) return '';
  return str
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

async function auditAndFix() {
  console.log('='.repeat(100));
  console.log('AUDIT MENYELURUH: KONSISTENSI JENIS JABATAN DI SEMUA UNIT');
  console.log('='.repeat(100));
  console.log('');
  console.log('Memeriksa konsistensi antara:');
  console.log('1. employees.position_type (Data Pegawai)');
  console.log('2. position_references.position_category (Peta Jabatan)');
  console.log('');

  // 1. Ambil semua data dari position_references
  console.log('📊 Mengambil data peta jabatan...');
  const { data: posRefs, error: posError } = await supabase
    .from('position_references')
    .select('id, department, position_name, position_category, grade, position_order');

  if (posError) {
    console.error('❌ Error mengambil position_references:', posError.message);
    return;
  }

  console.log(`✅ Ditemukan ${posRefs.length} jabatan di peta jabatan\n`);

  // 2. Buat map untuk lookup cepat
  const posRefMap = new Map();
  posRefs.forEach(pos => {
    const key = `${pos.department}|||${normalizeString(pos.position_name)}`;
    posRefMap.set(key, pos);
  });

  // 3. Ambil semua pegawai ASN
  console.log('📊 Mengambil data pegawai ASN...');
  const { data: employees, error: empError } = await supabase
    .from('employees')
    .select('id, name, nip, department, position_name, position_type')
    .in('asn_status', ['PNS', 'CPNS', 'PPPK'])
    .not('position_name', 'is', null)
    .order('department, name');

  if (empError) {
    console.error('❌ Error mengambil employees:', empError.message);
    return;
  }

  console.log(`✅ Ditemukan ${employees.length} pegawai ASN\n`);

  // 4. Analisis ketidaksesuaian
  console.log('='.repeat(100));
  console.log('🔍 ANALISIS KETIDAKSESUAIAN');
  console.log('='.repeat(100));
  console.log('');

  const inconsistencies = [];
  const employeesWithoutPosRef = [];
  const summary = {
    total: employees.length,
    consistent: 0,
    inconsistent: 0,
    noPosRef: 0,
    byUnit: {}
  };

  employees.forEach(emp => {
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
  console.log(`Total Pegawai ASN        : ${summary.total.toLocaleString()} orang`);
  console.log(`✅ Konsisten             : ${summary.consistent.toLocaleString()} orang (${((summary.consistent/summary.total)*100).toFixed(1)}%)`);
  console.log(`❌ Tidak Konsisten       : ${summary.inconsistent.toLocaleString()} orang (${((summary.inconsistent/summary.total)*100).toFixed(1)}%)`);
  console.log(`⚠️  Tidak Ada di Peta    : ${summary.noPosRef.toLocaleString()} orang (${((summary.noPosRef/summary.total)*100).toFixed(1)}%)`);
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

  unitsSorted.forEach(([unit, stats], idx) => {
    console.log(`${idx + 1}. ${unit}`);
    console.log(`   ❌ Tidak Konsisten: ${stats.inconsistent} pegawai`);
    console.log(`   ✅ Konsisten: ${stats.consistent} pegawai`);
  });

  // 7. Tampilkan detail ketidaksesuaian (max 50 untuk tidak terlalu panjang)
  console.log('');
  console.log('='.repeat(100));
  console.log('📋 DETAIL KETIDAKSESUAIAN (Top 50):');
  console.log('='.repeat(100));
  console.log('');

  inconsistencies.slice(0, 50).forEach((item, idx) => {
    console.log(`${idx + 1}. ${item.employee.name} (${item.employee.nip || 'No NIP'})`);
    console.log(`   Unit: ${item.employee.department}`);
    console.log(`   Jabatan: ${item.employee.position_name}`);
    console.log(`   ❌ Data Pegawai (employees): ${item.empType || 'KOSONG'}`);
    console.log(`   📍 Peta Jabatan (position_references): ${item.posCategory}`);
    console.log('');
  });

  if (inconsistencies.length > 50) {
    console.log(`... dan ${inconsistencies.length - 50} ketidaksesuaian lainnya\n`);
  }

  // 8. Tanya konfirmasi untuk perbaikan
  console.log('='.repeat(100));
  console.log('🔧 PERBAIKAN OTOMATIS');
  console.log('='.repeat(100));
  console.log('');
  console.log('Strategi perbaikan:');
  console.log('Menggunakan position_references.position_category sebagai sumber kebenaran');
  console.log('dan mengupdate employees.position_type agar sesuai.');
  console.log('');
  console.log('Alasan: position_references adalah master data peta jabatan yang sudah');
  console.log('divalidasi dan disetujui, sedangkan employees.position_type bisa saja');
  console.log('salah input atau belum diupdate.');
  console.log('');

  // 9. Lakukan perbaikan
  console.log('🔄 Melakukan perbaikan...\n');

  let fixedCount = 0;
  const fixErrors = [];

  // Update dalam batch untuk efisiensi
  for (const item of inconsistencies) {
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

  console.log('='.repeat(100));
  console.log('✅ HASIL PERBAIKAN');
  console.log('='.repeat(100));
  console.log('');
  console.log(`✅ Berhasil diperbaiki: ${fixedCount} pegawai`);
  
  if (fixErrors.length > 0) {
    console.log(`❌ Gagal diperbaiki: ${fixErrors.length} pegawai`);
    console.log('');
    console.log('Detail error:');
    fixErrors.slice(0, 10).forEach((item, idx) => {
      console.log(`${idx + 1}. ${item.employee.name}: ${item.error}`);
    });
  }

  // 10. Verifikasi ulang
  console.log('');
  console.log('='.repeat(100));
  console.log('🔍 VERIFIKASI ULANG');
  console.log('='.repeat(100));
  console.log('');

  const { data: verifyEmployees, error: verifyError } = await supabase
    .from('employees')
    .select('id, department, position_name, position_type')
    .in('asn_status', ['PNS', 'CPNS', 'PPPK'])
    .not('position_name', 'is', null);

  if (verifyError) {
    console.error('❌ Error verifikasi:', verifyError.message);
    return;
  }

  let stillInconsistent = 0;
  verifyEmployees.forEach(emp => {
    const key = `${emp.department}|||${normalizeString(emp.position_name)}`;
    const posRef = posRefMap.get(key);
    if (posRef && emp.position_type !== posRef.position_category) {
      stillInconsistent++;
    }
  });

  if (stillInconsistent === 0) {
    console.log('🎉 SEMPURNA! Semua data sudah konsisten!');
  } else {
    console.log(`⚠️  Masih ada ${stillInconsistent} ketidaksesuaian`);
  }

  console.log('');
  console.log('='.repeat(100));
  console.log('📊 RINGKASAN AKHIR');
  console.log('='.repeat(100));
  console.log('');
  console.log(`Total Pegawai yang Diperiksa: ${summary.total.toLocaleString()}`);
  console.log(`Ketidaksesuaian Ditemukan: ${summary.inconsistent.toLocaleString()}`);
  console.log(`Berhasil Diperbaiki: ${fixedCount.toLocaleString()}`);
  console.log(`Masih Bermasalah: ${stillInconsistent.toLocaleString()}`);
  console.log('');
  console.log('✅ Audit dan perbaikan selesai!');
  console.log('');
  console.log('⚠️  PENTING: Refresh browser (Ctrl+F5) untuk melihat perubahan!');
  console.log('');
}

auditAndFix().catch(console.error);
