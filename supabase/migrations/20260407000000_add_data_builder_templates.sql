-- Add data_builder_templates column to profiles table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'data_builder_templates'
  ) THEN
    ALTER TABLE profiles 
    ADD COLUMN data_builder_templates jsonb DEFAULT '[]'::jsonb;
    
    COMMENT ON COLUMN profiles.data_builder_templates IS 'User saved query templates for Data Builder stored as JSON array';
  END IF;
END $$;
