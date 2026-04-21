#!/usr/bin/env node

/**
 * Apply Monitoring Migration via Supabase Management API
 * Menjalankan migration untuk fitur monitoring aktivitas unit
 */

import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SUPABASE_URL = 'https://mauyygrbdopmpdpnwzra.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1hdXl5Z3JiZG9wbXBkcG53enJhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDkzMTM4NCwiZXhwIjoyMDkwNTA3Mzg0fQ.qMJoz6Xuy4PKwS-LKWpjf_WM5o0fuNtEE4hsgLjJX4Q';

// Read migration files
const migration1Path = path.join(__dirname, 'supabase/migrations/20260421100000_add_unit_activity_monitoring.sql');
const migration2Path = path.join(__dirname, 'supabase/migrations/20260421100001_fix_monitoring_view_show_all_units.sql');

async function executeSQL(sql, description) {
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
        'Content-Length': Buffer.byteLength(postData),
        'Prefer': 'return=representation'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          console.log(`✅ ${description} - Success`);
          resolve({ success: true, statusCode: res.statusCode, data: data });
        } else {
          console.error(`❌ ${description} - Failed`);
          console.error(`   Status: ${res.statusCode}`);
          console.error(`   Response: ${data}`);
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', (error) => {
      console.error(`❌ ${description} - Error`);
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

async function verifySetup() {
  console.log('\n📋 Verifying setup...');
  
  const checkSQL = `
    SELECT 
      EXISTS (
        SELECT FROM pg_views 
        WHERE schemaname = 'public' 
        AND viewname = 'unit_activity_summary'
      ) as view_exists,
      EXISTS (
        SELECT FROM pg_proc 
        WHERE proname = 'get_unit_monthly_details'
      ) as function_exists;
  `;
  
  try {
    const result = await executeSQL(checkSQL, 'Verification check');
    console.log('✅ Setup verified successfully!');
    return true;
  } catch (error) {
    console.error('❌ Verification failed:', error.message);
    return false;
  }
}

async function runMigrations() {
  console.log('🚀 Monitoring Unit - Migration Script');
  console.log('=====================================\n');
  
  try {
    // Check if migration files exist
    if (!fs.existsSync(migration1Path)) {
      throw new Error(`Migration file not found: ${migration1Path}`);
    }
    
    console.log('📄 Reading migration files...');
    const migration1SQL = fs.readFileSync(migration1Path, 'utf8');
    console.log(`   ✅ Migration 1: ${path.basename(migration1Path)}`);
    
    let migration2SQL = null;
    if (fs.existsSync(migration2Path)) {
      migration2SQL = fs.readFileSync(migration2Path, 'utf8');
      console.log(`   ✅ Migration 2: ${path.basename(migration2Path)}`);
    }
    
    console.log('\n🔧 Applying migrations...\n');
    
    // Apply first migration
    console.log('1️⃣ Creating view and function...');
    await executeSQL(migration1SQL, 'Migration 1');
    
    // Apply second migration if exists
    if (migration2SQL) {
      console.log('\n2️⃣ Updating view to show all units...');
      await executeSQL(migration2SQL, 'Migration 2');
    }
    
    // Verify setup
    await verifySetup();
    
    console.log('\n✨ Migration completed successfully!\n');
    console.log('📝 Next steps:');
    console.log('   1. Refresh your browser (Ctrl+F5 or Cmd+R)');
    console.log('   2. Login as admin_pusat or admin_pimpinan');
    console.log('   3. Click "Monitoring Unit" menu in sidebar');
    console.log('   4. You should see all units with their activity data\n');
    
    console.log('🔍 To verify manually, run this in Supabase SQL Editor:');
    console.log('   SELECT * FROM unit_activity_summary LIMIT 5;\n');
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error('\n💡 Troubleshooting:');
    console.error('   1. Check if you have internet connection');
    console.error('   2. Verify Supabase project is accessible');
    console.error('   3. Try running SQL manually in Supabase Dashboard');
    console.error('\n📋 Manual migration steps:');
    console.error('   1. Go to: https://supabase.com/dashboard');
    console.error('   2. Select your project');
    console.error('   3. Click "SQL Editor"');
    console.error('   4. Copy-paste content from:');
    console.error(`      - ${migration1Path}`);
    if (fs.existsSync(migration2Path)) {
      console.error(`      - ${migration2Path}`);
    }
    console.error('   5. Click "Run"\n');
    process.exit(1);
  }
}

runMigrations();
