import XLSX from 'xlsx';
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
// Use SERVICE_ROLE_KEY for full database access (bypasses RLS)
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  console.error('   Required: VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

console.log('🔑 Using Supabase Service Role Key for import (bypasses RLS)');
const supabase = createClient(supabaseUrl, supabaseKey);

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Parse date from various formats
 */
function parseDate(dateStr, fallbackYear) {
  if (!dateStr) {
    return `${fallbackYear}-01-01`;
  }

  const str = String(dateStr).trim();

  // Already in YYYY-MM-DD format
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return str;
  }

  // Just a year (e.g., "2017")
  if (/^\d{4}$/.test(str)) {
    return `${str}-01-01`;
  }

  // Indonesian date format: "20 April 2016"
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

  // Try to parse as Excel serial date
  if (!isNaN(dateStr) && Number(dateStr) > 40000) {
    const excelDate = XLSX.SSF.parse_date_code(Number(dateStr));
    if (excelDate) {
      const year = excelDate.y;
      const month = String(excelDate.m).padStart(2, '0');
      const day = String(excelDate.d).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
  }

  // Fallback
  console.warn(`⚠️  Could not parse date: "${dateStr}", using fallback: ${fallbackYear}-01-01`);
  return `${fallbackYear}-01-01`;
}

/**
 * Map Jenis Kasus from Excel to database case_type
 */
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

/**
 * Normalize name for matching
 */
function normalizeName(name) {
  return String(name)
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[.,]/g, '');
}

/**
 * Find employee by name or NIP with fuzzy matching
 */
async function findEmployeeByName(name, nip = null) {
  try {
    // If NIP is provided, try to find by NIP first (most accurate)
    if (nip) {
      const cleanNip = String(nip).trim();
      const { data: nipMatch } = await supabase
        .from('employees')
        .select('id, name, nip, position_name, work_unit_name')
        .eq('nip', cleanNip)
        .limit(1)
        .single();

      if (nipMatch) {
        console.log(`  ✅ Found by NIP: ${cleanNip} -> ${nipMatch.name}`);
        return nipMatch;
      }
    }

    const normalized = normalizeName(name);
    
    // Try exact match by name
    const { data: exactMatch } = await supabase
      .from('employees')
      .select('id, name, nip, position_name, work_unit_name')
      .ilike('name', name)
      .limit(1)
      .single();

    if (exactMatch) {
      console.log(`  ✅ Found by exact name: ${name} -> ${exactMatch.name}`);
      return exactMatch;
    }

    // Try fuzzy match - get all employees and match locally
    const { data: allEmployees } = await supabase
      .from('employees')
      .select('id, name, nip, position_name, work_unit_name');

    if (!allEmployees || allEmployees.length === 0) {
      return null;
    }

    // Find best match by normalized name
    for (const emp of allEmployees) {
      const empNormalized = normalizeName(emp.name);
      if (empNormalized === normalized) {
        console.log(`  ✅ Found by normalized name: "${name}" -> "${emp.name}"`);
        return emp;
      }
    }

    // Try partial match
    for (const emp of allEmployees) {
      const empNormalized = normalizeName(emp.name);
      if (empNormalized.includes(normalized) || normalized.includes(empNormalized)) {
        console.log(`  ℹ️  Fuzzy match: "${name}" -> "${emp.name}"`);
        return emp;
      }
    }

    return null;
  } catch (error) {
    console.error(`  ❌ Error finding employee "${name}":`, error.message);
    return null;
  }
}

/**
 * Get admin user ID for created_by field
 */
async function getAdminUserId() {
  try {
    const { data } = await supabase
      .from('profiles')
      .select('id')
      .limit(1)
      .single();

    return data?.id || '00000000-0000-0000-0000-000000000000';
  } catch (error) {
    console.warn('⚠️  Could not get admin user, using placeholder');
    return '00000000-0000-0000-0000-000000000000';
  }
}

// ============================================================================
// EXCEL PARSING WITH MERGED CELL HANDLING
// ============================================================================

/**
 * Read Excel file and handle merged cells properly
 */
function readExcelWithMergedCells(filePath) {
  const workbook = XLSX.readFile(filePath, { cellStyles: true });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  
  // Get the range
  const range = XLSX.utils.decode_range(worksheet['!ref']);
  
  // Handle merged cells
  const merges = worksheet['!merges'] || [];
  
  // Fill in merged cell values
  merges.forEach(merge => {
    const startCell = XLSX.utils.encode_cell({ r: merge.s.r, c: merge.s.c });
    const value = worksheet[startCell]?.v;
    
    // Fill all cells in the merged range with the same value
    for (let row = merge.s.r; row <= merge.e.r; row++) {
      for (let col = merge.s.c; col <= merge.e.c; col++) {
        const cellAddr = XLSX.utils.encode_cell({ r: row, c: col });
        if (!worksheet[cellAddr]) {
          worksheet[cellAddr] = { v: value, t: worksheet[startCell]?.t || 's' };
        }
      }
    }
  });
  
  // Convert to JSON
  const data = XLSX.utils.sheet_to_json(worksheet, { defval: null });
  
  return data;
}

