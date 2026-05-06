import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://mauyygrbdopmpdpnwzra.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1hdXl5Z3JiZG9wbXBkcG53enJhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDkzMTM4NCwiZXhwIjoyMDkwNTA3Mzg0fQ.qMJoz6Xuy4PKwS-LKWpjf_WM5o0fuNtEE4hsgLjJX4Q";

const supabase = createClient(supabaseUrl, supabaseKey);

function normalizeString(str) {
  return str.trim().toLowerCase();
}

async function auditDataConsistency() {
  console.log('🔍 AUDIT KONSISTENSI DATA: Data Pegawai vs Peta Jabatan\n');
  console.log('='.repeat(80));

  const issues = {
    orphanedEmployees: [],
    mismatchedDepartments: [],
    positionsWithoutEmployees: [],
    positionsWithMismatchedCount: [],
    employeesWithInvalidPositions: []
  };

  // Fetch all data
  console.log('\n📊 Mengambil data dari database...');
  
  const { data: employees, error: empError } = await supabase
    .from('employees')
    .select('id, name, nip, department, position_name, asn_status');

  if (empError) {
    console.error('❌ Error fetching employees:', empError.message);
    return;
  }

  const { data: positions, error: posError } = await supabase
    .from('position_references')
    .select('*');

  if (posError) {
    console.error('❌ Error fetching positions:', posError.message);
    return;
  }

  console.log(`✅ Employees: ${employees.length}`);
  console.log(`✅ Positions: ${positions.length}`);

  // Create lookup maps
  const positionMap = new Map();
  positions.forEach(pos => {
    const key = `${pos.department}|||${normalizeString(pos.position_name)}`;
    if (!positionMap.has(key)) {
      positionMap.set(key, []);
    }
    positionMap.get(key).push(pos);
  });

  console.log('\n' + '='.repeat(80));
  console.log('\n🔍 PEMERIKSAAN 1: Pegawai dengan Jabatan yang Tidak Ada di Peta Jabatan');
  console.log('─'.repeat(80));

  const employeesByPosition = new Map();
  
  employees.forEach(emp => {
    if (!emp.position_name) return;
    
    const key = `${emp.department}|||${normalizeString(emp.position_name)}`;
    
    if (!employeesByPosition.has(key)) {
      employeesByPosition.set(key, []);
    }
    employeesByPosition.get(key).push(emp);

    // Check if position exists in position_references
    if (!positionMap.has(key)) {
      issues.orphanedEmployees.push({
        employee: emp,
        reason: 'Jabatan tidak ada di peta jabatan'
      });
    }
  });

  if (issues.orphanedEmployees.length > 0) {
    console.log(`\n❌ Ditemukan ${issues.orphanedEmployees.length} pegawai dengan jabatan yang tidak ada di peta jabatan:\n`);
    
    // Group by department
    const byDept = {};
    issues.orphanedEmployees.forEach(item => {
      const dept = item.employee.department;
      if (!byDept[dept]) byDept[dept] = [];
      byDept[dept].push(item);
    });

    Object.entries(byDept).forEach(([dept, items]) => {
      console.log(`\n📍 ${dept} (${items.length} pegawai):`);
      
      // Group by position
      const byPos = {};
      items.forEach(item => {
        const pos = item.employee.position_name;
        if (!byPos[pos]) byPos[pos] = [];
        byPos[pos].push(item.employee);
      });

      Object.entries(byPos).forEach(([pos, emps]) => {
        console.log(`   Jabatan: "${pos}" (${emps.length} pegawai)`);
        emps.slice(0, 3).forEach(emp => {
          console.log(`      - ${emp.name} (NIP: ${emp.nip || '-'})`);
        });
        if (emps.length > 3) {
          console.log(`      ... dan ${emps.length - 3} pegawai lainnya`);
        }
      });
    });
  } else {
    console.log('\n✅ Semua pegawai memiliki jabatan yang terdaftar di peta jabatan');
  }

  console.log('\n' + '='.repeat(80));
  console.log('\n🔍 PEMERIKSAAN 2: Jabatan di Peta Jabatan vs Jumlah Pegawai (Existing)');
  console.log('─'.repeat(80));

  positions.forEach(pos => {
    const key = `${pos.department}|||${normalizeString(pos.position_name)}`;
    const emps = employeesByPosition.get(key) || [];
    
    // Filter by ASN status
    const asnEmps = emps.filter(e => !e.asn_status || e.asn_status !== 'Non ASN');
    const nonAsnEmps = emps.filter(e => e.asn_status === 'Non ASN');
    
    const actualCount = asnEmps.length; // For ASN positions
    const expectedABK = pos.abk_count;

    // Check if there's a mismatch (only for positions with ABK > 0)
    if (expectedABK > 0 && actualCount === 0) {
      issues.positionsWithoutEmployees.push({
        position: pos,
        expectedABK,
        actualCount
      });
    }

    // Check for significant mismatch (actual > ABK * 1.5 or actual < ABK * 0.5)
    if (expectedABK > 0 && (actualCount > expectedABK * 1.5 || actualCount < expectedABK * 0.5)) {
      issues.positionsWithMismatchedCount.push({
        position: pos,
        expectedABK,
        actualCount,
        difference: actualCount - expectedABK
      });
    }
  });

  if (issues.positionsWithoutEmployees.length > 0) {
    console.log(`\n⚠️  Ditemukan ${issues.positionsWithoutEmployees.length} jabatan dengan ABK > 0 tapi tidak ada pegawai:\n`);
    
    issues.positionsWithoutEmployees.slice(0, 10).forEach(item => {
      console.log(`   📍 ${item.position.department}`);
      console.log(`      Jabatan: ${item.position.position_name}`);
      console.log(`      ABK: ${item.expectedABK}, Existing: ${item.actualCount}`);
    });
    
    if (issues.positionsWithoutEmployees.length > 10) {
      console.log(`   ... dan ${issues.positionsWithoutEmployees.length - 10} jabatan lainnya`);
    }
  } else {
    console.log('\n✅ Semua jabatan dengan ABK > 0 memiliki pegawai');
  }

  if (issues.positionsWithMismatchedCount.length > 0) {
    console.log(`\n⚠️  Ditemukan ${issues.positionsWithMismatchedCount.length} jabatan dengan perbedaan signifikan antara ABK dan Existing:\n`);
    
    issues.positionsWithMismatchedCount.slice(0, 10).forEach(item => {
      console.log(`   📍 ${item.position.department}`);
      console.log(`      Jabatan: ${item.position.position_name}`);
      console.log(`      ABK: ${item.expectedABK}, Existing: ${item.actualCount}, Selisih: ${item.difference > 0 ? '+' : ''}${item.difference}`);
    });
    
    if (issues.positionsWithMismatchedCount.length > 10) {
      console.log(`   ... dan ${issues.positionsWithMismatchedCount.length - 10} jabatan lainnya`);
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('\n🔍 PEMERIKSAAN 3: Konsistensi Nama Jabatan (Case Sensitivity)');
  console.log('─'.repeat(80));

  const positionNameVariations = new Map();
  
  employees.forEach(emp => {
    if (!emp.position_name) return;
    
    const normalized = normalizeString(emp.position_name);
    if (!positionNameVariations.has(normalized)) {
      positionNameVariations.set(normalized, new Set());
    }
    positionNameVariations.get(normalized).add(emp.position_name);
  });

  const inconsistentNames = [];
  positionNameVariations.forEach((variations, normalized) => {
    if (variations.size > 1) {
      inconsistentNames.push({
        normalized,
        variations: Array.from(variations)
      });
    }
  });

  if (inconsistentNames.length > 0) {
    console.log(`\n⚠️  Ditemukan ${inconsistentNames.length} jabatan dengan variasi kapitalisasi:\n`);
    
    inconsistentNames.slice(0, 10).forEach(item => {
      console.log(`   Variasi untuk "${item.variations[0]}":`);
      item.variations.forEach(v => {
        const count = employees.filter(e => e.position_name === v).length;
        console.log(`      - "${v}" (${count} pegawai)`);
      });
      console.log('');
    });
    
    if (inconsistentNames.length > 10) {
      console.log(`   ... dan ${inconsistentNames.length - 10} jabatan lainnya`);
    }
  } else {
    console.log('\n✅ Tidak ada variasi kapitalisasi pada nama jabatan');
  }

  console.log('\n' + '='.repeat(80));
  console.log('\n📊 RINGKASAN AUDIT');
  console.log('─'.repeat(80));

  const totalIssues = 
    issues.orphanedEmployees.length +
    issues.positionsWithoutEmployees.length +
    issues.positionsWithMismatchedCount.length +
    inconsistentNames.length;

  console.log(`\n1. Pegawai dengan jabatan tidak terdaftar: ${issues.orphanedEmployees.length}`);
  console.log(`2. Jabatan tanpa pegawai (ABK > 0): ${issues.positionsWithoutEmployees.length}`);
  console.log(`3. Jabatan dengan selisih ABK vs Existing: ${issues.positionsWithMismatchedCount.length}`);
  console.log(`4. Jabatan dengan variasi kapitalisasi: ${inconsistentNames.length}`);
  console.log(`\n📊 Total masalah ditemukan: ${totalIssues}`);

  if (totalIssues === 0) {
    console.log('\n✅ SEMPURNA! Data pegawai dan peta jabatan 100% konsisten!');
  } else {
    console.log(`\n⚠️  Ditemukan ${totalIssues} masalah konsistensi yang perlu diperbaiki`);
  }

  // Save detailed report
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      totalEmployees: employees.length,
      totalPositions: positions.length,
      totalIssues,
      orphanedEmployees: issues.orphanedEmployees.length,
      positionsWithoutEmployees: issues.positionsWithoutEmployees.length,
      positionsWithMismatchedCount: issues.positionsWithMismatchedCount.length,
      inconsistentNames: inconsistentNames.length
    },
    details: {
      orphanedEmployees: issues.orphanedEmployees,
      positionsWithoutEmployees: issues.positionsWithoutEmployees,
      positionsWithMismatchedCount: issues.positionsWithMismatchedCount,
      inconsistentNames
    }
  };

  const fs = await import('fs');
  fs.writeFileSync('data_consistency_audit_report.json', JSON.stringify(report, null, 2));
  console.log('\n📄 Laporan detail disimpan ke: data_consistency_audit_report.json');

  console.log('\n' + '='.repeat(80));
}

auditDataConsistency();
