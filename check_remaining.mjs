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
  const rows = await executeSQL(`
    SELECT nip, name, position_name, department
    FROM employees
    WHERE position_name ILIKE '%instruktur%'
      AND (kejuruan IS NULL OR kejuruan = '')
    ORDER BY department, name
  `);
  console.log(`Sisa instruktur tanpa kejuruan: ${rows.length}\n`);
  rows.forEach(r => console.log(`NIP: ${r.nip || 'N/A'} | ${r.name} | ${r.position_name} | ${r.department}`));
}
run().catch(console.error);
