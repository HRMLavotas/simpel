-- Add rank (pangkat) column to employees table
-- This stores the detailed rank name (e.g., "Penata Muda", "Penata Muda Tingkat I")
-- while rank_group stores the grade (e.g., "III/a", "III/b")

ALTER TABLE public.employees
  ADD COLUMN IF NOT EXISTS rank VARCHAR(255);

COMMENT ON COLUMN public.employees.rank IS 'Pangkat lengkap pegawai (e.g., Penata Muda, Penata Muda Tingkat I)';

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_employees_rank ON public.employees(rank);

COMMENT ON INDEX idx_employees_rank IS 'Index for filtering employees by rank (pangkat)';
