import fs from 'fs';

const log = JSON.parse(fs.readFileSync('import_log_2026-05-13T04-44-48-843Z.json'));

const found = log.filter(l => l.employeeFound);
const notFound = log.filter(l => !l.employeeFound);

console.log('📊 IMPORT STATISTICS');
console.log('='.repeat(80));
console.log(`Total cases imported: ${log.length}`);
console.log(`✅ Employees found in DB: ${found.length}`);
console.log(`❌ Employees NOT found (manual ID): ${notFound.length}`);
console.log(`📝 Total timeline entries: ${log.reduce((sum, l) => sum + l.timelineImported, 0)}`);

console.log('\n✅ Sample employees FOUND in database:');
found.slice(0, 10).forEach(l => {
  console.log(`  - ${l.nama} (${l.jenisKasus}, ${l.tahun})`);
});

console.log('\n❌ Sample employees NOT FOUND (using manual ID):');
notFound.slice(0, 10).forEach(l => {
  console.log(`  - ${l.nama} (${l.jenisKasus}, ${l.tahun})`);
});

// Check for errors
const withErrors = log.filter(l => l.errors && l.errors.length > 0);
console.log(`\n⚠️  Cases with warnings: ${withErrors.length}`);
if (withErrors.length > 0) {
  console.log('\nSample warnings:');
  withErrors.slice(0, 5).forEach(l => {
    console.log(`  - ${l.nama}: ${l.errors.join(', ')}`);
  });
}
