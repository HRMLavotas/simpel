-- Populate history tables and notes from current employee data
-- This creates initial history records based on current employee state

-- ============================================
-- 1. POPULATE MUTATION HISTORY (Riwayat Mutasi)
-- ============================================
-- Create mutation history record for current unit kerja
-- Only for employees who have a department and don't already have mutation history

INSERT INTO mutation_history (employee_id, tanggal, ke_unit, keterangan)
SELECT 
  e.id,
  COALESCE(e.join_date, e.created_at::date, CURRENT_DATE) as tanggal,
  e.department as ke_unit,
  'Data awal - Unit kerja saat ini' as keterangan
FROM employees e
WHERE e.department IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM mutation_history mh 
    WHERE mh.employee_id = e.id
  );

-- ============================================
-- 2. POPULATE RANK HISTORY (Riwayat Kenaikan Pangkat)
-- ============================================
-- Create rank history record for current pangkat/golongan
-- Only for employees who have rank_group and don't already have rank history

INSERT INTO rank_history (employee_id, tanggal, pangkat_baru, tmt, keterangan)
SELECT 
  e.id,
  COALESCE(e.tmt_cpns, e.join_date, e.created_at::date, CURRENT_DATE) as tanggal,
  e.rank_group as pangkat_baru,
  COALESCE(e.tmt_cpns, e.join_date, e.created_at::date, CURRENT_DATE) as tmt,
  'Data awal - Pangkat/Golongan saat ini' as keterangan
FROM employees e
WHERE e.rank_group IS NOT NULL
  AND e.rank_group != ''
  AND e.rank_group != 'Tidak Ada'
  AND NOT EXISTS (
    SELECT 1 FROM rank_history rh 
    WHERE rh.employee_id = e.id
  );

-- ============================================
-- 3. POPULATE POSITION HISTORY (Riwayat Jabatan)
-- ============================================
-- Create position history record for current jabatan sesuai Kepmen
-- Only for employees who have position_name and don't already have position history

INSERT INTO position_history (employee_id, tanggal, jabatan_baru, keterangan)
SELECT 
  e.id,
  COALESCE(e.join_date, e.created_at::date, CURRENT_DATE) as tanggal,
  e.position_name as jabatan_baru,
  'Data awal - Jabatan sesuai Kepmen 202/2024 saat ini' as keterangan
FROM employees e
WHERE e.position_name IS NOT NULL
  AND e.position_name != ''
  AND NOT EXISTS (
    SELECT 1 FROM position_history ph 
    WHERE ph.employee_id = e.id
  );

-- ============================================
-- 4. VERIFY RESULTS
-- ============================================

-- Check how many records were created
SELECT 
  'mutation_history' as table_name,
  COUNT(*) as records_created
FROM mutation_history
WHERE keterangan LIKE 'Data awal%'

UNION ALL

SELECT 
  'rank_history' as table_name,
  COUNT(*) as records_created
FROM rank_history
WHERE keterangan LIKE 'Data awal%'

UNION ALL

SELECT 
  'position_history' as table_name,
  COUNT(*) as records_created
FROM position_history
WHERE keterangan LIKE 'Data awal%'

UNION ALL

SELECT 
  'placement_notes' as table_name,
  COUNT(*) as records_migrated
FROM placement_notes

UNION ALL

SELECT 
  'assignment_notes' as table_name,
  COUNT(*) as records_migrated
FROM assignment_notes

UNION ALL

SELECT 
  'change_notes' as table_name,
  COUNT(*) as records_migrated
FROM change_notes;

-- Sample data check
SELECT 
  e.name,
  e.department,
  mh.tanggal as mutasi_tanggal,
  mh.ke_unit as mutasi_ke_unit
FROM employees e
LEFT JOIN mutation_history mh ON e.id = mh.employee_id
WHERE mh.keterangan LIKE 'Data awal%'
LIMIT 5;

SELECT 
  e.name,
  e.rank_group,
  rh.tanggal as rank_tanggal,
  rh.pangkat_baru
FROM employees e
LEFT JOIN rank_history rh ON e.id = rh.employee_id
WHERE rh.keterangan LIKE 'Data awal%'
LIMIT 5;

SELECT 
  e.name,
  e.position_name,
  ph.tanggal as position_tanggal,
  ph.jabatan_baru
FROM employees e
LEFT JOIN position_history ph ON e.id = ph.employee_id
WHERE ph.keterangan LIKE 'Data awal%'
LIMIT 5;
