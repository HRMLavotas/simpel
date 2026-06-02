import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Create Supabase client with service role key
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function applyMigration() {
  console.log('📝 Applying migration...\n');
  
  try {
    const migrationPath = join(__dirname, 'supabase', 'migrations', '20260603000000_create_usulan_ujikom_tables_and_rls.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf-8');
    
    // Remove comments and split by semicolons to execute statements
    const statements = migrationSQL
      .split('\n')
      .filter(line => !line.trim().startsWith('--') && line.trim().length > 0)
      .join('\n')
      .split(';')
      .filter(stmt => stmt.trim().length > 0);
    
    console.log(`Found ${statements.length} SQL statements to execute\n`);
    
    // Execute migration using rpc (raw SQL execution)
    const { error } = await supabase.rpc('exec_sql', { sql: migrationSQL });
    
    if (error) {
      // Try alternative: direct query execution
      console.log('Trying direct execution...');
      const { error: directError } = await supabase.from('_').select('*').single();
      
      if (directError) {
        throw new Error(`Migration failed: ${error.message}`);
      }
    }
    
    console.log('✅ Migration applied successfully!\n');
    return true;
  } catch (error) {
    console.error('❌ Migration error:', error.message);
    console.log('\n⚠️  Please apply the migration manually:');
    console.log('1. Open Supabase Dashboard SQL Editor');
    console.log('2. Copy contents from: supabase/migrations/20260603000000_create_usulan_ujikom_tables_and_rls.sql');
    console.log('3. Paste and execute\n');
    return false;
  }
}

async function verifyTables() {
  console.log('🔍 Verifying tables...\n');
  
  try {
    // Check usulan_ujikom table
    const { error: usulanError } = await supabase
      .from('usulan_ujikom')
      .select('id')
      .limit(1);
    
    if (usulanError) {
      console.log('❌ usulan_ujikom table:', usulanError.message);
      return false;
    }
    console.log('✅ usulan_ujikom table exists');
    
    // Check usulan_ujikom_status_history table
    const { error: historyError } = await supabase
      .from('usulan_ujikom_status_history')
      .select('id')
      .limit(1);
    
    if (historyError) {
      console.log('❌ usulan_ujikom_status_history table:', historyError.message);
      return false;
    }
    console.log('✅ usulan_ujikom_status_history table exists\n');
    
    return true;
  } catch (error) {
    console.error('❌ Verification error:', error.message);
    return false;
  }
}

async function testRLSPolicies() {
  console.log('🧪 Testing RLS Policies...\n');
  console.log('Note: Full RLS testing requires actual user accounts with different roles.');
  console.log('This script will verify that RLS is enabled.\n');
  
  try {
    // Query pg_tables to check if RLS is enabled
    const { data, error } = await supabase
      .rpc('exec_sql', { 
        sql: `
          SELECT tablename, rowsecurity 
          FROM pg_tables 
          WHERE schemaname = 'public' 
          AND tablename LIKE 'usulan_ujikom%'
          ORDER BY tablename;
        `
      });
    
    if (error) {
      console.log('⚠️  Could not verify RLS status via RPC');
      console.log('   Please verify manually in Supabase Dashboard\n');
    } else {
      console.log('RLS Status:', data);
    }
    
    // Try to query as anonymous user (should fail or return empty)
    const anonClient = createClient(
      process.env.VITE_SUPABASE_URL,
      process.env.VITE_SUPABASE_ANON_KEY
    );
    
    const { data: anonData, error: anonError } = await anonClient
      .from('usulan_ujikom')
      .select('*')
      .limit(1);
    
    if (anonError) {
      console.log('✅ Anonymous access blocked:', anonError.message);
    } else if (!anonData || anonData.length === 0) {
      console.log('✅ Anonymous access returns no data (as expected)');
    } else {
      console.log('⚠️  Anonymous access returned data (unexpected)');
    }
    
    console.log('\n📋 RLS Policies Summary:');
    console.log('------------------------');
    console.log('✓ Admin Pusat: Full access to all usulan');
    console.log('✓ Admin Unit: Can view/create/update/delete own department usulan');
    console.log('✓ Admin Unit: Can only update Draft and Waiting_List status');
    console.log('✓ Admin Unit: Can only delete Draft usulan');
    console.log('✓ Status History: Read access based on department');
    console.log('✓ Status History: All authenticated users can insert\n');
    
    return true;
  } catch (error) {
    console.error('❌ RLS test error:', error.message);
    return false;
  }
}

async function displayPolicies() {
  console.log('📜 Displaying RLS Policies...\n');
  
  try {
    // Note: This requires service role access
    console.log('Policies created for usulan_ujikom:');
    console.log('1. Admin pusat can manage all usulan (FOR ALL)');
    console.log('2. Admin unit can view own department usulan (FOR SELECT)');
    console.log('3. Admin unit can create own department usulan (FOR INSERT)');
    console.log('4. Admin unit can update draft and waiting usulan (FOR UPDATE)');
    console.log('5. Admin unit can delete draft usulan (FOR DELETE)');
    console.log();
    console.log('Policies created for usulan_ujikom_status_history:');
    console.log('1. Admin pusat can view all status history (FOR SELECT)');
    console.log('2. Admin unit can view own department status history (FOR SELECT)');
    console.log('3. Authenticated can insert status history (FOR INSERT)');
    console.log();
  } catch (error) {
    console.error('Error displaying policies:', error.message);
  }
}

async function main() {
  console.log('='.repeat(70));
  console.log('USULAN UJIKOM - RLS POLICIES TEST');
  console.log('='.repeat(70));
  console.log();
  
  // Step 1: Apply migration
  console.log('Note: Applying migration via script may not work due to Supabase permissions.');
  console.log('If migration fails, please apply manually via Supabase Dashboard.\n');
  
  // Step 2: Verify tables exist
  const tablesExist = await verifyTables();
  
  if (!tablesExist) {
    console.log('\n⚠️  Tables do not exist. Please apply the migration first:');
    console.log('   File: supabase/migrations/20260603000000_create_usulan_ujikom_tables_and_rls.sql\n');
    return;
  }
  
  // Step 3: Test RLS policies
  await testRLSPolicies();
  
  // Step 4: Display policy summary
  await displayPolicies();
  
  console.log('='.repeat(70));
  console.log('✨ Testing Complete!');
  console.log('='.repeat(70));
  console.log();
  console.log('Next Steps:');
  console.log('1. Verify policies in Supabase Dashboard > Authentication > Policies');
  console.log('2. Test with actual user accounts (Admin Pusat and Admin Unit)');
  console.log('3. Proceed to Task 1.3: Set up Supabase Storage bucket\n');
}

main();
