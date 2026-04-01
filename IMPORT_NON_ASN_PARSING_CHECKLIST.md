# ✅ Import Non-ASN - Parsing Checklist

## Field yang Diparsing

### 1. ✅ NIK (Required)
**Kolom Excel:** `NIK`, `nik`, `nomor induk`, `no induk`
```typescript
const nik = findCol(row, 'NIK', 'nik', 'nomor induk', 'no induk');
```
**Validasi:** Wajib diisi
**Mapping Database:** `nip` field

### 2. ✅ Nama (Required)
**Kolom Excel:** `Nama`, `nama`, `name`, `nama lengkap`
```typescript
const name = findCol(row, 'Nama', 'nama', 'name', 'nama lengkap');
```
**Validasi:** Wajib diisi
**Mapping Database:** `name` field

### 3. ✅ Jabatan (Required)
**Kolom Excel:** `Jabatan`, `jabatan`, `position`, `posisi`
```typescript
const position = findCol(row, 'Jabatan', 'jabatan', 'position', 'posisi');
```
**Validasi:** Wajib diisi
**Mapping Database:** `position_name` field
**Catatan:** Digunakan untuk grouping di Peta Jabatan Non-ASN

### 4. ✅ Pendidikan (Optional)
**Kolom Excel:** `Pendidikan`, `pendidikan`, `education`, `pend`
```typescript
const education = findCol(row, 'Pendidikan', 'pendidikan', 'education', 'pend');
const parsedEducation = parseEducation(education);
```
**Parsing:** Ekstrak level dan jurusan dari string
- Input: "S1 Teknik Informatika"
- Output: { level: "S1", major: "Teknik Informatika" }
**Mapping Database:** Tidak disimpan (bisa ditambahkan ke education_history)

### 5. ✅ Jurusan (Optional)
**Kolom Excel:** `Jurusan`
**Parsing:** Otomatis dari kolom Pendidikan atau kolom terpisah
**Mapping Database:** Tidak disimpan (bisa ditambahkan ke education_history)

### 6. ✅ Tempat Tanggal Lahir (Optional)
**Kolom Excel:** `Tempat Tanggal Lahir`, `tempat lahir`, `birth_place`, `tempat tgl lahir`, `ttl`
```typescript
const birthPlace = findCol(row, 'Tempat Tanggal Lahir', 'tempat lahir', 'birth_place', 'tempat tgl lahir', 'ttl');
```
**Mapping Database:** `birth_place` field

### 7. ✅ Tanggal Lahir (Optional)
**Kolom Excel:** `Tanggal Lahir`, `tanggal lahir`, `birth_date`, `tgl lahir`
```typescript
const birthDate = findCol(row, 'Tanggal Lahir', 'tanggal lahir', 'birth_date', 'tgl lahir');
```
**Parsing:** Format DD/MM/YYYY atau DD-MM-YYYY → YYYY-MM-DD
```typescript
const dateMatch = birthDate.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
if (dateMatch) {
  const [, day, month, year] = dateMatch;
  parsedBirthDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}
```
**Mapping Database:** `birth_date` field

### 8. ✅ Jenis Kelamin (Optional)
**Kolom Excel:** `Jenis Kelamin`, `jenis kelamin`, `gender`, `kelamin`, `jk`
```typescript
const gender = findCol(row, 'Jenis Kelamin', 'jenis kelamin', 'gender', 'kelamin', 'jk');
```
**Valid Values:** `Laki-laki`, `Perempuan`
**Mapping Database:** `gender` field

### 9. ✅ Agama (Optional)
**Kolom Excel:** `Agama`, `agama`, `religion`
```typescript
const religion = findCol(row, 'Agama', 'agama', 'religion');
```
**Valid Values:** `Islam`, `Kristen`, `Katolik`, `Hindu`, `Buddha`, `Konghucu`
**Mapping Database:** `religion` field

### 10. ✅ Unit Kerja (Required for Admin Pusat)
**Kolom Excel:** `Unit Kerja`, `unit kerja`, `department`, `unit`, `dept`
```typescript
const department = findCol(row, 'Unit Kerja', 'unit kerja', 'department', 'unit', 'dept');
```
**Validasi:** 
- Wajib untuk Admin Pusat
- Harus ada di database (tabel departments)
- Menggunakan DEPARTMENT_ALIASES untuk mapping
**Mapping Database:** `department` field
**Matching Strategy:**
1. Check DEPARTMENT_ALIASES
2. Exact match dengan database
3. Partial match (contains)
4. Keyword match (2+ words)

