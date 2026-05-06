import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://mauyygrbdopmpdpnwzra.supabase.co";
const SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1hdXl5Z3JiZG9wbXBkcG53enJhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDkzMTM4NCwiZXhwIjoyMDkwNTA3Mzg0fQ.qMJoz6Xuy4PKwS-LKWpjf_WM5o0fuNtEE4hsgLjJX4Q";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function auditBPVPSurakarta() {
  try {
    console.log('\n🔍 AUDIT DATA PEGAWAI BPVP SURAKARTA');
    console.log('='.repeat(70));
    console.log('');

    // 1. Cari department BPVP Surakarta
    console.log('📍 Step 1: Mencari department BPVP Surakarta...\n');
    
    const { data: departments, error: deptError } = await supabase
      .from('departments')
      .select('id, name')
      .ilike('name', '%Surakarta%');
    
    if (deptError) {
      console.error('❌ Error:', deptError.message);
      return;
    }
    
    if (!departments || departments.length === 0) {
      console.log('❌ Department dengan kata "Surakarta" tidak ditemukan\n');
      
      // Tampilkan semua department
      const { data: allDepts } = await supabase
        .from('departments')
        .select('id, name')
        .order('name')
        .limit(50);
      
      if (allDepts && allDepts.length > 0) {
        console.log('📋 Department yang tersedia:');
        allDepts.forEach((dept, idx) => {
          console.log(`   ${idx + 1}. ${dept.name}`);
        });
      }
      return;
    }
    
    console.log('✅ Department ditemukan:');
    departments.forEach((dept, idx) => {
      console.log(`   ${idx + 1}. ${dept.name}`);
    });
    
    // Pilih department yang paling sesuai (BPVP Surakarta)
    let selectedDept = departments.find(d => d.name.includes('BPVP'));
    if (!selectedDept) {
      selectedDept = departments[0];
    }
    
    const deptName = selectedDept.name;
    console.log(`\n✅ Menggunakan: ${deptName}\n`);
    console.log('='.repeat(70));

    // 2. Ambil semua pegawai di department ini
    console.log('\n📍 Step 2: Mengambil data pegawai...\n');
    
    const { data: employees, error: empError } = await supabase
      .from('employees')
      .select('*')
      .eq('department', deptName)
      .order('updated_at', { ascending: false });
    
    if (empError) {
      console.error('❌ Error:', empError.message);
      return;
    }
    
    if (!employees || employees.length === 0) {
      console.log(`❌ Tidak ada pegawai di ${deptName}`);
      return;
    }
    
    console.log(`✅ Total pegawai: ${employees.length}\n`);

    // 3. Analisis distribusi tipe jabatan
    console.log('📊 DISTRIBUSI TIPE JABATAN:');
    console.log('-'.repeat(70));
    
    const positionTypeCount = {};
    employees.forEach(emp => {
      const type = emp.position_type || 'Tidak Ada';
      positionTypeCount[type] = (positionTypeCount[type] || 0) + 1;
    });
    
    Object.entries(positionTypeCount)
      .sort((a, b) => b[1] - a[1])
      .forEach(([type, count]) => {
        const percentage = ((count / employees.length) * 100).toFixed(1);
        console.log(`   ${type.padEnd(20)} : ${count.toString().padStart(3)} pegawai (${percentage}%)`);
      });

    // 4. Cari pegawai yang diupdate dalam 2 hari terakhir
    console.log('\n\n📍 Step 3: Pegawai yang diupdate dalam 2 hari terakhir...\n');
    
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    
    const recentUpdates = employees.filter(emp => {
      const updatedAt = new Date(emp.updated_at);
      return updatedAt >= twoDaysAgo;
    });
    
    console.log(`✅ Ditemukan: ${recentUpdates.length} pegawai\n`);
    
    if (recentUpdates.length > 0) {
      console.log('📋 DETAIL PEGAWAI YANG BARU DIUPDATE:');
      console.log('='.repeat(70));
      
      recentUpdates.forEach((emp, idx) => {
        console.log(`\n${idx + 1}. ${emp.name}`);
        console.log(`   NIP              : ${emp.nip || 'Tidak Ada'}`);
        console.log(`   Tipe Jabatan     : ${emp.position_type || 'Tidak Ada'}`);
        console.log(`   Nama Jabatan     : ${emp.position_name || 'Tidak Ada'}`);
        console.log(`   Pangkat          : ${emp.rank_group || 'Tidak Ada'}`);
        console.log(`   Status ASN       : ${emp.asn_status || 'Tidak Ada'}`);
        console.log(`   Terakhir diupdate: ${new Date(emp.updated_at).toLocaleString('id-ID')}`);
        console.log(`   Dibuat           : ${new Date(emp.created_at).toLocaleString('id-ID')}`);
      });
    }

    // 5. Fokus pada pegawai Pelaksana yang baru diupdate
    console.log('\n\n📍 Step 4: Analisis Pegawai PELAKSANA...\n');
    
    const pelaksana = employees.filter(emp => emp.position_type === 'Pelaksana');
    const pelaksanaRecent = pelaksana.filter(emp => {
      const updatedAt = new Date(emp.updated_at);
      return updatedAt >= twoDaysAgo;
    });
    
    console.log(`✅ Total Pelaksana: ${pelaksana.length}`);
    console.log(`⚠️  Pelaksana diupdate 2 hari terakhir: ${pelaksanaRecent.length}\n`);
    
    if (pelaksanaRecent.length > 0) {
      console.log('🚨 TEMUAN KRITIS - Pegawai Pelaksana yang baru diupdate:');
      console.log('='.repeat(70));
      console.log('⚠️  Ini kemungkinan pegawai yang berubah dari Fungsional ke Pelaksana!\n');
      
      pelaksanaRecent.forEach((emp, idx) => {
        console.log(`${idx + 1}. ${emp.name}`);
        console.log(`   NIP              : ${emp.nip || 'Tidak Ada'}`);
        console.log(`   Nama Jabatan     : ${emp.position_name || 'Tidak Ada'}`);
        console.log(`   Pangkat          : ${emp.rank_group || 'Tidak Ada'}`);
        console.log(`   Status ASN       : ${emp.asn_status || 'Tidak Ada'}`);
        console.log(`   Terakhir diupdate: ${new Date(emp.updated_at).toLocaleString('id-ID')}`);
        console.log(`   Dibuat           : ${new Date(emp.created_at).toLocaleString('id-ID')}`);
        console.log('');
      });
    }
    
    // Tampilkan beberapa contoh pegawai Pelaksana lainnya
    if (pelaksana.length > pelaksanaRecent.length) {
      console.log('\n📋 Contoh pegawai Pelaksana lainnya (5 teratas):');
      console.log('-'.repeat(70));
      
      const otherPelaksana = pelaksana
        .filter(emp => !pelaksanaRecent.includes(emp))
        .slice(0, 5);
      
      otherPelaksana.forEach((emp, idx) => {
        console.log(`\n${idx + 1}. ${emp.name}`);
        console.log(`   NIP          : ${emp.nip || 'Tidak Ada'}`);
        console.log(`   Nama Jabatan : ${emp.position_name || 'Tidak Ada'}`);
        console.log(`   Pangkat      : ${emp.rank_group || 'Tidak Ada'}`);
        console.log(`   Update       : ${new Date(emp.updated_at).toLocaleString('id-ID')}`);
      });
    }

    // 6. Pegawai Fungsional
    console.log('\n\n📍 Step 5: Analisis Pegawai FUNGSIONAL...\n');
    
    const fungsional = employees.filter(emp => emp.position_type === 'Fungsional');
    console.log(`✅ Total Fungsional: ${fungsional.length}\n`);
    
    if (fungsional.length > 0) {
      console.log('📋 Contoh pegawai Fungsional (5 teratas):');
      console.log('-'.repeat(70));
      
      fungsional.slice(0, 5).forEach((emp, idx) => {
        console.log(`\n${idx + 1}. ${emp.name}`);
        console.log(`   NIP          : ${emp.nip || 'Tidak Ada'}`);
        console.log(`   Nama Jabatan : ${emp.position_name || 'Tidak Ada'}`);
        console.log(`   Pangkat      : ${emp.rank_group || 'Tidak Ada'}`);
        console.log(`   Update       : ${new Date(emp.updated_at).toLocaleString('id-ID')}`);
      });
    }

    // 7. Cek audit logs jika ada
    console.log('\n\n📍 Step 6: Mengecek Audit Logs...\n');
    
    const { data: auditLogs, error: auditError } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('table_name', 'employees')
      .gte('created_at', twoDaysAgo.toISOString())
      .order('created_at', { ascending: false })
      .limit(50);
    
    if (auditError) {
      console.log('⚠️  Tidak dapat mengakses audit logs:', auditError.message);
    } else if (!auditLogs || auditLogs.length === 0) {
      console.log('⚠️  Tidak ada audit logs dalam 2 hari terakhir');
    } else {
      console.log(`✅ Ditemukan ${auditLogs.length} audit logs\n`);
      
      // Filter audit logs untuk pegawai di department ini
      const relevantLogs = auditLogs.filter(log => {
        if (log.new_values && log.new_values.department === deptName) return true;
        if (log.old_values && log.old_values.department === deptName) return true;
        return false;
      });
      
      if (relevantLogs.length > 0) {
        console.log(`📋 Audit logs untuk ${deptName}: ${relevantLogs.length} entries\n`);
        console.log('Detail perubahan:');
        console.log('='.repeat(70));
        
        relevantLogs.slice(0, 10).forEach((log, idx) => {
          console.log(`\n${idx + 1}. Action: ${log.action}`);
          console.log(`   Waktu: ${new Date(log.created_at).toLocaleString('id-ID')}`);
          
          if (log.old_values && log.new_values) {
            console.log(`   Pegawai: ${log.new_values.name || log.old_values.name}`);
            
            // Cek perubahan position_type
            if (log.old_values.position_type !== log.new_values.position_type) {
              console.log(`   🚨 PERUBAHAN TIPE JABATAN:`);
              console.log(`      Dari: ${log.old_values.position_type || 'Tidak Ada'}`);
              console.log(`      Ke  : ${log.new_values.position_type || 'Tidak Ada'}`);
            }
            
            // Cek perubahan position_name
            if (log.old_values.position_name !== log.new_values.position_name) {
              console.log(`   Perubahan Nama Jabatan:`);
              console.log(`      Dari: ${log.old_values.position_name || 'Tidak Ada'}`);
              console.log(`      Ke  : ${log.new_values.position_name || 'Tidak Ada'}`);
            }
          }
        });
      } else {
        console.log(`⚠️  Tidak ada audit logs untuk ${deptName}`);
      }
    }

    // 8. Kesimpulan
    console.log('\n\n📊 RINGKASAN AUDIT');
    console.log('='.repeat(70));
    console.log(`Department           : ${deptName}`);
    console.log(`Total Pegawai        : ${employees.length}`);
    console.log(`Pegawai Fungsional   : ${fungsional.length}`);
    console.log(`Pegawai Pelaksana    : ${pelaksana.length}`);
    console.log(`Update 2 hari terakhir: ${recentUpdates.length}`);
    console.log(`Pelaksana baru update : ${pelaksanaRecent.length}`);
    
    if (pelaksanaRecent.length > 0) {
      console.log('\n🚨 TEMUAN KRITIS:');
      console.log(`   ${pelaksanaRecent.length} pegawai Pelaksana baru diupdate dalam 2 hari terakhir`);
      console.log('   Kemungkinan besar ini adalah pegawai yang berubah dari Fungsional');
    }
    
    console.log('\n💡 REKOMENDASI:');
    console.log('   1. Periksa audit logs untuk melihat siapa yang melakukan perubahan');
    console.log('   2. Hubungi admin unit untuk konfirmasi perubahan');
    console.log('   3. Minta dokumen SK atau surat resmi untuk perubahan jabatan');
    console.log('   4. Jika perubahan tidak sah, restore dari backup database');
    console.log('   5. Implementasikan approval workflow untuk perubahan data kritis');
    
    console.log('\n✅ Audit selesai!');
    console.log('='.repeat(70));
    console.log('');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
  }
}

auditBPVPSurakarta();
