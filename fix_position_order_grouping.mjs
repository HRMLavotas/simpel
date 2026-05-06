#!/usr/bin/env node

/**
 * Script untuk merapihkan position_order agar jabatan sejenis berkelompok
 * 
 * Logika:
 * 1. Kelompokkan jabatan berdasarkan "base name" (Instruktur, Arsiparis, Analis Anggaran, dll)
 * 2. Dalam setiap kelompok, urutkan berdasarkan hierarki (Utama → Madya → Muda → dst)
 * 3. Assign position_order baru yang berurutan per kelompok
 */

import { createClient } from '@supabase/supabase-js';
import { writeFileSync } from 'fs';

const supabaseUrl = 'https://mauyygrbdopmpdpnwzra.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1hdXl5Z3JiZG9wbXBkcG53enJhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDkzMTM4NCwiZXhwIjoyMDkwNTA3Mzg0fQ.qMJoz6Xuy4PKwS-LKWpjf_WM5o0fuNtEE4hsgLjJX4Q';

const supabase = createClient(supabaseUrl, supabaseKey);

// Hierarki level untuk sorting
const HIERARCHY_ORDER = {
  'Utama': 1,
  'Madya': 2,
  'Muda': 3,
  'Pertama': 4,
  'Penyelia': 5,
  'Mahir': 6,
  'Pelaksana Lanjutan': 7,
  'Terampil': 8,
  'Pelaksana': 9,
};

// Extract base name dari position name
// Contoh: "Analis Hukum Ahli Madya" → "Analis Hukum"
//         "Arsiparis Mahir" → "Arsiparis"
//         "Instruktur Ahli Utama" → "Instruktur Ahli"
function getBaseName(positionName) {
  // Remove level keywords
  const levelKeywords = Object.keys(HIERARCHY_ORDER).join('|');
  const regex = new RegExp(`\\s+(${levelKeywords})$`, 'i');
  const baseName = positionName.replace(regex, '').trim();
  
  // Special case: "Instruktur Ahli" vs "Instruktur"
  // Keep "Ahli" if it's part of the base name
  return baseName;
}

// Extract level dari position name
function getLevel(positionName) {
  for (const level of Object.keys(HIERARCHY_ORDER)) {
    if (positionName.includes(level)) {
      return level;
    }
  }
  return null;
}

// Get hierarchy order for sorting
function getHierarchyOrder(positionName) {
  const level = getLevel(positionName);
  return level ? HIERARCHY_ORDER[level] : 999;
}

async function fixPositionOrderGrouping(department, dryRun = true) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`Processing: ${department}`);
  console.log(`Mode: ${dryRun ? 'DRY RUN (no changes)' : 'LIVE (will update database)'}`);
  console.log(`${'='.repeat(80)}\n`);
  
  // Fetch all positions for this department
  const { data: positions, error } = await supabase
    .from('position_references')
    .select('*')
    .eq('department', department)
    .order('position_category')
    .order('position_order')
    .order('position_name');
  
  if (error) throw error;
  
  const updates = [];
  const categories = ['Struktural', 'Fungsional', 'Pelaksana'];
  
  for (const category of categories) {
    const categoryPositions = positions.filter(p => p.position_category === category);
    if (categoryPositions.length === 0) continue;
    
    console.log(`\n📂 Category: ${category} (${categoryPositions.length} positions)`);
    
    // Group by base name
    const groups = new Map();
    categoryPositions.forEach(pos => {
      const baseName = getBaseName(pos.position_name);
      if (!groups.has(baseName)) {
        groups.set(baseName, []);
      }
      groups.get(baseName).push(pos);
    });
    
    console.log(`   Found ${groups.size} position groups\n`);
    
    // Sort groups by the first position's current order (to maintain relative order between groups)
    const sortedGroups = Array.from(groups.entries()).sort((a, b) => {
      const minOrderA = Math.min(...a[1].map(p => p.position_order));
      const minOrderB = Math.min(...b[1].map(p => p.position_order));
      if (minOrderA !== minOrderB) return minOrderA - minOrderB;
      return a[0].localeCompare(b[0]);
    });
    
    let newOrder = 1;
    
    for (const [baseName, groupPositions] of sortedGroups) {
      // Sort within group by hierarchy
      groupPositions.sort((a, b) => {
        const orderA = getHierarchyOrder(a.position_name);
        const orderB = getHierarchyOrder(b.position_name);
        if (orderA !== orderB) return orderA - orderB;
        return a.position_name.localeCompare(b.position_name);
      });
      
      console.log(`   ${baseName}:`);
      
      for (const pos of groupPositions) {
        const oldOrder = pos.position_order;
        const needsUpdate = oldOrder !== newOrder;
        
        if (needsUpdate) {
          updates.push({
            id: pos.id,
            position_name: pos.position_name,
            old_order: oldOrder,
            new_order: newOrder,
            category: category
          });
          console.log(`      ${newOrder}. ${pos.position_name} (was: ${oldOrder}) ${needsUpdate ? '← UPDATE' : ''}`);
        } else {
          console.log(`      ${newOrder}. ${pos.position_name} (unchanged)`);
        }
        
        newOrder++;
      }
    }
  }
  
  console.log(`\n${'='.repeat(80)}`);
  console.log(`Summary for ${department}:`);
  console.log(`  Total positions: ${positions.length}`);
  console.log(`  Positions needing update: ${updates.length}`);
  console.log(`${'='.repeat(80)}\n`);
  
  if (updates.length === 0) {
    console.log('✅ No updates needed - all positions are already correctly ordered!\n');
    return { department, updated: 0, total: positions.length };
  }
  
  if (dryRun) {
    console.log('🔍 DRY RUN - No changes made to database\n');
    console.log('Preview of changes:');
    updates.slice(0, 10).forEach(u => {
      console.log(`  - ${u.position_name}: order ${u.old_order} → ${u.new_order}`);
    });
    if (updates.length > 10) {
      console.log(`  ... and ${updates.length - 10} more`);
    }
    console.log('\nRun with dryRun=false to apply changes.\n');
    return { department, updated: 0, total: positions.length, preview: updates.length };
  }
  
  // Apply updates
  console.log('💾 Applying updates to database...\n');
  let successCount = 0;
  
  for (const update of updates) {
    const { error } = await supabase
      .from('position_references')
      .update({ position_order: update.new_order })
      .eq('id', update.id);
    
    if (error) {
      console.error(`❌ Failed to update ${update.position_name}:`, error.message);
    } else {
      successCount++;
    }
  }
  
  console.log(`✅ Successfully updated ${successCount}/${updates.length} positions\n`);
  
  return { department, updated: successCount, total: positions.length };
}

async function main() {
  console.log('🚀 Fix Position Order Grouping\n');
  console.log('This script will reorder positions so that similar positions are grouped together.\n');
  
  const targetDepartment = process.argv[2] || 'Setditjen Binalavotas';
  const mode = process.argv[3] || 'dry-run';
  const dryRun = mode !== 'apply';
  
  try {
    const result = await fixPositionOrderGrouping(targetDepartment, dryRun);
    
    // Save report
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const reportFile = `fix_grouping_${targetDepartment.replace(/\s/g, '_')}_${timestamp}.json`;
    writeFileSync(reportFile, JSON.stringify(result, null, 2));
    console.log(`📄 Report saved to: ${reportFile}\n`);
    
    if (dryRun) {
      console.log('To apply changes, run:');
      console.log(`  node fix_position_order_grouping.mjs "${targetDepartment}" apply\n`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();
