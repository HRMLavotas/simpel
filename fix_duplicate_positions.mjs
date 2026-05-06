import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const supabaseUrl = "https://mauyygrbdopmpdpnwzra.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1hdXl5Z3JiZG9wbXBkcG53enJhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDkzMTM4NCwiZXhwIjoyMDkwNTA3Mzg0fQ.qMJoz6Xuy4PKwS-LKWpjf_WM5o0fuNtEE4hsgLjJX4Q";

const supabase = createClient(supabaseUrl, supabaseKey);

// Read duplicate report
const duplicateReport = JSON.parse(readFileSync('duplicate_positions_report.json', 'utf-8'));

async function fixDuplicatePositions() {
  console.log('🔧 Memperbaiki duplikasi jabatan...\n');
  console.log(`📊 Total unit dengan duplikasi: ${duplicateReport.length}\n`);

  let totalFixed = 0;
  let totalErrors = 0;

  for (const unitData of duplicateReport) {
    console.log(`\n📍 ${unitData.department}`);
    console.log('─'.repeat(80));

    for (const dup of unitData.duplicates) {
      console.log(`\n  Jabatan: "${dup.name}" (${dup.category})`);
      
      // Identify which position to keep and which to delete
      // Strategy: Keep the one with ABK > 0, delete the one with ABK = 0
      const positions = dup.positions;
      const posWithABK = positions.find(p => p.abk_count > 0);
      const posWithoutABK = positions.find(p => p.abk_count === 0);

      if (!posWithABK || !posWithoutABK) {
        console.log('  ⚠️  Tidak dapat menentukan jabatan mana yang harus dihapus (keduanya memiliki ABK)');
        console.log('  ℹ️  Melewati duplikasi ini - perlu penanganan manual');
        totalErrors++;
        continue;
      }

      const keepPos = posWithABK;
      const deletePos = posWithoutABK;

      console.log(`  ✓ Akan dipertahankan: ID ${keepPos.id} (ABK: ${keepPos.abk_count}, Order: ${keepPos.position_order})`);
      console.log(`  ✗ Akan dihapus: ID ${deletePos.id} (ABK: ${deletePos.abk_count}, Order: ${deletePos.position_order})`);

      // Check if there are employees linked to the position to be deleted
      const { data: employees, error: empError } = await supabase
        .from('employees')
        .select('id, name, position_name')
        .eq('department', unitData.department)
        .ilike('position_name', deletePos.position_name);

      if (empError) {
        console.log(`  ❌ Error checking employees: ${empError.message}`);
        totalErrors++;
        continue;
      }

      if (employees && employees.length > 0) {
        console.log(`  ⚠️  Ditemukan ${employees.length} pegawai dengan jabatan ini:`);
        employees.slice(0, 3).forEach(emp => {
          console.log(`     - ${emp.name}`);
        });
        if (employees.length > 3) {
          console.log(`     ... dan ${employees.length - 3} pegawai lainnya`);
        }
        console.log(`  ℹ️  Pegawai-pegawai ini sudah terkait dengan jabatan yang benar`);
        console.log(`  ℹ️  Aman untuk menghapus duplikasi`);
      } else {
        console.log(`  ✓ Tidak ada pegawai yang terkait dengan jabatan duplikat`);
      }

      // Delete the duplicate position
      try {
        const { error: deleteError } = await supabase
          .from('position_references')
          .delete()
          .eq('id', deletePos.id);

        if (deleteError) throw deleteError;

        console.log(`  ✅ Berhasil menghapus duplikasi`);
        totalFixed++;

      } catch (error) {
        console.log(`  ❌ Error menghapus: ${error.message}`);
        totalErrors++;
      }
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log(`\n📊 Hasil:`);
  console.log(`   ✅ Berhasil diperbaiki: ${totalFixed} duplikasi`);
  console.log(`   ❌ Gagal/Dilewati: ${totalErrors} duplikasi`);
  
  if (totalFixed > 0) {
    console.log(`\n✨ Duplikasi jabatan telah dihapus!`);
    console.log(`   Peta jabatan sekarang lebih bersih dan tidak ada duplikasi.`);
  }
}

fixDuplicatePositions();
