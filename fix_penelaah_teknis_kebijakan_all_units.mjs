import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mauyygrbdopmpdpnwzra.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1hdXl5Z3JiZG9wbXBkcG53enJhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDkzMTM4NCwiZXhwIjoyMDkwNTA3Mzg0fQ.qMJoz6Xuy4PKwS-LKWpjf_WM5o0fuNtEE4hsgLjJX4Q';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixAllPenelaah() {
  console.log('='.repeat(80));
  console.log('PERBAIKAN MASSAL: PENELAAH TEKNIS KEBIJAKAN');
  console.log('='.repeat(80));
  console.log('');
  console.log('Mengubah position_category dari "Fungsional" ke "Pelaksana"');
  console.log('untuk SEMUA unit yang memiliki jabatan "Penelaah Teknis Kebijakan"');
  console.log('');

  // 1. Cek data sebelum perubahan
  console.log('📊 DATA SEBELUM PERUBAHAN:');
  console.log('-'.repeat(80));

  const { data: beforeData, error: beforeError } = await supabase
    .from('position_references')
    .select('department, position_name, position_category')
    .ilike('position_name', '%penelaah teknis kebijakan%')
    .eq('position_category', 'Fungsional')
    .order('department');

  if (beforeError) {
    console.error('❌ Error:', beforeError.message);
    return;
  }

  if (!beforeData || beforeData.length === 0) {
    console.log('✅ Tidak ada data yang perlu diperbaiki.');
    console.log('   Semua jabatan "Penelaah Teknis Kebijakan" sudah berkategori "Pelaksana"');
    return;
  }

  console.log(`\nDitemukan ${beforeData.length} unit dengan kategori "Fungsional" (SALAH):\n`);
  beforeData.forEach((pos, idx) => {
    console.log(`${idx + 1}. ${pos.department} - ${pos.position_category} ❌`);
  });

  // 2. Update data
  console.log('\n' + '='.repeat(80));
  console.log('🔄 MELAKUKAN UPDATE...');
  console.log('='.repeat(80));
  console.log('');

  const { data: updateData, error: updateError } = await supabase
    .from('position_references')
    .update({ position_category: 'Pelaksana' })
    .ilike('position_name', '%penelaah teknis kebijakan%')
    .eq('position_category', 'Fungsional')
    .select();

  if (updateError) {
    console.error('❌ Error melakukan update:', updateError.message);
    return;
  }

  console.log(`✅ Berhasil mengupdate ${updateData.length} jabatan\n`);

  // 3. Verifikasi setelah perubahan
  console.log('='.repeat(80));
  console.log('📊 VERIFIKASI SETELAH PERUBAHAN:');
  console.log('-'.repeat(80));
  console.log('');

  const { data: afterData, error: afterError } = await supabase
    .from('position_references')
    .select('department, position_name, position_category')
    .ilike('position_name', '%penelaah teknis kebijakan%')
    .order('department');

  if (afterError) {
    console.error('❌ Error:', afterError.message);
    return;
  }

  console.log(`Total ${afterData.length} unit dengan jabatan "Penelaah Teknis Kebijakan":\n`);

  const byCategory = {
    'Pelaksana': [],
    'Fungsional': [],
    'Lainnya': []
  };

  afterData.forEach(pos => {
    if (pos.position_category === 'Pelaksana') {
      byCategory['Pelaksana'].push(pos.department);
    } else if (pos.position_category === 'Fungsional') {
      byCategory['Fungsional'].push(pos.department);
    } else {
      byCategory['Lainnya'].push(pos.department);
    }
  });

  console.log(`✅ Pelaksana (BENAR): ${byCategory['Pelaksana'].length} unit`);
  if (byCategory['Fungsional'].length > 0) {
    console.log(`❌ Fungsional (SALAH): ${byCategory['Fungsional'].length} unit`);
    byCategory['Fungsional'].forEach(dept => console.log(`   - ${dept}`));
  }
  if (byCategory['Lainnya'].length > 0) {
    console.log(`⚠️  Lainnya: ${byCategory['Lainnya'].length} unit`);
  }

  console.log('');
  console.log('='.repeat(80));
  console.log('✅ PERBAIKAN SELESAI');
  console.log('='.repeat(80));
  console.log('');
  console.log('Sekarang semua jabatan "Penelaah Teknis Kebijakan" sudah berkategori "Pelaksana"');
  console.log('');
  console.log('⚠️  PENTING: Refresh browser (Ctrl+F5 atau Cmd+Shift+R) untuk melihat perubahan!');
  console.log('');

  // 4. Update juga di tabel employees untuk konsistensi
  console.log('='.repeat(80));
  console.log('🔄 BONUS: Update position_type di tabel employees');
  console.log('='.repeat(80));
  console.log('');

  const { data: empUpdate, error: empError } = await supabase
    .from('employees')
    .update({ position_type: 'Pelaksana' })
    .ilike('position_name', '%penelaah teknis kebijakan%')
    .neq('position_type', 'Pelaksana')
    .select('name, department');

  if (empError) {
    console.error('❌ Error update employees:', empError.message);
  } else if (empUpdate && empUpdate.length > 0) {
    console.log(`✅ Berhasil update ${empUpdate.length} pegawai di tabel employees\n`);
    empUpdate.forEach((emp, idx) => {
      console.log(`${idx + 1}. ${emp.name} (${emp.department})`);
    });
  } else {
    console.log('✅ Semua pegawai sudah memiliki position_type "Pelaksana"');
  }

  console.log('');
  console.log('='.repeat(80));
  console.log('🎉 SEMUA PERBAIKAN SELESAI!');
  console.log('='.repeat(80));
  console.log('');
}

fixAllPenelaah().catch(console.error);
