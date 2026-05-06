# Agregasi Cepat - Jumlah ASN per Unit Kerja

## 📋 Overview

Fitur baru di **Agregasi Cepat** yang menampilkan tabel jumlah ASN dan Non ASN per unit kerja dalam format laporan bulanan resmi.

## ✨ Fitur yang Ditambahkan

### Sheet Baru: "Jumlah ASN per Unit"

Sheet ini menampilkan data dalam format tabel seperti laporan bulanan resmi dengan kolom:

| No | Nama Unit kerja | JUMLAH ASN (PNS + CPNS + PPPK) | Jumlah Tenaga Non ASN / Outsourcing | Jumlah ASN dan Tenaga Non ASN |
|----|-----------------|--------------------------------|-------------------------------------|-------------------------------|
| 1  | Setditjen Binalavotas | 96 | 11 | 107 |
| 2  | Direktorat Bina Stankomproglat | 52 | 2 | 54 |
| ... | ... | ... | ... | ... |
| 28 | BPVP Belitung | 42 | 25 | 67 |
|    | **JUMLAH** | **2534** | **702** | **3236** |

## 🎯 Cara Menggunakan

### Langkah 1: Buka Data Builder
```
1. Navigasi ke menu Data Builder
2. Klik tab "Agregasi Cepat"
3. Klik tombol "Tampilkan Agregasi Cepat"
```

### Langkah 2: Export Excel
```
1. Setelah data dimuat, klik tombol "Export Excel"
2. File akan diunduh dengan nama: agregasi-cepat-YYYY-MM-DD.xlsx
3. Buka file Excel dan lihat sheet "Jumlah ASN per Unit"
```

## 📊 Detail Implementasi

### Kategori ASN
**JUMLAH ASN (PNS + CPNS + PPPK)** mencakup:
- PNS (Pegawai Negeri Sipil)
- CPNS (Calon Pegawai Negeri Sipil)
- PPPK (Pegawai Pemerintah dengan Perjanjian Kerja)

### Kategori Non ASN
**Jumlah Tenaga Non ASN / Outsourcing** mencakup:
- Tenaga Alih Daya
- Non ASN
- Outsourcing

### Urutan Unit Kerja
Unit kerja diurutkan sesuai format laporan resmi:
1. Setditjen Binalavotas
2. Direktorat Bina Stankomproglat
3. Direktorat Bina Intala
4. Direktorat Bina Peningkatan Produktivitas
5. Direktorat Bina Lemlatvok
6. Direktorat Bina Penyelenggaraan Latvogan
7. Set. BNSP
8. BBPVP (6 unit)
9. BPVP (20 unit)
10. Satpel (12 unit)
11. Workshop (3 unit)

## 📁 Format Output Excel

### Sheet: "Jumlah ASN per Unit"

**Kolom:**
1. **No** - Nomor urut (1, 2, 3, ...)
2. **Nama Unit kerja** - Nama lengkap unit kerja
3. **JUMLAH ASN (PNS + CPNS + PPPK)** - Total pegawai ASN
4. **Jumlah Tenaga Non ASN / Outsourcing** - Total tenaga non ASN
5. **Jumlah ASN dan Tenaga Non ASN** - Total keseluruhan

**Baris Terakhir:**
- Baris "JUMLAH" menampilkan total keseluruhan untuk semua unit kerja

**Lebar Kolom:**
- No: 5 karakter
- Nama Unit kerja: 32 karakter
- JUMLAH ASN: 28 karakter
- Jumlah Tenaga Non ASN: 35 karakter
- Jumlah ASN dan Tenaga Non ASN: 30 karakter

## 💡 Contoh Penggunaan

### Kasus 1: Laporan Bulanan

**Kebutuhan:**
Membuat laporan bulanan jumlah ASN dan Non ASN per unit kerja untuk pimpinan.

**Solusi:**
```
1. Buka Data Builder → Agregasi Cepat
2. Klik "Tampilkan Agregasi Cepat"
3. Klik "Export Excel"
4. Buka sheet "Jumlah ASN per Unit"
5. Copy tabel ke dokumen laporan bulanan
```

**Hasil:**
Tabel siap pakai dengan format resmi yang dapat langsung digunakan dalam laporan.

### Kasus 2: Monitoring Perubahan

**Kebutuhan:**
Membandingkan jumlah ASN dan Non ASN bulan ini dengan bulan lalu.

