-- =====================================================
-- Script untuk Extract dan Update Data dari NIP
-- =====================================================
-- Format NIP 18 digit:
-- 8 digit pertama: Tanggal lahir (YYYYMMDD)
-- 6 digit kedua: TMT CPNS (YYYYMM)
-- 1 digit ketiga: Jenis kelamin (1=Laki-laki, 2=Perempuan)
-- 3 digit terakhir: Nomor urut
-- =====================================================

-- STEP 1: Lihat data yang akan diupdate (preview)
-- =====================================================
SELECT 
  id,
  nip,
  name,
  birth_date AS birth_date_lama,
  tmt_cpns AS tmt_cpns_lama,
  gender AS gender_lama,
  -- Extract tanggal lahir dari NIP (8 digit pertama)
  CASE 
    WHEN LENGTH(REPLACE(nip, ' ', '')) = 18 THEN
      TO_DATE(SUBSTRING(REPLACE(nip, ' ', ''), 1, 8), 'YYYYMMDD')
    ELSE NULL
  END AS birth_date_baru,
  -- Extract TMT CPNS dari NIP (6 digit kedua, tambah hari 01)
  CASE 
    WHEN LENGTH(REPLACE(nip, ' ', '')) = 18 THEN
      TO_DATE(SUBSTRING(REPLACE(nip, ' ', ''), 9, 6) || '01', 'YYYYMMDD')
    ELSE NULL
  END AS tmt_cpns_baru,
  -- Extract jenis kelamin dari NIP (digit ke-15)
  CASE 
    WHEN LENGTH(REPLACE(nip, ' ', '')) = 18 THEN
      CASE SUBSTRING(REPLACE(nip, ' ', ''), 15, 1)
        WHEN '1' THEN 'Laki-laki'
        WHEN '2' THEN 'Perempuan'
        ELSE NULL
      END
    ELSE NULL
  END AS gender_baru
FROM employees
WHERE 
  nip IS NOT NULL 
  AND LENGTH(REPLACE(nip, ' ', '')) = 18
  AND (
    birth_date IS NULL 
    OR tmt_cpns IS NULL
    OR gender IS NULL
    OR gender = ''
  )
ORDER BY name;

-- =====================================================
-- STEP 2: Validasi data yang akan diupdate
-- =====================================================
-- Cek apakah ada tanggal yang tidak valid
SELECT 
  id,
  nip,
  name,
  SUBSTRING(REPLACE(nip, ' ', ''), 1, 8) AS birth_date_string,
  SUBSTRING(REPLACE(nip, ' ', ''), 9, 6) AS tmt_cpns_string,
  SUBSTRING(REPLACE(nip, ' ', ''), 15, 1) AS gender_code,
  -- Validasi tahun lahir (1940-2010)
  CASE 
    WHEN CAST(SUBSTRING(REPLACE(nip, ' ', ''), 1, 4) AS INTEGER) < 1940 
      OR CAST(SUBSTRING(REPLACE(nip, ' ', ''), 1, 4) AS INTEGER) > 2010 
    THEN 'INVALID: Tahun lahir di luar range 1940-2010'
    ELSE 'OK'
  END AS validasi_tahun_lahir,
  -- Validasi bulan lahir (1-12)
  CASE 
    WHEN CAST(SUBSTRING(REPLACE(nip, ' ', ''), 5, 2) AS INTEGER) < 1 
      OR CAST(SUBSTRING(REPLACE(nip, ' ', ''), 5, 2) AS INTEGER) > 12 
    THEN 'INVALID: Bulan lahir di luar range 1-12'
    ELSE 'OK'
  END AS validasi_bulan_lahir,
  -- Validasi hari lahir (1-31)
  CASE 
    WHEN CAST(SUBSTRING(REPLACE(nip, ' ', ''), 7, 2) AS INTEGER) < 1 
      OR CAST(SUBSTRING(REPLACE(nip, ' ', ''), 7, 2) AS INTEGER) > 31 
    THEN 'INVALID: Hari lahir di luar range 1-31'
    ELSE 'OK'
  END AS validasi_hari_lahir,
  -- Validasi tahun TMT CPNS (1970-sekarang)
  CASE 
    WHEN CAST(SUBSTRING(REPLACE(nip, ' ', ''), 9, 4) AS INTEGER) < 1970 
      OR CAST(SUBSTRING(REPLACE(nip, ' ', ''), 9, 4) AS INTEGER) > EXTRACT(YEAR FROM CURRENT_DATE)
    THEN 'INVALID: Tahun TMT CPNS di luar range'
    ELSE 'OK'
  END AS validasi_tahun_tmt,
  -- Validasi bulan TMT CPNS (1-12)
  CASE 
    WHEN CAST(SUBSTRING(REPLACE(nip, ' ', ''), 13, 2) AS INTEGER) < 1 
      OR CAST(SUBSTRING(REPLACE(nip, ' ', ''), 13, 2) AS INTEGER) > 12 
    THEN 'INVALID: Bulan TMT CPNS di luar range 1-12'
    ELSE 'OK'
  END AS validasi_bulan_tmt,
  -- Validasi gender code (1 atau 2)
  CASE 
    WHEN SUBSTRING(REPLACE(nip, ' ', ''), 15, 1) NOT IN ('1', '2')
    THEN 'INVALID: Kode gender bukan 1 atau 2'
    ELSE 'OK'
  END AS validasi_gender
