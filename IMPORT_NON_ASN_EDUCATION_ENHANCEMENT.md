# Enhancement Import Data Pendidikan Non-ASN

## Tanggal: 2 April 2026

## Tujuan
Memastikan fungsi parsing import data Non-ASN dapat menyimpan data pendidikan dengan benar ke tabel `education_history` di Supabase, dengan tracking yang lebih baik dan fleksibilitas input.

## Masalah yang Diperbaiki

### 1. Kondisi Penyimpanan Terlalu Ketat
**Sebelum:**
```typescript
if (newEmployee && item.education) {
  // Hanya simpan jika ada level pendidikan
}
```

**Masalah:** Jika user hanya mengisi jurusan tanpa level, data tidak tersimpan.

### 2. Tidak Ada Tracking Data Pendidikan
- Tidak ada informasi berapa banyak data pendidikan yang berhasil disimpan
- User tidak tahu apakah data pendidikan berhasil masuk ke database
- Error penyimpanan pendidikan hanya di console, tidak di log

### 3. Kolom Jurusan Tidak Fleksibel
- Jurusan hanya bisa diisi melalui parsing otomatis dari kolom "Pendidikan"
- Tidak ada kolom terpisah untuk jurusan di template Excel
- Parsing otomatis bisa gagal untuk format yang tidak standar

## Solusi yang Diimplementasikan

### 1. Tambah Kolom "Jurusan" Terpisah di Excel

**File: `src/pages/ImportNonAsn.tsx`**

#### Ekstraksi Data dari Excel
```typescript
const position = findCol(row, 'Jabatan', 'jabatan', 'position', 'posisi');
const education = findCol(row, 'Pendidikan', 'pendidikan', 'education', 'pend');
const educationMajor = findCol(row, 'Jurusan', 'jurusan', 'major', 'prodi', 'program studi'); // ✅ BARU
const birthPlace = findCol(row, 'Tempat Tanggal Lahir', 'tempat lahir', 'birth_place', 'tempat tgl lahir', 'ttl');
```

#### Logic Parsing yang Lebih Fleksibel
```typescript
// Parse education to extract level and major
const parsedEducation = parseEducation(education);

// ✅ Use explicit major from Excel if provided, otherwise use parsed major
const finalEducationLevel = parsedEducation?.level || education || '';
const finalEducationMajor = educationMajor || parsedEducation?.major || null;
```

**Prioritas:**
1. Jika kolom "Jurusan" diisi → gunakan nilai tersebut
2. Jika tidak, gunakan hasil parsing dari kolom "Pendidikan"
3. Jika parsing gagal, gunakan nilai asli dari "Pendidikan" sebagai level

### 2. Perbaiki Kondisi Penyimpanan

#### Sebelum (❌)
```typescript
if (newEmployee && item.education) {
  // Hanya simpan jika ada level
}
```

#### Sesudah (✅)
```typescript
if (newEmployee && (item.education || item.education_major)) {
  // Simpan jika ada level ATAU jurusan
  const { error: eduError } = await supabase
    .from('education_history')
    .insert([{
      employee_id: newEmployee.id,
      level: item.education || '',  // Bisa kosong jika hanya ada jurusan
      major: item.education_major || null,
      institution_name: null,
      graduation_year: null,
    }]);

  if (eduError) {
    logger.error('Failed to insert education data:', eduError);
  } else {
    educationSavedCount++;  // ✅ Track berapa banyak yang tersimpan
    logger.debug(`Education data saved for employee ${newEmployee.id}: ${item.education} ${item.education_major || ''}`);
  }
}
```

### 3. Tambah Tracking dan Notifikasi

#### Counter untuk Data Pendidikan
```typescript
const errors: { row: number; error: string }[] = [];
let successCount = 0;
let skippedCount = 0;
let educationSavedCount = 0; // ✅ Track how many education records were saved
```

#### Notifikasi yang Lebih Informatif
```typescript
if (successCount > 0) {
  const educationInfo = educationSavedCount > 0 
    ? ` (${educationSavedCount} dengan data pendidikan)` 
    : '';
  
  toast({
    title: 'Import selesai',
    description: `${successCount} data berhasil diimport${educationInfo}${skippedCount > 0 ? `, ${skippedCount} duplikat dilewati` : ''}, ${errors.length - skippedCount} error`,
  });
}
```

**Contoh Output:**
- "5 data berhasil diimport (3 dengan data pendidikan), 2 error"
- "10 data berhasil diimport (10 dengan data pendidikan)"
- "8 data berhasil diimport, 2 duplikat dilewati, 1 error"

### 4. Logging yang Lebih Baik

#### Sebelum (❌)
```typescript
console.error('Failed to insert education data:', eduError);
```

