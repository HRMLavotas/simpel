import https from 'https';
import { config } from 'dotenv';

config();

const projectRef = process.env.VITE_SUPABASE_PROJECT_REF || 'mauyygrbdopmpdpnwzra';
const accessToken = process.env.SUPABASE_ACCESS_TOKEN;

if (!accessToken) {
  console.error('❌ SUPABASE_ACCESS_TOKEN not found');
  process.exit(1);
}

function executeSQL(sql) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({ query: sql });
    
    const options = {
      hostname: 'api.supabase.com',
      path: `/v1/projects/${projectRef}/database/query`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(JSON.parse(data));
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

function determineCategory(positionName) {
  const name = positionName.toLowerCase();
  
  // Struktural
  if (name.includes('kepala') || name.includes('direktur') || name.includes('sekretaris')) {
    return 'Struktural';
  }
  
  // Fungsional
  if (name.includes('instruktur') || name.includes('penelaah') || name.includes('analis') ||
      name.includes('perancang') || name.includes('penyuluh') || name.includes('widyaiswara') ||
      name.includes('pranata') || name.includes('arsiparis') || name.includes('pustakawan')) {
    return 'Fungsional';
  }
  
  // Pelaksana
  return 'Pelaksana';
}

function determineGrade(positionName) {
  const name = positionName.toLowerCase();
  
  if (name.includes('utama')) return 12;
  if (name.includes('madya')) return 11;
  if (name.includes('muda')) return 9;
  if (name.includes('pertama')) return 7;
  if (name.includes('mahir')) return 9;
  if (name.includes('terampil')) return 7;
  if (name.includes('ahli')) return 9;
  if (name.includes('penyelia')) return 7;
  if (name.includes('penata')) return 7;
  if (name.includes('pengolah')) return 6;
  if (name.includes('pengadministrasi')) return 5;
  if (name.includes('operator')) return 5;
  if (name.includes('teknisi')) return 7;
  
  return 7; // Default
}

async function main() {
  console.log('🔍 Mencari jabatan yang hilang di position_references...\n');
  
  try {
    // 1. Cari jabatan yang hilang
    const missingQuery = `
      WITH employee_positions AS (
        SELECT DISTINCT 
          e.department,
          e.position_name,
          COUNT(*) as jumlah_pegawai
        FROM employees e
        WHERE e.is_active = true 
          AND e.position_name IS NOT NULL 
          AND e.position_name != ''
          AND (e.asn_status IS NULL OR e.asn_status != 'Non ASN')
        GROUP BY e.department, e.position_name
      ),
      missing_positions AS (
        SELECT 
          ep.department,
          ep.position_name,
          ep.jumlah_pegawai
        FROM employee_positions ep
        LEFT JOIN position_references pr 
          ON ep.department = pr.department 
          AND ep.position_name = pr.position_name
        WHERE pr.id IS NULL
      )
      SELECT 
        department,
        position_name,
        jumlah_pegawai
      FROM missing_positions
      ORDER BY department, position_name;
    `;
    
    const result = await executeSQL(missingQuery);
    const missingPositions = result.result || [];
    
    if (missingPositions.length === 0) {
      console.log('✅ Tidak ada jabatan yang hilang. Semua sudah lengkap!');
      return;
    }
    
    console.log(`📋 Ditemukan ${missingPositions.length} jabatan yang hilang:\n`);
    missingPositions.forEach((pos, idx) => {
      console.log(`${idx + 1}. ${pos.department} - ${pos.position_name} (${pos.jumlah_pegawai} pegawai)`);
    });
    
    console.log('\n🔧 Menambahkan jabatan yang hilang...\n');
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const pos of missingPositions) {
      try {
        const category = determineCategory(pos.position_name);
        const grade = determineGrade(pos.position_name);
        
        // Dapatkan position_order terakhir untuk kategori ini
        const orderQuery = `
          SELECT COALESCE(MAX(position_order), 0) + 1 as next_order
          FROM position_references
          WHERE department = '${pos.department.replace(/'/g, "''")}'
            AND position_category = '${category}';
        `;
        
        const orderResult = await executeSQL(orderQuery);
        const nextOrder = orderResult.result[0].next_order;
        
        // Insert jabatan baru
        const insertQuery = `
          INSERT INTO position_references (department, position_category, position_name, grade, abk_count, position_order)
          VALUES (
            '${pos.department.replace(/'/g, "''")}',
            '${category}',
            '${pos.position_name.replace(/'/g, "''")}',
            ${grade},
            ${pos.jumlah_pegawai},
            ${nextOrder}
          )
          RETURNING id, position_name;
        `;
        
        const insertResult = await executeSQL(insertQuery);
        console.log(`✅ ${pos.department} - ${pos.position_name} (${category}, Grade ${grade}, Order ${nextOrder})`);
        successCount++;
        
      } catch (error) {
        console.error(`❌ Error adding ${pos.department} - ${pos.position_name}:`, error.message);
        errorCount++;
      }
    }
    
    console.log(`\n📊 Ringkasan:`);
    console.log(`   ✅ Berhasil ditambahkan: ${successCount}`);
    console.log(`   ❌ Gagal: ${errorCount}`);
    console.log(`   📝 Total: ${missingPositions.length}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main().then(() => {
  console.log('\n✅ Selesai!');
  process.exit(0);
}).catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
