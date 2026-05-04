#!/usr/bin/env node
// Update sisa 28 instruktur dari Direktorat yang tidak ada di file Excel
// Kejuruan diisi berdasarkan unit kerja (Produktivitas untuk Direktorat Produktivitas, dll)

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
  // Instruktur di Direktorat Bina Peningkatan Produktivitas -> Produktivitas
  const r1 = await executeSQL(`
    UPDATE employees
    SET kejuruan = 'Produktivitas'
    WHERE position_name ILIKE '%instruktur%'
      AND (kejuruan IS NULL OR kejuruan = '')
      AND department = 'Direktorat Bina Peningkatan Produktivitas'
  `);
  console.log('Direktorat Produktivitas updated:', JSON.stringify(r1));

  // Instruktur di Direktorat Bina Penyelenggaraan Latvogan -> Metodologi Pelatihan
  const r2 = await executeSQL(`
    UPDATE employees
    SET kejuruan = 'Metodologi Pelatihan'
    WHERE position_name ILIKE '%instruktur%'
      AND (kejuruan IS NULL OR kejuruan = '')
      AND department = 'Direktorat Bina Penyelenggaraan Latvogan'
  `);
  console.log('Direktorat Latvogan updated:', JSON.stringify(r2));

  // Instruktur di Direktorat Bina Stankomproglat -> Metodologi Pelatihan
  const r3 = await executeSQL(`
    UPDATE employees
    SET kejuruan = 'Metodologi Pelatihan'
    WHERE position_name ILIKE '%instruktur%'
      AND (kejuruan IS NULL OR kejuruan = '')
      AND department = 'Direktorat Bina Stankomproglat'
  `);
  console.log('Direktorat Stankomproglat updated:', JSON.stringify(r3));

  // Sisa lainnya (unit lain yang mungkin ada)
  const r4 = await executeSQL(`
    UPDATE employees
    SET kejuruan = 'Metodologi Pelatihan'
    WHERE position_name ILIKE '%instruktur%'
      AND (kejuruan IS NULL OR kejuruan = '')
      AND department NOT LIKE '%BBPVP%'
      AND department NOT LIKE '%BPVP%'
      AND department NOT LIKE '%Satpel%'
  `);
  console.log('Unit lain updated:', JSON.stringify(r4));

  // Verifikasi final
  const final = await executeSQL(`
    SELECT 
      COUNT(*) FILTER (WHERE kejuruan IS NOT NULL AND kejuruan != '') AS sudah_ada,
      COUNT(*) FILTER (WHERE kejuruan IS NULL OR kejuruan = '') AS belum_ada,
      COUNT(*) AS total_instruktur
    FROM employees
    WHERE position_name ILIKE '%instruktur%'
  `);
  console.log('\n✅ HASIL AKHIR:', JSON.stringify(final[0], null, 2));
}

run().catch(console.error);
