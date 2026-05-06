import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://mauyygrbdopmpdpnwzra.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1hdXl5Z3JiZG9wbXBkcG53enJhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDkzMTM4NCwiZXhwIjoyMDkwNTA3Mzg0fQ.qMJoz6Xuy4PKwS-LKWpjf_WM5o0fuNtEE4hsgLjJX4Q";

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixKejuruanAnomaly() {
  console.log('🔧 Memperbaiki anomali jabatan kejuruan...\n');

  // The anomaly position
  const anomalyPositionId = '2174fcc2-eac4-4f5b-b01b-b5130deaa178';
  const anomalyPositionName = 'Instruktur Ahli Pertama Kejuruan Teknik Elektronika';
  const basePositionName = 'Instruktur Ahli Pertama';
  const department = 'BBPVP Serang';

  console.log('📍 BBPVP Serang');
  console.log('─'.repeat(80));

  // Step 1: Check employee with this position
  const { data: employee, error: empError } = await supabase
    .from('employees')
    .select('id, name, nip, position_name, kejuruan')
    .eq('department', department)
    .ilike('position_name', anomalyPositionName)
    .single();

  if (empError && empError.code !== 'PGRST116') {
    console.log(`❌ Error checking employee: ${empError.message}`);
    return;
  }

  if (employee) {
    console.log(`\n✅ Pegawai ditemukan:`);
    console.log(`   Nama: ${employee.name}`);
    console.log(`   NIP: ${employee.nip || '-'}`);
    console.log(`   Jabatan saat ini: ${employee.position_name}`);
    console.log(`   Kejuruan: ${employee.kejuruan || '-'}`);

    // Step 2: Update employee's position to base position
    console.log(`\n🔄 Mengubah jabatan pegawai ke: "${basePositionName}"`);
    
    const { error: updateError } = await supabase
      .from('employees')
      .update({ position_name: basePositionName })
      .eq('id', employee.id);

    if (updateError) {
      console.log(`❌ Error updating employee: ${updateError.message}`);
      return;
    }

    console.log(`✅ Jabatan pegawai berhasil diubah`);
  } else {
    console.log(`\nℹ️  Tidak ada pegawai dengan jabatan ini`);
  }

  // Step 3: Delete the anomaly position from position_references
  console.log(`\n🗑️  Menghapus jabatan anomali: "${anomalyPositionName}"`);
  
  const { error: deleteError } = await supabase
    .from('position_references')
    .delete()
    .eq('id', anomalyPositionId);

  if (deleteError) {
    console.log(`❌ Error deleting position: ${deleteError.message}`);
    return;
  }

  console.log(`✅ Jabatan anomali berhasil dihapus`);

  // Step 4: Verify
  console.log('\n' + '='.repeat(80));
  console.log('\n✅ Verifikasi:');

  // Check if position is deleted
  const { data: checkPos, error: checkPosError } = await supabase
    .from('position_references')
    .select('id')
    .eq('id', anomalyPositionId)
    .single();

  if (checkPosError && checkPosError.code === 'PGRST116') {
    console.log('   ✅ Jabatan anomali sudah tidak ada di database');
  } else {
    console.log('   ⚠️  Jabatan anomali masih ada di database');
  }

  // Check employee's new position
  if (employee) {
    const { data: checkEmp, error: checkEmpError } = await supabase
      .from('employees')
      .select('position_name, kejuruan')
      .eq('id', employee.id)
      .single();

    if (checkEmpError) {
      console.log(`   ❌ Error: ${checkEmpError.message}`);
    } else {
      console.log(`   ✅ Pegawai "${employee.name}":`);
      console.log(`      - Jabatan: ${checkEmp.position_name}`);
      console.log(`      - Kejuruan: ${checkEmp.kejuruan || '-'} (tetap tersimpan)`);
    }
  }

  // Check base position
  const { data: basePos, error: basePosError } = await supabase
    .from('position_references')
    .select('position_name, abk_count')
    .eq('department', department)
    .ilike('position_name', basePositionName)
    .single();

  if (basePosError) {
    console.log(`   ❌ Error: ${basePosError.message}`);
  } else {
    console.log(`   ✅ Jabatan dasar "${basePos.position_name}" tetap ada (ABK: ${basePos.abk_count})`);
  }

  console.log('\n' + '='.repeat(80));
  console.log('\n🎉 Perbaikan selesai!');
  console.log('\n📊 Hasil:');
  console.log('   ✅ Jabatan anomali dihapus dari peta jabatan');
  console.log('   ✅ Pegawai dipindahkan ke jabatan generik');
  console.log('   ✅ Kejuruan pegawai tetap tersimpan di field "kejuruan"');
  console.log('   ✅ Peta jabatan sekarang lebih bersih dan konsisten');
  
  console.log('\n💡 Catatan:');
  console.log('   - Jabatan di peta jabatan seharusnya GENERIK (tanpa kejuruan spesifik)');
  console.log('   - Kejuruan spesifik disimpan di field "kejuruan" pada data pegawai');
  console.log('   - Ini sesuai dengan desain sistem yang sudah ada');
}

fixKejuruanAnomaly();
