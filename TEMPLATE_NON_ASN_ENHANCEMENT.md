# Enhancement Template Import Non ASN

## Tanggal: 2 April 2026

## Analisis Dokumen Excel yang Diberikan

Berdasarkan file "Nominatif Tenaga Non ASN Tahun 2026.xlsx" yang Anda berikan, saya melihat struktur kolom berikut:

### Kolom yang Ada di Dokumen:
1. NO
2. NIK
3. Nama
4. Jabatan
5. Pendidikan dan Jurusan (digabung dalam 1 kolom)
6. Tempat Tanggal Lahir
7. Jenis Kelamin
8. Agama
9. Unit Kerja
10. Type Non ASN
11. **Tanggal Bergabung** (kolom kosong di dokumen)
12. **Deskripsi Tugas** (kolom kosong di dokumen)
13. **Catatan** (berisi informasi seperti "Pindahan dari Dit. Bina Stankom & Proglat")

### Observasi Penting:

1. **Kolom "Catatan" digunakan untuk Riwayat:**
   - "Pindahan Biro Umum, Setditjen Binapenta"
   - "Pindahan dari Dit. Bina Stankom & Proglat"
   - "Pindahan dari Dit. Bina Lemlat Vokasi"
   - "Pindahan dari Dit. Bina Penyelenggaraan Latvogan"
   - "Pindahan dari Dit. Bina Peningkatan Produktivitas"
   - "Pindahan dari Direktorat Bina Intala"
   - "pindahan dari Pusat Pasar Kerja"

2. **Kolom "Tanggal Bergabung" ada tapi kosong** di semua data

3. **Pendidikan dan Jurusan digabung** dalam satu kolom, contoh:
   - "SLTA/SMA Sederajat"
   - "DIII Sistem Informasi"
   - "S1 Psikologi"
   - "S1 Ekonomi Akuntansi"
   - "DIV Adm. Pemb Negara"

## Rekomendasi Perbaikan Template

### Struktur Kolom yang Disarankan:

| No | Kolom | Wajib | Keterangan |
|----|-------|-------|------------|
| 1 | No. | Tidak | Nomor urut |
| 2 | NIK | Ya | 16 digit NIK |
| 3 | Nama | Ya | Nama lengkap |
| 4 | Jabatan | Ya | Jabatan saat ini |
| 5 | Pendidikan | Tidak | Jenjang pendidikan (SD, SMP, SMA, D3, S1, S2, S3) |
| 6 | Jurusan | Tidak | Jurusan/program studi |
| 7 | Tempat Tanggal Lahir | Tidak | Tempat lahir |
| 8 | Jenis Kelamin | Tidak | Laki-laki / Perempuan |
| 9 | Agama | Tidak | Islam, Kristen, Katolik, Hindu, Buddha, Konghucu |
| 10 | Unit Kerja | Ya | Nama unit kerja |
| 11 | Type Non ASN | Ya | Tenaga Alih Daya / Tenaga Ahli |
| 12 | **Tanggal Bergabung** | Tidak | Format: DD/MM/YYYY |
| 13 | **Riwayat Jabatan** | Tidak | Riwayat jabatan sebelumnya |
| 14 | Deskripsi Tugas | Tidak | Deskripsi tugas/tanggung jawab |
| 15 | Catatan | Tidak | Catatan tambahan (pindahan, dll) |

### Penjelasan Kolom Baru:

#### 1. Tanggal Bergabung
- **Format**: DD/MM/YYYY (contoh: 01/01/2020)
- **Fungsi**: Mencatat kapan pegawai mulai bergabung
- **Mapping**: Akan disimpan ke field `join_date` di tabel `employees`
- **Contoh**: 
  - "01/01/2020"
  - "15/03/2019"
  - "10/06/2021"

#### 2. Riwayat Jabatan
- **Format**: Teks bebas
- **Fungsi**: Mencatat riwayat jabatan atau perpindahan
- **Mapping**: Akan disimpan ke field `keterangan_penempatan` di tabel `employees`
- **Contoh**:
  - "Pengemudi sejak 2020"
  - "Pramubakti (2021-sekarang)"
  - "Petugas Kebersihan, pindah dari Dit. Bina Stankom 2019"
  - "Sebelumnya di Pusat Pasar Kerja (2018-2020)"

