#!/usr/bin/env node
import https from 'https';

const ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN || ''; // set via env var
const PROJECT_REF = 'mauyygrbdopmpdpnwzra';

async function executeSQL(sql) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({ query: sql });
    const options = {
      hostname: 'api.supabase.com',
      path: `/v1/projects/${PROJECT_REF}/database/query`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${ACCESS_TOKEN}`, 'Content-Length': Buffer.byteLength(postData) }
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => res.statusCode >= 200 && res.statusCode < 300 ? resolve(JSON.parse(data)) : reject(new Error(`${res.statusCode}: ${data}`)));
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function run() {
  // Update 5 instruktur tersisa berdasarkan data Excel
  const updates = [
    ['198908252020121006', 'Otomotif'],       // Jamaluddin - BBPVP Makassar - Pend. Teknik Otomotif
    ['198102242009121003', 'Manufaktur'],      // Muhammad Habibi - BBPVP Makassar - Teknik Mesin
    ['199007222015032008', 'TIK'],             // Vhiera Pesselpa - BPVP Padang - Mahir
    ['198712212012121001', 'Otomotif'],        // Andreas Setiyawan - BPVP Surakarta - Teknik Mesin
    ['198609122009121003', 'Teknologi Informasi dan Komunikasi'], // Surya Purnama Putra - BPVP Surakarta - D3 Teknik Komputer
  ];

  const caseWhen = updates.map(([nip, kej]) => `WHEN nip = '${nip}' THEN '${kej}'`).join('\n    ');
  const nipList = updates.map(([nip]) => `'${nip}'`).join(', ');

  const result = await executeSQL(`
    UPDATE employees
    SET kejuruan = CASE ${caseWhen} ELSE kejuruan END
    WHERE nip IN (${nipList})
  `);
  console.log('Updated:', JSON.stringify(result));

  // Final verification
  const final = await executeSQL(`
    SELECT 
      COUNT(*) FILTER (WHERE kejuruan IS NOT NULL AND kejuruan != '') AS sudah_ada,
      COUNT(*) FILTER (WHERE kejuruan IS NULL OR kejuruan = '') AS belum_ada,
      COUNT(*) AS total_instruktur
    FROM employees
    WHERE position_name ILIKE '%instruktur%'
  `);
  console.log('\n🎉 HASIL AKHIR FINAL:', JSON.stringify(final[0], null, 2));
}

run().catch(console.error);
