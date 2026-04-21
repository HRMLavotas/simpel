import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface AuditIssue {
  type: 'missing_field' | 'invalid_format' | 'incomplete_data';
  field: string;
  message: string;
}

interface AuditEmployee {
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

// Validasi format pangkat
const isValidRankFormat = (rank: string | null): boolean => {
  if (!rank) return false;
  
  const trimmedRank = rank.trim();
  
  // Format 1: Full format with name "Penata Muda Tk I (III/b)", "Pembina (IV/a)", dll
  // Ini harus dicek dulu karena lebih spesifik
  const fullPattern = /\((I{1,4}|IV)\/[a-e]\)$/i;
  if (fullPattern.test(trimmedRank)) return true;
  
  // Format 2: Short format "I/a", "II/b", "III/c", "IV/d", dll (PNS)
  const shortPattern = /^(I{1,4}|IV)\/[a-e]$/i;
  if (shortPattern.test(trimmedRank)) return true;
  
  // Format 3: PPPK format (hanya III, V, VII, IX)
  const pppkPattern = /^(III|V|VII|IX)$/;
  if (pppkPattern.test(trimmedRank)) return true;
  
  // Format 4: "Tidak Ada"
  if (trimmedRank === 'Tidak Ada') return true;
  
  return false;
};

// Validasi format NIP (18 digit)
const isValidNIPFormat = (nip: string | null): boolean => {
  if (!nip) return true; // NIP boleh kosong
  return /^\d{18}$/.test(nip.replace(/\s/g, ''));
};

// Audit satu employee
const auditEmployee = (employee: any): AuditEmployee => {
  const issues: AuditIssue[] = [];

  // Check NIP format
  if (employee.nip && !isValidNIPFormat(employee.nip)) {
    issues.push({
      type: 'invalid_format',
      field: 'nip',
      message: 'Format NIP tidak valid (harus 18 digit)',
    });
  }

  // Check required fields
  if (!employee.gender) {
    issues.push({
      type: 'missing_field',
      field: 'gender',
      message: 'Jenis kelamin belum diisi',
    });
  }

  if (!employee.birth_date) {
    issues.push({
      type: 'missing_field',
      field: 'birth_date',
      message: 'Tanggal lahir belum diisi',
    });
  }

  if (!employee.birth_place) {
    issues.push({
      type: 'missing_field',
      field: 'birth_place',
      message: 'Tempat lahir belum diisi',
    });
  }

  if (!employee.religion) {
    issues.push({
      type: 'missing_field',
      field: 'religion',
      message: 'Agama belum diisi',
    });
  }

  // Check rank_group format
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

  // Check position_name
  if (!employee.position_name) {
    issues.push({
      type: 'missing_field',
      field: 'position_name',
      message: 'Jabatan belum diisi',
    });
  }

  // Check ASN status
  if (!employee.asn_status) {
    issues.push({
      type: 'missing_field',
      field: 'asn_status',
      message: 'Status ASN belum diisi',
    });
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
      let query = supabase
        .from('employees')
        .select('id, nip, name, department, asn_status, rank_group, position_name, gender, birth_date, birth_place, religion');

      // Admin unit hanya bisa lihat data unit mereka
      if (!isAdminPusat && profile?.department) {
        query = query.eq('department', profile.department);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Audit setiap employee dan filter yang punya issues
      const auditedData = (data || [])
        .map(auditEmployee)
        .filter(employee => employee.issues.length > 0);

      return auditedData;
    },
    enabled: !!profile,
  });
}
