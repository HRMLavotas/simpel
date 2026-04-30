import https from 'https';

// NIPs dari dokumen daftar pegawai
const nips = [
  '198304212025212018', // APRILIA NURHAYATI
  '198409032025212010', // EUIS SUMAIYAH
  '198708302025211013', // IKROM MUJO
  '198811082025211021', // HIDAYAT HARSOYO
  '199004172025211010', // AHMAD ASHIF
  '199210252025211013', // DANU ARI WIBOWO
  '199606272025212018', // NUR AINI (S.Sos)
  '199607252025211006', // AHMAD RIFQI AZIZI
  '198206232009012004', // NUR AINI (S.E., M.M.) - Instruktur Ahli Madya
  '198507012009122003', // DEWI NUR WIDAYATI
  '198309292009121008', // TRI PONCO INDRIYANTO
  '198104232009012005', // NUGRAHENI SRI WINDARTI
  '198202032014032001', // RIKA ARDHIANA MIRANTI
  '199003162014032001', // ARDINA SITA NINGRUM
  '197209302007011001', // SUPENO EDY WITOKO
  '197305041998032002', // RINI LESTYOWATI
  '197603152009012003', // MURNIATI
  '198605252009121002', // SIGIT RASYID RAHARJO
  '197704062011011004', // MOHAMAD SYAIFUL AMIN
  '199506242019022009', // HERLINA TRIA BELA
  '198712092020122009', // MAYA FRANSIKA
  '197612252009122002', // SUSANA
  '198503042009122002', // NANIN WIRASITA WIDIATMI
  '198704192012122003', // ERSTA WIDYANINGRUM
  '197409041996032001', // HESI DAYANI
  '198009292009112001', // VERA SEPTIANI
];

const nipList = nips.map(n => `'${n}'`).join(', ');
const query = `
  UPDATE employees 
  SET position_name = 'Penata Layanan Operasional',
      updated_at = NOW()
  WHERE nip IN (${nipList})
    AND department ILIKE '%Semarang%'
  RETURNING nip, name, position_name, department
`;

function runQuery(q) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ query: q });
    const options = {
      hostname: 'api.supabase.com',
      path: '/v1/projects/mauyygrbdopmpdpnwzra/database/query',
      method: 'POST',
      headers: {
        'Authorization': 'Bearer sbp_3e4ce55f5e201376fe3ac4fc67523d91b6f5e4ed',
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    };
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => resolve(JSON.parse(body)));
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

// Step 1: Update jabatan
console.log('=== STEP 1: Update jabatan ke Penata Layanan Operasional ===\n');
const updateResult = await runQuery(query);

if (updateResult.message) {
  console.error('Update error:', updateResult.message);
  process.exit(1);
}

console.log(`Updated: ${updateResult.length} pegawai`);
updateResult.forEach(r => console.log(`  ✓ ${r.nip} | ${r.name} | ${r.position_name}`));

// Step 2: Cek peta jabatan BBPVP Semarang
console.log('\n=== STEP 2: Cek peta jabatan BBPVP Semarang ===\n');
const checkQuery = `
  SELECT DISTINCT position_name, unit_kerja, jumlah_formasi, jumlah_terisi
  FROM position_map
  WHERE unit_kerja ILIKE '%Semarang%'
    AND position_name ILIKE '%Penata Layanan Operasional%'
  ORDER BY position_name
`;

const petaResult = await runQuery(checkQuery);

if (petaResult.message) {
  // Coba nama tabel lain
  console.log('Tabel position_map tidak ditemukan, mencoba tabel lain...');
  
  const tablesQuery = `
    SELECT table_name FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND (table_name ILIKE '%position%' OR table_name ILIKE '%jabatan%' OR table_name ILIKE '%peta%')
    ORDER BY table_name
  `;
  const tablesResult = await runQuery(tablesQuery);
  console.log('Tabel terkait jabatan:', tablesResult.map(r => r.table_name).join(', '));
} else {
  if (petaResult.length === 0) {
    console.log('⚠️  Jabatan "Penata Layanan Operasional" TIDAK ditemukan di peta jabatan BBPVP Semarang');
    
    // Tampilkan semua jabatan di peta jabatan Semarang
    const allPetaQuery = `
      SELECT DISTINCT position_name FROM position_map
      WHERE unit_kerja ILIKE '%Semarang%'
      ORDER BY position_name
    `;
    const allPeta = await runQuery(allPetaQuery);
    console.log('\nJabatan yang ada di peta jabatan BBPVP Semarang:');
    allPeta.forEach(r => console.log(`  - ${r.position_name}`));
  } else {
    console.log('✅ Jabatan "Penata Layanan Operasional" DITEMUKAN di peta jabatan BBPVP Semarang:');
    petaResult.forEach(r => console.log(`  - ${r.position_name} | Formasi: ${r.jumlah_formasi} | Terisi: ${r.jumlah_terisi}`));
  }
}
