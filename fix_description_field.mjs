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

async function fixDescriptionField(dryRun = true) {
  console.log('\n' + '='.repeat(80));
  console.log(`${dryRun ? 'DRY RUN - ' : ''}FIX DESCRIPTION FIELD`);
  console.log('='.repeat(80));
  console.log('Issue: Description field contains timeline data instead of case summary');
  console.log('Solution: Set description to a proper case summary or empty string');
  console.log('='.repeat(80));

  const { data: cases, error } = await supabase
    .from('employee_cases')
    .select('id, employee_name, employee_nip, case_type, description')
    .order('employee_name');

  if (error) {
    console.error('❌ Error fetching cases:', error);
    return;
  }

  console.log(`\n📊 Total cases to process: ${cases.length}\n`);

  let updatedCount = 0;
  const CASE_TYPE_LABELS = {
    'perceraian': 'Perceraian',
    'hutang': 'Hutang',
    'pinjaman_online': 'Pinjaman Online',
    'presensi': 'Presensi',
    'pengunduran_diri': 'Pengunduran Diri',
    'temuan': 'Temuan',
    'lainnya': 'Lainnya'
  };

  for (const caseData of cases) {
    const caseTypeLabel = CASE_TYPE_LABELS[caseData.case_type] || caseData.case_type;
    
    // Generate a proper description
    const newDescription = `Kasus ${caseTypeLabel} - ${caseData.employee_name}`;

    console.log(`\n${updatedCount + 1}. ${caseData.employee_name} (${caseData.employee_nip})`);
    console.log(`   Case Type: ${caseData.case_type}`);
    console.log(`   Old Description (${caseData.description?.length || 0} chars): ${caseData.description?.substring(0, 100)}${caseData.description?.length > 100 ? '...' : ''}`);
    console.log(`   New Description: ${newDescription}`);

    if (!dryRun) {
      const { error: updateError } = await supabase
        .from('employee_cases')
        .update({ description: newDescription })
        .eq('id', caseData.id);

      if (updateError) {
        console.log(`   ❌ Error: ${updateError.message}`);
      } else {
        console.log(`   ✅ Updated`);
        updatedCount++;
      }
    } else {
      console.log(`   🔍 Would update`);
      updatedCount++;
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('SUMMARY');
  console.log('='.repeat(80));
  console.log(`Total cases: ${cases.length}`);
  console.log(`Updated: ${updatedCount}`);
  
  if (dryRun) {
    console.log('\n🔍 DRY RUN - No changes made. Set dryRun=false to actually update.');
  } else {
    console.log('\n✅ Update completed!');
  }
}

async function main() {
  try {
    // Dry run first
    console.log('\n📋 STEP 1: DRY RUN');
    await fixDescriptionField(true);

    console.log('\n' + '='.repeat(80));
    console.log('NEXT STEPS');
    console.log('='.repeat(80));
    console.log('1. Review the dry run results above');
    console.log('2. If everything looks good, the actual update will run next');
    console.log('='.repeat(80));

    // Wait a moment
    await new Promise(resolve => setTimeout(resolve, 2000));

    // UNCOMMENT TO ACTUALLY UPDATE:
    console.log('\n📋 STEP 2: ACTUAL UPDATE');
    await fixDescriptionField(false);

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

main();
