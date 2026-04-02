// Script to check all tables in Supabase database
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://mauyygrbdopmpdpnwzra.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1hdXl5Z3JiZG9wbXBkcG53enJhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDkzMTM4NCwiZXhwIjoyMDkwNTA3Mzg0fQ.qMJoz6Xuy4PKwS-LKWpjf_WM5o0fuNtEE4hsgLjJX4Q';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTables() {
  console.log('🔍 Checking Supabase tables...\n');

  // Query to get all tables in public schema
  const { data: tables, error } = await supabase
    .rpc('exec_sql', {
      query: `
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
        ORDER BY table_name;
      `
    });

  if (error) {
    console.error('❌ Error fetching tables:', error);
    
    // Fallback: Try to query known tables
    console.log('\n📋 Trying to check known tables...\n');
    
    const knownTables = [
      'employees',
      'education_history',
      'position_history',
      'mutation_history',
      'training_history',
      'award_history',
      'profiles',
      'user_roles',
      'departments',
      'position_references',
      'audit_logs'
    ];

    for (const tableName of knownTables) {
      try {
        const { count, error: countError } = await supabase
          .from(tableName)
          .select('*', { count: 'exact', head: true });

        if (countError) {
          console.log(`❌ ${tableName}: Does not exist or no access`);
        } else {
          console.log(`✅ ${tableName}: ${count} rows`);
        }
      } catch (err) {
        console.log(`❌ ${tableName}: Error - ${err.message}`);
      }
    }
    
    return;
  }

  console.log('✅ Tables found:\n');
  tables.forEach(table => {
    console.log(`  - ${table.table_name}`);
  });
}

// Check employees table structure
async function checkEmployeesStructure() {
  console.log('\n📊 Checking employees table structure...\n');
  
  const { data, error } = await supabase
    .from('employees')
    .select('*')
    .limit(1);

  if (error) {
    console.error('❌ Error:', error);
    return;
  }

  if (data && data.length > 0) {
    console.log('Columns in employees table:');
    Object.keys(data[0]).forEach(col => {
      console.log(`  - ${col}`);
    });
  }
}

// Check education_history table
async function checkEducationHistory() {
  console.log('\n📚 Checking education_history table...\n');
  
  const { count, error } = await supabase
    .from('education_history')
    .select('*', { count: 'exact', head: true });

  if (error) {
    console.error('❌ Error:', error);
    return;
  }

  console.log(`Total records in education_history: ${count}`);
  
  // Get sample data
  const { data: sample } = await supabase
    .from('education_history')
    .select('*')
    .limit(5);

  if (sample && sample.length > 0) {
    console.log('\nSample data:');
    console.log(JSON.stringify(sample, null, 2));
  }
}

// Main execution
(async () => {
  try {
    await checkTables();
    await checkEmployeesStructure();
    await checkEducationHistory();
  } catch (err) {
    console.error('❌ Fatal error:', err);
  }
})();
