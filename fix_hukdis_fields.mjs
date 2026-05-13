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

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Extract punishment type from decision_number field
 * Example: "Hukdis Berat (Penjatuhan hukuman disiplin...)" 
 * → "Penjatuhan hukuman disiplin..."
 */
function extractPunishmentType(decisionNumber) {
  if (!decisionNumber) return null;
  
  const text = String(decisionNumber);
  
  // Extract text in parentheses
  const match = text.match(/\((.*?)\)/);
  if (match) {
    return match[1].trim();
  }
  
  return null;
}

/**
 * Generate a proper decision number from the data
 * Since Excel doesn't have actual SK numbers, we'll create a placeholder
 */
function generateDecisionNumber(level, effectiveDate, employeeName) {
  const year = effectiveDate ? effectiveDate.split('-')[0] : new Date().getFullYear();
  const levelCode = {
    'ringan': 'R',
    'sedang': 'S',
    'berat': 'B'
  }[level] || 'X';
  
  // Create a simple format: HD-{Level}-{Year}-{EmployeeInitials}
  const initials = employeeName
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .substring(0, 3);
  
  return `HD-${levelCode}-${year}-${initials}`;
}

/**
 * Clean up the decision_number field
 * Remove the full description and keep only essential info
 */
function cleanDecisionNumber(decisionNumber) {
  if (!decisionNumber) return 'Tidak ada nomor SK';
  
  const text = String(decisionNumber);
  
  // If it starts with "Hukdis", it's the full description
  if (text.toLowerCase().startsWith('hukdis')) {
    return 'Tidak ada nomor SK';
  }
  
  return text;
}

// ============================================================================
// FIX DISCIPLINARY ACTIONS
// ============================================================================

async function fixDisciplinaryActions(dryRun = true) {
  console.log('\n' + '='.repeat(80));
  console.log(`${dryRun ? 'DRY RUN - ' : ''}FIXING DISCIPLINARY ACTION FIELDS`);
  console.log('='.repeat(80));

  // Get all disciplinary actions
  const { data: actions, error } = await supabase
    .from('disciplinary_actions')
    .select('*')
    .order('decision_date', { ascending: false });

  if (error) {
    console.error('❌ Error fetching actions:', error);
    return;
  }

  console.log(`\n📊 Total actions: ${actions.length}\n`);

  let fixedCount = 0;
  let skippedCount = 0;

  for (const action of actions) {
    // Check if decision_number contains full description
    const needsFix = action.decision_number && 
                     (action.decision_number.toLowerCase().includes('hukdis') ||
                      action.decision_number.includes('('));

    if (needsFix) {
      console.log(`\n📝 ${action.employee_name}`);
      console.log(`   Current decision_number: ${action.decision_number.substring(0, 80)}...`);
      console.log(`   Current type: ${action.type}`);

      // Extract punishment type from decision_number
      const newType = extractPunishmentType(action.decision_number);
      
      // Generate new decision number
      const newDecisionNumber = generateDecisionNumber(
        action.level,
        action.effective_date,
        action.employee_name
      );

      console.log(`   → New decision_number: ${newDecisionNumber}`);
      console.log(`   → New type: ${newType || action.type}`);

      if (!dryRun) {
        const updates = {
          decision_number: newDecisionNumber,
        };

        // Only update type if we extracted something meaningful
        if (newType && newType.length > 10) {
          updates.type = newType;
        }

        const { error: updateError } = await supabase
          .from('disciplinary_actions')
          .update(updates)
          .eq('id', action.id);

        if (updateError) {
          console.log(`   ❌ Error: ${updateError.message}`);
        } else {
          console.log(`   ✅ Fixed`);
          fixedCount++;
        }
      } else {
        console.log(`   🔍 Would fix`);
        fixedCount++;
      }
    } else {
      skippedCount++;
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('SUMMARY');
  console.log('='.repeat(80));
  console.log(`Total actions: ${actions.length}`);
  console.log(`Fixed: ${fixedCount}`);
  console.log(`Skipped (already OK): ${skippedCount}`);
  
  if (dryRun) {
    console.log('\n🔍 DRY RUN - No changes made. Set dryRun=false to actually fix.');
  } else {
    console.log('\n✅ Fields fixed!');
  }
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  try {
    // Dry run first
    await fixDisciplinaryActions(true);

    console.log('\n' + '='.repeat(80));
    console.log('NEXT STEPS');
    console.log('='.repeat(80));
    console.log('1. Review the dry run results above');
    console.log('2. If everything looks good, uncomment the line below:');
    console.log('   - await fixDisciplinaryActions(false);');
    console.log('='.repeat(80));

    // UNCOMMENT TO ACTUALLY FIX:
    await fixDisciplinaryActions(false);

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

main();
