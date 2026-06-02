-- ============================================================================
-- USULAN UJIKOM PEGAWAI - Database Tables and RLS Policies
-- ============================================================================
-- Task 1.1: Create database tables and indexes
-- Task 1.2: Implement Row Level Security (RLS) policies
-- Requirements: 1, 7, 11
-- ============================================================================

-- ============================================================================
-- PART 1: CREATE MAIN TABLE - usulan_ujikom
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.usulan_ujikom (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Foreign Keys
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE RESTRICT,
  position_reference_id UUID NOT NULL REFERENCES public.position_references(id) ON DELETE RESTRICT,
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Proposal Information (denormalized for quick access)
  department VARCHAR(255) NOT NULL,
  jabatan_target VARCHAR(255) NOT NULL,
  employee_name VARCHAR(255) NOT NULL,
  employee_nip VARCHAR(18),
  
  -- Status and Workflow
  status VARCHAR(50) NOT NULL DEFAULT 'Draft',
  queue_position INTEGER,
  
  -- Documents
  surat_pengantar_url TEXT,
  surat_pengantar_path TEXT,
  link_dokumen_persyaratan TEXT,
  
  -- Admin Pusat Actions
  cancellation_reason TEXT,
  feedback_notes TEXT,
  admin_notes TEXT,
  
  -- Metadata
  submitted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Constraints
  CONSTRAINT valid_status CHECK (status IN (
    'Draft', 'Waiting_List', 'Diajukan', 'Verifikasi_Berkas',
    'Proses_Ujikom', 'Lulus_Ujikom', 'Tidak_Lulus_Ujikom', 'Dibatalkan'
  )),
  CONSTRAINT queue_position_required CHECK (
    (status = 'Waiting_List' AND queue_position IS NOT NULL) OR
    (status != 'Waiting_List' AND queue_position IS NULL)
  ),
  CONSTRAINT cancellation_reason_required CHECK (
    (status = 'Dibatalkan' AND cancellation_reason IS NOT NULL) OR
    (status != 'Dibatalkan')
  )
);

-- ============================================================================
-- PART 2: CREATE INDEXES FOR usulan_ujikom
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_usulan_ujikom_employee 
  ON public.usulan_ujikom(employee_id);

CREATE INDEX IF NOT EXISTS idx_usulan_ujikom_position 
  ON public.usulan_ujikom(position_reference_id);

CREATE INDEX IF NOT EXISTS idx_usulan_ujikom_department 
  ON public.usulan_ujikom(department);

CREATE INDEX IF NOT EXISTS idx_usulan_ujikom_status 
  ON public.usulan_ujikom(status);

CREATE INDEX IF NOT EXISTS idx_usulan_ujikom_waiting_queue 
  ON public.usulan_ujikom(position_reference_id, status, queue_position) 
  WHERE status = 'Waiting_List';

CREATE INDEX IF NOT EXISTS idx_usulan_ujikom_submitted 
  ON public.usulan_ujikom(submitted_at DESC);

CREATE INDEX IF NOT EXISTS idx_usulan_ujikom_creator 
  ON public.usulan_ujikom(creator_id);

-- ============================================================================
-- PART 3: CREATE AUDIT TABLE - usulan_ujikom_status_history
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.usulan_ujikom_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usulan_ujikom_id UUID NOT NULL REFERENCES public.usulan_ujikom(id) ON DELETE CASCADE,
  
  -- Status Change
  previous_status VARCHAR(50),
  new_status VARCHAR(50) NOT NULL,
  
  -- Actor Information
  changed_by_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  changed_by_name VARCHAR(255),
  changed_by_role VARCHAR(50),
  
  -- Additional Information
  notes TEXT,
  
  -- Timestamp
  created_at TIMESTAMPTZ DEFAULT now(),
  
  -- Constraints
  CONSTRAINT valid_previous_status CHECK (previous_status IN (
    'Draft', 'Waiting_List', 'Diajukan', 'Verifikasi_Berkas',
    'Proses_Ujikom', 'Lulus_Ujikom', 'Tidak_Lulus_Ujikom', 'Dibatalkan'
  ) OR previous_status IS NULL),
  CONSTRAINT valid_new_status CHECK (new_status IN (
    'Draft', 'Waiting_List', 'Diajukan', 'Verifikasi_Berkas',
    'Proses_Ujikom', 'Lulus_Ujikom', 'Tidak_Lulus_Ujikom', 'Dibatalkan'
  ))
);

-- ============================================================================
-- PART 4: CREATE INDEX FOR STATUS HISTORY
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_status_history_usulan 
  ON public.usulan_ujikom_status_history(usulan_ujikom_id, created_at DESC);

-- ============================================================================
-- PART 5: CREATE TRIGGER FOR updated_at
-- ============================================================================

-- Create trigger for automatic updated_at timestamp (idempotent)
DROP TRIGGER IF EXISTS update_usulan_ujikom_updated_at ON public.usulan_ujikom;
CREATE TRIGGER update_usulan_ujikom_updated_at
  BEFORE UPDATE ON public.usulan_ujikom
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- PART 6: ADD TABLE COMMENTS
-- ============================================================================

COMMENT ON TABLE public.usulan_ujikom IS 
  'Stores employee competency test (ujikom) proposals for functional position promotions';

COMMENT ON TABLE public.usulan_ujikom_status_history IS 
  'Audit trail for all status changes in usulan ujikom';

COMMENT ON COLUMN public.usulan_ujikom.status IS 
  'Current status of the proposal: Draft, Waiting_List, Diajukan, Verifikasi_Berkas, Proses_Ujikom, Lulus_Ujikom, Tidak_Lulus_Ujikom, Dibatalkan';

