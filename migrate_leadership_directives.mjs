import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function migrateLeadershipDirectives() {
  console.log('\n' + '='.repeat(80));
  console.log('MIGRATE LEADERSHIP DIRECTIVES TO NEW TABLE');
  console.log('='.repeat(80));

  // Check if migration file has been run
  console.log('\n📋 Step 1: Run migration file');
  console.log('Please run: npx supabase migration up');
  console.log('Or execute the SQL file: supabase/migrations/20260513150000_create_leadership_directives_table.sql');
  
  console.log('\n📊 Step 2: Verify migration');
  
  // Check if table exists
  const { data: tables, error: tablesError } = await supabase
    .from('leadership_directives')
    .select('id')
    .limit(1);

  if (tablesError) {
    console.error('❌ Table leadership_directives does not exist yet');
    console.error('   Please run the migration first');
    return;
  }

  console.log('✅ Table leadership_directives exists');

  // Check migrated data
  const { data: directives, error: directivesError } = await supabase
    .from('leadership_directives')
    .select('*');

  if (directivesError) {
    console.error('❌ Error fetching directives:', directivesError);
    return;
  }

  console.log(`\n📊 Found ${directives?.length || 0} directives in new table`);

  if (directives && directives.length > 0) {
    console.log('\n✅ MIGRATION SUCCESSFUL!');
    console.log('\nMigrated directives:');
    directives.forEach((d, idx) => {
      console.log(`\n${idx + 1}. Case ID: ${d.case_id}`);
      console.log(`   Issued by: ${d.issued_by_name}`);
      console.log(`   Date: ${d.directive_date}`);
      console.log(`   Text: ${d.directive_text.substring(0, 100)}${d.directive_text.length > 100 ? '...' : ''}`);
    });
  } else {
    console.log('\n⚠️  No directives found in new table');
    console.log('   This is normal if no cases had leadership_directive field populated');
  }

  console.log('\n' + '='.repeat(80));
  console.log('NEXT STEPS');
  console.log('='.repeat(80));
  console.log('1. Test the new UI in browser');
  console.log('2. Add new directives using the UI');
  console.log('3. Verify multiple directives per case works');
  console.log('4. Test auto-complete for personnel names');
  console.log('='.repeat(80));
}

migrateLeadershipDirectives();
