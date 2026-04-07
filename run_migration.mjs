#!/usr/bin/env node

/**
 * Script untuk menjalankan migration data_builder_templates
 * Menggunakan pg library untuk koneksi langsung ke PostgreSQL
 */

import pg from 'pg';
const { Client } = pg;

// Konfigurasi database
const connectionString = 'postgresql://postgres:Aliham251118!@db.mauyygrbdopmpdpnwzra.supabase.co:5432/postgres';

// SQL Migration
const migrationSQL = `
-- Add data_builder_templates column to profiles table
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'data_builder_templates'
    ) THEN
        ALTER TABLE profiles 
        ADD COLUMN data_builder_templates jsonb DEFAULT '[]'::jsonb;
        
        COMMENT ON COLUMN profiles.data_builder_templates IS 'User saved query templates for Data Builder stored as JSON array';
        
        RAISE NOTICE 'Column data_builder_templates added successfully';
    ELSE
        RAISE NOTICE 'Column data_builder_templates already exists';
    END IF;
END $$;
`;

async function runMigration() {
  const client = new Client({
    connectionString,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('🔧 Data Builder Templates Migration');
    console.log('=====================================\n');
    
    console.log('🔌 Connecting to database...');
    await client.connect();
    console.log('✅ Connected successfully!\n');

    console.log('🚀 Running migration...');
    await client.query(migrationSQL);
    console.log('✅ Migration completed successfully!\n');
    
    // Verify column was added
    console.log('📋 Verifying column...');
    const verifyResult = await client.query(`
      SELECT column_name, data_type, column_default, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'profiles' 
        AND column_name = 'data_builder_templates'
    `);
    
    if (verifyResult.rows.length > 0) {
      console.log('✅ Column verified successfully:');
      console.table(verifyResult.rows);
    } else {
      console.log('⚠️  Column not found. Migration may have failed.');
    }

    console.log('\n✨ Migration completed! You can now:');
    console.log('   1. Refresh your browser (Ctrl+F5)');
    console.log('   2. Open Data Builder menu');
    console.log('   3. Try saving a query template');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('\n💡 Troubleshooting:');
    console.error('   1. Check database password in .env');
    console.error('   2. Verify network can access Supabase');
    console.error('   3. Ensure you have permission to ALTER TABLE');
    process.exit(1);
  } finally {
    await client.end();
  }
}

// Run migration
runMigration();
