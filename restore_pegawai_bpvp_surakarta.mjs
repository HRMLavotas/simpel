import { createClient } from '@supabase/supabase-js';
import readline from 'readline';

const SUPABASE_URL = "https://mauyygrbdopmpdpnwzra.supabase.co";
const SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1hdXl5Z3JiZG9wbXBkcG53enJhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDkzMTM4NCwiZXhwIjoyMDkwNTA3Mzg0fQ.qMJoz6Xuy4PKwS-LKWpjf_WM5o0fuNtEE4hsgLjJX4Q";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Fungsi untuk konfirmasi
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

async function restorePegawai() {
  try {
    console.log('\n🔄 RESTORE DATA PEGAWAI BPVP SURAKARTA');
    console.log('='.repeat(70));
    console.log('');

    // 1. Identifikasi pegawai yang perlu di-restore
    console.log('📍 Step 1: Identifikasi pegawai yang perlu di-restore...\n');
    
    const deptName = 'BPVP Surakarta';
    
    const { data: employees, error: empError } = await supabase
      .from('employees')
      .select('*')
      .eq('department', deptName)
      .eq('position_type', 'Pelaksana');
    
    if (empError) {
      console.log('❌ Error:', empError.message);
      return;
    }
    
    // Filter pegawai yang nama jabatannya adalah jabatan fungsional
    const fungsionalKeywords = [
      'Instruktur',
      'Pranata',
      'Analis',
      'Penelaah',
      'Arsiparis',
      'Statistisi',
      'Pengantar Kerja',
      'Ahli',
      'Terampil',
      'Penyelia'
    ];
    
    const toRestore = employees.filter(emp => {
      const positionName = emp.position_name || '';
      return fungsionalKeywords.some(keyword => positionName.includes(keyword));
    });
    
    console.log(`✅ Ditemukan ${toRestore.length} pegawai yang perlu di-restore\n`);
    
    if (toRestore.length === 0) {
      console.log('✅ Tidak ada pegawai yang perlu di-restore!');
      return;
    }
    
    // 2. Tampilkan detail pegawai yang akan di-restore
    console.log('📋 DETAIL PEGAWAI YANG AKAN DI-RESTORE:');
    console.log('='.repeat(70));
    
    toRestore.forEach((emp, idx) => {
      console.log(`\n${idx + 1}. ${emp.name}`);
      console.log(`   NIP              : ${emp.nip}`);
      console.log(`   ID               : ${emp.id}`);
      console.log(`   Tipe Jabatan     : ${emp.position_type} ❌ → Fungsional ✅`);
      console.log(`   Nama Jabatan     : ${emp.position_name}`);
      console.log(`   Pangkat          : ${emp.rank_group}`);
      console.log(`   Status ASN       : ${emp.asn_status}`);
      console.log(`   Terakhir diupdate: ${new Date(emp.updated_at).toLocaleString('id-ID')}`);
    });
    
    // 3. Backup data sebelum restore
    console.log('\n\n📍 Step 2: Backup data sebelum restore...\n');
    
    const fs = await import('fs');
    const backupData = {
      timestamp: new Date().toISOString(),
      department: deptName,
      total_pegawai: toRestore.length,
      pegawai: toRestore.map(emp => ({
        id: emp.id,
        nip: emp.nip,
        name: emp.name,
        position_type_before: emp.position_type,
        position_type_after: 'Fungsional',
        position_name: emp.position_name,
        rank_group: emp.rank_group,
        asn_status: emp.asn_status,
        updated_at: emp.updated_at
      }))
    };
    
    const backupFilename = `backup_before_restore_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    fs.writeFileSync(backupFilename, JSON.stringify(backupData, null, 2));
    
    console.log(`✅ Backup disimpan ke: ${backupFilename}\n`);
    
    // 4. Konfirmasi sebelum restore
    console.log('\n⚠️  PERINGATAN:');
    console.log('   Script ini akan mengubah tipe jabatan dari "Pelaksana" ke "Fungsional"');
    console.log(`   untuk ${toRestore.length} pegawai di BPVP Surakarta`);
    console.log('');
    
    const confirmed = await askConfirmation('Apakah Anda yakin ingin melanjutkan? (y/n): ');
    
    if (!confirmed) {
      console.log('\n❌ Restore dibatalkan oleh user');
      console.log('   Data backup tetap tersimpan di:', backupFilename);
      return;
    }
    
    // 5. Lakukan restore
    console.log('\n\n📍 Step 3: Melakukan restore...\n');
    console.log('='.repeat(70));
    
    let successCount = 0;
    let failCount = 0;
    const results = [];
    
    for (const emp of toRestore) {
      try {
        const { data, error } = await supabase
          .from('employees')
          .update({ 
            position_type: 'Fungsional',
            updated_at: new Date().toISOString()
          })
          .eq('id', emp.id)
          .select();
        
        if (error) {
          console.log(`❌ GAGAL: ${emp.name} (${emp.nip})`);
          console.log(`   Error: ${error.message}`);
          failCount++;
          results.push({
            name: emp.name,
            nip: emp.nip,
            status: 'GAGAL',
            error: error.message
          });
        } else {
          console.log(`✅ BERHASIL: ${emp.name} (${emp.nip})`);
          console.log(`   Pelaksana → Fungsional`);
          successCount++;
          results.push({
            name: emp.name,
            nip: emp.nip,
            status: 'BERHASIL',
            position_type_before: emp.position_type,
            position_type_after: 'Fungsional'
          });
        }
      } catch (error) {
        console.log(`❌ ERROR: ${emp.name} (${emp.nip})`);
        console.log(`   Error: ${error.message}`);
        failCount++;
        results.push({
          name: emp.name,
          nip: emp.nip,
          status: 'ERROR',
          error: error.message
        });
      }
    }
    
    // 6. Simpan hasil restore
    console.log('\n\n📍 Step 4: Menyimpan hasil restore...\n');
    
    const resultData = {
      timestamp: new Date().toISOString(),
      department: deptName,
      total_pegawai: toRestore.length,
      success_count: successCount,
      fail_count: failCount,
      results: results
    };
    
    const resultFilename = `restore_result_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    fs.writeFileSync(resultFilename, JSON.stringify(resultData, null, 2));
    
    console.log(`✅ Hasil restore disimpan ke: ${resultFilename}\n`);
    
    // 7. Verifikasi hasil restore
    console.log('\n📍 Step 5: Verifikasi hasil restore...\n');
    
    const { data: verifyData, error: verifyError } = await supabase
      .from('employees')
      .select('*')
      .eq('department', deptName);
    
    if (!verifyError) {
      const stillInconsistent = verifyData.filter(emp => {
        const positionName = emp.position_name || '';
        const positionType = emp.position_type || '';
        
        if (positionType === 'Pelaksana') {
          return fungsionalKeywords.some(keyword => positionName.includes(keyword));
        }
        return false;
      });
      
      console.log('📊 Hasil Verifikasi:');
      console.log(`   Total pegawai di BPVP Surakarta: ${verifyData.length}`);
      console.log(`   Pegawai yang masih tidak konsisten: ${stillInconsistent.length}`);
      
      if (stillInconsistent.length === 0) {
        console.log('\n✅ SEMUA DATA SUDAH KONSISTEN!');
      } else {
        console.log('\n⚠️  Masih ada data yang tidak konsisten:');
        stillInconsistent.forEach((emp, idx) => {
          console.log(`   ${idx + 1}. ${emp.name} (${emp.nip})`);
        });
      }
    }
    
    // 8. Ringkasan
    console.log('\n\n📊 RINGKASAN RESTORE');
    console.log('='.repeat(70));
    console.log(`Department        : ${deptName}`);
    console.log(`Total Pegawai     : ${toRestore.length}`);
    console.log(`Berhasil di-restore: ${successCount} ✅`);
    console.log(`Gagal             : ${failCount} ❌`);
    console.log(`Success Rate      : ${((successCount / toRestore.length) * 100).toFixed(1)}%`);
    
    console.log('\n📁 File yang dibuat:');
    console.log(`   1. Backup: ${backupFilename}`);
    console.log(`   2. Result: ${resultFilename}`);
    
    if (successCount > 0) {
      console.log('\n✅ Restore selesai!');
      console.log('   Data pegawai berhasil diperbaiki.');
      console.log('   Silakan cek di aplikasi untuk memastikan data sudah benar.');
    }
    
    if (failCount > 0) {
      console.log('\n⚠️  Ada beberapa pegawai yang gagal di-restore.');
      console.log('   Silakan cek file result untuk detail error.');
    }
    
    console.log('\n💡 LANGKAH SELANJUTNYA:');
    console.log('   1. Verifikasi data di aplikasi');
    console.log('   2. Hubungi admin unit untuk konfirmasi');
    console.log('   3. Dokumentasikan perubahan ini');
    console.log('   4. Aktifkan audit log untuk mencegah masalah serupa');
    
    console.log('\n' + '='.repeat(70));
    console.log('');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
  }
}

restorePegawai();
