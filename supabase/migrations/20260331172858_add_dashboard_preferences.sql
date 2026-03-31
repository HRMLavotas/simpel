-- Add dashboard_preferences column to profiles table
ALTER TABLE profiles 
ADD COLUMN dashboard_preferences jsonb DEFAULT '["asn_status", "rank", "position_type", "join_year"]'::jsonb;

-- Add comment
COMMENT ON COLUMN profiles.dashboard_preferences IS 'User dashboard chart preferences stored as JSON array';
