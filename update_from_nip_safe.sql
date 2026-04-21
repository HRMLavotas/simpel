-- Update data pegawai dari NIP dengan validasi ketat
-- Hanya update data yang KOSONG dan NIP valid

UPDATE employees
SET 
  birth_date = CASE 
    WHEN birth_date IS NULL 
      AND LENGTH(REPLACE(nip, ' ', '')) = 18
      -- Validasi tahun lahir (1940-2010)
      AND CAST(SUBSTRING(REPLACE(nip, ' ', ''), 1, 4) AS INTEGER) BETWEEN 1940 AND 2010
      -- Validasi bulan lahir (1-12)
      AND CAST(SUBSTRING(REPLACE(nip, ' ', ''), 5, 2) AS INTEGER) BETWEEN 1 AND 12
      -- Validasi hari lahir (1-31)
      AND CAST(SUBSTRING(REPLACE(nip, ' ', ''), 7, 2) AS INTEGER) BETWEEN 1 AND 31
    THEN 
      -- Try to convert, will fail if invalid date
      (SUBSTRING(REPLACE(nip, ' ', ''), 1, 4) || '-' || 
       SUBSTRING(REPLACE(nip, ' ', ''), 5, 2) || '-' || 
       SUBSTRING(REPLACE(nip, ' ', ''), 7, 2))::DATE
    ELSE birth_date
  END,
  
  tmt_cpns = CASE 
    WHEN tmt_cpns IS NULL 
      AND LENGTH(REPLACE(nip, ' ', '')) = 18
      -- Validasi tahun TMT (1970-sekarang)
      AND CAST(SUBSTRING(REPLACE(nip, ' ', ''), 9, 4) AS INTEGER) BETWEEN 1970 AND EXTRACT(YEAR FROM CURRENT_DATE)
      -- Validasi bulan TMT (1-12)
      AND CAST(SUBSTRING(REPLACE(nip, ' ', ''), 13, 2) AS INTEGER) BETWEEN 1 AND 12
    THEN 
      (SUBSTRING(REPLACE(nip, ' ', ''), 9, 4) || '-' || 
       SUBSTRING(REPLACE(nip, ' ', ''), 13, 2) || '-01')::DATE
    ELSE tmt_cpns
  END,
  
  gender = CASE 
    WHEN (gender IS NULL OR gender = '')
      AND LENGTH(REPLACE(nip, ' ', '')) = 18
      AND SUBSTRING(REPLACE(nip, ' ', ''), 15, 1) IN ('1', '2')
    THEN 
      CASE SUBSTRING(REPLACE(nip, ' ', ''), 15, 1)
        WHEN '1' THEN 'Laki-laki'
        WHEN '2' THEN 'Perempuan'
      END
    ELSE gender
  END,
  
  updated_at = NOW()
  
WHERE 
  nip IS NOT NULL 
  AND LENGTH(REPLACE(nip, ' ', '')) = 18
  AND (
    birth_date IS NULL 
    OR tmt_cpns IS NULL
    OR gender IS NULL
    OR gender = ''
  )
  -- Extra safety: only update if validations pass
  AND (
    -- Birth date validation
    (birth_date IS NOT NULL OR (
      CAST(SUBSTRING(REPLACE(nip, ' ', ''), 1, 4) AS INTEGER) BETWEEN 1940 AND 2010
      AND CAST(SUBSTRING(REPLACE(nip, ' ', ''), 5, 2) AS INTEGER) BETWEEN 1 AND 12
      AND CAST(SUBSTRING(REPLACE(nip, ' ', ''), 7, 2) AS INTEGER) BETWEEN 1 AND 31
    ))
    AND
    -- TMT CPNS validation
    (tmt_cpns IS NOT NULL OR (
      CAST(SUBSTRING(REPLACE(nip, ' ', ''), 9, 4) AS INTEGER) BETWEEN 1970 AND EXTRACT(YEAR FROM CURRENT_DATE)
      AND CAST(SUBSTRING(REPLACE(nip, ' ', ''), 13, 2) AS INTEGER) BETWEEN 1 AND 12
    ))
    AND
    -- Gender validation
    ((gender IS NOT NULL AND gender != '') OR 
     SUBSTRING(REPLACE(nip, ' ', ''), 15, 1) IN ('1', '2'))
  );
