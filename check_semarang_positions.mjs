import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://mauyygrbdopmpdpnwzra.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1hdXl5Z3JiZG9wbXBkcG53enJhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDkzMTM4NCwiZXhwIjoyMDkwNTA3Mzg0fQ.qMJoz6Xuy4PKwS-LKWpjf_WM5o0fuNtEE4hsgLjJX4Q'
);

// Daftar NIP dari dokumen
const targetNIPs = [
  '198309292009121008', // TRI PONCO INDRIYANTO
  '198507012009122003', // DEWI NUR WIDAYATI
  '199003162014032001', // ARDINA SITA NINGRUM
  '197209302007011001', // SUPENO EDY WITOKO
  '197305041998032002', // RINI LESTYOWATI
  '197603152009012003', // MURNIATI
  '197704062011011004', // MOHAMAD SYAIFUL AMIN
  '198712092020122009', // MAYA FRANSIKA
  '197612252009122002', // SUSANA
  '198009292009112001', // VERA SEPTIANI
  '198503042009122002', // NANIN WIRASITA WIDIATMI
  '198704192012122003', // ERSTA WIDYANINGRUM
  '198605252009121002', // SIGIT RASYID RAHARJO
  '197409041996032001', // HESI DAYANI
  '199004172025211010', // AHMAD ASHIF
  '199607252025211006', // AHMAD RIFQI AZIZI
  '198304212025212018', // APRILIA NURHAYATI
  '199210252025211013', // DANU ARI WIBOWO
  '198409032025212010', // EUIS SUMAIYAH
  '198811082025211021', // HIDAYAT HARSOYO
  '198708302025211013', // IKROM MUJO
  '199606272025212018', // NUR AINI (S.Sos)
  '198202032014032001', // RIKA ARDHIANA MIRANTI
  '199506242019022009', // HERLINA TRIA BELA
  '198104232009012005', // NUGRAHENI SRI WINDARTI
];

console.log('=== CEK DATA JABATAN PEGAWAI BBPVP SEMARANG ===\n');

const { data: employees, error } = await supabase
  .from('employees')
  .select('id, nip, name, position_name, position_sk, department')
  .in('nip', targetNIPs)
  .order('name');

if (error) {
  console.error('Error:', error);
  process.exit(1);
}

console.log(`Ditemukan: ${employees.length} dari ${targetNIPs.length} pegawai\n`);

// Kelompokkan berdasarkan jabatan saat ini
const byPosition = {};
employees.forEach(emp => {
  const pos = emp.position_name || '(kosong)';
  if (!byPosition[pos]) byPosition[pos] = [];
  byPosition[pos].push(emp);
});

console.log('--- Jabatan saat ini ---');
Object.entries(byPosition).forEach(([pos, emps]) => {
  console.log(`\n"${pos}" (${emps.length} orang):`);
  emps.forEach(e => console.log(`  - ${e.name} | NIP: ${e.nip} | SK: ${e.position_sk || '-'}`));
});

// Cek yang sudah benar vs yang perlu diubah
const sudahBenar = employees.filter(e => 
  e.position_name && e.position_name.toLowerCase().includes('penata layanan operasional')
);
const perluDiubah = employees.filter(e => 
  !e.position_name || !e.position_name.toLowerCase().includes('penata layanan operasional')
);

console.log(`\n✅ Sudah "Penata Layanan Operasional": ${sudahBenar.length} orang`);
console.log(`⚠️  Perlu diubah: ${perluDiubah.length} orang`);
if (perluDiubah.length > 0) {
  perluDiubah.forEach(e => console.log(`  - ${e.name}: "${e.position_name || '(kosong)'}"`));
}

// NIP tidak ditemukan
const foundNIPs = employees.map(e => e.nip);
const notFound = targetNIPs.filter(n => !foundNIPs.includes(n));
if (notFound.length > 0) {
  console.log(`\n❌ NIP tidak ditemukan (${notFound.length}):`);
  notFound.forEach(n => console.log(`  - ${n}`));
}

// Cek peta jabatan
console.log('\n\n=== CEK PETA JABATAN BBPVP SEMARANG ===\n');

// Cek tabel yang ada untuk peta jabatan
const tableNames = ['position_map', 'peta_jabatan', 'jabatan', 'positions'];
for (const tbl of tableNames) {
  const { data, error: tblErr } = await supabase
    .from(tbl)
    .select('*')
    .limit(1);
  if (!tblErr) {
    console.log(`✅ Tabel "${tbl}" ditemukan. Kolom: ${Object.keys(data[0] || {}).join(', ')}`);
    
    // Cari jabatan Penata Layanan Operasional di BBPVP Semarang
    const { data: petaData, error: petaErr } = await supabase
      .from(tbl)
      .select('*')
      .ilike('unit_kerja', '%Semarang%');
    
    if (!petaErr && petaData) {
      console.log(`  Total entri BBPVP Semarang: ${petaData.length}`);
      const penata = petaData.filter(p => 
        JSON.stringify(p).toLowerCase().includes('penata layanan operasional')
      );
      if (penata.length > 0) {
        console.log(`  ✅ "Penata Layanan Operasional" DITEMUKAN (${penata.length} entri):`);
        penata.slice(0, 3).forEach(p => console.log('  ', JSON.stringify(p)));
      } else {
        console.log(`  ❌ "Penata Layanan Operasional" tidak ditemukan`);
        if (petaData.length > 0) {
          console.log('  Contoh jabatan yang ada:');
          petaData.slice(0, 5).forEach(p => console.log('  ', JSON.stringify(p)));
        }
      }
    }
  }
}