/**
 * Parse cases from Excel with proper merged cell handling
 */
function parseCasesFromExcel(filePath) {
  console.log('📖 Reading Excel file...');
  
  const rawData = XLSX.utils.sheet_to_json(
    XLSX.readFile(filePath).Sheets[XLSX.readFile(filePath).SheetNames[0]],
    { defval: null }
  );
  
  console.log(`📊 Total rows read: ${rawData.length}`);
  
  const cases = [];
  let currentCase = null;
  let lastTahun = null;
  let lastNama = null;
  let lastNip = null;
  let lastUnitKerja = null;
  let lastJenisKasus = null;

  rawData.forEach((row, index) => {
    // Skip header row
    if (row['Timeline Kasus'] === 'Tanggal') {
      return;
    }

    // Update last known values (for merged cells)
    if (row['Tahun']) lastTahun = row['Tahun'];
    if (row['Nama']) lastNama = row['Nama'];
    if (row['NIP']) lastNip = row['NIP'];
    if (row['Unit Kerja']) lastUnitKerja = row['Unit Kerja'];
    if (row['Jenis Kasus']) lastJenisKasus = row['Jenis Kasus'];

    // Check if this is a new case (has all main fields)
    const isNewCase = row['Tahun'] && row['Nama'] && row['Unit Kerja'] && row['Jenis Kasus'];
    
    // Get timeline data - column name is empty string ""
    const timelineDate = row['Timeline Kasus'];
    const timelineDetail = row[''] || row['__EMPTY']; // Try both column names
    
    if (isNewCase) {
      // Save previous case if exists
      if (currentCase) {
        cases.push(currentCase);
      }

      // Start new case
      currentCase = {
        tahun: row['Tahun'],
        nama: row['Nama'],
        nip: row['NIP'] || null,
        unitKerja: row['Unit Kerja'],
        jenisKasus: row['Jenis Kasus'],
        timeline: []
      };

      // Add first timeline entry if exists
      if (timelineDate && timelineDetail) {
        currentCase.timeline.push({
          tanggal: timelineDate,
          deskripsi: timelineDetail
        });
      }
    } else if (timelineDate && timelineDetail) {
      // This is a timeline entry for current case
      if (!currentCase && lastTahun && lastNama && lastUnitKerja && lastJenisKasus) {
        // Create case from last known values (merged cells)
        currentCase = {
          tahun: lastTahun,
          nama: lastNama,
          nip: lastNip || null,
          unitKerja: lastUnitKerja,
          jenisKasus: lastJenisKasus,
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

  // Don't forget the last case
  if (currentCase) {
    cases.push(currentCase);
  }

  console.log(`✅ Parsed ${cases.length} cases from Excel`);
  
  return cases;
}

// ============================================================================
// DATABASE IMPORT
// ============================================================================

/**
 * Import a single case to database
 */
async function importCase(caseData, adminUserId, importLog) {
  const log = {
    nama: caseData.nama,
    tahun: caseData.tahun,
    jenisKasus: caseData.jenisKasus,
    unitKerja: caseData.unitKerja,
    timelineCount: caseData.timeline.length,
    status: 'pending',
    employeeFound: false,
    caseId: null,
    timelineImported: 0,
    errors: []
  };

  try {
    // Find employee by name and NIP
    const employee = await findEmployeeByName(caseData.nama, caseData.nip);
    
    let employeeId, employeeName, employeeNip;
    
    if (employee) {
      log.employeeFound = true;
      employeeId = employee.id;
      employeeName = employee.name;
      employeeNip = employee.nip || 'TIDAK_ADA';
    } else {
      log.employeeFound = false;
      // Create manual entry ID
      employeeId = `MANUAL_${normalizeName(caseData.nama).replace(/\s+/g, '_')}`;
      employeeName = caseData.nama;
      employeeNip = caseData.nip || 'TIDAK_ADA';
      log.errors.push('Employee not found in database, using manual ID');
    }

    // Parse report date from first timeline or use year
    let reportDate = `${caseData.tahun}-01-01`;
    if (caseData.timeline.length > 0) {
      reportDate = parseDate(caseData.timeline[0].tanggal, caseData.tahun);
    }

    // Map case type
    const caseType = mapCaseType(caseData.jenisKasus);

    // Create description from first timeline or summary
    let description = `Kasus ${caseData.jenisKasus} - ${caseData.nama}`;
    if (caseData.timeline.length > 0) {
      description = caseData.timeline[0].deskripsi.substring(0, 500);
    }

    // Insert case
    const { data: insertedCase, error: caseError } = await supabase
      .from('employee_cases')
      .insert({
        employee_id: employeeId,
        employee_name: employeeName,
        employee_nip: employeeNip,
        case_type: caseType,
        status: 'baru',
        severity: null,
        description: description,
        report_date: reportDate,
        case_details: {
          imported: true,
          import_date: new Date().toISOString(),
          original_data: {
            tahun: caseData.tahun,
            unit_kerja: caseData.unitKerja,
            jenis_kasus: caseData.jenisKasus
          }
        },
        created_by: adminUserId
      })
      .select()
      .single();

    if (caseError) {
      log.status = 'failed';
      log.errors.push(`Case insert error: ${caseError.message}`);
      return log;
    }

    log.caseId = insertedCase.id;

    // Insert timeline entries
    for (const timelineEntry of caseData.timeline) {
      try {
        const timelineDate = parseDate(timelineEntry.tanggal, caseData.tahun);
        
        const { error: timelineError } = await supabase
          .from('case_timeline')
          .insert({
            case_id: insertedCase.id,
            date: timelineDate,
            description: timelineEntry.deskripsi,
            status: null,
            documents: [],
            involved_parties_list: []
          });

        if (timelineError) {
          log.errors.push(`Timeline error: ${timelineError.message}`);
        } else {
          log.timelineImported++;
        }
      } catch (timelineErr) {
        log.errors.push(`Timeline parse error: ${timelineErr.message}`);
      }
    }

    log.status = 'success';
    
  } catch (error) {
    log.status = 'failed';
    log.errors.push(`General error: ${error.message}`);
  }

  importLog.push(log);
  return log;
}

/**
 * Import all cases
 */
async function importAllCases(cases, dryRun = false) {
  console.log('\n' + '='.repeat(80));
  console.log(`${dryRun ? 'DRY RUN - ' : ''}IMPORTING CASES TO DATABASE`);
  console.log('='.repeat(80));

  const adminUserId = await getAdminUserId();
  console.log(`👤 Admin User ID: ${adminUserId}\n`);

  const importLog = [];
  let successCount = 0;
  let failedCount = 0;

  for (let i = 0; i < cases.length; i++) {
    const caseData = cases[i];
    console.log(`\n[${i + 1}/${cases.length}] Importing: ${caseData.nama} (${caseData.jenisKasus}, ${caseData.tahun})`);

    if (dryRun) {
      console.log('  🔍 DRY RUN - Skipping actual import');
      const employee = await findEmployeeByName(caseData.nama);
      console.log(`  ${employee ? '✅' : '❌'} Employee found: ${employee ? employee.name : 'NOT FOUND'}`);
      continue;
    }

    const log = await importCase(caseData, adminUserId, importLog);
    
    if (log.status === 'success') {
      successCount++;
      console.log(`  ✅ Success - Case ID: ${log.caseId}, Timeline: ${log.timelineImported}/${log.timelineCount}`);
    } else {
      failedCount++;
      console.log(`  ❌ Failed - Errors: ${log.errors.join(', ')}`);
    }

    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  // Save import log
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const logFileName = `import_log_${timestamp}.json`;
  fs.writeFileSync(logFileName, JSON.stringify(importLog, null, 2));

  console.log('\n' + '='.repeat(80));
  console.log('IMPORT SUMMARY');
  console.log('='.repeat(80));
  console.log(`✅ Success: ${successCount}`);
  console.log(`❌ Failed: ${failedCount}`);
  console.log(`📊 Total: ${cases.length}`);
  console.log(`📝 Log saved to: ${logFileName}`);
  console.log('='.repeat(80));

  return importLog;
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

async function main() {
  try {
    // Parse cases from Excel
    const cases = parseCasesFromExcel('data import kasus.xlsx');

    // Show sample
    console.log('\n📝 SAMPLE CASES (First 3):');
    console.log('='.repeat(80));
    cases.slice(0, 3).forEach((c, idx) => {
      console.log(`\nCase ${idx + 1}:`);
      console.log(`  Tahun: ${c.tahun}`);
      console.log(`  Nama: ${c.nama}`);
      console.log(`  Unit Kerja: ${c.unitKerja}`);
      console.log(`  Jenis Kasus: ${c.jenisKasus}`);
      console.log(`  Timeline entries: ${c.timeline.length}`);
    });

    // Ask for confirmation
    console.log('\n' + '='.repeat(80));
    console.log('⚠️  READY TO IMPORT');
    console.log('='.repeat(80));
    console.log(`Total cases to import: ${cases.length}`);
    console.log('\nOptions:');
    console.log('  1. Run DRY RUN first (recommended)');
    console.log('  2. Import ALL cases');
    console.log('  3. Import first 5 cases (test)');
    console.log('\nTo proceed, edit this script and uncomment the desired option below.\n');

    // UNCOMMENT ONE OF THESE TO RUN:
    
    // Option 1: DRY RUN (check employee matching without importing)
    // await importAllCases(cases.slice(0, 10), true); // Test first 10 cases
    
    // Option 2: Import ALL cases
    await importAllCases(cases, false);
    
    // Option 3: Import first 5 cases (test)
    // await importAllCases(cases.slice(0, 5), false);

    console.log('✅ Script completed.');

  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

main();
