-- =============================================
-- Add Additional Position (Jabatan Tambahan)
-- Field untuk jabatan tambahan di luar jabatan sesuai Kepmen
-- =============================================

-- 1. Add additional_position column to employees table
ALTER TABLE employees 
ADD COLUMN IF NOT EXISTS additional_position VARCHAR(255);

-- Add comment
COMMENT ON COLUMN employees.additional_position IS 'Jabatan tambahan di luar jabatan sesuai Kepmen (opsional), contoh: Subkoordinator Bidang Data dan Informasi';

-- 2. Create additional_position_history table
CREATE TABLE IF NOT EXISTS additional_position_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  tanggal DATE,
  jabatan_tambahan_lama VARCHAR(255),
  jabatan_tambahan_baru VARCHAR(255),
  nomor_sk VARCHAR(255),
  tmt DATE,
  keterangan TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add comment
COMMENT ON TABLE additional_position_history IS 'Riwayat perubahan jabatan tambahan pegawai';
COMMENT ON COLUMN additional_position_history.employee_id IS 'ID pegawai (foreign key ke employees)';
COMMENT ON COLUMN additional_position_history.tanggal IS 'Tanggal perubahan jabatan tambahan';
COMMENT ON COLUMN additional_position_history.jabatan_tambahan_lama IS 'Jabatan tambahan sebelumnya';
COMMENT ON COLUMN additional_position_history.jabatan_tambahan_baru IS 'Jabatan tambahan yang baru';
COMMENT ON COLUMN additional_position_history.nomor_sk IS 'Nomor SK pengangkatan jabatan tambahan';
COMMENT ON COLUMN additional_position_history.tmt IS 'Tanggal Mulai Tugas (TMT) jabatan tambahan';
COMMENT ON COLUMN additional_position_history.keterangan IS 'Keterangan tambahan';

-- 3. Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_additional_position_history_employee_id 
  ON additional_position_history(employee_id);

CREATE INDEX IF NOT EXISTS idx_additional_position_history_tanggal 
  ON additional_position_history(tanggal);

-- 4. Add trigger to auto-update updated_at
CREATE TRIGGER update_additional_position_history_updated_at
  BEFORE UPDATE ON additional_position_history
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 5. Enable RLS (Row Level Security)
ALTER TABLE additional_position_history ENABLE ROW LEVEL SECURITY;

-- 6. Create RLS policies for additional_position_history

-- Policy: Admin Pusat can view all
CREATE POLICY "Admin Pusat can view all additional position history"
  ON additional_position_history
  FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin_pusat') OR has_role(auth.uid(), 'admin_pimpinan'));

-- Policy: Admin Unit can view their department's history
CREATE POLICY "Admin Unit can view their department additional position history"
  ON additional_position_history
  FOR SELECT
  TO authenticated
  USING (
    has_role(auth.uid(), 'admin_unit') 
    AND employee_id IN (
      SELECT id FROM employees 
      WHERE department = get_user_department(auth.uid())
    )
  );

-- Policy: Admin Pusat and Admin Unit can insert
CREATE POLICY "Admin can insert additional position history"
  ON additional_position_history
  FOR INSERT
  TO authenticated
  WITH CHECK (
    has_role(auth.uid(), 'admin_pusat') 
    OR has_role(auth.uid(), 'admin_unit')
    OR has_role(auth.uid(), 'admin_pimpinan')
  );

-- Policy: Admin Pusat and Admin Unit can update
CREATE POLICY "Admin can update additional position history"
  ON additional_position_history
  FOR UPDATE
  TO authenticated
  USING (
    has_role(auth.uid(), 'admin_pusat') 
    OR has_role(auth.uid(), 'admin_unit')
    OR has_role(auth.uid(), 'admin_pimpinan')
  );

-- Policy: Admin Pusat and Admin Unit can delete
CREATE POLICY "Admin can delete additional position history"
  ON additional_position_history
  FOR DELETE
  TO authenticated
  USING (
    has_role(auth.uid(), 'admin_pusat') 
    OR has_role(auth.uid(), 'admin_unit')
    OR has_role(auth.uid(), 'admin_pimpinan')
  );

-- 7. Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON additional_position_history TO authenticated;
