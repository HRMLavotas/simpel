import pg from 'pg';
const { Client } = pg;

const DATABASE_URL = "postgresql://postgres:Aliham251118!@db.mauyygrbdopmpdpnwzra.supabase.co:5432/postgres";

async function auditBPVPSurakarta() {
  const client = new Client({ connectionString: DATABASE_URL });
  
  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    // 1. Cari unit BPVP Surakarta
    console.log('🔍 Mencari unit BPVP Surakarta...');
    const unitResult = await client.query(`
      SELECT id, name, code 
      FROM units 
      WHERE name ILIKE '%BPVP%Surakarta%' 
         OR name ILIKE '%Surakarta%'
         OR code ILIKE '%Surakarta%'
      LIMIT 10
    `);
    
    if (unitResult.rows.length === 0) {
      console.log('❌ Unit BPVP Surakarta tidak ditemukan');
      return;
    }
    
    console.log('\n📋 Unit yang ditemukan:');
    unitResult.rows.forEach(unit => {
      console.log(`   - ${unit.name} (ID: ${unit.id}, Code: ${unit.code})`);
    });
    
    const unitId = unitResult.rows[0].id;
    const unitName = unitResult.rows[0].name;
    
    console.log(`\n✅ Menggunakan unit: ${unitName} (ID: ${unitId})\n`);
    
    // 2. Cek apakah ada tabel audit log
    console.log('🔍 Mengecek tabel audit log...');
    const auditTableCheck = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND (table_name LIKE '%audit%' OR table_name LIKE '%log%' OR table_name LIKE '%history%')
    `);
    
    console.log('📋 Tabel audit yang tersedia:');
    if (auditTableCheck.rows.length > 0) {
      auditTableCheck.rows.forEach(row => {
        console.log(`   - ${row.table_name}`);
      });
    } else {
      console.log('   ⚠️  Tidak ada tabel audit log ditemukan');
    }
    
    // 3. Ambil data pegawai saat ini di BPVP Surakarta
    console.log('\n🔍 Mengambil data pegawai di BPVP Surakarta...');
    const employeesResult = await client.query(`
      SELECT 
        id,
        nip,
        name,
        position_type,
        position_name,
        rank_group,
        asn_status,
        updated_at,
        created_at
      FROM employees
      WHERE unit_id = $1
      ORDER BY updated_at DESC
    `, [unitId]);
    
    console.log(`\n📊 Total pegawai di ${unitName}: ${employeesResult.rows.length}\n`);
    
    // 4. Analisis pegawai berdasarkan position_type
    const positionTypeCount = {};
    employeesResult.rows.forEach(emp => {
      const type = emp.position_type || 'Tidak Ada';
      positionTypeCount[type] = (positionTypeCount[type] || 0) + 1;
    });
    
    console.log('📊 Distribusi Tipe Jabatan:');
    Object.entries(positionTypeCount).forEach(([type, count]) => {
      console.log(`   - ${type}: ${count} pegawai`);
    });
    
    // 5. Cari pegawai yang diupdate dalam 2 hari terakhir
    console.log('\n🔍 Mencari pegawai yang diupdate dalam 2 hari terakhir...');
    const recentUpdates = await client.query(`
      SELECT 
        id,
        nip,
        name,
        position_type,
        position_name,
        rank_group,
        asn_status,
        updated_at,
        created_at
      FROM employees
      WHERE unit_id = $1
        AND updated_at >= NOW() - INTERVAL '2 days'
      ORDER BY updated_at DESC
    `, [unitId]);
    
    console.log(`\n📋 Pegawai yang diupdate dalam 2 hari terakhir: ${recentUpdates.rows.length}\n`);
    
    if (recentUpdates.rows.length > 0) {
      console.log('Detail pegawai yang diupdate:');
      recentUpdates.rows.forEach((emp, idx) => {
        console.log(`\n${idx + 1}. ${emp.name} (NIP: ${emp.nip})`);
        console.log(`   - Tipe Jabatan: ${emp.position_type || 'Tidak Ada'}`);
        console.log(`   - Nama Jabatan: ${emp.position_name || 'Tidak Ada'}`);
        console.log(`   - Pangkat: ${emp.rank_group || 'Tidak Ada'}`);
        console.log(`   - Status ASN: ${emp.asn_status || 'Tidak Ada'}`);
        console.log(`   - Diupdate: ${emp.updated_at}`);
        console.log(`   - Dibuat: ${emp.created_at}`);
      });
    }
    
    // 6. Cari pegawai dengan position_type = 'Pelaksana'
    console.log('\n\n🔍 Mencari pegawai dengan tipe jabatan "Pelaksana"...');
    const pelaksanaResult = await client.query(`
      SELECT 
        id,
        nip,
        name,
        position_type,
        position_name,
        rank_group,
        asn_status,
        updated_at,
        created_at
      FROM employees
      WHERE unit_id = $1
        AND position_type = 'Pelaksana'
      ORDER BY updated_at DESC
    `, [unitId]);
    
    console.log(`\n📋 Total pegawai dengan jabatan Pelaksana: ${pelaksanaResult.rows.length}\n`);
    
    if (pelaksanaResult.rows.length > 0) {
      console.log('Detail pegawai Pelaksana:');
      pelaksanaResult.rows.forEach((emp, idx) => {
        console.log(`\n${idx + 1}. ${emp.name} (NIP: ${emp.nip})`);
        console.log(`   - Nama Jabatan: ${emp.position_name || 'Tidak Ada'}`);
        console.log(`   - Pangkat: ${emp.rank_group || 'Tidak Ada'}`);
        console.log(`   - Status ASN: ${emp.asn_status || 'Tidak Ada'}`);
        console.log(`   - Diupdate: ${emp.updated_at}`);
        console.log(`   - Dibuat: ${emp.created_at}`);
      });
    }
    
    // 7. Cari pegawai dengan position_type = 'Fungsional'
    console.log('\n\n🔍 Mencari pegawai dengan tipe jabatan "Fungsional"...');
    const fungsionalResult = await client.query(`
      SELECT 
        id,
        nip,
        name,
        position_type,
        position_name,
        rank_group,
        asn_status,
        updated_at,
        created_at
      FROM employees
      WHERE unit_id = $1
        AND position_type = 'Fungsional'
      ORDER BY updated_at DESC
    `, [unitId]);
    
    console.log(`\n📋 Total pegawai dengan jabatan Fungsional: ${fungsionalResult.rows.length}\n`);
    
    if (fungsionalResult.rows.length > 0) {
      console.log('Detail pegawai Fungsional (10 teratas):');
      fungsionalResult.rows.slice(0, 10).forEach((emp, idx) => {
        console.log(`\n${idx + 1}. ${emp.name} (NIP: ${emp.nip})`);
        console.log(`   - Nama Jabatan: ${emp.position_name || 'Tidak Ada'}`);
        console.log(`   - Pangkat: ${emp.rank_group || 'Tidak Ada'}`);
        console.log(`   - Status ASN: ${emp.asn_status || 'Tidak Ada'}`);
        console.log(`   - Diupdate: ${emp.updated_at}`);
      });
    }
    
    // 8. Cek struktur tabel employees untuk melihat field apa saja yang ada
    console.log('\n\n🔍 Mengecek struktur tabel employees...');
    const tableStructure = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'employees'
        AND table_schema = 'public'
      ORDER BY ordinal_position
    `);
    
    console.log('\n📋 Struktur tabel employees:');
    tableStructure.rows.forEach(col => {
      console.log(`   - ${col.column_name} (${col.data_type}, nullable: ${col.is_nullable})`);
    });
    
    // 9. Rekomendasi
    console.log('\n\n📝 REKOMENDASI AUDIT:');
    console.log('='.repeat(60));
    console.log('1. Tidak ada tabel audit log yang mencatat perubahan data');
    console.log('2. Untuk investigasi lebih lanjut, perlu:');
    console.log('   - Membuat tabel audit log untuk tracking perubahan');
    console.log('   - Mengecek backup database jika ada');
    console.log('   - Mewawancarai admin yang melakukan perubahan');
    console.log('3. Pegawai yang diupdate dalam 2 hari terakhir perlu dicek manual');
    console.log('4. Bandingkan dengan data backup atau dokumen resmi');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await client.end();
    console.log('\n✅ Disconnected from database');
  }
}

auditBPVPSurakarta();
