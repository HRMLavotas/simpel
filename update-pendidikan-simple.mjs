/**
 * Script untuk update data pendidikan pegawai ke database
 * Versi sederhana - membaca .env manual dan menggunakan fetch API
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

// Helper function untuk Supabase API calls
async function supabaseQuery(table, method, options = {}) {
  let url = `${SUPABASE_URL}/rest/v1/${table}`;
  
  const headers = {
    'apikey': SUPABASE_SERVICE_KEY,
    'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
  };
  
  const fetchOptions = {
    method: method,
    headers: headers
  };
  
  if (options.select) {
    url += `?select=${options.select}`;
  }
  
  if (options.eq) {
    Object.entries(options.eq).forEach(([key, value]) => {
      url += url.includes('?') ? '&' : '?';
      url += `${key}=eq.${value}`;
    });
  }
  
  if (options.order) {
    url += url.includes('?') ? '&' : '?';
    url += `order=${options.order}`;
  }
  
  if (options.limit) {
    url += url.includes('?') ? '&' : '?';
    url += `limit=${options.limit}`;
  }
  
  if (options.body) {
    fetchOptions.body = JSON.stringify(options.body);
  }
  
  const response = await fetch(url, fetchOptions);
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(`Supabase error: ${JSON.stringify(data)}`);
  }
  
  return data;
}

// Baca file Excel
const excelFile = 'DAFTAR_PEGAWAI_2026-05-08_.xlsx';

console.log(`📖 Membaca file Excel: ${excelFile}`);

const workbook = XLSX.readFile(excelFile);
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];
const data = XLSX.utils.sheet_to_json(worksheet);

console.log(`✅ Total pegawai dalam Excel: ${data.length}`);
console.log(`📋 Sample data:`, data[0]);
console.log();

// Statistik
const stats = {
  total: data.length,
  success: 0,
  notFound: 0,
  noEducation: 0,
  error: 0,
  skipped: 0
};

// Fungsi untuk delay (rate limiting)
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Process each row
console.log('🔄 Memulai update data pendidikan...\n');

async function updatePendidikan() {
  for (let idx = 0; idx < data.length; idx++) {
    const row = data[idx];
    
    try {
      const nip = row['NIP'] ? String(row['NIP']).trim() : null;
      const jenjang = row['Jenjang'] ? String(row['Jenjang']).trim() : null;
      const jurusan = row['Jurusan'] ? String(row['Jurusan']).trim() : null;
      const namaSekolah = row['Nama Sekolah'] ? String(row['Nama Sekolah']).trim() : null;
      
      // Skip jika NIP kosong
      if (!nip || nip === 'undefined') {
        stats.skipped++;
        continue;
      }
      
      // 1. Cari employee berdasarkan NIP
      const employees = await supabaseQuery('employees', 'GET', {
        select: 'id',
        eq: { nip: nip },
        limit: 1
      });
      
      if (!employees || employees.length === 0) {
        stats.notFound++;
        if (idx < 10) {
          console.log(`⚠️  NIP ${nip} tidak ditemukan di database`);
        }
        continue;
      }
      
      const employeeId = employees[0].id;
      
      // 2. Cari education_history terakhir untuk employee ini
      const educations = await supabaseQuery('education_history', 'GET', {
        select: 'id',
        eq: { employee_id: employeeId },
        order: 'graduation_year.desc,created_at.desc',
        limit: 1
      });
      
      if (!educations || educations.length === 0) {
        stats.noEducation++;
        if (idx < 10) {
          console.log(`⚠️  NIP ${nip} tidak memiliki data pendidikan`);
        }
        continue;
      }
      
      const educationId = educations[0].id;
      
      // 3. Update education_history
      const updateData = {};
      if (jenjang) updateData.level = jenjang;
      if (jurusan) updateData.major = jurusan;
      if (namaSekolah) updateData.institution_name = namaSekolah;
      
      if (Object.keys(updateData).length > 0) {
        // Update via PATCH
        const url = `${SUPABASE_URL}/rest/v1/education_history?id=eq.${educationId}`;
        const response = await fetch(url, {
          method: 'PATCH',
          headers: {
            'apikey': SUPABASE_SERVICE_KEY,
            'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
          },
          body: JSON.stringify(updateData)
        });
        
        if (!response.ok) {
          const error = await response.json();
          throw new Error(`Update failed: ${JSON.stringify(error)}`);
        }
        
        stats.success++;
      } else {
        stats.skipped++;
      }
      
      // Progress indicator
      if ((idx + 1) % 100 === 0) {
        console.log(`📊 Progress: ${idx + 1}/${data.length} (${Math.round((idx + 1) / data.length * 100)}%)`);
      }
      
      // Rate limiting - avoid hitting API limits
      if ((idx + 1) % 50 === 0) {
        await delay(500);
      }
      
    } catch (error) {
      stats.error++;
      if (stats.error <= 10) {
        console.error(`❌ Error processing NIP ${row['NIP']}: ${error.message}`);
      }
      continue;
    }
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
updatePendidikan().catch(console.error);
