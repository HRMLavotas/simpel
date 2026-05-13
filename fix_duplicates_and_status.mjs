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
// REMOVE DUPLICATES
// ============================================================================

async function removeDuplicates(dryRun = true) {
  console.log('\n' + '='.repeat(80));
  console.log(`${dryRun ? 'DRY RUN - ' : ''}REMOVING DUPLICATES`);
  console.log('='.repeat(80));

  const { data: cases, error } = await supabase
    .from('employee_cases')
    .select('id, employee_name, employee_nip, case_type, report_date, created_at')
    .order('created_at'); // Order by created_at to keep the first one

  if (error) {
    console.error('❌ Error fetching cases:', error);
    return;
  }

  console.log(`📊 Total cases: ${cases.length}\n`);

  // Group by employee_name + case_type + report_date
  const groups = {};
  
  cases.forEach(c => {
    const key = `${c.employee_name}|${c.case_type}|${c.report_date}`;
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(c);
  });

  // Find duplicates
  const duplicates = Object.entries(groups).filter(([key, items]) => items.length > 1);

  if (duplicates.length === 0) {
    console.log('✅ No duplicates found!');
    return;
  }

  console.log(`⚠️  Found ${duplicates.length} duplicate groups\n`);

  const idsToDelete = [];

  duplicates.forEach(([key, items], idx) => {
    const [name, caseType, reportDate] = key.split('|');
    console.log(`${idx + 1}. ${name} - ${caseType} - ${reportDate}`);
    console.log(`   Total: ${items.length} cases`);
    console.log(`   ✅ KEEP: ${items[0].id} (created: ${items[0].created_at})`);
    
    // Delete all except the first one
    for (let i = 1; i < items.length; i++) {
      console.log(`   ❌ DELETE: ${items[i].id} (created: ${items[i].created_at})`);
      idsToDelete.push(items[i].id);
    }
    console.log('');
  });

  console.log(`\n📝 Total IDs to delete: ${idsToDelete.length}`);

  if (!dryRun) {
    console.log('\n🗑️  Deleting duplicates...');
    
    for (const id of idsToDelete) {
      // Delete timeline entries first (foreign key constraint)
      const { error: timelineError } = await supabase
        .from('case_timeline')
        .delete()
        .eq('case_id', id);

      if (timelineError) {
        console.error(`❌ Error deleting timeline for ${id}:`, timelineError.message);
        continue;
      }

      // Delete the case
      const { error: caseError } = await supabase
        .from('employee_cases')
        .delete()
        .eq('id', id);

      if (caseError) {
        console.error(`❌ Error deleting case ${id}:`, caseError.message);
      } else {
        console.log(`✅ Deleted case ${id}`);
      }
    }

    console.log('\n✅ Duplicates removed!');
  } else {
    console.log('\n🔍 DRY RUN - No changes made. Set dryRun=false to actually delete.');
  }
}

// ============================================================================
// UPDATE STATUS FROM EXCEL
// ============================================================================

function mapStatusFromExcel(excelStatus) {
  if (!excelStatus) return 'baru';
  
  const normalized = String(excelStatus).toLowerCase().trim();
  
  const mapping = {
    'selesai': 'selesai',
    'masih proses': 'diproses',
    'diproses': 'diproses',
    'tertunda': 'tertunda',
    'ditutup': 'ditutup',
    'baru': 'baru'
  };

  return mapping[normalized] || 'baru';
}

