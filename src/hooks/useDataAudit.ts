import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { getAccessibleDepartments } from '@/lib/constants';

export interface AuditIssue {
  type: 'missing_field' | 'invalid_format' | 'incomplete_data';
  field: string;
  message: string;
}

export interface AuditEmployee {
  id: string;
  nip: string | null;
  name: string;
  department: string;
  asn_status: string | null;
  rank_group: string | null;
  position_name: string | null;
  gender: string | null;
  birth_date: string | null;
  birth_place: string | null;
  religion: string | null;
  issues: AuditIssue[];
}

// Tipe untuk raw data dari Supabase query
interface RawEmployeeAuditData {
  id: string;
  nip: string | null;
  name: string;
  department: string;
  asn_status: string | null;
  rank_group: string | null;
  position_name: string | null;
  gender: string | null;
  birth_date: string | null;
  birth_place: string | null;
  religion: string | null;
  position_history?: { tanggal: string | null; jabatan_baru: string | null; nomor_sk: string | null }[];
  mutation_history?: { tanggal: string | null; ke_unit: string | null; nomor_sk: string | null }[];
  education_history?: { level: string; graduation_year: number | null; institution_name: string | null }[];
  rank_history?: { tanggal: string | null; pangkat_baru: string | null; nomor_sk: string | null }[];
}

const ASN_STATUSES = ['PNS', 'CPNS', 'PPPK'] as const;
const isASN = (status: string | null): boolean =>
  ASN_STATUSES.includes(status as typeof ASN_STATUSES[number]);
const isNonASN = (status: string | null): boolean => status === 'Non ASN';

// Validasi format pangkat golongan — hanya berlaku untuk ASN
const isValidRankFormat = (rank: string | null): boolean => {
  if (!rank) return false;

  const trimmedRank = rank.trim();

  // Format 1: Full format "Penata Muda Tk I (III/b)", "Pembina (IV/a)", dll
  const fullPattern = /\((I{1,4}|IV)\/[a-e]\)$/i;
  if (fullPattern.test(trimmedRank)) return true;

  // Format 2: Short format "I/a", "II/b", "III/c", "IV/d", dll (PNS/CPNS)
  const shortPattern = /^(I{1,4}|IV)\/[a-e]$/i;
  if (shortPattern.test(trimmedRank)) return true;

  // Format 3: PPPK format (III, V, VII, IX)
  const pppkPattern = /^(III|V|VII|IX)$/;
  if (pppkPattern.test(trimmedRank)) return true;

  // Format 4: "Tidak Ada"
  if (trimmedRank === 'Tidak Ada') return true;

  return false;
};

// Validasi format NIP ASN (18 digit angka)
const isValidNIPFormat = (nip: string | null): boolean => {
  if (!nip) return true; // boleh kosong
  return /^\d{18}$/.test(nip.replace(/\s/g, ''));
};

// ── Audit untuk pegawai ASN (PNS / CPNS / PPPK) ─────────────────────────────
const auditASNEmployee = (employee: RawEmployeeAuditData): AuditIssue[] => {
  const issues: AuditIssue[] = [];

  // NIP wajib ada dan harus 18 digit
  if (!employee.nip) {
    issues.push({
      type: 'missing_field',
      field: 'nip',
      message: 'NIP belum diisi',
    });
  } else if (!isValidNIPFormat(employee.nip)) {
    issues.push({
      type: 'invalid_format',
      field: 'nip',
      message: 'Format NIP tidak valid (harus 18 digit angka)',
    });
  }

  if (!employee.gender) {
    issues.push({ type: 'missing_field', field: 'gender', message: 'Jenis kelamin belum diisi' });
  }
  if (!employee.birth_date) {
    issues.push({ type: 'missing_field', field: 'birth_date', message: 'Tanggal lahir belum diisi' });
  }
  if (!employee.birth_place) {
    issues.push({ type: 'missing_field', field: 'birth_place', message: 'Tempat lahir belum diisi' });
  }
  if (!employee.religion) {
    issues.push({ type: 'missing_field', field: 'religion', message: 'Agama belum diisi' });
  }

  // Pangkat/Golongan wajib ada dan harus format yang valid
  if (!employee.rank_group) {
    issues.push({
      type: 'missing_field',
      field: 'rank_group',
      message: 'Pangkat/Golongan belum diisi',
    });
  } else if (!isValidRankFormat(employee.rank_group)) {
    issues.push({
      type: 'invalid_format',
      field: 'rank_group',
      message: `Format pangkat tidak valid: "${employee.rank_group}"`,
    });
  }

  if (!employee.position_name) {
    issues.push({ type: 'missing_field', field: 'position_name', message: 'Jabatan belum diisi' });
  }

  // Cek Riwayat Jabatan
  if (employee.position_history && employee.position_history.length > 0) {
    employee.position_history.forEach((ph, i) => {
      if (!ph.tanggal || !ph.nomor_sk || !ph.jabatan_baru) {
        issues.push({
          type: 'incomplete_data',
          field: 'position_history',
          message: `Riwayat Jabatan #${i + 1} tidak lengkap (Tanggal/No SK/Jabatan kosong)`,
        });
      }
    });
  }

  // Cek Riwayat Mutasi
  if (employee.mutation_history && employee.mutation_history.length > 0) {
    employee.mutation_history.forEach((mh, i) => {
      if (!mh.tanggal || !mh.nomor_sk || !mh.ke_unit) {
        issues.push({
          type: 'incomplete_data',
          field: 'mutation_history',
          message: `Riwayat Mutasi #${i + 1} tidak lengkap (Tanggal/No SK/Unit kosong)`,
        });
      }
    });
  }

  // Cek Riwayat Pangkat
  if (employee.rank_history && employee.rank_history.length > 0) {
    employee.rank_history.forEach((rh, i) => {
      if (!rh.tanggal || !rh.nomor_sk || !rh.pangkat_baru) {
        issues.push({
          type: 'incomplete_data',
          field: 'rank_history',
          message: `Riwayat Pangkat #${i + 1} tidak lengkap (Tanggal/No SK/Pangkat kosong)`,
        });
      }
    });
  }

  // Cek Riwayat Pendidikan
  if (employee.education_history && employee.education_history.length > 0) {
    employee.education_history.forEach((eh, i) => {
      if (!eh.institution_name || !eh.graduation_year) {
        issues.push({
          type: 'incomplete_data',
          field: 'education_history',
          message: `Riwayat Pendidikan ${eh.level} tidak lengkap (Nama Institusi/Tahun Lulus kosong)`,
        });
      }
    });
  }

  return issues;
};