#### Sesudah (✅)
```typescript
logger.error('Failed to insert education data:', eduError);
logger.debug(`Education data saved for employee ${newEmployee.id}: ${item.education} ${item.education_major || ''}`);
```

## Template Excel yang Diperbarui

### Kolom yang Tersedia
```
No. | NIK | Nama | Jabatan | Pendidikan | Jurusan | Tempat Tanggal Lahir | Jenis Kelamin | Agama | Unit Kerja | Type Non ASN | Deskripsi Tugas | Catatan
```

### Contoh Data
```excel
1 | 3276012302800010 | Wachyudi Maulana | Pengemudi | SLTA/SMA Sederajat | | Jakarta | Laki-laki | Islam | Setditjen Binalavotas | Tenaga Alih Daya | | 

2 | 3174091103750012 | Teguh Prihatin | Petugas Kebersihan | SD/Sederajat | | Bandung | Laki-laki | Islam | Direktorat Bina Stankomproglat | Tenaga Alih Daya | | 

3 | 3275034406000021 | Jenita Permata Arini | Pramubakti | DIII | Sistem Informasi | Surabaya | Perempuan | Islam | Direktorat Bina Marga | Tenaga Ahli | | 
```

### Cara Pengisian Kolom Pendidikan

#### Opsi 1: Hanya Kolom "Pendidikan" (Parsing Otomatis)
```
Pendidikan: "S1 Teknik Informatika"
Jurusan: (kosong)

Hasil:
- level: "S1"
- major: "Teknik Informatika"
```

#### Opsi 2: Kolom Terpisah (Lebih Akurat)
```
Pendidikan: "S1"
Jurusan: "Teknik Informatika"

Hasil:
- level: "S1"
- major: "Teknik Informatika"
```

#### Opsi 3: Hanya Jurusan
```
Pendidikan: (kosong)
Jurusan: "Teknik Informatika"

Hasil:
- level: ""
- major: "Teknik Informatika"
```

#### Opsi 4: Hanya Level
```
Pendidikan: "S1"
Jurusan: (kosong)

Hasil:
- level: "S1"
- major: null
```

## Fungsi Parsing Education

### Fungsi `parseEducation`
```typescript
const parseEducation = (eduStr: string | null): { level: string; major: string } | null => {
  if (!eduStr || eduStr === '-') return null;
  
  const trimmed = eduStr.trim();
  const levels = ['SD/Sederajat', 'SLTP/SMP Sederajat', 'SLTA/SMA Sederajat', 'D1', 'D2', 'D3', 'DIII', 'D4', 'DIV', 'S1', 'S2', 'S3'];
  
  // Try to extract level from beginning (first word or phrase)
  const words = trimmed.split(/\s+/);
  
  // Check first word
  const firstWord = words[0].toUpperCase();
  for (const level of levels) {
    if (firstWord === level.toUpperCase() || firstWord === level.replace(/\//g, '').toUpperCase()) {
      const major = words.slice(1).join(' ').trim() || '';
      return { level, major };
    }
  }
  
  // Check first two words (for "SLTA/SMA Sederajat" etc)
  if (words.length >= 2) {
    const firstTwoWords = words.slice(0, 2).join(' ').toUpperCase();
    for (const level of levels) {
      if (firstTwoWords === level.toUpperCase()) {
        const major = words.slice(2).join(' ').trim() || '';
        return { level, major };
      }
    }
  }
  
  // Fallback: check if the entire string is just a level
  for (const level of levels) {
    if (trimmed.toUpperCase() === level.toUpperCase()) {
      return { level, major: '' };
    }
  }
  
  // If no level found, treat entire string as major with empty level
  return { level: '', major: trimmed };
};
```

### Contoh Parsing

| Input | Level | Major |
|-------|-------|-------|
| "S1 Teknik Informatika" | "S1" | "Teknik Informatika" |
| "SLTA/SMA Sederajat" | "SLTA/SMA Sederajat" | "" |
| "D3 Akuntansi" | "D3" | "Akuntansi" |
| "S2" | "S2" | "" |
| "Teknik Mesin" | "" | "Teknik Mesin" |
| "DIII Manajemen Informatika" | "DIII" | "Manajemen Informatika" |

## Database Schema

### education_history Table
```sql
CREATE TABLE public.education_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  level varchar NOT NULL,  -- Bisa kosong string jika hanya ada jurusan
  institution_name varchar,
  major varchar,
  graduation_year integer,
  front_title varchar,
  back_title varchar,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

## Flow Penyimpanan Data Pendidikan

```
1. User Upload Excel
   ↓
2. Parse Excel → Extract "Pendidikan" dan "Jurusan"
   ↓
3. Parse "Pendidikan" → Extract level dan major otomatis
   ↓
4. Prioritas:
   - Level: parsedEducation.level || education || ''
   - Major: educationMajor (dari kolom) || parsedEducation.major || null
   ↓
