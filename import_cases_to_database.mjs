import XLSX from 'xlsx';
import fs from 'fs';

// Read Excel file
const workbook = XLSX.readFile('data import kasus.xlsx');
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];
const rawData = XLSX.utils.sheet_to_json(worksheet);

console.log('='.repeat(80));
console.log('MAPPING EXCEL DATA TO DATABASE STRUCTURE');
console.log('='.repeat(80));

// Parse and group data
const cases = [];
let currentCase = null;

rawData.forEach((row, index) => {
  // Skip header row
  if (row['Timeline Kasus'] === 'Tanggal') {
    return;
  }

  // Check if this is a new case (has Tahun, Nama, Unit Kerja, Jenis Kasus)
  if (row['Tahun'] && row['Nama'] && row['Unit Kerja'] && row['Jenis Kasus']) {
    // Save previous case if exists
    if (currentCase) {
      cases.push(currentCase);
    }

    // Start new case
    currentCase = {
      tahun: row['Tahun'],
      nama: row['Nama'],
      unitKerja: row['Unit Kerja'],
      jenisKasus: row['Jenis Kasus'],
      timeline: []
    };

    // Add first timeline entry if exists
    if (row['Timeline Kasus'] && row['__EMPTY']) {
      currentCase.timeline.push({
        tanggal: row['Timeline Kasus'],
        deskripsi: row['__EMPTY']
      });
    }
  } else if (currentCase && row['Timeline Kasus'] && row['__EMPTY']) {
    // Add timeline to current case
    currentCase.timeline.push({
      tanggal: row['Timeline Kasus'],
      deskripsi: row['__EMPTY']
    });
  }
});

// Don't forget the last case
if (currentCase) {
  cases.push(currentCase);
}

console.log(`\n✅ Parsed ${cases.length} cases from Excel`);

// Analyze data structure
console.log('\n📊 DATA STRUCTURE ANALYSIS:');
console.log('='.repeat(80));

// Jenis Kasus distribution
const jenisKasusCount = {};
cases.forEach(c => {
  jenisKasusCount[c.jenisKasus] = (jenisKasusCount[c.jenisKasus] || 0) + 1;
});

console.log('\n📋 Jenis Kasus Distribution:');
Object.entries(jenisKasusCount).sort((a, b) => b[1] - a[1]).forEach(([jenis, count]) => {
  console.log(`  ${jenis}: ${count} cases`);
});

// Year distribution
const yearCount = {};
cases.forEach(c => {
  yearCount[c.tahun] = (yearCount[c.tahun] || 0) + 1;
});

console.log('\n📅 Year Distribution:');
Object.entries(yearCount).sort((a, b) => a[0] - b[0]).forEach(([year, count]) => {
  console.log(`  ${year}: ${count} cases`);
});

// Unit Kerja distribution
const unitKerjaCount = {};
cases.forEach(c => {
  unitKerjaCount[c.unitKerja] = (unitKerjaCount[c.unitKerja] || 0) + 1;
});

console.log('\n🏢 Top 10 Unit Kerja:');
Object.entries(unitKerjaCount)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 10)
  .forEach(([unit, count]) => {
    console.log(`  ${unit}: ${count} cases`);
  });

// Timeline statistics
const timelineCounts = cases.map(c => c.timeline.length);
const avgTimeline = timelineCounts.reduce((a, b) => a + b, 0) / timelineCounts.length;
const maxTimeline = Math.max(...timelineCounts);
const minTimeline = Math.min(...timelineCounts);

console.log('\n📈 Timeline Statistics:');
console.log(`  Average timeline entries per case: ${avgTimeline.toFixed(2)}`);
console.log(`  Max timeline entries: ${maxTimeline}`);
console.log(`  Min timeline entries: ${minTimeline}`);

