import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://mauyygrbdopmpdpnwzra.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1hdXl5Z3JiZG9wbXBkcG53enJhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDkzMTM4NCwiZXhwIjoyMDkwNTA3Mzg0fQ.qMJoz6Xuy4PKwS-LKWpjf_WM5o0fuNtEE4hsgLjJX4Q';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function findSpecific() {
  const nip = '197910292006041002';
  const name = 'Morendy Octora';

  console.log(`🔍 Mencari NIP: ${nip}`);
  const { data: byNip } = await supabase
    .from('employees')
    .select('id, name, nip')
    .eq('nip', nip);
  
  console.log('Hasil by NIP:', byNip);

  console.log(`\n🔍 Mencari Nama mengandung: ${name}`);
  const { data: byName } = await supabase
    .from('employees')
    .select('id, name, nip')
    .ilike('name', `%${name}%`);
  
  console.log('Hasil by Name:', byName);
}

findSpecific().catch(console.error);