5. Validasi: Simpan jika ada level ATAU major
   ↓
6. Insert ke education_history
   ↓
7. Track: educationSavedCount++
   ↓
8. Notifikasi: "X data berhasil diimport (Y dengan data pendidikan)"
```

## Testing Scenarios

### Test 1: Import dengan Kolom Pendidikan Saja
```excel
Pendidikan: "S1 Teknik Informatika"
Jurusan: (kosong)
```
**Expected:**
- ✅ Data pegawai tersimpan
- ✅ education_history: level="S1", major="Teknik Informatika"
- ✅ Notifikasi: "1 data berhasil diimport (1 dengan data pendidikan)"

### Test 2: Import dengan Kolom Terpisah
```excel
Pendidikan: "S1"
Jurusan: "Teknik Informatika"
```
**Expected:**
- ✅ Data pegawai tersimpan
- ✅ education_history: level="S1", major="Teknik Informatika"
- ✅ Notifikasi: "1 data berhasil diimport (1 dengan data pendidikan)"

### Test 3: Import Hanya Jurusan
```excel
Pendidikan: (kosong)
Jurusan: "Teknik Informatika"
```
**Expected:**
- ✅ Data pegawai tersimpan
- ✅ education_history: level="", major="Teknik Informatika"
- ✅ Notifikasi: "1 data berhasil diimport (1 dengan data pendidikan)"

### Test 4: Import Tanpa Data Pendidikan
```excel
Pendidikan: (kosong)
Jurusan: (kosong)
```
**Expected:**
- ✅ Data pegawai tersimpan
- ❌ Tidak ada insert ke education_history
- ✅ Notifikasi: "1 data berhasil diimport"

### Test 5: Import Multiple dengan Mixed Data
```excel
Row 1: Pendidikan="S1 Teknik Informatika", Jurusan=""
Row 2: Pendidikan="", Jurusan="Akuntansi"
Row 3: Pendidikan="", Jurusan=""
Row 4: Pendidikan="D3", Jurusan="Manajemen"
```
**Expected:**
- ✅ 4 data pegawai tersimpan
- ✅ 3 education_history records (Row 1, 2, 4)
- ✅ Notifikasi: "4 data berhasil diimport (3 dengan data pendidikan)"

### Test 6: Edit Data yang Diimport
```
1. Import data dengan pendidikan
2. Edit data tersebut
3. Buka tab "Riwayat Pendidikan"
```
**Expected:**
- ✅ Data pendidikan muncul di form edit
- ✅ Bisa diubah dan disimpan
- ✅ Perubahan tersimpan ke database

## Manfaat Implementasi

### Untuk User
1. **Fleksibilitas Input** - Bisa isi pendidikan dengan berbagai cara
2. **Informasi Jelas** - Tahu berapa data pendidikan yang tersimpan
3. **Kolom Terpisah** - Lebih mudah isi jurusan di kolom sendiri
4. **Parsing Otomatis** - Tetap bisa pakai format "S1 Teknik Informatika"

### Untuk Developer
1. **Better Logging** - Menggunakan logger.error dan logger.debug
2. **Tracking** - Counter untuk data pendidikan yang tersimpan
3. **Flexible Condition** - Simpan jika ada level ATAU major
4. **Backward Compatible** - Format lama tetap berfungsi

## File yang Diubah

1. ✅ `src/pages/ImportNonAsn.tsx`
   - Tambah ekstraksi kolom "Jurusan"
   - Perbaiki logic parsing education
   - Tambah tracking educationSavedCount
   - Perbaiki kondisi penyimpanan
   - Update notifikasi dengan info pendidikan
   - Improve logging

## Catatan Penting

### Backward Compatibility
- ✅ Format lama (tanpa kolom Jurusan) tetap berfungsi
- ✅ Parsing otomatis tetap aktif
- ✅ Data lama tidak terpengaruh

### Error Handling
- ✅ Error penyimpanan pendidikan tidak menggagalkan import pegawai
- ✅ Error di-log dengan logger.error
- ✅ Success di-log dengan logger.debug

### Performance
- ✅ Tidak ada perubahan pada query database
- ✅ Tidak ada overhead tambahan
- ✅ Tracking hanya increment counter

## Kesimpulan

Enhancement ini berhasil:
1. ✅ Menambahkan kolom "Jurusan" terpisah di template Excel
2. ✅ Memperbaiki kondisi penyimpanan (level OR major)
3. ✅ Menambahkan tracking data pendidikan yang tersimpan
4. ✅ Meningkatkan kualitas logging
5. ✅ Memberikan notifikasi yang lebih informatif
6. ✅ Menjaga backward compatibility
7. ✅ Semua diagnostics passed

Fungsi parsing import data Non-ASN sekarang lebih robust dan user-friendly dalam menyimpan data pendidikan ke tabel `education_history`!
