
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: resolve(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Supabase URL or Key missing in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDisciplinary() {
  console.log('Checking disciplinary_actions...');
  
  const { data, error, count } = await supabase
    .from('disciplinary_actions')
    .select('*', { count: 'exact' });
    
  if (error) {
    console.error('Error:', error);
    return;
  }
  
  console.log('Total disciplinary actions:', count);
  if (data && data.length > 0) {
    console.log('Sample data (first 5):');
    data.slice(0, 5).forEach(d => {
      console.log(`- ID: ${d.id}, Employee: ${d.employee_name}, NIP: ${d.employee_nip}, Level: ${d.level}`);
    });
  } else {
    console.log('No disciplinary actions found.');
  }
}

checkDisciplinary();
