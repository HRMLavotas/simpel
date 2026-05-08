/**
 * Script untuk update data pendidikan pegawai ke database
 * Membaca dari Excel dan update ke Supabase
 */

import { createClient } from '@supabase/supabase-js';
import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Error: SUPABASE_URL atau SUPABASE_SERVICE_ROLE_KEY tidak ditemukan di .env');
  console.error('   Pastikan file .env ada dan berisi:');
  console.error('   NEXT_PUBLIC_SUPABASE_URL=your_url');
  console.error('   SUPABASE_SERVICE_ROLE_KEY=your_key');
  process.exit(1);
}

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Baca file Excel
const excelFile = 'DAFTAR-PEGAWAI-2026-05-08-.xlsx';

console.log(`📖 Membaca file Excel: ${excelFile}`);

const workbook = XLSX.readFile(excelFile);
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];
const data = XLSX.utils.sheet_to_json(worksheet);

console.log(`✅ Total pegawai dalam Excel: ${data.length}`);
console.log(`📋 Kolom yang tersedia: ${Object.keys(data[0]).join(', ')}\n`);

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
      const { data: employeeData, error: employeeError } = await supabase
        .from('employees')
        .select('id')
        .eq('nip', nip)
        .single();
      
      if (employeeError || !employeeData) {
        stats.notFound++;
        if (idx < 10) {
          console.log(`⚠️  NIP ${nip} tidak ditemukan di database`);
        }
        continue;
      }
      
      const employeeId = employeeData.id;
      
      // 2. Cari education_history terakhir untuk employee ini
      const { data: educationData, error: educationError } = await supabase
        .from('education_history')
        .select('id')
        .eq('employee_id', employeeId)
        .order('graduation_year', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      if (educationError || !educationData) {
        stats.noEducation++;
        if (idx < 10) {
          console.log(`⚠️  NIP ${nip} tidak memiliki data pendidikan`);
        }
        continue;
      }
      
      const educationId = educationData.id;
      
      // 3. Update education_history
      const updateData = {};
      if (jenjang) updateData.level = jenjang;
      if (jurusan) updateData.major = jurusan;
      if (namaSekolah) updateData.institution_name = namaSekolah;
      
      if (Object.keys(updateData).length > 0) {
        const { error: updateError } = await supabase
          .from('education_history')
          .update(updateData)
          .eq('id', educationId);
        
        if (updateError) {
          throw updateError;
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
