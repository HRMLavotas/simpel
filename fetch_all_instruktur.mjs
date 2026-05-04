#!/usr/bin/env node
// Ambil semua instruktur dari DB yang belum punya kejuruan

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
  const rows = await executeSQL(`
    SELECT nip, name, position_name, department, kejuruan
    FROM employees
    WHERE position_name ILIKE '%instruktur%'
      AND (kejuruan IS NULL OR kejuruan = '')
    ORDER BY department, position_name, name
    LIMIT 2000
  `);

  console.log(`Total instruktur tanpa kejuruan: ${rows.length}\n`);
  
  // Print as CSV for easy processing
  console.log('nip,name,position_name,department');
  rows.forEach(r => {
    const nip = (r.nip || '').replace(/,/g, '');
    const name = (r.name || '').replace(/,/g, ' ');
    const pos = (r.position_name || '').replace(/,/g, ' ');
    const dept = (r.department || '').replace(/,/g, ' ');
    console.log(`${nip},${name},${pos},${dept}`);
  });
}

run().catch(console.error);
