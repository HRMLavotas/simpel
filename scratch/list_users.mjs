import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mauyygrbdopmpdpnwzra.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1hdXl5Z3JiZG9wbXBkcG53enJhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDkzMTM4NCwiZXhwIjoyMDkwNTA3Mzg0fQ.qMJoz6Xuy4PKwS-LKWpjf_WM5o0fuNtEE4hsgLjJX4Q';

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data: roles, error: rolesError } = await supabase
    .from('user_roles')
    .select('role, user_id')
    .eq('role', 'admin_pusat');
    
  if (rolesError) {
    console.error('Error fetching roles:', rolesError);
    return;
  }
  
  const userIds = roles.map(r => r.user_id);
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, email, full_name')
    .in('id', userIds);
    
  if (profilesError) {
    console.error('Error fetching profiles:', profilesError);
    return;
  }
  
  console.log('Admin Pusat users:', profiles);
}

run();
