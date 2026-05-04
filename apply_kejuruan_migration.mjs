#!/usr/bin/env node

/**
 * Apply kejuruan migration via Supabase Management API
 * Menambahkan kolom kejuruan ke tabel employees
 */

import https from 'https';

const ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN || ''; // set via env var
const PROJECT_REF = 'mauyygrbdopmpdpnwzra';

const migrationSQL = `
ALTER TABLE public.employees
ADD COLUMN IF NOT EXISTS kejuruan VARCHAR(100);

COMMENT ON COLUMN public.employees.kejuruan IS 'Kejuruan instruktur (hanya diisi jika jabatan adalah Instruktur), contoh: Otomotif, TIK, Las, Manufaktur';
`;

async function executeSQLViaManagementAPI(sql) {
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
        console.log(`Response Status: ${res.statusCode}`);
        console.log(`Response Body: ${data}`);
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({ success: true, statusCode: res.statusCode, data });
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

async function runMigration() {
  console.log('🔧 Kejuruan Column Migration (Management API)');
  console.log('===============================================\n');
  
  try {
    console.log('🚀 Applying migration: ADD COLUMN kejuruan...');
    await executeSQLViaManagementAPI(migrationSQL);
    console.log('\n✅ Migration applied successfully!');
    
    console.log('\n📋 Verifying column...');
    await executeSQLViaManagementAPI(`
      SELECT column_name, data_type, character_maximum_length
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'employees'
        AND column_name = 'kejuruan'
    `);
    
    console.log('\n✨ Done! Kolom "kejuruan" berhasil ditambahkan ke tabel employees.');
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('\n📋 Manual SQL to run in Supabase Dashboard SQL Editor:');
    console.error('---');
    console.error(migrationSQL);
    console.error('---');
    process.exit(1);
  }
}

runMigration();
