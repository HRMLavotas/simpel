const UNIT_KERJA_ORDER = [
  'Setditjen Binalavotas',
  'Direktorat Bina Stankomproglat',
  'Direktorat Bina Lemlatvok',
  'Direktorat Bina Penyelenggaraan Latvogan',
  'Direktorat Bina Intala',
  'Direktorat Bina Peningkatan Produktivitas',
  'Sekretariat BNSP',
  'BBPVP Bekasi',
  'BBPVP Bandung',
  'BBPVP Serang',
  'BBPVP Medan',
  'BBPVP Semarang',
  'BBPVP Makassar',
  'BPVP Surakarta',
  'BPVP Ambon',
  'BPVP Ternate',
  'BPVP Banda Aceh',
  'BPVP Sorong',
  'BPVP Kendari',
  'BPVP Samarinda',
  'BPVP Padang',
  'BPVP Bandung Barat',
  'BPVP Lombok Timur',
  'BPVP Bantaeng',
  'BPVP Banyuwangi',
  'BPVP Sidoarjo',
  'BPVP Pangkep',
  'BPVP Belitung',
];

function sortEmployeesHierarchical(data) {
  const getDeptRank = (dept) => {
    if (typeof dept !== 'string') return 999;
    const idx = UNIT_KERJA_ORDER.indexOf(dept);
    return idx === -1 ? 999 : idx;
  };

  const getPositionRank = (row) => {
    const asnStatus = String(row['asn_status'] || '').trim();
    const posType = String(row['position_type'] || '').trim().toLowerCase();
    
    if (asnStatus === 'Non ASN') return 4;
    
    if (posType.includes('struktural')) return 0;
    if (posType.includes('fungsional')) return 1;
    if (posType.includes('pelaksana')) return 2;
    
    return 3;
  };

  return [...data].sort((a, b) => {
    const rankDeptA = getDeptRank(a['department']);
    const rankDeptB = getDeptRank(b['department']);
    if (rankDeptA !== rankDeptB) return rankDeptA - rankDeptB;

    const rankPosA = getPositionRank(a);
    const rankPosB = getPositionRank(b);
    if (rankPosA !== rankPosB) return rankPosA - rankPosB;

    const nameA = String(a['name'] || '').toLowerCase();
    const nameB = String(b['name'] || '').toLowerCase();
    return nameA.localeCompare(nameB);
  });
}

const mockData = [
  { name: 'Zoe', department: 'BBPVP Bekasi', position_type: 'Jabatan Pelaksana', asn_status: 'PNS' },
  { name: 'Adam', department: 'BBPVP Bekasi', position_type: 'Struktural', asn_status: 'PNS' },
  { name: 'Charlie', department: 'Setditjen Binalavotas', position_type: 'Pelaksana', asn_status: 'Non ASN' },
  { name: 'Bob', department: 'Setditjen Binalavotas', position_type: 'Jabatan Struktural', asn_status: 'PNS' },
  { name: 'David', department: 'Setditjen Binalavotas', position_type: 'Fungsional', asn_status: 'PNS' },
  { name: 'Eve', department: 'Setditjen Binalavotas', position_type: 'pelaksana', asn_status: 'PNS' },
];

const sorted = sortEmployeesHierarchical(mockData);
console.log(JSON.stringify(sorted, null, 2));
