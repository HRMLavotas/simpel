
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: resolve(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkConnections() {
  console.log('Checking disciplinary_actions connections...');
  
  const { data: actions, error: actionsError } = await supabase
    .from('disciplinary_actions')
    .select('id, employee_id, employee_name, employee_nip, level, type, end_date');
    
  if (actionsError) {
    console.error('Error fetching actions:', actionsError);
    return;
  }
  
  console.log(`Found ${actions?.length} disciplinary actions.`);
  
  const results = [];
  for (const action of actions || []) {
    const { data: employee, error: employeeError } = await supabase
      .from('employees')
      .select('id, name')
      .eq('id', action.employee_id)
      .maybeSingle();
      
    const isExpired = action.end_date && new Date(action.end_date) < new Date();
    
    results.push({
      id: action.id,
      employee_id: action.employee_id,
      employee_name: action.employee_name,
      employee_exists: !!employee,
      is_expired: isExpired,
      end_date: action.end_date
    });
  }
  
  console.table(results.slice(0, 20));
  
  const disconnected = results.filter(r => !r.employee_exists).length;
  const expired = results.filter(r => r.is_expired).length;
  
  console.log(`Disconnected: ${disconnected}`);
  console.log(`Expired: ${expired}`);
  console.log(`Active & Connected: ${results.length - disconnected - expired}`);
}

checkConnections();
