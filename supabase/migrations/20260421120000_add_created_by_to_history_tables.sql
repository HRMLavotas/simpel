-- Add created_by column to all history tables
-- This tracks which user (admin unit/pusat) made the change

-- Add created_by to mutation_history
ALTER TABLE mutation_history 
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);

-- Add created_by to position_history
ALTER TABLE position_history 
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);

-- Add created_by to rank_history
ALTER TABLE rank_history 
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);

-- Add created_by to training_history
ALTER TABLE training_history 
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);

-- Add created_by to education_history
ALTER TABLE education_history 
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);

-- Add created_by to competency_test_history
ALTER TABLE competency_test_history 
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);

-- Add created_by to additional_position_history (if exists)
DO $$ 
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'additional_position_history'
  ) THEN
    ALTER TABLE additional_position_history 
    ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);
  END IF;
END $$;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_mutation_history_created_by ON mutation_history(created_by);
CREATE INDEX IF NOT EXISTS idx_position_history_created_by ON position_history(created_by);
CREATE INDEX IF NOT EXISTS idx_rank_history_created_by ON rank_history(created_by);
CREATE INDEX IF NOT EXISTS idx_training_history_created_by ON training_history(created_by);
CREATE INDEX IF NOT EXISTS idx_education_history_created_by ON education_history(created_by);
CREATE INDEX IF NOT EXISTS idx_competency_test_history_created_by ON competency_test_history(created_by);

COMMENT ON COLUMN mutation_history.created_by IS 'User (admin) who created this history record';
COMMENT ON COLUMN position_history.created_by IS 'User (admin) who created this history record';
COMMENT ON COLUMN rank_history.created_by IS 'User (admin) who created this history record';
COMMENT ON COLUMN training_history.created_by IS 'User (admin) who created this history record';
COMMENT ON COLUMN education_history.created_by IS 'User (admin) who created this history record';
COMMENT ON COLUMN competency_test_history.created_by IS 'User (admin) who created this history record';
