-- Create tables for employee notes (keterangan)
-- These replace the single-value fields: keterangan_penempatan, keterangan_penugasan, keterangan_perubahan

-- Placement Notes (Keterangan Penempatan)
CREATE TABLE IF NOT EXISTS placement_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  note TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Assignment Notes (Keterangan Penugasan Tambahan)
CREATE TABLE IF NOT EXISTS assignment_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  note TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Change Notes (Keterangan Perubahan)
CREATE TABLE IF NOT EXISTS change_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  note TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_placement_notes_employee_id ON placement_notes(employee_id);
CREATE INDEX IF NOT EXISTS idx_assignment_notes_employee_id ON assignment_notes(employee_id);
CREATE INDEX IF NOT EXISTS idx_change_notes_employee_id ON change_notes(employee_id);

-- Enable RLS (Row Level Security)
ALTER TABLE placement_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignment_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE change_notes ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Allow authenticated users to read all notes
CREATE POLICY "Allow authenticated users to read placement notes"
  ON placement_notes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to read assignment notes"
  ON assignment_notes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to read change notes"
  ON change_notes FOR SELECT
  TO authenticated
  USING (true);

-- RLS Policies: Allow authenticated users to insert/update/delete notes
CREATE POLICY "Allow authenticated users to insert placement notes"
  ON placement_notes FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update placement notes"
  ON placement_notes FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to delete placement notes"
  ON placement_notes FOR DELETE
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert assignment notes"
  ON assignment_notes FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update assignment notes"
  ON assignment_notes FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to delete assignment notes"
  ON assignment_notes FOR DELETE
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert change notes"
  ON change_notes FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update change notes"
  ON change_notes FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to delete change notes"
  ON change_notes FOR DELETE
  TO authenticated
  USING (true);

-- Migrate existing data from old single-value fields to new tables
-- Only migrate non-empty values
INSERT INTO placement_notes (employee_id, note)
SELECT id, keterangan_penempatan
FROM employees
WHERE keterangan_penempatan IS NOT NULL AND keterangan_penempatan != '';

INSERT INTO assignment_notes (employee_id, note)
SELECT id, keterangan_penugasan
FROM employees
WHERE keterangan_penugasan IS NOT NULL AND keterangan_penugasan != '';

INSERT INTO change_notes (employee_id, note)
SELECT id, keterangan_perubahan
FROM employees
WHERE keterangan_perubahan IS NOT NULL AND keterangan_perubahan != '';

-- Note: We keep the old columns in employees table for backward compatibility
-- They can be removed later after confirming the migration is successful
-- ALTER TABLE employees DROP COLUMN keterangan_formasi;
-- ALTER TABLE employees DROP COLUMN keterangan_penempatan;
-- ALTER TABLE employees DROP COLUMN keterangan_penugasan;
-- ALTER TABLE employees DROP COLUMN keterangan_perubahan;
