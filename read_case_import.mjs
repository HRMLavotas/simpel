import XLSX from 'xlsx';
import fs from 'fs';

// Read Excel file
const workbook = XLSX.readFile('data import kasus.xlsx');
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];

// Convert to JSON
const data = XLSX.utils.sheet_to_json(worksheet);

console.log('='.repeat(80));
console.log('EXCEL FILE ANALYSIS: data import kasus.xlsx');
console.log('='.repeat(80));

console.log('\n📊 SHEET NAME:', sheetName);
console.log('📈 TOTAL ROWS:', data.length);

if (data.length > 0) {
  console.log('\n📋 COLUMNS:');
  const columns = Object.keys(data[0]);
  columns.forEach((col, idx) => {
    console.log(`  ${idx + 1}. ${col}`);
  });

  console.log('\n📝 FIRST 3 ROWS (Sample Data):');
  console.log('='.repeat(80));
  data.slice(0, 3).forEach((row, idx) => {
    console.log(`\nRow ${idx + 1}:`);
    Object.entries(row).forEach(([key, value]) => {
      console.log(`  ${key}: ${value}`);
    });
  });

  console.log('\n📊 DATA TYPES & SAMPLE VALUES:');
  console.log('='.repeat(80));
  const firstRow = data[0];
  Object.entries(firstRow).forEach(([key, value]) => {
    const type = typeof value;
    console.log(`  ${key}:`);
    console.log(`    Type: ${type}`);
    console.log(`    Sample: ${value}`);
  });

  // Save to JSON for easier inspection
  fs.writeFileSync('case_import_data.json', JSON.stringify(data, null, 2));
  console.log('\n✅ Data exported to: case_import_data.json');
}

console.log('\n' + '='.repeat(80));
