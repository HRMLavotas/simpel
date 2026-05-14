import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDepartments() {
  const { data, error } = await supabase
    .from('employees')
    .select('department')
    .not('department', 'is', null);

  if (error) {
    console.error('Error:', error);
    return;
  }

  const depts = [...new Set(data.map(d => d.department))].sort();
  console.log('Unique Departments in DB:');
  depts.forEach(d => console.log(`- ${d}`));
}

checkDepartments();
