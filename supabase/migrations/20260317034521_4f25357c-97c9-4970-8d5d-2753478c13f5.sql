
-- 1. Attach handle_new_user trigger to auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. Create position_references table
CREATE TABLE public.position_references (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  department varchar NOT NULL,
  position_category varchar NOT NULL,
  position_order integer DEFAULT 0,
  position_name varchar NOT NULL,
  grade integer,
  abk_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.position_references ENABLE ROW LEVEL SECURITY;

-- RLS: admin_pusat full access
CREATE POLICY "Admin pusat can manage all position references"
  ON public.position_references FOR ALL
  TO public
  USING (public.has_role(auth.uid(), 'admin_pusat'));

-- RLS: admin_unit can manage own department
CREATE POLICY "Admin unit can manage own dept position references"
  ON public.position_references FOR ALL
  TO public
  USING (public.has_role(auth.uid(), 'admin_unit') AND department::text = public.get_user_department(auth.uid())::text);

-- RLS: all authenticated can read
CREATE POLICY "Authenticated can view position references"
  ON public.position_references FOR SELECT
  TO authenticated
  USING (true);

-- Trigger for updated_at
CREATE TRIGGER update_position_references_updated_at
  BEFORE UPDATE ON public.position_references
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. Add keterangan columns to employees
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS keterangan_formasi varchar;
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS keterangan_penempatan varchar;
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS keterangan_penugasan varchar;
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS keterangan_perubahan varchar;
