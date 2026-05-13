-- ============================================================================
-- DISCIPLINARY ACTIONS TABLE
-- Migration: Create dedicated table for employee disciplinary actions
-- Created: 2026-05-13
-- ============================================================================

-- ============================================================================
-- 1. CREATE DISCIPLINARY_ACTIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.disciplinary_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Reference to case
  case_id UUID NOT NULL REFERENCES public.employee_cases(id) ON DELETE CASCADE,
  
  -- Employee info (denormalized for quick access)
  employee_id TEXT NOT NULL,
  employee_name TEXT NOT NULL,
  employee_nip TEXT NOT NULL,
  
  -- Disciplinary action details
  level TEXT NOT NULL CHECK (level IN ('ringan', 'sedang', 'berat')),
  type TEXT NOT NULL,
  
  -- Decision details
  decision_number TEXT NOT NULL,
  decision_date DATE NOT NULL,
  effective_date DATE NOT NULL,
  end_date DATE,
  
  -- Authority and violation
  issued_by TEXT NOT NULL,
  violation TEXT NOT NULL,
  notes TEXT,
  
  -- Document
  document_link TEXT,
  
  -- Metadata
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 2. CREATE INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_disciplinary_actions_case_id 
  ON public.disciplinary_actions(case_id);

CREATE INDEX IF NOT EXISTS idx_disciplinary_actions_employee_id 
  ON public.disciplinary_actions(employee_id);

CREATE INDEX IF NOT EXISTS idx_disciplinary_actions_level 
  ON public.disciplinary_actions(level);

CREATE INDEX IF NOT EXISTS idx_disciplinary_actions_decision_date 
  ON public.disciplinary_actions(decision_date DESC);

CREATE INDEX IF NOT EXISTS idx_disciplinary_actions_created_at 
  ON public.disciplinary_actions(created_at DESC);

-- Composite index for employee + date range queries
CREATE INDEX IF NOT EXISTS idx_disciplinary_actions_employee_dates 
  ON public.disciplinary_actions(employee_id, decision_date DESC);

-- ============================================================================
-- 3. CREATE TRIGGER FOR UPDATED_AT
-- ============================================================================

CREATE OR REPLACE FUNCTION update_disciplinary_actions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_disciplinary_actions_updated_at
  BEFORE UPDATE ON public.disciplinary_actions
  FOR EACH ROW
  EXECUTE FUNCTION update_disciplinary_actions_updated_at();

-- ============================================================================
-- 4. ENABLE ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE public.disciplinary_actions ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 5. CREATE RLS POLICIES
-- ============================================================================

-- Admin Pusat: Full access to all disciplinary actions
CREATE POLICY "Admin Pusat can view all disciplinary actions"
  ON public.disciplinary_actions
  FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin_pusat'));

CREATE POLICY "Admin Pusat can insert disciplinary actions"
  ON public.disciplinary_actions
  FOR INSERT
  TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin_pusat'));

CREATE POLICY "Admin Pusat can update disciplinary actions"
  ON public.disciplinary_actions
  FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'admin_pusat'));

CREATE POLICY "Admin Pusat can delete disciplinary actions"
  ON public.disciplinary_actions
  FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'admin_pusat'));

-- Users with granted access: View disciplinary actions for cases they can access
CREATE POLICY "Users with access can view disciplinary actions"
  ON public.disciplinary_actions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.case_access_control
      WHERE case_access_control.user_id = auth.uid()
      AND case_access_control.can_view = true
    )
  );

-- ============================================================================
-- 6. GRANT PERMISSIONS
-- ============================================================================

GRANT ALL ON public.disciplinary_actions TO authenticated;

-- ============================================================================
-- 7. ADD COMMENTS
-- ============================================================================

COMMENT ON TABLE public.disciplinary_actions IS 
  'Stores disciplinary actions issued to employees based on PP 94/2021';

COMMENT ON COLUMN public.disciplinary_actions.level IS 
  'Tingkat hukuman: ringan, sedang, berat (PP 94/2021)';

COMMENT ON COLUMN public.disciplinary_actions.type IS 
  'Jenis hukuman spesifik berdasarkan tingkat';

COMMENT ON COLUMN public.disciplinary_actions.decision_number IS 
  'Nomor Surat Keputusan hukuman disiplin';

