-- Mutation history
CREATE TABLE public.mutation_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  tanggal date,
  dari_unit varchar,
  ke_unit varchar,
  nomor_sk varchar,
  keterangan text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Position history
CREATE TABLE public.position_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  tanggal date,
  jabatan_lama varchar,
  jabatan_baru varchar,
  nomor_sk varchar,
  keterangan text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Rank history
CREATE TABLE public.rank_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  tanggal date,
  pangkat_lama varchar,
  pangkat_baru varchar,
  nomor_sk varchar,
  tmt date,
  keterangan text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Competency test history
CREATE TABLE public.competency_test_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  tanggal date,
  jenis_uji varchar,
  hasil varchar,
  keterangan text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Training history
CREATE TABLE public.training_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  tanggal_mulai date,
  tanggal_selesai date,
  nama_diklat varchar,
  penyelenggara varchar,
  sertifikat varchar,
  keterangan text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.mutation_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.position_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rank_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competency_test_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_history ENABLE ROW LEVEL SECURITY;

-- Updated_at triggers
CREATE TRIGGER update_mutation_history_updated_at BEFORE UPDATE ON public.mutation_history FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_position_history_updated_at BEFORE UPDATE ON public.position_history FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_rank_history_updated_at BEFORE UPDATE ON public.rank_history FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_competency_test_history_updated_at BEFORE UPDATE ON public.competency_test_history FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_training_history_updated_at BEFORE UPDATE ON public.training_history FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS policies for all 5 tables (same pattern as education_history)
-- mutation_history
CREATE POLICY "Admin pusat can view all mutation history" ON public.mutation_history FOR SELECT USING (has_role(auth.uid(), 'admin_pusat'));
CREATE POLICY "Admin pusat can insert mutation history" ON public.mutation_history FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin_pusat'));
CREATE POLICY "Admin pusat can update mutation history" ON public.mutation_history FOR UPDATE USING (has_role(auth.uid(), 'admin_pusat'));
CREATE POLICY "Admin pusat can delete mutation history" ON public.mutation_history FOR DELETE USING (has_role(auth.uid(), 'admin_pusat'));
CREATE POLICY "Admin unit can view own dept mutation history" ON public.mutation_history FOR SELECT USING (has_role(auth.uid(), 'admin_unit') AND employee_id IN (SELECT id FROM employees WHERE department = get_user_department(auth.uid())));
CREATE POLICY "Admin unit can insert own dept mutation history" ON public.mutation_history FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin_unit') AND employee_id IN (SELECT id FROM employees WHERE department = get_user_department(auth.uid())));
CREATE POLICY "Admin unit can update own dept mutation history" ON public.mutation_history FOR UPDATE USING (has_role(auth.uid(), 'admin_unit') AND employee_id IN (SELECT id FROM employees WHERE department = get_user_department(auth.uid())));
CREATE POLICY "Admin unit can delete own dept mutation history" ON public.mutation_history FOR DELETE USING (has_role(auth.uid(), 'admin_unit') AND employee_id IN (SELECT id FROM employees WHERE department = get_user_department(auth.uid())));

-- position_history
CREATE POLICY "Admin pusat can view all position history" ON public.position_history FOR SELECT USING (has_role(auth.uid(), 'admin_pusat'));
CREATE POLICY "Admin pusat can insert position history" ON public.position_history FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin_pusat'));
CREATE POLICY "Admin pusat can update position history" ON public.position_history FOR UPDATE USING (has_role(auth.uid(), 'admin_pusat'));
CREATE POLICY "Admin pusat can delete position history" ON public.position_history FOR DELETE USING (has_role(auth.uid(), 'admin_pusat'));
CREATE POLICY "Admin unit can view own dept position history" ON public.position_history FOR SELECT USING (has_role(auth.uid(), 'admin_unit') AND employee_id IN (SELECT id FROM employees WHERE department = get_user_department(auth.uid())));
CREATE POLICY "Admin unit can insert own dept position history" ON public.position_history FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin_unit') AND employee_id IN (SELECT id FROM employees WHERE department = get_user_department(auth.uid())));
CREATE POLICY "Admin unit can update own dept position history" ON public.position_history FOR UPDATE USING (has_role(auth.uid(), 'admin_unit') AND employee_id IN (SELECT id FROM employees WHERE department = get_user_department(auth.uid())));
CREATE POLICY "Admin unit can delete own dept position history" ON public.position_history FOR DELETE USING (has_role(auth.uid(), 'admin_unit') AND employee_id IN (SELECT id FROM employees WHERE department = get_user_department(auth.uid())));