COMMENT ON COLUMN public.usulan_ujikom.queue_position IS 
  'Position in waiting queue when status is Waiting_List';

COMMENT ON COLUMN public.usulan_ujikom.surat_pengantar_url IS 
  'Public URL to access the uploaded surat pengantar document';

COMMENT ON COLUMN public.usulan_ujikom.link_dokumen_persyaratan IS 
  'External URL link to supporting documents (Google Drive, OneDrive, etc)';

-- ============================================================================
-- PART 7: ENABLE ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE public.usulan_ujikom ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usulan_ujikom_status_history ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PART 8: RLS POLICIES FOR usulan_ujikom TABLE
-- ============================================================================

-- Policy 1: Admin Pusat can manage all usulan (full access)
DROP POLICY IF EXISTS "Admin pusat can manage all usulan" ON public.usulan_ujikom;
CREATE POLICY "Admin pusat can manage all usulan"
  ON public.usulan_ujikom FOR ALL
  TO public
  USING (public.has_role(auth.uid(), 'admin_pusat'));

-- Policy 2: Admin Unit can view their department's usulan
DROP POLICY IF EXISTS "Admin unit can view own department usulan" ON public.usulan_ujikom;
CREATE POLICY "Admin unit can view own department usulan"
  ON public.usulan_ujikom FOR SELECT
  TO public
  USING (
    public.has_role(auth.uid(), 'admin_unit') 
    AND department = public.get_user_department(auth.uid())
  );

-- Policy 3: Admin Unit can create usulan for their department
DROP POLICY IF EXISTS "Admin unit can create own department usulan" ON public.usulan_ujikom;
CREATE POLICY "Admin unit can create own department usulan"
  ON public.usulan_ujikom FOR INSERT
  TO public
  WITH CHECK (
    public.has_role(auth.uid(), 'admin_unit') 
    AND department = public.get_user_department(auth.uid())
    AND creator_id = auth.uid()
  );

-- Policy 4: Admin Unit can update Draft and Waiting_List usulan they created
DROP POLICY IF EXISTS "Admin unit can update draft and waiting usulan" ON public.usulan_ujikom;
CREATE POLICY "Admin unit can update draft and waiting usulan"
  ON public.usulan_ujikom FOR UPDATE
  TO public
  USING (
    public.has_role(auth.uid(), 'admin_unit') 
    AND department = public.get_user_department(auth.uid())
    AND creator_id = auth.uid()
    AND status IN ('Draft', 'Waiting_List')
  );

-- Policy 5: Admin Unit can delete Draft usulan they created
DROP POLICY IF EXISTS "Admin unit can delete draft usulan" ON public.usulan_ujikom;
CREATE POLICY "Admin unit can delete draft usulan"
  ON public.usulan_ujikom FOR DELETE
  TO public
  USING (
    public.has_role(auth.uid(), 'admin_unit') 
    AND department = public.get_user_department(auth.uid())
    AND creator_id = auth.uid()
    AND status = 'Draft'
  );

-- ============================================================================
-- PART 9: RLS POLICIES FOR usulan_ujikom_status_history TABLE
-- ============================================================================

-- Policy 1: Admin Pusat can view all status history
DROP POLICY IF EXISTS "Admin pusat can view all status history" 
  ON public.usulan_ujikom_status_history;
CREATE POLICY "Admin pusat can view all status history"
  ON public.usulan_ujikom_status_history FOR SELECT
  TO public
  USING (public.has_role(auth.uid(), 'admin_pusat'));

-- Policy 2: Admin Unit can view their department's status history
DROP POLICY IF EXISTS "Admin unit can view own department status history" 
  ON public.usulan_ujikom_status_history;
CREATE POLICY "Admin unit can view own department status history"
  ON public.usulan_ujikom_status_history FOR SELECT
  TO public
  USING (
    public.has_role(auth.uid(), 'admin_unit') 
    AND EXISTS (
      SELECT 1 FROM public.usulan_ujikom u
      WHERE u.id = usulan_ujikom_id
      AND u.department = public.get_user_department(auth.uid())
    )
  );

-- Policy 3: Authenticated users can insert status history (for system operations)
DROP POLICY IF EXISTS "Authenticated can insert status history" 
  ON public.usulan_ujikom_status_history;
CREATE POLICY "Authenticated can insert status history"
  ON public.usulan_ujikom_status_history FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- ============================================================================
-- PART 10: GRANT PERMISSIONS
-- ============================================================================

-- Grant usage on tables to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON public.usulan_ujikom TO authenticated;
GRANT SELECT, INSERT ON public.usulan_ujikom_status_history TO authenticated;

-- Grant sequence permissions if needed
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Verify tables were created
-- SELECT table_name, table_type 
-- FROM information_schema.tables 
-- WHERE table_schema = 'public' 
-- AND table_name LIKE 'usulan_ujikom%'
-- ORDER BY table_name;

-- Verify indexes were created
-- SELECT indexname, indexdef 
-- FROM pg_indexes 
-- WHERE schemaname = 'public' 
-- AND tablename = 'usulan_ujikom'
-- ORDER BY indexname;

-- Verify RLS is enabled
-- SELECT tablename, rowsecurity 
-- FROM pg_tables 
-- WHERE schemaname = 'public' 
-- AND tablename LIKE 'usulan_ujikom%';

-- Verify policies were created
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd 
-- FROM pg_policies 
-- WHERE schemaname = 'public' 
-- AND tablename LIKE 'usulan_ujikom%'
-- ORDER BY tablename, policyname;

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
