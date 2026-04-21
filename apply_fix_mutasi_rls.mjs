#!/usr/bin/env node

/**
 * Apply RLS policy fix for mutation feature
 * Fixes 403 error when admin_unit tries to mutate employee to another department
 */

import { readFileSync } from 'fs';
import https from 'https';

const SUPABASE_URL = 'https://mauyygrbdopmpdpnwzra.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1hdXl5Z3JiZG9wbXBkcG53enJhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDkzMTM4NCwiZXhwIjoyMDkwNTA3Mzg0fQ.qMJoz6Xuy4PKwS-LKWpjf_WM5o0fuNtEE4hsgLjJX4Q';

// Read migration SQL from file
const migrationSQL = readFileSync('supabase/migrations/20260421000000_fix_mutation_rls_policy.sql', 'utf8');

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

async function verifyPolicy() {
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
        SELECT policyname, cmd, qual, with_check
        FROM pg_policies
        WHERE tablename = 'employees' 
          AND policyname = 'Admin unit can update own department employees'
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
  console.log('🔧 Fix Mutasi RLS Policy Migration');
  console.log('=====================================\n');
  console.log('📝 Problem: Error 403 when admin_unit tries to mutate employee to another department');
  console.log('✨ Solution: Remove department check from WITH CHECK clause\n');
  
  try {
    console.log('🚀 Applying migration via Supabase REST API...');
    const result = await executeSQLViaRPC(migrationSQL);
    console.log('✅ Migration applied successfully!');
    console.log(`   Status: ${result.statusCode}\n`);
    
    console.log('📋 Verifying policy...');
    const verifyResult = await verifyPolicy();
    console.log('✅ Policy verified!');
    console.log(`   Response: ${verifyResult.data}\n`);
    
    console.log('✨ Migration completed successfully!\n');
    console.log('Next steps:');
    console.log('   1. Refresh your browser (Ctrl+F5)');
    console.log('   2. Login as admin_unit');
    console.log('   3. Try Quick Action → Pindah/Mutasi');
    console.log('   4. Select different department and save');
    console.log('   5. Should work without 403 error! ✅');
    
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
