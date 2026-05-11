// Test filter logic
const activeSatpelFilter = "Satuan Pelayanan Majene";

const rawEmployees = [
  {
    name: "akun demo tes",
    department: "BBPVP Makassar",
    satuan_kerja_penugasan: "Satuan Pelayanan Majene"
  },
  {
    name: "pegawai lain",
    department: "BBPVP Makassar",
    satuan_kerja_penugasan: null
  },
  {
    name: "pegawai satpel lain",
    department: "BBPVP Makassar",
    satuan_kerja_penugasan: "Satuan Pelayanan Mamuju"
  }
];

const normalizeForComparison = (name) => {
  return name.replace(/^Satpel\s+/, 'Satuan Pelayanan ');
};

const filteredEmployees = activeSatpelFilter
  ? rawEmployees.filter(emp => {
      if (!emp.satuan_kerja_penugasan) {
        console.log(`❌ ${emp.name}: NO satuan_kerja_penugasan`);
        return false;
      }
      
      const normalizedFilter = normalizeForComparison(activeSatpelFilter);
      const normalizedPenugasan = normalizeForComparison(emp.satuan_kerja_penugasan);
      
      const matches = normalizedPenugasan === normalizedFilter;
      
      console.log(`${matches ? '✅' : '❌'} ${emp.name}:`, {
        original: emp.satuan_kerja_penugasan,
        normalized: normalizedPenugasan,
        filter: normalizedFilter,
        matches
      });
      
      return matches;
    })
  : rawEmployees;

console.log('\n=== HASIL FILTER ===');
console.log('Total pegawai sebelum filter:', rawEmployees.length);
console.log('Total pegawai setelah filter:', filteredEmployees.length);
console.log('Pegawai yang lolos filter:', filteredEmployees.map(e => e.name));
