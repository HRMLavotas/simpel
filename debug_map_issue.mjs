import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mauyygrbdopmpdpnwzra.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1hdXl5Z3JiZG9wbXBkcG53enJhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDkzMTM4NCwiZXhwIjoyMDkwNTA3Mzg0fQ.qMJoz6Xuy4PKwS-LKWpjf_WM5o0fuNtEE4hsgLjJX4Q';

const supabase = createClient(supabaseUrl, supabaseKey);

function normalizeString(str) {
  if (!str) return '';
  return str
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

async function debug() {
  console.log('='.repeat(100));
  console.log('DEBUG: MENGAPA MAP TIDAK MENEMUKAN DATA?');
  console.log('='.repeat(100));
  console.log('');

  // 1. Ambil position_references untuk Bandung Barat
  const { data: posRefs } = await supabase
    .from('position_references')
    .select('*')
    .eq('department', 'BPVP Bandung Barat');

  console.log(`✅ Ditemukan ${posRefs.length} jabatan di Bandung Barat\n`);

  // 2. Buat Map
  const posRefMap = new Map();
  posRefs.forEach(pos => {
    const key = `${pos.department}|||${normalizeString(pos.position_name)}`;
    posRefMap.set(key, pos);
  });

  console.log(`✅ Map berisi ${posRefMap.size} entries\n`);

  // 3. Cari key untuk "Penata Layanan Operasional"
  const searchKey = `BPVP Bandung Barat|||penata layanan operasional`;
  
  console.log('🔍 MENCARI KEY:');
  console.log(`   "${searchKey}"`);
  console.log('');

  const found = posRefMap.get(searchKey);
  console.log(`Hasil: ${found ? '✅ DITEMUKAN' : '❌ TIDAK DITEMUKAN'}`);
  console.log('');

  if (found) {
    console.log('Data yang ditemukan:');
    console.log(JSON.stringify(found, null, 2));
  } else {
    console.log('❌ TIDAK DITEMUKAN! Mari kita cek semua keys di Map...\n');
    
    console.log('📋 SEMUA KEYS DI MAP (yang mengandung "penata layanan"):');
    console.log('');
    
    let matchCount = 0;
    for (const [key, value] of posRefMap.entries()) {
      if (key.includes('penata layanan')) {
        matchCount++;
        console.log(`${matchCount}. Key: "${key}"`);
        console.log(`   Position: "${value.position_name}"`);
        console.log(`   Department: "${value.department}"`);
        console.log('');
      }
    }

    if (matchCount === 0) {
      console.log('❌ Tidak ada key yang mengandung "penata layanan"!');
      console.log('');
      console.log('Mari kita lihat 10 key pertama di Map:');
      console.log('');
      
      let count = 0;
      for (const [key, value] of posRefMap.entries()) {
        count++;
        console.log(`${count}. "${key}"`);
        if (count >= 10) break;
      }
    }
  }

  // 4. Cek apakah ada duplikat atau masalah lain
  console.log('');
  console.log('='.repeat(100));
  console.log('🔍 CEK DUPLIKAT DAN MASALAH LAIN');
  console.log('='.repeat(100));
  console.log('');

  const keyCount = new Map();
  posRefs.forEach(pos => {
    const key = `${pos.department}|||${normalizeString(pos.position_name)}`;
    keyCount.set(key, (keyCount.get(key) || 0) + 1);
  });

  const duplicates = [];
  for (const [key, count] of keyCount.entries()) {
    if (count > 1) {
      duplicates.push({ key, count });
    }
  }

  if (duplicates.length > 0) {
    console.log(`⚠️  Ditemukan ${duplicates.length} key duplikat:\n`);
    duplicates.forEach((dup, idx) => {
      console.log(`${idx + 1}. "${dup.key}" (${dup.count}x)`);
    });
  } else {
    console.log('✅ Tidak ada duplikat');
  }

  console.log('');
  console.log('='.repeat(100));
}

debug().catch(console.error);
