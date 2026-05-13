import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://mauyygrbdopmpdpnwzra.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1hdXl5Z3JiZG9wbXBkcG53enJhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDkzMTM4NCwiZXhwIjoyMDkwNTA3Mzg0fQ.qMJoz6Xuy4PKwS-LKWpjf_WM5o0fuNtEE4hsgLjJX4Q';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

function cleanName(name) {
  if (!name) return '';
  return name.toLowerCase()
    .replace(/[^a-z0-9]/g, '') // Remove all non-alphanumeric
    .trim();
}

async function fuzzyMatchAnalysis() {
  console.log('🔍 Menganalisis dengan matching yang lebih fleksibel...\n');

  // 1. Ambil semua kasus
  const { data: cases } = await supabase
    .from('employee_cases')
    .select('id, case_number, employee_id, employee_name, employee_nip');

  // 2. Ambil semua employee dengan paginasi
  const employees = [];
  let offset = 0;
  const limit = 1000;
  let hasMore = true;

  while (hasMore) {
    const { data } = await supabase
      .from('employees')
      .select('id, name, nip')
      .range(offset, offset + limit - 1);
    if (!data || data.length === 0) {
      hasMore = false;
    } else {
      employees.push(...data);
      if (data.length < limit) hasMore = false;
      else offset += limit;
    }
  }

  const employeeIdSet = new Set(employees.map(e => e.id));
  const cleanEmployeeNames = employees.map(e => ({
    ...e,
    cleanName: cleanName(e.name)
  }));

  const disconnected = cases.filter(c => !employeeIdSet.has(c.employee_id));
  console.log(`📊 Total Kasus Terputus: ${disconnected.length} dari ${cases.length}`);

  const possibleMatches = [];

  for (const c of disconnected) {
    const cCleanName = cleanName(c.employee_name);
    const cNip = c.employee_nip ? c.employee_nip.trim() : '';

    // Search for match
    let match = null;
    let reason = '';

    // 1. Try NIP match (ignoring dots/spaces)
    if (cNip && cNip !== '-' && cNip !== 'TIDAK_ADA') {
      const cleanNip = cNip.replace(/[^0-9]/g, '');
      match = employees.find(e => e.nip && e.nip.replace(/[^0-9]/g, '') === cleanNip);
      if (match) reason = 'NIP Match (Cleaned)';
    }

    // 2. Try Clean Name Match
    if (!match && cCleanName) {
      match = cleanEmployeeNames.find(e => e.cleanName === cCleanName);
      if (match) reason = 'Nama Match (Fuzzy/Cleaned)';
    }

    // 3. Try Partial Name Match (if case name is contained in employee name or vice-versa)
    if (!match && cCleanName.length > 5) {
      match = cleanEmployeeNames.find(e => e.cleanName.includes(cCleanName) || cCleanName.includes(e.cleanName));
      if (match) reason = 'Nama Match (Partial)';
    }

    if (match) {
      possibleMatches.push({
        case: c,
        match,
        reason
      });
    }
  }

  if (possibleMatches.length === 0) {
    console.log('\n❌ Tetap tidak ditemukan kecocokan otomatis meskipun dengan pencarian fleksibel.');
    console.log('Kemungkinan data pegawai tersebut memang benar-benar tidak ada di tabel employees.');
  } else {
    console.log(`\n✅ Ditemukan ${possibleMatches.length} kemungkinan kecocokan:`);
    possibleMatches.forEach(m => {
      console.log(`  [${m.case.case_number}] ${m.case.employee_name} -> ${m.match.name} (${m.match.nip || '-'}) via ${m.reason}`);
    });
  }
}

fuzzyMatchAnalysis().catch(console.error);
