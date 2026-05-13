import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import XLSX from 'xlsx';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// ============================================================================
// PARSE EXCEL
// ============================================================================

function parseExcelWithKeterangan() {
  console.log('\n📖 Reading Excel file...');
  
  const workbook = XLSX.readFile('data import kasus.xlsx');
  const sheetName = workbook.SheetNames[0];
  const rawData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: null });

  const cases = [];
  let currentCase = null;

  rawData.forEach((row) => {
    if (row['Timeline Kasus'] === 'Tanggal') return;

    const isNewCase = row['Tahun'] && row['Nama'] && row['Unit Kerja'] && row['Jenis Kasus'];
    
    if (isNewCase) {
      if (currentCase) {
        cases.push(currentCase);
      }

      currentCase = {
        tahun: row['Tahun'],
        nama: row['Nama'],
        unitKerja: row['Unit Kerja'],
        jenisKasus: row['Jenis Kasus'],
        keteranganKasus: row['Keterangan Kasus'] || null,
        timeline: []
      };

      const timelineDate = row['Timeline Kasus'];
      const timelineDetail = row[''] || row['__EMPTY'];
      if (timelineDate && timelineDetail) {
        currentCase.timeline.push({ tanggal: timelineDate, deskripsi: timelineDetail });
      }
    } else {
      const timelineDate = row['Timeline Kasus'];
      const timelineDetail = row[''] || row['__EMPTY'];
      if (currentCase && timelineDate && timelineDetail) {
        currentCase.timeline.push({ tanggal: timelineDate, deskripsi: timelineDetail });
      }
    }
  });

  if (currentCase) {
    cases.push(currentCase);
  }

  console.log(`✅ Parsed ${cases.length} cases\n`);
  
  return cases;
}

function mapCaseType(jenisKasus) {
  const mapping = {
    'perceraian': 'perceraian',
    'hutang': 'hutang',
    'pinjol': 'pinjaman_online',
    'pinjaman online': 'pinjaman_online',
    'presensi': 'presensi',
    'pengunduran diri': 'pengunduran_diri',
    'temuan': 'temuan',
    'dan lain-lain': 'lainnya',
    'lain-lain': 'lainnya',
    'lainnya': 'lainnya'
  };

  const normalized = String(jenisKasus).toLowerCase().trim();
  return mapping[normalized] || 'lainnya';
}

function parseDate(dateStr, fallbackYear) {
  if (!dateStr) return `${fallbackYear}-01-01`;
  
  const str = String(dateStr).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
  if (/^\d{4}$/.test(str)) return `${str}-01-01`;

  const monthMap = {
    januari: '01', februari: '02', maret: '03', april: '04',
    mei: '05', juni: '06', juli: '07', agustus: '08',
    september: '09', oktober: '10', november: '11', desember: '12',
    january: '01', february: '02', march: '03', may: '05',
    june: '06', july: '07', august: '08', october: '10', december: '12'
  };

  const parts = str.toLowerCase().split(/\s+/);
  if (parts.length === 3) {
    const day = parts[0].padStart(2, '0');
    const month = monthMap[parts[1]];
    const year = parts[2];
    if (month && year) return `${year}-${month}-${day}`;
  }

  if (!isNaN(dateStr) && Number(dateStr) > 40000) {
    const excelDate = XLSX.SSF.parse_date_code(Number(dateStr));
    if (excelDate) {
      const year = excelDate.y;
      const month = String(excelDate.m).padStart(2, '0');
      const day = String(excelDate.d).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
  }

  return `${fallbackYear}-01-01`;
}

// ============================================================================
// IMPORT LEADERSHIP DIRECTIVE
// ============================================================================

async function importLeadershipDirective(dryRun = true) {
  console.log('\n' + '='.repeat(80));
  console.log(`${dryRun ? 'DRY RUN - ' : ''}IMPORTING LEADERSHIP DIRECTIVE`);
  console.log('='.repeat(80));

  const excelCases = parseExcelWithKeterangan();
  
  // Filter only cases with Keterangan Kasus
  const casesWithKeterangan = excelCases.filter(c => c.keteranganKasus);
  
  console.log(`📊 Cases with Keterangan Kasus: ${casesWithKeterangan.length}\n`);

  // Get all cases from database
  const { data: dbCases, error } = await supabase
    .from('employee_cases')
    .select('id, employee_name, case_type, report_date, leadership_directive');

  if (error) {
    console.error('❌ Error fetching cases:', error);
    return;
  }

  let matchedCount = 0;
  let updatedCount = 0;
  let skippedCount = 0;

  for (const excelCase of casesWithKeterangan) {
    const caseType = mapCaseType(excelCase.jenisKasus);
    const reportDate = parseDate(excelCase.timeline[0]?.tanggal, excelCase.tahun);
    
    // Find matching case in database
    const dbCase = dbCases.find(c => 
      c.employee_name === excelCase.nama &&
      c.case_type === caseType &&
      c.report_date === reportDate
    );

    if (dbCase) {
      matchedCount++;
      
      console.log(`\n📝 ${excelCase.nama}`);
      console.log(`   Case ID: ${dbCase.id}`);
      console.log(`   Current leadership_directive: ${dbCase.leadership_directive || '(empty)'}`);
      console.log(`   New leadership_directive: ${excelCase.keteranganKasus}`);

      if (dbCase.leadership_directive) {
        console.log(`   ⚠️  Already has directive, skipping`);
        skippedCount++;
      } else {
        if (!dryRun) {
          const { error: updateError } = await supabase
            .from('employee_cases')
            .update({ leadership_directive: excelCase.keteranganKasus })
            .eq('id', dbCase.id);

          if (updateError) {
            console.log(`   ❌ Error: ${updateError.message}`);
          } else {
            console.log(`   ✅ Updated`);
            updatedCount++;
          }
        } else {
          console.log(`   🔍 Would update`);
          updatedCount++;
        }
      }
    } else {
      console.log(`\n⚠️  Not found in DB: ${excelCase.nama} - ${caseType}`);
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('SUMMARY');
  console.log('='.repeat(80));
  console.log(`Cases with Keterangan Kasus: ${casesWithKeterangan.length}`);
  console.log(`Matched in DB: ${matchedCount}`);
  console.log(`Updated: ${updatedCount}`);
  console.log(`Skipped (already has directive): ${skippedCount}`);
  
  if (dryRun) {
    console.log('\n🔍 DRY RUN - No changes made. Set dryRun=false to actually import.');
  } else {
    console.log('\n✅ Import completed!');
  }
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  try {
    // Dry run first
    await importLeadershipDirective(true);

    console.log('\n' + '='.repeat(80));
    console.log('NEXT STEPS');
    console.log('='.repeat(80));
    console.log('1. Review the dry run results above');
    console.log('2. If everything looks good, uncomment the line below:');
    console.log('   - await importLeadershipDirective(false);');
    console.log('='.repeat(80));

    // UNCOMMENT TO ACTUALLY IMPORT:
    await importLeadershipDirective(false);

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

main();
