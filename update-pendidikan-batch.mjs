/**
 * Script untuk update data pendidikan pegawai ke database
 * Versi BATCH - lebih cepat dengan bulk operations
 */

import XLSX from 'xlsx';
import fs from 'fs';

// Baca .env file manual
function loadEnv() {
  try {
    const envContent = fs.readFileSync('.env', 'utf-8');
    const env = {};
    envContent.split('\n').forEach(line => {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        env[key.trim()] = valueParts.join('=').trim();
      }
    });
    return env;
  } catch (error) {
    console.error('❌ Error membaca file .env:', error.message);
    return {};
  }
}

const env = loadEnv();
const SUPABASE_URL = env.VITE_SUPABASE_URL?.replace(/"/g, '') || 'https://mauyygrbdopmpdpnwzra.supabase.co';
const SUPABASE_SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY?.replace(/"/g, '') || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1hdXl5Z3JiZG9wbXBkcG53enJhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDkzMTM4NCwiZXhwIjoyMDkwNTA3Mzg0fQ.qMJoz6Xuy4PKwS-LKWpjf_WM5o0fuNtEE4hsgLjJX4Q';

console.log('🔑 Supabase URL:', SUPABASE_URL);
console.log('🔑 Service Key:', SUPABASE_SERVICE_KEY.substring(0, 20) + '...');
console.log();

// Baca file Excel
const excelFile = 'DAFTAR_PEGAWAI_2026-05-08_.xlsx';

console.log(`📖 Membaca file Excel: ${excelFile}`);

const workbook = XLSX.readFile(excelFile);
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];
const data = XLSX.utils.sheet_to_json(worksheet);

console.log(`✅ Total pegawai dalam Excel: ${data.length}`);

// Deteksi nama kolom yang benar
const nipCol = 'NIP';
const jenjangCol = 'Pendidikan Terakhir';  // Ini adalah kolom Jenjang
const jurusanCol = '__EMPTY';  // Ini adalah kolom Jurusan
const sekolahCol = '__EMPTY_1';  // Ini adalah kolom Nama Sekolah

console.log(`📝 Mapping kolom:`);
console.log(`   NIP: "${nipCol}"`);
console.log(`   Jenjang: "${jenjangCol}"`);
console.log(`   Jurusan: "${jurusanCol}"`);
console.log(`   Sekolah: "${sekolahCol}"`);
console.log();

// Filter out header row (row dengan value "Jenjang" di kolom Pendidikan Terakhir)
const filteredData = data.filter(row => {
  const jenjang = row[jenjangCol];
  return jenjang && jenjang !== 'Jenjang ' && jenjang !== 'Jenjang';
});

console.log(`✅ Data setelah filter header: ${filteredData.length} pegawai`);
console.log(`📋 Sample data pertama:`, filteredData[0]);
console.log();

// Statistik
const stats = {
  total: 0,  // Will be set after filtering
  success: 0,
  notFound: 0,
  noEducation: 0,
  error: 0,
  skipped: 0
};

// Fungsi untuk delay (rate limiting)
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Batch size untuk processing
const BATCH_SIZE = 10;

console.log('🔄 Memulai update data pendidikan (BATCH MODE)...\n');

async function updatePendidikanBatch() {
  // Set total after filtering
  stats.total = filteredData.length;
  
  // Process in batches
  for (let i = 0; i < filteredData.length; i += BATCH_SIZE) {
    const batch = filteredData.slice(i, Math.min(i + BATCH_SIZE, filteredData.length));
    
    // Process batch in parallel
    await Promise.all(batch.map(async (row, batchIdx) => {
      const idx = i + batchIdx;
      
      try {
        const nip = row[nipCol] ? String(row[nipCol]).trim() : null;
        const jenjang = row[jenjangCol] ? String(row[jenjangCol]).trim() : null;
        const jurusan = row[jurusanCol] ? String(row[jurusanCol]).trim() : null;
        const namaSekolah = row[sekolahCol] ? String(row[sekolahCol]).trim() : null;
        
        // Skip jika NIP kosong atau header row
        if (!nip || nip === 'undefined' || nip.toLowerCase().includes('nip')) {
          stats.skipped++;
          return;
        }
        
        // 1. Cari employee berdasarkan NIP
        const empUrl = `${SUPABASE_URL}/rest/v1/employees?select=id&nip=eq.${nip}&limit=1`;
        const empResponse = await fetch(empUrl, {
          headers: {
            'apikey': SUPABASE_SERVICE_KEY,
            'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
          }
        });
        
        const employees = await empResponse.json();
        
        if (!employees || employees.length === 0) {
          stats.notFound++;
          return;
        }
        
        const employeeId = employees[0].id;
        
        // 2. Cari education_history terakhir
        const eduUrl = `${SUPABASE_URL}/rest/v1/education_history?select=id&employee_id=eq.${employeeId}&order=graduation_year.desc,created_at.desc&limit=1`;
        const eduResponse = await fetch(eduUrl, {
          headers: {
            'apikey': SUPABASE_SERVICE_KEY,
            'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
          }
        });
        
        const educations = await eduResponse.json();
        
        if (!educations || educations.length === 0) {
          stats.noEducation++;
          return;
        }
        
        const educationId = educations[0].id;
        
        // 3. Update education_history
        const updateData = {};
        if (jenjang && jenjang !== 'Jenjang') updateData.level = jenjang;
        if (jurusan && jurusan !== 'Jurusan') updateData.major = jurusan;
        if (namaSekolah && namaSekolah !== 'Nama Sekolah') updateData.institution_name = namaSekolah;
        
        if (Object.keys(updateData).length > 0) {
          const updateUrl = `${SUPABASE_URL}/rest/v1/education_history?id=eq.${educationId}`;
          const updateResponse = await fetch(updateUrl, {
            method: 'PATCH',
            headers: {
              'apikey': SUPABASE_SERVICE_KEY,
              'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
              'Content-Type': 'application/json',
              'Prefer': 'return=representation'
            },
            body: JSON.stringify(updateData)
          });
          
          if (!updateResponse.ok) {
            throw new Error(`Update failed: ${updateResponse.statusText}`);
          }
          
          stats.success++;
        } else {
          stats.skipped++;
        }
        
      } catch (error) {
        stats.error++;
        if (stats.error <= 5) {
          console.error(`❌ Error processing NIP ${row[nipCol]}: ${error.message}`);
        }
      }
    }));
    
    // Progress indicator
    const processed = Math.min(i + BATCH_SIZE, filteredData.length);
    const percentage = Math.round(processed / filteredData.length * 100);
    console.log(`📊 Progress: ${processed}/${filteredData.length} (${percentage}%) - Success: ${stats.success}, Errors: ${stats.error}`);
    
    // Small delay between batches
    await delay(100);
  }
  
  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 SUMMARY HASIL UPDATE');
  console.log('='.repeat(60));
  console.log(`Total records di Excel    : ${stats.total}`);
  console.log(`✅ Berhasil diupdate      : ${stats.success}`);
  console.log(`⚠️  Pegawai tidak ditemukan: ${stats.notFound}`);
  console.log(`⚠️  Tidak ada data pendidikan: ${stats.noEducation}`);
  console.log(`❌ Error                  : ${stats.error}`);
  console.log(`⏭️  Skipped (data kosong) : ${stats.skipped}`);
  console.log('='.repeat(60));
  
  const successRate = stats.total > 0 ? (stats.success / stats.total * 100) : 0;
  console.log(`\n✨ Success Rate: ${successRate.toFixed(1)}%`);
  
  if (stats.success > 0) {
    console.log(`\n✅ Update selesai! ${stats.success} data pendidikan berhasil diupdate.`);
  } else {
    console.log(`\n⚠️  Tidak ada data yang berhasil diupdate. Periksa log error di atas.`);
  }
}

// Run the update
updatePendidikanBatch().catch(console.error);
