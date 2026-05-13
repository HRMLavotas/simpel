
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

function cleanName(name: string): string {
  if (!name) return "";
  return name
    .toLowerCase()
    .replace(/(^| )(h|h\.|hj|hj\.|st|st\.|s\.t|s\.t\.|si|si\.|s\.i|s\.i\.|msi|msi\.|m\.si|m\.si\.|sh|sh\.|s\.h|s\.h\.|msp|msp\.|m\.s\.p|m\.s\.p\.|se|se\.|s\.e|s\.e\.|dr|dr\.|dr\.) /g, " ")
    .replace(/,(.*)/g, "") // Remove titles after comma
    .replace(/[^a-z0-9]/g, "") // Remove non-alphanumeric
    .trim();
}

async function checkNames() {
  const names = [
    'Ksatrya Swarga Putera Farihadhy',
    'Leuwaradja Henderik marthin Ferdinandus',
    'Agus Ramdhany',
    'Rahman Arsyad',
    'Inoky Tagara',
    'Hafni Oktariani'
  ];
  
  console.log('Checking names in employees table...');
  for (const name of names) {
    const cName = cleanName(name);
    console.log(`Searching for "${name}" (Clean: ${cName})...`);
    
    const { data: matches } = await supabase
      .from('employees')
      .select('id, name, nip')
      .ilike('name', `%${name.split(' ')[0]}%`) // Search by first name
      .limit(20);
      
    if (matches && matches.length > 0) {
      const match = matches.find(m => cleanName(m.name) === cName);
      if (match) {
        console.log(`  ✅ Match found: ${match.name} (NIP: ${match.nip}) (ID: ${match.id})`);
      } else {
        console.log(`  ❓ Candidates found, but no exact clean name match.`);
        matches.forEach(m => console.log(`    - ${m.name} (NIP: ${m.nip})`));
      }
    } else {
      console.log(`  ❌ No matches found for first name.`);
    }
  }
}

checkNames();
