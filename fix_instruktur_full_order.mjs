import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const supabaseUrl = "https://mauyygrbdopmpdpnwzra.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1hdXl5Z3JiZG9wbXBkcG53enJhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDkzMTM4NCwiZXhwIjoyMDkwNTA3Mzg0fQ.qMJoz6Xuy4PKwS-LKWpjf_WM5o0fuNtEE4hsgLjJX4Q";

const supabase = createClient(supabaseUrl, supabaseKey);

// Read issues from JSON
const issues = JSON.parse(readFileSync('instruktur_order_issues.json', 'utf-8'));

async function fixInstrukturFullOrder() {
  console.log('🔧 Memperbaiki urutan lengkap jabatan Instruktur...\n');
  console.log(`📊 Total unit yang perlu diperbaiki: ${issues.length}\n`);

  let successCount = 0;
  let errorCount = 0;

  for (const unit of issues) {
    console.log(`\n📍 ${unit.department}`);
    console.log('─'.repeat(80));

    try {
      // Sort positions by expected rank
      const sortedPositions = unit.positions
        .sort((a, b) => a.expectedRank - b.expectedRank);

      console.log('  Urutan baru yang akan diterapkan:');
      sortedPositions.forEach((pos, idx) => {
        console.log(`    ${(idx + 1).toString().padStart(2, ' ')}. ${pos.name} (rank: ${pos.expectedRank})`);
      });

      // Get the minimum order from the first Instruktur position in this category
      // This ensures we maintain the position within the category
      const minOrder = Math.min(...unit.positions.map(p => p.currentOrder));

      // Update each position with new order
      for (let i = 0; i < sortedPositions.length; i++) {
        const pos = sortedPositions[i];
        const newOrder = minOrder + i;

        const { error } = await supabase
          .from('position_references')
          .update({ position_order: newOrder })
          .eq('id', pos.id);

        if (error) throw error;
      }

      console.log(`  ✅ Berhasil: ${sortedPositions.length} jabatan diurutkan ulang`);
      successCount++;

    } catch (error) {
      console.log(`  ❌ Error: ${error.message}`);
      errorCount++;
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log(`\n📊 Hasil:`);
  console.log(`   ✅ Berhasil: ${successCount} unit`);
  console.log(`   ❌ Gagal: ${errorCount} unit`);
  
  if (successCount > 0) {
    console.log(`\n✨ Urutan jabatan Instruktur telah diperbaiki!`);
    console.log(`   Sekarang urutan dari tinggi ke rendah:`);
    console.log(`   1. Instruktur Ahli Utama (paling senior)`);
    console.log(`   2. Instruktur Ahli Madya`);
    console.log(`   3. Instruktur Ahli Muda`);
    console.log(`   4. Instruktur Ahli Pertama`);
    console.log(`   5. Instruktur Penyelia`);
    console.log(`   6. Instruktur Mahir`);
    console.log(`   7. Instruktur Terampil`);
    console.log(`   8. Instruktur Pelaksana (paling junior)`);
  }
}

fixInstrukturFullOrder();
