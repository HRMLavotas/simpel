/**
 * Script to apply database migrations to Supabase
 * This script reads migration files and executes them using the service role key
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing required environment variables:');
  console.error('   VITE_SUPABASE_URL:', SUPABASE_URL ? '✓' : '✗');
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', SUPABASE_SERVICE_ROLE_KEY ? '✓' : '✗');
  process.exit(1);
}

// Create Supabase client with service role key (bypasses RLS)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

/**
 * Apply a single migration file
 */
async function applyMigration(filename, sql) {
  console.log(`\n📄 Applying migration: ${filename}`);
  
  try {
    // Execute the SQL
    const { error } = await supabase.rpc('exec_sql', { sql_query: sql });
    
    if (error) {
      // If exec_sql function doesn't exist, try direct query
      if (error.message.includes('function') && error.message.includes('does not exist')) {
        console.log('   ℹ️  Using direct query method...');
        
        // Split SQL into individual statements and execute them
        const statements = sql
          .split(';')
          .map(s => s.trim())
          .filter(s => s.length > 0 && !s.startsWith('--'));
        
        for (const statement of statements) {
          const { error: stmtError } = await supabase.rpc('exec', { 
            query: statement + ';' 
          });
          
          if (stmtError) {
            throw stmtError;
          }
        }
      } else {
        throw error;
      }
    }
    
    console.log(`   ✅ Migration applied successfully`);
    return true;
  } catch (error) {
    console.error(`   ❌ Error applying migration:`, error.message);
    return false;
  }
}

/**
 * Main function to apply migrations
 */
async function main() {
  console.log('🚀 Starting migration process...\n');
  console.log(`📍 Supabase URL: ${SUPABASE_URL}`);
  
  // Get migration files
  const migrationsDir = join(__dirname, '..', 'supabase', 'migrations');
  const migrationFiles = readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort(); // Sort to ensure correct order
  
  // Filter to only apply the new migrations for task 1.2
  const newMigrations = migrationFiles.filter(f => 
    f.startsWith('20260401100000_') || 
    f.startsWith('20260401100001_') || 
    f.startsWith('20260401100002_')
  );
  
  if (newMigrations.length === 0) {
    console.log('⚠️  No new migrations found to apply');
    return;
  }
  
  console.log(`\n📋 Found ${newMigrations.length} migration(s) to apply:\n`);
  newMigrations.forEach((f, i) => console.log(`   ${i + 1}. ${f}`));
  
  let successCount = 0;
  let failCount = 0;
  
  // Apply each migration
  for (const filename of newMigrations) {
    const filepath = join(migrationsDir, filename);
    const sql = readFileSync(filepath, 'utf-8');
    
    const success = await applyMigration(filename, sql);
    if (success) {
      successCount++;
    } else {
      failCount++;
    }
  }
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 Migration Summary:');
  console.log(`   ✅ Successful: ${successCount}`);
  console.log(`   ❌ Failed: ${failCount}`);
  console.log(`   📝 Total: ${newMigrations.length}`);
  console.log('='.repeat(60) + '\n');
  
  if (failCount > 0) {
    console.log('⚠️  Some migrations failed. Please check the errors above.');
    console.log('💡 Tip: You may need to apply these migrations manually via Supabase Dashboard.');
    process.exit(1);
  } else {
    console.log('🎉 All migrations applied successfully!');
  }
}

// Run the script
main().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
