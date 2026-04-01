-- Add jabatan field to mutation_history table
-- This allows tracking position changes during mutations

ALTER TABLE public.mutation_history 
ADD COLUMN IF NOT EXISTS jabatan varchar;

COMMENT ON COLUMN public.mutation_history.jabatan IS 'Jabatan pegawai saat mutasi ke unit kerja baru';