**Solusi:**
```
Bulan Lalu:
1. Export Agregasi Cepat → agregasi-cepat-2026-04-30.xlsx
2. Simpan sheet "Jumlah ASN per Unit"

Bulan Ini:
1. Export Agregasi Cepat → agregasi-cepat-2026-05-31.xlsx
2. Buka sheet "Jumlah ASN per Unit"
3. Bandingkan dengan data bulan lalu
```

**Hasil:**
Mudah melihat perubahan jumlah ASN dan Non ASN per unit kerja.

### Kasus 3: Presentasi untuk Rapat

**Kebutuhan:**
Presentasi komposisi ASN dan Non ASN untuk rapat koordinasi.

**Solusi:**
```
1. Export Agregasi Cepat
2. Buka sheet "Jumlah ASN per Unit"
3. Copy tabel ke PowerPoint
4. Buat chart/grafik jika diperlukan
5. Presentasi!
```

**Hasil:**
Presentasi dengan data akurat dan format profesional.

## 🔧 Technical Details

### File yang Dimodifikasi
- `src/components/data-builder/QuickAggregation.tsx`

### Fungsi Utama

#### Logika Penghitungan ASN
```typescript
// Hitung ASN (PNS + CPNS + PPPK)
const asnCount = emps.filter(e => {
  const status = normalizeAsnStatus(e.asn_status);
  return status === 'PNS' || status === 'CPNS' || status === 'PPPK';
}).length;
```

#### Logika Penghitungan Non ASN
```typescript
// Hitung Non ASN / Outsourcing
const nonAsnCount = emps.filter(e => {
  const status = normalizeAsnStatus(e.asn_status);
  return status === 'Non ASN';
}).length;
```

#### Urutan Unit Kerja
```typescript
const sortedAsnDepts = [
  ...OFFICIAL_DEPT_ORDER.filter(d => deptAsnSet.has(d)),
  ...[...deptAsnSet].filter(d => !OFFICIAL_DEPT_ORDER.includes(d)).sort(),
];
```

### Struktur Data Output
```typescript
{
  'No': 1,
  'Nama Unit kerja': 'Setditjen Binalavotas',
  'JUMLAH ASN (PNS + CPNS + PPPK)': 96,
  'Jumlah Tenaga Non ASN / Outsourcing': 11,
  'Jumlah ASN dan Tenaga Non ASN': 107,
}
```

## ⚠️ Catatan Penting

### 1. Filter Unit Kerja
- Sheet ini hanya muncul jika filter "Semua Unit Kerja" dipilih
- Jika memfilter unit kerja tertentu, sheet ini tidak akan muncul

### 2. Status ASN
- Sistem otomatis mendeteksi status ASN dari field `asn_status`
- Normalisasi otomatis untuk berbagai format input (PNS, pns, Pns, dll)

### 3. Data Non ASN
- Termasuk: "Tenaga Alih Daya", "Non ASN", "Outsourcing"
- Sistem otomatis mendeteksi dari field `asn_status`

### 4. Urutan Unit Kerja
- Mengikuti urutan resmi laporan bulanan
- Unit kerja yang tidak ada di daftar resmi akan muncul di akhir (alphabetical)

## 📈 Keuntungan

| Keuntungan | Deskripsi |
|------------|-----------|
| ⚡ Otomatis | Tidak perlu hitung manual, sistem otomatis menghitung |
| 📊 Format Resmi | Sesuai format laporan bulanan resmi |
| 🎯 Akurat | Data langsung dari database, tidak ada kesalahan manual |
| 📁 Siap Pakai | Dapat langsung digunakan untuk laporan |
| 🔄 Konsisten | Format selalu sama setiap bulan |

## 🚀 Posisi Sheet dalam Excel

Urutan sheet dalam file Excel:
1. Ringkasan
2. Status ASN
3. Pangkat Utama
4. Pangkat Detail
5. Jenis Jabatan
6. Pendidikan
7. Jenis Kelamin
8. Agama
9. Rentang Usia
10. Masa Kerja
11. Unit Kerja
12. **Jumlah ASN per Unit** ⭐ BARU
13. Tabel Golongan per Unit
14. Tabel Pendidikan per Unit
15. Perbandingan Pendidikan

## 📞 Support

Jika ada pertanyaan tentang fitur ini:
- Baca dokumentasi ini
- Hubungi admin sistem
- Buat ticket di helpdesk

---

**Tanggal Implementasi:** 6 Mei 2026  
**Versi:** 1.0  
**Status:** ✅ Aktif

---

**Happy Reporting! 📊✨**
