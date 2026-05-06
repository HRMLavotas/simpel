-- ============================================================================
-- Migration: Add Constraints and Validation to position_references
-- Purpose: Prevent duplicate positions and enforce proper categorization
-- Date: 2026-05-06
-- ============================================================================

-- 1. Add unique constraint to prevent duplicate position names per department
-- This ensures each position name can only appear once per department
ALTER TABLE position_references 
ADD CONSTRAINT unique_position_per_department 
UNIQUE (department, position_name);

-- 2. Add check constraint to ensure position_category is valid
ALTER TABLE position_references
ADD CONSTRAINT valid_position_category
CHECK (position_category IN ('Struktural', 'Fungsional', 'Pelaksana'));

-- 3. Create function to validate position categorization
-- This function checks if a position name matches fungsional keywords
-- but is categorized as Pelaksana
CREATE OR REPLACE FUNCTION validate_position_category()
RETURNS TRIGGER AS $$
DECLARE
  fungsional_keywords TEXT[] := ARRAY[
    'Instruktur',
    'Pranata',
    'Analis',
    'Penelaah',
    'Arsiparis',
    'Statistisi',
    'Pengantar Kerja',
    'Perencana'
  ];
  keyword TEXT;
BEGIN
  -- Check if position_name contains any fungsional keyword
  FOREACH keyword IN ARRAY fungsional_keywords
  LOOP
    IF NEW.position_name ILIKE '%' || keyword || '%' THEN
      -- If it's a fungsional name but categorized as Pelaksana, raise error
      IF NEW.position_category = 'Pelaksana' THEN
        RAISE EXCEPTION 'Jabatan "%" mengandung kata kunci fungsional "%" tetapi dikategorikan sebagai Pelaksana. Harap ubah kategori menjadi Fungsional.', 
          NEW.position_name, keyword;
      END IF;
    END IF;
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Create trigger to validate position category on INSERT and UPDATE
DROP TRIGGER IF EXISTS trigger_validate_position_category ON position_references;

CREATE TRIGGER trigger_validate_position_category
  BEFORE INSERT OR UPDATE ON position_references
  FOR EACH ROW
  EXECUTE FUNCTION validate_position_category();

-- 5. Add comment to table for documentation
COMMENT ON TABLE position_references IS 'Tabel referensi jabatan sesuai Kepmen 202 Tahun 2024. Memiliki constraint unique per department dan validasi kategori jabatan.';

COMMENT ON CONSTRAINT unique_position_per_department ON position_references IS 'Mencegah duplikasi nama jabatan dalam satu department';

COMMENT ON CONSTRAINT valid_position_category ON position_references IS 'Memastikan kategori jabatan hanya Struktural, Fungsional, atau Pelaksana';

-- 6. Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_position_references_department 
ON position_references(department);

CREATE INDEX IF NOT EXISTS idx_position_references_category 
ON position_references(position_category);

CREATE INDEX IF NOT EXISTS idx_position_references_name 
ON position_references(position_name);

-- ============================================================================
-- Verification Queries
-- ============================================================================

-- Check for any remaining duplicates (should return 0 rows)
SELECT 
  department,
  position_name,
  COUNT(*) as count
FROM position_references
GROUP BY department, position_name
HAVING COUNT(*) > 1
ORDER BY count DESC, department, position_name;

-- Check for miscategorized positions (should return 0 rows)
SELECT 
  id,
  department,
  position_name,
  position_category
FROM position_references
WHERE position_category = 'Pelaksana'
  AND (
    position_name ILIKE '%Instruktur%' OR
    position_name ILIKE '%Pranata%' OR
    position_name ILIKE '%Analis%' OR
    position_name ILIKE '%Penelaah%' OR
    position_name ILIKE '%Arsiparis%' OR
    position_name ILIKE '%Statistisi%' OR
    position_name ILIKE '%Pengantar Kerja%' OR
    position_name ILIKE '%Perencana%'
  )
ORDER BY department, position_name;

-- Summary statistics
SELECT 
  position_category,
  COUNT(*) as total_positions,
  COUNT(DISTINCT department) as departments_count
FROM position_references
GROUP BY position_category
ORDER BY position_category;

-- ============================================================================
-- Rollback Script (if needed)
-- ============================================================================

-- To rollback this migration, run:
/*
DROP TRIGGER IF EXISTS trigger_validate_position_category ON position_references;
DROP FUNCTION IF EXISTS validate_position_category();
ALTER TABLE position_references DROP CONSTRAINT IF EXISTS valid_position_category;
ALTER TABLE position_references DROP CONSTRAINT IF EXISTS unique_position_per_department;
DROP INDEX IF EXISTS idx_position_references_department;
DROP INDEX IF EXISTS idx_position_references_category;
DROP INDEX IF EXISTS idx_position_references_name;
*/
