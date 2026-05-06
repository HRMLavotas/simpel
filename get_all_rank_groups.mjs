#!/usr/bin/env node

/**
 * Script untuk mendapatkan semua unique rank_group values dari database
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mauyygrbdopmpdpnwzra.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1hdXl5Z3JiZG9wbXBkcG53enJhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDkzMTM4NCwiZXhwIjoyMDkwNTA3Mzg0fQ.qMJoz6Xuy4PKwS-LKWpjf_WM5o0fuNtEE4hsgLjJX4Q';

const supabase = createClient(supabaseUrl, supabaseKey);

async function getAllRankGroups() {
  console.log('🔍 Getting ALL unique rank_group values from database\n');
  
  const allRanks = new Set();
  let offset = 0;
  const batchSize = 1000;
  
  while (true) {
    const { data, error } = await supabase
      .from('employees')
      .select('rank_group')
      .not('rank_group', 'is', null)
      .range(offset, offset + batchSize - 1);
    
    if (error) {
      console.error('Error:', error);
      return;
    }
    
    if (!data || data.length === 0) break;
    
    data.forEach(emp => {
      if (emp.rank_group) {
        allRanks.add(emp.rank_group);
      }
    });
    
    if (data.length < batchSize) break;
    offset += batchSize;
  }
  
  console.log(`Found ${allRanks.size} unique rank_group values\n`);
  
  const sortedRanks = Array.from(allRanks).sort((a, b) => {
    // Extract golongan number for sorting
    const extractGol = (str) => {
      const match = str.match(/\(([IVX]+)\/([a-e])\)/);
      if (!match) return [999, str]; // Put non-standard at end
      const roman = match[1];
      const sub = match[2];
      const romanToNum = { 'I': 1, 'II': 2, 'III': 3, 'IV': 4, 'V': 5, 'VII': 7, 'IX': 9 };
      return [romanToNum[roman] || 999, sub];
    };
    
    const [golA, subA] = extractGol(a);
    const [golB, subB] = extractGol(b);
    
    if (golA !== golB) return golA - golB;
    return subA.localeCompare(subB);
  });
  
  console.log('All unique rank_group values (sorted):');
  console.log('');
  
  sortedRanks.forEach((rank, i) => {
    console.log(`  "${rank}",`);
  });
  
  console.log('\n');
  console.log('TypeScript array format:');
  console.log('');
  console.log('rank_group: [');
  sortedRanks.forEach(rank => {
    console.log(`  '${rank}',`);
  });
  console.log('],');
}

getAllRankGroups();
