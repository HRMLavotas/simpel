# Perbaikan Data Pendidikan di Ekspor Peta Jabatan

## Masalah yang Diperbaiki

### 1. **Data Pendidikan Kosong**
- Beberapa pegawai tidak memiliki data di tabel `education_history`
- Solusi: Tetap menampilkan "-" untuk pegawai tanpa data pendidikan

### 2. **Jurusan Pendidikan Tidak Muncul**
- Sebelumnya hanya menampilkan jenjang (contoh: "S1", "SMK")
- Jurusan/major tidak dimuat dari database
- **Penyebab**: RPC function `get_latest_education_per_employee` hanya mengembalikan field `level`, tidak termasuk `major`

### 3. **Limit Fetch Hardcoded (10000)**
- Menggunakan `.limit(10000)` yang tidak scalable
- Batas fetch Supabase adalah 1000 records per request
- Jika pegawai > 10000, data akan terpotong

## Solusi yang Diterapkan

### 1. Update RPC Function
**File**: `supabase/migrations/20260508100001_update_get_latest_education_with_major.sql`

```sql
CREATE OR REPLACE FUNCTION get_latest_education_per_employee()
RETURNS TABLE (
  employee_id UUID,
  level       TEXT,
  major       TEXT,  -- ✅ DITAMBAHKAN
  graduation_year INT
)
```

**Perubahan**:
- Menambahkan field `major` (jurusan) ke return value
- Function sekarang mengembalikan: `employee_id`, `level`, `major`, `graduation_year`

### 2. Implementasi Paginasi
**File**: `src/pages/PetaJabatan.tsx`

#### Pada Function `loadData()` (Line ~282)
```typescript
// ❌ SEBELUM: Hardcoded limit
const { data: eduData } = await supabase
  .rpc('get_latest_education_per_employee')
  .limit(10000);

// ✅ SESUDAH: Paginasi dengan batch 1000
const allEduData: Array<{ employee_id: string; level: string; major: string | null }> = [];
let eduOffset = 0;
const eduBatchSize = 1000;

while (true) {
  const { data: eduBatch, error: eduError } = await supabase
    .rpc('get_latest_education_per_employee')
    .range(eduOffset, eduOffset + eduBatchSize - 1);
  
  if (eduError) {
    logger.error('Error fetching education data:', eduError);
    break;
  }
  
  if (!eduBatch || eduBatch.length === 0) break;
  allEduData.push(...eduBatch);
  
  if (eduBatch.length < eduBatchSize) break;
  eduOffset += eduBatchSize;
}
```

#### Pada Function `handleExportAllDepartments()` (Line ~1284)
```typescript
// ❌ SEBELUM: Hardcoded limit
const { data: eduRaw, error: eduError } = await supabase
  .rpc('get_latest_education_per_employee')
  .limit(10000);

// ✅ SESUDAH: Paginasi dengan batch 1000
const allEdu: Array<{ employee_id: string; level: string; major: string | null }> = [];
let eduOffset = 0;
const eduBatchSize = 1000;

while (true) {
  const { data: eduBatch, error: eduError } = await supabase
    .rpc('get_latest_education_per_employee')
    .range(eduOffset, eduOffset + eduBatchSize - 1);
  
  if (eduError) throw eduError;
  if (!eduBatch || eduBatch.length === 0) break;
  
  allEdu.push(...eduBatch);
  
  if (eduBatch.length < eduBatchSize) break;
  eduOffset += eduBatchSize;
}
```

### 3. Format Output dengan Jurusan
```typescript
// ❌ SEBELUM: Hanya level
latestEdu[e.employee_id] = e.level;

// ✅ SESUDAH: Level + Major
const eduText = e.major ? `${e.level} ${e.major}` : e.level;
latestEdu[e.employee_id] = eduText;
```

**Contoh Output**:
- Jika ada major: `"S1 Teknik Informatika"`
- Jika tidak ada major: `"S1"`
- Jika tidak ada data: `"-"`

## Cara Deploy

