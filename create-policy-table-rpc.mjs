import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function setup() {
  console.log('--- Setting up policy_parameters table ---');

  // 1. Create table and setup RLS via exec_sql RPC
  const sql = `
    CREATE TABLE IF NOT EXISTS policy_parameters (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      category TEXT NOT NULL,
      title TEXT NOT NULL,
      value TEXT,
      description TEXT,
      created_at TIMESTAMPTZ DEFAULT now()
    );
    
    ALTER TABLE policy_parameters ENABLE ROW LEVEL SECURITY;
    
    DROP POLICY IF EXISTS "Allow all public operations" ON policy_parameters;
    
    CREATE POLICY "Allow all public operations" ON policy_parameters FOR ALL TO public USING (true) WITH CHECK (true);
  `;

  console.log('Sending SQL commands via exec_sql RPC...');
  const { data, error: rpcError } = await supabase.rpc('exec_sql', { sql_query: sql });

  if (rpcError) {
    console.error('Error executing SQL via RPC:', rpcError.message);
    console.log('Attempting each statement separately in case of batch issues...');
    
    const statements = [
      `CREATE TABLE IF NOT EXISTS policy_parameters (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        category TEXT NOT NULL,
        title TEXT NOT NULL,
        value TEXT,
        description TEXT,
        created_at TIMESTAMPTZ DEFAULT now()
      );`,
      `ALTER TABLE policy_parameters ENABLE ROW LEVEL SECURITY;`,
      `DROP POLICY IF EXISTS "Allow all public operations" ON policy_parameters;`,
      `CREATE POLICY "Allow all public operations" ON policy_parameters FOR ALL TO public USING (true) WITH CHECK (true);`
    ];

    for (let i = 0; i < statements.length; i++) {
      const { error } = await supabase.rpc('exec_sql', { sql_query: statements[i] });
      if (error) {
        console.error(`Statement ${i + 1} failed:`, error.message);
      } else {
        console.log(`Statement ${i + 1} succeeded.`);
      }
    }
  } else {
    console.log('SQL commands executed successfully via RPC!');
  }

  // 2. Query to verify if the table now exists
  const { data: selectData, error: selectError } = await supabase.from('policy_parameters').select('count');
  if (selectError) {
    console.error('Table verification failed:', selectError.message);
    return;
  }
  
  console.log('Table verification succeeded! Checking for existing rows...');

  // 3. Seed data using Supabase Client if table is empty
  const { data: rows, error: fetchError } = await supabase.from('policy_parameters').select('*');
  if (fetchError) {
    console.error('Error fetching rows:', fetchError.message);
    return;
  }

  if (rows.length === 0) {
    console.log('Seeding default policy parameters via Supabase REST API...');
    
    const seedItems = [
      // Tab: Standar
      { category: 'standar', title: 'Rasio Instruktur:Peserta (Praktik)', value: '1 : 16', description: null },
      { category: 'standar', title: 'Rasio Instruktur:Peserta (Teori)', value: '1 : 50', description: null },
      { category: 'standar', title: 'Kapasitas per Kelas', value: '16 orang', description: null },
      { category: 'standar', title: 'Dasar Penghitungan', value: 'Anjab + ABK', description: null },
      { category: 'standar', title: 'Syarat Pengalaman', value: 'Min. 2 tahun', description: null },
      { category: 'standar', title: 'Sertifikasi Wajib', value: 'BNSP/LSP + ToT', description: null },

      // Tab: Jabfung
      { category: 'jabfung', title: 'Instruktur Ahli Pertama', value: 'VIII/IX', description: 'Pelaksana pelatihan dasar' },
      { category: 'jabfung', title: 'Instruktur Ahli Muda', value: 'IX/X', description: 'Pengembang modul & kurikulum' },
      { category: 'jabfung', title: 'Instruktur Ahli Madya', value: 'XI/XII', description: 'Pembina & quality control' },
      { category: 'jabfung', title: 'Instruktur Ahli Utama', value: 'XIII/XIV', description: 'Penetapan kebijakan teknis' },

      // Tab: Program
      { category: 'program', title: '💻 TIK & Digital', value: null, description: null },
      { category: 'program', title: '🔧 Manufaktur & Mekatronika', value: null, description: null },
      { category: 'program', title: '🔥 Las & Fabrikasi', value: null, description: null },
      { category: 'program', title: '❄️ Refrigerasi & AC', value: null, description: null },
      { category: 'program', title: '🏗️ Konstruksi', value: null, description: null },
      { category: 'program', title: '🍳 Pariwisata & Boga', value: null, description: null },
      { category: 'program', title: '🌱 Agribisnis', value: null, description: null },
      { category: 'program', title: '🏭 Garmen & Tekstil', value: null, description: null },

      // Tab: Strategi
      { category: 'strategi', title: 'Rekrutmen Jabfung Instruktur Baru', value: null, description: 'Formasi CASN/PPPK berbasis ABK' },
      { category: 'strategi', title: 'Up-skilling Instruktur Eksisting', value: null, description: 'ToT, sertifikasi BNSP, metodologi PBK' },
      { category: 'strategi', title: 'Rekrutmen Non-ASN (PPPK Industry)', value: null, description: 'Tenaga teknis ahli dari industri' },
      { category: 'strategi', title: 'Pemetaan Formasi Unit Baru (Greenfield)', value: null, description: 'Analisis kebutuhan SDM dari nol' },
      { category: 'strategi', title: 'Mobilisasi Seed Team SDM', value: null, description: 'Tim instruktur inti dari BBPVP Pembina' },
      { category: 'strategi', title: 'Analisis Beban Kerja (ABK) Inisiasi', value: null, description: 'Standar minimum SDM operasional awal' },
      { category: 'strategi', title: 'Pengadaan Sarpras Prioritas Tinggi', value: null, description: 'Alat praktik utama daya serap tinggi' },
      { category: 'strategi', title: 'Standarisasi Workshop & K3', value: null, description: 'Modernisasi sesuai standar industri' },
      { category: 'strategi', title: 'Kemitraan Sarpras Industri', value: null, description: 'Kolaborasi sarana industri sekitar' },
      { category: 'strategi', title: 'Hibah & Re-utilisasi Sarpras', value: null, description: 'Optimalisasi alat dari UPT lain' }
    ];

    const { error: insertError } = await supabase.from('policy_parameters').insert(seedItems);
    if (insertError) {
      console.error('Error seeding items:', insertError.message);
    } else {
      console.log(`Successfully seeded ${seedItems.length} default policy parameters!`);
    }
  } else {
    console.log(`Table already contains ${rows.length} rows. Skipping seeding.`);
  }
}

setup();
