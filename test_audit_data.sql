-- Script untuk testing fitur Audit Data
-- Jalankan di Supabase SQL Editor untuk membuat data test

-- 1. Buat pegawai dengan format pangkat salah
INSERT INTO employees (name, department, asn_status, rank_group, position_name, gender, birth_date, birth_place, religion)
VALUES 
  ('Test Pegawai 1', 'Bagian Umum', 'PNS', 'IV', 'Kepala Bagian', 'Laki-laki', '1980-01-01', 'Jakarta', 'Islam'),
  ('Test Pegawai 2', 'Bagian Keuangan', 'PNS', '3', 'Staff', 'Perempuan', '1985-05-15', 'Bandung', 'Kristen');

-- 2. Buat pegawai dengan data kosong
INSERT INTO employees (name, department, asn_status, rank_group, position_name)
VALUES 
  ('Test Pegawai 3', 'Bagian SDM', 'PNS', 'III/c', 'Analis SDM'),
  ('Test Pegawai 4', 'Bagian IT', 'PPPK', 'IX/a', 'Programmer');

-- 3. Buat pegawai dengan NIP tidak valid
INSERT INTO employees (name, department, asn_status, rank_group, position_name, nip, gender, birth_date, birth_place, religion)
VALUES 
  ('Test Pegawai 5', 'Bagian Umum', 'PNS', 'II/b', 'Staff Administrasi', '12345', 'Laki-laki', '1990-03-20', 'Surabaya', 'Islam'),
  ('Test Pegawai 6', 'Bagian Keuangan', 'PNS', 'III/a', 'Bendahara', '1990 0101 2020 011001', 'Perempuan', '1990-01-01', 'Medan', 'Buddha');

-- 4. Buat pegawai dengan kombinasi masalah
INSERT INTO employees (name, department, asn_status, rank_group, position_name, nip)
VALUES 
  ('Test Pegawai 7', 'Bagian SDM', 'PNS', 'IVa', 'Kepala Sub Bagian', '123456789012345678');

-- 5. Buat pegawai dengan data lengkap dan benar (tidak akan muncul di audit)
INSERT INTO employees (name, department, asn_status, rank_group, position_name, nip, gender, birth_date, birth_place, religion)
VALUES 
  ('Test Pegawai OK', 'Bagian Umum', 'PNS', 'IV/a', 'Kepala Bagian', '199001012020011001', 'Laki-laki', '1990-01-01', 'Jakarta', 'Islam');

-- Query untuk melihat hasil
SELECT 
  name,
  department,
  rank_group,
  nip,
  gender,
  birth_date,
  birth_place,
  religion,
  position_name,
  asn_status
FROM employees
WHERE name LIKE 'Test Pegawai%'
ORDER BY name;

-- Query untuk menghapus data test setelah selesai
-- DELETE FROM employees WHERE name LIKE 'Test Pegawai%';
