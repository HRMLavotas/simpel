/**
 * Zod Validation Schemas for Usulan Ujikom
 * Created: 2026-06-02
 */

import { z } from 'zod';
import {
  ALLOWED_FILE_TYPES,
  MAX_FILE_SIZE,
  MIN_CANCELLATION_REASON_LENGTH,
  VALID_STATUS_TRANSITIONS,
  type UsulanStatus,
} from './types';

// ============================================
// FIELD VALIDATORS
// ============================================

/**
 * UUID validation
 */
const uuidSchema = z.string().uuid('ID harus berupa UUID yang valid');

/**
 * URL validation
 */
const urlSchema = z
  .string()
  .url('Link harus berupa URL yang valid')
  .min(1, 'Link dokumen persyaratan wajib diisi');

/**
 * File validation helper
 */
const validateFile = (file: unknown) => {
  if (!(file instanceof File)) {
    return false;
  }

  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return false;
  }

  // Check file type
  if (!ALLOWED_FILE_TYPES.includes(file.type as any)) {
    return false;
  }

  return true;
};

/**
 * File schema with size and type validation
 */
const fileSchema = z
  .custom<File>((file) => file instanceof File, {
    message: 'File wajib diunggah',
  })
  .refine((file) => file.size <= MAX_FILE_SIZE, {
    message: `Ukuran file maksimal ${MAX_FILE_SIZE / (1024 * 1024)}MB`,
  })
  .refine(
    (file) => ALLOWED_FILE_TYPES.includes(file.type as any),
    {
      message: 'Format file harus PDF, JPG, atau PNG',
    }
  );

/**
 * Optional file schema (for updates)
 */
const optionalFileSchema = z
  .custom<File>((file) => file === null || file === undefined || file instanceof File)
  .refine(
    (file) => !file || file.size <= MAX_FILE_SIZE,
    {
      message: `Ukuran file maksimal ${MAX_FILE_SIZE / (1024 * 1024)}MB`,
    }
  )
  .refine(
    (file) => !file || ALLOWED_FILE_TYPES.includes(file.type as any),
    {
      message: 'Format file harus PDF, JPG, atau PNG',
    }
  )
  .optional()
  .nullable();

/**
 * Status enum validation
 */
const statusSchema = z.enum([
  'Draft',
  'Waiting_List',
  'Diajukan',
  'Verifikasi_Berkas',
  'Proses_Ujikom',
  'Lulus_Ujikom',
  'Tidak_Lulus_Ujikom',
  'Dibatalkan',
] as const, {
  errorMap: () => ({ message: 'Status tidak valid' }),
});

// ============================================
// FORM VALIDATION SCHEMAS
// ============================================

/**
 * Schema for creating new usulan
 * Used in UsulanForm component
 */
export const usulanFormSchema = z.object({
  employee_id: uuidSchema,
  position_reference_id: uuidSchema,
  department_id: uuidSchema,
  surat_pengantar_file: fileSchema,
  link_dokumen_persyaratan: urlSchema,
  admin_notes: z.string().optional(),
});

export type UsulanFormValues = z.infer<typeof usulanFormSchema>;

/**
 * Schema for updating existing usulan
 * All fields are optional
 */
export const usulanUpdateSchema = z.object({
  position_reference_id: uuidSchema.optional(),
  surat_pengantar_file: optionalFileSchema,
  link_dokumen_persyaratan: urlSchema.optional(),
  admin_notes: z.string().optional(),
});

export type UsulanUpdateValues = z.infer<typeof usulanUpdateSchema>;

/**
 * Schema for draft usulan (partial validation)
 * Allows saving incomplete data
 */
export const usulanDraftSchema = z.object({
  employee_id: uuidSchema.optional(),
  position_reference_id: uuidSchema.optional(),
  department_id: uuidSchema,
  surat_pengantar_file: optionalFileSchema,
  link_dokumen_persyaratan: z.string().url().optional().or(z.literal('')),
  admin_notes: z.string().optional(),
});

export type UsulanDraftValues = z.infer<typeof usulanDraftSchema>;

// ============================================
// STATUS CHANGE VALIDATION SCHEMAS
// ============================================