// Sample cases
console.log('\n📝 SAMPLE CASES (First 3):');
console.log('='.repeat(80));
cases.slice(0, 3).forEach((c, idx) => {
  console.log(`\nCase ${idx + 1}:`);
  console.log(`  Tahun: ${c.tahun}`);
  console.log(`  Nama: ${c.nama}`);
  console.log(`  Unit Kerja: ${c.unitKerja}`);
  console.log(`  Jenis Kasus: ${c.jenisKasus}`);
  console.log(`  Timeline entries: ${c.timeline.length}`);
  if (c.timeline.length > 0) {
    console.log(`  First timeline:`);
    console.log(`    Tanggal: ${c.timeline[0].tanggal}`);
    console.log(`    Deskripsi: ${c.timeline[0].deskripsi.substring(0, 100)}...`);
  }
});

// Create mapping document
const mapping = {
  excelStructure: {
    columns: ['Tahun', 'Nama', 'Unit Kerja', 'Jenis Kasus', 'Timeline Kasus', '__EMPTY (Detail Timeline)'],
    description: 'Excel has nested structure where timeline entries follow the main case row'
  },
  databaseStructure: {
    employee_cases: {
      id: 'UUID (auto-generated)',
      case_number: 'TEXT (auto-generated)',
      employee_id: 'TEXT (from employees table or manual)',
      employee_name: 'TEXT (from Excel: Nama)',
      employee_nip: 'TEXT (lookup from employees table)',
      case_type: 'TEXT (map from Excel: Jenis Kasus)',
      status: 'TEXT (default: baru)',
      severity: 'TEXT (null or default)',
      description: 'TEXT (from first timeline or summary)',
      report_date: 'DATE (from Excel: first Timeline Kasus date)',
      case_details: 'JSONB (store original data)',
      created_by: 'UUID (admin user)',
      created_at: 'TIMESTAMPTZ (now)',
      updated_at: 'TIMESTAMPTZ (now)'
    },
    case_timeline: {
      id: 'UUID (auto-generated)',
      case_id: 'UUID (reference to employee_cases)',
      date: 'DATE (from Excel: Timeline Kasus)',
      description: 'TEXT (from Excel: __EMPTY)',
      status: 'TEXT (empty or derived)',
      documents: 'JSONB (empty array)',
      created_at: 'TIMESTAMPTZ (now)',
      updated_at: 'TIMESTAMPTZ (now)'
    }
  },
  mappingRules: {
    jenisKasus: {
      'Perceraian': 'perceraian',
      'Hutang': 'hutang',
      'Pinjaman Online': 'pinjaman_online',
      'Presensi': 'presensi',
      'Pengunduran Diri': 'pengunduran_diri',
      'Temuan': 'temuan',
      'Dan Lain-lain': 'lainnya',
      'default': 'lainnya'
    },
    status: 'baru (default for all imported cases)',
    severity: 'null (not specified in Excel)',
    reportDate: 'Parse from first timeline date or use year',
    employeeId: 'Lookup from employees table by name, or create manual entry',
    employeeNip: 'Lookup from employees table, or use placeholder'
  },
  challenges: [
    'Employee names in Excel may not match exactly with employees table',
    'NIP not provided in Excel - need to lookup or use placeholder',
    'Timeline dates are in various formats (need parsing)',
    'Some timeline dates are just year (2017) without specific date',
    'Unit Kerja names may not match work_units table exactly',
    'Need to handle cases where employee not found in database'
  ],
  recommendations: [
    'Create manual employee entries for cases where employee not found',
    'Use fuzzy matching for employee names',
    'Parse timeline dates carefully with fallback to year-01-01',
    'Store original Excel data in case_details for reference',
    'Mark imported cases with a flag in case_details',
    'Create import log to track success/failures'
  ]
};

// Save parsed data and mapping
fs.writeFileSync('parsed_cases.json', JSON.stringify(cases, null, 2));
fs.writeFileSync('case_import_mapping.json', JSON.stringify(mapping, null, 2));

console.log('\n✅ Files created:');
console.log('  - parsed_cases.json (structured case data)');
console.log('  - case_import_mapping.json (mapping documentation)');

console.log('\n' + '='.repeat(80));
console.log('NEXT STEPS:');
console.log('='.repeat(80));
console.log('1. Review parsed_cases.json to verify data structure');
console.log('2. Review case_import_mapping.json for mapping rules');
console.log('3. Create import script with employee lookup logic');
console.log('4. Test import with small batch first');
console.log('5. Run full import with error handling');
console.log('='.repeat(80));
