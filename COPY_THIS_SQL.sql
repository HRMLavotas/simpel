-- ============================================
-- COPY SQL INI KE SUPABASE DASHBOARD
-- ============================================
-- Migration: Add data_builder_templates column
-- Date: 2026-04-07
-- Purpose: Enable Query Templates feature in Data Builder
-- ============================================

-- Add column (IF NOT EXISTS makes it safe to run multiple times)
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS data_builder_templates jsonb DEFAULT '[]'::jsonb;

-- Add documentation comment
COMMENT ON COLUMN profiles.data_builder_templates IS 'User saved query templates for Data Builder stored as JSON array';

-- Verify column was added successfully
SELECT 
    column_name, 
    data_type, 
    column_default, 
    is_nullable
FROM information_schema.columns
WHERE table_name = 'profiles' 
  AND column_name = 'data_builder_templates';

-- ============================================
-- Expected Result:
-- ============================================
-- column_name              | data_type | column_default | is_nullable
-- -------------------------|-----------|----------------|-------------
-- data_builder_templates   | jsonb     | '[]'::jsonb    | YES
-- ============================================
-- If you see 1 row like above, SUCCESS! ✅
-- ============================================
