import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Normalize string for consistent comparison
 * Trims whitespace, converts to lowercase, and collapses multiple spaces
 */
export function normalizeString(str: string): string {
  return str.trim().toLowerCase().replace(/\s+/g, ' ');
}

/**
 * Validate if a date string is a valid date
 */
export function isValidDate(dateString: string): boolean {
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime());
}

/**
 * Safe error message extraction
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return 'Terjadi kesalahan yang tidak diketahui';
}

/** ID unik; fallback jika crypto.randomUUID tidak ada (mis. halaman dibuka via http://bukan-localhost). */
export function randomId(): string {
  if (typeof globalThis.crypto !== 'undefined' && typeof globalThis.crypto.randomUUID === 'function') {
    try {
      return globalThis.crypto.randomUUID();
    } catch {
      /* continue */
    }
  }
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
}
