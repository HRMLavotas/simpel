#!/usr/bin/env node

/**
 * Test script untuk validasi format pangkat
 * Jalankan dengan: node test_rank_validation.mjs
 */

// Fungsi validasi yang sama dengan useDataAudit.ts
const isValidRankFormat = (rank) => {
  if (!rank) return false;
  
  const trimmedRank = rank.trim();
  
  // Format 1: Full format with name "Penata Muda Tk I (III/b)", "Pembina (IV/a)", dll
  // Ini harus dicek dulu karena lebih spesifik
  const fullPattern = /\((I{1,4}|IV)\/[a-e]\)$/i;
  if (fullPattern.test(trimmedRank)) return true;
  
  // Format 2: Short format "I/a", "II/b", "III/c", "IV/d", dll (PNS)
  const shortPattern = /^(I{1,4}|IV)\/[a-e]$/i;
  if (shortPattern.test(trimmedRank)) return true;
  
  // Format 3: PPPK format (hanya III, V, VII, IX)
  const pppkPattern = /^(III|V|VII|IX)$/;
  if (pppkPattern.test(trimmedRank)) return true;
  
  // Format 4: "Tidak Ada"
  if (trimmedRank === 'Tidak Ada') return true;
  
  return false;
};

// Test cases
const testCases = [
  // Valid - PNS Short Format
  { rank: 'I/a', expected: true, description: 'PNS short format I/a' },
  { rank: 'II/b', expected: true, description: 'PNS short format II/b' },
  { rank: 'III/c', expected: true, description: 'PNS short format III/c' },
  { rank: 'IV/d', expected: true, description: 'PNS short format IV/d' },
  { rank: 'IV/e', expected: true, description: 'PNS short format IV/e' },
  
  // Valid - PNS Full Format
  { rank: 'Juru Muda (I/a)', expected: true, description: 'PNS full format Juru Muda (I/a)' },
  { rank: 'Pengatur Muda Tk I (II/b)', expected: true, description: 'PNS full format Pengatur Muda Tk I (II/b)' },
  { rank: 'Penata Muda Tk I (III/b)', expected: true, description: 'PNS full format Penata Muda Tk I (III/b)' },
  { rank: 'Pembina (IV/a)', expected: true, description: 'PNS full format Pembina (IV/a)' },
  { rank: 'Pembina Utama (IV/e)', expected: true, description: 'PNS full format Pembina Utama (IV/e)' },
  
  // Valid - PPPK Format (only III, V, VII, IX)
  { rank: 'III', expected: true, description: 'PPPK format III' },
  { rank: 'V', expected: true, description: 'PPPK format V' },
  { rank: 'VII', expected: true, description: 'PPPK format VII' },
  { rank: 'IX', expected: true, description: 'PPPK format IX' },
  
  // Valid - Special
  { rank: 'Tidak Ada', expected: true, description: 'Special case Tidak Ada' },
  
  // Invalid - Wrong Format
  { rank: 'I', expected: false, description: 'Invalid - I (not valid for PPPK)' },
  { rank: 'II', expected: false, description: 'Invalid - II (not valid for PPPK)' },
  { rank: 'IV', expected: false, description: 'Invalid - IV alone (reserved for PNS format IV/a)' },
  { rank: 'VI', expected: false, description: 'Invalid - VI (not valid for PPPK)' },
  { rank: 'VIII', expected: false, description: 'Invalid - VIII (not valid for PPPK)' },
  { rank: 'X', expected: false, description: 'Invalid - X (not valid for PPPK)' },
  { rank: 'XVII', expected: false, description: 'Invalid - XVII (not valid for PPPK)' },
  { rank: 'IVa', expected: false, description: 'Invalid - IVa without slash' },
  { rank: '4', expected: false, description: 'Invalid - number 4' },
  { rank: '4/a', expected: false, description: 'Invalid - 4/a with number' },
  { rank: 'IV/f', expected: false, description: 'Invalid - IV/f (f not valid)' },
  { rank: 'V/a', expected: false, description: 'Invalid - V/a (V not valid for PNS)' },
  { rank: 'Pembina IV/a', expected: false, description: 'Invalid - Pembina IV/a without parentheses' },
  { rank: 'XVIII', expected: false, description: 'Invalid - XVIII (not valid for PPPK)' },
  { rank: '', expected: false, description: 'Invalid - empty string' },
  { rank: null, expected: false, description: 'Invalid - null' },
];

// Run tests
console.log('🧪 Testing Rank Validation\n');
console.log('='.repeat(80));

let passed = 0;
let failed = 0;

testCases.forEach((test, index) => {
  const result = isValidRankFormat(test.rank);
  const status = result === test.expected ? '✅ PASS' : '❌ FAIL';
  
  if (result === test.expected) {
    passed++;
  } else {
    failed++;
  }
  
  console.log(`${status} | ${test.description}`);
  console.log(`       Input: "${test.rank}" | Expected: ${test.expected} | Got: ${result}`);
  
  if (result !== test.expected) {
    console.log(`       ⚠️  MISMATCH!`);
  }
  console.log('');
});

console.log('='.repeat(80));
console.log(`\n📊 Results: ${passed} passed, ${failed} failed out of ${testCases.length} tests`);

if (failed === 0) {
  console.log('✅ All tests passed!');
  process.exit(0);
} else {
  console.log('❌ Some tests failed!');
  process.exit(1);
}
