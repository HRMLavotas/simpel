import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Client } = pg;

const seedData = [
  {
    category: 'standar',
    title: 'Permenaker No. 6/2025 (Penyelenggaraan Pelatihan Vokasi)',
    points: [
      { title: 'Rasio Instruktur:Peserta (Praktik)', value: '1 : 16', description: null },
      { title: 'Rasio Instruktur:Peserta (Teori)', value: '1 : 32', description: null },
      { title: 'Proporsi Kurikulum PBK', value: 'Min. 70% Praktik, Max. 30% Teori', description: null },
      { title: 'Dasar Penghitungan Formasi', value: 'Peta Jabatan (Analisis Jabatan & ABK)', description: null },
      { title: 'Syarat Pengalaman Instruktur', value: 'Min. 2 tahun pengalaman industri', description: null }
    ]
  },
  {
    category: 'standar',
    title: 'Permenaker No. 5/2022 (Akreditasi Lembaga Pelatihan Kerja / KMPI)',
    points: [
      { title: 'Standar 1: Kerangka Kompetensi', value: 'Program mengacu SKKNI / Internasional', description: null },
      { title: 'Standar 5: Kualifikasi Tenaga Kerja', value: 'Instruktur wajib ToT & Sertifikasi Kompetensi', description: null },
      { title: 'Standar 6: Sarana & Prasarana', value: 'Workshop sesuai standar layout industri & K3', description: null },
      { title: 'Standar 7: Tata Kelola LPK', value: 'Wajib menerapkan SPMI (Mutu Internal)', description: null }
    ]
  },
  {
    category: 'jabfung',
    title: 'Permenpan RB No. 82/2020 (Jabatan Fungsional Instruktur)',
    points: [
      { title: 'Instruktur Kategori Keterampilan', value: 'II/c s.d. III/d', description: 'Pelaksanaan operasional bimbingan praktik kerja' },
      { title: 'Instruktur Ahli Pertama', value: 'III/a s.d. III/b', description: 'Melaksanakan pelatihan dasar & bimbingan instruksi' },
      { title: 'Instruktur Ahli Muda', value: 'III/c s.d. III/d', description: 'Menyusun perangkat pelatihan & pengembangan modul standar' },
      { title: 'Instruktur Ahli Madya', value: 'IV/a s.d. IV/c', description: 'Mengembangkan program strategis, desain, & evaluasi regional/nasional' },
      { title: 'Instruktur Ahli Utama', value: 'IV/d s.d. IV/e', description: 'Merumuskan kebijakan pelatihan makro, desain inovasi global, & kajian strategis' }
    ]
  },
  {
    category: 'jabfung',
    title: 'Permenpan RB No. 47/2021 (Standar Kompetensi Jabfung Instruktur)',
    points: [
      { title: 'Kompetensi Teknis Instruktur', value: 'Metodologi Pelatihan + Kompetensi Kejuruan', description: 'Menguasai bidang metodologi dan materi keahlian teknis' },
      { title: 'Kompetensi Manajerial', value: '8 Pilar Kompetensi', description: 'Integritas, kerjasama, komunikasi, orientasi pada hasil, pelayanan publik' },
      { title: 'Kompetensi Sosial Kultural', value: 'Perekat Bangsa', description: 'Kepekaan terhadap kemajemukan, toleransi, empati kebangsaan' }
    ]
  },
  {
    category: 'program',
    title: 'Fokus Strategis Ditjen Binalavotas Kemnaker RI (Pilar Utama PBK)',
    points: [
      { title: '💻 TIK, Animasi, & Digitalisasi', value: 'Sektor Prioritas Tinggi', description: 'Menyiapkan keahlian AI, software development, multimedia, & cyber security' },
      { title: '🔧 Manufaktur, Mekatronika, & Otomotif EV', value: 'Sektor Prioritas Tinggi', description: 'Teknologi presisi tinggi, robotik, CNC, & konversi/perawatan kendaraan listrik (EV)' },
      { title: '🔥 Las (Welding) & Fabrikasi Logam', value: 'Sektor Prioritas Tinggi', description: 'Sertifikasi internasional AWS/CSWIP untuk galangan kapal & alat berat' },
      { title: '❄️ Refrigerasi & Tata Udara (HVAC)', value: 'Sektor Prioritas Sedang', description: 'Pelatihan sistem pendingin komersial & industri ramah lingkungan' },
      { title: '🏗️ Konstruksi & Bangunan Hijau (Green Building)', value: 'Sektor Prioritas Sedang', description: 'Pelatihan sipil terbarukan dan konstruksi ramah lingkungan' },
      { title: '🍳 Pariwisata, Hospitality, & Boga', value: 'Sektor Prioritas Tinggi', description: 'Pelatihan barista, kuliner internasional, & manajemen perhotelan' },
      { title: '🌱 Agribisnis, Budidaya, & Pascapanen', value: 'Sektor Prioritas Tinggi', description: 'Teknologi pertanian modern (smart farming) & pengolahan hasil panen unggul' },
      { title: '🏭 Garmen, Tekstil, & Desain Fashion', value: 'Sektor Prioritas Sedang', description: 'Pengembangan industri pakaian jadi dan desain busana ekspor' }
    ]
  },
  {
    category: 'program',
    title: 'Program Pelatihan Khusus & Inklusi Ketenagakerjaan',
    points: [
      { title: '♿ Pelatihan & Penempatan Disabilitas', value: 'Inklusi Kerja', description: 'Pelatihan vokasi inklusif menjamin hak kesetaraan kerja penyandang disabilitas' },
      { title: '🚀 Talent & Innovation Hub (TIH)', value: 'Inkubasi Bisnis', description: 'Mendorong lahirnya wirausaha baru (creative entrepreneur) dan startup lokal' },
      { title: '🏥 Kesehatan & Keselamatan Kerja (K3) Industri', value: 'Sertifikasi Wajib', description: 'Pelatihan bersertifikat Ahli K3 Umum untuk menekan angka kecelakaan kerja' }
    ]
  },
  {
    category: 'strategi',
    title: 'Empat Program Strategis Prioritas Ditjen Binalavotas (Sasaran Renstra)',
    points: [
      { title: 'Skilling & Reskilling Massal', value: 'Renstra Pilar 1', description: 'Penguatan Pusat Pelatihan Vokasi untuk menyiapkan angkatan kerja berdaya saing' },
      { title: 'Labor Productivity Clinics', value: 'Renstra Pilar 2', description: 'Peningkatan produktivitas perusahaan nasional melalui alat ukur terstandar' },
      { title: 'Labor Market Information System (LMIS)', value: 'Renstra Pilar 3', description: 'Sinkronisasi kelulusan pelatihan dengan lowongan kerja real-time via SIAPkerja' },
      { title: 'Kemitraan Vokasi Daerah (Link and Match)', value: 'Renstra Pilar 4', description: 'Kerjasama sinergis Balai Pelatihan dengan industri lokal, KADIN, & asosiasi' }
    ]
  },
  {
    category: 'strategi',
    title: 'Strategi Pemenuhan Formasi SDM & Sarpras UPT/Satpel',
    points: [
      { title: 'Rekrutmen Formasi CASN/PPPK Instruktur', value: 'Strategi SDM 1', description: 'Pengisian fungsional instruktur berkala sesuai dengan peta jabatan dan ABK' },
      { title: 'Pengembangan Karir & Sertifikasi Berkelanjutan', value: 'Strategi SDM 2', description: 'Pelatihan up-skilling berkelanjutan bagi instruktur (ToT & teknis industri)' },
      { title: 'Modernisasi Workshop & Pengadaan Sarpras K3', value: 'Strategi Sarpras 1', description: 'Pengadaan peralatan praktik canggih sesuai kualifikasi industri modern' },
      { title: 'Optimalisasi Re-utilisasi Sarpras Antar-UPT', value: 'Strategi Sarpras 2', description: 'Mutasi atau hibah alat pelatihan yang idle dari satu UPT/Satpel ke unit lain' }
    ]
  }
];

