-- ============================================
-- Migration: Add data_builder_templates column
-- Date: 2026-04-07
-- Purpose: Enable save/load query templates in Data Builder
-- ============================================

-- Add data_builder_templates column to profiles table
-- Using IF NOT EXISTS to make it idempotent (safe to run multiple times)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'data_builder_templates'
    ) THEN
        ALTER TABLE profiles 
        ADD COLUMN data_builder_templates jsonb DEFAULT '[]'::jsonb;
        
        COMMENT ON COLUMN profiles.data_builder_templates IS 'User saved query templates for Data Builder stored as JSON array';
        
        RAISE NOTICE 'Column data_builder_templates added successfully';
    ELSE
        RAISE NOTICE 'Column data_builder_templates already exists';
    END IF;
END $$;

-- Verify the column was added
SELECT 
    column_name, 
    data_type, 
    column_default,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'profiles' 
  AND column_name = 'data_builder_templates';

-- Show sample of profiles table structure
SELECT 
    column_name,
    data_type,
    column_default
FROM information_schema.columns
WHERE table_name = 'profiles'
ORDER BY ordinal_position;
