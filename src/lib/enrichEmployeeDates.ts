import type { Employee } from '@/types/employee';
import { toDateInputValue } from '@/lib/date-utils';
import { estimateTmtPensiunFromBirthDate, parseNip } from '@/lib/parseNip';

/**
 * Isi tanggal penting yang kosong di kolom employees dari NIP atau field terkait lain.
 * Dipakai saat menampilkan form edit agar data yang "ada" (mis. di NIP) ikut termuat.
 */
export function enrichEmployeeDates(employee: Employee): Employee {
  const enriched = { ...employee };
  const nipData = parseNip(employee.nip);

  if (nipData) {
    if (!enriched.birth_date) {
      enriched.birth_date = nipData.birth_date;
    }
    if (!enriched.tmt_cpns) {
      enriched.tmt_cpns = nipData.tmt_cpns;
    }
    if (!enriched.gender) {
      enriched.gender = nipData.gender;
    }
  }

  // TMT PNS: tidak ada di NIP; fallback tmt_gol atau tmt_cpns untuk pegawai PNS
  if (!enriched.tmt_pns && enriched.asn_status === 'PNS') {
    enriched.tmt_pns = enriched.tmt_gol || enriched.tmt_cpns || null;
  }

  // TMT Pensiun: perkiraan BUP 58 tahun jika kolom kosong
  const birthForPensiun = enriched.birth_date || nipData?.birth_date;
  if (!enriched.tmt_pensiun && birthForPensiun) {
    enriched.tmt_pensiun = estimateTmtPensiunFromBirthDate(birthForPensiun);
  }

  for (const field of [
    'birth_date',
    'join_date',
    'tmt_cpns',
    'tmt_pns',
    'tmt_pensiun',
    'tmt_gol',
    'inactive_date',
  ] as const) {
    const value = enriched[field];
    if (value) {
      enriched[field] = toDateInputValue(value) || null;
    }
  }

  return enriched;
}