function parseExcelCasesWithStatus() {
  console.log('\n📖 Reading Excel file with status...');
  
  const workbook = XLSX.readFile('data import kasus.xlsx');
  const sheetName = workbook.SheetNames[0];
  const rawData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: null });

  const cases = [];
  let currentCase = null;
  let lastTahun = null;
  let lastNama = null;
  let lastNip = null;
  let lastUnitKerja = null;
  let lastJenisKasus = null;
  let lastStatus = null;

  rawData.forEach((row, index) => {
    if (row['Timeline Kasus'] === 'Tanggal') return;

    if (row['Tahun']) lastTahun = row['Tahun'];
    if (row['Nama']) lastNama = row['Nama'];
    if (row['NIP']) lastNip = row['NIP'];
    if (row['Unit Kerja']) lastUnitKerja = row['Unit Kerja'];
    if (row['Jenis Kasus']) lastJenisKasus = row['Jenis Kasus'];
    if (row['Status']) lastStatus = row['Status'];

    const isNewCase = row['Tahun'] && row['Nama'] && row['Unit Kerja'] && row['Jenis Kasus'];
    const timelineDate = row['Timeline Kasus'];
    const timelineDetail = row[''] || row['__EMPTY'];
    
    if (isNewCase) {
      if (currentCase) {
        cases.push(currentCase);
      }

      currentCase = {
        tahun: row['Tahun'],
        nama: row['Nama'],
        nip: row['NIP'] || null,
        unitKerja: row['Unit Kerja'],
        jenisKasus: row['Jenis Kasus'],
        status: row['Status'] || lastStatus || null,
        timeline: []
      };

      if (timelineDate && timelineDetail) {
        currentCase.timeline.push({
          tanggal: timelineDate,
          deskripsi: timelineDetail
        });
      }
    } else if (timelineDate && timelineDetail) {
      if (!currentCase && lastTahun && lastNama && lastUnitKerja && lastJenisKasus) {
        currentCase = {
          tahun: lastTahun,
          nama: lastNama,
          nip: lastNip || null,
          unitKerja: lastUnitKerja,
          jenisKasus: lastJenisKasus,
          status: lastStatus || null,
          timeline: []
        };
      }
      
      if (currentCase) {
        currentCase.timeline.push({
          tanggal: timelineDate,
          deskripsi: timelineDetail
        });
      }
    }
  });

  if (currentCase) {
    cases.push(currentCase);
  }

  console.log(`✅ Parsed ${cases.length} cases from Excel\n`);
  
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
  if (!dateStr) {
    return `${fallbackYear}-01-01`;
  }

  const str = String(dateStr).trim();

  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return str;
  }

  if (/^\d{4}$/.test(str)) {
    return `${str}-01-01`;
  }

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
    if (month && year) {
      return `${year}-${month}-${day}`;
    }
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

async function updateStatusFromExcel(dryRun = true) {
  console.log('\n' + '='.repeat(80));
  console.log(`${dryRun ? 'DRY RUN - ' : ''}UPDATING STATUS FROM EXCEL`);
  console.log('='.repeat(80));

  // Parse Excel with status
  const excelCases = parseExcelCasesWithStatus();

  // Get all cases from database
  const { data: dbCases, error } = await supabase
    .from('employee_cases')
    .select('id, employee_name, case_type, report_date, status');

  if (error) {
    console.error('❌ Error fetching cases:', error);
    return;
  }

  console.log(`📊 Database cases: ${dbCases.length}`);
  console.log(`📊 Excel cases: ${excelCases.length}\n`);

  let matchedCount = 0;
  let updatedCount = 0;
  let noStatusCount = 0;

  for (const excelCase of excelCases) {
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
      
      const newStatus = mapStatusFromExcel(excelCase.status);
      
      if (!excelCase.status) {
        noStatusCount++;
        console.log(`⚠️  ${excelCase.nama} - No status in Excel, keeping "baru"`);
        continue;
      }

      if (dbCase.status !== newStatus) {
        console.log(`📝 ${excelCase.nama}`);
        console.log(`   Excel: "${excelCase.status}" -> DB: "${newStatus}"`);
        console.log(`   Current DB status: "${dbCase.status}"`);
        
        if (!dryRun) {
          const { error: updateError } = await supabase
            .from('employee_cases')
            .update({ status: newStatus })
            .eq('id', dbCase.id);

          if (updateError) {
            console.error(`   ❌ Error updating: ${updateError.message}`);
          } else {
            console.log(`   ✅ Updated to "${newStatus}"`);
            updatedCount++;
          }
        } else {
          console.log(`   🔍 Would update to "${newStatus}"`);
          updatedCount++;
        }
      }
    } else {
      console.log(`⚠️  Not found in DB: ${excelCase.nama} - ${caseType}`);
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('STATUS UPDATE SUMMARY');
  console.log('='.repeat(80));
  console.log(`✅ Matched: ${matchedCount}/${excelCases.length}`);
  console.log(`📝 Updated: ${updatedCount}`);
  console.log(`⚠️  No status in Excel: ${noStatusCount}`);
  
  if (dryRun) {
    console.log('\n🔍 DRY RUN - No changes made. Set dryRun=false to actually update.');
  } else {
    console.log('\n✅ Status updated!');
  }
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  try {
    console.log('\n' + '='.repeat(80));
    console.log('FIX DUPLICATES AND STATUS');
    console.log('='.repeat(80));

    // Step 1: Remove duplicates (DRY RUN first)
    await removeDuplicates(true);

    // Step 2: Update status (DRY RUN first)
    await updateStatusFromExcel(true);

    console.log('\n' + '='.repeat(80));
    console.log('NEXT STEPS');
    console.log('='.repeat(80));
    console.log('1. Review the dry run results above');
    console.log('2. If everything looks good, uncomment the lines below to execute:');
    console.log('   - await removeDuplicates(false);');
    console.log('   - await updateStatusFromExcel(false);');
    console.log('='.repeat(80));

    // UNCOMMENT THESE TO ACTUALLY EXECUTE:
    await removeDuplicates(false);
    await updateStatusFromExcel(false);

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

main();
