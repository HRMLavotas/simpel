-- Backfill tanggal penting yang kosong dari NIP dan aturan BUP 58 tahun
-- NIP format: YYYYMMDD (lahir) + YYYYMM (TMT CPNS) + G + NNN

UPDATE public.employees
SET
  birth_date = CASE
    WHEN birth_date IS NULL
      AND nip IS NOT NULL
      AND LENGTH(REPLACE(nip, ' ', '')) = 18
      AND CAST(SUBSTRING(REPLACE(nip, ' ', ''), 1, 4) AS INTEGER) BETWEEN 1940 AND 2010
      AND CAST(SUBSTRING(REPLACE(nip, ' ', ''), 5, 2) AS INTEGER) BETWEEN 1 AND 12
      AND CAST(SUBSTRING(REPLACE(nip, ' ', ''), 7, 2) AS INTEGER) BETWEEN 1 AND 31
    THEN TO_DATE(SUBSTRING(REPLACE(nip, ' ', ''), 1, 8), 'YYYYMMDD')
    ELSE birth_date
  END,
  tmt_cpns = CASE
    WHEN tmt_cpns IS NULL
      AND nip IS NOT NULL
      AND LENGTH(REPLACE(nip, ' ', '')) = 18
      AND CAST(SUBSTRING(REPLACE(nip, ' ', ''), 9, 4) AS INTEGER) BETWEEN 1970 AND EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER
      AND CAST(SUBSTRING(REPLACE(nip, ' ', ''), 13, 2) AS INTEGER) BETWEEN 1 AND 12
    THEN TO_DATE(SUBSTRING(REPLACE(nip, ' ', ''), 9, 6) || '01', 'YYYYMMDD')
    ELSE tmt_cpns
  END,
  gender = CASE
    WHEN (gender IS NULL OR TRIM(gender) = '')
      AND nip IS NOT NULL
      AND LENGTH(REPLACE(nip, ' ', '')) = 18
      AND SUBSTRING(REPLACE(nip, ' ', ''), 15, 1) IN ('1', '2')
    THEN CASE SUBSTRING(REPLACE(nip, ' ', ''), 15, 1)
      WHEN '1' THEN 'Laki-laki'
      WHEN '2' THEN 'Perempuan'
    END
    ELSE gender
  END,
  updated_at = NOW()
WHERE nip IS NOT NULL
  AND LENGTH(REPLACE(nip, ' ', '')) = 18;

-- TMT PNS dari tmt_gol atau tmt_cpns untuk pegawai PNS
UPDATE public.employees
SET
  tmt_pns = COALESCE(tmt_gol, tmt_cpns),
  updated_at = NOW()
WHERE asn_status = 'PNS'
  AND tmt_pns IS NULL
  AND (tmt_gol IS NOT NULL OR tmt_cpns IS NOT NULL);

-- TMT Pensiun perkiraan BUP 58 tahun
UPDATE public.employees
SET
  tmt_pensiun = (birth_date + INTERVAL '58 years')::date,
  updated_at = NOW()
WHERE tmt_pensiun IS NULL
  AND birth_date IS NOT NULL;