#### 3. Catatan (Existing - Enhanced)
- **Format**: Teks bebas
- **Fungsi**: Catatan umum, informasi pindahan, atau keterangan khusus
- **Mapping**: Tetap ke field `keterangan_perubahan` di tabel `employees`
- **Contoh**:
  - "Pindahan dari Dit. Bina Stankom & Proglat"
  - "Mengikuti pimpinan"
  - "Pengganti pegawai yang pensiun"

## Implementasi yang Diperlukan

### 1. Update Template Download

**File**: `src/pages/ImportNonAsn.tsx`

**Perubahan pada `downloadTemplate()`:**

```typescript
const sampleData = isAdminPusat ? [
  {
    'No.': 1,
    'NIK': '3276012302800010',
    'Nama': 'Wachyudi Maulana',
    'Jabatan': 'Pengemudi',
    'Pendidikan': 'SLTA/SMA Sederajat',
    'Jurusan': '',
    'Tempat Tanggal Lahir': 'Jakarta',
    'Jenis Kelamin': 'Laki-laki',
    'Agama': 'Islam',
    'Unit Kerja': 'Setditjen Binalavotas',
    'Type Non ASN': 'Tenaga Alih Daya',
    'Tanggal Bergabung': '01/01/2020',  // ✅ BARU
    'Riwayat Jabatan': 'Pengemudi sejak 2020',  // ✅ BARU
    'Deskripsi Tugas': 'Mengemudikan kendaraan dinas',
    'Catatan': '',
  },
  {
    'No.': 2,
    'NIK': '3174091103750012',
    'Nama': 'Teguh Prihatin',
    'Jabatan': 'Petugas Kebersihan',
    'Pendidikan': 'SD/Sederajat',
    'Jurusan': '',
    'Tempat Tanggal Lahir': 'Bandung',
    'Jenis Kelamin': 'Laki-laki',
    'Agama': 'Islam',
    'Unit Kerja': 'Direktorat Bina Stankomproglat',
    'Type Non ASN': 'Tenaga Alih Daya',
    'Tanggal Bergabung': '15/03/2019',  // ✅ BARU
    'Riwayat Jabatan': '',  // ✅ BARU (bisa kosong)
    'Deskripsi Tugas': '',
    'Catatan': 'Pindahan dari Dit. Bina Stankom & Proglat',
  },
  // ... dst
];

// Update column widths
ws['!cols'] = [
  { wch: 5 },   // No
  { wch: 18 },  // NIK
  { wch: 30 },  // Nama
  { wch: 25 },  // Jabatan
  { wch: 25 },  // Pendidikan
  { wch: 25 },  // Jurusan
  { wch: 25 },  // Tempat Tanggal Lahir
  { wch: 15 },  // Jenis Kelamin
  { wch: 12 },  // Agama
  { wch: 30 },  // Unit Kerja
  { wch: 20 },  // Type Non ASN
  { wch: 15 },  // Tanggal Bergabung ✅ BARU
  { wch: 35 },  // Riwayat Jabatan ✅ BARU
  { wch: 35 },  // Deskripsi Tugas
  { wch: 40 }   // Catatan
];
```

### 2. Update Parsing Logic

**File**: `src/pages/ImportNonAsn.tsx`

**Perubahan pada `parseExcelFile()`:**

```typescript
// Tambahkan parsing untuk kolom baru
const joinDate = findCol(row, 'Tanggal Bergabung', 'tanggal bergabung', 'join_date', 'tgl bergabung');
const positionHistory = findCol(row, 'Riwayat Jabatan', 'riwayat jabatan', 'position_history', 'riwayat');

// Parse join date if in format "DD/MM/YYYY" or "DD-MM-YYYY"
let parsedJoinDate: string | null = null;
if (joinDate) {
  const dateMatch = joinDate.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
  if (dateMatch) {
    const [, day, month, year] = dateMatch;
    parsedJoinDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
}

// Add to parsed object
parsed.push({
  // ... existing fields
  join_date: parsedJoinDate,  // ✅ BARU
  position_history: positionHistory || null,  // ✅ BARU
  // ... rest of fields
});
```

