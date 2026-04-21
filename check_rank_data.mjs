import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

// Read and parse .env file
const envContent = readFileSync('.env', 'utf-8');
const envVars = {};

envContent.split('\n').forEach(line => {
  line = line.trim();
  // Skip comments and empty lines
  if (!line || line.startsWith('#')) return;
  
  const equalIndex = line.indexOf('=');
  if (equalIndex === -1) return;
  
  const key = line.substring(0, equalIndex).trim();
  let value = line.substring(equalIndex + 1).trim();
  
  // Remove surrounding quotes
  if ((value.startsWith('"') && value.endsWith('"')) || 
      (value.startsWith("'") && value.endsWith("'"))) {
    value = value.slice(1, -1);
  }
  
  envVars[key] = value;
});

const supabaseUrl = envVars.VITE_SUPABASE_URL;
const supabaseKey = envVars.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env');
  console.error('Found keys:', Object.keys(envVars));
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkRankData() {
  console.log('=== CHECKING RANK_GROUP DATA ===\n');
  
  // Get a sample of employees with their rank_group
  const { data: employees, error } = await supabase
    .from('employees')
    .select('id, name, asn_status, rank_group')
    .not('rank_group', 'is', null)
    .limit(10);
  
  if (error) {
    console.error('❌ Error fetching employees:', error);
    return;
  }
  
  if (!employees || employees.length === 0) {
    console.log('⚠️ No employees found with rank_group data');
    return;
  }
  
  console.log(`Found ${employees.length} employees with rank_group:\n`);
  
  employees.forEach((emp, i) => {
    console.log(`${i + 1}. ${emp.name}`);
    console.log(`   ASN Status: ${emp.asn_status}`);
    console.log(`   Rank Group: "${emp.rank_group}"`);
    console.log(`   Rank Length: ${emp.rank_group?.length || 0} chars`);
    console.log('');
  });
  
  // Check for common issues
  console.log('=== CHECKING FOR COMMON ISSUES ===\n');
  
  const { data: withSpaces } = await supabase
    .from('employees')
    .select('id, name, rank_group')
    .like('rank_group', '% %')
    .limit(5);
  
  if (withSpaces && withSpaces.length > 0) {
    console.log('⚠️ Found employees with spaces in rank_group:');
    withSpaces.forEach(emp => {
      console.log(`   - ${emp.name}: "${emp.rank_group}"`);
    });
  } else {
    console.log('✅ No rank_group values with extra spaces found');
  }
  
  console.log('\n=== VALID RANK OPTIONS ===\n');
  console.log('PNS Ranks:');
  const pnsRanks = [
    'Juru Muda (I/a)', 'Juru Muda Tk I (I/b)', 'Juru (I/c)', 'Juru Tk I (I/d)',
    'Pengatur Muda (II/a)', 'Pengatur Muda Tk I (II/b)', 'Pengatur (II/c)', 'Pengatur Tk I (II/d)',
    'Penata Muda (III/a)', 'Penata Muda Tk I (III/b)', 'Penata (III/c)', 'Penata Tk I (III/d)',
    'Pembina (IV/a)', 'Pembina Tk I (IV/b)', 'Pembina Muda (IV/c)', 'Pembina Madya (IV/d)', 'Pembina Utama (IV/e)',
  ];
  pnsRanks.forEach(rank => console.log(`   - ${rank}`));
  
  console.log('\nPPPK Ranks:');
  const pppkRanks = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI', 'XVII'];
  console.log(`   - ${pppkRanks.join(', ')}`);
}

checkRankData().catch(console.error);
