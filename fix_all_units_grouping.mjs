#!/usr/bin/env node

/**
 * Script untuk merapihkan position_order SEMUA UNIT agar jabatan sejenis berkelompok
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
function getBaseName(positionName) {
  const levelKeywords = Object.keys(HIERARCHY_ORDER).join('|');
  const regex = new RegExp(`\\s+(${levelKeywords})$`, 'i');
  const baseName = positionName.replace(regex, '').trim();
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

async function fixPositionOrderForDepartment(department, dryRun = true) {
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
    
    // Group by base name
    const groups = new Map();
    categoryPositions.forEach(pos => {
      const baseName = getBaseName(pos.position_name);
      if (!groups.has(baseName)) {
        groups.set(baseName, []);
      }
      groups.get(baseName).push(pos);
    });
    
    // Sort groups by the first position's current order
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
        }
        
        newOrder++;
      }
    }
  }
  
  if (!dryRun && updates.length > 0) {
    // Apply updates
    for (const update of updates) {
      const { error } = await supabase
        .from('position_references')
        .update({ position_order: update.new_order })
        .eq('id', update.id);
      
      if (error) {
        console.error(`❌ Failed to update ${update.position_name}:`, error.message);
      }
    }
  }
  
  return {
    department,
    total: positions.length,
    updated: updates.length,
    updates: dryRun ? updates : []
  };
}

async function main() {
  console.log('🚀 Fix Position Order Grouping - ALL UNITS\n');
  console.log('=' .repeat(80));
  console.log('\n');
  
  const mode = process.argv[2] || 'dry-run';
  const dryRun = mode !== 'apply';
  
  console.log(`Mode: ${dryRun ? '🔍 DRY RUN (preview only)' : '💾 APPLY (will update database)'}\n`);
  
  try {
    // Get all departments
    const { data: allPositions } = await supabase
      .from('position_references')
      .select('department')
      .limit(1000);
    
    const departments = [...new Set(allPositions?.map(p => p.department) || [])];
    console.log(`Found ${departments.length} departments\n`);
    
    const results = [];
    let totalUpdates = 0;
    
    for (let i = 0; i < departments.length; i++) {
      const dept = departments[i];
      console.log(`[${i + 1}/${departments.length}] Processing: ${dept}...`);
      
      const result = await fixPositionOrderForDepartment(dept, dryRun);
      results.push(result);
      totalUpdates += result.updated;
      
      if (result.updated > 0) {
        console.log(`   ✅ ${result.updated} positions need update (total: ${result.total})`);
      } else {
        console.log(`   ✓ Already correct (${result.total} positions)`);
      }
    }
    
    console.log('\n');
    console.log('=' .repeat(80));
    console.log('SUMMARY');
    console.log('=' .repeat(80));
    console.log(`Total departments: ${departments.length}`);
    console.log(`Total positions needing update: ${totalUpdates}`);
    console.log('=' .repeat(80));
    console.log('\n');
    
    // Show departments with most updates
    const topDepts = results
      .filter(r => r.updated > 0)
      .sort((a, b) => b.updated - a.updated)
      .slice(0, 10);
    
    if (topDepts.length > 0) {
      console.log('Top 10 departments with most updates:\n');
      topDepts.forEach((r, i) => {
        console.log(`  ${i + 1}. ${r.department}: ${r.updated} updates`);
      });
      console.log('\n');
    }
    
    // Save report
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const reportFile = `fix_all_units_grouping_${timestamp}.json`;
    writeFileSync(reportFile, JSON.stringify({
      mode: dryRun ? 'dry-run' : 'apply',
      timestamp: new Date().toISOString(),
      summary: {
        total_departments: departments.length,
        total_updates: totalUpdates,
        departments_affected: results.filter(r => r.updated > 0).length
      },
      results: results
    }, null, 2));
    
    console.log(`📄 Report saved to: ${reportFile}\n`);
    
    if (dryRun) {
      console.log('=' .repeat(80));
      console.log('This was a DRY RUN - no changes were made to the database.');
      console.log('To apply changes, run:');
      console.log('  node fix_all_units_grouping.mjs apply');
      console.log('=' .repeat(80));
      console.log('\n');
    } else {
      console.log('=' .repeat(80));
      console.log('✅ ALL UPDATES COMPLETED SUCCESSFULLY!');
      console.log(`   ${totalUpdates} positions have been reordered across ${results.filter(r => r.updated > 0).length} departments`);
      console.log('=' .repeat(80));
      console.log('\n');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();
