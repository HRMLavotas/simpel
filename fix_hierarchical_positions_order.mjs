#!/usr/bin/env node

/**
 * Script untuk memperbaiki urutan jabatan berjenjang di position_references
 * Mengurutkan jabatan dari tinggi ke rendah sesuai hierarki
 */

import { createClient } from '@supabase/supabase-js';
import { writeFileSync } from 'fs';

const supabaseUrl = 'https://mauyygrbdopmpdpnwzra.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1hdXl5Z3JiZG9wbXBkcG53enJhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDkzMTM4NCwiZXhwIjoyMDkwNTA3Mzg0fQ.qMJoz6Xuy4PKwS-LKWpjf_WM5o0fuNtEE4hsgLjJX4Q';

const supabase = createClient(supabaseUrl, supabaseKey);

// Definisi hierarki jabatan berjenjang (tinggi → rendah)
const HIERARCHIES = [
  {
    name: 'Instruktur Ahli',
    pattern: /^Instruktur Ahli (Utama|Madya|Muda|Pertama)$/i,
    hierarchy: ['Instruktur Ahli Utama', 'Instruktur Ahli Madya', 'Instruktur Ahli Muda', 'Instruktur Ahli Pertama']
  },
  {
    name: 'Instruktur (Non-Ahli)',
    pattern: /^Instruktur (Penyelia|Mahir|Terampil|Pelaksana)$/i,
    hierarchy: ['Instruktur Penyelia', 'Instruktur Mahir', 'Instruktur Terampil', 'Instruktur Pelaksana']
  },
  {
    name: 'Widyaiswara',
    pattern: /^Widyaiswara (Utama|Madya|Muda)$/i,
    hierarchy: ['Widyaiswara Utama', 'Widyaiswara Madya', 'Widyaiswara Muda']
  },
  {
    name: 'Analis',
    pattern: /^Analis .+ (Ahli Utama|Ahli Madya|Ahli Muda|Ahli Pertama|Penyelia|Mahir|Terampil|Pelaksana)$/i,
    hierarchy: [
      'Ahli Utama', 'Ahli Madya', 'Ahli Muda', 'Ahli Pertama',
      'Penyelia', 'Mahir', 'Terampil', 'Pelaksana'
    ]
  },
  {
    name: 'Pranata',
    pattern: /^Pranata .+ (Ahli Utama|Ahli Madya|Ahli Muda|Ahli Pertama|Penyelia|Mahir|Terampil|Pelaksana)$/i,
    hierarchy: [
      'Ahli Utama', 'Ahli Madya', 'Ahli Muda', 'Ahli Pertama',
      'Penyelia', 'Mahir', 'Terampil', 'Pelaksana'
    ]
  },
  {
    name: 'Pengelola',
    pattern: /^Pengelola .+ (Ahli Utama|Ahli Madya|Ahli Muda|Ahli Pertama|Penyelia|Mahir|Terampil|Pelaksana)$/i,
    hierarchy: [
      'Ahli Utama', 'Ahli Madya', 'Ahli Muda', 'Ahli Pertama',
      'Penyelia', 'Mahir', 'Terampil', 'Pelaksana'
    ]
  },
  {
    name: 'Arsiparis',
    pattern: /^Arsiparis (Utama|Madya|Muda|Penyelia|Pelaksana Lanjutan|Pelaksana)$/i,
    hierarchy: ['Arsiparis Utama', 'Arsiparis Madya', 'Arsiparis Muda', 'Arsiparis Penyelia', 'Arsiparis Pelaksana Lanjutan', 'Arsiparis Pelaksana']
  },
  {
    name: 'Pustakawan',
    pattern: /^Pustakawan (Utama|Madya|Muda|Penyelia|Pelaksana Lanjutan|Pelaksana)$/i,
    hierarchy: ['Pustakawan Utama', 'Pustakawan Madya', 'Pustakawan Muda', 'Pustakawan Penyelia', 'Pustakawan Pelaksana Lanjutan', 'Pustakawan Pelaksana']
  },
  {
    name: 'Perancang',
    pattern: /^Perancang .+ (Ahli Utama|Ahli Madya|Ahli Muda|Ahli Pertama|Penyelia|Mahir|Terampil|Pelaksana)$/i,
    hierarchy: [
      'Ahli Utama', 'Ahli Madya', 'Ahli Muda', 'Ahli Pertama',
      'Penyelia', 'Mahir', 'Terampil', 'Pelaksana'
    ]
  }
];

function matchHierarchy(positionName) {
  for (const hier of HIERARCHIES) {
    if (hier.pattern.test(positionName)) {
      // Extract level from position name
      for (const level of hier.hierarchy) {
        if (positionName.includes(level) || 
            (hier.name.includes('Analis') || hier.name.includes('Pranata') || hier.name.includes('Pengelola') || hier.name.includes('Perancang')) && positionName.includes(level.split(' ').pop())) {
          return { hierarchy: hier, level, expectedIndex: hier.hierarchy.indexOf(level) };
        }
      }
    }
  }
  return null;
}

async function fetchAllPositions() {
  console.log('📊 Fetching all position_references...\n');
  
  const allPositions = [];
  let offset = 0;
  const batchSize = 1000;
  
  while (true) {
    const { data, error } = await supabase
      .from('position_references')
      .select('*')
      .range(offset, offset + batchSize - 1)
      .order('department')
      .order('position_category')
      .order('position_order');
    
    if (error) throw error;
    if (!data || data.length === 0) break;
    
    allPositions.push(...data);
    
    if (data.length < batchSize) break;
    offset += batchSize;
  }
  
  console.log(`✅ Loaded ${allPositions.length} positions\n`);
  return allPositions;
}

