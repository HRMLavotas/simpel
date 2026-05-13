import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://mauyygrbdopmpdpnwzra.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1hdXl5Z3JiZG9wbXBkcG53enJhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDkzMTM4NCwiZXhwIjoyMDkwNTA3Mzg0fQ.qMJoz6Xuy4PKwS-LKWpjf_WM5o0fuNtEE4hsgLjJX4Q';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

function cleanName(name) {
  if (!name) return '';
  // Remove titles like S.T, S.Kom, M.Si, etc.
  return name.split(',')[0]
    .toLowerCase()
    .replace(/(s\.t|s\.kom|m\.si|s\.par|s\.pd|s\.h|s\.e|dr|dr\.|dra|dra\.|drs|drs\.)/g, '')
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

async function deepNameAnalysis() {
  console.log('🔍 Menganalisis Nama secara mendalam (dengan paginasi)...\n');

  // 1. Ambil semua kasus terputus
  const { data: cases } = await supabase
    .from('employee_cases')
    .select('id, case_number, employee_id, employee_name, employee_nip');

  const employees = [];
  let offset = 0;
  const limit = 1000;
  let hasMore = true;

  while (hasMore) {
    const { data } = await supabase.from('employees').select('id, name, nip').range(offset, offset + limit - 1);
    if (!data || data.length === 0) hasMore = false;
    else {
      employees.push(...data);
      if (data.length < limit) hasMore = false;
      else offset += limit;
    }
  }

  const employeeIdSet = new Set(employees.map(e => e.id));
  const disconnected = cases.filter(c => !employeeIdSet.has(c.employee_id));

  console.log(`📊 Kasus terputus: ${disconnected.length}`);
  console.log(`👥 Total pegawai discan: ${employees.length}`);

  const results = [];

  for (const c of disconnected) {
    const cClean = cleanName(c.employee_name);
    if (!cClean) continue;

    // Search for any employee whose cleaned name contains or is contained in the case's cleaned name
    const matches = employees.filter(e => {
      const eClean = cleanName(e.name);
      return eClean && (eClean.includes(cClean) || cClean.includes(eClean));
    });

    if (matches.length > 0) {
      results.push({
        case: c,
        matches: matches.map(m => `${m.name} (${m.nip || '-'})`)
      });
    }
  }

  if (results.length === 0) {
    console.log('\n❌ Tetap tidak ditemukan kecocokan nama.');
  } else {
    console.log(`\n✅ Ditemukan ${results.length} kemungkinan kecocokan nama:`);
    results.forEach(r => {
      console.log(`  [${r.case.case_number}] ${r.case.employee_name} -> Mungkin: ${r.matches.join(', ')}`);
    });
  }
}

deepNameAnalysis().catch(console.error);
