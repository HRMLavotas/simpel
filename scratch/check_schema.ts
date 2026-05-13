
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: resolve(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
  console.log('Checking disciplinary_actions schema...');
  
  // We can't directly check schema with JS client easily, but we can try an insert and see error
  // or check column names via a select
  const { data, error } = await supabase
    .from('disciplinary_actions')
    .select('*')
    .limit(1);
    
  if (error) {
    console.error('Error:', error);
    return;
  }
  
  console.log('Columns found:', data && data.length > 0 ? Object.keys(data[0]) : 'No data to determine columns');
  
  // Try to get column info via RPC if available, or just use the storage lib as reference
}

checkSchema();
