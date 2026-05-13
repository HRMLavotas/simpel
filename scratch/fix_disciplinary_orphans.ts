
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

async function fixOrphans() {
  console.log('Fixing orphan disciplinary actions...');
  
  // 1. Get all disciplinary actions
  const { data: actions, error: actionsError } = await supabase
    .from('disciplinary_actions')
    .select('id, case_id, employee_id');
    
  if (actionsError) {
    console.error('Error fetching actions:', actionsError);
    return;
  }
  
  let fixed = 0;
  for (const action of actions || []) {
    // Check if employee exists
    const { data: employee } = await supabase
      .from('employees')
      .select('id')
      .eq('id', action.employee_id)
      .maybeSingle();
      
    if (!employee) {
      console.log(`Action ${action.id} is disconnected (Employee ${action.employee_id}). Trying to sync from Case...`);
      
      // Get the case to find the correct employee_id
      const { data: caseData } = await supabase
        .from('employee_cases')
        .select('employee_id, employee_name, employee_nip')
        .eq('id', action.case_id)
        .single();
        
      if (caseData && !caseData.employee_id.startsWith('manual_') && !caseData.employee_id.startsWith('MANUAL_')) {
        console.log(`  Found correct Employee ID in Case: ${caseData.employee_id}. Updating Action...`);
        
        const { error: updateError } = await supabase
          .from('disciplinary_actions')
          .update({
            employee_id: caseData.employee_id,
            employee_name: caseData.employee_name,
            employee_nip: caseData.employee_nip
          })
          .eq('id', action.id);
          
        if (updateError) {
          console.error(`  ❌ Failed to update Action ${action.id}:`, updateError.message);
        } else {
          console.log(`  ✅ Fixed Action ${action.id}`);
          fixed++;
        }
      } else {
        console.log(`  ❌ Could not find valid employee in Case ${action.case_id}`);
      }
    }
  }
  
  console.log(`\nFixed ${fixed} orphan disciplinary actions.`);
}

fixOrphans();
