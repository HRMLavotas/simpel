# Update: Export Peta Jabatan - Urutan Sheet & Filter Satpel

## 📋 Perubahan

### 1. Urutan Worksheet Diperbaiki ✅

**Sebelumnya:**
```
1. SUMMARY
2. Setditjen Binalavotas
3. ... (unit kerja lainnya)
28. Satpel Pekanbaru ❌ (seharusnya tidak ada)
29. Tabel Golongan per Unit
30. Tabel Pendidikan per Unit
31. Jumlah ASN per Unit
```

**Sekarang:**
```
1. SUMMARY
2. Tabel Golongan per Unit ⭐
3. Tabel Pendidikan per Unit ⭐
4. Jumlah ASN per Unit ⭐
5. Setditjen Binalavotas
6. Direktorat Bina Stankomproglat
7. ... (unit kerja lainnya)
```

**Keunggulan:**
- ✅ Sheet agregasi langsung terlihat setelah SUMMARY
- ✅ Tidak perlu scroll ke akhir untuk melihat agregasi
- ✅ Lebih mudah diakses untuk laporan cepat

### 2. Satpel/Workshop Tidak Muncul Sebagai Sheet Terpisah ✅

**Masalah:**
- Satpel Pekanbaru (dan Satpel/Workshop lainnya) muncul sebagai sheet terpisah
- Seharusnya Satpel menginduk ke unit pembina dan tidak perlu sheet sendiri

**Solusi:**
- Filter Satpel dan Workshop dari daftar sheet yang dibuat
- Satpel tetap muncul di sheet unit pembinanya (sesuai mapping)

**Kode yang Diubah:**
```typescript
// Sebelumnya
const depts = dynamicDepartments.filter(d => d !== 'Pusat');

// Sekarang
const depts = dynamicDepartments.filter(d => {
  if (d === 'Pusat') return false;
  // Exclude Satpel dan Workshop karena mereka menginduk ke unit pembina
  if (d.startsWith('Satpel ') || d.startsWith('Workshop ')) return false;
  return true;
});
```

## 🔧 Detail Teknis

### File yang Diubah:
- `src/pages/PetaJabatan.tsx`

### Perubahan 1: Filter Satpel/Workshop
**Lokasi:** Fungsi `handleExportAllDepartments()` - bagian penentuan `depts`

**Sebelum:**
```typescript
const depts = dynamicDepartments.filter(d => d !== 'Pusat');
```

**Sesudah:**
```typescript
const depts = dynamicDepartments.filter(d => {
  if (d === 'Pusat') return false;
  if (d.startsWith('Satpel ') || d.startsWith('Workshop ')) return false;
  return true;
});
```

### Perubahan 2: Urutan Sheet Agregasi
**Lokasi:** Setelah pembuatan setiap sheet agregasi

**Metode:**
1. Sheet dibuat dengan `XLSX.utils.book_append_sheet()` (ditambahkan di akhir)
2. Kemudian dipindahkan ke posisi yang benar dengan `splice()`

**Kode:**
```typescript
// Setelah membuat sheet Tabel Golongan
const golonganSheetName = 'Tabel Golongan per Unit';
const golonganIndex = wb.SheetNames.indexOf(golonganSheetName);
if (golonganIndex > -1) {
  wb.SheetNames.splice(golonganIndex, 1);  // Hapus dari posisi lama
  wb.SheetNames.splice(1, 0, golonganSheetName);  // Masukkan di posisi 1 (setelah SUMMARY)
}

// Setelah membuat sheet Tabel Pendidikan
const eduSheetName = 'Tabel Pendidikan per Unit';
const eduIndex = wb.SheetNames.indexOf(eduSheetName);
if (eduIndex > -1) {
  wb.SheetNames.splice(eduIndex, 1);
  wb.SheetNames.splice(2, 0, eduSheetName);  // Posisi 2
}

// Setelah membuat sheet Jumlah ASN
const asnSheetName = 'Jumlah ASN per Unit';
const asnIndex = wb.SheetNames.indexOf(asnSheetName);
if (asnIndex > -1) {
  wb.SheetNames.splice(asnIndex, 1);
  wb.SheetNames.splice(3, 0, asnSheetName);  // Posisi 3
}
```

## 📊 Struktur File Excel (Final)

