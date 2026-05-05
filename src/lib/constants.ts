// Master data unit kerja
export const DEPARTMENTS = [
  'Setditjen Binalavotas',
  'Direktorat Bina Stankomproglat',
  'Direktorat Bina Lemlatvok',
  'Direktorat Bina Penyelenggaraan Latvogan',
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
  'BPVP Lombok Timur',
  'BPVP Bantaeng',
  'BPVP Banyuwangi',
  'BPVP Sidoarjo',
  'BPVP Pangkep',
  'BPVP Belitung',
  'Satpel Sawahlunto',
  'Satpel Sofifi',
  'Satpel Pekanbaru',
  'Satpel Lubuklinggau',
  'Satpel Lampung',
  'Satpel Bengkulu',
  'Satpel Mamuju',
  'Satpel Majene',
  'Satpel Palu',
  'Satpel Bantul',
  'Satpel Kupang',
  'Satpel Jambi',
  'Satpel Jayapura',
  'Satpel Kotawaringin Timur',
  'Satpel Bali',
  'Satpel Morowali',
  'Satpel Morowali Utara',
  'Satpel Minahasa Utara',
  'Satpel Halmahera Selatan',
  'Satpel Tanah Bumbu',
  'Satpel Bulungan',
  'Workshop Prabumulih',
  'Workshop Batam',
  'Workshop Gorontalo',
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
  'Balai Pelatihan Vokasi dan Produktivitas Lombok Timur': 'BPVP Lombok Timur',
  'BPVP Lombok Timur': 'BPVP Lombok Timur',
  'BPVP Lotim': 'BPVP Lombok Timur',
  'Balai Pelatihan Vokasi dan Produktivitas Bantaeng': 'BPVP Bantaeng',
  'Balai Pelatihan Vokasi dan Produktivitas Banyuwangi': 'BPVP Banyuwangi',
  'Balai Pelatihan Vokasi dan Produktivitas Sidoarjo': 'BPVP Sidoarjo',
  'Balai Pelatihan Vokasi dan Produktivitas Pangkep': 'BPVP Pangkep',
  'Balai Pelatihan Vokasi dan Produktivitas Belitung': 'BPVP Belitung',
  // Directorate mappings
  'Direktorat Pembinaan Kelembagaan Pelatihan Vokasi': 'Direktorat Bina Lemlatvok',
  'Direktorat Pembinaan Instruktur dan Tenaga Pelatihan': 'Direktorat Bina Intala',
  'Direktorat Pembinaan Standarisasi Kompetensi dan Program Pelatihan': 'Direktorat Bina Stankomproglat',
  'Direktorat Bina Penyelenggaraan Pelatihan Vokasi dan Pemagangan': 'Direktorat Bina Penyelenggaraan Latvogan',
  'Direktorat Bina Penyelenggaraan Latvogan': 'Direktorat Bina Penyelenggaraan Latvogan',
  'Direktorat Bina Lavogan': 'Direktorat Bina Penyelenggaraan Latvogan',
  'Sekretariat Ditjen Binalavotas': 'Setditjen Binalavotas',
  'Sekretariat BNSP': 'Set. BNSP',
  // Satuan Pelayanan (Satpel) mappings
  'Satuan Pelayanan Sawahlunto': 'Satpel Sawahlunto',
  'Satuan Pelayanan Sofifi': 'Satpel Sofifi',
  'Satuan Pelayanan Pekanbaru': 'Satpel Pekanbaru',
  'Satuan Pelayanan Lubuklinggau': 'Satpel Lubuklinggau',
  'Satuan Pelayanan Lampung': 'Satpel Lampung',
  'Satuan Pelayanan Bengkulu': 'Satpel Bengkulu',
  'Satuan Pelayanan Mamuju': 'Satpel Mamuju',
  'Satuan Pelayanan Majene': 'Satpel Majene',
  'Satuan Pelayanan Palu': 'Satpel Palu',
  'Satuan Pelayanan Bantul': 'Satpel Bantul',
  'Satuan Pelayanan Kupang': 'Satpel Kupang',
  'Satuan Pelayanan Jambi': 'Satpel Jambi',
  'Satpel Jayapura': 'Satpel Jayapura',
  'Satuan Pelayanan Jayapura': 'Satpel Jayapura',
};

