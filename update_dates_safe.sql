-- Update birth_date dan tmt_cpns dengan TRY-CATCH menggunakan exception handling
DO $$
DECLARE
  rec RECORD;
  birth_str TEXT;
  tmt_str TEXT;
  birth_val DATE;
  tmt_val DATE;
  updated_count INT := 0;
  skipped_count INT := 0;
BEGIN
  FOR rec IN 
    SELECT id, nip, name
    FROM employees
    WHERE nip IS NOT NULL 
      AND LENGTH(REPLACE(nip, ' ', '')) = 18
      AND (birth_date IS NULL OR tmt_cpns IS NULL)
  LOOP
    BEGIN
      -- Extract birth date string
      birth_str := SUBSTRING(REPLACE(rec.nip, ' ', ''), 1, 4) || '-' || 
                   SUBSTRING(REPLACE(rec.nip, ' ', ''), 5, 2) || '-' || 
                   SUBSTRING(REPLACE(rec.nip, ' ', ''), 7, 2);
      
      -- Extract TMT CPNS string
      tmt_str := SUBSTRING(REPLACE(rec.nip, ' ', ''), 9, 4) || '-' || 
                 SUBSTRING(REPLACE(rec.nip, ' ', ''), 13, 2) || '-01';
      
      -- Try to convert to date (will raise exception if invalid)
      birth_val := birth_str::DATE;
      tmt_val := tmt_str::DATE;
      
      -- Validate: birth_date must be before tmt_cpns
      IF birth_val >= tmt_val THEN
        RAISE NOTICE 'SKIP: % (%) - Birth date >= TMT CPNS', rec.name, rec.nip;
        skipped_count := skipped_count + 1;
        CONTINUE;
      END IF;
      
      -- Update if validations pass
      UPDATE employees
      SET 
        birth_date = COALESCE(birth_date, birth_val),
        tmt_cpns = COALESCE(tmt_cpns, tmt_val),
        updated_at = NOW()
      WHERE id = rec.id;
      
      updated_count := updated_count + 1;
      
      IF updated_count % 100 = 0 THEN
        RAISE NOTICE 'Progress: % records updated', updated_count;
      END IF;
      
    EXCEPTION
      WHEN OTHERS THEN
        RAISE NOTICE 'SKIP: % (%) - Invalid date format: %', rec.name, rec.nip, SQLERRM;
        skipped_count := skipped_count + 1;
    END;
  END LOOP;
  
  RAISE NOTICE '===========================================';
  RAISE NOTICE 'COMPLETED: % records updated, % skipped', updated_count, skipped_count;
  RAISE NOTICE '===========================================';
END $$;