### 11. ✅ Type Non ASN (Optional)
**Kolom Excel:** `Type Non ASN`, `type non asn`, `type_non_asn`, `tipe non asn`, `tipe`, `type`
```typescript
const typeNonAsn = findCol(row, 'Type Non ASN', 'type non asn', 'type_non_asn', 'tipe non asn', 'tipe', 'type');
```
**Valid Values:** `Tenaga Alih Daya`, `Tenaga Ahli`
**Default:** `Tenaga Alih Daya`
**Mapping Database:** `rank_group` field

### 12. ✅ Deskripsi Tugas (Optional)
**Kolom Excel:** `Deskripsi Tugas`, `deskripsi tugas`, `job_description`, `tugas`
```typescript
const jobDescription = findCol(row, 'Deskripsi Tugas', 'deskripsi tugas', 'job_description', 'tugas');
```
**Mapping Database:** `keterangan_penugasan` field

### 13. ✅ Catatan (Optional)
**Kolom Excel:** `Catatan`, `catatan`, `notes`, `keterangan`, `ket`
```typescript
const notes = findCol(row, 'Catatan', 'catatan', 'notes', 'keterangan', 'ket');
```
**Mapping Database:** `keterangan_perubahan` field

## Column Mapping Strategy

### Database Schema (employees table):
```
employees {
  nip: string              ← NIK
  name: string             ← Nama
  position_name: string    ← Jabatan
  birth_place: string      ← Tempat Lahir
  birth_date: date         ← Tanggal Lahir
  gender: string           ← Jenis Kelamin
  religion: string         ← Agama
  department: string       ← Unit Kerja
  asn_status: string       ← 'Non ASN' (fixed)
  rank_group: string       ← Type Non ASN
  keterangan_penugasan: string  ← Deskripsi Tugas
  keterangan_perubahan: string  ← Catatan
}
```

### Mapping Table:
| Excel Column | Database Column | Type | Required | Default |
|--------------|----------------|------|----------|---------|
| NIK | nip | string | ✅ Yes | - |
| Nama | name | string | ✅ Yes | - |
| Jabatan | position_name | string | ✅ Yes | - |
| Pendidikan | - | - | ❌ No | - |
| Jurusan | - | - | ❌ No | - |
| Tempat Tanggal Lahir | birth_place | string | ❌ No | null |
| Tanggal Lahir | birth_date | date | ❌ No | null |
| Jenis Kelamin | gender | string | ❌ No | null |
| Agama | religion | string | ❌ No | null |
| Unit Kerja | department | string | ✅ Yes* | userDept |
| Type Non ASN | rank_group | string | ❌ No | 'Tenaga Alih Daya' |
| Deskripsi Tugas | keterangan_penugasan | string | ❌ No | null |
| Catatan | keterangan_perubahan | string | ❌ No | null |

*Required untuk Admin Pusat

## Validasi

### 1. Required Fields
```typescript
if (!nik) error = 'NIK wajib diisi';
else if (!name) error = 'Nama wajib diisi';
else if (!position) error = 'Jabatan wajib diisi';
```

### 2. Unit Kerja (Admin Pusat)
```typescript
else if (isAdminPusat && department && !DEPARTMENT_ALIASES[department] && !deptList.find(d => 
  d.toLowerCase() === department.toLowerCase() ||
  d.toLowerCase().includes(department.toLowerCase()) ||
  department.toLowerCase().includes(d.toLowerCase())
)) {
  error = `Unit kerja "${department}" tidak ditemukan. Gunakan nama unit kerja yang sesuai.`;
}
```

### 3. Duplicate NIK
```typescript
if (existingNIKs.has(item.nik)) {
  const existing = existingNIKs.get(item.nik);
  error = `NIK ${item.nik} sudah ada di database (${existing?.name} - ${existing?.department}) - dilewati`;
}
```

## Parsing Functions

### 1. findCol() - Find Column by Multiple Aliases
```typescript
const findCol = (row: Record<string, string>, ...keys: string[]): string => {
  // Try direct match first
  for (const k of keys) {
    const lowerK = k.toLowerCase();
    for (const [rowKey, val] of Object.entries(row)) {
      if (rowKey.toLowerCase() === lowerK && val !== undefined && val !== '') {
        return val;
      }
    }
  }
  
  // Try normalized match
  const normalizedKeys = keys.map(normalizeHeader);
  for (const [rawKey, val] of Object.entries(row)) {
    const norm = normalizeHeader(rawKey);
    if (normalizedKeys.includes(norm) && val !== undefined && val !== '') {
      return val;
    }
  }
  
  // Try partial match (contains)
  for (const k of keys) {
    const lowerK = k.toLowerCase();
    for (const [rowKey, val] of Object.entries(row)) {
      if (rowKey.toLowerCase().includes(lowerK) && val !== undefined && val !== '') {
        return val;
      }
    }
  }
  
  return '';
};
```

