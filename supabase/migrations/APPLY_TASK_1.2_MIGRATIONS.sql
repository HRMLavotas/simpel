-- ============================================================================
-- TASK 1.2: Database Migrations for Application Improvement Roadmap
-- ============================================================================
-- This file combines all three migrations for task 1.2:
-- 1. Create saved_filters table
-- 2. Create user_preferences table  
-- 3. Add performance indexes
--
-- Requirements: 3.12 (Saved Filters), 12.10 (Performance Indexes)
--
-- INSTRUCTIONS:
-- 1. Open Supabase Dashboard > SQL Editor
-- 2. Copy and paste this entire file
-- 3. Click "Run" to execute all migrations
-- ============================================================================

-- ============================================================================
-- MIGRATION 1: Create saved_filters table
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.saved_filters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  filters JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_saved_filters_user_id ON public.saved_filters(user_id);

ALTER TABLE public.saved_filters ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own saved filters" ON public.saved_filters;
CREATE POLICY "Users can view own saved filters"
  ON public.saved_filters FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own saved filters" ON public.saved_filters;
CREATE POLICY "Users can create own saved filters"
  ON public.saved_filters FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own saved filters" ON public.saved_filters;
CREATE POLICY "Users can update own saved filters"
  ON public.saved_filters FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own saved filters" ON public.saved_filters;
CREATE POLICY "Users can delete own saved filters"
  ON public.saved_filters FOR DELETE
  USING (auth.uid() = user_id);

DROP TRIGGER IF EXISTS update_saved_filters_updated_at ON public.saved_filters;
CREATE TRIGGER update_saved_filters_updated_at
  BEFORE UPDATE ON public.saved_filters
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

COMMENT ON TABLE public.saved_filters IS 'Stores user-defined filter configurations for quick access';
COMMENT ON COLUMN public.saved_filters.filters IS 'JSONB object containing filter configuration (query, rankGroup, positionType, etc.)';

-- ============================================================================
-- MIGRATION 2: Create user_preferences table
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  preferences JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON public.user_preferences(user_id);

ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own preferences" ON public.user_preferences;
CREATE POLICY "Users can view own preferences"
  ON public.user_preferences FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own preferences" ON public.user_preferences;
CREATE POLICY "Users can insert own preferences"
  ON public.user_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own preferences" ON public.user_preferences;
CREATE POLICY "Users can update own preferences"
  ON public.user_preferences FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own preferences" ON public.user_preferences;
CREATE POLICY "Users can delete own preferences"
  ON public.user_preferences FOR DELETE
  USING (auth.uid() = user_id);

DROP TRIGGER IF EXISTS update_user_preferences_updated_at ON public.user_preferences;
CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON public.user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

COMMENT ON TABLE public.user_preferences IS 'Stores user-specific application preferences including dashboard layout, default filters, theme, etc.';
COMMENT ON COLUMN public.user_preferences.preferences IS 'JSONB object containing user preferences: dashboard_layout, default_filters, items_per_page, theme, etc.';

-- ============================================================================
-- MIGRATION 3: Add performance indexes
-- ============================================================================

-- Enable pg_trgm extension for fuzzy/trigram search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Add trigram indexes for fuzzy text search on name and position fields
CREATE INDEX IF NOT EXISTS idx_employees_name_trgm 
  ON public.employees USING gin(name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_employees_position_name_trgm 
  ON public.employees USING gin(position_name gin_trgm_ops);

-- Add B-tree index for NIK if the column exists
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
CREATE INDEX IF NOT EXISTS idx_employees_position_type_department 
  ON public.employees(position_type, department);

CREATE INDEX IF NOT EXISTS idx_employees_asn_status_department 
  ON public.employees(asn_status, department);

CREATE INDEX IF NOT EXISTS idx_employees_rank_group_department 
  ON public.employees(rank_group, department);

CREATE INDEX IF NOT EXISTS idx_employees_join_date 
  ON public.employees(join_date);

-- Add indexes for other filterable fields if they exist
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'employees' 
    AND column_name = 'gender'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_employees_gender ON public.employees(gender);
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'employees' 
    AND column_name = 'religion'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_employees_religion ON public.employees(religion);
  END IF;

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

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================
-- Run these queries to verify the migrations were applied successfully:

-- Check saved_filters table
-- SELECT COUNT(*) as saved_filters_exists FROM information_schema.tables 
-- WHERE table_schema = 'public' AND table_name = 'saved_filters';

-- Check user_preferences table
-- SELECT COUNT(*) as user_preferences_exists FROM information_schema.tables 
-- WHERE table_schema = 'public' AND table_name = 'user_preferences';

-- Check indexes
-- SELECT indexname FROM pg_indexes 
-- WHERE schemaname = 'public' AND tablename = 'employees' 
-- AND indexname LIKE 'idx_employees_%'
-- ORDER BY indexname;

-- Check pg_trgm extension
-- SELECT * FROM pg_extension WHERE extname = 'pg_trgm';

-- ============================================================================
-- END OF MIGRATIONS
-- ============================================================================
