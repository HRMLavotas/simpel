import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://mauyygrbdopmpdpnwzra.supabase.co";
const SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1hdXl5Z3JiZG9wbXBkcG53enJhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDkzMTM4NCwiZXhwIjoyMDkwNTA3Mzg0fQ.qMJoz6Xuy4PKwS-LKWpjf_WM5o0fuNtEE4hsgLjJX4Q";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Data dari Excel BPVP Surakarta - Pegawai yang seharusnya FUNGSIONAL
const excelFungsionalData = [
  // Instruktur
  { nip: '198508222012121001', name: 'Fakhri Annas', position_name: 'Instruktur Ahli Muda', position_type: 'Fungsional' },
  
  // Pranata Komputer
  { nip: '198907182011012012', name: 'Wahyuningtyas Dwi Utami', position_name: 'Pranata Komputer Pelaksana Lanjutan', position_type: 'Fungsional' },
  
  // Penelaah Teknis Kebijakan
  { nip: '198002082007122001', name: 'Istianah', position_name: 'Penelaah Teknis Kebijakan', position_type: 'Fungsional' },
  { nip: '199005202015032002', name: 'Hari Sri Purwati', position_name: 'Penelaah Teknis Kebijakan', position_type: 'Fungsional' },
  { nip: '198501222018011001', name: 'Agus Ariyanto', position_name: 'Penelaah Teknis Kebijakan', position_type: 'Fungsional' },
  { nip: '199704082018122001', name: 'Herna Diah Cahyati', position_name: 'Penelaah Teknis Kebijakan', position_type: 'Fungsional' },
];

// Data dari Excel - Pegawai yang seharusnya PELAKSANA
const excelPelaksanaData = [
  // Penata Layanan Operasional
  { nip: '198702282011012016', name: 'Evi Nurdiyati', position_name: 'Penata Layanan Operasional', position_type: 'Pelaksana' },
  { nip: '198605212009121001', name: 'Rusmiyanto', position_name: 'Penata Layanan Operasional', position_type: 'Pelaksana' },
  { nip: '197804102009122001', name: 'Ina Widi Rohmani', position_name: 'Penata Layanan Operasional', position_type: 'Pelaksana' },
  { nip: '197506022009122001', name: 'Ria Margina Harminingsih', position_name: 'Penata Layanan Operasional', position_type: 'Pelaksana' },
  { nip: '199106242015032007', name: 'Poppy Cyntia Devita Sari', position_name: 'Penata Layanan Operasional', position_type: 'Pelaksana' },
  { nip: '197712152009122001', name: 'Alfatemy Rekyandari', position_name: 'Penata Layanan Operasional', position_type: 'Pelaksana' },
  { nip: '198102222011012005', name: 'Aphita Febriani', position_name: 'Penata Layanan Operasional', position_type: 'Pelaksana' },
  { nip: '198711102009121001', name: 'Andri Sutanto', position_name: 'Penata Layanan Operasional', position_type: 'Pelaksana' },
  { nip: '199202072015031003', name: 'Arif Budi Setiawan', position_name: 'Penata Layanan Operasional', position_type: 'Pelaksana' },
  { nip: '198103072015032003', name: 'Elmi Dhona Marlina', position_name: 'Penata Layanan Operasional', position_type: 'Pelaksana' },
  
  // Pengelola Layanan Operasional
  { nip: '198605312015031003', name: 'Ponco Supriyadi', position_name: 'Pengelola Layanan Operasional', position_type: 'Pelaksana' },
  { nip: '198205222007122001', name: 'Kristiani Suryaningrum', position_name: 'Pengelola Layanan Operasional', position_type: 'Pelaksana' },
  
  // Lainnya
  { nip: '199807012025051001', name: 'Muhammad Richie Assariy', position_name: 'Penata Kelola Sistem dan Teknologi Informasi', position_type: 'Pelaksana' },
  { nip: '199705232025052006', name: 'Hanna Permata Hanifa', position_name: 'Konselor SDM', position_type: 'Pelaksana' },
  { nip: '198706282011012015', name: 'Ika Yunita Sari', position_name: 'Pengolah Data dan Informasi', position_type: 'Pelaksana' },
  { nip: '198001132007011001', name: 'Miftachur Rochman', position_name: 'Pengadministrasi Perkantoran', position_type: 'Pelaksana' },
  { nip: '200005172025051003', name: 'Yusuf Bahtiar', position_name: 'Teknisi Sarana dan Prasarana', position_type: 'Pelaksana' },
  { nip: '198007162007011002', name: 'Wawan Driyana', position_name: 'Operator Layanan Operasional', position_type: 'Pelaksana' },
  { nip: '197008252007011001', name: 'Kardi', position_name: 'Pengelola Umum Operasional', position_type: 'Pelaksana' },
];

