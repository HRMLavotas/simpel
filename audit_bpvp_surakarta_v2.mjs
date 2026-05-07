import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://mauyygrbdopmpdpnwzra.supabase.co";
const SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1hdXl5Z3JiZG9wbXBkcG53enJhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDkzMTM4NCwiZXhwIjoyMDkwNTA3Mzg0fQ.qMJoz6Xuy4PKwS-LKWpjf_WM5o0fuNtEE4hsgLjJX4Q";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function auditBPVPSurakarta() {
  try {
    console.log('🔍 AUDIT DATA PEGAWAI BPVP SURAKARTA');
    console.log('='.repeat(60));
    console.log('');

    // 1. Cari department BPVP Surakarta
    console.log('📍 Step 1: Mencari department BPVP Surakarta...');
    const { data: departments, error: deptError } = await supabase
      .from('departments')
      .select('id, name')
      .ilike('name', '%BPVP%Surakarta%')
      .limit(10);
    
    if (deptError) {
      console.error('❌ Error mencari department:', deptError);
      return;
    }
    
    if (!departments || departments.length === 0) {
      console.log('❌ Department BPVP Surakarta tidak ditemukan');
      console.log('\n🔍 Mencoba mencari dengan kata kunci lain...');
      
      // Coba cari dengan kata kunci "Surakarta" saja
      const { data: deptSurakarta, error: deptSurakartaError } = await supabase
        .from('departments')
        .select('id, name')
        .ilike('name', '%Surakarta%')
        .limit(10);
      
      if (!deptSurakartaError && deptSurakarta && deptSurakarta.length > 0) {
        console.log('\n✅ Department dengan kata "Surakarta" ditemukan:');
        deptSurakarta.forEach((dept, idx) => {
          console.log(`   ${idx + 1}. ${dept.name} (ID: ${dept.id})`);
        });
        
        // Gunakan department pertama yang ditemukan
        const unitId = deptSurakarta[0].id;
        const unitName = deptSurakarta[0].name;
        console.log(`\n✅ Menggunakan department: ${unitName}`);
        await analyzeDepartment(unitId, unitName);
        return;
      }
      
      // Jika masih tidak ketemu, tampilkan semua department
      const { data: allDepts, error: allDeptsError } = await supabase
        .from('departments')
        .select('id, name')
        .limit(30);
      
      if (!allDeptsError && allDepts) {
        console.log('\n📋 Beberapa department yang tersedia:');
        allDepts.forEach((dept, idx) => {
          console.log(`   ${idx + 1}. ${dept.name}`);
        });
      }
      return;
    }
    
    console.log('\n✅ Department ditemukan:');
    departments.forEach((dept, idx) => {
      console.log(`   ${idx + 1}. ${dept.name} (ID: ${dept.id})`);
    });
    
    const unitId = departments[0].id;
    const unitName = departments[0].name;
    
    console.log(`\n✅ Menggunakan department: ${unitName}`);
    console.log('');

    await analyzeDepartment(unitId, unitName);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  }
}

