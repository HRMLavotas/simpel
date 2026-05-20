-- Migration: Add education_level and education_major columns to employees table
-- Date: 2026-05-20
-- Description: Add education fields to support Non-ASN education data in main form

-- Add education_level column
ALTER TABLE public.employees 
ADD COLUMN IF NOT EXISTS education_level varchar(100);

-- Add education_major column  
ALTER TABLE public.employees 
ADD COLUMN IF NOT EXISTS education_major varchar(255);

-- Add comment for documentation
COMMENT ON COLUMN public.employees.education_level IS 'Pendidikan terakhir pegawai (SD, SMP, SMA, D1, D2, D3, D4, S1, S2, S3)';
COMMENT ON COLUMN public.employees.education_major IS 'Jurusan/program studi pendidikan terakhir';

-- Populate education_level and education_major from latest education_history
-- This ensures existing data is synced
UPDATE public.employees e
SET 
  education_level = eh.level,
  education_major = eh.major
FROM (
  SELECT DISTINCT ON (employee_id)
    employee_id,
    level,
    major
  FROM public.education_history
  ORDER BY employee_id, graduation_year DESC NULLS LAST, created_at DESC
) eh
WHERE e.id = eh.employee_id
  AND (e.education_level IS NULL OR e.education_major IS NULL);