async function compareExcelVsDatabase() {
  try {
    console.log('\n📊 PERBANDINGAN DATA EXCEL VS DATABASE');
    console.log('='.repeat(80));
    console.log('');

    // Ambil data dari database
    console.log('📍 Step 1: Mengambil data dari database...\n');
    
    const { data: employees, error: empError } = await supabase
      .from('employees')
      .select('*')
      .eq('department', 'BPVP Surakarta');
    
    if (empError) {
      console.log('❌ Error:', empError.message);
      return;
    }
    
    console.log(`✅ Total pegawai di database: ${employees.length}\n`);

    // Analisis 1: Pegawai yang seharusnya FUNGSIONAL
    console.log('📍 Step 2: Analisis pegawai yang seharusnya FUNGSIONAL...\n');
    console.log('='.repeat(80));
    
    const fungsionalIssues = [];
    
    excelFungsionalData.forEach(excelData => {
      const dbData = employees.find(emp => emp.nip === excelData.nip);
      
      if (dbData) {
        const isCorrect = dbData.position_type === 'Fungsional';
        
        if (!isCorrect) {
          fungsionalIssues.push({
            nip: excelData.nip,
            name: excelData.name,
            position_name: excelData.position_name,
            excel_type: 'Fungsional',
            db_type: dbData.position_type,
            status: '❌ TIDAK SESUAI'
          });
        }
        
        console.log(`${isCorrect ? '✅' : '❌'} ${excelData.name} (${excelData.nip})`);
        console.log(`   Jabatan: ${excelData.position_name}`);
        console.log(`   Excel: Fungsional | Database: ${dbData.position_type || 'Tidak Ada'}`);
        console.log('');
      } else {
        console.log(`⚠️  ${excelData.name} (${excelData.nip})`);
        console.log(`   TIDAK DITEMUKAN di database`);
        console.log('');
      }
    });

    // Analisis 2: Pegawai yang seharusnya PELAKSANA
    console.log('\n📍 Step 3: Analisis pegawai yang seharusnya PELAKSANA...\n');
    console.log('='.repeat(80));
    
    const pelaksanaIssues = [];
    
    excelPelaksanaData.forEach(excelData => {
      const dbData = employees.find(emp => emp.nip === excelData.nip);
      
      if (dbData) {
        const isCorrect = dbData.position_type === 'Pelaksana';
        
        if (!isCorrect) {
          pelaksanaIssues.push({
            nip: excelData.nip,
            name: excelData.name,
            position_name: excelData.position_name,
            excel_type: 'Pelaksana',
            db_type: dbData.position_type,
            status: '❌ TIDAK SESUAI'
          });
        }
        
        console.log(`${isCorrect ? '✅' : '❌'} ${excelData.name} (${excelData.nip})`);
        console.log(`   Jabatan: ${excelData.position_name}`);
        console.log(`   Excel: Pelaksana | Database: ${dbData.position_type || 'Tidak Ada'}`);
        console.log('');
      } else {
        console.log(`⚠️  ${excelData.name} (${excelData.nip})`);
        console.log(`   TIDAK DITEMUKAN di database`);
        console.log('');
      }
    });

    // Ringkasan
    console.log('\n📊 RINGKASAN PERBANDINGAN');
    console.log('='.repeat(80));
    
    const totalChecked = excelFungsionalData.length + excelPelaksanaData.length;
    const totalIssues = fungsionalIssues.length + pelaksanaIssues.length;
    const totalCorrect = totalChecked - totalIssues;
    
    console.log(`\n📈 STATISTIK:`);
    console.log(`   Total pegawai dicek     : ${totalChecked}`);
    console.log(`   Data sesuai             : ${totalCorrect} ✅`);
    console.log(`   Data tidak sesuai       : ${totalIssues} ❌`);
    console.log(`   Akurasi                 : ${((totalCorrect / totalChecked) * 100).toFixed(1)}%`);
    
    if (fungsionalIssues.length > 0) {
      console.log(`\n🚨 PEGAWAI YANG SEHARUSNYA FUNGSIONAL (${fungsionalIssues.length}):`);
      fungsionalIssues.forEach((issue, idx) => {
        console.log(`   ${idx + 1}. ${issue.name} (${issue.nip})`);
        console.log(`      Jabatan: ${issue.position_name}`);
        console.log(`      Excel: ${issue.excel_type} | Database: ${issue.db_type}`);
      });
    }
    
    if (pelaksanaIssues.length > 0) {
      console.log(`\n⚠️  PEGAWAI YANG SEHARUSNYA PELAKSANA (${pelaksanaIssues.length}):`);
      pelaksanaIssues.forEach((issue, idx) => {
        console.log(`   ${idx + 1}. ${issue.name} (${issue.nip})`);
        console.log(`      Jabatan: ${issue.position_name}`);
        console.log(`      Excel: ${issue.excel_type} | Database: ${issue.db_type}`);
      });
    }

    // Kesimpulan
    console.log('\n\n💡 KESIMPULAN:');
    console.log('='.repeat(80));
    
    if (totalIssues === 0) {
      console.log('✅ SEMUA DATA SUDAH SESUAI dengan Excel!');
      console.log('   Database sudah sinkron dengan peta jabatan periode Maret.');
    } else {
      console.log(`❌ DITEMUKAN ${totalIssues} KETIDAKSESUAIAN!`);
      console.log('');
      console.log('   Kemungkinan penyebab:');
      console.log('   1. Data di database belum diupdate sesuai peta jabatan terbaru');
      console.log('   2. Ada perubahan yang tidak terdokumentasi');
      console.log('   3. Import data peta jabatan belum dilakukan');
      console.log('');
      console.log('   Rekomendasi:');
      console.log('   1. Update data pegawai sesuai dengan Excel');
      console.log('   2. Import ulang peta jabatan periode Maret');
      console.log('   3. Verifikasi dengan admin unit');
      console.log('   4. Dokumentasikan semua perubahan');
    }

    // Export hasil perbandingan
    console.log('\n📝 Menyimpan hasil perbandingan...');
    const fs = await import('fs');
    
    const comparisonResult = {
      timestamp: new Date().toISOString(),
      department: 'BPVP Surakarta',
      total_checked: totalChecked,
      total_correct: totalCorrect,
      total_issues: totalIssues,
      accuracy_percentage: ((totalCorrect / totalChecked) * 100).toFixed(1),
      fungsional_issues: fungsionalIssues,
      pelaksana_issues: pelaksanaIssues
    };
    
    fs.writeFileSync(
      'comparison_excel_vs_database.json',
      JSON.stringify(comparisonResult, null, 2)
    );
    
    console.log('✅ Hasil perbandingan disimpan ke: comparison_excel_vs_database.json');
    
    console.log('\n✅ Analisis selesai!');
    console.log('='.repeat(80));
    console.log('');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
  }
}

compareExcelVsDatabase();
