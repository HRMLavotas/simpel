#!/usr/bin/env node

/**
 * Script untuk update data pegawai dari NIP
 * Mengekstrak tanggal lahir, TMT CPNS, dan jenis kelamin dari NIP 18 digit
 * 
 * Format NIP:
 * - 8 digit pertama: Tanggal lahir (YYYYMMDD)
 * - 6 digit kedua: TMT CPNS (YYYYMM)
 * - 1 digit ketiga: Jenis kelamin (1=Laki-laki, 2=Perempuan)
 * - 3 digit terakhir: Nomor urut
 * 
 * Usage: node update_from_nip.mjs [--dry-run] [--force]
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY harus diset di .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Parse command line arguments
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const isForce = args.includes('--force');

console.log('🔍 Extract dan Update Data dari NIP');
console.log('='.repeat(80));
console.log(`Mode: ${isDryRun ? '🔍 DRY RUN (tidak ada perubahan)' : '✏️  UPDATE MODE'}`);
console.log('='.repeat(80));
console.log('');

/**
 * Extract data dari NIP 18 digit
 */
function extractFromNIP(nip) {
  if (!nip) return null;
  
  const cleanNIP = nip.replace(/\s/g, '');
  if (cleanNIP.length !== 18) return null;
  
  try {
    // Extract tanggal lahir (8 digit pertama: YYYYMMDD)
    const birthYear = parseInt(cleanNIP.substring(0, 4));
    const birthMonth = parseInt(cleanNIP.substring(4, 6));
    const birthDay = parseInt(cleanNIP.substring(6, 8));
    
    // Extract TMT CPNS (6 digit kedua: YYYYMM)
    const tmtYear = parseInt(cleanNIP.substring(8, 12));
    const tmtMonth = parseInt(cleanNIP.substring(12, 14));
    
    // Extract gender (digit ke-15)
    const genderCode = cleanNIP.substring(14, 15);
    
    // Validasi
    const currentYear = new Date().getFullYear();
    
    if (birthYear < 1940 || birthYear > 2010) {
      console.warn(`  ⚠️  Invalid birth year: ${birthYear} (NIP: ${nip})`);
      return null;
    }
    
    if (birthMonth < 1 || birthMonth > 12) {
      console.warn(`  ⚠️  Invalid birth month: ${birthMonth} (NIP: ${nip})`);
      return null;
    }
    
    if (birthDay < 1 || birthDay > 31) {
      console.warn(`  ⚠️  Invalid birth day: ${birthDay} (NIP: ${nip})`);
      return null;
    }
    
    if (tmtYear < 1970 || tmtYear > currentYear) {
      console.warn(`  ⚠️  Invalid TMT year: ${tmtYear} (NIP: ${nip})`);
      return null;
    }
    
    if (tmtMonth < 1 || tmtMonth > 12) {
      console.warn(`  ⚠️  Invalid TMT month: ${tmtMonth} (NIP: ${nip})`);
      return null;
    }
    
    if (genderCode !== '1' && genderCode !== '2') {
      console.warn(`  ⚠️  Invalid gender code: ${genderCode} (NIP: ${nip})`);
      return null;
    }
    
    // Format dates
    const birthDate = `${birthYear}-${birthMonth.toString().padStart(2, '0')}-${birthDay.toString().padStart(2, '0')}`;
    const tmtCpns = `${tmtYear}-${tmtMonth.toString().padStart(2, '0')}-01`;
    const gender = genderCode === '1' ? 'Laki-laki' : 'Perempuan';
    
    // Validate dates
    const birthDateObj = new Date(birthDate);
    const tmtCpnsObj = new Date(tmtCpns);
    
    if (isNaN(birthDateObj.getTime()) || isNaN(tmtCpnsObj.getTime())) {
      console.warn(`  ⚠️  Invalid date format (NIP: ${nip})`);
      return null;
    }
    
    if (birthDateObj >= tmtCpnsObj) {
      console.warn(`  ⚠️  Birth date must be before TMT CPNS (NIP: ${nip})`);
      return null;
    }
    
    return {
      birthDate,
      tmtCpns,
      gender,
    };
  } catch (error) {
    console.error(`  ❌ Error parsing NIP ${nip}:`, error.message);
    return null;
  }
}

