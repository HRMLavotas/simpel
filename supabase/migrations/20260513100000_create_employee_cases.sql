-- ============================================================================
-- EMPLOYEE CASE MANAGEMENT SYSTEM
-- Migration: Create tables for employee case management
-- Created: 2026-05-13
-- ============================================================================

-- ============================================================================
-- 1. CREATE EMPLOYEE_CASES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.employee_cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_number TEXT UNIQUE,
  
  -- Employee Information (no foreign key constraint for flexibility)
  employee_id TEXT NOT NULL, -- Changed from UUID to TEXT, no FK constraint
  employee_name TEXT NOT NULL,
  employee_nip TEXT NOT NULL,
  
  -- Case Information
  case_type TEXT NOT NULL CHECK (case_type IN (
    'disiplin', 'kinerja', 'etika', 'administrasi', 'hukum', 'kesehatan', 'lainnya'
  )),
  status TEXT NOT NULL DEFAULT 'baru' CHECK (status IN (
    'baru', 'diproses', 'tertunda', 'selesai', 'ditutup'
  )),
  severity TEXT CHECK (severity IN (
    'ringan', 'sedang', 'berat', 'sangat_berat'
  )),
  description TEXT NOT NULL,
  report_date DATE NOT NULL DEFAULT CURRENT_DATE,
  
  -- Case Details (JSONB for flexible schema per case type)
  case_details JSONB DEFAULT '{}'::jsonb,
  
  -- Metadata
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 2. CREATE CASE_TIMELINE TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.case_timeline (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES public.employee_cases(id) ON DELETE CASCADE,
  
  -- Timeline Information
  date DATE NOT NULL,
  description TEXT NOT NULL,
  status TEXT,
  
  -- Legacy fields (for backward compatibility)
  involved_parties TEXT,
  document_link TEXT,
  document_name TEXT,
  
  -- New structured fields
  involved_parties_list JSONB DEFAULT '[]'::jsonb,
  documents JSONB DEFAULT '[]'::jsonb,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 3. CREATE CASE_ACCESS_CONTROL TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.case_access_control (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- User Information
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL,
  user_role TEXT NOT NULL,
  
  -- Permissions
  can_edit BOOLEAN NOT NULL DEFAULT false,
  can_view BOOLEAN NOT NULL DEFAULT true,
  
  -- Metadata
  granted_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Ensure one access record per user
  UNIQUE(user_id)
);

-- ============================================================================
-- 4. CREATE INDEXES
-- ============================================================================

-- Employee Cases Indexes
CREATE INDEX IF NOT EXISTS idx_employee_cases_employee_id ON public.employee_cases(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_cases_case_type ON public.employee_cases(case_type);
CREATE INDEX IF NOT EXISTS idx_employee_cases_status ON public.employee_cases(status);
CREATE INDEX IF NOT EXISTS idx_employee_cases_created_by ON public.employee_cases(created_by);
CREATE INDEX IF NOT EXISTS idx_employee_cases_report_date ON public.employee_cases(report_date DESC);
CREATE INDEX IF NOT EXISTS idx_employee_cases_created_at ON public.employee_cases(created_at DESC);

-- Case Timeline Indexes
CREATE INDEX IF NOT EXISTS idx_case_timeline_case_id ON public.case_timeline(case_id);
CREATE INDEX IF NOT EXISTS idx_case_timeline_date ON public.case_timeline(date DESC);

-- Case Access Control Indexes
CREATE INDEX IF NOT EXISTS idx_case_access_control_user_id ON public.case_access_control(user_id);

-- ============================================================================
-- 5. CREATE TRIGGERS FOR UPDATED_AT
-- ============================================================================

-- Trigger for employee_cases
CREATE OR REPLACE FUNCTION update_employee_cases_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_employee_cases_updated_at
  BEFORE UPDATE ON public.employee_cases
  FOR EACH ROW
  EXECUTE FUNCTION update_employee_cases_updated_at();

-- Trigger for case_timeline
CREATE OR REPLACE FUNCTION update_case_timeline_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_case_timeline_updated_at
  BEFORE UPDATE ON public.case_timeline
  FOR EACH ROW
  EXECUTE FUNCTION update_case_timeline_updated_at();

-- ============================================================================
-- 6. ENABLE ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE public.employee_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_timeline ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_access_control ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 7. CREATE RLS POLICIES
-- ============================================================================

-- ============================================================================
-- EMPLOYEE_CASES POLICIES
-- ============================================================================

-- Admin Pusat: Full access to all cases
CREATE POLICY "Admin Pusat can view all cases"
  ON public.employee_cases
  FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin_pusat'));

CREATE POLICY "Admin Pusat can insert cases"
  ON public.employee_cases
  FOR INSERT
  TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin_pusat'));

CREATE POLICY "Admin Pusat can update cases"
  ON public.employee_cases
  FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'admin_pusat'));

