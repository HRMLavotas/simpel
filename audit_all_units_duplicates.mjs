import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://mauyygrbdopmpdpnwzra.supabase.co";
const SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1hdXl5Z3JiZG9wbXBkcG53enJhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDkzMTM4NCwiZXhwIjoyMDkwNTA3Mzg0fQ.qMJoz6Xuy4PKwS-LKWpjf_WM5o0fuNtEE4hsgLjJX4Q";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

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

async function auditAllUnitsDuplicates() {
  try {
    console.log('\n🔍 AUDIT DUPLIKASI POSITION_REFERENCES - SEMUA UNIT KERJA');
    console.log('='.repeat(80));
    console.log('');

    // 1. Ambil semua data position_references
    console.log('📍 Step 1: Mengambil semua data position_references...\n');
    
    const { data: allPositions, error: posError } = await supabase
      .from('position_references')
      .select('*')
      .order('department')
      .order('position_category')
      .order('position_order');
    
    if (posError) {
      console.log('❌ Error:', posError.message);
      return;
    }
    
    console.log(`✅ Total jabatan di semua unit: ${allPositions.length}\n`);

    // 2. Group by department
    const byDepartment = {};
    allPositions.forEach(pos => {
      if (!byDepartment[pos.department]) {
        byDepartment[pos.department] = [];
      }
      byDepartment[pos.department].push(pos);
    });

    console.log(`📊 Total unit kerja: ${Object.keys(byDepartment).length}\n`);

    // 3. Analisis per department
    const allDuplicates = [];
    const allMiscategorized = [];
    const departmentSummary = [];

    Object.entries(byDepartment).forEach(([dept, positions]) => {
      // Cari duplikasi
      const positionNames = {};
      const duplicates = [];
      
      positions.forEach(pos => {
        const name = pos.position_name;
        if (!positionNames[name]) {
          positionNames[name] = [];
        }
        positionNames[name].push(pos);
      });
      
      Object.entries(positionNames).forEach(([name, posList]) => {
        if (posList.length > 1) {
          duplicates.push({ 
            department: dept,
            name, 
            positions: posList 
          });
          allDuplicates.push(...posList);
        }
      });

      // Cari miscategorized
      const miscategorized = positions.filter(pos => {
        const isFungsionalName = fungsionalKeywords.some(keyword => 
          pos.position_name.includes(keyword)
        );
        return isFungsionalName && pos.position_category === 'Pelaksana';
      });

      if (miscategorized.length > 0) {
        allMiscategorized.push(...miscategorized);
      }

      // Summary per department
      if (duplicates.length > 0 || miscategorized.length > 0) {
        departmentSummary.push({
          department: dept,
          total_positions: positions.length,
          duplicates_count: duplicates.length,
          miscategorized_count: miscategorized.length,
          duplicates,
          miscategorized
        });
      }
    });

    // 4. Tampilkan hasil
    console.log('📊 HASIL AUDIT PER UNIT KERJA');
    console.log('='.repeat(80));
    console.log('');

    if (departmentSummary.length === 0) {
      console.log('✅ TIDAK ADA MASALAH DI SEMUA UNIT KERJA!');
    } else {
      console.log(`🚨 DITEMUKAN MASALAH DI ${departmentSummary.length} UNIT KERJA:\n`);

      departmentSummary.forEach((summary, idx) => {
        console.log(`${idx + 1}. ${summary.department}`);
        console.log(`   Total jabatan: ${summary.total_positions}`);
        console.log(`   Duplikasi: ${summary.duplicates_count} jabatan`);
        console.log(`   Salah kategorisasi: ${summary.miscategorized_count} jabatan`);
        
        if (summary.duplicates.length > 0) {
          console.log(`\n   📋 Jabatan yang duplikat:`);
          summary.duplicates.forEach((dup, i) => {
            console.log(`   ${i + 1}. ${dup.name} (${dup.positions.length} entries)`);
            dup.positions.forEach((pos, j) => {
              console.log(`      ${j + 1}. Kategori: ${pos.position_category}, ID: ${pos.id.substring(0, 8)}...`);
            });
          });
        }
        
        if (summary.miscategorized.length > 0) {
          console.log(`\n   ⚠️  Jabatan fungsional di kategori Pelaksana:`);
          summary.miscategorized.forEach((pos, i) => {
            console.log(`   ${i + 1}. ${pos.position_name} (ID: ${pos.id.substring(0, 8)}...)`);
          });
        }
        
        console.log('');
      });
    }

    // 5. Ringkasan global
    console.log('\n📊 RINGKASAN GLOBAL');
    console.log('='.repeat(80));
    console.log(`\n📈 STATISTIK:`);
    console.log(`   Total unit kerja: ${Object.keys(byDepartment).length}`);
    console.log(`   Unit dengan masalah: ${departmentSummary.length}`);
    console.log(`   Total duplikasi: ${allDuplicates.length} entries`);
    console.log(`   Total salah kategorisasi: ${allMiscategorized.length} entries`);

    // 6. Identifikasi data yang perlu dihapus
    console.log('\n\n📍 Step 2: Identifikasi data yang perlu dihapus/diperbaiki...\n');
    console.log('='.repeat(80));

    const toDelete = [];
    const toUpdate = [];

    // Untuk duplikasi: hapus yang di kategori Pelaksana, pertahankan yang di Fungsional
    departmentSummary.forEach(summary => {
      summary.duplicates.forEach(dup => {
        const fungsionalEntry = dup.positions.find(p => p.position_category === 'Fungsional');
        const pelaksanaEntries = dup.positions.filter(p => p.position_category === 'Pelaksana');
        
        if (fungsionalEntry && pelaksanaEntries.length > 0) {
          // Hapus yang di Pelaksana
          pelaksanaEntries.forEach(p => {
            toDelete.push({
              id: p.id,
              department: p.department,
              position_name: p.position_name,
              category: p.position_category,
              reason: 'Duplikat - sudah ada di Fungsional'
            });
          });
        } else if (pelaksanaEntries.length > 1) {
          // Jika semua di Pelaksana, hapus yang duplikat (pertahankan 1)
          pelaksanaEntries.slice(1).forEach(p => {
            toDelete.push({
              id: p.id,
              department: p.department,
              position_name: p.position_name,
              category: p.position_category,
              reason: 'Duplikat'
            });
          });
        }
      });

      // Untuk miscategorized yang bukan duplikat: update kategori ke Fungsional
      summary.miscategorized.forEach(pos => {
        const isDuplicate = toDelete.some(d => d.id === pos.id);
        if (!isDuplicate) {
          toUpdate.push({
            id: pos.id,
            department: pos.department,
            position_name: pos.position_name,
            current_category: pos.position_category,
            new_category: 'Fungsional',
            reason: 'Nama jabatan adalah fungsional'
          });
        }
      });
    });

    console.log(`📋 Data yang perlu DIHAPUS: ${toDelete.length} entries\n`);
    if (toDelete.length > 0) {
      toDelete.forEach((item, idx) => {
        console.log(`${idx + 1}. ${item.department} - ${item.position_name}`);
        console.log(`   ID: ${item.id}`);
        console.log(`   Kategori: ${item.category}`);
        console.log(`   Alasan: ${item.reason}`);
        console.log('');
      });
    }

    console.log(`\n📋 Data yang perlu DIUPDATE: ${toUpdate.length} entries\n`);
    if (toUpdate.length > 0) {
      toUpdate.forEach((item, idx) => {
        console.log(`${idx + 1}. ${item.department} - ${item.position_name}`);
        console.log(`   ID: ${item.id}`);
        console.log(`   ${item.current_category} → ${item.new_category}`);
        console.log(`   Alasan: ${item.reason}`);
        console.log('');
      });
    }

    // 7. Export hasil
    console.log('\n📝 Menyimpan hasil audit...');
    const fs = await import('fs');
    
    const auditResult = {
      timestamp: new Date().toISOString(),
      total_units: Object.keys(byDepartment).length,
      units_with_issues: departmentSummary.length,
      total_duplicates: allDuplicates.length,
      total_miscategorized: allMiscategorized.length,
      department_summary: departmentSummary.map(s => ({
        department: s.department,
        total_positions: s.total_positions,
        duplicates_count: s.duplicates_count,
        miscategorized_count: s.miscategorized_count
      })),
      to_delete: toDelete,
      to_update: toUpdate
    };
    
    fs.writeFileSync(
      'audit_all_units_duplicates.json',
      JSON.stringify(auditResult, null, 2)
    );
    
    console.log('✅ Hasil audit disimpan ke: audit_all_units_duplicates.json');

    // 8. Kesimpulan
    console.log('\n\n💡 KESIMPULAN');
    console.log('='.repeat(80));
    
    if (toDelete.length > 0 || toUpdate.length > 0) {
      console.log('\n🚨 TINDAKAN YANG DIPERLUKAN:');
      console.log(`   1. Hapus ${toDelete.length} entries duplikat`);
      console.log(`   2. Update ${toUpdate.length} entries yang salah kategorisasi`);
      console.log(`   3. Tambahkan constraint unique untuk mencegah duplikasi`);
      console.log(`   4. Tambahkan validasi saat import data`);
      
      console.log('\n📝 LANGKAH SELANJUTNYA:');
      console.log('   1. Review file audit_all_units_duplicates.json');
      console.log('   2. Jalankan script cleanup untuk menghapus duplikasi');
      console.log('   3. Jalankan script untuk update kategori yang salah');
      console.log('   4. Tambahkan constraint di database');
    } else {
      console.log('\n✅ TIDAK ADA TINDAKAN YANG DIPERLUKAN');
      console.log('   Semua data sudah bersih');
    }
    
    console.log('\n✅ Audit selesai!');
    console.log('='.repeat(80));
    console.log('');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
  }
}

auditAllUnitsDuplicates();
