-- ============================================================================
-- Migrate Non-ASN from Satpel to Unit Pembina
-- ============================================================================
-- Tujuan: Pindahkan pegawai Non-ASN yang department-nya Satpel/Workshop
--         ke unit pembina mereka, dan set satuan_kerja_penugasan ke Satpel asal
-- ============================================================================

-- Preview: Cek pegawai yang akan dipindahkan
SELECT 
  e.id,
  e.name,
  e.department as current_department,
  CASE 
    -- BBPVP Serang
    WHEN e.department IN ('Satuan Pelayanan Lubuklinggau', 'Satpel Lubuklinggau') THEN 'BBPVP Serang'
    WHEN e.department IN ('Satuan Pelayanan Lampung', 'Satpel Lampung') THEN 'BBPVP Serang'
    WHEN e.department IN ('Workshop Prabumulih') THEN 'BBPVP Serang'
    
    -- BBPVP Bekasi
    WHEN e.department IN ('Satuan Pelayanan Bengkulu', 'Satpel Bengkulu') THEN 'BBPVP Bekasi'
    WHEN e.department IN ('Satuan Pelayanan Kotawaringin Timur', 'Satpel Kotawaringin Timur') THEN 'BBPVP Bekasi'
    
    -- BBPVP Makassar
    WHEN e.department IN ('Satuan Pelayanan Majene', 'Satpel Majene') THEN 'BBPVP Makassar'
    WHEN e.department IN ('Satuan Pelayanan Mamuju', 'Satpel Mamuju') THEN 'BBPVP Makassar'
    WHEN e.department IN ('Satuan Pelayanan Palu', 'Satpel Palu') THEN 'BBPVP Makassar'
    WHEN e.department IN ('Satuan Pelayanan Morowali', 'Satpel Morowali') THEN 'BBPVP Makassar'
    WHEN e.department IN ('Satuan Pelayanan Morowali Utara', 'Satpel Morowali Utara') THEN 'BBPVP Makassar'
    WHEN e.department IN ('Workshop Gorontalo') THEN 'BBPVP Makassar'
    
    -- BBPVP Medan
    WHEN e.department IN ('Satuan Pelayanan Pekanbaru', 'Satpel Pekanbaru') THEN 'BBPVP Medan'
    WHEN e.department IN ('Workshop Batam') THEN 'BBPVP Medan'
    
    -- BPVP Surakarta
    WHEN e.department IN ('Satuan Pelayanan Bantul', 'Satpel Bantul') THEN 'BPVP Surakarta'
    
    -- BPVP Padang
    WHEN e.department IN ('Satuan Pelayanan Jambi', 'Satpel Jambi') THEN 'BPVP Padang'
    WHEN e.department IN ('Satuan Pelayanan Sawahlunto', 'Satpel Sawahlunto') THEN 'BPVP Padang'
    
    -- BPVP Lombok Timur
    WHEN e.department IN ('Satuan Pelayanan Kupang', 'Satpel Kupang') THEN 'BPVP Lombok Timur'
    WHEN e.department IN ('Satuan Pelayanan Bali', 'Satpel Bali') THEN 'BPVP Lombok Timur'
    
    -- BPVP Ternate
    WHEN e.department IN ('Satuan Pelayanan Sofifi', 'Satpel Sofifi') THEN 'BPVP Ternate'
    WHEN e.department IN ('Satuan Pelayanan Minahasa Utara', 'Satpel Minahasa Utara') THEN 'BPVP Ternate'
    WHEN e.department IN ('Satuan Pelayanan Halmahera Selatan', 'Satpel Halmahera Selatan') THEN 'BPVP Ternate'
    
    -- BPVP Sorong
    WHEN e.department IN ('Satuan Pelayanan Jayapura', 'Satpel Jayapura') THEN 'BPVP Sorong'
    
    -- BPVP Samarinda
    WHEN e.department IN ('Satuan Pelayanan Tanah Bumbu', 'Satpel Tanah Bumbu') THEN 'BPVP Samarinda'
    WHEN e.department IN ('Satuan Pelayanan Bulungan', 'Satpel Bulungan') THEN 'BPVP Samarinda'
    
    ELSE NULL
  END as new_department,
  e.department as new_satuan_kerja_penugasan,
  e.satuan_kerja_penugasan as old_satuan_kerja_penugasan
FROM employees e
WHERE e.asn_status = 'Non ASN'
  AND e.is_active = true
  AND (
    e.department LIKE 'Satuan Pelayanan%' 
    OR e.department LIKE 'Satpel%' 
    OR e.department LIKE 'Workshop%'
  )
ORDER BY e.department, e.name;

