import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://mauyygrbdopmpdpnwzra.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1hdXl5Z3JiZG9wbXBkcG53enJhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDkzMTM4NCwiZXhwIjoyMDkwNTA3Mzg0fQ.qMJoz6Xuy4PKwS-LKWpjf_WM5o0fuNtEE4hsgLjJX4Q';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function probeMore() {
  const tables = ['pegawai', 'data_pegawai', 'master_pegawai', 'profiles', 'asn', 'non_asn'];
  console.log('Probing more tables:');
  for (const table of tables) {
    const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true });
    if (!error) {
      console.log(`- ${table}: ${count} rows`);
    }
  }
}

probeMore().catch(console.error);