// ── Audit untuk pegawai Non ASN ───────────────────────────────────────────────
// Non ASN tidak memiliki NIP (hanya NIK opsional) dan tidak memiliki pangkat golongan.
// Field yang diperiksa hanya yang relevan untuk Non ASN.
const auditNonASNEmployee = (employee: RawEmployeeAuditData): AuditIssue[] => {
  const issues: AuditIssue[] = [];

  // NIK (disimpan di field nip) — opsional, tapi jika diisi tidak boleh kosong semua spasi
  // Tidak ada validasi format ketat untuk NIK Non ASN

  if (!employee.gender) {
    issues.push({ type: 'missing_field', field: 'gender', message: 'Jenis kelamin belum diisi' });
  }

  // rank_group untuk Non ASN berisi tipe tenaga (mis. "Tenaga Alih Daya") — wajib diisi
  if (!employee.rank_group) {
    issues.push({
      type: 'missing_field',
      field: 'rank_group',
      message: 'Tipe tenaga Non ASN belum diisi (contoh: Tenaga Alih Daya)',
    });
  }
  // Tidak ada validasi format pangkat untuk Non ASN — nilai apapun dianggap valid

  if (!employee.position_name) {
    issues.push({ type: 'missing_field', field: 'position_name', message: 'Jabatan belum diisi' });
  }

  // Cek Riwayat Pendidikan (Non ASN juga bisa punya riwayat pendidikan)
  if (employee.education_history && employee.education_history.length > 0) {
    employee.education_history.forEach((eh, i) => {
      if (!eh.institution_name || !eh.graduation_year) {
        issues.push({
          type: 'incomplete_data',
          field: 'education_history',
          message: `Riwayat Pendidikan ${eh.level} tidak lengkap (Nama Institusi/Tahun Lulus kosong)`,
        });
      }
    });
  }

  // Cek Riwayat Jabatan Non ASN
  if (employee.position_history && employee.position_history.length > 0) {
    employee.position_history.forEach((ph, i) => {
      if (!ph.tanggal || !ph.nomor_sk || !ph.jabatan_baru) {
        issues.push({
          type: 'incomplete_data',
          field: 'position_history',
          message: `Riwayat Jabatan #${i + 1} tidak lengkap (Tanggal/No SK/Jabatan kosong)`,
        });
      }
    });
  }

  return issues;
};

// ── Audit untuk pegawai dengan status tidak diketahui / belum diisi ───────────
const auditUnknownStatusEmployee = (employee: RawEmployeeAuditData): AuditIssue[] => {
  const issues: AuditIssue[] = [];

  issues.push({
    type: 'missing_field',
    field: 'asn_status',
    message: 'Status ASN belum diisi',
  });

  if (!employee.gender) {
    issues.push({ type: 'missing_field', field: 'gender', message: 'Jenis kelamin belum diisi' });
  }
  if (!employee.position_name) {
    issues.push({ type: 'missing_field', field: 'position_name', message: 'Jabatan belum diisi' });
  }

  return issues;
};

export interface AuditDepartmentIssue {
  type: 'missing_sarpras' | 'missing_prasarana' | 'missing_sarana' | 'missing_kejuruan';
  field: string;
  message: string;
}

