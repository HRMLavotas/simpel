import { createClient } from '@supabase/supabase-js';
import readline from 'readline';
import fs from 'fs';

const SUPABASE_URL = "https://mauyygrbdopmpdpnwzra.supabase.co";
const SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1hdXl5Z3JiZG9wbXBkcG53enJhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDkzMTM4NCwiZXhwIjoyMDkwNTA3Mzg0fQ.qMJoz6Xuy4PKwS-LKWpjf_WM5o0fuNtEE4hsgLjJX4Q";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

function askConfirmation(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
    });
  });
}

async function cleanupPositionReferences() {
  try {
    console.log('\n🧹 CLEANUP POSITION_REFERENCES - SEMUA UNIT KERJA');
    console.log('='.repeat(80));
    console.log('');

    // 1. Load audit result
    console.log('📍 Step 1: Membaca hasil audit...\n');
    
    const auditData = JSON.parse(fs.readFileSync('audit_all_units_duplicates.json', 'utf8'));
    
    const toDelete = auditData.to_delete || [];
    const toUpdate = auditData.to_update || [];
    
    console.log(`📋 Data yang perlu dihapus: ${toDelete.length}`);
    console.log(`📋 Data yang perlu diupdate: ${toUpdate.length}\n`);

    if (toDelete.length === 0 && toUpdate.length === 0) {
      console.log('✅ Tidak ada data yang perlu dibersihkan!');
      return;
    }

    // 2. Backup data sebelum cleanup
    console.log('📍 Step 2: Backup data sebelum cleanup...\n');
    
    const allIds = [...toDelete.map(d => d.id), ...toUpdate.map(u => u.id)];
    
    const { data: backupData, error: backupError } = await supabase
      .from('position_references')
      .select('*')
      .in('id', allIds);
    
    if (backupError) {
      console.log('❌ Error backup:', backupError.message);
      return;
    }
    
    const backupFilename = `backup_position_references_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    fs.writeFileSync(backupFilename, JSON.stringify(backupData, null, 2));
    
    console.log(`✅ Backup disimpan ke: ${backupFilename}\n`);

    // 3. Konfirmasi
    console.log('⚠️  PERINGATAN:');
    console.log(`   Script ini akan:`);
    console.log(`   1. MENGHAPUS ${toDelete.length} entries duplikat`);
    console.log(`   2. MENGUPDATE ${toUpdate.length} entries (Pelaksana → Fungsional)`);
    console.log('');
    
    const confirmed = await askConfirmation('Apakah Anda yakin ingin melanjutkan? (y/n): ');
    
    if (!confirmed) {
      console.log('\n❌ Cleanup dibatalkan oleh user');
      console.log(`   Backup tetap tersimpan di: ${backupFilename}`);
      return;
    }

    // 4. Hapus duplikasi
    console.log('\n\n📍 Step 3: Menghapus duplikasi...\n');
    console.log('='.repeat(80));
    
    let deleteSuccess = 0;
    let deleteFail = 0;
    
    for (const item of toDelete) {
      try {
        const { error } = await supabase
          .from('position_references')
          .delete()
          .eq('id', item.id);
        
        if (error) {
          console.log(`❌ GAGAL: ${item.department} - ${item.position_name}`);
          console.log(`   Error: ${error.message}`);
          deleteFail++;
        } else {
          console.log(`✅ DIHAPUS: ${item.department} - ${item.position_name}`);
          deleteSuccess++;
        }
      } catch (error) {
        console.log(`❌ ERROR: ${item.department} - ${item.position_name}`);
        console.log(`   Error: ${error.message}`);
        deleteFail++;
      }
    }

    // 5. Update kategori yang salah
    console.log('\n\n📍 Step 4: Mengupdate kategori yang salah...\n');
    console.log('='.repeat(80));
    
    let updateSuccess = 0;
    let updateFail = 0;
    
    for (const item of toUpdate) {
      try {
        const { error } = await supabase
          .from('position_references')
          .update({ position_category: item.new_category })
          .eq('id', item.id);
        
        if (error) {
          console.log(`❌ GAGAL: ${item.department} - ${item.position_name}`);
          console.log(`   Error: ${error.message}`);
          updateFail++;
        } else {
          console.log(`✅ UPDATE: ${item.department} - ${item.position_name}`);
          console.log(`   ${item.current_category} → ${item.new_category}`);
          updateSuccess++;
        }
      } catch (error) {
        console.log(`❌ ERROR: ${item.department} - ${item.position_name}`);
        console.log(`   Error: ${error.message}`);
        updateFail++;
      }
    }

    // 6. Verifikasi hasil
    console.log('\n\n📍 Step 5: Verifikasi hasil cleanup...\n');
    console.log('='.repeat(80));
    
    const fungsionalKeywords = [
      'Instruktur',
      'Pranata',
      'Analis',
      'Penelaah',
      'Arsiparis',
      'Statistisi',
      'Pengantar Kerja',
      'Perencana'
    ];
    
    const { data: allPositions, error: verifyError } = await supabase
      .from('position_references')
      .select('*');
    
    if (!verifyError) {
      // Cek duplikasi
      const positionNames = {};
      let duplicateCount = 0;
      
      allPositions.forEach(pos => {
        const key = `${pos.department}|${pos.position_name}`;
        if (!positionNames[key]) {
          positionNames[key] = [];
        }
        positionNames[key].push(pos);
      });
      
      Object.values(positionNames).forEach(posList => {
        if (posList.length > 1) {
          duplicateCount++;
        }
      });
      
      // Cek miscategorized
      const miscategorized = allPositions.filter(pos => {
        const isFungsionalName = fungsionalKeywords.some(keyword => 
          pos.position_name.includes(keyword)
        );
        return isFungsionalName && pos.position_category === 'Pelaksana';
      });
      
      console.log('📊 Hasil Verifikasi:');
      console.log(`   Total jabatan: ${allPositions.length}`);
      console.log(`   Duplikasi tersisa: ${duplicateCount}`);
      console.log(`   Salah kategorisasi tersisa: ${miscategorized.length}`);
      
      if (duplicateCount === 0 && miscategorized.length === 0) {
        console.log('\n✅ SEMUA DATA SUDAH BERSIH!');
      } else {
        console.log('\n⚠️  Masih ada masalah:');
        if (duplicateCount > 0) {
          console.log(`   - ${duplicateCount} duplikasi`);
        }
        if (miscategorized.length > 0) {
          console.log(`   - ${miscategorized.length} salah kategorisasi`);
        }
      }
    }

    // 7. Simpan hasil cleanup
    console.log('\n\n📍 Step 6: Menyimpan hasil cleanup...\n');
    
    const cleanupResult = {
      timestamp: new Date().toISOString(),
      delete_attempted: toDelete.length,
      delete_success: deleteSuccess,
      delete_fail: deleteFail,
      update_attempted: toUpdate.length,
      update_success: updateSuccess,
      update_fail: updateFail,
      backup_file: backupFilename
    };
    
    const resultFilename = `cleanup_result_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    fs.writeFileSync(resultFilename, JSON.stringify(cleanupResult, null, 2));
    
    console.log(`✅ Hasil cleanup disimpan ke: ${resultFilename}`);

    // 8. Ringkasan
    console.log('\n\n📊 RINGKASAN CLEANUP');
    console.log('='.repeat(80));
    console.log(`\n📈 PENGHAPUSAN:`);
    console.log(`   Berhasil: ${deleteSuccess} ✅`);
    console.log(`   Gagal: ${deleteFail} ❌`);
    console.log(`   Success Rate: ${((deleteSuccess / toDelete.length) * 100).toFixed(1)}%`);
    
    console.log(`\n📈 UPDATE:`);
    console.log(`   Berhasil: ${updateSuccess} ✅`);
    console.log(`   Gagal: ${updateFail} ❌`);
    console.log(`   Success Rate: ${((updateSuccess / toUpdate.length) * 100).toFixed(1)}%`);
    
    console.log(`\n📁 File yang dibuat:`);
    console.log(`   1. Backup: ${backupFilename}`);
    console.log(`   2. Result: ${resultFilename}`);
    
    if (deleteSuccess > 0 || updateSuccess > 0) {
      console.log('\n✅ Cleanup selesai!');
      console.log('   Data position_references berhasil dibersihkan.');
    }
    
    if (deleteFail > 0 || updateFail > 0) {
      console.log('\n⚠️  Ada beberapa data yang gagal diproses.');
      console.log('   Silakan cek file result untuk detail error.');
    }
    
    console.log('\n💡 LANGKAH SELANJUTNYA:');
    console.log('   1. Verifikasi data di aplikasi');
    console.log('   2. Tambahkan constraint unique di database');
    console.log('   3. Tambahkan validasi saat import data');
    console.log('   4. Dokumentasikan perubahan ini');
    
    console.log('\n' + '='.repeat(80));
    console.log('');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
  }
}

cleanupPositionReferences();
