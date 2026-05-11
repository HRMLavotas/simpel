-- Fix: Standardisasi nama Satpel Pekanbaru
-- Masalah: Ada 2 variasi nama yang digunakan
--   1. "Satuan Pelayanan Pekanbaru" (di tabel departments)
--   2. "Satpel Pekanbaru" (digunakan oleh 6 pegawai)
--   3. "Satuan Pelayanan Pekanbaru" (digunakan oleh 1 pegawai)
-- Solusi: Gunakan "Satpel Pekanbaru" sebagai standar

-- Step 1: Update nama di tabel departments
UPDATE departments 
SET name = 'Satpel Pekanbaru' 
WHERE name = 'Satuan Pelayanan Pekanbaru';

-- Step 2: Update department pegawai yang masih menggunakan nama lama
UPDATE employees 
SET department = 'Satpel Pekanbaru' 
WHERE department = 'Satuan Pelayanan Pekanbaru';

-- Step 3: Verifikasi hasil - Departments
SELECT name, id FROM departments WHERE name LIKE '%Pekan%';

-- Step 4: Verifikasi hasil - Employees
SELECT department, COUNT(*) as jumlah FROM employees WHERE department LIKE '%Pekan%' GROUP BY department;
