import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://mauyygrbdopmpdpnwzra.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1hdXl5Z3JiZG9wbXBkcG53enJhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDkzMTM4NCwiZXhwIjoyMDkwNTA3Mzg0fQ.qMJoz6Xuy4PKwS-LKWpjf_WM5o0fuNtEE4hsgLjJX4Q';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function inspectManual() {
  const { data: cases } = await supabase
    .from('employee_cases')
    .select('id, employee_id, employee_name, employee_nip')
    .like('employee_id', 'MANUAL_%');

  console.log('--- Manual Entries ---');
  console.log(JSON.stringify(cases, null, 2));

  const { data: employees } = await supabase
    .from('employees')
    .select('id, name, nip')
    .limit(10);
  
  console.log('\n--- Sample Employees ---');
  console.log(JSON.stringify(employees, null, 2));
}

inspectManual().catch(console.error);
