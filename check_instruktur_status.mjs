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
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
        'Content-Length': Buffer.byteLength(postData)
      }
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(JSON.parse(data));
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function run() {
  console.log('=== STATUS INSTRUKTUR DI DATABASE ===\n');

  // 1. Total instruktur
  const total = await executeSQL(`
    SELECT COUNT(*) as total
    FROM employees
    WHERE position_name ILIKE '%instruktur%'
  `);
  console.log('Total instruktur (position_name mengandung "instruktur"):', total[0].total);

  // 2. Sudah punya kejuruan vs belum
  const status = await executeSQL(`
    SELECT 
      COUNT(*) FILTER (WHERE kejuruan IS NOT NULL AND kejuruan != '') AS sudah_ada_kejuruan,
      COUNT(*) FILTER (WHERE kejuruan IS NULL OR kejuruan = '') AS belum_ada_kejuruan
    FROM employees
    WHERE position_name ILIKE '%instruktur%'
  `);
  console.log('Sudah ada kejuruan:', status[0].sudah_ada_kejuruan);
  console.log('Belum ada kejuruan:', status[0].belum_ada_kejuruan);

  // 3. Breakdown per unit kerja - yang belum punya kejuruan
  console.log('\n=== INSTRUKTUR BELUM ADA KEJURUAN PER UNIT ===');
  const perUnit = await executeSQL(`
    SELECT department, COUNT(*) as jumlah
    FROM employees
    WHERE position_name ILIKE '%instruktur%'
      AND (kejuruan IS NULL OR kejuruan = '')
    GROUP BY department
    ORDER BY jumlah DESC
  `);
  perUnit.forEach(r => console.log(`  ${r.department}: ${r.jumlah}`));

  // 4. Sample data yang belum punya kejuruan (10 pertama)
  console.log('\n=== SAMPLE 20 INSTRUKTUR TANPA KEJURUAN ===');
  const sample = await executeSQL(`
    SELECT nip, name, position_name, department
    FROM employees
    WHERE position_name ILIKE '%instruktur%'
      AND (kejuruan IS NULL OR kejuruan = '')
    ORDER BY department, position_name
    LIMIT 20
  `);
  sample.forEach(r => console.log(`  NIP: ${r.nip || 'N/A'} | ${r.name} | ${r.position_name} | ${r.department}`));

  // 5. Cek apakah ada instruktur dengan position_name berbeda
  console.log('\n=== DISTINCT POSITION_NAME INSTRUKTUR ===');
  const positions = await executeSQL(`
    SELECT DISTINCT position_name, COUNT(*) as jumlah
    FROM employees
    WHERE position_name ILIKE '%instruktur%'
    GROUP BY position_name
    ORDER BY position_name
  `);
  positions.forEach(r => console.log(`  "${r.position_name}": ${r.jumlah}`));
}

run().catch(console.error);