-- rank_history
CREATE POLICY "Admin pusat can view all rank history" ON public.rank_history FOR SELECT USING (has_role(auth.uid(), 'admin_pusat'));
CREATE POLICY "Admin pusat can insert rank history" ON public.rank_history FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin_pusat'));
CREATE POLICY "Admin pusat can update rank history" ON public.rank_history FOR UPDATE USING (has_role(auth.uid(), 'admin_pusat'));
CREATE POLICY "Admin pusat can delete rank history" ON public.rank_history FOR DELETE USING (has_role(auth.uid(), 'admin_pusat'));
CREATE POLICY "Admin unit can view own dept rank history" ON public.rank_history FOR SELECT USING (has_role(auth.uid(), 'admin_unit') AND employee_id IN (SELECT id FROM employees WHERE department = get_user_department(auth.uid())));
CREATE POLICY "Admin unit can insert own dept rank history" ON public.rank_history FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin_unit') AND employee_id IN (SELECT id FROM employees WHERE department = get_user_department(auth.uid())));
CREATE POLICY "Admin unit can update own dept rank history" ON public.rank_history FOR UPDATE USING (has_role(auth.uid(), 'admin_unit') AND employee_id IN (SELECT id FROM employees WHERE department = get_user_department(auth.uid())));
CREATE POLICY "Admin unit can delete own dept rank history" ON public.rank_history FOR DELETE USING (has_role(auth.uid(), 'admin_unit') AND employee_id IN (SELECT id FROM employees WHERE department = get_user_department(auth.uid())));

-- competency_test_history
CREATE POLICY "Admin pusat can view all competency test history" ON public.competency_test_history FOR SELECT USING (has_role(auth.uid(), 'admin_pusat'));
CREATE POLICY "Admin pusat can insert competency test history" ON public.competency_test_history FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin_pusat'));
CREATE POLICY "Admin pusat can update competency test history" ON public.competency_test_history FOR UPDATE USING (has_role(auth.uid(), 'admin_pusat'));
CREATE POLICY "Admin pusat can delete competency test history" ON public.competency_test_history FOR DELETE USING (has_role(auth.uid(), 'admin_pusat'));
CREATE POLICY "Admin unit can view own dept competency test history" ON public.competency_test_history FOR SELECT USING (has_role(auth.uid(), 'admin_unit') AND employee_id IN (SELECT id FROM employees WHERE department = get_user_department(auth.uid())));
CREATE POLICY "Admin unit can insert own dept competency test history" ON public.competency_test_history FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin_unit') AND employee_id IN (SELECT id FROM employees WHERE department = get_user_department(auth.uid())));
CREATE POLICY "Admin unit can update own dept competency test history" ON public.competency_test_history FOR UPDATE USING (has_role(auth.uid(), 'admin_unit') AND employee_id IN (SELECT id FROM employees WHERE department = get_user_department(auth.uid())));
CREATE POLICY "Admin unit can delete own dept competency test history" ON public.competency_test_history FOR DELETE USING (has_role(auth.uid(), 'admin_unit') AND employee_id IN (SELECT id FROM employees WHERE department = get_user_department(auth.uid())));

-- training_history
CREATE POLICY "Admin pusat can view all training history" ON public.training_history FOR SELECT USING (has_role(auth.uid(), 'admin_pusat'));
CREATE POLICY "Admin pusat can insert training history" ON public.training_history FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin_pusat'));
CREATE POLICY "Admin pusat can update training history" ON public.training_history FOR UPDATE USING (has_role(auth.uid(), 'admin_pusat'));
CREATE POLICY "Admin pusat can delete training history" ON public.training_history FOR DELETE USING (has_role(auth.uid(), 'admin_pusat'));
CREATE POLICY "Admin unit can view own dept training history" ON public.training_history FOR SELECT USING (has_role(auth.uid(), 'admin_unit') AND employee_id IN (SELECT id FROM employees WHERE department = get_user_department(auth.uid())));
CREATE POLICY "Admin unit can insert own dept training history" ON public.training_history FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin_unit') AND employee_id IN (SELECT id FROM employees WHERE department = get_user_department(auth.uid())));
CREATE POLICY "Admin unit can update own dept training history" ON public.training_history FOR UPDATE USING (has_role(auth.uid(), 'admin_unit') AND employee_id IN (SELECT id FROM employees WHERE department = get_user_department(auth.uid())));
CREATE POLICY "Admin unit can delete own dept training history" ON public.training_history FOR DELETE USING (has_role(auth.uid(), 'admin_unit') AND employee_id IN (SELECT id FROM employees WHERE department = get_user_department(auth.uid())));

-- Enable realtime for new tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.mutation_history;
ALTER PUBLICATION supabase_realtime ADD TABLE public.position_history;
ALTER PUBLICATION supabase_realtime ADD TABLE public.rank_history;
ALTER PUBLICATION supabase_realtime ADD TABLE public.competency_test_history;
ALTER PUBLICATION supabase_realtime ADD TABLE public.training_history;