COMMENT ON COLUMN public.disciplinary_actions.effective_date IS 
  'Tanggal mulai berlaku hukuman';

COMMENT ON COLUMN public.disciplinary_actions.end_date IS 
  'Tanggal berakhir hukuman (optional, untuk hukuman dengan batas waktu)';

COMMENT ON COLUMN public.disciplinary_actions.issued_by IS 
  'Pejabat yang menetapkan hukuman (e.g., Kepala BKN, PPK)';

COMMENT ON COLUMN public.disciplinary_actions.violation IS 
  'Pelanggaran yang menjadi dasar hukuman disiplin';

-- ============================================================================
-- 8. CREATE HELPER VIEWS
-- ============================================================================

-- View: Active disciplinary actions (belum berakhir)
CREATE OR REPLACE VIEW public.active_disciplinary_actions AS
SELECT 
  da.*,
  ec.case_number,
  ec.case_type,
  ec.status as case_status
FROM public.disciplinary_actions da
JOIN public.employee_cases ec ON ec.id = da.case_id
WHERE da.end_date IS NULL 
   OR da.end_date >= CURRENT_DATE
ORDER BY da.decision_date DESC;

COMMENT ON VIEW public.active_disciplinary_actions IS 
  'Hukuman disiplin yang masih aktif (belum berakhir)';

-- View: Disciplinary actions summary by employee
CREATE OR REPLACE VIEW public.employee_disciplinary_summary AS
SELECT 
  employee_id,
  employee_name,
  employee_nip,
  COUNT(*) as total_actions,
  COUNT(*) FILTER (WHERE level = 'ringan') as ringan_count,
  COUNT(*) FILTER (WHERE level = 'sedang') as sedang_count,
  COUNT(*) FILTER (WHERE level = 'berat') as berat_count,
  MAX(decision_date) as latest_action_date,
  MAX(CASE WHEN end_date IS NULL OR end_date >= CURRENT_DATE THEN level END) as current_active_level
FROM public.disciplinary_actions
GROUP BY employee_id, employee_name, employee_nip;

COMMENT ON VIEW public.employee_disciplinary_summary IS 
  'Ringkasan hukuman disiplin per pegawai';

-- ============================================================================
-- 9. MIGRATION DATA FROM JSONB (if exists)
-- ============================================================================

-- Migrate existing disciplinary actions from case_details JSONB to new table
DO $$
DECLARE
  case_record RECORD;
  action_record JSONB;
BEGIN
  -- Loop through all cases with disciplinary actions in case_details
  FOR case_record IN 
    SELECT 
      id as case_id,
      employee_id,
      employee_name,
      employee_nip,
      case_details->'disciplinaryActions' as actions,
      created_by
    FROM employee_cases
    WHERE case_details->'disciplinaryActions' IS NOT NULL
      AND jsonb_array_length(case_details->'disciplinaryActions') > 0
  LOOP
    -- Loop through each disciplinary action in the array
    FOR action_record IN 
      SELECT * FROM jsonb_array_elements(case_record.actions)
    LOOP
      -- Insert into new table
      INSERT INTO public.disciplinary_actions (
        case_id,
        employee_id,
        employee_name,
        employee_nip,
        level,
        type,
        decision_number,
        decision_date,
        effective_date,
        end_date,
        issued_by,
        violation,
        notes,
        document_link,
        created_by,
        created_at
      ) VALUES (
        case_record.case_id,
        case_record.employee_id,
        case_record.employee_name,
        case_record.employee_nip,
        action_record->>'level',
        action_record->>'type',
        action_record->>'decisionNumber',
        (action_record->>'decisionDate')::DATE,
        (action_record->>'effectiveDate')::DATE,
        CASE 
          WHEN action_record->>'endDate' IS NOT NULL 
          THEN (action_record->>'endDate')::DATE 
          ELSE NULL 
        END,
        action_record->>'issuedBy',
        action_record->>'violation',
        action_record->>'notes',
        action_record->>'documentLink',
        case_record.created_by,
        COALESCE(
          (action_record->>'addedAt')::TIMESTAMPTZ,
          NOW()
        )
      )
      ON CONFLICT DO NOTHING;
    END LOOP;
  END LOOP;
  
  RAISE NOTICE 'Migration completed successfully';
END $$;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