/**
 * Schema for status change by Admin Pusat
 * Validates status transitions and required fields
 */
export const statusChangeSchema = z
  .object({
    usulan_id: uuidSchema,
    new_status: statusSchema,
    notes: z.string().optional(),
    cancellation_reason: z.string().optional(),
    feedback_notes: z.string().optional(),
  })
  .refine(
    (data) => {
      // If status is Dibatalkan, cancellation_reason is required
      if (data.new_status === 'Dibatalkan') {
        return (
          !!data.cancellation_reason &&
          data.cancellation_reason.trim().length >= MIN_CANCELLATION_REASON_LENGTH
        );
      }
      return true;
    },
    {
      message: `Alasan pembatalan wajib diisi minimal ${MIN_CANCELLATION_REASON_LENGTH} karakter`,
      path: ['cancellation_reason'],
    }
  );

export type StatusChangeValues = z.infer<typeof statusChangeSchema>;

/**
 * Schema for validating status transition
 * Checks if transition is allowed according to workflow
 */
export const statusTransitionSchema = z
  .object({
    current_status: statusSchema,
    new_status: statusSchema,
  })
  .refine(
    (data) => {
      const allowedTransitions = VALID_STATUS_TRANSITIONS[data.current_status];
      return allowedTransitions.includes(data.new_status);
    },
    (data) => ({
      message: `Perubahan status dari ${data.current_status} ke ${data.new_status} tidak diizinkan`,
      path: ['new_status'],
    })
  );

/**
 * Schema for cancellation by Admin Unit or Admin Pusat
 */
export const cancellationSchema = z.object({
  usulan_id: uuidSchema,
  cancellation_reason: z
    .string()
    .min(
      MIN_CANCELLATION_REASON_LENGTH,
      `Alasan pembatalan minimal ${MIN_CANCELLATION_REASON_LENGTH} karakter`
    )
    .max(500, 'Alasan pembatalan maksimal 500 karakter'),
});

export type CancellationValues = z.infer<typeof cancellationSchema>;

/**
 * Schema for feedback/notes when marking as Tidak_Lulus_Ujikom
 */
export const feedbackSchema = z.object({
  usulan_id: uuidSchema,
  feedback_notes: z
    .string()
    .min(10, 'Catatan feedback minimal 10 karakter')
    .max(1000, 'Catatan feedback maksimal 1000 karakter')
    .optional(),
  notes: z.string().optional(),
});

export type FeedbackValues = z.infer<typeof feedbackSchema>;

// ============================================
// QUERY FILTER VALIDATION SCHEMAS
// ============================================

/**
 * Schema for filter options
 */
export const usulanFilterSchema = z.object({
  status: z.union([statusSchema, z.array(statusSchema)]).optional(),
  department_id: uuidSchema.optional(),
  position_reference_id: uuidSchema.optional(),
  employee_name: z.string().optional(),
  employee_nip: z.string().optional(),
  submitted_from: z.string().datetime().optional(),
  submitted_to: z.string().datetime().optional(),
  sort_by: z.enum(['submitted_at', 'created_at', 'employee_name', 'status']).optional(),
  sort_order: z.enum(['asc', 'desc']).optional(),
  page: z.number().int().positive().optional(),
  page_size: z.number().int().positive().max(100).optional(),
});

export type UsulanFilterValues = z.infer<typeof usulanFilterSchema>;

// ============================================
// BUSINESS LOGIC VALIDATION
// ============================================

/**
 * Validate that employee doesn't have active usulan for same position
 * This should be called before creating a new usulan
 */
export const validateNoActiveUsulan = (
  existingUsulan: Array<{ status: UsulanStatus; position_reference_id: string }>,
  newPositionReferenceId: string
): { valid: boolean; error?: string } => {
  const activeStatuses: UsulanStatus[] = [
    'Draft',
    'Waiting_List',
    'Diajukan',
    'Verifikasi_Berkas',
    'Proses_Ujikom',
  ];

  const hasActiveUsulan = existingUsulan.some(
    (usulan) =>
      usulan.position_reference_id === newPositionReferenceId &&
      activeStatuses.includes(usulan.status)
  );

  if (hasActiveUsulan) {
    return {
      valid: false,
      error: 'Pegawai sudah memiliki usulan aktif untuk jabatan yang sama',
    };
  }

  return { valid: true };
};

