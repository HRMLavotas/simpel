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

const advancedScenarios = {
  category: 'strategi',
  title: 'Strategi Manajemen Risiko & Skenario Kebutuhan UPT',
  points: [
    { 
      title: 'Skenario 1: Disrupsi Industri & Pergeseran Sektor', 
      value: 'Reskilling Instruktur', 
      description: 'Reskilling instruktur dari kejuruan tradisional/jenuh ke kejuruan digital/manufaktur presisi sesuai perkembangan industri wilayah.' 
    },
    { 
      title: 'Skenario 2: Beban Kerja Instruktur Overload (Over-capacity)', 
      value: 'Asisten Instruktur + Praktisi', 
      description: 'Rekrutmen praktisi industri part-time & asisten instruktur dari lulusan terbaik guna mempertahankan rasio praktik ideal 1:16.' 
    },
    { 
      title: 'Skenario 3: Anggaran Terbatas Mencegah Keusangan Alat Praktik', 
      value: 'Workshop Satelit Industri', 
      description: 'Kemitraan pemanfaatan workshop pabrik industri mitra (workshop satelit) untuk melatih peserta menggunakan teknologi terbaru.' 
    },
    { 
      title: 'Skenario 4: Balai Baru Tanpa SDM Inti (Greenfield UPT)', 
      value: 'Detasering Instruktur Pembina', 
      description: 'Mobilisasi penugasan sementara instruktur berpengalaman dari BBPVP Pembina untuk mendampingi balai baru selama 6-12 bulan.' 
    },
    { 
      title: 'Skenario 5: Rendahnya Kelulusan Sertifikasi Kompetensi (BNSP)', 
      value: 'Asesor Internal & TUK Mandiri', 
      description: 'Sertifikasi instruktur menjadi Asesor BNSP & peningkatan status workshop menjadi Tempat Uji Kompetensi (TUK) Mandiri.' 
    },
    { 
      title: 'Skenario 6: Rendahnya Keterserapan Kerja Alumni (Mismatch)', 
      value: 'Advisory Board & Tutup Kelas Jenuh', 
      description: 'Pembentukan dewan penasihat industri lokal untuk menutup kelas jenuh & membuka kejuruan baru berdaya serap tinggi (e.g. Solar Panel).' 
    }
  ]
};

async function addScenarios() {
  console.log('Connecting to Supabase REST API to append advanced scenarios...');
  
  try {
    // 1. Insert the main scenario header
    const { data: parentData, error: parentError } = await supabase
      .from('policy_parameters')
      .insert({
        category: advancedScenarios.category,
        title: advancedScenarios.title,
        parent_id: null,
        value: null,
        description: null
      })
      .select('id')
      .single();

    if (parentError) throw parentError;
    
    const parentId = parentData.id;
    console.log(`Created parent regulation: "${advancedScenarios.title}" with ID: ${parentId}`);

    // 2. Insert the child scenario points
    const pointsToInsert = advancedScenarios.points.map(pt => ({
      category: advancedScenarios.category,
      title: pt.title,
      parent_id: parentId,
      value: pt.value,
      description: pt.description
    }));

    const { error: pointsError } = await supabase
      .from('policy_parameters')
      .insert(pointsToInsert);

    if (pointsError) throw pointsError;
    console.log(`Successfully appended ${pointsToInsert.length} advanced scenario points to the database!`);

  } catch (err) {
    console.error('Error appending advanced scenarios:', err);
  }
}

addScenarios();