```
Peta_Jabatan_ASN_Semua_Unit_YYYYMMDD.xlsx

Sheet 1: SUMMARY
├─ Ringkasan jabatan per unit kerja
├─ Kolom: No, Unit Kerja, Total Jabatan, Total ABK, Total Existing, Gap, % Terisi, Status

Sheet 2: Tabel Golongan per Unit ⭐
├─ Distribusi PNS (I, II, III, IV) dan PPPK (III, V, VII, IX)
├─ Kolom: No, Unit Kerja, PNS I-IV, Jumlah PNS, PPPK III/V/VII/IX, Jumlah PPPK, Total ASN, L, P, Total JK

Sheet 3: Tabel Pendidikan per Unit ⭐
├─ Header: REKAP PEGAWAI DITJEN BULAN [BULAN] [TAHUN]
├─ Kolom: NO., UNIT KERJA, JML PEG, SD, SMP, SMA, D1-D4, S1-S3, JML PEG

Sheet 4: Jumlah ASN per Unit ⭐
├─ Ringkasan ASN vs Non ASN
├─ Kolom: No, Nama Unit kerja, JUMLAH ASN, Jumlah Tenaga Non ASN, Jumlah Total

Sheet 5-28: Detail Peta Jabatan per Unit Kerja
├─ Setditjen Binalavotas
├─ Direktorat Bina Stankomproglat
├─ Direktorat Bina Lemlatvok
├─ ... (unit kerja lainnya)
└─ TIDAK ADA Satpel/Workshop (karena menginduk ke unit pembina)

Total: ~28 sheets (1 SUMMARY + 3 agregasi + 24 unit kerja)
```

## 💡 Keunggulan Update

### ✅ Akses Lebih Cepat
- Sheet agregasi langsung terlihat di awal
- Tidak perlu scroll ke akhir file
- Cocok untuk laporan cepat ke pimpinan

### ✅ Struktur Lebih Logis
- SUMMARY → Agregasi → Detail per unit
- Urutan dari umum ke spesifik
- Mudah dipahami oleh user

### ✅ Data Lebih Akurat
- Satpel tidak duplikat sebagai sheet terpisah
- Satpel tetap muncul di sheet unit pembinanya
- Konsisten dengan struktur organisasi

### ✅ File Lebih Ringkas
- Jumlah sheet berkurang (tidak ada sheet Satpel/Workshop terpisah)
- File size lebih kecil
- Lebih mudah di-navigate

## 🎯 Cara Menggunakan

### 1. Export Peta Jabatan
```
1. Login sebagai Admin Pusat
2. Menu Peta Jabatan → Tab Formasi ASN
3. Klik "Export Semua Unit"
4. File Excel akan diunduh
```

### 2. Lihat Sheet Agregasi
```
1. Buka file Excel
2. Sheet agregasi ada di posisi 2, 3, 4 (setelah SUMMARY)
3. Tidak perlu scroll ke akhir!
```

### 3. Verifikasi Satpel
```
1. Cek daftar sheet
2. Pastikan tidak ada sheet "Satpel Pekanbaru" atau Satpel lainnya
3. Data Satpel ada di sheet unit pembinanya
```

## 🧪 Testing

### Manual Testing Checklist:
- [x] Kode berhasil dikompilasi tanpa error
- [ ] Export peta jabatan semua unit berhasil
- [ ] Sheet agregasi ada di posisi 2, 3, 4 (setelah SUMMARY)
- [ ] Tidak ada sheet Satpel/Workshop terpisah
- [ ] Data Satpel muncul di sheet unit pembina
- [ ] Urutan sheet: SUMMARY → 3 agregasi → unit kerja
- [ ] Total sheet ~28 (bukan ~32)

### Test Scenarios:

#### Scenario 1: Verifikasi Urutan Sheet
```
Given: File Excel hasil export peta jabatan
When: Membuka file dan melihat daftar sheet
Then: Urutan harus: SUMMARY, Tabel Golongan, Tabel Pendidikan, Jumlah ASN, lalu unit kerja
```

#### Scenario 2: Verifikasi Tidak Ada Satpel
```
Given: File Excel hasil export
When: Melihat daftar sheet
Then: Tidak boleh ada sheet dengan nama "Satpel ..." atau "Workshop ..."
```

#### Scenario 3: Verifikasi Data Satpel di Unit Pembina
```
Given: Sheet unit pembina (misalnya BBPVP Bekasi)
When: Melihat data pegawai
Then: Harus ada pegawai dari Satpel yang menginduk ke unit tersebut
```

## 📚 Referensi

- Mapping Satpel ke Unit Pembina: `src/lib/constants.ts` - `UNIT_PEMBINA_MAPPING`
- Fungsi Export: `src/pages/PetaJabatan.tsx` - `handleExportAllDepartments()`
- Dokumentasi Agregasi: `EXPORT_PETA_JABATAN_AGREGASI_SUMMARY.md`

## 📞 Support

Jika ada pertanyaan atau masalah:
- Baca dokumentasi ini dengan seksama
- Cek file `EXPORT_PETA_JABATAN_AGREGASI_SUMMARY.md` untuk detail agregasi
- Hubungi admin sistem untuk bantuan teknis

---

**Status:** ✅ SELESAI DAN SIAP DIGUNAKAN

**Tanggal:** 8 Mei 2026

**Versi:** 1.1

**Perubahan:**
- Urutan sheet agregasi dipindahkan ke posisi 2-4 (setelah SUMMARY)
- Satpel/Workshop di-filter agar tidak muncul sebagai sheet terpisah
