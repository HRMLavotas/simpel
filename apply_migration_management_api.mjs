#!/usr/bin/env node

/**
 * Apply migration using Supabase Management API
 * Using access token from .env
 */

import https from 'https';

const ACCESS_TOKEN = 'sbp_df72ebc9cae53c148193f88736ea05f4e0feab89';
const PROJECT_REF = 'mauyygrbdopmpdpnwzra';

const migrationSQL = `
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS data_builder_templates jsonb DEFAULT '[]'::jsonb;

COMMENT ON COLUMN profiles.data_builder_templates IS 'User saved query templates for Data Builder stored as JSON array';
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

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        console.log(`Response Status: ${res.statusCode}`);
        console.log(`Response Body: ${data}`);
        
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
  const verifySQL = `
    SELECT column_name, data_type, column_default, is_nullable
    FROM information_schema.columns
    WHERE table_name = 'profiles' 
      AND column_name = 'data_builder_templates'
  `;
  
  return executeSQLViaManagementAPI(verifySQL);
}

async function runMigration() {
  console.log('🔧 Data Builder Templates Migration');
  console.log('=====================================');
  console.log(`Project: ${PROJECT_REF}`);
  console.log(`Using: Supabase Management API\n`);
  
  try {
    console.log('🚀 Applying migration...');
    const result = await executeSQLViaManagementAPI(migrationSQL);
    console.log('✅ Migration applied successfully!\n');
    
    console.log('📋 Verifying column...');
    const verifyResult = await verifyColumn();
    console.log('✅ Column verified!\n');
    
    console.log('✨ Migration completed successfully!\n');
    console.log('Next steps:');
    console.log('   1. Refresh your browser (Ctrl+F5)');
    console.log('   2. Open Data Builder menu');
    console.log('   3. Try saving a query template');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('\n💡 This might mean:');
    console.error('   1. Management API endpoint changed');
    console.error('   2. Access token needs different permissions');
    console.error('   3. Need to use Dashboard SQL Editor instead');
    console.error('\n📋 Manual SQL (copy to Supabase Dashboard):');
    console.error('---');
    console.error(migrationSQL);
    console.error('---');
    process.exit(1);
  }
}

runMigration();
