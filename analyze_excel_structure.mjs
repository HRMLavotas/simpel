import XLSX from 'xlsx';

// Read Excel file
const workbook = XLSX.readFile('data import kasus.xlsx', { cellStyles: true });
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];

console.log('='.repeat(80));
console.log('ANALYZING EXCEL STRUCTURE');
console.log('='.repeat(80));

// Show merged cells
console.log('\n📋 MERGED CELLS:');
if (worksheet['!merges']) {
  console.log(`Total merged ranges: ${worksheet['!merges'].length}`);
  worksheet['!merges'].slice(0, 10).forEach((merge, idx) => {
    const startCell = XLSX.utils.encode_cell({ r: merge.s.r, c: merge.s.c });
    const endCell = XLSX.utils.encode_cell({ r: merge.e.r, c: merge.e.c });
    const value = worksheet[startCell]?.v;
    console.log(`  ${idx + 1}. ${startCell}:${endCell} = "${value}"`);
  });
}

// Show first 20 rows raw
console.log('\n📊 FIRST 20 ROWS (RAW):');
console.log('='.repeat(80));

const range = XLSX.utils.decode_range(worksheet['!ref']);
const headers = [];

// Get headers (row 0)
for (let col = range.s.c; col <= range.e.c; col++) {
  const cellAddr = XLSX.utils.encode_cell({ r: 0, c: col });
  const cell = worksheet[cellAddr];
  headers.push(cell ? cell.v : `COL_${col}`);
}

console.log('Headers:', headers);
console.log('-'.repeat(80));

// Show first 20 data rows
for (let row = 1; row <= Math.min(20, range.e.r); row++) {
  const rowData = {};
  for (let col = range.s.c; col <= range.e.c; col++) {
    const cellAddr = XLSX.utils.encode_cell({ r: row, c: col });
    const cell = worksheet[cellAddr];
    rowData[headers[col]] = cell ? cell.v : null;
  }
  
  // Only show rows with some data
  if (Object.values(rowData).some(v => v !== null)) {
    console.log(`\nRow ${row}:`);
    Object.entries(rowData).forEach(([key, value]) => {
      if (value !== null) {
        console.log(`  ${key}: ${value}`);
      }
    });
  }
}

console.log('\n' + '='.repeat(80));
