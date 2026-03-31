-- Add import_order column to preserve Excel import order
ALTER TABLE public.employees 
ADD COLUMN IF NOT EXISTS import_order INTEGER;

COMMENT ON COLUMN public.employees.import_order IS 'Urutan pegawai saat import dari Excel (untuk mempertahankan urutan asli)';

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_employees_import_order ON public.employees(import_order);
CREATE INDEX IF NOT EXISTS idx_employees_position_type ON public.employees(position_type);
