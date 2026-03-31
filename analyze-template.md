# Analisis Template Excel Stankom ASN 2026

## Struktur Template Saat Ini

### Header Kolom:
1. No
2. Jabatan Sesuai SK
3. Jabatan Sesuai Kepmen 202 Tahun 2024
4. Kelas Jabatan
5. Jumlah ABK
6. Jumlah Existing
7. Nama Pemangku
8. Kriteria ASN
9. NIP
10. Pangkat Golongan
11. Pendidikan Terakhir
12. Jenis Kelamin
13. Keterangan Formasi (ABK-Existing)
14. Keterangan Penempatan
15. Keterangan Penugasan Tambahan
16. Keterangan Perubahan

### Masalah dengan Parser Saat Ini:

1. **Kategori Jabatan**: Template memiliki baris kategori ("STRUKTURAL", "FUNGSIONAL", "PELAKSANA") yang perlu di-skip
2. **Multi-row per jabatan**: Satu jabatan bisa memiliki multiple pegawai di baris berbeda tanpa mengulang nama jabatan
3. **Kolom mapping**: Beberapa kolom tidak ter-map dengan benar:
   - "Jabatan Sesuai Kepmen 202 Tahun 2024" → position_name ✓
   - "Kelas Jabatan" → grade (tidak di-import ke employees)
   - "Kriteria ASN" → asn_status ✓
   - "Pangkat Golongan" → rank_group ✓

4. **Data kosong**: Banyak baris dengan data kosong atau hanya berisi "-" yang perlu di-filter

## Rekomendasi Perbaikan:

### 1. Skip baris kategori
```typescript
// Skip rows yang hanya berisi kategori jabatan
if (row['Jabatan Sesuai SK'] && 
    ['STRUKTURAL', 'FUNGSIONAL', 'PELAKSANA'].includes(row['Jabatan Sesuai SK'].toUpperCase()) &&
    !row['Nama Pemangku']) {
  continue;
}
```

### 2. Skip baris kosong
```typescript
// Skip rows tanpa nama pemangku atau dengan nama "-"
const name = findCol(row, 'Nama Pemangku', 'Nama Lengkap', 'Nama', 'name');
if (!name || name === '-' || name.trim() === '') {
  continue;
}
```

### 3. Handle multi-row jabatan
```typescript
// Simpan jabatan terakhir untuk baris berikutnya yang kosong
let lastPosition = '';
let lastPositionType = '';

// Jika jabatan kosong, gunakan jabatan sebelumnya
const currentPosition = findCol(row, 'Jabatan Sesuai Kepmen 202 Tahun 2024', ...);
if (currentPosition && currentPosition !== '-') {
  lastPosition = currentPosition;
  // Deteksi tipe dari kategori terdekat
}
```

### 4. Deteksi tipe jabatan dari kategori
```typescript
// Deteksi dari baris kategori terdekat atau dari nama jabatan
let positionType = '';
if (lastCategory === 'STRUKTURAL') positionType = 'Struktural';
else if (lastCategory === 'FUNGSIONAL') positionType = 'Fungsional';
else if (lastCategory === 'PELAKSANA') positionType = 'Pelaksana';
```

### 5. Normalisasi NIP
```typescript
// Handle NIP dengan spasi atau format berbeda
const nip = findCol(row, 'NIP', 'nip').replace(/\s/g, '');
if (nip && nip !== '-' && nip.length >= 18) {
  parsed.nip = nip;
}
```

### 6. Mapping kolom yang benar
```typescript
const columnMapping = {
  'Jabatan Sesuai Kepmen 202 Tahun 2024': 'position_name',
  'Nama Pemangku': 'name',
  'NIP': 'nip',
  'Kriteria ASN': 'asn_status',
  'Pangkat\nGolongan': 'rank_group',
  'Pangkat Golongan': 'rank_group',
  'Pendidikan Terakhir': 'education_level',
  'Jenis Kelamin': 'gender',
  'Keterangan Formasi (ABK-Existing)': 'keterangan_formasi',
  'Keterangan Penempatan': 'keterangan_penempatan',
  'Keterangan Penugasan Tambahan': 'keterangan_penugasan',
  'Keterangan Perubahan': 'keterangan_perubahan'
};
```

## Testing Checklist:

- [ ] Import data Januari 2026
- [ ] Import data Februari 2026
- [ ] Import data Maret 2026
- [ ] Verifikasi jumlah pegawai yang di-import (54, 54, 52)
- [ ] Verifikasi kategori jabatan terdeteksi dengan benar
- [ ] Verifikasi multi-row pegawai untuk satu jabatan
- [ ] Verifikasi data kosong di-skip
- [ ] Verifikasi NIP ter-format dengan benar
- [ ] Verifikasi keterangan ter-import dengan benar
