
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: resolve(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function listTables() {
  console.log('Listing tables (via common table names check) with Service Role...');
  
  const commonTables = [
    'employees', 
    'employee_cases', 
    'disciplinary_actions', 
    'case_timeline', 
    'profiles', 
    'hukuman_disiplin', 
    'hukuman',
    'pegawai'
  ];
  
  for (const table of commonTables) {
    try {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
        
      if (error) {
        console.log(`- ${table}: Error (${error.message})`);
      } else {
        console.log(`- ${table}: ${count} rows`);
      }
    } catch (e: any) {
      console.log(`- ${table}: Exception (${e.message})`);
    }
  }
}

listTables();