/**
 * Validate employee eligibility
 */
export const validateEmployeeEligibility = (employee: {
  asn_status: string | null;
  is_active: boolean;
}): { valid: boolean; error?: string } => {
  if (!employee.asn_status) {
    return {
      valid: false,
      error: 'Pegawai harus memiliki status ASN',
    };
  }

  if (!employee.is_active) {
    return {
      valid: false,
      error: 'Hanya pegawai aktif yang dapat diusulkan',
    };
  }

  return { valid: true };
};

/**
 * Validate formasi availability
 * Returns whether usulan should be Diajukan or Waiting_List
 */
export const validateFormasiAvailability = (formasiInfo: {
  total_quota: number;
  occupied_count: number;
}): {
  available: boolean;
  suggested_status: 'Diajukan' | 'Waiting_List';
  message: string;
} => {
  const availableCount = formasiInfo.total_quota - formasiInfo.occupied_count;

  if (availableCount > 0) {
    return {
      available: true,
      suggested_status: 'Diajukan',
      message: `Formasi tersedia: ${availableCount} dari ${formasiInfo.total_quota}`,
    };
  }

  return {
    available: false,
    suggested_status: 'Waiting_List',
    message: `Formasi penuh (${formasiInfo.total_quota}/${formasiInfo.total_quota}). Usulan akan masuk daftar tunggu.`,
  };
};

/**
 * Validate that user can edit usulan based on status
 */
export const validateCanEdit = (
  status: UsulanStatus,
  userRole: 'admin_unit' | 'admin_pusat'
): { canEdit: boolean; reason?: string } => {
  if (userRole === 'admin_pusat') {
    return { canEdit: true };
  }

  // Admin Unit can only edit Draft and Waiting_List
  const editableStatuses: UsulanStatus[] = ['Draft', 'Waiting_List'];

  if (!editableStatuses.includes(status)) {
    return {
      canEdit: false,
      reason: `Usulan dengan status ${status} tidak dapat diedit`,
    };
  }

  return { canEdit: true };
};

/**
 * Validate that user can cancel usulan based on status
 */
export const validateCanCancel = (
  status: UsulanStatus,
  userRole: 'admin_unit' | 'admin_pusat'
): { canCancel: boolean; reason?: string } => {
  if (userRole === 'admin_pusat') {
    // Admin Pusat can cancel any non-final status
    const finalStatuses: UsulanStatus[] = ['Lulus_Ujikom', 'Tidak_Lulus_Ujikom', 'Dibatalkan'];
    if (finalStatuses.includes(status)) {
      return {
        canCancel: false,
        reason: `Usulan dengan status ${status} tidak dapat dibatalkan`,
      };
    }
    return { canCancel: true };
  }

  // Admin Unit can cancel Draft, Waiting_List, Diajukan
  const cancellableStatuses: UsulanStatus[] = ['Draft', 'Waiting_List', 'Diajukan'];

  if (!cancellableStatuses.includes(status)) {
    return {
      canCancel: false,
      reason: `Usulan dengan status ${status} tidak dapat dibatalkan`,
    };
  }

  return { canCancel: true };
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Format validation errors for display
 */
export const formatValidationErrors = (error: z.ZodError): Record<string, string> => {
  const formatted: Record<string, string> = {};

  error.errors.forEach((err) => {
    const path = err.path.join('.');
    formatted[path] = err.message;
  });

  return formatted;
};

/**
 * Check if value is valid UUID
 */
export const isValidUUID = (value: string): boolean => {
  return uuidSchema.safeParse(value).success;
};

/**
 * Check if value is valid URL
 */
export const isValidURL = (value: string): boolean => {
  return urlSchema.safeParse(value).success;
};

/**
 * Check if file is valid (size and type)
 */
export const isValidFile = (file: File): { valid: boolean; error?: string } => {
  const result = fileSchema.safeParse(file);

  if (!result.success) {
    return {
      valid: false,
      error: result.error.errors[0]?.message || 'File tidak valid',
    };
  }

  return { valid: true };
};
