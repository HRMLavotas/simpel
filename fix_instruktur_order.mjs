import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://mauyygrbdopmpdpnwzra.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1hdXl5Z3JiZG9wbXBkcG53enJhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDkzMTM4NCwiZXhwIjoyMDkwNTA3Mzg0fQ.qMJoz6Xuy4PKwS-LKWpjf_WM5o0fuNtEE4hsgLjJX4Q";

const supabase = createClient(supabaseUrl, supabaseKey);

// Unit-unit yang bermasalah
const problemUnits = [
  {
    department: 'BBPVP Serang',
    madyaId: '8b5941a2-d131-4449-9840-4ca845054030',
    mudaId: '4313cb4a-aee6-4186-a27d-fdc2a5681f52'
  },
  {
    department: 'BPVP Ambon',
    madyaId: 'bc4d4995-dd32-4f99-8533-ec841e483f29',
    mudaId: '7719d529-2138-41e4-b60c-5ab0d4d6b811'
  },
  {
    department: 'BPVP Banda Aceh',
    madyaId: '135a03f5-b15b-437c-a7a5-505af755e194',
    mudaId: '2b76878c-576a-4955-a122-2c887514365b'
  },
  {
    department: 'BPVP Bandung Barat',
    madyaId: '5b2a3f08-3ba7-4af7-accc-ce6872ea8aec',
    mudaId: 'd8e9e080-11fd-4c8b-8ce4-7017530009e2'
  },
  {
    department: 'BPVP Bantaeng',
    madyaId: '67129102-408a-4d70-9bcd-176badee682f',
    mudaId: 'ecbfa51c-648b-4b15-9433-dcf8837fc428'
  },
  {
    department: 'BPVP Banyuwangi',
    madyaId: '077a31dc-9c20-4310-9ce3-9062b93682bd',
    mudaId: '9f97247a-618b-4618-bbdc-03756ae92ed5'
  },
  {
    department: 'BPVP Belitung',
    madyaId: '6ded3025-f8f7-4867-bd41-993b970c4b3e',
    mudaId: '941c5c51-a804-4408-8b98-da63dcb2632e'
  },
  {
    department: 'BPVP Kendari',
    madyaId: 'b74a148a-8275-4256-93a6-4e24677e37bc',
    mudaId: 'f0b588ff-1dd5-4893-917f-b8a14df68e6c'
  },
  {
    department: 'BPVP Lombok Timur',
    madyaId: '108fbed8-4379-452c-acc8-d9cf6dfaa89b',
    mudaId: '658edfe9-aff6-46ef-b0a4-21b58d79ce6e'
  },
  {
    department: 'BPVP Padang',
    madyaId: '27b61dd7-ceb0-4e5c-bf24-30137f54ca39',
    mudaId: 'f2d79081-40f5-4b8c-9e0d-67448d268d81'
  },
  {
    department: 'BPVP Pangkep',
    madyaId: 'abdad9a8-e67d-4979-ad28-ef2cc4192360',
    mudaId: '78b8681f-cbda-42db-92b2-8635539de2dc'
  },
  {
    department: 'BPVP Samarinda',
    madyaId: 'd748a2d6-76f2-4d0f-b770-6108ca551236',
    mudaId: 'f91c8a6a-a979-46ce-8706-33422e3d8e9d'
  },
  {
    department: 'BPVP Sidoarjo',
    madyaId: 'c17220c1-c7b5-48c2-b8ed-25ecd624f54e',
    mudaId: '107ce500-861f-4655-9059-e61713308975'
  },
  {
    department: 'BPVP Sorong',
    madyaId: '8b7aaf98-8262-4511-9462-e771057ea34e',
    mudaId: '519ee44b-fb27-44a8-9ec4-9640e5799926'
  },
  {
    department: 'BPVP Surakarta',
    madyaId: '705bad3a-1aa4-4211-8aef-3ad6942f0312',
    mudaId: '50266f30-d99d-41af-b213-35a4ea01830a'
  },
  {
    department: 'BPVP Ternate',
    madyaId: 'efd5451d-f3e6-46d8-9522-2cfc7bde89a8',
    mudaId: 'bd31c393-72cd-407d-b7b0-10405442c671'
  }
];

async function fixInstrukturOrder() {
  console.log('🔧 Memperbaiki urutan jabatan Instruktur Ahli...\n');
  console.log(`📊 Total unit yang perlu diperbaiki: ${problemUnits.length}\n`);

  let successCount = 0;
  let errorCount = 0;

  for (const unit of problemUnits) {
    console.log(`\n📍 ${unit.department}`);
    console.log('─'.repeat(80));

    try {
      // Get current orders
      const { data: positions, error: fetchError } = await supabase
        .from('position_references')
        .select('id, position_name, position_order')
        .in('id', [unit.madyaId, unit.mudaId]);

      if (fetchError) throw fetchError;

      const madya = positions.find(p => p.id === unit.madyaId);
      const muda = positions.find(p => p.id === unit.mudaId);

      if (!madya || !muda) {
        console.log('  ❌ Data tidak ditemukan');
        errorCount++;
        continue;
      }

      console.log(`  Sebelum: ${madya.position_name} (order ${madya.position_order}), ${muda.position_name} (order ${muda.position_order})`);

      // Swap the orders
      const madyaNewOrder = muda.position_order;
      const mudaNewOrder = madya.position_order;

      // Update Madya
      const { error: madyaError } = await supabase
        .from('position_references')
        .update({ position_order: madyaNewOrder })
        .eq('id', unit.madyaId);

      if (madyaError) throw madyaError;

      // Update Muda
      const { error: mudaError } = await supabase
        .from('position_references')
        .update({ position_order: mudaNewOrder })
        .eq('id', unit.mudaId);

      if (mudaError) throw mudaError;

      console.log(`  ✅ Berhasil: ${madya.position_name} (order ${madyaNewOrder}), ${muda.position_name} (order ${mudaNewOrder})`);
      successCount++;

    } catch (error) {
      console.log(`  ❌ Error: ${error.message}`);
      errorCount++;
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log(`\n📊 Hasil:`);
  console.log(`   ✅ Berhasil: ${successCount} unit`);
  console.log(`   ❌ Gagal: ${errorCount} unit`);
  
  if (successCount > 0) {
    console.log(`\n✨ Urutan jabatan Instruktur Ahli telah diperbaiki!`);
    console.log(`   Sekarang Instruktur Ahli Madya berada di atas Instruktur Ahli Muda di semua unit.`);
  }
}

fixInstrukturOrder();
