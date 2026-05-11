-- Standardisasi Semua Nama Satpel
-- Ubah dari "Satuan Pelayanan [Kota]" menjadi "Satpel [Kota]"
-- untuk konsistensi dengan standar penamaan yang sudah ada

-- Step 1: Update tabel departments
UPDATE departments SET name = 'Satpel Bantul' WHERE name = 'Satuan Pelayanan Bantul';
UPDATE departments SET name = 'Satpel Bengkulu' WHERE name = 'Satuan Pelayanan Bengkulu';
UPDATE departments SET name = 'Satpel Jambi' WHERE name = 'Satuan Pelayanan Jambi';
UPDATE departments SET name = 'Satpel Kupang' WHERE name = 'Satuan Pelayanan Kupang';
UPDATE departments SET name = 'Satpel Lampung' WHERE name = 'Satuan Pelayanan Lampung';
UPDATE departments SET name = 'Satpel Lubuklinggau' WHERE name = 'Satuan Pelayanan Lubuklinggau';
UPDATE departments SET name = 'Satpel Majene' WHERE name = 'Satuan Pelayanan Majene';
UPDATE departments SET name = 'Satpel Mamuju' WHERE name = 'Satuan Pelayanan Mamuju';
UPDATE departments SET name = 'Satpel Palu' WHERE name = 'Satuan Pelayanan Palu';
UPDATE departments SET name = 'Satpel Sawahlunto' WHERE name = 'Satuan Pelayanan Sawahlunto';
UPDATE departments SET name = 'Satpel Sofifi' WHERE name = 'Satuan Pelayanan Sofifi';

-- Step 2: Update tabel employees untuk pegawai yang masih menggunakan nama lama
UPDATE employees SET department = 'Satpel Bantul' WHERE department = 'Satuan Pelayanan Bantul';
UPDATE employees SET department = 'Satpel Bengkulu' WHERE department = 'Satuan Pelayanan Bengkulu';
UPDATE employees SET department = 'Satpel Jambi' WHERE department = 'Satuan Pelayanan Jambi';
UPDATE employees SET department = 'Satpel Kupang' WHERE department = 'Satuan Pelayanan Kupang';
UPDATE employees SET department = 'Satpel Lampung' WHERE department = 'Satuan Pelayanan Lampung';
UPDATE employees SET department = 'Satpel Lubuklinggau' WHERE department = 'Satuan Pelayanan Lubuklinggau';
UPDATE employees SET department = 'Satpel Majene' WHERE department = 'Satuan Pelayanan Majene';
UPDATE employees SET department = 'Satpel Mamuju' WHERE department = 'Satuan Pelayanan Mamuju';
UPDATE employees SET department = 'Satpel Palu' WHERE department = 'Satuan Pelayanan Palu';
UPDATE employees SET department = 'Satpel Sawahlunto' WHERE department = 'Satuan Pelayanan Sawahlunto';
UPDATE employees SET department = 'Satpel Sofifi' WHERE department = 'Satuan Pelayanan Sofifi';

-- Step 3: Update tabel position_references
UPDATE position_references SET department = 'Satpel Bantul' WHERE department = 'Satuan Pelayanan Bantul';
UPDATE position_references SET department = 'Satpel Bengkulu' WHERE department = 'Satuan Pelayanan Bengkulu';
UPDATE position_references SET department = 'Satpel Jambi' WHERE department = 'Satuan Pelayanan Jambi';
UPDATE position_references SET department = 'Satpel Kupang' WHERE department = 'Satuan Pelayanan Kupang';
UPDATE position_references SET department = 'Satpel Lampung' WHERE department = 'Satuan Pelayanan Lampung';
UPDATE position_references SET department = 'Satpel Lubuklinggau' WHERE department = 'Satuan Pelayanan Lubuklinggau';
UPDATE position_references SET department = 'Satpel Majene' WHERE department = 'Satuan Pelayanan Majene';
UPDATE position_references SET department = 'Satpel Mamuju' WHERE department = 'Satuan Pelayanan Mamuju';
UPDATE position_references SET department = 'Satpel Palu' WHERE department = 'Satuan Pelayanan Palu';
UPDATE position_references SET department = 'Satpel Sawahlunto' WHERE department = 'Satuan Pelayanan Sawahlunto';
UPDATE position_references SET department = 'Satpel Sofifi' WHERE department = 'Satuan Pelayanan Sofifi';

-- Step 4: Verifikasi hasil
SELECT 'Departments dengan nama Satuan Pelayanan:' as info, COUNT(*) as jumlah 
FROM departments 
WHERE name LIKE 'Satuan Pelayanan %';

SELECT 'Departments dengan nama Satpel:' as info, COUNT(*) as jumlah 
FROM departments 
WHERE name LIKE 'Satpel %';

SELECT 'Employees dengan department Satuan Pelayanan:' as info, COUNT(*) as jumlah 
FROM employees 
WHERE department LIKE 'Satuan Pelayanan %';

SELECT 'Employees dengan department Satpel:' as info, COUNT(*) as jumlah 
FROM employees 
WHERE department LIKE 'Satpel %';
