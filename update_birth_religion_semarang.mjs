import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://mauyygrbdopmpdpnwzra.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1hdXl5Z3JiZG9wbXBkcG53enJhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDkzMTM4NCwiZXhwIjoyMDkwNTA3Mzg0fQ.qMJoz6Xuy4PKwS-LKWpjf_WM5o0fuNtEE4hsgLjJX4Q'
);

// Data dari dokumen Excel - NIP sebagai key
const sourceData = [
  { nip: '199611062025052001', birth_place: 'SEMARANG',         religion: 'Islam' },
  { nip: '199912082025052005', birth_place: 'BANYUMAS',         religion: 'Islam' },
  { nip: '198809022011011006', birth_place: 'PURWOREJO',        religion: 'Islam' },
  { nip: '197506262009011011', birth_place: 'BANDUNG',          religion: 'Islam' },
  { nip: '198404212009122007', birth_place: 'BENGKULU',         religion: 'Islam' },
  { nip: '199407292020121017', birth_place: 'JAKARTA',          religion: 'Islam' },
  { nip: '199405292020122021', birth_place: 'BANYUWANGI',       religion: 'Islam' },
  { nip: '199004062020121010', birth_place: 'PALEMBANG',        religion: 'Islam' },
  { nip: '198403102009121003', birth_place: 'MAGELANG',         religion: 'Islam' },
  { nip: '198512092012121002', birth_place: 'TEGAL',            religion: 'Islam' },
  { nip: '198712032012121003', birth_place: 'JOMBANG',          religion: 'Islam' },
  { nip: '198106282007121001', birth_place: 'PEMALANG',         religion: 'Islam' },
  { nip: '197909232009011008', birth_place: 'PEMALANG',         religion: 'Islam' },
  { nip: '198011022009122002', birth_place: 'BANYUMAS',         religion: 'Islam' },
  { nip: '198205092006041005', birth_place: 'KEBUMEN',          religion: 'Kristen' },
  { nip: '197801262009011007', birth_place: 'PURWOREJO',        religion: 'Islam' },
  { nip: '198206232009012004', birth_place: 'DEMAK',            religion: 'Islam' },
  { nip: '198311052009012004', birth_place: 'BATANG',           religion: 'Islam' },
  { nip: '198912162012122001', birth_place: 'MALANG',           religion: 'Islam' },
  { nip: '198404162012122001', birth_place: 'SEMARANG',         religion: 'Kristen' },
  { nip: '197902232003121001', birth_place: 'JEPARA',           religion: 'Islam' },
  { nip: '198204152006041002', birth_place: 'RIAU',             religion: 'Islam' },
  { nip: '197203231998031007', birth_place: 'BATANG',           religion: 'Islam' },
  { nip: '198407202015031001', birth_place: 'SURAKARTA',        religion: 'Islam' },
  { nip: '199010072015032005', birth_place: 'SEMARANG',         religion: 'Islam' },
  { nip: '199203062018011002', birth_place: 'KENDAL',           religion: 'Islam' },
  { nip: '199512292018012002', birth_place: 'KULON PROGO',      religion: 'Islam' },
  { nip: '198201222012121001', birth_place: 'D I YOGYAKARTA',   religion: 'Islam' },
  { nip: '198605282012121002', birth_place: 'SEMARANG',         religion: 'Islam' },
  { nip: '198909152015032006', birth_place: 'KEBUMEN',          religion: 'Islam' },
  { nip: '198704112012122002', birth_place: 'PARIAMAN',         religion: 'Islam' },
  { nip: '198302062015032002', birth_place: 'DEMAK',            religion: 'Islam' },
  { nip: '198409222015031002', birth_place: 'CILACAP',          religion: 'Islam' },
  { nip: '198411232012122002', birth_place: 'NGAWI',            religion: 'Islam' },
  { nip: '198511212015032006', birth_place: 'JAKARTA',          religion: 'Islam' },
  { nip: '198811042015031004', birth_place: 'MAGELANG',         religion: 'Islam' },
  { nip: '198707032011011013', birth_place: 'WONOGIRI',         religion: 'Islam' },
  { nip: '198803192015031003', birth_place: 'TEMANGGUNG',       religion: 'Islam' },
  { nip: '197101242005012001', birth_place: 'AGAM',             religion: 'Islam' },
  { nip: '198509142010012014', birth_place: 'WONOSOBO',         religion: 'Islam' },
  { nip: '197701152007121001', birth_place: 'BANTUL',           religion: 'Islam' },
  { nip: '198105232006041001', birth_place: 'SEMARANG',         religion: 'Islam' },
  { nip: '197203061998031003', birth_place: 'BANJARNEGARA',     religion: 'Islam' },
  { nip: '197702022009012001', birth_place: 'SEMARANG',         religion: 'Islam' },
  { nip: '198702252012122001', birth_place: 'BANYUMAS',         religion: 'Islam' },
  { nip: '198905052015032009', birth_place: 'REMBANG',          religion: 'Islam' },
  { nip: '198908052015031004', birth_place: 'JEPARA',           religion: 'Islam' },
  { nip: '198304222009121002', birth_place: 'GROBOGAN',         religion: 'Islam' },
  { nip: '197309232006041002', birth_place: 'JAKARTA',          religion: 'Islam' },
  { nip: '197802162006041002', birth_place: 'JAKARTA',          religion: 'Katholik' },
  { nip: '198108252009122002', birth_place: 'PURWOREJO',        religion: 'Islam' },
  { nip: '198408032015032002', birth_place: 'SEMARANG',         religion: 'Katholik' },
  { nip: '199207252025051002', birth_place: 'SEMARANG',         religion: 'Islam' },
  { nip: '199504262025051005', birth_place: 'SEMARANG',         religion: 'Islam' },
  { nip: '199505072025051002', birth_place: 'BATANG',           religion: 'Islam' },
  { nip: '199808142025052007', birth_place: 'PURWOREJO',        religion: 'Islam' },
  { nip: '200001142025051002', birth_place: 'BREBES',           religion: 'Islam' },
  { nip: '200010292025052005', birth_place: 'TRENGGALEK',       religion: 'Islam' },
  { nip: '200110072025052002', birth_place: 'SURABAYA',         religion: 'Katholik' },
  { nip: '199605192025052005', birth_place: 'WONOGIRI',         religion: 'Islam' },
  { nip: '199607032025052005', birth_place: 'KLATEN',           religion: 'Islam' },
  { nip: '199407202020122025', birth_place: 'MALANG',           religion: 'Islam' },
  { nip: '199501212020122024', birth_place: 'MEDAN',            religion: 'Islam' },
  { nip: '199506202020122025', birth_place: 'TANGERANG',        religion: 'Kristen' },
  { nip: '199410062020122018', birth_place: 'SEMARANG',         religion: 'Islam' },
  { nip: '199802072020122005', birth_place: 'SEMARANG',         religion: 'Islam' },
  { nip: '199609222020122032', birth_place: 'MAGELANG',         religion: 'Islam' },
  { nip: '199512112020122019', birth_place: 'SEMARANG',         religion: 'Islam' },
  { nip: '198705172020122011', birth_place: 'BANTUL',           religion: 'Islam' },
  { nip: '198908312020122016', birth_place: 'SURABAYA',         religion: 'Islam' },
  { nip: '198912272020121007', birth_place: 'DEMAK',            religion: 'Islam' },
  { nip: '199309152020122028', birth_place: 'MEDAN',            religion: 'Kristen' },
  { nip: '198904022020122010', birth_place: 'YOGYAKARTA',       religion: 'Katholik' },
  { nip: '198901212015032008', birth_place: 'LAMONGAN',         religion: 'Islam' },
  { nip: '198607032015032003', birth_place: 'SEMARANG',         religion: 'Islam' },
  { nip: '198312152015032003', birth_place: 'WONOGIRI',         religion: 'Islam' },
  { nip: '199308092018012001', birth_place: 'SERDANG BEDAGAI',  religion: 'Islam' },
  { nip: '199203062018011004', birth_place: 'SEMARANG',         religion: 'Islam' },
  { nip: '199405222018011002', birth_place: 'PROBOLINGGO',      religion: 'Islam' },
  { nip: '199102232018012001', birth_place: 'KENDAL',           religion: 'Islam' },
  { nip: '199202052018012002', birth_place: 'JEPARA',           religion: 'Islam' },
  { nip: '199307102018011002', birth_place: 'BANDAR LAMPUNG',   religion: 'Islam' },
  { nip: '198804222015032005', birth_place: 'YOGYAKARTA',       religion: 'Islam' },
  { nip: '198606202015031005', birth_place: 'SEMARANG',         religion: 'Islam' },
  { nip: '199202012015032004', birth_place: 'SEMARANG',         religion: 'Islam' },
  { nip: '199403302018012002', birth_place: 'PATI',             religion: 'Islam' },
  { nip: '198607302018011001', birth_place: 'SEMARANG',         religion: 'Katholik' },
  { nip: '199004092012122001', birth_place: 'SLEMAN',           religion: 'Islam' },
  { nip: '199112072014032001', birth_place: 'BANTUL',           religion: 'Islam' },
  { nip: '197907302009122001', birth_place: 'SEMARANG TENGAH',  religion: 'Islam' },
  { nip: '198804252012121002', birth_place: 'PATI',             religion: 'Islam' },
  { nip: '197403131994031001', birth_place: 'SURAKARTA',        religion: 'Katholik' },
  { nip: '199702102025052006', birth_place: 'CIAMIS',           religion: 'Islam' },
  { nip: '200005012025052005', birth_place: 'SLEMAN',           religion: 'Islam' },
  { nip: '198208232014061003', birth_place: 'PEKALONGAN',       religion: 'Islam' },
  { nip: '198505242015032001', birth_place: 'KUDUS',            religion: 'Islam' },
  { nip: '199403152018012001', birth_place: 'GUNUNGKIDUL',      religion: 'Islam' },
  { nip: '198905282020122010', birth_place: 'YOGYAKARTA',       religion: 'Kristen' },
  { nip: '199002092020121007', birth_place: 'BEKASI',           religion: 'Islam' },
  { nip: '197404202006042012', birth_place: 'SEMARANG',         religion: 'Katholik' },
  { nip: '197709152006041004', birth_place: 'BOYOLALI',         religion: 'Islam' },
  { nip: '198609212024211007', birth_place: 'BANJARNEGARA',     religion: 'Islam' },
  { nip: '199704272025052004', birth_place: 'SURAKARTA',        religion: 'Islam' },
  { nip: '199905072025052002', birth_place: 'KENDAL',           religion: 'Islam' },
  { nip: '198904182014031002', birth_place: 'SEMARANG',         religion: 'Islam' },
  { nip: '199108252020121013', birth_place: 'SEMARANG',         religion: 'Islam' },
  { nip: '198208302015031004', birth_place: 'SEMARANG',         religion: 'Islam' },
  { nip: '197806012024211003', birth_place: 'SEMARANG',         religion: 'Islam' },
  { nip: '198510082014031001', birth_place: 'DEMAK',            religion: 'Islam' },
  { nip: '198812242020121010', birth_place: 'PEMALANG',         religion: 'Islam' },
  { nip: '198610182009122002', birth_place: 'SEMARANG',         religion: 'Islam' },
  { nip: '198707282009122002', birth_place: 'JEPARA',           religion: 'Islam' },
  { nip: '198312252015032001', birth_place: 'GROBOGAN',         religion: 'Islam' },
  { nip: '198906192019022003', birth_place: 'SLEMAN',           religion: 'Islam' },
  { nip: '197712142025211004', birth_place: 'BATANG',           religion: 'Islam' },
  { nip: '198304212025212018', birth_place: 'JEPARA',           religion: 'Islam' },
  { nip: '198409032025212010', birth_place: 'SEMARANG',         religion: 'Islam' },
  { nip: '198708302025211013', birth_place: 'BATANG',           religion: 'Islam' },
  { nip: '198811082025211021', birth_place: 'BANDUNG BARAT',    religion: 'Islam' },
  { nip: '199004172025211010', birth_place: 'DEMAK',            religion: 'Islam' },
  { nip: '199110232025211014', birth_place: 'DEMAK',            religion: 'Islam' },
  { nip: '199210252025211013', birth_place: 'SEMARANG',         religion: 'Islam' },
  { nip: '199406052025212022', birth_place: 'SEMARANG',         religion: 'Islam' },
  { nip: '199903282025212005', birth_place: 'SRAGEN',           religion: 'Islam' },
  { nip: '199606272025212018', birth_place: 'PATI',             religion: 'Islam' },
  { nip: '199705042025212014', birth_place: 'DEMAK',            religion: 'Islam' },
  { nip: '199707132025211013', birth_place: 'BONDOWOSO',        religion: 'Islam' },
  { nip: '199607252025211006', birth_place: 'SEMARANG',         religion: 'Islam' },
  { nip: '197605021997032001', birth_place: 'GUNUNGKIDUL',      religion: 'Islam' },
  { nip: '198309292009121008', birth_place: 'SEMARANG',         religion: 'Kristen' },
  { nip: '198503042009122002', birth_place: 'JAKARTA SELATAN',  religion: 'Islam' },
  { nip: '198310262007012001', birth_place: 'SEMARANG',         religion: 'Islam' },
  { nip: '198507012009122003', birth_place: 'SEMARANG',         religion: 'Islam' },
  { nip: '199003222015032004', birth_place: 'BOYOLALI',         religion: 'Islam' },
  { nip: '197203192007011004', birth_place: 'SEMARANG',         religion: 'Islam' },
  { nip: '198104232009012005', birth_place: 'KLATEN',           religion: 'Islam' },
  { nip: '198701012015032003', birth_place: 'NGAWI',            religion: 'Islam' },
  { nip: '197704062011011004', birth_place: 'JEMBER',           religion: 'Islam' },
  { nip: '198704192012122003', birth_place: 'CILACAP',          religion: 'Islam' },
  { nip: '197409041996032001', birth_place: 'GOMBONG',          religion: 'Islam' },
  { nip: '197603152009012003', birth_place: 'SLEMAN',           religion: 'Islam' },
  { nip: '198708112011012014', birth_place: 'CILACAP',          religion: 'Islam' },
  { nip: '197705152009011014', birth_place: 'SALATIGA',         religion: 'Islam' },
  { nip: '198602252009011004', birth_place: 'PURWOREJO',        religion: 'Islam' },
  { nip: '197305042009011008', birth_place: 'SEMARANG',         religion: 'Islam' },
  { nip: '198009292009112001', birth_place: 'DEMAK',            religion: 'Islam' },
  { nip: '197810072009121001', birth_place: 'SLEMAN',           religion: 'Islam' },
  { nip: '197910282009111001', birth_place: 'GROBOGAN',         religion: 'Islam' },
  { nip: '198202032014032001', birth_place: 'DEMAK',            religion: 'Islam' },
  { nip: '198605252009121002', birth_place: 'SEMARANG',         religion: 'Islam' },
  { nip: '197612252009122002', birth_place: 'MAGELANG',         religion: 'Islam' },
  { nip: '198005202009111001', birth_place: 'SEMARANG',         religion: 'Islam' },
  { nip: '199506232025051001', birth_place: 'BOYOLALI',         religion: 'Islam' },
  { nip: '199910212025052007', birth_place: 'DEMAK',            religion: 'Islam' },
  { nip: '200007162025052002', birth_place: 'GRESIK',           religion: 'Islam' },
  { nip: '199011052025051003', birth_place: 'TEMANGGUNG',       religion: 'Islam' },
  { nip: '199402022025052003', birth_place: 'SEMARANG',         religion: 'Katholik' },
  { nip: '197305041998032002', birth_place: 'SLEMAN',           religion: 'Islam' },
  { nip: '197410051994031003', birth_place: 'KARANGANYAR',      religion: 'Islam' },
  { nip: '196911092003121001', birth_place: 'SEMARANG',         religion: 'Katholik' },
  { nip: '199003162014032001', birth_place: 'SEMARANG',         religion: 'Islam' },
  { nip: '197209302007011001', birth_place: 'LAMPUNG TENGAH',   religion: 'Islam' },
  { nip: '197806082009011011', birth_place: 'SEMARANG',         religion: 'Islam' },
  { nip: '197807172007121001', birth_place: 'JAYAPURA',         religion: 'Islam' },
  { nip: '199506242019022009', birth_place: 'PATI',             religion: 'Islam' },
  { nip: '198712092020122009', birth_place: 'SEMARANG',         religion: 'Islam' },
  { nip: '198605232009011006', birth_place: 'SEMARANG',         religion: 'Islam' },
  { nip: '198311222007011001', birth_place: 'JAKARTA',          religion: 'Islam' },
];

