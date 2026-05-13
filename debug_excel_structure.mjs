import XLSX from 'xlsx';

// Read Excel file
const workbook = XLSX.readFile('data import kasus.xlsx', { cellStyles: true });
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];

console.log('📊 EXCEL STRUCTURE DEBUG');
console.log('='.repeat(80));

// Get range
const range = XLSX.utils.decode_range(worksheet['!ref']);
console.log(`\n📐 Range: ${worksheet['!ref']}`);
console.log(`   Rows: ${range.s.r} to ${range.e.r} (${range.e.r - range.s.r + 1} rows)`);
console.log(`   Cols: ${range.s.c} to ${range.e.c} (${range.e.c - range.s.c + 1} cols)`);

// Check merged cells
const merges = worksheet['!merges'] || [];
console.log(`\n🔗 Merged Cells: ${merges.length} ranges`);
if (merges.length > 0) {
  console.log('\nFirst 10 merged ranges:');
  merges.slice(0, 10).forEach((merge, idx) => {
    const startCell = XLSX.utils.encode_cell({ r: merge.s.r, c: merge.s.c });
    const endCell = XLSX.utils.encode_cell({ r: merge.e.r, c: merge.e.c });
    const value = worksheet[startCell]?.v;
    console.log(`  ${idx + 1}. ${startCell}:${endCell} = "${value}"`);
  });
}

// Show first 20 rows raw
console.log('\n📋 FIRST 20 ROWS (RAW):');
console.log('='.repeat(80));

for (let row = 0; row < Math.min(20, range.e.r + 1); row++) {
  const rowData = [];
  for (let col = range.s.c; col <= range.e.c; col++) {
    const cellAddr = XLSX.utils.encode_cell({ r: row, c: col });
    const cell = worksheet[cellAddr];
    rowData.push(cell ? String(cell.v).substring(0, 30) : '');
  }
  console.log(`Row ${row}: [${rowData.join(' | ')}]`);
}

// Convert to JSON and show structure
console.log('\n📊 JSON CONVERSION (First 20 rows):');
console.log('='.repeat(80));

const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: null });
jsonData.slice(0, 20).forEach((row, idx) => {
  console.log(`\nRow ${idx}:`, JSON.stringify(row, null, 2));
});

console.log('\n✅ Debug complete');
