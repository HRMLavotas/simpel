# Update Export Agregasi Pendidikan - Format Resmi

## Ringkasan Perubahan

File yang diubah: `src/components/data-builder/QuickAggregation.tsx` (Sheet 13)

### Perubahan Utama

#### 1. **Header Dokumen Dinamis**
- ✅ Baris 1: "REKAP PEGAWAI DITJEN BULAN [BULAN] [TAHUN]" (merged A1:N1)
- ✅ Baris 2: "Dukungan Personil Berdasarkan Tingkat Pendidikan" (merged A2:N2)
- ✅ Bulan dan tahun otomatis sesuai tanggal export (format: APRIL 2026)

#### 2. **Struktur Kolom yang Benar**
- ✅ Kolom header di baris 3: `NO. | UNIT KERJA | JML PEG | SD | SMP | SMA | D1 | D2 | D3 | D4 | S1 | S2 | S3 | JML PEG`
- ✅ Total 14 kolom (A sampai N)
- ✅ Kolom JML PEG muncul 2 kali (kolom C dan N) untuk verifikasi

#### 3. **Label Standar**
- ✅ Menggunakan "SMA" (bukan "SMA/SMK") di header kolom
- ✅ Data "SMA/SMK" dari database tetap dihitung ke kolom "SMA"

#### 4. **Merged Cells**
- ✅ Judul utama (baris 1) merged dari A1 sampai N1
- ✅ Sub-judul (baris 2) merged dari A2 sampai N2
- ✅ Menggunakan `ws['!merges']` untuk implementasi

#### 5. **Lebar Kolom**
- ✅ NO.: 5 karakter
- ✅ UNIT KERJA: 32 karakter
- ✅ JML PEG: 8 karakter (kedua kolom)
- ✅ Pendidikan (SD-S3): 6 karakter masing-masing

#### 6. **Baris JUMLAH**
- ✅ Tetap ada di baris terakhir
- ✅ Menjumlahkan semua kolom numerik
- ✅ Kolom NO. kosong, UNIT KERJA berisi "JUMLAH"

## Pendekatan Teknis

### Sebelum (json_to_sheet)
```typescript
const eduRows: Record<string, string | number>[] = [...];
const wsEdu = XLSX.utils.json_to_sheet(eduRows);
```

### Sesudah (aoa_to_sheet)
```typescript
const aoaData: any[][] = [
  [titleText],           // Row 1 - merged
  [subtitleText],        // Row 2 - merged
  ['NO.', 'UNIT KERJA', ...], // Row 3 - headers
  ...dataRows            // Row 4+ - data
];
const wsEdu = XLSX.utils.aoa_to_sheet(aoaData);
wsEdu['!merges'] = [
  { s: { r: 0, c: 0 }, e: { r: 0, c: 13 } }, // Title
  { s: { r: 1, c: 0 }, e: { r: 1, c: 13 } }, // Subtitle
];
```

## Format Output Excel

```
┌─────────────────────────────────────────────────────────────────┐
│ REKAP PEGAWAI DITJEN BULAN APRIL 2026                          │ (merged A1:N1)
├─────────────────────────────────────────────────────────────────┤
│ Dukungan Personil Berdasarkan Tingkat Pendidikan               │ (merged A2:N2)
├────┬──────────────┬────────┬────┬────┬────┬────┬────┬────┬────┬────┬────┬────┬────────┤
│NO. │ UNIT KERJA   │JML PEG │ SD │SMP │SMA │ D1 │ D2 │ D3 │ D4 │ S1 │ S2 │ S3 │JML PEG │
├────┼──────────────┼────────┼────┼────┼────┼────┼────┼────┼────┼────┼────┼────┼────────┤
│ 1  │ Setditjen... │   96   │ 0  │ 0  │ 4  │ 0  │ 0  │ 10 │ 4  │ 58 │ 20 │ 0  │   96   │
│ 2  │ Direktorat...│   52   │ 0  │ 0  │ 3  │ 0  │ 0  │ 7  │ 2  │ 26 │ 13 │ 1  │   52   │
│... │ ...          │  ...   │... │... │... │... │... │... │... │... │... │... │  ...   │
├────┼──────────────┼────────┼────┼────┼────┼────┼────┼────┼────┼────┼────┼────┼────────┤
│    │ JUMLAH       │  2537  │ 3  │ 5  │124 │ 2  │ 1  │261 │129 │1645│362 │ 5  │  2537  │
└────┴──────────────┴────────┴────┴────┴────┴────┴────┴────┴────┴────┴────┴────┴────────┘
```

## Verifikasi Data

### Round-Trip Property
Untuk setiap baris unit kerja:
```
JML PEG (kolom C) = SD + SMP + SMA + D1 + D2 + D3 + D4 + S1 + S2 + S3
JML PEG (kolom N) = JML PEG (kolom C)
```

### Konsistensi
- ✅ Menggunakan sumber data yang sama dengan sheet lain
- ✅ Urutan unit kerja mengikuti `OFFICIAL_DEPT_ORDER`
- ✅ Hanya menghitung pegawai ASN (PNS dan PPPK)
- ✅ Exclude Non ASN

## Catatan Styling

**Penting**: Library `xlsx` versi 0.18.5 tidak mendukung styling (bold, border, alignment) secara native. Untuk menambahkan styling, diperlukan:

1. **xlsx-style** (fork dari xlsx dengan dukungan styling), atau
2. **ExcelJS** (library alternatif dengan full styling support)

Implementasi saat ini fokus pada:
- ✅ Struktur data yang benar
- ✅ Merged cells
- ✅ Lebar kolom
- ✅ Header dokumen dinamis

Styling (bold, border, center alignment) dapat ditambahkan nanti jika diperlukan dengan migrasi ke library yang mendukung.

## Testing

### Manual Testing
1. Buka aplikasi
2. Navigasi ke Data Builder → Agregasi Cepat
3. Klik "Tampilkan Agregasi Cepat"
4. Pastikan filter "Semua Unit Kerja" aktif
5. Klik "Export Excel"
6. Buka file Excel yang diunduh
7. Cek sheet "Tabel Pendidikan per Unit":
   - ✅ Baris 1: Judul dengan bulan/tahun saat ini
   - ✅ Baris 2: Sub-judul
   - ✅ Baris 3: Header kolom dengan JML PEG di awal dan akhir
   - ✅ Data per unit kerja
   - ✅ Baris JUMLAH di akhir
   - ✅ Kolom JML PEG pertama = JML PEG kedua

### Verifikasi Merged Cells
- Klik sel A1 → harus terseleksi sampai N1
- Klik sel A2 → harus terseleksi sampai N2

## Status

✅ **Implementasi selesai**
- Semua requirements terpenuhi kecuali styling (bold, border, alignment)
- Struktur dan data sudah sesuai format resmi
- Merged cells berfungsi dengan baik
- Siap untuk testing manual

## File yang Diubah

- `src/components/data-builder/QuickAggregation.tsx` (Sheet 13 export logic)

## Dokumentasi Terkait

- Requirements: `.kiro/specs/export-agregasi-pendidikan-format-resmi/requirements.md`
- Dokumen referensi: `Rekap Pegawai Binalavotas Maret 2026.xlsx`
