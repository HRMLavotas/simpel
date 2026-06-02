/**
 * TypeScript Types for Usulan Ujikom (Competency Test Proposals)
 * Created: 2026-06-02
 */

// ============================================
// CORE TYPES
// ============================================

/**
 * Usulan status enum
 * Represents the workflow stages of a usulan ujikom
 */
export type UsulanStatus =
  | 'Draft'                    // Usulan being drafted by Admin Unit
  | 'Waiting_List'             // Waiting for formasi availability
  | 'Diajukan'                 // Submitted and awaiting verification
  | 'Verifikasi_Berkas'        // Admin Pusat verifying documents
  | 'Proses_Ujikom'            // Employee taking competency test
  | 'Lulus_Ujikom'             // Passed competency test
  | 'Tidak_Lulus_Ujikom'       // Failed competency test
  | 'Dibatalkan';              // Cancelled by Admin Unit or Admin Pusat

/**
 * Main Usulan Ujikom interface
 * Represents a competency test proposal for employee promotion
 */
export interface UsulanUjikom {
  id: string;
  
  // References
  employee_id: string;
  position_reference_id: string;
  department_id: string;
  
  // Status and Queue
  status: UsulanStatus;
  queue_position: number | null;
  
  // Documents
  surat_pengantar_url: string | null;
  link_dokumen_persyaratan: string | null;
  
  // Notes and Feedback
  admin_notes: string | null;
  cancellation_reason: string | null;
  feedback_notes: string | null;
  
  // Timestamps
  created_at: string;
  updated_at: string;
  submitted_at: string | null;
  
  // Audit
  created_by: string | null;
  updated_by: string | null;
}

/**
 * Extended Usulan interface with joined data
 * Used for display purposes with related data
 */
export interface UsulanUjikomWithDetails extends UsulanUjikom {
  employee: {
    id: string;
    nip: string | null;
    name: string;
    position_name: string | null;
    rank: string | null;
    rank_group: string | null;
    asn_status: string | null;
    is_active: boolean;
  };
  position_reference: {
    id: string;
    position_name: string;
    position_category: string;
    grade: number | null;
    abk_count: number;
  };
  department: {
    id: string;
    name: string;
  };
  created_by_profile?: {
    id: string;
    full_name: string | null;
  };
  updated_by_profile?: {
    id: string;
    full_name: string | null;
  };
}

/**
 * Status history record interface
 * Tracks all status changes for audit purposes
 */
export interface UsulanStatusHistory {
  id: string;
  usulan_ujikom_id: string;
  previous_status: UsulanStatus | null;
  new_status: UsulanStatus;
  notes: string | null;
  cancellation_reason: string | null;
  feedback_notes: string | null;
  changed_at: string;
  changed_by: string | null;
  changed_by_profile?: {
    id: string;
    full_name: string | null;
    role: string | null;
  };
}

/**
 * Formasi information interface
 * Contains position quota availability data
 */
export interface FormasiInfo {
  position_reference_id: string;
  position_name: string;
  department_id: string;
  total_quota: number;           // Total ABK count
  occupied_count: number;        // Count of Lulus_Ujikom usulan
  available_count: number;       // total_quota - occupied_count
  is_available: boolean;         // available_count > 0
  waiting_list_count: number;    // Count of usulan in Waiting_List
}

/**
 * Waiting list information interface
 * Contains queue position and related waiting usulan
 */
export interface WaitingListInfo {
  usulan_id: string;
  queue_position: number;
  total_waiting: number;
  estimated_wait_message: string;
  other_waiting_usulan: Array<{
    id: string;
    employee_name: string;
    queue_position: number;
    submitted_at: string;
  }>;
}

// ============================================
// FORM DATA TYPES
// ============================================

/**
 * Form data for creating new usulan
 */
export interface UsulanFormData {
  employee_id: string;
  position_reference_id: string;
  department_id: string;
  surat_pengantar_file: File | null;
  link_dokumen_persyaratan?: string;
  admin_notes?: string;
}

/**
 * Form data for updating existing usulan
 */
export interface UsulanUpdateData {
  position_reference_id?: string;
  surat_pengantar_file?: File | null;
  link_dokumen_persyaratan?: string;
  admin_notes?: string;
}

/**
 * Form data for status change by Admin Pusat
 */
export interface StatusChangeData {
  usulan_id: string;
  new_status: UsulanStatus;
  notes?: string;
  cancellation_reason?: string;    // Required when new_status is 'Dibatalkan'
  feedback_notes?: string;         // Optional for 'Tidak_Lulus_Ujikom'
}

