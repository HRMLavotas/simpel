import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
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