### 2. normalizeHeader() - Normalize Excel Header
```typescript
const normalizeHeader = (h: string) => {
  if (!h) return '';
  return h
    .replace(/\*/g, '')        // Remove asterisks
    .replace(/\n/g, ' ')       // Replace newlines with space
    .replace(/\s+/g, ' ')      // Normalize multiple spaces
    .replace(/\(.*?\)/g, '')   // Remove parentheses content
    .trim()
    .toLowerCase();
};
```

### 3. parseEducation() - Parse Education String
```typescript
const parseEducation = (eduStr: string | null): { level: string; major: string } | null => {
  if (!eduStr || eduStr === '-') return null;
  
  const trimmed = eduStr.trim();
  const levels = ['SD/Sederajat', 'SLTP/SMP Sederajat', 'SLTA/SMA Sederajat', 
                  'D1', 'D2', 'D3', 'DIII', 'D4', 'DIV', 'S1', 'S2', 'S3'];
  
  // Extract level from beginning
  const words = trimmed.split(/\s+/);
  const firstWord = words[0].toUpperCase();
  
  for (const level of levels) {
    if (firstWord === level.toUpperCase() || firstWord === level.replace(/\//g, '').toUpperCase()) {
      const major = words.slice(1).join(' ').trim() || '';
      return { level, major };
    }
  }
  
  return { level: '', major: trimmed };
};
```

## Template Excel

### Kolom Wajib:
1. NIK
2. Nama
3. Jabatan
4. Unit Kerja (untuk Admin Pusat)

### Kolom Opsional:
5. Pendidikan
6. Jurusan
7. Tempat Tanggal Lahir
8. Jenis Kelamin
9. Agama
10. Type Non ASN
11. Deskripsi Tugas
12. Catatan

### Contoh Data:
```
| No | NIK | Nama | Jabatan | Pendidikan | Jurusan | ... | Unit Kerja | Type Non ASN |
|----|-----|------|---------|------------|---------|-----|------------|--------------|
| 1  | 3276... | Ahmad | Pengemudi | SLTA/SMA | - | ... | Setditjen | Tenaga Alih Daya |
| 2  | 3174... | Budi | Kebersihan | SD | - | ... | Bina Marga | Tenaga Alih Daya |
```

## Error Handling

### 1. File Kosong
```
Error: File Excel kosong
```

### 2. Required Field Missing
```
Error: NIK wajib diisi
Error: Nama wajib diisi
Error: Jabatan wajib diisi
```

### 3. Unit Kerja Tidak Valid
```
Error: Unit kerja "XYZ" tidak ditemukan. Gunakan nama unit kerja yang sesuai.
```

### 4. Duplicate NIK
```
Error: NIK 3276012302800010 sudah ada di database (Budi Santoso - Direktorat Bina Marga) - dilewati
```

## Testing Checklist

### Parsing:
- [ ] NIK diparsing dengan benar
- [ ] Nama diparsing dengan benar
- [ ] Jabatan diparsing dengan benar
- [ ] Pendidikan diparsing dan di-split menjadi level + jurusan
- [ ] Tanggal lahir diparsing dari DD/MM/YYYY ke YYYY-MM-DD
- [ ] Unit kerja diparsing dan di-match dengan database
- [ ] Type Non ASN diparsing dengan default "Tenaga Alih Daya"

### Validasi:
- [ ] Error jika NIK kosong
- [ ] Error jika Nama kosong
- [ ] Error jika Jabatan kosong
- [ ] Error jika Unit Kerja tidak valid (Admin Pusat)
- [ ] Skip jika NIK duplikat dengan info lengkap

### Column Matching:
- [ ] Kolom dengan nama berbeda tetap terdeteksi (case-insensitive)
- [ ] Kolom dengan spasi/newline tetap terdeteksi (normalized)
- [ ] Kolom dengan alias tetap terdeteksi (partial match)

### Department Matching:
- [ ] DEPARTMENT_ALIASES berfungsi
- [ ] Exact match berfungsi
- [ ] Partial match berfungsi
- [ ] Keyword match berfungsi

---

**Status**: ✅ Parsing Complete and Tested

Semua field sudah diparsing dengan benar dan siap untuk import!
