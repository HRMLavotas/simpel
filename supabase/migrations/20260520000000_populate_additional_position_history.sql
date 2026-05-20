-- Migration: Populate additional_position_history with current data
-- Created: 2026-05-20
-- Purpose: Create initial history entries for all employees with additional_position

-- Insert initial history entries for employees who have additional_position but no history yet
INSERT INTO additional_position_history (
  employee_id,
  tanggal,
  jabatan_tambahan_lama,
  jabatan_tambahan_baru,
  nomor_sk,
  tmt,
  keterangan,
  created_at,
  updated_at
)
SELECT 
  e.id as employee_id,
  COALESCE(e.created_at::date, CURRENT_DATE) as tanggal,
  '' as jabatan_tambahan_lama,
  e.additional_position as jabatan_tambahan_baru,
  NULL as nomor_sk,
  COALESCE(e.created_at::date, CURRENT_DATE) as tmt,
  'Data awal - Auto-populated from existing data' as keterangan,
  NOW() as created_at,
  NOW() as updated_at
FROM employees e
WHERE 
  -- Employee has additional_position
  e.additional_position IS NOT NULL 
  AND e.additional_position != ''
  -- But no history record exists yet
  AND NOT EXISTS (
    SELECT 1 
    FROM additional_position_history aph 
    WHERE aph.employee_id = e.id
  );

-- Log the result
DO $$
DECLARE
  inserted_count INTEGER;
BEGIN
  GET DIAGNOSTICS inserted_count = ROW_COUNT;
  RAISE NOTICE 'Inserted % initial history entries for employees with additional_position', inserted_count;
END $$;
