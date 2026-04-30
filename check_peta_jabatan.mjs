import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://mauyygrbdopmpdpnwzra.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1hdXl5Z3JiZG9wbXBkcG53enJhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDkzMTM4NCwiZXhwIjoyMDkwNTA3Mzg0fQ.qMJoz6Xuy4PKwS-LKWpjf_WM5o0fuNtEE4hsgLjJX4Q'
);

// Cek semua tabel yang ada
const { data: tables, error } = await supabase
  .rpc('get_tables')
  .select('*');

if (error) {
  // Coba cara lain - query langsung ke information_schema
  const { data: t2, error: e2 } = await supabase
    .from('information_schema.tables')
    .select('table_name')
    .eq('table_schema', 'public')
    .order('table_name');
  
  if (e2) {
    console.log('Tidak bisa query information_schema, coba tabel-tabel umum...');
    
    // Coba tabel-tabel yang mungkin ada
    const candidates = [
      'position_map', 'peta_jabatan', 'jabatan', 'positions', 
      'job_positions', 'org_positions', 'unit_positions',
      'position_catalog', 'jabatan_catalog', 'formasi'
    ];
    
    for (const tbl of candidates) {
      const { data, error: tblErr } = await supabase
        .from(tbl)
        .select('*')
        .limit(1);
      if (!tblErr && data !== null) {
        console.log(`✅ Tabel "${tbl}" ADA. Kolom: ${Object.keys(data[0] || {}).join(', ')}`);
        
        // Cari yang berhubungan dengan Semarang
        const { data: semarang } = await supabase
          .from(tbl)
          .select('*')
          .limit(5);
        if (semarang && semarang.length > 0) {
          console.log('  Sample data:', JSON.stringify(semarang[0]));
        }
      }
    }
  } else {
    console.log('Tabel yang ada di public schema:');
    t2.forEach(t => console.log(' -', t.table_name));
  }
} else {
  console.log('Tables:', tables);
}
