import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mauyygrbdopmpdpnwzra.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1hdXl5Z3JiZG9wbXBkcG53enJhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDkzMTM4NCwiZXhwIjoyMDkwNTA3Mzg0fQ.qMJoz6Xuy4PKwS-LKWpjf_WM5o0fuNtEE4hsgLjJX4Q';

const supabase = createClient(supabaseUrl, supabaseKey);

const pegawaiNIPs = [
  '198501222018011001', // Agus Ariyanto
  '199005202015032002', // Hari Sri Purwati
  '199704082018122001', // Herna Diah Cahyati
  '198002082007122001'  // Istianah
];

async function fixPelaksana() {
  console.log('='.repeat(80));
  console.log('PERBAIKAN DATA PEGAWAI BPVP SURAKARTA');
  console.log('='.repeat(80));
  console.log('\n📋 Mengubah jenis jabatan dari "Fungsional" ke "Pelaksana"\n');
  console.log('Pegawai yang akan diperbaiki:');
  console.log('1. Agus Ariyanto (198501222018011001)');
  console.log('2. Hari Sri Purwati (199005202015032002)');
  console.log('3. Herna Diah Cahyati (199704082018122001)');
  console.log('4. Istianah (198002082007122001)');
  console.log('\n' + '='.repeat(80));

  // Cek data sebelum perubahan
  console.log('\n📊 DATA SEBELUM PERUBAHAN:');
  console.log('-'.repeat(80));

  const { data: beforeData, error: beforeError } = await supabase
    .from('employees')
    .select('name, nip, position_name, position_type, department')
    .in('nip', pegawaiNIPs)
    .order('name');

  if (beforeError) {
    console.error('❌ Error mengambil data:', beforeError.message);
    return;
  }

  if (!beforeData || beforeData.length === 0) {
    console.log('❌ Tidak ada data yang ditemukan');
    return;
  }

  beforeData.forEach((emp, idx) => {
    console.log(`\n${idx + 1}. ${emp.name}`);
    console.log(`   NIP            : ${emp.nip}`);
    console.log(`   Jabatan        : ${emp.position_name}`);
    console.log(`   Jenis Jabatan  : ${emp.position_type} ❌`);
    console.log(`   Unit           : ${emp.department}`);
  });

  // Konfirmasi
  console.log('\n' + '='.repeat(80));
  console.log('⚠️  PERHATIAN: Script akan mengubah jenis jabatan dari "Fungsional" ke "Pelaksana"');
  console.log('='.repeat(80));

  // Update data
  console.log('\n🔄 Melakukan update...\n');

  const { data: updateData, error: updateError } = await supabase
    .from('employees')
    .update({ position_type: 'Pelaksana' })
    .in('nip', pegawaiNIPs)
    .select();

  if (updateError) {
    console.error('❌ Error melakukan update:', updateError.message);
    return;
  }

  console.log(`✅ Berhasil mengupdate ${updateData.length} pegawai`);

  // Cek data setelah perubahan
  console.log('\n' + '='.repeat(80));
  console.log('📊 DATA SETELAH PERUBAHAN:');
  console.log('-'.repeat(80));

  const { data: afterData, error: afterError } = await supabase
    .from('employees')
    .select('name, nip, position_name, position_type, department')
    .in('nip', pegawaiNIPs)
    .order('name');

  if (afterError) {
    console.error('❌ Error mengambil data:', afterError.message);
    return;
  }

  afterData.forEach((emp, idx) => {
    console.log(`\n${idx + 1}. ${emp.name}`);
    console.log(`   NIP            : ${emp.nip}`);
    console.log(`   Jabatan        : ${emp.position_name}`);
    console.log(`   Jenis Jabatan  : ${emp.position_type} ✅`);
    console.log(`   Unit           : ${emp.department}`);
  });

  console.log('\n' + '='.repeat(80));
  console.log('✅ PERBAIKAN SELESAI');
  console.log('='.repeat(80));
  console.log('\nKeempat pegawai BPVP Surakarta sudah diperbaiki dari "Fungsional" ke "Pelaksana"');
  console.log('Silakan cek di aplikasi untuk memastikan perubahan sudah tersimpan.\n');
}

fixPelaksana().catch(console.error);