async function analyzeDepartment(unitId, unitName) {
  try {
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

    // 2. Ambil semua pegawai di department ini
    console.log('📍 Step 2: Mengambil data pegawai...');
    const { data: employees, error: empError } = await supabase
      .from('employees')
      .select('id, nip, name, position_type, position_name, rank_group, asn_status, updated_at, created_at, department')
      .eq('department', unitName)
      .order('updated_at', { ascending: false });
    
    if (empError) {
      console.error('❌ Error mengambil data pegawai:', empError);
      return;
    }
    
    console.log(`\n✅ Total pegawai di ${unitName}: ${employees.length}`);
    console.log('');

    // 3. Analisis distribusi tipe jabatan
    console.log('📍 Step 3: Analisis distribusi tipe jabatan...');
    const positionTypeCount = {};
    employees.forEach(emp => {
      const type = emp.position_type || 'Tidak Ada';
      positionTypeCount[type] = (positionTypeCount[type] || 0) + 1;
    });
    
    console.log('\n📊 Distribusi Tipe Jabatan:');
    Object.entries(positionTypeCount)
      .sort((a, b) => b[1] - a[1])
      .forEach(([type, count]) => {
        const percentage = ((count / employees.length) * 100).toFixed(1);
        console.log(`   - ${type}: ${count} pegawai (${percentage}%)`);
      });
    console.log('');

    // 4. Cari pegawai yang diupdate dalam 2 hari terakhir
    console.log('📍 Step 4: Mencari pegawai yang diupdate dalam 2 hari terakhir...');
    // twoDaysAgo sudah dideklarasi di atas (line 88)
    
    const recentUpdates = employees.filter(emp => {
      const updatedAt = new Date(emp.updated_at);
      return updatedAt >= twoDaysAgo;
    });
    
    console.log(`\n✅ Pegawai yang diupdate dalam 2 hari terakhir: ${recentUpdates.length}`);
    
    if (recentUpdates.length > 0) {
      console.log('\n📋 Detail pegawai yang baru diupdate:');
      console.log('-'.repeat(60));
      recentUpdates.forEach((emp, idx) => {
        console.log(`\n${idx + 1}. ${emp.name}`);
        console.log(`   NIP: ${emp.nip || 'Tidak Ada'}`);
        console.log(`   Tipe Jabatan: ${emp.position_type || 'Tidak Ada'}`);
        console.log(`   Nama Jabatan: ${emp.position_name || 'Tidak Ada'}`);
        console.log(`   Pangkat: ${emp.rank_group || 'Tidak Ada'}`);
        console.log(`   Status ASN: ${emp.asn_status || 'Tidak Ada'}`);
        console.log(`   Terakhir diupdate: ${new Date(emp.updated_at).toLocaleString('id-ID')}`);
      });
    }
    console.log('');

    // 5. Fokus pada pegawai Pelaksana
    console.log('📍 Step 5: Analisis pegawai dengan jabatan Pelaksana...');
    const pelaksana = employees.filter(emp => emp.position_type === 'Pelaksana');
    
    console.log(`\n✅ Total pegawai Pelaksana: ${pelaksana.length}`);
    
    if (pelaksana.length > 0) {
      // Cek berapa yang baru diupdate
      const pelaksanaRecentUpdate = pelaksana.filter(emp => {
        const updatedAt = new Date(emp.updated_at);
        return updatedAt >= twoDaysAgo;
      });
      
      console.log(`⚠️  Pelaksana yang diupdate dalam 2 hari terakhir: ${pelaksanaRecentUpdate.length}`);
      
      if (pelaksanaRecentUpdate.length > 0) {
        console.log('\n🚨 TEMUAN PENTING - Pegawai Pelaksana yang baru diupdate:');
        console.log('-'.repeat(60));
        pelaksanaRecentUpdate.forEach((emp, idx) => {
          console.log(`\n${idx + 1}. ${emp.name}`);
          console.log(`   NIP: ${emp.nip || 'Tidak Ada'}`);
          console.log(`   Nama Jabatan: ${emp.position_name || 'Tidak Ada'}`);
          console.log(`   Pangkat: ${emp.rank_group || 'Tidak Ada'}`);
          console.log(`   Status ASN: ${emp.asn_status || 'Tidak Ada'}`);
          console.log(`   Terakhir diupdate: ${new Date(emp.updated_at).toLocaleString('id-ID')}`);
          console.log(`   Dibuat: ${new Date(emp.created_at).toLocaleString('id-ID')}`);
        });
      }
      
      // Tampilkan beberapa contoh pegawai Pelaksana
      console.log('\n📋 Contoh pegawai Pelaksana (10 teratas):');
      console.log('-'.repeat(60));
      pelaksana.slice(0, 10).forEach((emp, idx) => {
        console.log(`\n${idx + 1}. ${emp.name}`);
        console.log(`   NIP: ${emp.nip || 'Tidak Ada'}`);
        console.log(`   Nama Jabatan: ${emp.position_name || 'Tidak Ada'}`);
        console.log(`   Pangkat: ${emp.rank_group || 'Tidak Ada'}`);
        console.log(`   Terakhir diupdate: ${new Date(emp.updated_at).toLocaleString('id-ID')}`);
      });
    }
    console.log('');

    // 6. Fokus pada pegawai Fungsional
    console.log('📍 Step 6: Analisis pegawai dengan jabatan Fungsional...');
    const fungsional = employees.filter(emp => emp.position_type === 'Fungsional');
    
    console.log(`\n✅ Total pegawai Fungsional: ${fungsional.length}`);
    
    if (fungsional.length > 0) {
      console.log('\n📋 Contoh pegawai Fungsional (10 teratas):');
      console.log('-'.repeat(60));
      fungsional.slice(0, 10).forEach((emp, idx) => {
        console.log(`\n${idx + 1}. ${emp.name}`);
        console.log(`   NIP: ${emp.nip || 'Tidak Ada'}`);
        console.log(`   Nama Jabatan: ${emp.position_name || 'Tidak Ada'}`);
        console.log(`   Pangkat: ${emp.rank_group || 'Tidak Ada'}`);
        console.log(`   Terakhir diupdate: ${new Date(emp.updated_at).toLocaleString('id-ID')}`);
      });
    }
    console.log('');

    // 7. Kesimpulan dan Rekomendasi
    console.log('📍 Step 7: Kesimpulan dan Rekomendasi');
    console.log('='.repeat(60));
    console.log('\n📊 RINGKASAN AUDIT:');
    console.log(`   - Total Pegawai: ${employees.length}`);
    console.log(`   - Pegawai Fungsional: ${fungsional.length}`);
    console.log(`   - Pegawai Pelaksana: ${pelaksana.length}`);
    console.log(`   - Pegawai diupdate 2 hari terakhir: ${recentUpdates.length}`);
    
    const pelaksanaRecentUpdate = pelaksana.filter(emp => {
      const updatedAt = new Date(emp.updated_at);
      return updatedAt >= twoDaysAgo;
    });
    
    if (pelaksanaRecentUpdate.length > 0) {
      console.log(`\n🚨 TEMUAN KRITIS:`);
      console.log(`   - ${pelaksanaRecentUpdate.length} pegawai Pelaksana baru diupdate dalam 2 hari terakhir`);
      console.log(`   - Ini mungkin pegawai yang berubah dari Fungsional ke Pelaksana`);
    }
    
    console.log('\n💡 REKOMENDASI:');
    console.log('   1. ⚠️  Sistem tidak memiliki audit log untuk tracking perubahan');
    console.log('   2. 📝 Perlu dibuat tabel audit_log untuk mencatat semua perubahan data');
    console.log('   3. 🔍 Periksa pegawai yang baru diupdate secara manual');
    console.log('   4. 📞 Hubungi admin unit untuk konfirmasi perubahan');
    console.log('   5. 💾 Bandingkan dengan backup database jika tersedia');
    console.log('   6. 📋 Minta dokumen SK atau surat resmi untuk perubahan jabatan');
    
    console.log('\n✅ Audit selesai!');
    console.log('='.repeat(60));
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  }
}

auditBPVPSurakarta();
