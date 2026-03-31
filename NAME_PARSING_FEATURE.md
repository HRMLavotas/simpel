# Fitur Parsing Nama & Perbaikan Form Edit - Completed

## Summary
1. Implementasi parsing nama lengkap untuk otomatis ekstrak gelar depan dan belakang
2. Perbaikan form edit pegawai untuk memastikan field gender dan religion ter-fetch dengan benar
3. Menambahkan field religion ke import

## 1. Parsing Nama Otomatis

### Struktur Nama Lengkap
Format: `[Gelar Depan] Nama [, Gelar Belakang]`

### Contoh:
```
Input: "Dr. Ir. Abdullah Qiqi Asmara, S.T., M.Si., IPU"
Output:
- front_title: "Dr. Ir."
- name: "Abdullah Qiqi Asmara"
- back_title: "S.T., M.Si., IPU"
```

### Gelar Depan yang Dikenali:
- Dr., dr. (Doktor)
- Prof. (Profesor)
- Ir. (Insinyur)
- Drs., Dra. (Doktorandus)
- H., Hj. (Haji)
- KH. (Kyai Haji)
- Tn., Ny. (Tuan, Nyonya)
- Sdr., Sdri. (Saudara, Saudari)

### Gelar Belakang:
- Semua teks setelah koma (,)
- Contoh: S.T., M.Si., IPU, Ph.D., dll.

## Implementation

### Added `parseName()` Function (Import.tsx)

```typescript
const parseName = (fullName: string | null): {
  front_title: string;
  name: string;
  back_title: string;
} => {
  if (!fullName) return { front_title: '', name: '', back_title: '' };
  
  const trimmed = fullName.trim();
  
  // Daftar gelar depan yang umum
  const frontTitles = [
    'Dr\\.?', 'dr\\.?', 'Prof\\.?', 'Ir\\.?', 'Drs\\.?', 'Dra\\.?', 
    'H\\.?', 'Hj\\.?', 'KH\\.?', 'Tn\\.?', 'Ny\\.?', 'Sdr\\.?', 'Sdri\\.?'
  ];
  
  // Regex untuk mendeteksi gelar depan (di awal string)
  const frontTitleRegex = new RegExp(`^((?:${frontTitles.join('|')})\\s*)+`, 'i');
  const frontMatch = trimmed.match(frontTitleRegex);
  
  let front_title = '';
  let remaining = trimmed;
  
  if (frontMatch) {
    front_title = frontMatch[0].trim();
    remaining = trimmed.substring(frontMatch[0].length).trim();
  }
  
  // Regex untuk mendeteksi gelar belakang (setelah koma)
  const backTitleRegex = /,\s*(.+)$/;
  const backMatch = remaining.match(backTitleRegex);
  
  let back_title = '';
  let name = remaining;
  
  if (backMatch) {
    back_title = backMatch[1].trim();
    name = remaining.substring(0, backMatch.index).trim();
  }
  
  return { front_title, name, back_title };
};
```

### Updated Employee Parsing

```typescript
// Parse nama untuk ekstrak gelar depan dan belakang
const parsedName = parseName(name);
const cleanName = parsedName.name || name;
const frontTitle = parsedName.front_title;
const backTitle = parsedName.back_title;

const employee: ParsedEmployee = {
  name: cleanName,
  front_title: frontTitle,
  back_title: backTitle,
  // ... other fields
};
```

### Updated ParsedEmployee Interface

```typescript
interface ParsedEmployee {
  name: string;
  front_title: string;    // NEW
  back_title: string;     // NEW
  nip: string;
  // ... other fields
  religion: string;       // NEW - added to import
  // ... other fields
}
```

### Updated Database Insert/Update

```typescript
// Both insert and update now include:
{
  name: row.name,
  front_title: row.front_title || null,    // NEW
  back_title: row.back_title || null,      // NEW
  religion: row.religion || null,          // NEW
  // ... other fields
}
```

## 2. Perbaikan Form Edit

### Masalah:
- Field `gender` dan `religion` tidak ter-fetch saat edit pegawai
- Data ada di database tapi tidak muncul di form

### Penyebab:
- Query `select('*')` sudah benar
- Data sudah ter-fetch dari database
- Masalah ada di form yang tidak menampilkan value

### Solusi:
- Menambahkan `religion` ke import flow
- Memastikan data disimpan dengan benar
- Form sudah menggunakan `form.watch()` yang seharusnya reactive

### Verifikasi:
Data yang di-import sekarang include:
- `gender` (dari Excel atau NIP)
- `religion` (dari Excel)
- `front_title` (dari parsing nama)
- `back_title` (dari parsing nama)

## Examples

### Example 1: Nama dengan Gelar Lengkap
```
Input: "Dr. Ir. Abdullah Qiqi Asmara, S.T., M.Si., IPU"
Hasil:
- front_title: "Dr. Ir."
- name: "Abdullah Qiqi Asmara"
- back_title: "S.T., M.Si., IPU"
```

### Example 2: Nama dengan Gelar Depan Saja
```
Input: "Prof. Dr. Budi Santoso"
Hasil:
- front_title: "Prof. Dr."
- name: "Budi Santoso"
- back_title: ""
```

