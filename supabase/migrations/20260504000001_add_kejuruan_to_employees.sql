-- Add kejuruan (vocational specialty) column to employees table
-- This field is only relevant for Instruktur positions

ALTER TABLE public.employees
ADD COLUMN IF NOT EXISTS kejuruan VARCHAR(100);

COMMENT ON COLUMN public.employees.kejuruan IS 'Kejuruan instruktur (hanya diisi jika jabatan adalah Instruktur), contoh: Otomotif, TIK, Las, Manufaktur';
