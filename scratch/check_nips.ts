
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

async function checkNips() {
  const nips = [
    '200002102021011001', // Ksatrya
    '196509161986021001', // Leuwaradja
    '197708282005011001', // Agus
    '198609072009121003', // Rahman
    '197903172006041002', // Inoky
    '197910122014032001'  // Hafni
  ];
  
  console.log('Checking NIPs in employees table...');
  for (const nip of nips) {
    const { data: employee } = await supabase
      .from('employees')
      .select('id, name, nip')
      .eq('nip', nip)
      .maybeSingle();
      
    if (employee) {
      console.log(`✅ NIP ${nip} found: ${employee.name} (ID: ${employee.id})`);
    } else {
      // Try searching for partial NIP or name
      const { data: partial } = await supabase
        .from('employees')
        .select('id, name, nip')
        .ilike('nip', `%${nip}%`)
        .maybeSingle();
        
      if (partial) {
        console.log(`⚠️ NIP ${nip} not exact, but partial match found: ${partial.name} (NIP: ${partial.nip})`);
      } else {
        console.log(`❌ NIP ${nip} not found anywhere in employees table.`);
      }
    }
  }
}

checkNips();