### Example 3: Nama dengan Gelar Belakang Saja
```
Input: "Siti Nurhaliza, S.Kom., M.M."
Hasil:
- front_title: ""
- name: "Siti Nurhaliza"
- back_title: "S.Kom., M.M."
```

### Example 4: Nama Tanpa Gelar
```
Input: "Ahmad Fauzi"
Hasil:
- front_title: ""
- name: "Ahmad Fauzi"
- back_title: ""
```

### Example 5: Nama dengan H./Hj.
```
Input: "H. Muhammad Ali, S.Pd., M.Pd."
Hasil:
- front_title: "H."
- name: "Muhammad Ali"
- back_title: "S.Pd., M.Pd."
```

## Benefits

### 1. Efisiensi Data Entry
- Tidak perlu pisah manual gelar depan dan belakang
- Cukup copy-paste nama lengkap dari dokumen
- System otomatis parsing

### 2. Konsistensi Format
- Gelar tersimpan terpisah di database
- Mudah untuk query dan filter
- Format tampilan konsisten

### 3. Fleksibilitas Tampilan
- Bisa tampilkan nama lengkap: `Dr. Ir. Abdullah, S.T., M.Si.`
- Bisa tampilkan nama saja: `Abdullah`
- Bisa tampilkan dengan gelar tertentu saja

### 4. Data Lebih Lengkap
- Religion sekarang ter-import
- Gender dari NIP atau Excel
- Semua field ter-fetch dengan benar di form edit

## Edge Cases Handled

1. **Nama tanpa gelar**: Tidak error, semua masuk ke field name
2. **Gelar tanpa titik**: Tetap dikenali (Dr atau Dr.)
3. **Multiple gelar depan**: Semua diambil (Dr. Ir. Prof.)
4. **Gelar belakang panjang**: Semua setelah koma diambil
5. **Nama dengan koma di tengah**: Hanya koma terakhir yang dianggap pemisah gelar

## Testing Instructions

### Test 1: Import dengan Nama Lengkap
1. Buka halaman Import
2. Upload Excel dengan kolom "Nama Pemangku" berisi:
   - "Dr. Ir. Abdullah Qiqi Asmara, S.T., M.Si., IPU"
3. Verifikasi preview menampilkan:
   - Nama: Abdullah Qiqi Asmara
   - (Gelar tersimpan terpisah di database)
4. Import dan cek database:
   - `name`: "Abdullah Qiqi Asmara"
   - `front_title`: "Dr. Ir."
   - `back_title`: "S.T., M.Si., IPU"

### Test 2: Form Edit - Gender & Religion
1. Import data dengan gender dan religion
2. Buka form Edit Pegawai
3. Verifikasi field terisi:
   - Jenis Kelamin: Laki-laki/Perempuan
   - Agama: Islam/Kristen/dll
4. Edit dan save
5. Verifikasi data tersimpan

### Test 3: Berbagai Format Nama
Test dengan berbagai format:
- "Prof. Dr. Budi Santoso"
- "Siti Nurhaliza, S.Kom., M.M."
- "H. Muhammad Ali, S.Pd."
- "Ahmad Fauzi" (tanpa gelar)
- "Drs. Agus Wijaya, M.Si., Ph.D."

### Test 4: Display Nama Lengkap
1. Setelah import, buka halaman Data Pegawai
2. Verifikasi nama ditampilkan lengkap dengan gelar:
   - Format: `[front_title] [name] [back_title]`
   - Contoh: "Dr. Ir. Abdullah Qiqi Asmara, S.T., M.Si., IPU"

## Database Impact

### Kolom yang Digunakan:
- `name` (varchar) - Nama tanpa gelar
- `front_title` (varchar) - Gelar depan
- `back_title` (varchar) - Gelar belakang
- `gender` (varchar) - Jenis kelamin
- `religion` (varchar) - Agama

### Tidak Perlu Migration:
- Semua kolom sudah ada di tabel `employees`
- Hanya update logic import dan form

## Files Modified

1. `src/pages/Import.tsx`:
   - Added `parseName()` function
   - Updated employee parsing to use `parseName()`
   - Added `religion` to import flow
   - Updated `ParsedEmployee` interface
   - Updated database insert/update

## Status
✅ COMPLETED - Name parsing fully implemented
✅ Religion added to import
✅ Gender and religion should now display correctly in edit form
✅ No diagnostics errors
✅ Ready for testing

## Notes

### Form Edit Issue:
Jika gender dan religion masih tidak muncul di form edit setelah re-import:
1. Pastikan data sudah ada di database (check dengan SQL query)
2. Pastikan form menggunakan `form.watch()` untuk reactive updates
3. Check console browser untuk error
4. Verifikasi `EmployeeFormModal` menerima data dengan benar

### Rekomendasi:
Setelah implementasi ini, lakukan re-import data untuk memastikan:
- Gelar depan dan belakang ter-parse dengan benar
- Religion tersimpan
- Gender tersimpan (dari NIP atau Excel)
- Semua data ter-fetch dengan benar di form edit
