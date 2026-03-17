-- Add new columns to employees table
ALTER TABLE public.employees
  ADD COLUMN IF NOT EXISTS birth_place varchar,
  ADD COLUMN IF NOT EXISTS birth_date date,
  ADD COLUMN IF NOT EXISTS gender varchar,
  ADD COLUMN IF NOT EXISTS religion varchar,
  ADD COLUMN IF NOT EXISTS front_title varchar,
  ADD COLUMN IF NOT EXISTS back_title varchar,
  ADD COLUMN IF NOT EXISTS tmt_cpns date,
  ADD COLUMN IF NOT EXISTS tmt_pns date,
  ADD COLUMN IF NOT EXISTS tmt_pensiun date;

-- Create education_history table
CREATE TABLE public.education_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  level varchar NOT NULL,
  institution_name varchar,
  major varchar,
  graduation_year integer,
  front_title varchar,
  back_title varchar,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.education_history ENABLE ROW LEVEL SECURITY;

-- RLS policies for education_history mirroring employees
CREATE POLICY "Admin pusat can view all education history"
ON public.education_history FOR SELECT
USING (has_role(auth.uid(), 'admin_pusat'::app_role));

CREATE POLICY "Admin pusat can insert education history"
ON public.education_history FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin_pusat'::app_role));

CREATE POLICY "Admin pusat can update education history"
ON public.education_history FOR UPDATE
USING (has_role(auth.uid(), 'admin_pusat'::app_role));

CREATE POLICY "Admin pusat can delete education history"
ON public.education_history FOR DELETE
USING (has_role(auth.uid(), 'admin_pusat'::app_role));

CREATE POLICY "Admin unit can view own dept education history"
ON public.education_history FOR SELECT
USING (
  has_role(auth.uid(), 'admin_unit'::app_role)
  AND employee_id IN (
    SELECT id FROM public.employees
    WHERE department = get_user_department(auth.uid())
  )
);

CREATE POLICY "Admin unit can insert own dept education history"
ON public.education_history FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'admin_unit'::app_role)
  AND employee_id IN (
    SELECT id FROM public.employees
    WHERE department = get_user_department(auth.uid())
  )
);

CREATE POLICY "Admin unit can update own dept education history"
ON public.education_history FOR UPDATE
USING (
  has_role(auth.uid(), 'admin_unit'::app_role)
  AND employee_id IN (
    SELECT id FROM public.employees
    WHERE department = get_user_department(auth.uid())
  )
);

CREATE POLICY "Admin unit can delete own dept education history"
ON public.education_history FOR DELETE
USING (
  has_role(auth.uid(), 'admin_unit'::app_role)
  AND employee_id IN (
    SELECT id FROM public.employees
    WHERE department = get_user_department(auth.uid())
  )
);

-- Trigger for updated_at
CREATE TRIGGER update_education_history_updated_at
BEFORE UPDATE ON public.education_history
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();