/**
 * Main function
 */
async function main() {
  try {
    // Fetch employees dengan NIP 18 digit yang datanya belum lengkap
    console.log('📥 Fetching employees dengan NIP 18 digit...\n');
    
    const { data: employees, error } = await supabase
      .from('employees')
      .select('id, nip, name, birth_date, tmt_cpns, gender')
      .not('nip', 'is', null)
      .or('birth_date.is.null,tmt_cpns.is.null,gender.is.null,gender.eq.');
    
    if (error) throw error;
    
    // Filter hanya NIP 18 digit
    const validEmployees = employees.filter(emp => {
      const cleanNIP = emp.nip?.replace(/\s/g, '');
      return cleanNIP && cleanNIP.length === 18;
    });
    
    console.log(`✅ Found ${validEmployees.length} employees dengan NIP 18 digit yang perlu diupdate\n`);
    
    if (validEmployees.length === 0) {
      console.log('✨ Tidak ada data yang perlu diupdate!');
      return;
    }
    
    // Process each employee
    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;
    
    for (const employee of validEmployees) {
      const extracted = extractFromNIP(employee.nip);
      
      if (!extracted) {
        console.log(`⏭️  SKIP: ${employee.name} (${employee.nip}) - Invalid NIP format`);
        skipCount++;
        continue;
      }
      
      // Determine what needs to be updated
      const updates = {};
      const changes = [];
      
      if (!employee.birth_date) {
        updates.birth_date = extracted.birthDate;
        changes.push(`birth_date: ${extracted.birthDate}`);
      }
      
      if (!employee.tmt_cpns) {
        updates.tmt_cpns = extracted.tmtCpns;
        changes.push(`tmt_cpns: ${extracted.tmtCpns}`);
      }
      
      if (!employee.gender || employee.gender === '') {
        updates.gender = extracted.gender;
        changes.push(`gender: ${extracted.gender}`);
      }
      
      if (Object.keys(updates).length === 0) {
        console.log(`⏭️  SKIP: ${employee.name} - Data sudah lengkap`);
        skipCount++;
        continue;
      }
      
      console.log(`\n📝 ${employee.name} (${employee.nip})`);
      console.log(`   Changes: ${changes.join(', ')}`);
      
      if (isDryRun) {
        console.log(`   🔍 DRY RUN - No changes made`);
        successCount++;
        continue;
      }
      
      // Confirm before update (unless --force)
      if (!isForce && validEmployees.length > 10) {
        // For large batches, ask for confirmation once
        if (successCount === 0) {
          console.log(`\n⚠️  About to update ${validEmployees.length} employees. Use --force to skip confirmations.`);
          console.log(`   Press Ctrl+C to cancel, or wait 3 seconds to continue...\n`);
          await new Promise(resolve => setTimeout(resolve, 3000));
        }
      }
      
      // Update employee
      updates.updated_at = new Date().toISOString();
      
      const { error: updateError } = await supabase
        .from('employees')
        .update(updates)
        .eq('id', employee.id);
      
      if (updateError) {
        console.log(`   ❌ ERROR: ${updateError.message}`);
        errorCount++;
      } else {
        console.log(`   ✅ Updated successfully`);
        successCount++;
      }
    }
    
    // Summary
    console.log('\n' + '='.repeat(80));
    console.log('📊 Summary:');
    console.log(`   ✅ Success: ${successCount}`);
    console.log(`   ⏭️  Skipped: ${skipCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);
    console.log(`   📝 Total: ${validEmployees.length}`);
    console.log('='.repeat(80));
    
    if (isDryRun) {
      console.log('\n💡 Tip: Run without --dry-run to apply changes');
    }
    
  } catch (error) {
    console.error('\n❌ Fatal error:', error.message);
    process.exit(1);
  }
}

// Run
main();
