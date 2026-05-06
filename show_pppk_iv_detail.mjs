import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mauyygrbdopmpdpnwzra.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1hdXl5Z3JiZG9wbXBkcG53enJhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDkzMTM4NCwiZXhwIjoyMDkwNTA3Mzg0fQ.qMJoz6Xuy4PKwS-LKWpjf_WM5o0fuNtEE4hsgLjJX4Q';

const supabase = createClient(supabaseUrl, supabaseKey);

async function showPPPKIVDetail() {
  console.log('📋 Data Lengkap PPPK dengan rank_group "IV":\n');
  console.log('='.repeat(80));
  console.log('\n');
  
  // Query: PPPK dengan rank_group = 'IV'
  const { data: pppkData, error } = await supabase
    .from('employees')
    .select('*')
    .ilike('asn_status', '%pppk%')
    .eq('rank_group', 'IV')
    .single();

  if (error) {
    console.error('❌ Error:', error);
    return;
  }

  if (!pppkData) {
    console.log('❌ Data tidak ditemukan');
    return;
  }

  // Tampilkan semua field
  console.log('👤 INFORMASI PEGAWAI');
  console.log('-'.repeat(80));
  console.log(`ID                : ${pppkData.id}`);
  console.log(`NIP               : ${pppkData.nip}`);
  console.log(`Nama              : ${pppkData.name}`);
  console.log(`Email             : ${pppkData.email || '-'}`);
  console.log(`Phone             : ${pppkData.phone || '-'}`);
  console.log('');

  console.log('📊 STATUS KEPEGAWAIAN');
  console.log('-'.repeat(80));
  console.log(`Status ASN        : ${pppkData.asn_status}`);
  console.log(`Rank Group        : ${pppkData.rank_group}`);
  console.log(`Position Type     : ${pppkData.position_type || '-'}`);
  console.log(`Position Name     : ${pppkData.position_name || '-'}`);
  console.log(`Position SK       : ${pppkData.position_sk || '-'}`);
  console.log(`Department        : ${pppkData.department}`);
  console.log('');

  console.log('👨‍👩‍👧‍👦 DATA PRIBADI');
  console.log('-'.repeat(80));
  console.log(`Gender            : ${pppkData.gender || '-'}`);
  console.log(`Birth Place       : ${pppkData.birth_place || '-'}`);
  console.log(`Birth Date        : ${pppkData.birth_date || '-'}`);
  console.log(`Religion          : ${pppkData.religion || '-'}`);
  console.log(`Address           : ${pppkData.address || '-'}`);
  console.log('');

  console.log('📅 TANGGAL PENTING');
  console.log('-'.repeat(80));
  console.log(`TMT CPNS          : ${pppkData.tmt_cpns || '-'}`);
  console.log(`TMT PNS           : ${pppkData.tmt_pns || '-'}`);
  console.log(`SK Date           : ${pppkData.sk_date || '-'}`);
  console.log(`SK Number         : ${pppkData.sk_number || '-'}`);
  console.log('');

  console.log('🎓 PENDIDIKAN & KEAHLIAN');
  console.log('-'.repeat(80));
  console.log(`Kejuruan          : ${pppkData.kejuruan || '-'}`);
  console.log('');

  console.log('🔧 METADATA');
  console.log('-'.repeat(80));
  console.log(`Created At        : ${pppkData.created_at}`);
  console.log(`Updated At        : ${pppkData.updated_at}`);
  console.log(`Created By        : ${pppkData.created_by || '-'}`);
  console.log(`Updated By        : ${pppkData.updated_by || '-'}`);
  console.log('');

  console.log('='.repeat(80));
  console.log('\n');

  // Cek apakah ini seharusnya golongan III?
  console.log('💡 ANALISIS:');
  console.log('-'.repeat(80));
  console.log('Rank Group saat ini: "IV"');
  console.log('');
  console.log('Kemungkinan:');
  console.log('1. Data salah input (seharusnya "III" bukan "IV")');
  console.log('2. PPPK memang bisa memiliki golongan IV');
  console.log('3. Perlu konfirmasi dengan data resmi');
  console.log('');
  console.log('Golongan PPPK yang umum: III, V, VII, IX');
  console.log('Golongan PPPK yang jarang: IV (perlu verifikasi)');
  console.log('');
}

showPPPKIVDetail().catch(console.error);
