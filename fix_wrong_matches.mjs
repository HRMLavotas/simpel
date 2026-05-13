import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// ============================================================================
// WRONG MATCHES TO FIX
// ============================================================================

const wrongMatches = [
  {
    caseName: 'Bahar',
    wrongEmployeeName: 'Bayu Tresna Putra Bahari',
    wrongNip: '199512172025051003',
    reason: 'Different person - Bahar ≠ Bayu Tresna Putra Bahari'
  },
  {
    caseName: 'Andan',
    wrongEmployeeName: 'Andani Putri',
    wrongNip: '199110222025212011',
    reason: 'Different person - Andan ≠ Andani Putri'
  },
  {
    caseName: 'Andri Ramadhan Aditya',
    wrongEmployeeName: 'Andri',
    wrongNip: '7271042903900002',
    reason: 'Different person - Full name vs single name mismatch'
  },
  {
    caseName: 'Andri Susila, S.T., M.Si',
    wrongEmployeeName: 'Andri',
    wrongNip: '7271042903900002',
    reason: 'Different person - Full name vs single name mismatch'
  },
  {
    caseName: 'Ati Irawati',
    wrongEmployeeName: 'Ribka Sulistiyo Wati',
    wrongNip: '199309242020122018',
    reason: 'Different person - Only "wati" matches, different first names'
  },
  {
    caseName: 'Muhammad Aiza Akbar',
    wrongEmployeeName: 'Muhammad',
    wrongNip: '200101212026031001',
    reason: 'Different person - Full name vs single name mismatch'
  },
  {
    caseName: 'Muhammad Ramdhan, S.T',
    wrongEmployeeName: 'Muhammad',
    wrongNip: '200101212026031001',
    reason: 'Different person - Full name vs single name mismatch'
  },
  {
    caseName: 'RADEN MUHAMMAD AKBAR',
    wrongEmployeeName: 'Muhammad',
    wrongNip: '200101212026031001',
    reason: 'Different person - Full name vs single name mismatch'
  },
  {
    caseName: 'Rohmatullah Ahmadi',
    wrongEmployeeName: 'Ahmad',
    wrongNip: '197505012009021002',
    reason: 'Different person - Rohmatullah ≠ Ahmad'
  },
];

// ============================================================================
// IMPROVED MATCHING FUNCTION
// ============================================================================

function normalizeName(name) {
  return String(name)
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[.,]/g, '')
    .replace(/\s+(s\.t|s\.e|s\.h|s\.kom|s\.pd|s\.sos|s\.par|a\.md|m\.si|m\.m|dr\.|drs\.)(\s+|$)/gi, '');
}

/**
 * Calculate similarity score between two names
 * Returns 0-100 (100 = perfect match)
 */
function calculateSimilarity(name1, name2) {
  const n1 = normalizeName(name1);
  const n2 = normalizeName(name2);
  
  // Exact match
  if (n1 === n2) return 100;
  
  // Get words
  const words1 = n1.split(' ').filter(w => w.length > 2);
  const words2 = n2.split(' ').filter(w => w.length > 2);
  
  // If one name is much longer, likely different person
  const lengthRatio = Math.min(words1.length, words2.length) / Math.max(words1.length, words2.length);
  if (lengthRatio < 0.5) return 0; // Too different in length
  
  // Count matching words
  let matchingWords = 0;
  for (const w1 of words1) {
    for (const w2 of words2) {
      // Exact word match
      if (w1 === w2) {
        matchingWords += 2; // Full word match worth more
      }
      // Partial match (one contains the other)
      else if (w1.includes(w2) || w2.includes(w1)) {
        matchingWords += 1;
      }
    }
  }
  
  // Calculate score
  const maxWords = Math.max(words1.length, words2.length);
  const score = (matchingWords / (maxWords * 2)) * 100;
  
  return Math.round(score);
}

/**
 * Check if a match is likely correct
 */
function isLikelyCorrectMatch(caseName, employeeName) {
  const similarity = calculateSimilarity(caseName, employeeName);
  
  // Require at least 60% similarity
  if (similarity < 60) return false;
  
  // Additional checks
  const n1 = normalizeName(caseName);
  const n2 = normalizeName(employeeName);
  
  // If case name is very short (1 word), require exact match
  const words1 = n1.split(' ').filter(w => w.length > 2);
  if (words1.length === 1) {
    // Single word must match exactly
    return n1 === n2 || n2.split(' ').includes(n1);
  }
  
  return true;
}

// ============================================================================
// ROLLBACK WRONG MATCHES
// ============================================================================