CREATE POLICY "Admin Pusat can delete cases"
  ON public.employee_cases
  FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'admin_pusat'));

-- Users with granted access: View only (if can_view = true)
CREATE POLICY "Users with access can view cases"
  ON public.employee_cases
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.case_access_control
      WHERE case_access_control.user_id = auth.uid()
      AND case_access_control.can_view = true
    )
  );

-- Users with edit permission: Can update cases
CREATE POLICY "Users with edit permission can update cases"
  ON public.employee_cases
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.case_access_control
      WHERE case_access_control.user_id = auth.uid()
      AND case_access_control.can_edit = true
    )
  );

-- ============================================================================
-- CASE_TIMELINE POLICIES
-- ============================================================================

-- Admin Pusat: Full access to all timeline items
CREATE POLICY "Admin Pusat can view all timeline items"
  ON public.case_timeline
  FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin_pusat'));

CREATE POLICY "Admin Pusat can insert timeline items"
  ON public.case_timeline
  FOR INSERT
  TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin_pusat'));

CREATE POLICY "Admin Pusat can update timeline items"
  ON public.case_timeline
  FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'admin_pusat'));

CREATE POLICY "Admin Pusat can delete timeline items"
  ON public.case_timeline
  FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'admin_pusat'));

-- Users with granted access: View timeline items
CREATE POLICY "Users with access can view timeline items"
  ON public.case_timeline
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.case_access_control
      JOIN public.employee_cases ON employee_cases.id = case_timeline.case_id
      WHERE case_access_control.user_id = auth.uid()
      AND case_access_control.can_view = true
    )
  );

-- Users with edit permission: Can manage timeline items
CREATE POLICY "Users with edit permission can insert timeline items"
  ON public.case_timeline
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.case_access_control
      WHERE case_access_control.user_id = auth.uid()
      AND case_access_control.can_edit = true
    )
  );

CREATE POLICY "Users with edit permission can update timeline items"
  ON public.case_timeline
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.case_access_control
      WHERE case_access_control.user_id = auth.uid()
      AND case_access_control.can_edit = true
    )
  );

CREATE POLICY "Users with edit permission can delete timeline items"
  ON public.case_timeline
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.case_access_control
      WHERE case_access_control.user_id = auth.uid()
      AND case_access_control.can_edit = true
    )
  );

-- ============================================================================
-- CASE_ACCESS_CONTROL POLICIES
-- ============================================================================

-- Admin Pusat: Full access to manage access control
CREATE POLICY "Admin Pusat can view all access control"
  ON public.case_access_control
  FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin_pusat'));

CREATE POLICY "Admin Pusat can insert access control"
  ON public.case_access_control
  FOR INSERT
  TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin_pusat'));

CREATE POLICY "Admin Pusat can update access control"
  ON public.case_access_control
  FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'admin_pusat'));

CREATE POLICY "Admin Pusat can delete access control"
  ON public.case_access_control
  FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'admin_pusat'));

-- Users can view their own access
CREATE POLICY "Users can view their own access"
  ON public.case_access_control
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- ============================================================================
-- 8. CREATE HELPER FUNCTIONS
-- ============================================================================

-- Function to generate case number
CREATE OR REPLACE FUNCTION generate_case_number()
RETURNS TEXT AS $$
DECLARE
  new_number TEXT;
  date_part TEXT;
  random_part TEXT;
BEGIN
  date_part := TO_CHAR(NOW(), 'YYYYMMDD');
  random_part := LPAD(FLOOR(RANDOM() * 100000)::TEXT, 5, '0');
  new_number := 'CASE-' || date_part || '-' || random_part;
  RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Function to auto-generate case number on insert
CREATE OR REPLACE FUNCTION auto_generate_case_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.case_number IS NULL THEN
    NEW.case_number := generate_case_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_generate_case_number
  BEFORE INSERT ON public.employee_cases
  FOR EACH ROW
  EXECUTE FUNCTION auto_generate_case_number();

-- ============================================================================
-- 9. GRANT PERMISSIONS
-- ============================================================================

-- Grant usage on tables
GRANT ALL ON public.employee_cases TO authenticated;
GRANT ALL ON public.case_timeline TO authenticated;
GRANT ALL ON public.case_access_control TO authenticated;

-- ============================================================================
-- 10. ADD COMMENTS
-- ============================================================================

COMMENT ON TABLE public.employee_cases IS 'Stores employee case information including disciplinary, performance, legal, and other cases';
COMMENT ON TABLE public.case_timeline IS 'Stores timeline of actions taken for each case';
COMMENT ON TABLE public.case_access_control IS 'Manages user access permissions for case management system';

COMMENT ON COLUMN public.employee_cases.case_details IS 'JSONB field storing case-specific details based on case_type';
COMMENT ON COLUMN public.case_timeline.involved_parties_list IS 'JSONB array of involved parties with their roles';
COMMENT ON COLUMN public.case_timeline.documents IS 'JSONB array of supporting documents with names and links';

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
