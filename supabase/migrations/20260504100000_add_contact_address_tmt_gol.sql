-- =============================================
-- Add contact info, address, and tmt_gol columns to employees
-- Data source: DAFTAR-PEGAWAI-2026-05-04 Excel
-- =============================================

ALTER TABLE public.employees
  ADD COLUMN IF NOT EXISTS address TEXT,
  ADD COLUMN IF NOT EXISTS phone VARCHAR(50),
  ADD COLUMN IF NOT EXISTS mobile_phone VARCHAR(50),
  ADD COLUMN IF NOT EXISTS tmt_gol DATE;

COMMENT ON COLUMN public.employees.address IS 'Alamat tempat tinggal pegawai';
COMMENT ON COLUMN public.employees.phone IS 'Nomor telepon rumah/kantor pegawai';
COMMENT ON COLUMN public.employees.mobile_phone IS 'Nomor HP/handphone pegawai';
COMMENT ON COLUMN public.employees.tmt_gol IS 'Tanggal Mulai Tugas (TMT) golongan/pangkat terakhir';