console.log(`Total data dari dokumen: ${sourceData.length} pegawai\n`);

const allNIPs = sourceData.map(d => d.nip);

// Ambil data pegawai dari database
const { data: existingEmployees, error: fetchError } = await supabase
  .from('employees')
  .select('id, nip, name, birth_place, religion, department')
  .in('nip', allNIPs);

if (fetchError) {
  console.error('Error fetching employees:', fetchError);
  process.exit(1);
}

console.log(`Ditemukan di database: ${existingEmployees.length} pegawai\n`);

// Debug: cek sample data
const sample = existingEmployees.slice(0, 3);
console.log('Sample data dari DB:');
sample.forEach(e => console.log(`  ${e.name}: birth_place="${e.birth_place}" (type: ${typeof e.birth_place}), religion="${e.religion}"`));
console.log();

// Buat map NIP → employee
const empMap = new Map(existingEmployees.map(e => [e.nip, e]));

// Proses update - selalu update tanpa cek perubahan (force update)
let updated = 0;
let notFound = 0;
const notFoundList = [];
const updateLog = [];
const errors = [];

for (const src of sourceData) {
  const emp = empMap.get(src.nip);
  
  if (!emp) {
    notFound++;
    notFoundList.push(src.nip);
    continue;
  }

  // Force update birth_place dan religion
  const { error: updateError } = await supabase
    .from('employees')
    .update({
      birth_place: src.birth_place,
      religion: src.religion,
    })
    .eq('nip', src.nip);

  if (updateError) {
    errors.push({ nip: src.nip, name: emp.name, error: updateError.message });
  } else {
    updated++;
    const birthChanged = emp.birth_place !== src.birth_place;
    const religionChanged = emp.religion !== src.religion;
    if (birthChanged || religionChanged) {
      updateLog.push({
        name: emp.name,
        nip: src.nip,
        dept: emp.department,
        old_birth: emp.birth_place,
        new_birth: src.birth_place,
        birth_changed: birthChanged,
        old_religion: emp.religion,
        new_religion: src.religion,
        religion_changed: religionChanged,
      });
    }
  }
}

