import { z } from 'zod';

/**
 * Base validation schemas for employee data
 * Implements enhanced data validation with Indonesian error messages
 * 
 * Requirements: 1.1, 1.2, 1.5, 1.6, 1.9
 */

// ============================================================================
// Base Field Schemas
// ============================================================================

/**
 * NIP validation schema
 * Requirements: 1.1 - NIP must be exactly 18 digits
 */
export const nipSchema = z
  .string()
  .length(18, 'NIP harus 18 digit')
  .regex(/^\d{18}$/, 'NIP hanya boleh berisi angka')
  .or(z.literal(''))
  .optional();

/**
 * NIK validation schema
 * Requirements: 1.2 - NIK must be exactly 16 digits
 */
export const nikSchema = z
  .string()
  .length(16, 'NIK harus 16 digit')
  .regex(/^\d{16}$/, 'NIK hanya boleh berisi angka');

/**
 * Birth date validation schema
 * Requirements: 1.5 - Birth dates cannot be in the future
 */
export const birthDateSchema = z
  .string()
  .refine(
    (dateStr) => {
      if (!dateStr) return true; // Allow empty for optional fields
      const date = new Date(dateStr);
      return date <= new Date();
    },
    { message: 'Tanggal lahir tidak boleh di masa depan' }
  )
  .or(z.literal(''))
  .optional();

/**
 * Join date validation schema
 * Basic validation - cross-field validation happens at schema level
 */
export const joinDateSchema = z
  .string()
  .or(z.literal(''))
  .optional();

/**
 * Generic date schema for other date fields
 */
export const dateSchema = z
  .string()
  .or(z.literal(''))
  .optional();

/**
 * Name validation schema
 */
export const nameSchema = z
  .string()
  .min(3, 'Nama minimal 3 karakter')
  .max(255, 'Nama maksimal 255 karakter');

/**
 * Title schemas (front and back)
 */
export const titleSchema = z
  .string()
  .max(50, 'Gelar maksimal 50 karakter')
  .or(z.literal(''))
  .optional();

/**
 * Place name schema (birth place, etc.)
 */
export const placeSchema = z
  .string()
  .max(100, 'Tempat maksimal 100 karakter')
  .or(z.literal(''))
  .optional();

/**
 * Position name schema
 */
export const positionNameSchema = z
  .string()
  .max(255, 'Nama jabatan maksimal 255 karakter')
  .or(z.literal(''))
  .optional();

/**
 * Department schema
 */
export const departmentSchema = z
  .string()
  .min(1, 'Unit kerja wajib dipilih');

/**
 * ASN status schema
 */
export const asnStatusSchema = z
  .string()
  .min(1, 'Status ASN wajib dipilih');

/**
 * Gender schema
 */
export const genderSchema = z
  .string()
  .or(z.literal(''))
  .optional();

/**
 * Religion schema
 */
export const religionSchema = z
  .string()
  .or(z.literal(''))
  .optional();

/**
 * Position type schema
 */
export const positionTypeSchema = z
  .string()
  .or(z.literal(''))
  .optional();

/**
 * Rank group schema
 */
export const rankGroupSchema = z
  .string()
  .or(z.literal(''))
  .optional();

// ============================================================================
// ASN Employee Schema
// ============================================================================

/**
 * Complete ASN employee validation schema with cross-field validation
 * Requirements: 1.1, 1.2, 1.5, 1.6, 1.9
 */
export const asnEmployeeSchema = z
  .object({
    nip: nipSchema,
    name: nameSchema,
    front_title: titleSchema,
    back_title: titleSchema,
    birth_place: placeSchema,
    birth_date: birthDateSchema,
    gender: genderSchema,
    religion: religionSchema,
    position_type: positionTypeSchema,
    position_name: positionNameSchema,
    asn_status: asnStatusSchema,
    rank_group: rankGroupSchema,
    department: departmentSchema,
    join_date: joinDateSchema,
    tmt_cpns: dateSchema,
    tmt_pns: dateSchema,
    tmt_pensiun: dateSchema,
  })
  .refine(
    (data) => {
      // Requirements: 1.6 - Join date cannot be before birth date
      if (!data.birth_date || !data.join_date) return true;
      if (data.birth_date === '' || data.join_date === '') return true;
      
      const birthDate = new Date(data.birth_date);
      const joinDate = new Date(data.join_date);
      
      return joinDate >= birthDate;
    },
    {
      message: 'Tanggal masuk tidak boleh sebelum tanggal lahir',
      path: ['join_date'],
    }
  )
  .refine(
    (data) => {
      // Additional validation: TMT CPNS cannot be before birth date
      if (!data.birth_date || !data.tmt_cpns) return true;
      if (data.birth_date === '' || data.tmt_cpns === '') return true;
      
      const birthDate = new Date(data.birth_date);
      const tmtCpns = new Date(data.tmt_cpns);
      
      return tmtCpns >= birthDate;
    },
    {
      message: 'TMT CPNS tidak boleh sebelum tanggal lahir',
      path: ['tmt_cpns'],
    }
  )
  .refine(
    (data) => {
      // Additional validation: TMT PNS cannot be before birth date
      if (!data.birth_date || !data.tmt_pns) return true;
      if (data.birth_date === '' || data.tmt_pns === '') return true;
      
      const birthDate = new Date(data.birth_date);
      const tmtPns = new Date(data.tmt_pns);
      
      return tmtPns >= birthDate;
    },
    {
      message: 'TMT PNS tidak boleh sebelum tanggal lahir',
      path: ['tmt_pns'],
    }
  )
  .refine(
    (data) => {
      // Additional validation: TMT PNS cannot be before TMT CPNS
      if (!data.tmt_cpns || !data.tmt_pns) return true;
      if (data.tmt_cpns === '' || data.tmt_pns === '') return true;
      
      const tmtCpns = new Date(data.tmt_cpns);
      const tmtPns = new Date(data.tmt_pns);
      
      return tmtPns >= tmtCpns;
    },
    {
      message: 'TMT PNS tidak boleh sebelum TMT CPNS',
      path: ['tmt_pns'],
    }
  );