/**
 * Form data for cancellation by Admin Unit
 */
export interface CancellationData {
  usulan_id: string;
  cancellation_reason: string;     // Minimum 10 characters
}

// ============================================
// QUERY FILTER TYPES
// ============================================

/**
 * Filter options for usulan list queries
 */
export interface UsulanFilterOptions {
  status?: UsulanStatus | UsulanStatus[];
  department_id?: string;
  position_reference_id?: string;
  employee_name?: string;
  employee_nip?: string;
  submitted_from?: string;         // ISO date string
  submitted_to?: string;           // ISO date string
  sort_by?: 'submitted_at' | 'created_at' | 'employee_name' | 'status';
  sort_order?: 'asc' | 'desc';
  page?: number;
  page_size?: number;
}

/**
 * Paginated response type
 */
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

// ============================================
// STATISTICS TYPES
// ============================================

/**
 * Dashboard statistics for Admin Unit
 */
export interface UsulanStatistics {
  total_usulan: number;
  by_status: Record<UsulanStatus, number>;
  full_positions: Array<{
    position_name: string;
    position_reference_id: string;
    total_quota: number;
    occupied_count: number;
  }>;
  recent_lulus: Array<{
    employee_id: string;
    employee_name: string;
    position_name: string;
    completed_at: string;
  }>;
}

/**
 * Dashboard statistics for Admin Pusat
 */
export interface UsulanPusatStatistics extends UsulanStatistics {
  by_department: Array<{
    department_id: string;
    department_name: string;
    count: number;
    by_status: Record<UsulanStatus, number>;
  }>;
}

// ============================================
// NOTIFICATION TYPES
// ============================================

/**
 * Usulan notification metadata
 */
export interface UsulanNotificationMetadata {
  usulan_id: string;
  employee_name: string;
  position_name: string;
  previous_status: UsulanStatus | null;
  new_status: UsulanStatus;
  cancellation_reason?: string;
  feedback_notes?: string;
}

// ============================================
// API RESPONSE TYPES
// ============================================

/**
 * Standard API response wrapper
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
    details?: unknown;
  };
}

/**
 * File upload response
 */
export interface FileUploadResponse {
  success: boolean;
  file_path?: string;
  public_url?: string;
  error?: string;
}

// ============================================
// HELPER TYPES
// ============================================

/**
 * Valid status transitions map
 * Defines which status can transition to which
 */
export const VALID_STATUS_TRANSITIONS: Record<UsulanStatus, UsulanStatus[]> = {
  Draft: ['Diajukan', 'Waiting_List', 'Dibatalkan'],
  Waiting_List: ['Diajukan', 'Dibatalkan'],
  Diajukan: ['Verifikasi_Berkas', 'Dibatalkan'],
  Verifikasi_Berkas: ['Proses_Ujikom', 'Dibatalkan'],
  Proses_Ujikom: ['Lulus_Ujikom', 'Tidak_Lulus_Ujikom', 'Dibatalkan'],
  Lulus_Ujikom: [],
  Tidak_Lulus_Ujikom: [],
  Dibatalkan: [],
};

/**
 * Status badge color mapping
 */
export const STATUS_BADGE_COLORS: Record<UsulanStatus, string> = {
  Draft: 'gray',
  Waiting_List: 'yellow',
  Diajukan: 'blue',
  Verifikasi_Berkas: 'purple',
  Proses_Ujikom: 'orange',
  Lulus_Ujikom: 'green',
  Tidak_Lulus_Ujikom: 'red',
  Dibatalkan: 'gray',
};

/**
 * Status display labels (Indonesian)
 */
export const STATUS_LABELS: Record<UsulanStatus, string> = {
  Draft: 'Draft',
  Waiting_List: 'Daftar Tunggu',
  Diajukan: 'Diajukan',
  Verifikasi_Berkas: 'Verifikasi Berkas',
  Proses_Ujikom: 'Proses Ujikom',
  Lulus_Ujikom: 'Lulus Ujikom',
  Tidak_Lulus_Ujikom: 'Tidak Lulus',
  Dibatalkan: 'Dibatalkan',
};

/**
 * Allowed file types for document upload
 */
export const ALLOWED_FILE_TYPES = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'] as const;

/**
 * Maximum file size (5MB in bytes)
 */
export const MAX_FILE_SIZE = 5 * 1024 * 1024;

/**
 * Minimum cancellation reason length
 */
export const MIN_CANCELLATION_REASON_LENGTH = 10;