### 3. Update Insert Logic

**File**: `src/pages/ImportNonAsn.tsx`

**Perubahan pada `handleImport()`:**

```typescript
const { error } = await supabase.from('employees').insert([{
  nip: item.nik,
  name: item.name,
  position_name: item.position,
  birth_place: item.birth_place,
  birth_date: item.birth_date,
  gender: item.gender,
  religion: item.religion,
  department: item.department,
  asn_status: 'Non ASN',
  rank_group: item.type_non_asn,
  join_date: item.join_date,  // ✅ BARU
  keterangan_penempatan: item.position_history,  // ✅ BARU (Riwayat Jabatan)
  keterangan_penugasan: item.job_description,  // Deskripsi Tugas
  keterangan_perubahan: item.notes,  // Catatan
}]);
```

### 4. Update Interface

**File**: `src/pages/ImportNonAsn.tsx`

```typescript
interface ParsedNonAsn {
  nik: string;
  name: string;
  position: string;
  education: string | null;
  education_major: string | null;
  birth_place: string | null;
  birth_date: string | null;
  gender: string | null;
  religion: string | null;
  department: string;
  type_non_asn: string;
  join_date: string | null;  // ✅ BARU
  position_history: string | null;  // ✅ BARU
  job_description: string | null;
  notes: string | null;
  error?: string;
  row?: number;
}
```

### 5. Update Preview Table

**File**: `src/pages/ImportNonAsn.tsx`

Tambahkan kolom di preview table:

```tsx
<TableHeader>
  <TableRow>
    <TableHead>Baris</TableHead>
    <TableHead>NIK</TableHead>
    <TableHead>Nama</TableHead>
    <TableHead>Jabatan</TableHead>
    <TableHead>Pendidikan</TableHead>
    <TableHead>Jurusan</TableHead>
    <TableHead>Jenis Kelamin</TableHead>
    <TableHead>Agama</TableHead>
    <TableHead>Unit Kerja</TableHead>
    <TableHead>Type Non ASN</TableHead>
    <TableHead>Tanggal Bergabung</TableHead>  {/* ✅ BARU */}
    <TableHead>Riwayat Jabatan</TableHead>  {/* ✅ BARU */}
    <TableHead>Catatan</TableHead>
    <TableHead>Status</TableHead>
  </TableRow>
</TableHeader>
```

## Mapping Field ke Database

| Kolom Excel | Field Database | Tabel | Keterangan |
|-------------|----------------|-------|------------|
| NIK | `nip` | `employees` | Primary identifier |
| Nama | `name` | `employees` | Nama lengkap |
| Jabatan | `position_name` | `employees` | Jabatan saat ini |
| Pendidikan | `level` | `education_history` | Jenjang pendidikan |
| Jurusan | `major` | `education_history` | Program studi |
| Tempat Tanggal Lahir | `birth_place` | `employees` | Tempat lahir |
| Tanggal Lahir | `birth_date` | `employees` | Tanggal lahir (parsed) |
| Jenis Kelamin | `gender` | `employees` | L/P |
| Agama | `religion` | `employees` | Agama |
| Unit Kerja | `department` | `employees` | Unit kerja |
| Type Non ASN | `rank_group` | `employees` | Tipe tenaga |
| **Tanggal Bergabung** | **`join_date`** | **`employees`** | **Tanggal mulai kerja** |
| **Riwayat Jabatan** | **`keterangan_penempatan`** | **`employees`** | **Riwayat posisi** |
| Deskripsi Tugas | `keterangan_penugasan` | `employees` | Job description |
| Catatan | `keterangan_perubahan` | `employees` | Catatan umum |

## Contoh Penggunaan

### Contoh 1: Pegawai Baru Tanpa Riwayat
```
NIK: 3276012302800010
Nama: Wachyudi Maulana
Jabatan: Pengemudi
Tanggal Bergabung: 01/01/2020
Riwayat Jabatan: Pengemudi sejak 2020
Catatan: (kosong)
```

