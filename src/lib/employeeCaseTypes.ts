/**
 * Employee Case Management Types & Constants
 * Defines all types, interfaces, and constants for the case management system
 */

// ============================================================================
// ENUMS & TYPES
// ============================================================================

export type CaseType =
  | "perceraian"
  | "hutang"
  | "pinjaman_online"
  | "presensi"
  | "pengunduran_diri"
  | "temuan"
  | "lainnya";

export type CaseStatus = "baru" | "diproses" | "tertunda" | "selesai" | "ditutup";

export type CaseSeverity = "ringan" | "sedang" | "berat" | "sangat_berat";

export type PartyRole =
  | "pelapor"
  | "terlapor"
  | "saksi"
  | "mediator"
  | "penyidik"
  | "atasan_langsung"
  | "pihak_ketiga"
  | "lainnya";

// ============================================================================
// INTERFACES
// ============================================================================

export interface SupportingDocument {
  name: string;
  link: string;
}

export interface InvolvedParty {
  name: string;
  role: PartyRole;
}

export interface TimelineItem {
  id: string;
  date: string;
  description: string;
  status: string;
  involvedParties?: string; // Legacy field
  involvedPartiesList?: InvolvedParty[]; // New structured field
  documentLink?: string; // Legacy field
  documentName?: string; // Legacy field
  documents: SupportingDocument[]; // New structured field
  createdAt: string;
  updatedAt: string;
}

export interface CaseDetails {
  // For manual entry (non-system employee)
  isManualEntry?: boolean;
  manualJabatan?: string;
  manualUnitKerja?: string;

  // For "Lainnya" category
  lainnyaKategori?: string;

  // Case-specific details based on type (legacy, keep for backward compatibility)
  // Disiplin
  violationType?: string;
  violationDate?: string;
  reportedBy?: string;

  // Kinerja
  performanceIssue?: string;
  performancePeriod?: string;
  targetNotMet?: string;

  // Etika
  ethicsViolation?: string;
  ethicsImpact?: string;

  // Administrasi
  adminIssue?: string;
  adminDocuments?: string;

  // Hukum
  legalCase?: string;
  legalStatus?: string;
  courtName?: string;

  // Kesehatan
  healthIssue?: string;
  medicalDocuments?: string;
  treatmentStatus?: string;

  // Lainnya
  otherDetails?: string;
}

export interface EmployeeCase {
  id: string;
  caseNumber?: string;
  employeeId: string;
  employeeName: string;
  employeeNip: string;
  caseType: CaseType;
  status: CaseStatus;
  severity?: CaseSeverity;
  description: string;
  reportDate: string;
  timeline: TimelineItem[];
  caseDetails?: CaseDetails;
  leadershipDirective?: string; // Arahan Pimpinan - direct instructions from leadership
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// LABELS & OPTIONS
// ============================================================================

export const CASE_TYPE_LABELS: Record<CaseType, string> = {
  perceraian: "Perceraian",
  hutang: "Hutang",
  pinjaman_online: "Pinjaman Online",
  presensi: "Presensi",
  pengunduran_diri: "Pengunduran Diri",
  temuan: "Temuan",
  lainnya: "Lainnya",
};

export const CASE_STATUS_LABELS: Record<CaseStatus, string> = {
  baru: "Baru",
  diproses: "Diproses",
  tertunda: "Tertunda",
  selesai: "Selesai",
  ditutup: "Ditutup",
};

export const CASE_SEVERITY_LABELS: Record<CaseSeverity, string> = {
  ringan: "Ringan",
  sedang: "Sedang",
  berat: "Berat",
  sangat_berat: "Sangat Berat",
};

export const PARTY_ROLE_LABELS: Record<PartyRole, string> = {
  pelapor: "Pelapor",
  terlapor: "Terlapor",
  saksi: "Saksi",
  mediator: "Mediator",
  penyidik: "Penyidik",
  atasan_langsung: "Atasan Langsung",
  pihak_ketiga: "Pihak Ketiga",
  lainnya: "Lainnya",
};

export const CASE_TYPE_OPTIONS = Object.entries(CASE_TYPE_LABELS).map(
  ([value, label]) => ({ value: value as CaseType, label })
);

export const CASE_STATUS_OPTIONS = Object.entries(CASE_STATUS_LABELS).map(
  ([value, label]) => ({ value: value as CaseStatus, label })
);

export const CASE_SEVERITY_OPTIONS = Object.entries(CASE_SEVERITY_LABELS).map(
  ([value, label]) => ({ value: value as CaseSeverity, label })
);

export const PARTY_ROLE_OPTIONS = Object.entries(PARTY_ROLE_LABELS).map(
  ([value, label]) => ({ value: value as PartyRole, label })
);

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export function getCaseTypeLabel(type: CaseType): string {
  return CASE_TYPE_LABELS[type] || type;
}

export function getCaseStatusLabel(status: CaseStatus): string {
  return CASE_STATUS_LABELS[status] || status;
}

export function getCaseSeverityLabel(severity: CaseSeverity): string {
  return CASE_SEVERITY_LABELS[severity] || severity;
}

export function getPartyRoleLabel(role: PartyRole): string {
  return PARTY_ROLE_LABELS[role] || role;
}

/**
 * Generate a unique case number
 * Format: CASE-YYYYMMDD-XXXXX
 */
export function generateCaseNumber(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const random = Math.floor(Math.random() * 100000)
    .toString()
    .padStart(5, "0");

  return `CASE-${year}${month}${day}-${random}`;
}

/**
 * Validate case data
 */
export function validateCaseData(data: Partial<EmployeeCase>): string[] {
  const errors: string[] = [];

  if (!data.employeeId) errors.push("Employee ID is required");
  if (!data.employeeName) errors.push("Employee name is required");
  if (!data.employeeNip) errors.push("Employee NIP is required");
  if (!data.caseType) errors.push("Case type is required");
  if (!data.status) errors.push("Case status is required");
  if (!data.description || data.description.trim() === "")
    errors.push("Case description is required");
  if (!data.reportDate) errors.push("Report date is required");

  return errors;
}
