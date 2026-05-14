import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDepartments() {
  const { data, error } = await supabase.from('departments').select('*').limit(1);
  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Departments schema:', Object.keys(data?.[0] || {}));
  }
}

checkDepartments();
