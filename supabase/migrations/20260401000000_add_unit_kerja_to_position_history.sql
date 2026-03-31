-- Add unit_kerja column to position_history table
-- This allows tracking which unit/department the position was held in
-- Note: This does NOT affect employee.department (only mutation_history does)

ALTER TABLE position_history 
ADD COLUMN IF NOT EXISTS unit_kerja TEXT;

-- Add comment to clarify the purpose
COMMENT ON COLUMN position_history.unit_kerja IS 'Unit kerja tempat jabatan ini dipegang. Tidak mempengaruhi employee.department (hanya mutation_history yang mempengaruhi).';