async function rollbackWrongMatches() {
  console.log('🔄 ROLLING BACK WRONG MATCHES');
  console.log('='.repeat(80));
  
  for (const wrong of wrongMatches) {
    console.log(`\n❌ Wrong Match: "${wrong.caseName}" → "${wrong.wrongEmployeeName}"`);
    console.log(`   Reason: ${wrong.reason}`);
    
    // Find the case
    const { data: cases, error } = await supabase
      .from('employee_cases')
      .select('id, employee_id, employee_name, employee_nip')
      .eq('employee_name', wrong.caseName)
      .eq('employee_nip', wrong.wrongNip);
    
    if (error) {
      console.error(`   ❌ Error finding case:`, error.message);
      continue;
    }
    
    if (!cases || cases.length === 0) {
      console.log(`   ⚠️  Case not found or already fixed`);
      continue;
    }
    
    // Rollback to manual ID
    for (const caseData of cases) {
      const manualId = `MANUAL_${normalizeName(wrong.caseName).replace(/\s+/g, '_')}`;
      
      const { error: updateError } = await supabase
        .from('employee_cases')
        .update({
          employee_id: manualId,
          employee_nip: 'TIDAK_ADA'
        })
        .eq('id', caseData.id);
      
      if (updateError) {
        console.error(`   ❌ Error rolling back:`, updateError.message);
      } else {
        console.log(`   ✅ Rolled back to manual ID: ${manualId}`);
      }
    }
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('✅ Rollback completed');
}

// ============================================================================
// REVIEW ALL MATCHES
// ============================================================================

async function reviewAllMatches() {
  console.log('\n🔍 REVIEWING ALL MATCHES');
  console.log('='.repeat(80));
  
  // Get all cases that were updated (not manual ID)
  const { data: cases, error } = await supabase
    .from('employee_cases')
    .select('id, employee_id, employee_name, employee_nip')
    .not('employee_id', 'like', 'MANUAL_%')
    .order('employee_name');
  
  if (error) {
    console.error('❌ Error fetching cases:', error);
    return;
  }
  
  console.log(`\n📊 Found ${cases.length} cases with real employee IDs\n`);
  
  const suspicious = [];
  
  for (const caseData of cases) {
    // Get employee data
    const { data: employee } = await supabase
      .from('employees')
      .select('name, nip')
      .eq('id', caseData.employee_id)
      .single();
    
    if (!employee) continue;
    
    const similarity = calculateSimilarity(caseData.employee_name, employee.name);
    const isCorrect = isLikelyCorrectMatch(caseData.employee_name, employee.name);
    
    if (!isCorrect || similarity < 60) {
      suspicious.push({
        caseName: caseData.employee_name,
        employeeName: employee.name,
        nip: employee.nip,
        similarity: similarity,
        caseId: caseData.id
      });
      
      console.log(`⚠️  SUSPICIOUS: "${caseData.employee_name}" → "${employee.name}"`);
      console.log(`   NIP: ${employee.nip}`);
      console.log(`   Similarity: ${similarity}%`);
      console.log('');
    }
  }
  
  console.log('='.repeat(80));
  console.log(`⚠️  Found ${suspicious.length} suspicious matches`);
  
  if (suspicious.length > 0) {
    // Save to file for review
    fs.writeFileSync('suspicious_matches.json', JSON.stringify(suspicious, null, 2));
    console.log('📝 Saved to: suspicious_matches.json');
    
    console.log('\n⚠️  SUSPICIOUS MATCHES:');
    suspicious.forEach(s => {
      console.log(`  - "${s.caseName}" → "${s.employeeName}" (${s.nip}) [${s.similarity}%]`);
    });
  }
  
  return suspicious;
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  console.log('🔧 FIX WRONG EMPLOYEE MATCHES');
  console.log('='.repeat(80));
  
  // Step 1: Rollback known wrong matches
  await rollbackWrongMatches();
  
  // Step 2: Review all matches for suspicious ones
  const suspicious = await reviewAllMatches();
  
  console.log('\n' + '='.repeat(80));
  console.log('📊 SUMMARY');
  console.log('='.repeat(80));
  console.log(`✅ Rolled back: ${wrongMatches.length} wrong matches`);
  console.log(`⚠️  Found: ${suspicious?.length || 0} suspicious matches for review`);
  console.log('='.repeat(80));
  
  if (suspicious && suspicious.length > 0) {
    console.log('\n⚠️  NEXT STEPS:');
    console.log('1. Review suspicious_matches.json');
    console.log('2. Add confirmed wrong matches to wrongMatches array in this script');
    console.log('3. Run script again to rollback');
  }
  
  console.log('\n✅ Process completed!');
}

main().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
