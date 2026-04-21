-- Update data dari NIP PPPK (format berbeda dengan PNS)
-- Format NIP PPPK 18 digit: 19890225 2024 21 1 013
-- 8 digit: Tanggal lahir (YYYYMMDD) - 19890225
-- 4 digit: Tahun pengangkatan (YYYY) - 2024
-- 2 digit: Kode PPPK (21 = penanda PPPK, bukan bulan!)
-- 1 digit: Jenis kelamin (1=Pria, 2=Wanita) - 1
-- 3 digit: Nomor urut - 013

DO $$
DECLARE
  rec RECORD;
  birth_str TEXT;
  tmt_str TEXT;
  gender_code TEXT;
  birth_val DATE;
  tmt_val DATE;
  gender_val TEXT;
  updated_count INT := 0;
  skipped_count INT := 0;
BEGIN
  FOR rec IN 
    SELECT id, nip, name, asn_status
    FROM employees
    WHERE nip IS NOT NULL 
      AND LENGTH(REPLACE(nip, ' ', '')) = 18
      AND (birth_date IS NULL OR tmt_cpns IS NULL)
      -- Filter untuk NIP dengan bulan > 12 (kemungkinan PPPK)
      AND (
        CAST(SUBSTRING(REPLACE(nip, ' ', ''), 13, 2) AS INTEGER) > 12
        OR CAST(SUBSTRING(REPLACE(nip, ' ', ''), 5, 2) AS INTEGER) > 12
      )
  LOOP
    BEGIN
      -- Extract birth date string (8 digit pertama: digit 1-8)
      birth_str := SUBSTRING(REPLACE(rec.nip, ' ', ''), 1, 4) || '-' || 
                   SUBSTRING(REPLACE(rec.nip, ' ', ''), 5, 2) || '-' || 
                   SUBSTRING(REPLACE(rec.nip, ' ', ''), 7, 2);
      
      -- Cek apakah ini format PPPK (digit 13-14 = 21 atau 22)
      gender_code := SUBSTRING(REPLACE(rec.nip, ' ', ''), 13, 2);
      
      IF gender_code IN ('21', '22') THEN
        -- Format PPPK: 19890225 2024 21 1 013
        -- TMT = tahun saja (digit 9-12), set bulan = 01
        tmt_str := SUBSTRING(REPLACE(rec.nip, ' ', ''), 9, 4) || '-01-01';
        
        -- Gender dari digit 15 (1=Pria, 2=Wanita)
        IF SUBSTRING(REPLACE(rec.nip, ' ', ''), 15, 1) = '1' THEN
          gender_val := 'Laki-laki';
        ELSIF SUBSTRING(REPLACE(rec.nip, ' ', ''), 15, 1) = '2' THEN
          gender_val := 'Perempuan';
        ELSE
          gender_val := NULL;
        END IF;
      ELSE
        -- Format PNS: 19850312 201012 1 002
        -- TMT = tahun + bulan (digit 9-14)
        tmt_str := SUBSTRING(REPLACE(rec.nip, ' ', ''), 9, 4) || '-' || 
                   SUBSTRING(REPLACE(rec.nip, ' ', ''), 13, 2) || '-01';
        
        -- Gender dari digit 15 (1=Pria, 2=Wanita)
        IF SUBSTRING(REPLACE(rec.nip, ' ', ''), 15, 1) = '1' THEN
          gender_val := 'Laki-laki';
        ELSIF SUBSTRING(REPLACE(rec.nip, ' ', ''), 15, 1) = '2' THEN
          gender_val := 'Perempuan';
        ELSE
          gender_val := NULL;
        END IF;
      END IF;
      
      -- Try to convert to date
      birth_val := birth_str::DATE;
      tmt_val := tmt_str::DATE;
      
      -- Validate: birth_date must be before tmt
      IF birth_val >= tmt_val THEN
        RAISE NOTICE 'SKIP: % (%) - Birth date >= TMT', rec.name, rec.nip;
        skipped_count := skipped_count + 1;
        CONTINUE;
      END IF;
      
      -- Update
      UPDATE employees
      SET 
        birth_date = COALESCE(birth_date, birth_val),
        tmt_cpns = COALESCE(tmt_cpns, tmt_val),
        gender = CASE WHEN (gender IS NULL OR gender = '') AND gender_val IS NOT NULL 
                 THEN gender_val ELSE gender END,
        updated_at = NOW()
      WHERE id = rec.id;
      
      updated_count := updated_count + 1;
      RAISE NOTICE 'UPDATE: % - Birth: %, TMT: %, Gender: %', rec.name, birth_val, tmt_val, gender_val;
      
      IF updated_count % 50 = 0 THEN
        RAISE NOTICE 'Progress: % records updated', updated_count;
      END IF;
      
    EXCEPTION
      WHEN OTHERS THEN
        RAISE NOTICE 'SKIP: % (%) - Error: %', rec.name, rec.nip, SQLERRM;
        skipped_count := skipped_count + 1;
    END;
  END LOOP;
  
  RAISE NOTICE '===========================================';
  RAISE NOTICE 'COMPLETED: % records updated, % skipped', updated_count, skipped_count;
  RAISE NOTICE '===========================================';
END $$;