// ============================================================================
// Non-ASN Employee Schema
// ============================================================================

/**
 * Complete Non-ASN employee validation schema with cross-field validation
 * Requirements: 1.2, 1.5, 1.6, 1.9
 * 
 * Note: Non-ASN employees use NIK instead of NIP
 */
export const nonAsnEmployeeSchema = z
  .object({
    nip: nikSchema, // For Non-ASN, this field stores NIK (16 digits)
    name: nameSchema,
    position_name: positionNameSchema.refine(
      (val) => val !== '' && val !== undefined,
      { message: 'Jabatan wajib diisi' }
    ),
    birth_place: placeSchema,
    birth_date: birthDateSchema,
    gender: genderSchema,
    religion: religionSchema,
    department: departmentSchema,
    rank_group: z.string().min(1, 'Jenis Non-ASN wajib dipilih'), // Type of Non-ASN
    keterangan_penugasan: z.string().or(z.literal('')).optional(),
    keterangan_perubahan: z.string().or(z.literal('')).optional(),
  })
  .refine(
    (data) => {
      // Requirements: 1.6 - Birth date validation (no join date for Non-ASN)
      // Non-ASN employees don't have join_date, so we only validate birth_date
      return true;
    },
    {
      message: 'Data tanggal tidak valid',
      path: ['birth_date'],
    }
  );

// ============================================================================
// Type Exports
// ============================================================================

export type AsnEmployeeFormData = z.infer<typeof asnEmployeeSchema>;
export type NonAsnEmployeeFormData = z.infer<typeof nonAsnEmployeeSchema>;

// ============================================================================
// Validation Helper Functions
// ============================================================================

/**
 * Validates NIP format
 * @param nip - NIP string to validate
 * @returns Validation result with error message if invalid
 */
export function validateNipFormat(nip: string): { valid: boolean; error?: string } {
  const result = nipSchema.safeParse(nip);
  if (!result.success) {
    return {
      valid: false,
      error: result.error.errors[0]?.message || 'NIP tidak valid',
    };
  }
  return { valid: true };
}

/**
 * Validates NIK format
 * @param nik - NIK string to validate
 * @returns Validation result with error message if invalid
 */
export function validateNikFormat(nik: string): { valid: boolean; error?: string } {
  const result = nikSchema.safeParse(nik);
  if (!result.success) {
    return {
      valid: false,
      error: result.error.errors[0]?.message || 'NIK tidak valid',
    };
  }
  return { valid: true };
}

/**
 * Validates birth date (not in future)
 * @param dateStr - Date string to validate
 * @returns Validation result with error message if invalid
 */
export function validateBirthDate(dateStr: string): { valid: boolean; error?: string } {
  const result = birthDateSchema.safeParse(dateStr);
  if (!result.success) {
    return {
      valid: false,
      error: result.error.errors[0]?.message || 'Tanggal lahir tidak valid',
    };
  }
  return { valid: true };
}

/**
 * Validates date logic (join date vs birth date)
 * @param birthDate - Birth date string
 * @param joinDate - Join date string
 * @returns Validation result with error message if invalid
 */
export function validateDateLogic(
  birthDate: string,
  joinDate: string
): { valid: boolean; error?: string } {
  if (!birthDate || !joinDate || birthDate === '' || joinDate === '') {
    return { valid: true };
  }

  const birth = new Date(birthDate);
  const join = new Date(joinDate);

  if (join < birth) {
    return {
      valid: false,
      error: 'Tanggal masuk tidak boleh sebelum tanggal lahir',
    };
  }

  return { valid: true };
}
