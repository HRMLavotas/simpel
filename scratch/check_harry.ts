
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

async function checkHarry() {
  console.log('Searching for Harry Purnama...');
  
  // 1. Find employee
  const { data: employees, error: empError } = await supabase
    .from('employees')
    .select('id, name, nip')
    .ilike('name', '%Harry Purnama%');
    
  if (empError) {
    console.error('Error finding employee:', empError);
    return;
  }
  
  if (!employees || employees.length === 0) {
    console.log('Employee "Harry Purnama" not found in database.');
    return;
  }
  
  for (const emp of employees) {
    console.log(`Found: ${emp.name} (ID: ${emp.id}, NIP: ${emp.nip})`);
    
    // 2. Check cases
    const { data: cases } = await supabase
      .from('employee_cases')
      .select('id, case_type, status, employee_id')
      .eq('employee_id', emp.id);
      
    console.log(`- Cases associated: ${cases?.length || 0}`);
    if (cases && cases.length > 0) {
      cases.forEach(c => console.log(`  * Case ID: ${c.id}, Type: ${c.case_type}, Status: ${c.status}`));
    }
    
    // 3. Check disciplinary actions
    const { data: actions } = await supabase
      .from('disciplinary_actions')
      .select('id, type, level, effective_date, end_date')
      .eq('employee_id', emp.id);
      
    console.log(`- Disciplinary actions associated: ${actions?.length || 0}`);
    if (actions && actions.length > 0) {
      actions.forEach(a => {
        const isExpired = a.end_date && new Date(a.end_date) < new Date();
        console.log(`  * Action ID: ${a.id}, Type: ${a.type}, Level: ${a.level}, Status: ${isExpired ? 'EXPIRED' : 'ACTIVE'}`);
      });
    }
    
    // 4. Check for disconnected cases that MIGHT belong to him
    const { data: disconnectedCases } = await supabase
      .from('employee_cases')
      .select('id, employee_name, employee_nip')
      .ilike('employee_name', '%Harry Purnama%')
      .neq('employee_id', emp.id);
      
    if (disconnectedCases && disconnectedCases.length > 0) {
      console.log(`- Disconnected cases found with similar name: ${disconnectedCases.length}`);
      disconnectedCases.forEach(c => console.log(`  * Case ID: ${c.id}, Name on Case: ${c.employee_name}, NIP on Case: ${c.employee_nip}`));
    }
  }
}

checkHarry();
