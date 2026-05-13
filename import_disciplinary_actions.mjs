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
// PARSE HUKDIS DATA FROM EXCEL
// ============================================================================

function parseHukdisLevel(skHukdis) {
  if (!skHukdis) return null;
  
  const text = String(skHukdis).toLowerCase();
  
  if (text.includes('hukdis berat') || text.includes('hukuman disiplin berat')) {
    return 'berat';
  }
  if (text.includes('hukdis sedang') || text.includes('hukuman disiplin sedang')) {
    return 'sedang';
  }
  if (text.includes('hukdis ringan') || text.includes('hukuman disiplin ringan')) {
    return 'ringan';
  }
  
  return null;
}

function extractEffectiveDate(skHukdis, keteranganHukdis) {
  // Try both SK Hukdis and Keterangan Hukdis
  const texts = [skHukdis, keteranganHukdis].filter(Boolean);
  
  for (const text of texts) {
    const str = String(text);
    
    // Look for "TMT" followed by date
    const tmtMatch = str.match(/TMT\s+(\d{1,2})\s+(\w+)\s+(\d{4})/i);
    if (tmtMatch) {
      const day = tmtMatch[1].padStart(2, '0');
      const monthName = tmtMatch[2].toLowerCase();
      const year = tmtMatch[3];
      
      const monthMap = {
        januari: '01', februari: '02', maret: '03', april: '04',
        mei: '05', juni: '06', juli: '07', agustus: '08',
        september: '09', oktober: '10', november: '11', desember: '12',
        january: '01', february: '02', march: '03', may: '05',
        june: '06', july: '07', august: '08', october: '10', december: '12'
      };
      
      const month = monthMap[monthName];
      if (month) {
        return `${year}-${month}-${day}`;
      }
    }
  }
  
  return null;
}

function extractPunishmentType(skHukdis) {
  if (!skHukdis) return null;
  
  const text = String(skHukdis);
  
  // Extract text in parentheses
  const match = text.match(/\((.*?)\)/);
  if (match) {
    return match[1].trim();
  }
  
  return null;
}

