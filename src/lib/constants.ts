// Master data unit kerja
export const DEPARTMENTS = [
  'Setditjen Binalavotas',
  'Direktorat Bina Stankomproglat',
  'Direktorat Bina Lemlatvok',
  'Direktorat Bina Lavogan',
  'Direktorat Bina Intala',
  'Direktorat Bina Peningkatan Produktivitas',
  'Set. BNSP',
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
  'BPVP Lotim',
  'BPVP Bantaeng',
  'BPVP Banyuwangi',
  'BPVP Sidoarjo',
  'BPVP Pangkep',
  'BPVP Belitung',
  'Pusat',
] as const;

export type Department = typeof DEPARTMENTS[number];

// Department name mapping for import normalization
export const DEPARTMENT_ALIASES: Record<string, Department> = {
  // Full names to short names
  'Balai Besar Pelatihan Vokasi dan Produktivitas Bekasi': 'BBPVP Bekasi',
  'Balai Besar Pelatihan Vokasi dan Produktivitas Bandung': 'BBPVP Bandung',
  'Balai Besar Pelatihan Vokasi dan Produktivitas Serang': 'BBPVP Serang',
  'Balai Besar Pelatihan Vokasi dan Produktivitas Medan': 'BBPVP Medan',
  'Balai Besar Pelatihan Vokasi dan Produktivitas Semarang': 'BBPVP Semarang',
  'Balai Besar Pelatihan Vokasi dan Produktivitas Makassar': 'BBPVP Makassar',
  'Balai Pelatihan Vokasi dan Produktivitas Surakarta': 'BPVP Surakarta',
  'Balai Pelatihan Vokasi dan Produktivitas Ambon': 'BPVP Ambon',
  'Balai Pelatihan Vokasi dan Produktivitas Ternate': 'BPVP Ternate',
  'Balai Pelatihan Vokasi dan Produktivitas Banda Aceh': 'BPVP Banda Aceh',
  'Balai Pelatihan Vokasi dan Produktivitas Sorong': 'BPVP Sorong',
  'Balai Pelatihan Vokasi dan Produktivitas Kendari': 'BPVP Kendari',
  'Balai Pelatihan Vokasi dan Produktivitas Samarinda': 'BPVP Samarinda',
  'Balai Pelatihan Vokasi dan Produktivitas Padang': 'BPVP Padang',
  'Balai Pelatihan Vokasi dan Produktivitas Bandung Barat': 'BPVP Bandung Barat',
  'Balai Pelatihan Vokasi dan Produktivitas Lombok Timur': 'BPVP Lotim',
  'BPVP Lombok Timur': 'BPVP Lotim',
  'Balai Pelatihan Vokasi dan Produktivitas Bantaeng': 'BPVP Bantaeng',
  'Balai Pelatihan Vokasi dan Produktivitas Banyuwangi': 'BPVP Banyuwangi',
  'Balai Pelatihan Vokasi dan Produktivitas Sidoarjo': 'BPVP Sidoarjo',
  'Balai Pelatihan Vokasi dan Produktivitas Pangkep': 'BPVP Pangkep',
  'Balai Pelatihan Vokasi dan Produktivitas Belitung': 'BPVP Belitung',
  // Directorate mappings
  'Direktorat Pembinaan Kelembagaan Pelatihan Vokasi': 'Direktorat Bina Lemlatvok',
  'Direktorat Pembinaan Instruktur dan Tenaga Pelatihan': 'Direktorat Bina Intala',
  'Direktorat Pembinaan Standarisasi Kompetensi dan Program Pelatihan': 'Direktorat Bina Stankomproglat',
  'Direktorat Bina Penyelenggaraan Pelatihan Vokasi dan Pemagangan': 'Direktorat Bina Lavogan',
  'Sekretariat Ditjen Binalavotas': 'Setditjen Binalavotas',
  'Sekretariat BNSP': 'Set. BNSP',
};

// ASN Status options
export const ASN_STATUS_OPTIONS = ['PNS', 'PPPK', 'Non ASN'] as const;
export type AsnStatus = typeof ASN_STATUS_OPTIONS[number];

