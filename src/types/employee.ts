/**
 * Type definitions for Employee-related data structures
 */

export interface Employee {
  id: string;
  nip: string | null;
  name: string;
  front_title: string | null;
  back_title: string | null;
  birth_place: string | null;
  birth_date: string | null;
  gender: string | null;
  religion: string | null;
  old_position: string | null;
  position_type: string | null;
  position_name: string | null;
  asn_status: string | null;
  rank_group: string | null;
  department: string;
  join_date: string | null;
  tmt_cpns: string | null;
  tmt_pns: string | null;
  tmt_pensiun: string | null;
  keterangan_formasi: string | null;
  keterangan_penempatan: string | null;
  keterangan_penugasan: string | null;
  keterangan_perubahan: string | null;
  import_order: number | null;
  created_at: string;
  updated_at: string;
}

export interface HistoryRowData {
  id: string;
  employee_id?: string;
  tanggal?: string;
  dari_unit?: string;
  ke_unit?: string;
  jabatan?: string;
  jabatan_lama?: string;
  jabatan_baru?: string;
  unit_kerja?: string;
  pangkat_lama?: string;
  pangkat_baru?: string;
  nomor_sk?: string;
  tmt?: string;
  keterangan?: string;
  jenis_uji?: string;
  hasil?: string;
  tanggal_mulai?: string;
  tanggal_selesai?: string;
  nama_diklat?: string;
  penyelenggara?: string;
  sertifikat?: string;
  [key: string]: string | number | null | undefined;
}

export interface EducationData {
  id: string;
  employee_id?: string;
  level: string;
  institution_name: string;
  major: string;
  graduation_year: number | null;
  front_title: string | null;
  back_title: string | null;
}

export interface NoteData {
  id: string;
  employee_id?: string;
  note: string;
  created_at?: string;
}

export interface EmployeeFormData {
  nip?: string;
  name: string;
  front_title?: string;
  back_title?: string;
  birth_place?: string;
  birth_date?: string;
  gender?: string;
  religion?: string;
  position_type?: string;
  position_name?: string;
  asn_status: string;
  rank_group?: string;
  department: string;
  join_date?: string;
  tmt_cpns?: string;
  tmt_pns?: string;
  tmt_pensiun?: string;
}

export interface ImportError {
  row: number;
  error: string;
  data?: Record<string, unknown>;
}

export interface ImportResult {
  success: number;
  failed: number;
  errors: ImportError[];
}
