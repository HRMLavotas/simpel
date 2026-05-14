import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkValues() {
  const { data, error } = await supabase
    .from('employees')
    .select('position_type, asn_status')
    .limit(1000);

  if (error) {
    console.error('Error:', error);
    return;
  }

  const posTypes = [...new Set(data.map(d => d.position_type))];
  const asnStatuses = [...new Set(data.map(d => d.asn_status))];

  console.log('Unique Position Types:', posTypes);
  console.log('Unique ASN Statuses:', asnStatuses);
}

checkValues();
