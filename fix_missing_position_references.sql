-- Script untuk menambahkan semua jabatan yang hilang di position_references
-- Berdasarkan data pegawai aktif yang ada

-- Step 1: Identifikasi jabatan yang hilang
WITH employee_positions AS (
  SELECT DISTINCT 
    e.department,
    e.position_name,
    COUNT(*) as jumlah_pegawai
  FROM employees e
  WHERE e.is_active = true 
    AND e.position_name IS NOT NULL 
    AND e.position_name != ''
    AND (e.asn_status IS NULL OR e.asn_status != 'Non ASN')
  GROUP BY e.department, e.position_name
),
missing_positions AS (
  SELECT 
    ep.department,
    ep.position_name,
    ep.jumlah_pegawai
  FROM employee_positions ep
  LEFT JOIN position_references pr 
    ON ep.department = pr.department 
    AND ep.position_name = pr.position_name
  WHERE pr.id IS NULL
),
-- Tentukan kategori jabatan berdasarkan nama
categorized_positions AS (
  SELECT 
    department,
    position_name,
    jumlah_pegawai,
    CASE 
      -- Struktural
      WHEN position_name ILIKE '%kepala%' OR position_name ILIKE '%direktur%' OR position_name ILIKE '%sekretaris%' THEN 'Struktural'
      -- Fungsional (Instruktur, Penelaah, Analis, dll)
      WHEN position_name ILIKE '%instruktur%' OR position_name ILIKE '%penelaah%' OR position_name ILIKE '%analis%' 
        OR position_name ILIKE '%perancang%' OR position_name ILIKE '%penyuluh%' OR position_name ILIKE '%widyaiswara%'
        OR position_name ILIKE '%pranata%' OR position_name ILIKE '%arsiparis%' OR position_name ILIKE '%pustakawan%' THEN 'Fungsional'
      -- Pelaksana (sisanya)
      ELSE 'Pelaksana'
    END as position_category,
    CASE 
      -- Grade berdasarkan jenjang
      WHEN position_name ILIKE '%utama%' THEN 12
      WHEN position_name ILIKE '%madya%' THEN 11
      WHEN position_name ILIKE '%muda%' THEN 9
      WHEN position_name ILIKE '%pertama%' THEN 7
      WHEN position_name ILIKE '%mahir%' THEN 9
      WHEN position_name ILIKE '%terampil%' THEN 7
      WHEN position_name ILIKE '%ahli%' THEN 9
      WHEN position_name ILIKE '%penyelia%' THEN 7
      WHEN position_name ILIKE '%penata%' THEN 7
      WHEN position_name ILIKE '%pengolah%' THEN 6
      WHEN position_name ILIKE '%pengadministrasi%' THEN 5
      WHEN position_name ILIKE '%operator%' THEN 5
      WHEN position_name ILIKE '%teknisi%' THEN 7
      ELSE 7  -- Default untuk Fungsional/Pelaksana
    END as grade
  FROM missing_positions
),
-- Hitung position_order per kategori per department
ordered_positions AS (
  SELECT 
    cp.*,
    ROW_NUMBER() OVER (PARTITION BY cp.department, cp.position_category ORDER BY cp.position_name) + 
    COALESCE((
      SELECT MAX(pr.position_order) 
      FROM position_references pr 
      WHERE pr.department = cp.department 
        AND pr.position_category = cp.position_category
    ), 0) as position_order
  FROM categorized_positions cp
)
-- Insert jabatan yang hilang
INSERT INTO position_references (department, position_category, position_name, grade, abk_count, position_order)
SELECT 
  department,
  position_category,
  position_name,
  grade,
  jumlah_pegawai as abk_count,
  position_order
FROM ordered_positions
RETURNING department, position_category, position_name, grade, abk_count, position_order;
