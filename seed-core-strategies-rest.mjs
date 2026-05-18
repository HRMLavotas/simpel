import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not defined in .env.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false
  }
});

const coreSdmStrategies = {
  category: 'strategi',
  title: 'Strategi Penyiapan & Pengelolaan SDM Balai',
  points: [
    {
      title: 'Strategi 1: Penyiapan & Alokasi SDM Satpel Baru Berbasis Analisis Lokal',
      value: 'Penyiapan SDM Lokal',
      description: 'Menyusun formasi kebutuhan pegawai, rekrutmen instruktur baru, dan penempatan staf pendukung yang disesuaikan secara presisi dengan kebutuhan lokal daerah.'
    },
    {
      title: 'Strategi 2: Analisis & Pemenuhan Sarana Prasarana (Sarpras) Berbasis Potensi Wilayah',
      value: 'Pemenuhan Sarpras Wilayah',
      description: 'Menyediakan dan memodernisasi peralatan workshop serta mesin pelatihan agar selaras dengan standar teknologi industri dominan daerah.'
    },
    {
      title: 'Strategi 3: Penyelarasan & Pengembangan Program Pelatihan Sesuai Kebutuhan Pasar Kerja Lokal',
      value: 'Pengembangan Program Lokal',
      description: 'Menyusun kurikulum, modul pelatihan berbasis kompetensi (PBK) baru, dan skema sertifikasi BNSP yang dinilai paling mendesak bagi industri setempat.'
    },
    {
      title: 'Strategi 4: Peningkatan Kapasitas & Upgrading Instruktur Eksisting Berbasis Kesenjangan Keterampilan Daerah',
      value: 'Peningkatan Kapasitas SDM',
      description: 'Program upskilling, reskilling, sertifikasi asesor, serta magang industri bagi instruktur eksisting agar relevan dengan tuntutan kejuruan baru.'
    }
  ]
};

async function runUpdate() {
  console.log('Connecting to Supabase to update strategies...');
  
  try {
    // 1. Delete all old strategies (category = 'strategi')
    const { error: deleteError } = await supabase
      .from('policy_parameters')
      .delete()
      .eq('category', 'strategi');

    if (deleteError) throw deleteError;
    console.log('Successfully cleared old strategies.');

    // 2. Insert the single main header for core strategies
    const { data: parentData, error: parentError } = await supabase
      .from('policy_parameters')
      .insert({
        category: coreSdmStrategies.category,
        title: coreSdmStrategies.title,
        parent_id: null,
        value: null,
        description: null
      })
      .select('id')
      .single();

    if (parentError) throw parentError;
    
    const parentId = parentData.id;
    console.log(`Created new strategies header: "${coreSdmStrategies.title}" with ID: ${parentId}`);

    // 3. Insert the 4 Core SDM Points
    const pointsToInsert = coreSdmStrategies.points.map(pt => ({
      category: coreSdmStrategies.category,
      title: pt.title,
      parent_id: parentId,
      value: pt.value,
      description: pt.description
    }));

    const { error: pointsError } = await supabase
      .from('policy_parameters')
      .insert(pointsToInsert);

    if (pointsError) throw pointsError;
    console.log(`Successfully seeded ${pointsToInsert.length} Core SDM Strategies into the database!`);

  } catch (err) {
    console.error('Error during update:', err);
  }
}

runUpdate();