async function fixPositionOrder(positions, dryRun = false) {
  console.log(`🔧 ${dryRun ? 'DRY RUN - ' : ''}Fixing position order...\n`);
  
  const byDepartment = {};
  
  // Group by department
  positions.forEach(pos => {
    if (!byDepartment[pos.department]) {
      byDepartment[pos.department] = [];
    }
    byDepartment[pos.department].push(pos);
  });
  
  const fixes = [];
  let totalFixed = 0;
  
  // Process each department
  for (const [dept, deptPositions] of Object.entries(byDepartment)) {
    const hierarchicalGroups = {};
    const nonHierarchical = [];
    
    // Separate hierarchical and non-hierarchical positions
    deptPositions.forEach(pos => {
      const match = matchHierarchy(pos.position_name);
      if (match) {
        const key = `${match.hierarchy.name}`;
        if (!hierarchicalGroups[key]) {
          hierarchicalGroups[key] = [];
        }
        hierarchicalGroups[key].push({
          ...pos,
          expectedLevel: match.level,
          expectedIndex: match.expectedIndex
        });
      } else {
        nonHierarchical.push(pos);
      }
    });
    
    // Fix order within each hierarchical group
    for (const [groupName, group] of Object.entries(hierarchicalGroups)) {
      if (group.length < 2) continue; // Skip if only 1 position
      
      // Sort by current position_order
      group.sort((a, b) => a.position_order - b.position_order);
      
      // Check if order matches expected hierarchy
      let needsFix = false;
      for (let i = 0; i < group.length - 1; i++) {
        if (group[i].expectedIndex > group[i + 1].expectedIndex) {
          needsFix = true;
          break;
        }
      }
      
      if (!needsFix) continue;
      
      // Sort by expected hierarchy
      const sorted = [...group].sort((a, b) => a.expectedIndex - b.expectedIndex);
      
      // Get the position_order range for this group
      const minOrder = Math.min(...group.map(p => p.position_order));
      
      // Assign new position_order values
      const updates = [];
      sorted.forEach((pos, idx) => {
        const newOrder = minOrder + idx;
        if (pos.position_order !== newOrder) {
          updates.push({
            id: pos.id,
            oldOrder: pos.position_order,
            newOrder,
            name: pos.position_name,
            department: pos.department,
            category: pos.position_category
          });
        }
      });
      
      if (updates.length > 0) {
        fixes.push({
          department: dept,
          category: group[0].position_category,
          groupName,
          updates
        });
        totalFixed += updates.length;
      }
    }
  }
  
  if (fixes.length === 0) {
    console.log('✅ No fixes needed - all positions are correctly ordered!\n');
    return { success: true, fixed: 0, fixes: [] };
  }
  
  console.log(`⚠️  Found ${fixes.length} groups needing fixes (${totalFixed} positions)\n`);
  
  if (dryRun) {
    console.log('📋 DRY RUN - Changes that would be made:\n');
    fixes.forEach((fix, idx) => {
      console.log(`${idx + 1}. ${fix.department} - ${fix.category} - ${fix.groupName}`);
      fix.updates.forEach(u => {
        console.log(`   ${u.name}: order ${u.oldOrder} → ${u.newOrder}`);
      });
      console.log('');
    });
    return { success: true, fixed: 0, fixes, dryRun: true };
  }
  
  // Apply fixes
  console.log('🚀 Applying fixes...\n');
  let successCount = 0;
  let errorCount = 0;
  
  for (const fix of fixes) {
    console.log(`Fixing ${fix.department} - ${fix.groupName}...`);
    
    for (const update of fix.updates) {
      try {
        const { error } = await supabase
          .from('position_references')
          .update({ position_order: update.newOrder })
          .eq('id', update.id);
        
        if (error) throw error;
        successCount++;
        console.log(`  ✅ ${update.name}: ${update.oldOrder} → ${update.newOrder}`);
      } catch (error) {
        errorCount++;
        console.error(`  ❌ ${update.name}: ${error.message}`);
      }
    }
    console.log('');
  }
  
  console.log('=' .repeat(80));
  console.log(`\n✅ Fix complete!`);
  console.log(`   Success: ${successCount} positions`);
  console.log(`   Errors: ${errorCount} positions`);
  console.log(`   Total: ${totalFixed} positions\n`);
  
  return { success: errorCount === 0, fixed: successCount, fixes };
}

async function main() {
  console.log('🚀 Starting Hierarchical Position Order Fix\n');
  console.log('=' .repeat(80));
  console.log('\n');
  
  const dryRun = process.argv.includes('--dry-run');
  
  if (dryRun) {
    console.log('⚠️  DRY RUN MODE - No changes will be made\n');
  }
  
  try {
    const positions = await fetchAllPositions();
    const result = await fixPositionOrder(positions, dryRun);
    
    // Save report
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const reportFile = `fix_hierarchical_positions_report_${timestamp}.json`;
    writeFileSync(reportFile, JSON.stringify(result, null, 2));
    console.log(`📄 Report saved to: ${reportFile}\n`);
    
    if (dryRun) {
      console.log('💡 To apply these changes, run without --dry-run flag\n');
    } else {
      console.log('🎉 All hierarchical positions are now correctly ordered!\n');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();