export interface AuditDepartment {
  id: string;
  name: string;
  issues: AuditDepartmentIssue[];
  sarpras: string | null;
}

// Entry point audit per pegawai
const auditEmployee = (employee: RawEmployeeAuditData): AuditEmployee => {
  let issues: AuditIssue[];

  if (isASN(employee.asn_status)) {
    issues = auditASNEmployee(employee);
  } else if (isNonASN(employee.asn_status)) {
    issues = auditNonASNEmployee(employee);
  } else {
    // Status kosong atau tidak dikenal
    issues = auditUnknownStatusEmployee(employee);
  }

  return {
    id: employee.id,
    nip: employee.nip,
    name: employee.name,
    department: employee.department,
    asn_status: employee.asn_status,
    rank_group: employee.rank_group,
    position_name: employee.position_name,
    gender: employee.gender,
    birth_date: employee.birth_date,
    birth_place: employee.birth_place,
    religion: employee.religion,
    issues,
  };
};

export function useDataAudit() {
  const { profile, isAdminPusat } = useAuth();

  return useQuery({
    queryKey: ['data-audit', profile?.department],
    queryFn: async () => {
      // 1. Audit Employees
      let employeeQuery = supabase
        .from('employees')
        .select(`
          id, nip, name, department, asn_status, rank_group, position_name, gender, birth_date, birth_place, religion,
          position_history(tanggal, jabatan_baru, nomor_sk),
          mutation_history(tanggal, ke_unit, nomor_sk),
          education_history(level, graduation_year, institution_name),
          rank_history(tanggal, pangkat_baru, nomor_sk)
        `);

      if (!isAdminPusat && profile?.department && profile?.app_role) {
        const accessible = getAccessibleDepartments(profile.department, profile.app_role);
        employeeQuery = employeeQuery.in('department', accessible);
      }

      const { data: employeeData, error: employeeError } = await employeeQuery;
      if (employeeError) throw employeeError;

      const totalEmployees = (employeeData || []).length;
      const auditedData = (employeeData || [])
        .map(auditEmployee)
        .filter(employee => employee.issues.length > 0);

      // 2. Audit Departments (Unit Kerja)
      let deptQuery = supabase
        .from('departments')
        .select('id, name, sarpras');

      if (!isAdminPusat && profile?.department && profile?.app_role) {
        const accessible = getAccessibleDepartments(profile.department, profile.app_role);
        deptQuery = deptQuery.in('name', accessible);
      }

      const { data: deptData, error: deptError } = await deptQuery;
      if (deptError) throw deptError;

      const totalDepartments = (deptData || []).length;
      const auditedDepartments: AuditDepartment[] = (deptData || [])
        .map(dept => {
          const issues: AuditDepartmentIssue[] = [];
          
          let prasarana: string[] = [];
          let sarana: string[] = [];
          let kejuruan: string[] = [];
          
          if (!dept.sarpras) {
            issues.push({
              type: 'missing_prasarana',
              field: 'prasarana',
              message: 'Prasarana (Bangunan) belum diisi'
            });
            issues.push({
              type: 'missing_sarana',
              field: 'sarana',
              message: 'Sarana (Alat Praktik) belum diisi'
            });
            issues.push({
              type: 'missing_kejuruan',
              field: 'kejuruan',
              message: 'Kejuruan Pelatihan belum diisi'
            });
          } else {
            try {
              const parsed = JSON.parse(dept.sarpras);
              prasarana = parsed.prasarana || parsed.bangunan || [];
              sarana = parsed.sarana || parsed.alat || [];
              kejuruan = parsed.kejuruan || parsed.fasilitas || [];
              
              if (!Array.isArray(prasarana) || prasarana.length === 0) {
                issues.push({
                  type: 'missing_prasarana',
                  field: 'prasarana',
                  message: 'Prasarana (Bangunan) belum diisi'
                });
              }
              if (!Array.isArray(sarana) || sarana.length === 0) {
                issues.push({
                  type: 'missing_sarana',
                  field: 'sarana',
                  message: 'Sarana (Alat Praktik) belum diisi'
                });
              }
              if (!Array.isArray(kejuruan) || kejuruan.length === 0) {
                issues.push({
                  type: 'missing_kejuruan',
                  field: 'kejuruan',
                  message: 'Kejuruan Pelatihan belum diisi'
                });
              }
            } catch {
              issues.push({
                type: 'missing_sarpras',
                field: 'sarpras',
                message: 'Format profil sarpras rusak / tidak valid'
              });
            }
          }
          
          return {
            id: dept.id,
            name: dept.name,
            issues,
            sarpras: dept.sarpras
          };
        })
        .filter(dept => dept.issues.length > 0);

      return { 
        auditedData, 
        totalEmployees,
        auditedDepartments,
        totalDepartments
      };
    },
    enabled: !!profile,
  });
}