async function setup() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    await client.connect();
    console.log('Connected to PostgreSQL database successfully.');

    // 1. Alter table to support hierarchy if not already present
    await client.query(`
      ALTER TABLE policy_parameters 
      ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES policy_parameters(id) ON DELETE CASCADE;
    `);
    console.log('Verified database table column "parent_id" exists.');

    // 2. Clear old flat items to enable clean hierarchical seed
    await client.query('TRUNCATE TABLE policy_parameters CASCADE;');
    console.log('Truncated policy_parameters table for clean hierarchical seeding.');

    // 3. Insert parent regulations and their child points
    let parentCount = 0;
    let pointCount = 0;

    for (const group of seedData) {
      // Insert Parent Regulation
      const parentRes = await client.query(
        `INSERT INTO policy_parameters (category, title, parent_id, value, description) 
         VALUES ($1, $2, NULL, NULL, NULL) RETURNING id;`,
        [group.category, group.title]
      );
      
      const parentId = parentRes.rows[0].id;
      parentCount++;

      // Insert Child Points
      for (const pt of group.points) {
        await client.query(
          `INSERT INTO policy_parameters (category, title, parent_id, value, description) 
           VALUES ($1, $2, $3, $4, $5);`,
          [group.category, pt.title, parentId, pt.value, pt.description]
        );
        pointCount++;
      }
    }

    console.log(`Successfully seeded database:`);
    console.log(`- ${parentCount} Regulasi Utama (Main Regulations) created.`);
    console.log(`- ${pointCount} Point-point Regulasi (Child Parameters) created.`);
    console.log(`Total records: ${parentCount + pointCount}`);

  } catch (err) {
    console.error('Error during hierarchical seeding:', err);
  } finally {
    await client.end();
  }
}

setup();
