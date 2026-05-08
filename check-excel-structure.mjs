import XLSX from 'xlsx';

const excelFile = 'DAFTAR_PEGAWAI_2026-05-08_.xlsx';
const workbook = XLSX.readFile(excelFile);
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];

console.log('📋 Sheet Names:', workbook.SheetNames);
console.log('\n📊 First 5 rows of data:');

const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

for (let i = 0; i < Math.min(5, data.length); i++) {
  console.log(`Row ${i}:`, data[i]);
}

console.log('\n📊 Data as JSON (first 3 records):');
const jsonData = XLSX.utils.sheet_to_json(worksheet);
console.log(JSON.stringify(jsonData.slice(0, 3), null, 2));
