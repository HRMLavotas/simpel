-- Fix: Update semua Satpel yang masih tersisa di tabel departments
-- Beberapa Satpel belum diupdate di tabel departments pada script sebelumnya

-- Update tabel departments untuk semua Satpel yang masih menggunakan nama pendek
UPDATE departments SET name = 'Satuan Pelayanan Bantul' WHERE name = 'Satpel Bantul';
UPDATE departments SET name = 'Satuan Pelayanan Bengkulu' WHERE name = 'Satpel Bengkulu';
UPDATE departments SET name = 'Satuan Pelayanan Jambi' WHERE name = 'Satpel Jambi';
UPDATE departments SET name = 'Satuan Pelayanan Kupang' WHERE name = 'Satpel Kupang';
UPDATE departments SET name = 'Satuan Pelayanan Lampung' WHERE name = 'Satpel Lampung';
UPDATE departments SET name = 'Satuan Pelayanan Lubuklinggau' WHERE name = 'Satpel Lubuklinggau';
UPDATE departments SET name = 'Satuan Pelayanan Majene' WHERE name = 'Satpel Majene';
UPDATE departments SET name = 'Satuan Pelayanan Mamuju' WHERE name = 'Satpel Mamuju';
UPDATE departments SET name = 'Satuan Pelayanan Palu' WHERE name = 'Satpel Palu';
UPDATE departments SET name = 'Satuan Pelayanan Sawahlunto' WHERE name = 'Satpel Sawahlunto';
UPDATE departments SET name = 'Satuan Pelayanan Sofifi' WHERE name = 'Satpel Sofifi';
UPDATE departments SET name = 'Satuan Pelayanan Kotawaringin Timur' WHERE name = 'Satpel Kotawaringin Timur';
UPDATE departments SET name = 'Satuan Pelayanan Bali' WHERE name = 'Satpel Bali';
UPDATE departments SET name = 'Satuan Pelayanan Morowali' WHERE name = 'Satpel Morowali';
UPDATE departments SET name = 'Satuan Pelayanan Morowali Utara' WHERE name = 'Satpel Morowali Utara';
UPDATE departments SET name = 'Satuan Pelayanan Minahasa Utara' WHERE name = 'Satpel Minahasa Utara';
UPDATE departments SET name = 'Satuan Pelayanan Halmahera Selatan' WHERE name = 'Satpel Halmahera Selatan';
UPDATE departments SET name = 'Satuan Pelayanan Tanah Bumbu' WHERE name = 'Satpel Tanah Bumbu';
UPDATE departments SET name = 'Satuan Pelayanan Bulungan' WHERE name = 'Satpel Bulungan';

-- Verifikasi hasil
SELECT 'Departments dengan nama Satpel:' as info, COUNT(*) as jumlah 
FROM departments 
WHERE name LIKE 'Satpel %';

SELECT 'Departments dengan nama Satuan Pelayanan:' as info, COUNT(*) as jumlah 
FROM departments 
WHERE name LIKE 'Satuan Pelayanan %';

-- List semua Satpel yang masih tersisa (jika ada)
SELECT name FROM departments WHERE name LIKE 'Satpel %' ORDER BY name;
