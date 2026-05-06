import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mauyygrbdopmpdpnwzra.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1hdXl5Z3JiZG9wbXBkcG53enJhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDkzMTM4NCwiZXhwIjoyMDkwNTA3Mzg0fQ.qMJoz6Xuy4PKwS-LKWpjf_WM5o0fuNtEE4hsgLjJX4Q';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixRuslanToIII() {
  console.log('🔧 Memperbaiki rank_group Ruslan Abdul Gani ke golongan III...\n');
  
  const nip = '198008142025211020';
  
  // 1. Tampilkan data sebelum update
  console.log('📋 Data SEBELUM update:');
  console.log('-'.repeat(60));
  
  const { data: before, error: errorBefore } = await supabase
    .from('employees')
    .select('id, nip, name, asn_status, rank_group, department')
    .eq('nip', nip)
    .single();

  if (errorBefore) {
    console.error('❌ Error:', errorBefore);
    return;
  }

  console.log(`Nama          : ${before.name}`);
  console.log(`NIP           : ${before.nip}`);
  console.log(`Status ASN    : ${before.asn_status}`);
  console.log(`Rank Group    : ${before.rank_group} ❌ (SALAH - seharusnya III)`);
  console.log(`Department    : ${before.department}`);
  console.log('');

  // 2. Update rank_group ke III
  console.log('⚙️  Melakukan update ke golongan III...\n');
  
  const { data: updated, error: errorUpdate } = await supabase
    .from('employees')
    .update({ 
      rank_group: 'III',
      updated_at: new Date().toISOString()
    })
    .eq('nip', nip)
    .select()
    .single();

  if (errorUpdate) {
    console.error('❌ Error saat update:', errorUpdate);
    return;
  }

  // 3. Tampilkan data setelah update
  console.log('✅ Data SETELAH update:');
  console.log('-'.repeat(60));
  console.log(`Nama          : ${updated.name}`);
  console.log(`NIP           : ${updated.nip}`);
  console.log(`Status ASN    : ${updated.asn_status}`);
  console.log(`Rank Group    : ${updated.rank_group} ✅ (BENAR - PPPK Golongan III)`);
  console.log(`Department    : ${updated.department}`);
  console.log(`Updated At    : ${updated.updated_at}`);
  console.log('');

  console.log('🎉 Update berhasil!');
  console.log('');
  console.log('📊 Ringkasan perubahan:');
  console.log(`   Rank Group: "${before.rank_group}" → "${updated.rank_group}"`);
  console.log('');
  console.log('💡 Catatan:');
  console.log('   Ruslan Abdul Gani adalah PPPK dengan pangkat golongan III');
  console.log('   Ini adalah golongan terendah untuk PPPK');
  console.log('');
}

fixRuslanToIII().catch(console.error);
