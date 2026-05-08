-- Add satuan_kerja_penugasan column to employees table
ALTER TABLE public.employees
ADD COLUMN IF NOT EXISTS satuan_kerja_penugasan VARCHAR(255) DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.employees.satuan_kerja_penugasan IS 
'Nama Satpel/Workshop tempat pegawai secara fisik bertugas. NULL berarti bertugas langsung di unit pembina (department). Nilai harus sesuai dengan UNIT_PEMBINA_MAPPING di constants.ts.';

-- Add index for performance (filtering by satuan_kerja_penugasan in Peta Jabatan)
CREATE INDEX IF NOT EXISTS idx_employees_satuan_kerja_penugasan 
ON public.employees(satuan_kerja_penugasan) 
WHERE satuan_kerja_penugasan IS NOT NULL;

-- Add index for combined query (department + satuan_kerja_penugasan)
CREATE INDEX IF NOT EXISTS idx_employees_dept_satpel 
ON public.employees(department, satuan_kerja_penugasan) 
WHERE satuan_kerja_penugasan IS NOT NULL;
