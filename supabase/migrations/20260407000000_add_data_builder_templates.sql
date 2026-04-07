-- Add data_builder_templates column to profiles table
ALTER TABLE profiles 
ADD COLUMN data_builder_templates jsonb DEFAULT '[]'::jsonb;

-- Add comment
COMMENT ON COLUMN profiles.data_builder_templates IS 'User saved query templates for Data Builder stored as JSON array';
