#!/usr/bin/env node

/**
 * Update data kejuruan instruktur via Supabase Management API
 * Menggunakan satu query batch untuk efisiensi
 */

import https from 'https';

const ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN || ''; // set via env var
const PROJECT_REF = 'mauyygrbdopmpdpnwzra';

async function executeSQL(sql) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({ query: sql });
    const options = {
      hostname: 'api.supabase.com',
      path: `/v1/projects/${PROJECT_REF}/database/query`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({ statusCode: res.statusCode, data });
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

// Semua data instruktur dari Excel - format: [nip, kejuruan]
const instrukturData = [
  // BBPVP BANDUNG - Ahli Madya
  ['196610311994031002','Refrigerasi'],['196812071994031001','Refrigerasi'],
  ['196910271998031001','Manufaktur'],['197209172005011002','TIK'],
  ['197209181994032002','Refrigerasi'],['197405161994031001','TIK'],
  ['197505042007121001','Otomotif'],['197707012006041004','Otomotif'],
  ['197907302006041006','Otomotif'],['198201162009011007','Otomotif'],
  ['198311102009011010','TIK'],['198001022009011006','Otomotif'],
  ['197205212005011001','Manufaktur'],['198002072006041005','Otomotif'],
  ['197911182009121002','Manufaktur'],['198304292009012006','Listrik'],
  // BBPVP BANDUNG - Ahli Muda
  ['196811132003121001','Manufaktur'],['197111102005011003','Manufaktur'],
  ['197504282009011005','TIK'],['197610012003121002','Manufaktur'],
  ['197910192003122001','Manufaktur'],['198003232014031001','Manufaktur'],
  ['198005202009011010','Otomotif'],['198108232015031002','Manufaktur'],
  ['198204072009012005','Refrigerasi'],['198206012009012003','Produktivitas'],
  ['198309102009012003','TIK'],['198401072009011002','TIK'],
  ['198404172009011006','Manufaktur'],['198409162012121001','Manufaktur'],
  ['198504202014031001','Manufaktur'],['198505122015031003','Manufaktur'],
  ['198509232009012002','TIK'],['198605232014031001','Manufaktur'],
  ['198412192012121001','Otomotif'],['198802152018011002','Otomotif'],
  ['198810032012122004','TIK'],['198109142015031003','Otomotif'],
  // BBPVP BANDUNG - Ahli Pertama
  ['199408232018012003','Manufaktur'],['198304262018011001','Manufaktur'],
  ['199405202018011002','Otomotif'],['198412022018011001','Otomotif'],
  ['199209302018011001','Otomotif'],['198812262018011001','Manufaktur'],
  ['199404282018012002','Manufaktur'],['198505132018011001','Otomotif'],
  ['199107042018011001','Manufaktur'],['198605202019021002','Manufaktur'],
  ['199404012019021003','Manufaktur'],['199511232019021002','Otomotif'],
  ['199205312019021004','Manufaktur'],['199306172019021007','Otomotif'],
  ['198312052019021002','Refrigerasi'],['199504072019021003','Otomotif'],
  ['199608182023211012','TIK'],['197409072007012002','TIK'],
  ['197701272009012003','Pariwisata'],['198004072011012009','Pariwisata'],
  ['198501252020122010','Pariwisata'],['198805092015032006','TIK'],
  ['198803232012121002','Otomotif'],['199008042012122003','Manufaktur'],
  ['198411142015031005','Refrigerasi'],['198010212009012000','TIK'],
  ['199110172018012001','TIK'],
  // BBPVP BANDUNG - Penyelia
  ['197205012003121003','Refrigerasi'],['197901192003121002','Otomotif'],
  ['198009222003121002','Manufaktur'],
  // BBPVP BANDUNG - Mahir
  ['198202262015032001','Pariwisata'],['199208302015032006','Pariwisata'],
  ['198402282015031002','Otomotif'],['198712132015031003','Otomotif'],
  // BBPVP BANDUNG - Terampil
  ['199112052015032003','Pariwisata'],['198408082015032003','Pariwisata'],

  // BBPVP BEKASI - Ahli Madya
  ['196608231994031001','Elektronika'],['196806111998031001','Refrigerasi'],
  ['196906211998031002','Refrigerasi'],['197103092003121001','Produktivitas'],
  ['197209232005011001','Metodologi'],['197303062005011001','Teknologi Informasi dan Komunikasi'],
  ['197307292005011001','Teknologi Informasi dan Komunikasi'],['197310151994031003','Teknologi Informasi dan Komunikasi'],
  ['197406062005011001','Elektronika'],['197510242006041001','Las'],
  ['197607212003121002','Produktivitas'],['197706262005011002','Elektronika'],
  ['197801132005011001','Elektronika'],['197802092007121001','Elektronika'],
  ['197911102005011001','Elektronika'],['198101102003122003','Produktivitas'],
  ['198201162003121004','Refrigerasi'],['198204192011011005','Teknologi Informasi dan Komunikasi'],
  ['198408302009011003','Las'],['198512132012122003','Teknologi Informasi dan Komunikasi'],
  ['198110082009011010','Teknologi Informasi dan Komunikasi'],['197612132006041002','Bangunan'],
  ['198105092006042004','Metodologi'],['197510162003121001','Metodologi'],
  ['197407182005011001','Elektronika'],['198001112003122003','Produktivitas'],
  ['197104241998032001','Metodologi'],['197408252005012001','Teknologi Informasi dan Komunikasi'],

  // BBPVP SERANG - Ahli Madya
  ['197906202009011008','Metodologi'],['198202222009011004','Las'],
  ['197207271998032001','Listrik'],['198008082009011012','Teknik Mekanik'],
  ['196912281998031001','Teknik Mekanik'],['196804271998031001','Listrik'],
  ['197109282005011002','Listrik'],['197201061998031001','Teknologi Mekanik'],
  ['197303252005011002','Listrik'],['198012242007122001','Listrik'],
  ['198107312003121002','Teknik Mekanik'],['198303132011011014','Elektronika'],
  ['197204052005011001','Listrik'],['198204262006041002','Las'],
  ['197707172003121001','Teknologi Mekanik'],['198408082009011005','Las'],
  ['197908152003121002','Listrik'],['198605292009011002','Otomotif'],
  ['198011102009011008','Las'],['198310282014031001','Las'],
  ['198501102012122002','Metodologi'],['198606092012121001','Listrik'],

  // BBPVP MEDAN - Ahli Madya
  ['198209292009011005','Bisnis dan Manajemen'],['196906231998031001','Metodologi Pelatihan'],
  ['197612062005011002','Teknik Listrik'],['198306042009012007','Teknologi Informasi dan Komunikasi'],
  ['198506102009012005','Teknologi Informasi dan Komunikasi'],['198606082009011001','Teknik Otomotif'],
  ['196806021998031001','Teknik Listrik'],['198009182005012002','Bahasa'],
  ['197604132009011005','Manufaktur'],['198009032009011008','Bangunan'],
  ['198511012009012002','Pertanian'],['198406132007121001','Bangunan'],
  ['198604072011011010','Teknik Otomotif'],

  // BBPVP SEMARANG - Ahli Madya
  ['197801262009011007','Las'],['198106282007121001','Las'],
  ['198204152006041002','Bisnis dan Manajemen'],['198206232009012004','Bisnis dan Manajemen'],
  ['198311052009012004','Fashion Technology'],['198404162012122001','Bisnis dan Manajemen'],
  ['197902232003121001','Teknologi Pelatihan'],['198205092006041005','Teknologi Pelatihan'],
  ['197203231998031007','Teknologi Informasi dan Komunikasi'],['198912162012122001','Fashion Technology'],
  ['198011022009122002','Bisnis dan Manajemen'],['197909232009011008','Teknologi Informasi dan Komunikasi'],
  ['198712032012121003','Bisnis dan Manajemen'],['198403102009121003','Bisnis dan Manajemen'],
  ['198512092012121002','Listrik'],

  // BBPVP MAKASSAR - Ahli Madya
  ['197111071998031001','Manufaktur'],['197807042011011008','Las'],
  ['196612311986031007','Otomotif'],['196702061998032002','Manufaktur'],
  ['196905081998032005','Metodologi'],['196907101998031005','Refrigrasi'],
  ['197007271998032001','Elektronika'],['197202121998031002','Manufaktur'],
  ['197305091997031003','Listrik'],['197510152009012004','Otomotif'],
  ['197608032009122001','Garmen'],['198102242009121003','Manufaktur'],
  ['198203012009012005','Bisnis dan Manajemen'],['197704042009011009','Bisnis dan Manajemen'],
  ['198009092006041003','Otomotif'],['198510212009011005','TIK'],
  ['198403302009011004','Las'],['197702012009121001','Las'],
  ['197702182009012001','Garmen'],['198309042009011002','Otomotif'],
  ['197001021998031008','Manufaktur'],['197711042009012003','Las'],
  ['198012182009012004','Garmen'],['197209052009021001','Refrigrasi'],
  ['197412202009011003','Las'],

  // BPVP SURAKARTA - Ahli Madya
  ['197301021997032001','Metodologi Pelatihan'],['198207102006041001','Teknologi Informasi dan Komunikasi'],
  ['198311252009011009','Bisnis dan Manajemen'],['196608191986031001','Otomotif'],
  ['197005201998031013','Teknik Listrik'],['197304222005011002','Teknik Refrigasi'],
  ['197512182003121001','Otomotif'],['197912112009011007','Otomotif'],
  ['198211012006041004','Teknologi Informasi dan Komunikasi'],

  // BPVP SAMARINDA - Ahli Madya
  ['198005242005011002','Manufaktur'],['197101061994032001','Teknologi Informasi dan Komunikasi'],
  ['197705282005011001','Pertambangan'],['198404122012121001','Bangunan'],

  // BPVP BANDA ACEH - Ahli Madya
  ['197404142009011006','Otomotif'],['198605242009121004','Teknologi Pengolahan Agroindustri'],
  ['198406202009011007','Refrigerasi'],

  // BPVP SORONG - Ahli Madya
  ['197312262009011003','Listrik'],['198208302011011006','Elektronika'],

  // BPVP TERNATE - Ahli Madya
  ['196906051997022004','Fashion Technology'],['197404012001122001','Teknologi Informasi dan Komunikasi'],
  ['197612052003121010','Elektronika'],['197707042009012001','Refrigeration'],

  // BPVP AMBON - Ahli Muda
  ['197401142009041001','Teknik Las'],['197608142011012003','Teknik Listrik'],

  // BPVP KENDARI - Ahli Madya
  ['197411051998021001','Produktivitas'],['198309062006041007','Otomotif'],
  ['196804062007012033','Tata Kecantikan'],['197503132010012003','Bisnis dan Manajemen'],

  // BPVP PADANG - Ahli Madya
  ['197412181994032001','TIK'],['197101171998031003','Elektronika'],
  ['196611181985031001','Bisnis dan Manajemen'],['197803012009121002','Manufaktur'],
  ['197103071997032004','TIK'],

  // BPVP BANDUNG BARAT - Ahli Madya
  ['197701212009011009','Mekanisasi Pertanian'],['198906302012121001','Teknologi Pengolahan Agroindustri'],

  // BPVP LOMBOK TIMUR - Ahli Muda
  ['199003232015032003','Pariwisata'],

  // BPVP BANTAENG - Ahli Madya
  ['197512302009021003','Otomotif'],['197609022008041001','Otomotif'],
  ['197409072005022001','Listrik'],

  // BPVP SIDOARJO - Ahli Madya
  ['197211281998031003','Teknik Manufaktur'],['198509092012121002','Teknik Listrik dan Refrigerasi'],
  ['198304012012121001','Otomotif'],

  // BPVP BANYUWANGI - Ahli Muda
  ['199112102018011003','Processing'],['198703292012121001','Teknik Listrik'],
  ['199512302018012002','Pariwisata'],['199005092018011002','Processing'],

  // BPVP PANGKEP - Ahli Muda
  ['199101102015032003','Teknik Manufaktur'],['198901302015031001','Teknik Listrik'],

  // BPVP BELITUNG - Ahli Muda
  ['197904172009011010','Teknik Bangunan'],

  // SATPEL
  ['197709072009011008','Produktivitas'],  // Satpel Lampung
  ['197809052003121001','Teknologi Mekanik'],  // Satpel Lubuk Linggau
  ['197509092006041003','Refrigeration'],  // Satpel Pekanbaru
  ['198602142018011001','Bangunan'],  // Satpel Pekanbaru
  ['198401022019021001','Teknik Otomotif'],  // Satpel Pekanbaru
  ['197709092009011006','Teknologi Informasi dan Komunikasi'],  // Satpel Jayapura
  ['198311102009121002','Elektronika'],  // Satpel Sofifi
  ['199308302019021003','Otomotif'],  // Satpel Mamuju
  ['197307291994031001','Listrik'],  // Satpel Bantul
  ['197310051994031006','TIK'],  // Satpel Jambi
  ['197902032009011010','Las'],  // Satpel Jambi
];

async function run() {
  console.log('📋 Update Data Kejuruan Instruktur (Batch Mode)');
  console.log('=================================================\n');
  console.log(`📊 Total instruktur: ${instrukturData.length}\n`);

  // Build a single UPDATE using CASE WHEN for efficiency
  // Split into batches of 50 to avoid query size limits
  const BATCH_SIZE = 50;
  let totalUpdated = 0;
  let totalNotFound = 0;

  for (let i = 0; i < instrukturData.length; i += BATCH_SIZE) {
    const batch = instrukturData.slice(i, i + BATCH_SIZE);
    
    const caseWhen = batch.map(([nip, kej]) => `WHEN nip = '${nip}' THEN '${kej}'`).join('\n    ');
    const nipList = batch.map(([nip]) => `'${nip}'`).join(', ');
    
    const sql = `
      UPDATE employees
      SET kejuruan = CASE
        ${caseWhen}
        ELSE kejuruan
      END
      WHERE nip IN (${nipList})
    `;

    try {
      const result = await executeSQL(sql);
      const parsed = JSON.parse(result.data);
      // The API returns affected rows info
      console.log(`Batch ${Math.floor(i/BATCH_SIZE)+1}: Status ${result.statusCode} - ${result.data.substring(0, 100)}`);
      totalUpdated += batch.length;
    } catch (err) {
      console.error(`\n❌ Batch ${Math.floor(i/BATCH_SIZE)+1} failed: ${err.message}`);
    }
  }

  console.log(`\n✅ Selesai! ${totalUpdated} instruktur diproses.`);

  // Verification
  console.log('\n📊 Verifikasi...');
  try {
    const result = await executeSQL(`
      SELECT 
        COUNT(*) FILTER (WHERE kejuruan IS NOT NULL) AS sudah_terisi,
        COUNT(*) FILTER (WHERE kejuruan IS NULL AND position_name ILIKE '%instruktur%') AS instruktur_belum_terisi,
        COUNT(*) AS total_pegawai
      FROM employees
    `);
    console.log('Hasil verifikasi:', result.data);
  } catch (err) {
    console.error('Verifikasi gagal:', err.message);
  }
}

run();