### 1. Jalankan Migration SQL
```bash
# Deploy ke Supabase
supabase db push

# Atau manual via Supabase Dashboard:
# SQL Editor → Paste isi file 20260508100001_update_get_latest_education_with_major.sql → Run
```

### 2. Deploy Frontend
```bash
npm run build
# Deploy ke Vercel atau platform hosting Anda
```

## Testing

### 1. Test RPC Function
```sql
-- Test di Supabase SQL Editor
SELECT * FROM get_latest_education_per_employee() LIMIT 10;

-- Pastikan kolom 'major' muncul
```

### 2. Test di Frontend
1. Login sebagai **Admin Pusat**
2. Buka halaman **Peta Jabatan**
3. Klik tab **Formasi ASN**
4. Klik tombol **Export Semua Unit**
5. Buka file Excel yang dihasilkan
6. Periksa kolom **"Pendidikan Terakhir"**:
   - ✅ Harus menampilkan format: "S1 Teknik Informatika"
   - ✅ Bukan hanya: "S1"
   - ✅ Jika tidak ada data: "-"

### 3. Test Paginasi
```typescript
// Untuk memastikan paginasi bekerja:
// 1. Cek console log saat export
// 2. Pastikan tidak ada error "too many rows"
// 3. Verifikasi semua pegawai ter-export (bandingkan jumlah dengan database)
```

## Struktur Data

### Tabel `education_history`
```sql
CREATE TABLE education_history (
  id uuid PRIMARY KEY,
  employee_id uuid NOT NULL,
  level varchar NOT NULL,           -- Jenjang: S1, S2, SMK, dll
  major varchar,                     -- Jurusan: Teknik Informatika, dll
  institution_name varchar,          -- Nama institusi
  graduation_year integer,           -- Tahun lulus
  front_title varchar,               -- Gelar depan
  back_title varchar,                -- Gelar belakang
  created_at timestamptz,
  updated_at timestamptz
);
```

### RPC Return Type
```typescript
interface EducationRecord {
  employee_id: string;
  level: string;
  major: string | null;
  graduation_year: number | null;
}
```

## Performa

### Sebelum
- Single request dengan limit 10000
- Risiko: Data terpotong jika > 10000 pegawai
- Tidak scalable

### Sesudah
- Batch request 1000 records per request
- Scalable untuk jumlah pegawai unlimited
- Menghormati batas Supabase (1000 rows per fetch)

### Estimasi
- 1000 pegawai: 1 request (~500ms)
- 5000 pegawai: 5 request (~2.5s)
- 10000 pegawai: 10 request (~5s)

## Catatan Penting

1. **Migration SQL harus dijalankan terlebih dahulu** sebelum deploy frontend
2. **Backward compatible**: Jika migration belum jalan, frontend akan tetap bekerja (hanya tanpa major)
3. **Data kosong**: Pegawai tanpa data pendidikan akan tetap muncul dengan "-"
4. **Format konsisten**: Semua ekspor (per unit dan semua unit) menggunakan format yang sama

## Troubleshooting

### Error: "column 'major' does not exist"
**Solusi**: Jalankan migration SQL terlebih dahulu

### Data pendidikan masih kosong
**Penyebab**: Pegawai belum memiliki data di tabel `education_history`
**Solusi**: Import data pendidikan via halaman Import

### Ekspor lambat
**Normal**: Untuk ribuan pegawai, ekspor bisa memakan waktu 5-10 detik
**Optimasi**: Sudah menggunakan paginasi optimal (1000 per batch)

## File yang Diubah

1. ✅ `supabase/migrations/20260508100001_update_get_latest_education_with_major.sql` (BARU)
2. ✅ `src/pages/PetaJabatan.tsx` (2 lokasi diupdate)
3. ✅ `PETA_JABATAN_EDUCATION_FIX.md` (Dokumentasi ini)

---

**Tanggal**: 8 Mei 2026  
**Status**: ✅ Selesai  
**Testing**: Perlu testing setelah deploy