### Contoh 2: Pegawai Pindahan
```
NIK: 3174091103750012
Nama: Teguh Prihatin
Jabatan: Petugas Kebersihan
Tanggal Bergabung: 15/03/2019
Riwayat Jabatan: Sebelumnya di Dit. Bina Stankom (2018-2019)
Catatan: Pindahan dari Dit. Bina Stankom & Proglat
```

### Contoh 3: Pegawai dengan Riwayat Lengkap
```
NIK: 3275034406000021
Nama: Jenita Permata Arini
Jabatan: Pramubakti
Tanggal Bergabung: 10/06/2021
Riwayat Jabatan: Pramubakti (2021-sekarang), sebelumnya Petugas Administrasi (2019-2021)
Catatan: Promosi dari posisi sebelumnya
```

## Manfaat Penambahan Kolom

### 1. Tanggal Bergabung
- ✅ Tracking masa kerja pegawai
- ✅ Perhitungan senioritas
- ✅ Analisis turnover
- ✅ Perencanaan kontrak/perpanjangan
- ✅ Laporan statistik pegawai per periode

### 2. Riwayat Jabatan
- ✅ Dokumentasi karir pegawai
- ✅ Tracking perpindahan/mutasi
- ✅ Analisis pola karir
- ✅ Referensi untuk promosi
- ✅ Audit trail perubahan jabatan

### 3. Pemisahan Catatan
- ✅ **Riwayat Jabatan**: Fokus pada history posisi/jabatan
- ✅ **Catatan**: Informasi umum lainnya (pindahan, pengganti, dll)
- ✅ Data lebih terstruktur dan mudah dicari

## Testing yang Diperlukan

### 1. Test Template Download
- [ ] Download template baru
- [ ] Verifikasi ada 15 kolom (termasuk Tanggal Bergabung dan Riwayat Jabatan)
- [ ] Verifikasi contoh data sudah terisi dengan benar

### 2. Test Import dengan Kolom Baru
- [ ] Import dengan Tanggal Bergabung terisi
- [ ] Import dengan Riwayat Jabatan terisi
- [ ] Import dengan kedua kolom kosong
- [ ] Verifikasi data tersimpan ke field yang benar

### 3. Test Format Tanggal
- [ ] Format DD/MM/YYYY
- [ ] Format DD-MM-YYYY
- [ ] Format dengan leading zero (01/01/2020)
- [ ] Format tanpa leading zero (1/1/2020)

### 4. Test Backward Compatibility
- [ ] Import file lama (tanpa kolom baru) masih berfungsi
- [ ] Kolom yang tidak ada di file lama akan null/kosong

## Rekomendasi Tambahan

### 1. Validasi Tanggal Bergabung
- Tambahkan validasi: tanggal bergabung tidak boleh di masa depan
- Tambahkan warning jika tanggal bergabung > 10 tahun yang lalu

### 2. Format Riwayat Jabatan
- Berikan contoh format yang konsisten di template
- Contoh: "Jabatan (Tahun Mulai - Tahun Selesai)"

### 3. Help Text di UI
- Tambahkan tooltip/help text untuk kolom baru
- Jelaskan format yang diharapkan

### 4. Migrasi Data Lama
- Buat script untuk memindahkan data dari kolom "Catatan" yang berisi riwayat ke kolom "Riwayat Jabatan"
- Identifikasi pattern seperti "Pindahan dari..." dan pindahkan ke field yang sesuai

## File yang Perlu Diubah

1. ✅ `src/pages/ImportNonAsn.tsx` - Template download dan parsing
2. ⏳ Interface `ParsedNonAsn` - Tambah field baru
3. ⏳ Function `parseExcelFile()` - Parse kolom baru
4. ⏳ Function `handleImport()` - Insert field baru
5. ⏳ Preview table - Tampilkan kolom baru
6. ⏳ Form manual (NonAsnFormModal) - Sudah ada field untuk ini

## Status Implementasi

- [x] Analisis kebutuhan
- [x] Desain struktur kolom
- [x] Dokumentasi
- [ ] Implementasi template download
- [ ] Implementasi parsing
- [ ] Implementasi insert
- [ ] Update preview table
- [ ] Testing
- [ ] User documentation