// Gender options
export const GENDER_OPTIONS = ['Laki-laki', 'Perempuan'] as const;
export type Gender = typeof GENDER_OPTIONS[number];

// Religion options
export const RELIGION_OPTIONS = ['Islam', 'Kristen', 'Katolik', 'Hindu', 'Buddha', 'Konghucu'] as const;
export type Religion = typeof RELIGION_OPTIONS[number];

// Education levels
export const EDUCATION_LEVELS = ['SD', 'SMP', 'SMA/SMK', 'D1', 'D2', 'D3', 'D4', 'S1', 'S2', 'S3'] as const;
export type EducationLevel = typeof EDUCATION_LEVELS[number];

// Position types
export const POSITION_TYPES = ['Struktural', 'Fungsional', 'Pelaksana'] as const;
export type PositionType = typeof POSITION_TYPES[number];

// Position type mapping for import normalization
export const POSITION_TYPE_ALIASES: Record<string, PositionType> = {
  'Jabatan Struktural': 'Struktural',
  'Jabatan Fungsional': 'Fungsional',
  'Jabatan Pelaksana': 'Pelaksana',
};

// Complete rank/group with full name format
export const RANK_GROUPS_PNS = [
  'Juru Muda (I/a)',
  'Juru Muda Tk I (I/b)',
  'Juru (I/c)',
  'Juru Tk I (I/d)',
  'Pengatur Muda (II/a)',
  'Pengatur Muda Tk I (II/b)',
  'Pengatur (II/c)',
  'Pengatur Tk I (II/d)',
  'Penata Muda (III/a)',
  'Penata Muda Tk I (III/b)',
  'Penata (III/c)',
  'Penata Tk I (III/d)',
  'Pembina (IV/a)',
  'Pembina Tk I (IV/b)',
  'Pembina Muda (IV/c)',
  'Pembina Madya (IV/d)',
  'Pembina Utama (IV/e)',
] as const;

// PPPK ranks (I - XVII)
export const RANK_GROUPS_PPPK = [
  'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 
  'X', 'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI', 'XVII',
] as const;

// Combined rank groups for all (PNS full format + PPPK)
export const RANK_GROUPS = [
  ...RANK_GROUPS_PNS,
  ...RANK_GROUPS_PPPK,
  'Tidak Ada',
] as const;
export type RankGroup = typeof RANK_GROUPS[number];

// Rank group mapping for import normalization (short to full format)
export const RANK_GROUP_ALIASES: Record<string, string> = {
  // Short format to full format
  'I/a': 'Juru Muda (I/a)',
  'I/b': 'Juru Muda Tk I (I/b)',
  'I/c': 'Juru (I/c)',
  'I/d': 'Juru Tk I (I/d)',
  'II/a': 'Pengatur Muda (II/a)',
  'II/b': 'Pengatur Muda Tk I (II/b)',
  'II/c': 'Pengatur (II/c)',
  'II/d': 'Pengatur Tk I (II/d)',
  'III/a': 'Penata Muda (III/a)',
  'III/b': 'Penata Muda Tk I (III/b)',
  'III/c': 'Penata (III/c)',
  'III/d': 'Penata Tk I (III/d)',
  'IV/a': 'Pembina (IV/a)',
  'IV/b': 'Pembina Tk I (IV/b)',
  'IV/c': 'Pembina Muda (IV/c)',
  'IV/d': 'Pembina Madya (IV/d)',
  'IV/e': 'Pembina Utama (IV/e)',
};

// Helper function to normalize imported data
export function normalizeImportValue<T extends string>(
  value: string, 
  aliases: Record<string, T>, 
  validValues: readonly T[]
): string {
  const trimmed = value.trim();
  
  // Check if already a valid value
  if ((validValues as readonly string[]).includes(trimmed)) {
    return trimmed;
  }
  
  // Check aliases
  if (aliases[trimmed]) {
    return aliases[trimmed];
  }
  
  // Return original if no match found
  return trimmed;
}

// App roles
export type AppRole = 'admin_unit' | 'admin_pusat';
