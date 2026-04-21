# Fitur Audit Data Pegawai

## Deskripsi
Fitur Audit Data memungkinkan admin pusat dan admin unit untuk mengidentifikasi dan memperbaiki data pegawai yang tidak lengkap atau tidak sesuai format.

## Akses
- **Admin Pusat**: Dapat melihat dan memperbaiki data dari semua unit kerja
- **Admin Unit**: Hanya dapat melihat dan memperbaiki data dari unit kerja mereka sendiri

## Fitur Utama

### 1. Dashboard Audit
- **Total Data Bermasalah**: Jumlah pegawai yang memiliki data tidak lengkap atau format salah
- **Total Masalah**: Jumlah total masalah yang terdeteksi
- **Tingkat Kelengkapan**: Persentase data yang sudah lengkap

### 2. Deteksi Masalah Otomatis

#### Data Kosong (Missing Field)
- Jenis kelamin belum diisi
- Tanggal lahir belum diisi
- Tempat lahir belum diisi
- Agama belum diisi
- Pangkat/Golongan belum diisi
- Jabatan belum diisi
- Status ASN belum diisi

#### Format Tidak Valid (Invalid Format)
- **NIP**: Harus 18 digit angka
- **Pangkat/Golongan**: Harus format seperti "IV/a", "III/c", "II/b", dll
  - Contoh format yang benar: `I/a`, `II/b`, `III/c`, `IV/d`
  - Contoh format yang salah: `IV`, `4`, `IVa`, `4/a`

### 3. Filter dan Pencarian
- **Pencarian**: Cari berdasarkan nama, NIP, atau unit kerja
- **Filter Masalah**: Filter berdasarkan jenis masalah
  - Semua Masalah
  - Data Kosong
  - Format Salah
  - Data Tidak Lengkap

### 4. Perbaikan Data
- Klik tombol **Perbaiki** pada data pegawai yang bermasalah
- Modal edit akan terbuka langsung ke field yang bermasalah
- Setelah diperbaiki, data akan otomatis dihapus dari daftar audit jika sudah lengkap

## Cara Menggunakan

### Untuk Admin Unit
1. Login ke sistem
2. Klik menu **Audit Data** di sidebar
3. Lihat daftar pegawai di unit Anda yang datanya bermasalah
4. Klik tombol **Perbaiki** pada pegawai yang ingin diperbaiki
5. Lengkapi atau perbaiki data yang bermasalah
6. Klik **Simpan**

### Untuk Admin Pusat
1. Login ke sistem
2. Klik menu **Audit Data** di sidebar
3. Lihat daftar pegawai dari semua unit yang datanya bermasalah
4. Gunakan filter dan pencarian untuk menemukan data tertentu
5. Klik tombol **Perbaiki** pada pegawai yang ingin diperbaiki
6. Lengkapi atau perbaiki data yang bermasalah
7. Klik **Simpan**

## Validasi Format

### Format NIP
- Harus 18 digit angka
- Contoh: `199001012020011001`

### Format Pangkat/Golongan
Sistem menerima beberapa format pangkat:

#### Format PNS:
- **Format Lengkap** (Recommended): `Penata Muda Tk I (III/b)`, `Pembina (IV/a)`
- **Format Pendek**: `III/b`, `IV/a`
- Golongan: I, II, III, atau IV (angka romawi)
- Ruang: a, b, c, d, atau e (huruf kecil)

#### Format PPPK:
- Hanya: **III**, **V**, **VII**, **IX**
- Tidak ada golongan lain untuk PPPK

#### Contoh Valid:
**PNS Format Lengkap:**
- `Juru Muda (I/a)`
- `Pengatur Muda Tk I (II/b)`
- `Penata Muda Tk I (III/b)`
- `Pembina (IV/a)`
- `Pembina Utama (IV/e)`

**PNS Format Pendek:**
- `I/a`, `I/b`, `I/c`, `I/d`
- `II/a`, `II/b`, `II/c`, `II/d`
- `III/a`, `III/b`, `III/c`, `III/d`
- `IV/a`, `IV/b`, `IV/c`, `IV/d`, `IV/e`

**PPPK:**
- `III`, `V`, `VII`, `IX`
- **Catatan**: PPPK hanya memiliki 4 golongan ini

**Khusus:**
- `Tidak Ada` (untuk pegawai yang belum memiliki pangkat)

## Badge Warna
- 🔴 **Merah**: Data Kosong (Missing Field)
- 🟠 **Orange**: Format Salah (Invalid Format)
- 🟡 **Kuning**: Data Tidak Lengkap (Incomplete Data)

## Integrasi dengan Fitur Lain
- Data yang diperbaiki akan langsung tersinkronisasi dengan:
  - Data Pegawai
  - Monitoring Unit (jika ada perubahan)
  - Dashboard statistik

## Tips
1. Prioritaskan perbaikan data dengan badge merah (data kosong)
2. Gunakan filter untuk fokus pada jenis masalah tertentu
3. Sistem menerima format pangkat lengkap (contoh: "Penata Muda Tk I (III/b)") atau pendek ("III/b")
4. Untuk PPPK, gunakan angka romawi (I-XVII)
5. Jika NIP tidak valid, periksa apakah ada spasi atau karakter non-angka

## Contoh Kasus Perbaikan

### Kasus 1: Format Pangkat Salah
**Masalah**: Pangkat tertulis "IV" atau "4" atau "IVa" (tanpa format yang benar)
**Solusi**: 
1. Klik tombol Perbaiki
2. Pilih dari dropdown format yang benar:
   - Format lengkap: "Pembina (IV/a)" (recommended)
   - Atau format pendek: "IV/a"
3. Simpan

### Kasus 2: Data Jenis Kelamin Kosong
**Masalah**: Field gender kosong
**Solusi**:
1. Klik tombol Perbaiki
2. Pilih "Laki-laki" atau "Perempuan"
3. Simpan

### Kasus 3: NIP Tidak Valid
**Masalah**: NIP kurang dari 18 digit atau ada spasi
**Solusi**:
1. Klik tombol Perbaiki
2. Perbaiki NIP menjadi 18 digit tanpa spasi
3. Simpan

## Troubleshooting

### Data tidak muncul di daftar audit setelah diperbaiki
- Refresh halaman (F5)
- Pastikan semua field yang bermasalah sudah diperbaiki

### Format pangkat masih dianggap salah
- Gunakan dropdown untuk memilih pangkat (lebih aman daripada ketik manual)
- Format yang diterima:
  - PNS: "Penata Muda Tk I (III/b)" atau "III/b"
  - PPPK: "I", "II", "III", dst (angka romawi)
- Jika ketik manual, pastikan tidak ada spasi ekstra

### NIP masih dianggap tidak valid
- Pastikan NIP terdiri dari 18 digit angka
- Hapus semua spasi atau karakter non-angka
- Contoh: `199001012020011001` (benar), `1990 0101 2020 011001` (salah)
