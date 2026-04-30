import https from 'https';

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

// Cek semua jabatan di peta jabatan BBPVP Semarang
console.log('=== Semua jabatan di peta jabatan BBPVP Semarang ===\n');
const allJabatan = await runQuery(`
  SELECT department, position_category, position_name, abk_count 
  FROM position_references 
  WHERE department ILIKE '%Semarang%' 
  ORDER BY position_category, position_name
`);

if (allJabatan.message) {
  console.log('Error:', allJabatan.message);
  process.exit(1);
}

console.log(`Total jabatan: ${allJabatan.length}\n`);
allJabatan.forEach(r => {
  console.log(`  [${r.position_category}] ${r.position_name} (ABK: ${r.abk_count})`);
});

// Cek khusus Penata Layanan Operasional
console.log('\n=== Cek "Penata Layanan Operasional" ===');
const found = allJabatan.filter(r => 
  r.position_name && r.position_name.toLowerCase().includes('penata layanan operasional')
);

if (found.length > 0) {
  console.log('✅ DITEMUKAN di peta jabatan BBPVP Semarang:');
  found.forEach(r => {
    console.log(`  - ${r.position_name} | Kategori: ${r.position_category} | ABK: ${r.abk_count}`);
  });
} else {
  console.log('⚠️  "Penata Layanan Operasional" TIDAK ADA di peta jabatan BBPVP Semarang');
}
