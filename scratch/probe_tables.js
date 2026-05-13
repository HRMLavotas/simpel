import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://mauyygrbdopmpdpnwzra.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1hdXl5Z3JiZG9wbXBkcG53enJhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDkzMTM4NCwiZXhwIjoyMDkwNTA3Mzg0fQ.qMJoz6Xuy4PKwS-LKWpjf_WM5o0fuNtEE4hsgLjJX4Q';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function listAllTables() {
  const { data, error } = await supabase.rpc('get_tables'); // If a custom RPC exists
  if (error) {
    // If RPC fails, try common names
    const commonTables = ['employees', 'employee_cases', 'disciplinary_actions', 'non_asn_employees', 'departments', 'users'];
    console.log('Testing common tables:');
    for (const table of commonTables) {
      const { count, error: tableError } = await supabase.from(table).select('*', { count: 'exact', head: true });
      if (!tableError) {
        console.log(`- ${table}: ${count} rows`);
      } else {
        // console.log(`- ${table}: Error ${tableError.message}`);
      }
    }
  } else {
    console.log('Tables:', data);
  }
}

listAllTables().catch(console.error);
