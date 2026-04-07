-- Add performance indexes for employee search and filtering
-- Requirement 12.10: Performance Optimization - Database Indexes

-- Enable pg_trgm extension for fuzzy/trigram search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Add trigram indexes for fuzzy text search on name and position fields
-- These indexes enable fast ILIKE queries and similarity searches
CREATE INDEX IF NOT EXISTS idx_employees_name_trgm 
  ON public.employees USING gin(name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_employees_position_name_trgm 
  ON public.employees USING gin(position_name gin_trgm_ops);

-- Add B-tree indexes for exact match searches on NIP and NIK
-- Note: NIP already has an index from the initial migration (idx_employees_nip)
-- Adding NIK index if the column exists (it may be added in other migrations)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'employees' 
    AND column_name = 'nik'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_employees_nik ON public.employees(nik);
  END IF;
END $$;

-- Add composite indexes for common filter combinations
-- These speed up queries that filter by multiple columns simultaneously

-- Index for filtering by position type and department
CREATE INDEX IF NOT EXISTS idx_employees_position_type_department 
  ON public.employees(position_type, department);

-- Index for filtering by ASN status and department
CREATE INDEX IF NOT EXISTS idx_employees_asn_status_department 
  ON public.employees(asn_status, department);

-- Index for filtering by rank group and department
CREATE INDEX IF NOT EXISTS idx_employees_rank_group_department 
  ON public.employees(rank_group, department);

-- Index for filtering by join date (for year range filters)
CREATE INDEX IF NOT EXISTS idx_employees_join_date 
  ON public.employees(join_date);

-- Add indexes for other filterable fields if they exist
DO $$
BEGIN
  -- Index for gender if column exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'employees' 
    AND column_name = 'gender'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_employees_gender ON public.employees(gender);
  END IF;

  -- Index for religion if column exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'employees' 
    AND column_name = 'religion'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_employees_religion ON public.employees(religion);
  END IF;

  -- Index for education level if column exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'employees' 
    AND column_name = 'education_level'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_employees_education_level ON public.employees(education_level);
  END IF;
END $$;

-- Add comments
COMMENT ON INDEX idx_employees_name_trgm IS 'Trigram index for fuzzy search on employee names';
COMMENT ON INDEX idx_employees_position_name_trgm IS 'Trigram index for fuzzy search on position names';
COMMENT ON INDEX idx_employees_position_type_department IS 'Composite index for filtering by position type and department';
COMMENT ON INDEX idx_employees_asn_status_department IS 'Composite index for filtering by ASN status and department';
COMMENT ON INDEX idx_employees_rank_group_department IS 'Composite index for filtering by rank group and department';
COMMENT ON INDEX idx_employees_join_date IS 'Index for filtering by join date (year range filters)';
