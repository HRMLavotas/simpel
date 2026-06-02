/**
 * Parse NIP ASN 18 digit: YYYYMMDD (lahir) + YYYYMM (TMT CPNS) + G (jenis kelamin) + NNN
 */
export interface ParsedNipData {
  birth_date: string;
  tmt_cpns: string;
  gender: 'Laki-laki' | 'Perempuan';
}

export function parseNip(nip: string | null | undefined): ParsedNipData | null {
  if (!nip) return null;

  const cleanNIP = nip.replace(/\s/g, '');
  if (cleanNIP.length !== 18 || !/^\d{18}$/.test(cleanNIP)) return null;

  try {
    const birthDateStr = cleanNIP.substring(0, 8);
    const tmtCpnsStr = cleanNIP.substring(8, 14);
    const genderCode = cleanNIP.substring(14, 15);

    const birthYear = parseInt(birthDateStr.substring(0, 4), 10);
    const birthMonth = parseInt(birthDateStr.substring(4, 6), 10);
    const birthDay = parseInt(birthDateStr.substring(6, 8), 10);
    const tmtYear = parseInt(tmtCpnsStr.substring(0, 4), 10);
    const tmtMonth = parseInt(tmtCpnsStr.substring(4, 6), 10);

    if (birthYear < 1940 || birthYear > 2010) return null;
    if (birthMonth < 1 || birthMonth > 12 || birthDay < 1 || birthDay > 31) return null;
    if (tmtYear < 1970 || tmtYear > new Date().getFullYear()) return null;
    if (tmtMonth < 1 || tmtMonth > 12) return null;

    const birth_date = `${birthYear}-${String(birthMonth).padStart(2, '0')}-${String(birthDay).padStart(2, '0')}`;
    const tmt_cpns = `${tmtYear}-${String(tmtMonth).padStart(2, '0')}-01`;

    if (Number.isNaN(new Date(birth_date).getTime()) || Number.isNaN(new Date(tmt_cpns).getTime())) {
      return null;
    }

    const gender = genderCode === '1' ? 'Laki-laki' : genderCode === '2' ? 'Perempuan' : null;
    if (!gender) return null;

    return { birth_date, tmt_cpns, gender };
  } catch {
    return null;
  }
}

/** Perkiraan TMT pensiun BUP 58 tahun (sesuai statistik dashboard). */
export function estimateTmtPensiunFromBirthDate(birthDate: string | null | undefined): string | null {
  if (!birthDate) return null;
  const match = String(birthDate).trim().match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return null;
  const year = parseInt(match[1], 10) + 58;
  return `${year}-${match[2]}-${match[3]}`;
}