// Laporan hasil
console.log('=== HASIL UPDATE ===');
console.log(`✅ Berhasil diupdate : ${updated} pegawai`);
console.log(`❌ Tidak ditemukan  : ${notFound} NIP`);
console.log(`⚠️  Error           : ${errors.length}`);

if (updateLog.length > 0) {
  console.log(`\n📝 Ada perubahan data pada ${updateLog.length} pegawai:`);
  updateLog.forEach(log => {
    const changes = [];
    if (log.birth_changed) changes.push(`Tempat Lahir: "${log.old_birth || 'null'}" → "${log.new_birth}"`);
    if (log.religion_changed) changes.push(`Agama: "${log.old_religion || 'null'}" → "${log.new_religion}"`);
    console.log(`  ${log.name} (${log.nip}) [${log.dept}]`);
    changes.forEach(c => console.log(`    • ${c}`));
  });
} else {
  console.log('\n✅ Semua data sudah sesuai (tidak ada perubahan nilai)');
}

if (errors.length > 0) {
  console.log('\n--- Error ---');
  errors.forEach(e => console.log(`  ${e.name} (${e.nip}): ${e.error}`));
}

if (notFoundList.length > 0) {
  console.log(`\n--- NIP tidak ditemukan (${notFoundList.length}) ---`);
  notFoundList.forEach(nip => console.log(`  - ${nip}`));
}
