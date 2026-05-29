-- =============================================
-- Konversi Status CPNS → PNS per 1 Mei 2026
-- Semua pegawai CPNS dilantik bersamaan pada
-- tanggal 1 Mei 2026 (TMT PNS: 2026-05-01)
-- =============================================

-- 1. Cek jumlah pegawai CPNS yang akan diupdate (untuk verifikasi)
DO $$
DECLARE
  cpns_count INT;
BEGIN
  SELECT COUNT(*) INTO cpns_count
  FROM employees
  WHERE asn_status = 'CPNS'
    AND is_active = true;

  RAISE NOTICE 'Jumlah pegawai CPNS aktif yang akan dikonversi ke PNS: %', cpns_count;
END $$;

-- 2. Update status CPNS → PNS dan set TMT PNS = 2026-05-01
UPDATE employees
SET
  asn_status = 'PNS',
  tmt_pns    = '2026-05-01',
  updated_at = NOW()
WHERE asn_status = 'CPNS'
  AND is_active = true;

-- 3. Verifikasi hasil update
DO $$
DECLARE
  updated_count INT;
  remaining_cpns INT;
BEGIN
  SELECT COUNT(*) INTO updated_count
  FROM employees
  WHERE asn_status = 'PNS'
    AND tmt_pns = '2026-05-01';

  SELECT COUNT(*) INTO remaining_cpns
  FROM employees
  WHERE asn_status = 'CPNS';

  RAISE NOTICE 'Pegawai berhasil dikonversi ke PNS dengan TMT 2026-05-01: %', updated_count;
  RAISE NOTICE 'Sisa pegawai dengan status CPNS: %', remaining_cpns;
END $$;

-- 4. Tampilkan daftar pegawai yang diupdate (untuk audit)
SELECT
  nip,
  name,
  department,
  rank_group,
  tmt_cpns,
  tmt_pns,
  asn_status
FROM employees
WHERE asn_status = 'PNS'
  AND tmt_pns = '2026-05-01'
ORDER BY department, name;
