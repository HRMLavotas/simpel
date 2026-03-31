-- Add position_sk column to employees table to store "Jabatan Sesuai SK"
-- position_name will continue to store "Jabatan Sesuai Kepmen 202 Tahun 2024"

ALTER TABLE public.employees 
ADD COLUMN IF NOT EXISTS position_sk VARCHAR(255);

COMMENT ON COLUMN public.employees.position_sk IS 'Jabatan Sesuai SK - jabatan spesifik/tugas aktual pegawai';
COMMENT ON COLUMN public.employees.position_name IS 'Jabatan Sesuai Kepmen 202 Tahun 2024 - jabatan standar/klasifikasi';
