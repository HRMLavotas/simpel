#!/usr/bin/env node

/**
 * Apply migration via Supabase REST API
 * Menggunakan service role key untuk execute SQL
 */

import https from 'https';

const SUPABASE_URL = 'https://mauyygrbdopmpdpnwzra.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1hdXl5Z3JiZG9wbXBkcG53enJhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDkzMTM4NCwiZXhwIjoyMDkwNTA3Mzg0fQ.qMJoz6Xuy4PKwS-LKWpjf_WM5o0fuNtEE4hsgLjJX4Q';

const migrationSQL = `
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS data_builder_templates jsonb DEFAULT '[]'::jsonb;

COMMENT ON COLUMN profiles.data_builder_templates IS 'User saved query templates for Data Builder stored as JSON array';
`;

async function executeSQLViaRPC(sql) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({ query: sql });
    
    const options = {
      hostname: 'mauyygrbdopmpdpnwzra.supabase.co',
      path: '/rest/v1/rpc/exec_sql',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({ success: true, statusCode: res.statusCode, data: data });
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

async function verifyColumn() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'mauyygrbdopmpdpnwzra.supabase.co',
      path: '/rest/v1/rpc/exec_sql',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      }
    };

    const postData = JSON.stringify({
      query: `
        SELECT column_name, data_type, column_default
        FROM information_schema.columns
        WHERE table_name = 'profiles' 
          AND column_name = 'data_builder_templates'
      `
    });

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({ success: true, data: data });
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
  console.log('🔧 Data Builder Templates Migration');
  console.log('=====================================\n');
  
  try {
    console.log('🚀 Applying migration via Supabase REST API...');
    const result = await executeSQLViaRPC(migrationSQL);
    console.log('✅ Migration applied successfully!');
    console.log(`   Status: ${result.statusCode}\n`);
    
    console.log('📋 Verifying column...');
    const verifyResult = await verifyColumn();
    console.log('✅ Column verified!');
    console.log(`   Response: ${verifyResult.data}\n`);
    
    console.log('✨ Migration completed successfully!\n');
    console.log('Next steps:');
    console.log('   1. Refresh your browser (Ctrl+F5)');
    console.log('   2. Open Data Builder menu');
    console.log('   3. Try saving a query template');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('\n💡 Troubleshooting:');
    console.error('   1. Check if RPC function exec_sql exists');
    console.error('   2. Verify service role key is correct');
    console.error('   3. Try manual SQL via Supabase Dashboard');
    console.error('\nManual SQL to run in Supabase Dashboard:');
    console.error('---');
    console.error(migrationSQL);
    console.error('---');
    process.exit(1);
  }
}

runMigration();
