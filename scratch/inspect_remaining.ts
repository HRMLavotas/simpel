
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

async function inspectRemaining() {
  console.log('Inspecting 9 remaining disconnected disciplinary actions...');
  
  const { data: actions, error: actionsError } = await supabase
    .from('disciplinary_actions')
    .select('id, case_id, employee_id, employee_name, employee_nip');
    
  if (actionsError) return;
  
  const results = [];
  for (const action of actions || []) {
    const { data: employee } = await supabase
      .from('employees')
      .select('id')
      .eq('id', action.employee_id)
      .maybeSingle();
      
    if (!employee) {
      const { data: caseData } = await supabase
        .from('employee_cases')
        .select('id, employee_id, employee_name, employee_nip')
        .eq('id', action.case_id)
        .maybeSingle();
        
      results.push({
        actionId: action.id,
        name: action.employee_name,
        nip: action.employee_nip,
        caseEmpId: caseData?.employee_id,
        caseEmpName: caseData?.employee_name
      });
    }
  }
  
  results.forEach((r, i) => {
    console.log(`${i+1}. Action: ${r.name} (${r.nip}) | Case Emp ID: ${r.caseEmpId} | Case Emp Name: ${r.caseEmpName}`);
  });
}

inspectRemaining();