-- ============================================================================
-- EXECUTE MIGRATION
-- ============================================================================

-- Update pegawai Non-ASN: pindahkan ke unit pembina dan set satuan_kerja_penugasan
UPDATE employees
SET 
  department = CASE 
    -- BBPVP Serang
    WHEN department IN ('Satuan Pelayanan Lubuklinggau', 'Satpel Lubuklinggau') THEN 'BBPVP Serang'
    WHEN department IN ('Satuan Pelayanan Lampung', 'Satpel Lampung') THEN 'BBPVP Serang'
    WHEN department IN ('Workshop Prabumulih') THEN 'BBPVP Serang'
    
    -- BBPVP Bekasi
    WHEN department IN ('Satuan Pelayanan Bengkulu', 'Satpel Bengkulu') THEN 'BBPVP Bekasi'
    WHEN department IN ('Satuan Pelayanan Kotawaringin Timur', 'Satpel Kotawaringin Timur') THEN 'BBPVP Bekasi'
    
    -- BBPVP Makassar
    WHEN department IN ('Satuan Pelayanan Majene', 'Satpel Majene') THEN 'BBPVP Makassar'
    WHEN department IN ('Satuan Pelayanan Mamuju', 'Satpel Mamuju') THEN 'BBPVP Makassar'
    WHEN department IN ('Satuan Pelayanan Palu', 'Satpel Palu') THEN 'BBPVP Makassar'
    WHEN department IN ('Satuan Pelayanan Morowali', 'Satpel Morowali') THEN 'BBPVP Makassar'
    WHEN department IN ('Satuan Pelayanan Morowali Utara', 'Satpel Morowali Utara') THEN 'BBPVP Makassar'
    WHEN department IN ('Workshop Gorontalo') THEN 'BBPVP Makassar'
    
    -- BBPVP Medan
    WHEN department IN ('Satuan Pelayanan Pekanbaru', 'Satpel Pekanbaru') THEN 'BBPVP Medan'
    WHEN department IN ('Workshop Batam') THEN 'BBPVP Medan'
    
    -- BPVP Surakarta
    WHEN department IN ('Satuan Pelayanan Bantul', 'Satpel Bantul') THEN 'BPVP Surakarta'
    
    -- BPVP Padang
    WHEN department IN ('Satuan Pelayanan Jambi', 'Satpel Jambi') THEN 'BPVP Padang'
    WHEN department IN ('Satuan Pelayanan Sawahlunto', 'Satpel Sawahlunto') THEN 'BPVP Padang'
    
    -- BPVP Lombok Timur
    WHEN department IN ('Satuan Pelayanan Kupang', 'Satpel Kupang') THEN 'BPVP Lombok Timur'
    WHEN department IN ('Satuan Pelayanan Bali', 'Satpel Bali') THEN 'BPVP Lombok Timur'
    
    -- BPVP Ternate
    WHEN department IN ('Satuan Pelayanan Sofifi', 'Satpel Sofifi') THEN 'BPVP Ternate'
    WHEN department IN ('Satuan Pelayanan Minahasa Utara', 'Satpel Minahasa Utara') THEN 'BPVP Ternate'
    WHEN department IN ('Satuan Pelayanan Halmahera Selatan', 'Satpel Halmahera Selatan') THEN 'BPVP Ternate'
    
    -- BPVP Sorong
    WHEN department IN ('Satuan Pelayanan Jayapura', 'Satpel Jayapura') THEN 'BPVP Sorong'
    
    -- BPVP Samarinda
    WHEN department IN ('Satuan Pelayanan Tanah Bumbu', 'Satpel Tanah Bumbu') THEN 'BPVP Samarinda'
    WHEN department IN ('Satuan Pelayanan Bulungan', 'Satpel Bulungan') THEN 'BPVP Samarinda'
  END,
  satuan_kerja_penugasan = CASE
    -- Normalize ke "Satuan Pelayanan" format
    WHEN department LIKE 'Satpel %' THEN REPLACE(department, 'Satpel ', 'Satuan Pelayanan ')
    ELSE department
  END,
  updated_at = NOW()
WHERE asn_status = 'Non ASN'
  AND is_active = true
  AND (
    department LIKE 'Satuan Pelayanan%' 
    OR department LIKE 'Satpel%' 
    OR department LIKE 'Workshop%'
  );

-- Verify hasil migrasi
SELECT 
  department,
  satuan_kerja_penugasan,
  COUNT(*) as jumlah
FROM employees
WHERE asn_status = 'Non ASN'
  AND is_active = true
  AND satuan_kerja_penugasan IS NOT NULL
GROUP BY department, satuan_kerja_penugasan
ORDER BY department, satuan_kerja_penugasan;
