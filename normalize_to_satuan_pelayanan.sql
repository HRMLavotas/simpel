-- Normalisasi Semua Nama Satpel menjadi "Satuan Pelayanan [Kota]"
-- Ubah dari "Satpel [Kota]" menjadi "Satuan Pelayanan [Kota]"
-- untuk konsistensi dengan mayoritas data yang sudah ada di database

-- Step 1: Update tabel departments
UPDATE departments SET name = 'Satuan Pelayanan Pekanbaru' WHERE name = 'Satpel Pekanbaru';
UPDATE departments SET name = 'Satuan Pelayanan Jayapura' WHERE name = 'Satpel Jayapura';

-- Step 2: Update tabel employees untuk pegawai yang menggunakan nama pendek
UPDATE employees SET department = 'Satuan Pelayanan Pekanbaru' WHERE department = 'Satpel Pekanbaru';
UPDATE employees SET department = 'Satuan Pelayanan Jayapura' WHERE department = 'Satpel Jayapura';
UPDATE employees SET department = 'Satuan Pelayanan Bantul' WHERE department = 'Satpel Bantul';
UPDATE employees SET department = 'Satuan Pelayanan Bengkulu' WHERE department = 'Satpel Bengkulu';
UPDATE employees SET department = 'Satuan Pelayanan Jambi' WHERE department = 'Satpel Jambi';
UPDATE employees SET department = 'Satuan Pelayanan Kupang' WHERE department = 'Satpel Kupang';
UPDATE employees SET department = 'Satuan Pelayanan Lampung' WHERE department = 'Satpel Lampung';
UPDATE employees SET department = 'Satuan Pelayanan Lubuklinggau' WHERE department = 'Satpel Lubuklinggau';
UPDATE employees SET department = 'Satuan Pelayanan Majene' WHERE department = 'Satpel Majene';
UPDATE employees SET department = 'Satuan Pelayanan Mamuju' WHERE department = 'Satpel Mamuju';
UPDATE employees SET department = 'Satuan Pelayanan Palu' WHERE department = 'Satpel Palu';
UPDATE employees SET department = 'Satuan Pelayanan Sawahlunto' WHERE department = 'Satpel Sawahlunto';
UPDATE employees SET department = 'Satuan Pelayanan Sofifi' WHERE department = 'Satpel Sofifi';

-- Step 3: Update tabel position_references
UPDATE position_references SET department = 'Satuan Pelayanan Pekanbaru' WHERE department = 'Satpel Pekanbaru';
UPDATE position_references SET department = 'Satuan Pelayanan Jayapura' WHERE department = 'Satpel Jayapura';
UPDATE position_references SET department = 'Satuan Pelayanan Bantul' WHERE department = 'Satpel Bantul';
UPDATE position_references SET department = 'Satuan Pelayanan Bengkulu' WHERE department = 'Satpel Bengkulu';
UPDATE position_references SET department = 'Satuan Pelayanan Jambi' WHERE department = 'Satpel Jambi';
UPDATE position_references SET department = 'Satuan Pelayanan Kupang' WHERE department = 'Satpel Kupang';
UPDATE position_references SET department = 'Satuan Pelayanan Lampung' WHERE department = 'Satpel Lampung';
UPDATE position_references SET department = 'Satuan Pelayanan Lubuklinggau' WHERE department = 'Satpel Lubuklinggau';
UPDATE position_references SET department = 'Satuan Pelayanan Majene' WHERE department = 'Satpel Majene';
UPDATE position_references SET department = 'Satuan Pelayanan Mamuju' WHERE department = 'Satpel Mamuju';
UPDATE position_references SET department = 'Satuan Pelayanan Palu' WHERE department = 'Satpel Palu';
UPDATE position_references SET department = 'Satuan Pelayanan Sawahlunto' WHERE department = 'Satpel Sawahlunto';
UPDATE position_references SET department = 'Satuan Pelayanan Sofifi' WHERE department = 'Satpel Sofifi';

-- Step 4: Verifikasi hasil
SELECT 'Departments dengan nama Satpel:' as info, COUNT(*) as jumlah 
FROM departments 
WHERE name LIKE 'Satpel %';

SELECT 'Departments dengan nama Satuan Pelayanan:' as info, COUNT(*) as jumlah 
FROM departments 
WHERE name LIKE 'Satuan Pelayanan %';

SELECT 'Employees dengan department Satpel:' as info, COUNT(*) as jumlah 
FROM employees 
WHERE department LIKE 'Satpel %';

SELECT 'Employees dengan department Satuan Pelayanan:' as info, COUNT(*) as jumlah 
FROM employees 
WHERE department LIKE 'Satuan Pelayanan %';
