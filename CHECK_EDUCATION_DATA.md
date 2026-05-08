# Troubleshooting: Jurusan Pendidikan Tidak Muncul

## Diagnosis

Data pendidikan berhasil dimuat tapi jurusan tidak muncul. Ada 2 kemungkinan:

### 1. Migration SQL Belum Dijalankan ⚠️
RPC function `get_latest_education_per_employee` masih versi lama (tanpa field `major`)

### 2. Data di Database Kosong
Field `major` di tabel `education_history` memang kosong/NULL

---

## Cara Mengecek

### Cek 1: Apakah Migration Sudah Jalan?

Jalankan query ini di **Supabase SQL Editor**:

```sql
-- Test RPC function
SELECT * FROM get_latest_education_per_employee() LIMIT 5;
```

**Hasil yang diharapkan:**
```
employee_id | level | major              | graduation_year
------------|-------|--------------------|-----------------
xxx-xxx     | S1    | Teknik Informatika | 2020
xxx-xxx     | S2    | Manajemen          | 2022
```

**Jika kolom `major` TIDAK ADA** → Migration belum jalan, lanjut ke **Solusi A**

**Jika kolom `major` ADA tapi KOSONG** → Data belum diisi, lanjut ke **Solusi B**

---

## Solusi A: Jalankan Migration SQL

### Opsi 1: Via Supabase CLI (Recommended)
```bash
# Pastikan sudah login
supabase login

# Link project
supabase link --project-ref YOUR_PROJECT_REF

# Push migration
supabase db push
```

### Opsi 2: Via Supabase Dashboard (Manual)
1. Buka **Supabase Dashboard** → Project Anda
2. Klik **SQL Editor** di sidebar kiri
3. Klik **New Query**
4. Copy-paste isi file `supabase/migrations/20260508100001_update_get_latest_education_with_major.sql`
5. Klik **Run**

**Isi SQL yang harus dijalankan:**
```sql
CREATE OR REPLACE FUNCTION get_latest_education_per_employee()
RETURNS TABLE (
  employee_id UUID,
  level       TEXT,
  major       TEXT,
  graduation_year INT
)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT DISTINCT ON (employee_id)
    employee_id,
    level,
    major,
    graduation_year
  FROM education_history
  ORDER BY employee_id, graduation_year DESC NULLS LAST;
$$;

GRANT EXECUTE ON FUNCTION get_latest_education_per_employee() TO authenticated;
GRANT EXECUTE ON FUNCTION get_latest_education_per_employee() TO anon;

COMMENT ON FUNCTION get_latest_education_per_employee() IS
  'Returns one education record per employee — the latest by graduation_year. Includes level and major (jurusan). Used for export to avoid the 1000-row Supabase default limit.';
```

### Verifikasi
Setelah migration jalan, test lagi:
```sql
SELECT * FROM get_latest_education_per_employee() LIMIT 5;
```

Kolom `major` harus muncul sekarang.

---

## Solusi B: Data Major Kosong di Database

Jika migration sudah jalan tapi data `major` masih NULL, berarti data belum diisi saat import.

### Cek Data di Database
```sql
-- Cek berapa banyak data pendidikan yang punya major
SELECT 
  COUNT(*) as total_records,
  COUNT(major) as records_with_major,
  COUNT(*) - COUNT(major) as records_without_major
FROM education_history;
```

### Jika Banyak yang Kosong
Ada 2 cara mengisi data:

#### Cara 1: Re-import Data Pegawai
1. Buka halaman **Import** di aplikasi
2. Upload file Excel dengan kolom:
   - `Pendidikan Terakhir` (contoh: "S1 Teknik Informatika")
   - Atau pisah: `Jenjang Pendidikan` + `Jurusan Pendidikan`
3. Sistem akan otomatis parse dan isi field `major`

#### Cara 2: Update Manual via SQL (Jika Data Sudah Ada di Kolom Level)
Jika data pendidikan sudah ada tapi dalam format "S1 Teknik Informatika" di kolom `level`:

```sql
-- Backup dulu
CREATE TABLE education_history_backup AS SELECT * FROM education_history;

-- Update: Extract major dari level jika level berisi "S1 Teknik Informatika"
UPDATE education_history
SET major = TRIM(SUBSTRING(level FROM POSITION(' ' IN level) + 1))
WHERE level LIKE '% %' 
  AND (major IS NULL OR major = '');

-- Update: Bersihkan level agar hanya jenjang
UPDATE education_history
SET level = TRIM(SPLIT_PART(level, ' ', 1))
WHERE level LIKE '% %';
```

**Contoh transformasi:**
- Sebelum: `level = "S1 Teknik Informatika"`, `major = NULL`
- Sesudah: `level = "S1"`, `major = "Teknik Informatika"`

---

## Solusi C: Workaround Sementara (Tanpa Migration)

Jika tidak bisa jalankan migration sekarang, gunakan workaround ini:

### Update `src/pages/PetaJabatan.tsx`

Ganti fetch education data dengan query langsung ke tabel:

```typescript
// WORKAROUND: Fetch langsung dari tabel education_history
const allEduData: Array<{ employee_id: string; level: string; major: string | null }> = [];
let eduOffset = 0;
const eduBatchSize = 1000;

while (true) {
  const { data: eduBatch, error: eduError } = await supabase
    .from('education_history')
    .select('employee_id, level, major, graduation_year')
    .order('employee_id')
    .order('graduation_year', { ascending: false })
    .range(eduOffset, eduOffset + eduBatchSize - 1);
  
  if (eduError) {
    logger.error('Error fetching education data:', eduError);
    break;
  }
  
  if (!eduBatch || eduBatch.length === 0) break;
  
  // Deduplicate: ambil hanya record pertama per employee_id
  const seen = new Set<string>();
  eduBatch.forEach(e => {
    if (!seen.has(e.employee_id)) {
      seen.add(e.employee_id);
      allEduData.push(e);
    }
  });
  
  if (eduBatch.length < eduBatchSize) break;
  eduOffset += eduBatchSize;
}
```

**Catatan**: Workaround ini kurang efisien karena fetch semua data lalu deduplicate di client-side. Lebih baik jalankan migration.

---

## Rekomendasi

1. ✅ **Jalankan Migration SQL** (Solusi A) - Paling optimal
2. ✅ **Cek Data di Database** (Solusi B) - Jika migration sudah jalan
3. ⚠️ **Workaround** (Solusi C) - Hanya jika tidak bisa migration

---

## Testing Setelah Fix

1. Login sebagai Admin Pusat
2. Buka **Peta Jabatan** → Tab **Formasi ASN**
3. Klik **Export Semua Unit**
4. Buka file Excel
5. Cek kolom **"Pendidikan Terakhir"**:
   - ✅ Harus: "S1 Teknik Informatika"
   - ❌ Bukan: "S1" saja

---

## Kontak

Jika masih ada masalah, berikan info:
1. Screenshot hasil query: `SELECT * FROM get_latest_education_per_employee() LIMIT 5;`
2. Screenshot hasil query: `SELECT * FROM education_history LIMIT 5;`
3. Screenshot kolom "Pendidikan Terakhir" di Excel export
