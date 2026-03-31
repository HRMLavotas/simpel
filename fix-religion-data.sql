-- Script untuk update data religion dan normalize gender format
-- Jalankan di Supabase SQL Editor

-- ============================================
-- 1. NORMALIZE GENDER FORMAT (Optional - jika ada format yang salah)
-- ============================================

-- Normalize gender dari format lama (L/P) ke format baru (Laki-laki/Perempuan)
-- CATATAN: Ini optional, karena data gender seharusnya sudah ada dari import
UPDATE employees 
SET gender = 'Laki-laki'
WHERE gender IN ('L', 'l', 'LAKI-LAKI', 'Laki Laki', 'laki-laki', 'LAKI LAKI');

UPDATE employees 
SET gender = 'Perempuan'
WHERE gender IN ('P', 'p', 'PEREMPUAN', 'perempuan');

-- Update gender dari NIP untuk data yang masih NULL (jika ada)
-- NIP format: YYYYMMDD YYYYMM G NNN
-- Digit ke-15 (index 14): 1 = Laki-laki, 2 = Perempuan
UPDATE employees 
SET gender = CASE 
  WHEN SUBSTRING(nip, 15, 1) = '1' THEN 'Laki-laki'
  WHEN SUBSTRING(nip, 15, 1) = '2' THEN 'Perempuan'
  ELSE NULL
END
WHERE gender IS NULL 
  AND nip IS NOT NULL 
  AND LENGTH(REPLACE(nip, ' ', '')) = 18;

-- ============================================
-- 2. FIX RELIGION DATA (REQUIRED)
-- ============================================

-- Set default religion untuk data yang masih NULL
-- CATATAN: Template import tidak punya kolom agama, jadi semua data lama adalah NULL
-- Anda bisa:
-- 1. Set default "Islam" untuk semua (seperti di bawah)
-- 2. Update manual per pegawai sesuai data yang benar
-- 3. Re-import dengan template baru yang punya kolom "Agama"

UPDATE employees 
SET religion = 'Islam'
WHERE religion IS NULL;

-- Atau jika ingin set berdasarkan unit kerja atau kriteria lain:
-- UPDATE employees 
-- SET religion = 'Islam'
-- WHERE religion IS NULL AND department = 'Setditjen Binalavotas';

-- ============================================
-- 3. VERIFY RESULTS
-- ============================================

-- Check gender distribution
SELECT 
  gender, 
  COUNT(*) as jumlah
FROM employees 
GROUP BY gender
ORDER BY gender;

-- Check religion distribution
SELECT 
  religion, 
  COUNT(*) as jumlah
FROM employees 
GROUP BY religion
ORDER BY religion;

-- Check sample data dengan semua field penting
SELECT 
  id, 
  name, 
  nip,
  gender, 
  religion,
  birth_date,
  tmt_cpns,
  department
FROM employees 
ORDER BY created_at DESC
LIMIT 20;

-- Check for remaining NULL values
SELECT 
  COUNT(*) as total_null_gender
FROM employees 
WHERE gender IS NULL;

SELECT 
  COUNT(*) as total_null_religion
FROM employees 
WHERE religion IS NULL;

-- Check jika ada format gender yang aneh
SELECT DISTINCT gender 
FROM employees 
WHERE gender IS NOT NULL
ORDER BY gender;