// ASN Status options
export const ASN_STATUS_OPTIONS = ['PNS', 'CPNS', 'PPPK', 'Non ASN'] as const;
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

// PPPK ranks (only III, V, VII, IX)
export const RANK_GROUPS_PPPK = [
  'III', 'V', 'VII', 'IX',
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

// Instruktur position name prefixes - used to detect if a position is an Instruktur role
export const INSTRUKTUR_POSITION_PREFIXES = [
  'Instruktur Ahli Utama',
  'Instruktur Ahli Madya',
  'Instruktur Ahli Muda',
  'Instruktur Ahli Pertama',
  'Instruktur Penyelia',
  'Instruktur Mahir',
  'Instruktur Terampil',
  'Instruktur Pelaksana',
] as const;

/**
 * Returns true if the given position name is an Instruktur position.
 */
export function isInstrukturPosition(positionName: string | null | undefined): boolean {
  if (!positionName) return false;
  const lower = positionName.toLowerCase();
  return INSTRUKTUR_POSITION_PREFIXES.some(prefix => lower.startsWith(prefix.toLowerCase()));
}

// Kejuruan options for Instruktur
export const KEJURUAN_OPTIONS = [
  'Bahasa',
  'Bahasa Asing',
  'Bahasa Jepang',
  'Bangunan',
  'Bisnis dan Manajemen',
  'Bisnis Manajemen',
  'Elektronika',
  'Fashion Technology',
  'Garmen',
  'Garmen Apparel',
  'Garmen/Fashion Designer',
  'Industri Kreatif',
  'Konstruksi',
  'Las',
  'Listrik',
  'Manufaktur',
  'Mekanisasi Pertanian',
  'Metodologi',
  'Metodologi Pelatihan',
  'Motor Tempel',
  'Otomotif',
  'Pariwisata',
  'Perikanan',
  'Pertanian',
  'Peternakan',
  'PLTS',
  'Processing',
  'Produktivitas',
  'Refrigerasi',
  'Refrigeration',
  'Tata Kecantikan',
  'Tatarias Kecantikan',
  'Teknik Bangunan',
  'Teknik Elektronika',
  'Teknik Las',
  'Teknik Listrik',
  'Teknik Manufaktur',
  'Teknik Mekanik',
  'Teknik Otomotif',
  'Teknik Refrigasi',
  'Teknologi Informasi dan Komunikasi',
  'Teknologi Mekanik',
  'Teknologi Pelatihan',
  'Teknologi Pengolahan Agroindustri',
  'TIK',
  'Underwater Service',
  'Welding',
] as const;

export type Kejuruan = typeof KEJURUAN_OPTIONS[number];

// App roles
export type AppRole = 'admin_unit' | 'admin_pusat' | 'admin_pimpinan';

// Role permissions
export const ROLE_PERMISSIONS = {
  admin_unit: {
    canEdit: true,
    canDelete: true,
    canCreate: true,
    canViewAll: false,
    scope: 'unit', // Only own unit
  },
  admin_pusat: {
    canEdit: true,
    canDelete: true,
    canCreate: true,
    canViewAll: true,
    scope: 'all', // All units
  },
  admin_pimpinan: {
    canEdit: false,
    canDelete: false,
    canCreate: false,
    canViewAll: true,
    scope: 'all', // All units, but read-only
  },
} as const;

// Role labels for UI
export const ROLE_LABELS: Record<AppRole, string> = {
  admin_unit: 'Admin Unit',
  admin_pusat: 'Admin Pusat',
  admin_pimpinan: 'Admin Pimpinan',
};

// Unit Pembina Mapping - Satpel/Workshop dan unit pembinanya
export const UNIT_PEMBINA_MAPPING: Record<string, string> = {
  // BBPVP Serang
  'Satpel Lubuklinggau': 'BBPVP Serang',
  'Satpel Lampung': 'BBPVP Serang',
  'Workshop Prabumulih': 'BBPVP Serang',
  
  // BBPVP Bekasi
  'Satpel Bengkulu': 'BBPVP Bekasi',
  'Satpel Kotawaringin Timur': 'BBPVP Bekasi',
  
  // BBPVP Makassar
  'Satpel Majene': 'BBPVP Makassar',
  'Satpel Mamuju': 'BBPVP Makassar',
  'Satpel Palu': 'BBPVP Makassar',
  'Workshop Gorontalo': 'BBPVP Makassar',
  'Satpel Morowali': 'BBPVP Makassar',
  'Satpel Morowali Utara': 'BBPVP Makassar',
  
  // BBPVP Medan
  'Satpel Pekanbaru': 'BBPVP Medan',
  'Workshop Batam': 'BBPVP Medan',
  
  // BPVP Surakarta
  'Satpel Bantul': 'BPVP Surakarta',
  
  // BPVP Padang
  'Satpel Jambi': 'BPVP Padang',
  'Satpel Sawahlunto': 'BPVP Padang',
  
  // BPVP Lombok Timur
  'Satpel Kupang': 'BPVP Lombok Timur',
  'Satpel Bali': 'BPVP Lombok Timur',
  
  // BPVP Ternate
  'Satpel Sofifi': 'BPVP Ternate',
  'Satpel Minahasa Utara': 'BPVP Ternate',
  'Satpel Halmahera Selatan': 'BPVP Ternate',
  
  // BPVP Sorong
  'Satpel Jayapura': 'BPVP Sorong',
  
  // BPVP Samarinda
  'Satpel Tanah Bumbu': 'BPVP Samarinda',
  'Satpel Bulungan': 'BPVP Samarinda',
};

/**
 * Get unit pembina (parent unit) for a Satpel/Workshop
 * @param department - Department name
 * @returns Unit pembina name or null if not a Satpel/Workshop
 */
export function getUnitPembina(department: string): string | null {
  return UNIT_PEMBINA_MAPPING[department] || null;
}

/**
 * Check if a department is a Satpel or Workshop
 * @param department - Department name
 * @returns true if Satpel or Workshop
 */
export function isSatpelOrWorkshop(department: string): boolean {
  return department.startsWith('Satpel ') || department.startsWith('Workshop ');
}

/**
 * Get all Satpel/Workshop units under a unit pembina
 * @param pembina - Unit pembina name
 * @returns Array of Satpel/Workshop names
 */
export function getSatpelsByPembina(pembina: string): string[] {
  return Object.entries(UNIT_PEMBINA_MAPPING)
    .filter(([_, parent]) => parent === pembina)
    .map(([satpel]) => satpel);
}

/**
 * Get all departments accessible by a user based on their role and department
 * @param userDepartment - User's department
 * @param role - User's role
 * @returns Array of accessible department names
 */
export function getAccessibleDepartments(
  userDepartment: string,
  role: AppRole
): string[] {
  // Admin pusat and pimpinan can access all departments
  if (role === 'admin_pusat' || role === 'admin_pimpinan') {
    return DEPARTMENTS as unknown as string[];
  }
  
  // Admin unit: own department + Satpel/Workshop under their supervision
  const accessible = [userDepartment];
  
  // If this is a unit pembina, add Satpel/Workshop under supervision
  const satpels = getSatpelsByPembina(userDepartment);
  accessible.push(...satpels);
  
  return accessible;
}

/**
 * Check if a user can access a specific department
 * @param userDepartment - User's department
 * @param role - User's role
 * @param targetDepartment - Department to check access for
 * @returns true if user can access the department
 */
export function canAccessDepartment(
  userDepartment: string,
  role: AppRole,
  targetDepartment: string
): boolean {
  const accessible = getAccessibleDepartments(userDepartment, role);
  return accessible.includes(targetDepartment);
}
