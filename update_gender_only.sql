-- Update gender saja terlebih dahulu (paling aman)
UPDATE employees
SET 
  gender = CASE SUBSTRING(REPLACE(nip, ' ', ''), 15, 1)
    WHEN '1' THEN 'Laki-laki'
    WHEN '2' THEN 'Perempuan'
  END,
  updated_at = NOW()
WHERE 
  nip IS NOT NULL 
  AND LENGTH(REPLACE(nip, ' ', '')) = 18
  AND (gender IS NULL OR gender = '')
  AND SUBSTRING(REPLACE(nip, ' ', ''), 15, 1) IN ('1', '2');
