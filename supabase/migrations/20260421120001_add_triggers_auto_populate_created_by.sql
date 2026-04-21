-- Create triggers to auto-populate created_by with current user
-- This ensures all new history records track who created them

-- Function to set created_by to current user
CREATE OR REPLACE FUNCTION set_created_by()
RETURNS TRIGGER AS $$
BEGIN
  -- Only set if not already set (allows manual override if needed)
  IF NEW.created_by IS NULL THEN
    NEW.created_by := auth.uid();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for mutation_history
DROP TRIGGER IF EXISTS set_mutation_history_created_by ON mutation_history;
CREATE TRIGGER set_mutation_history_created_by
  BEFORE INSERT ON mutation_history
  FOR EACH ROW
  EXECUTE FUNCTION set_created_by();

-- Trigger for position_history
DROP TRIGGER IF EXISTS set_position_history_created_by ON position_history;
CREATE TRIGGER set_position_history_created_by
  BEFORE INSERT ON position_history
  FOR EACH ROW
  EXECUTE FUNCTION set_created_by();

-- Trigger for rank_history
DROP TRIGGER IF EXISTS set_rank_history_created_by ON rank_history;
CREATE TRIGGER set_rank_history_created_by
  BEFORE INSERT ON rank_history
  FOR EACH ROW
  EXECUTE FUNCTION set_created_by();

-- Trigger for training_history
DROP TRIGGER IF EXISTS set_training_history_created_by ON training_history;
CREATE TRIGGER set_training_history_created_by
  BEFORE INSERT ON training_history
  FOR EACH ROW
  EXECUTE FUNCTION set_created_by();

-- Trigger for education_history
DROP TRIGGER IF EXISTS set_education_history_created_by ON education_history;
CREATE TRIGGER set_education_history_created_by
  BEFORE INSERT ON education_history
  FOR EACH ROW
  EXECUTE FUNCTION set_created_by();

-- Trigger for competency_test_history
DROP TRIGGER IF EXISTS set_competency_test_history_created_by ON competency_test_history;
CREATE TRIGGER set_competency_test_history_created_by
  BEFORE INSERT ON competency_test_history
  FOR EACH ROW
  EXECUTE FUNCTION set_created_by();

-- Trigger for additional_position_history (if exists)
DO $$ 
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'additional_position_history'
  ) THEN
    EXECUTE 'DROP TRIGGER IF EXISTS set_additional_position_history_created_by ON additional_position_history';
    EXECUTE 'CREATE TRIGGER set_additional_position_history_created_by
      BEFORE INSERT ON additional_position_history
      FOR EACH ROW
      EXECUTE FUNCTION set_created_by()';
  END IF;
END $$;

COMMENT ON FUNCTION set_created_by IS 'Auto-populate created_by with current authenticated user ID';