function parseExcelWithHukdis() {
  console.log('\n📖 Reading Excel file with Hukdis data...');
  
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
  let lastSkHukdis = null;
  let lastKeteranganHukdis = null;

  rawData.forEach((row, index) => {
    if (row['Timeline Kasus'] === 'Tanggal') return;

    if (row['Tahun']) lastTahun = row['Tahun'];
    if (row['Nama']) lastNama = row['Nama'];
    if (row['NIP']) lastNip = row['NIP'];
    if (row['Unit Kerja']) lastUnitKerja = row['Unit Kerja'];
    if (row['Jenis Kasus']) lastJenisKasus = row['Jenis Kasus'];
    if (row['Status']) lastStatus = row['Status'];
    if (row['SK Hukdis']) lastSkHukdis = row['SK Hukdis'];
    if (row['Keterangan Hukdis']) lastKeteranganHukdis = row['Keterangan Hukdis'];

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
        skHukdis: row['SK Hukdis'] || lastSkHukdis || null,
        keteranganHukdis: row['Keterangan Hukdis'] || lastKeteranganHukdis || null,
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
          skHukdis: lastSkHukdis || null,
          keteranganHukdis: lastKeteranganHukdis || null,
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

// ============================================================================
// IMPORT DISCIPLINARY ACTIONS
// ============================================================================

async function importDisciplinaryActions(dryRun = true) {
  console.log('\n' + '='.repeat(80));
  console.log(`${dryRun ? 'DRY RUN - ' : ''}IMPORTING DISCIPLINARY ACTIONS FROM EXCEL`);
  console.log('='.repeat(80));

  // Parse Excel with hukdis data
  const excelCases = parseExcelWithHukdis();

  // Get all cases from database
  const { data: dbCases, error } = await supabase
    .from('employee_cases')
    .select('id, employee_id, employee_name, employee_nip, case_type, report_date');

  if (error) {
    console.error('❌ Error fetching cases:', error);
    return;
  }

  // Get admin user ID for created_by
  const { data: adminUser } = await supabase
    .from('profiles')
    .select('id')
    .limit(1)
    .single();
  
  const createdBy = adminUser?.id || '00000000-0000-0000-0000-000000000000';

  console.log(`📊 Database cases: ${dbCases.length}`);
  console.log(`📊 Excel cases: ${excelCases.length}\n`);

  let matchedCount = 0;
  let withHukdisCount = 0;
  let importedCount = 0;
  let skippedCount = 0;

  const importLog = [];

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
      
      // Check if has hukdis data
      if (excelCase.skHukdis || excelCase.keteranganHukdis) {
        withHukdisCount++;
        
        const level = parseHukdisLevel(excelCase.skHukdis);
        const effectiveDate = extractEffectiveDate(excelCase.skHukdis, excelCase.keteranganHukdis);
        const punishmentType = extractPunishmentType(excelCase.skHukdis);
        
        if (level) {
          console.log(`\n📝 ${excelCase.nama}`);
          console.log(`   Case ID: ${dbCase.id}`);
          console.log(`   Level: ${level}`);
          console.log(`   SK Hukdis: ${excelCase.skHukdis}`);
          console.log(`   Keterangan: ${excelCase.keteranganHukdis || '-'}`);
          console.log(`   Punishment Type: ${punishmentType || '-'}`);
          console.log(`   Effective Date: ${effectiveDate || '-'}`);
          
          const logEntry = {
            employee_name: excelCase.nama,
            case_id: dbCase.id,
            level: level,
            punishment_type: punishmentType,
            effective_date: effectiveDate,
            sk_hukdis: excelCase.skHukdis,
            keterangan: excelCase.keteranganHukdis,
            status: 'pending'
          };
          
          if (!dryRun) {
            // Check if already exists
            const { data: existing } = await supabase
              .from('disciplinary_actions')
              .select('id')
              .eq('case_id', dbCase.id)
              .limit(1)
              .single();
            
            if (existing) {
              console.log(`   ⚠️  Already exists, skipping`);
              skippedCount++;
              logEntry.status = 'skipped';
            } else {
              // Insert disciplinary action
              const { error: insertError } = await supabase
                .from('disciplinary_actions')
                .insert({
                  case_id: dbCase.id,
                  employee_id: dbCase.employee_id,
                  employee_name: dbCase.employee_name,
                  employee_nip: dbCase.employee_nip,
                  level: level,
                  type: punishmentType || 'Tidak disebutkan',
                  decision_number: excelCase.skHukdis || 'Tidak ada nomor SK',
                  decision_date: effectiveDate || reportDate,
                  effective_date: effectiveDate || reportDate,
                  end_date: null,
                  issued_by: 'Kepala Balai',
                  violation: `Kasus ${excelCase.jenisKasus}`,
                  notes: excelCase.keteranganHukdis,
                  document_link: null,
                  created_by: createdBy
                });

              if (insertError) {
                console.log(`   ❌ Error: ${insertError.message}`);
                logEntry.status = 'failed';
                logEntry.error = insertError.message;
              } else {
                console.log(`   ✅ Imported`);
                importedCount++;
                logEntry.status = 'success';
              }
            }
          } else {
            console.log(`   🔍 Would import`);
            importedCount++;
          }
          
          importLog.push(logEntry);
        } else {
          console.log(`\n⚠️  ${excelCase.nama} - Has hukdis data but level not recognized`);
          console.log(`   SK Hukdis: ${excelCase.skHukdis}`);
        }
      }
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('IMPORT SUMMARY');
  console.log('='.repeat(80));
  console.log(`✅ Matched cases: ${matchedCount}/${excelCases.length}`);
  console.log(`📋 Cases with hukdis data: ${withHukdisCount}`);
  console.log(`📝 Imported: ${importedCount}`);
  console.log(`⚠️  Skipped (already exists): ${skippedCount}`);
  
  if (dryRun) {
    console.log('\n🔍 DRY RUN - No changes made. Set dryRun=false to actually import.');
  } else {
    console.log('\n✅ Import completed!');
  }
  
  // Save log
  const fs = await import('fs');
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const logFileName = `hukdis_import_log_${timestamp}.json`;
  fs.default.writeFileSync(logFileName, JSON.stringify(importLog, null, 2));
  console.log(`📝 Log saved to: ${logFileName}`);
}

// ============================================================================
// ANALYZE HUKDIS DATA
// ============================================================================

async function analyzeHukdisData() {
  console.log('\n' + '='.repeat(80));
  console.log('ANALYZING HUKDIS DATA IN EXCEL');
  console.log('='.repeat(80));

  const excelCases = parseExcelWithHukdis();
  
  let withSkHukdis = 0;
  let withKeterangan = 0;
  let withBoth = 0;
  
  const levelCounts = {
    ringan: 0,
    sedang: 0,
    berat: 0,
    unknown: 0
  };

  console.log('\n📋 Sample Hukdis Data:\n');

  excelCases.forEach((c, idx) => {
    if (c.skHukdis) withSkHukdis++;
    if (c.keteranganHukdis) withKeterangan++;
    if (c.skHukdis && c.keteranganHukdis) withBoth++;
    
    const level = parseHukdisLevel(c.skHukdis);
    if (level) {
      levelCounts[level]++;
    } else if (c.skHukdis) {
      levelCounts.unknown++;
    }
    
    // Show first 5 samples
    if (idx < 5 && (c.skHukdis || c.keteranganHukdis)) {
      console.log(`${idx + 1}. ${c.nama}`);
      console.log(`   SK Hukdis: ${c.skHukdis || '-'}`);
      console.log(`   Keterangan: ${c.keteranganHukdis || '-'}`);
      console.log(`   Parsed Level: ${level || 'N/A'}`);
      console.log(`   Effective Date: ${extractEffectiveDate(c.keteranganHukdis) || 'N/A'}`);
      console.log(`   Punishment Type: ${extractPunishmentType(c.keteranganHukdis) || 'N/A'}`);
      console.log('');
    }
  });

  console.log('='.repeat(80));
  console.log('SUMMARY');
  console.log('='.repeat(80));
  console.log(`Total cases: ${excelCases.length}`);
  console.log(`With SK Hukdis: ${withSkHukdis}`);
  console.log(`With Keterangan Hukdis: ${withKeterangan}`);
  console.log(`With both: ${withBoth}`);
  console.log('\nLevel Distribution:');
  console.log(`  Ringan: ${levelCounts.ringan}`);
  console.log(`  Sedang: ${levelCounts.sedang}`);
  console.log(`  Berat: ${levelCounts.berat}`);
  console.log(`  Unknown: ${levelCounts.unknown}`);
  console.log('='.repeat(80));
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  try {
    // First, analyze the data
    await analyzeHukdisData();

    // Then, import (dry run first)
    await importDisciplinaryActions(true);

    console.log('\n' + '='.repeat(80));
    console.log('NEXT STEPS');
    console.log('='.repeat(80));
    console.log('1. Review the analysis and dry run results above');
    console.log('2. If everything looks good, uncomment the line below to execute:');
    console.log('   - await importDisciplinaryActions(false);');
    console.log('='.repeat(80));

    // UNCOMMENT TO ACTUALLY IMPORT:
    await importDisciplinaryActions(false);

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

main();