FROM employees
WHERE 
  nip IS NOT NULL 
  AND LENGTH(REPLACE(nip, ' ', '')) = 18
  AND (
    birth_date IS NULL 
    OR tmt_cpns IS NULL
    OR gender IS NULL
    OR gender = ''
  )
ORDER BY name;

-- =====================================================
-- STEP 3: Update data pegawai (HATI-HATI!)
-- =====================================================
-- Uncomment untuk menjalankan update

/*
UPDATE employees
SET 
  birth_date = CASE 
    WHEN birth_date IS NULL 
      AND LENGTH(REPLACE(nip, ' ', '')) = 18
      -- Validasi tahun, bulan, hari
      AND CAST(SUBSTRING(REPLACE(nip, ' ', ''), 1, 4) AS INTEGER) BETWEEN 1940 AND 2010
      AND CAST(SUBSTRING(REPLACE(nip, ' ', ''), 5, 2) AS INTEGER) BETWEEN 1 AND 12
      AND CAST(SUBSTRING(REPLACE(nip, ' ', ''), 7, 2) AS INTEGER) BETWEEN 1 AND 31
    THEN TO_DATE(SUBSTRING(REPLACE(nip, ' ', ''), 1, 8), 'YYYYMMDD')
    ELSE birth_date
  END,
  
  tmt_cpns = CASE 
    WHEN tmt_cpns IS NULL 
      AND LENGTH(REPLACE(nip, ' ', '')) = 18
      -- Validasi tahun dan bulan TMT
      AND CAST(SUBSTRING(REPLACE(nip, ' ', ''), 9, 4) AS INTEGER) BETWEEN 1970 AND EXTRACT(YEAR FROM CURRENT_DATE)
      AND CAST(SUBSTRING(REPLACE(nip, ' ', ''), 13, 2) AS INTEGER) BETWEEN 1 AND 12
    THEN TO_DATE(SUBSTRING(REPLACE(nip, ' ', ''), 9, 6) || '01', 'YYYYMMDD')
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
  );
*/

-- =====================================================
-- STEP 4: Verifikasi hasil update
-- =====================================================
/*
SELECT 
  id,
  nip,
  name,
  birth_date,
  tmt_cpns,
  gender,
  updated_at
FROM employees
WHERE 
  nip IS NOT NULL 
  AND LENGTH(REPLACE(nip, ' ', '')) = 18
ORDER BY updated_at DESC
LIMIT 50;
*/

-- =====================================================
-- STEP 5: Statistik hasil update
-- =====================================================
/*
SELECT 
  COUNT(*) AS total_pegawai_dengan_nip,
  COUNT(CASE WHEN birth_date IS NOT NULL THEN 1 END) AS ada_birth_date,
  COUNT(CASE WHEN birth_date IS NULL THEN 1 END) AS tidak_ada_birth_date,
  COUNT(CASE WHEN tmt_cpns IS NOT NULL THEN 1 END) AS ada_tmt_cpns,
  COUNT(CASE WHEN tmt_cpns IS NULL THEN 1 END) AS tidak_ada_tmt_cpns,
  COUNT(CASE WHEN gender IS NOT NULL AND gender != '' THEN 1 END) AS ada_gender,
  COUNT(CASE WHEN gender IS NULL OR gender = '' THEN 1 END) AS tidak_ada_gender
FROM employees
WHERE 
  nip IS NOT NULL 
  AND LENGTH(REPLACE(nip, ' ', '')) = 18;
*/

-- =====================================================
-- CONTOH PENGGUNAAN:
-- =====================================================
-- 1. Jalankan STEP 1 untuk melihat preview data yang akan diupdate
-- 2. Jalankan STEP 2 untuk validasi data
-- 3. Jika validasi OK, uncomment dan jalankan STEP 3 untuk update
-- 4. Jalankan STEP 4 untuk verifikasi hasil
-- 5. Jalankan STEP 5 untuk melihat statistik
