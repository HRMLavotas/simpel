# Requirements Document

## Introduction

Fitur ini memperbarui fungsi export data agregasi pendidikan pada komponen `QuickAggregation` agar Sheet "Tabel Pendidikan per Unit" mengikuti format laporan resmi "Rekap Pegawai Ditjen Binalavotas". Format resmi mengharuskan adanya judul dokumen dinamis, sub-judul, kolom JML PEG ganda (di awal dan di akhir sebagai verifikasi), label kolom yang sesuai standar, serta styling Excel (merged cells, bold, border) yang mencerminkan dokumen resmi.

## Glossary

- **Exporter**: Modul/fungsi `handleExport` di dalam komponen `QuickAggregation.tsx` yang bertanggung jawab menghasilkan file Excel.
- **Sheet Pendidikan**: Sheet bernama "Tabel Pendidikan per Unit" di dalam workbook Excel yang dihasilkan Exporter.
- **Header Dokumen**: Baris pertama dan kedua pada Sheet Pendidikan yang berisi judul dan sub-judul laporan.
- **Judul Utama**: Teks "REKAP PEGAWAI DITJEN BULAN [BULAN] [TAHUN]" pada baris pertama Header Dokumen.
- **Sub-Judul**: Teks "Dukungan Personil Berdasarkan Tingkat Pendidikan" pada baris kedua Header Dokumen.
- **Baris Header Kolom**: Baris ketiga pada Sheet Pendidikan yang berisi label kolom tabel.
- **Kolom JML PEG Pertama**: Kolom ketiga (setelah NO. dan UNIT KERJA) yang menampilkan jumlah pegawai ASN per unit kerja.
- **Kolom JML PEG Kedua**: Kolom terakhir (setelah S3) yang menampilkan ulang jumlah pegawai ASN per unit kerja sebagai verifikasi.
- **Tingkat Pendidikan**: Jenjang pendidikan formal dengan urutan: SD, SMP, SMA, D1, D2, D3, D4, S1, S2, S3.
- **Baris JUMLAH**: Baris terakhir tabel yang berisi penjumlahan seluruh kolom numerik.
- **Merged Cell**: Sel Excel yang digabungkan secara horizontal atau vertikal untuk membentuk satu sel besar.
- **ASN**: Aparatur Sipil Negara, mencakup PNS dan PPPK (tidak termasuk Non ASN/Tenaga Alih Daya).
- **Bulan Dinamis**: Nama bulan dalam Bahasa Indonesia (JANUARI–DESEMBER) yang diambil dari tanggal saat export dilakukan.
- **Tahun Dinamis**: Tahun empat digit yang diambil dari tanggal saat export dilakukan.

## Requirements

### Requirement 1: Header Dokumen Dinamis

**User Story:** Sebagai pengguna yang mengunduh laporan, saya ingin Sheet Pendidikan memiliki judul resmi di bagian atas, agar dokumen Excel langsung dapat digunakan sebagai laporan formal tanpa perlu pengeditan manual.

#### Acceptance Criteria

1. WHEN Exporter membuat Sheet Pendidikan, THE Sheet Pendidikan SHALL menampilkan Judul Utama "REKAP PEGAWAI DITJEN BULAN [BULAN] [TAHUN]" pada baris pertama, di mana [BULAN] adalah Bulan Dinamis dan [TAHUN] adalah Tahun Dinamis berdasarkan tanggal saat export dijalankan.
2. WHEN Exporter membuat Sheet Pendidikan, THE Sheet Pendidikan SHALL menampilkan Sub-Judul "Dukungan Personil Berdasarkan Tingkat Pendidikan" pada baris kedua.
3. THE Exporter SHALL menghasilkan nama bulan dalam huruf kapital penuh (contoh: JANUARI, FEBRUARI, MARET) menggunakan locale Bahasa Indonesia.
4. WHEN tanggal export adalah bulan Maret 2026, THE Judul Utama SHALL menghasilkan teks "REKAP PEGAWAI DITJEN BULAN MARET 2026".

### Requirement 2: Merged Cells untuk Header Dokumen

**User Story:** Sebagai pengguna, saya ingin Judul Utama dan Sub-Judul tampil sebagai satu sel yang membentang di seluruh lebar tabel, agar tampilan header terlihat rapi dan profesional seperti dokumen resmi.

#### Acceptance Criteria

1. WHEN Exporter membuat Sheet Pendidikan, THE Sheet Pendidikan SHALL menerapkan Merged Cell pada baris Judul Utama yang mencakup seluruh kolom tabel (dari kolom NO. hingga kolom JML PEG Kedua).
2. WHEN Exporter membuat Sheet Pendidikan, THE Sheet Pendidikan SHALL menerapkan Merged Cell pada baris Sub-Judul yang mencakup seluruh kolom tabel (dari kolom NO. hingga kolom JML PEG Kedua).
3. THE Exporter SHALL menempatkan Baris Header Kolom pada baris ketiga Sheet Pendidikan, tepat di bawah Sub-Judul.

### Requirement 3: Styling Bold dan Alignment untuk Header

**User Story:** Sebagai pengguna, saya ingin Judul Utama, Sub-Judul, dan Baris Header Kolom ditampilkan dengan teks tebal (bold) dan rata tengah, agar hierarki visual dokumen jelas dan sesuai standar laporan resmi.

#### Acceptance Criteria

1. WHEN Exporter membuat Sheet Pendidikan, THE Sheet Pendidikan SHALL menerapkan style bold (font.bold = true) pada sel Judul Utama.
2. WHEN Exporter membuat Sheet Pendidikan, THE Sheet Pendidikan SHALL menerapkan style bold pada sel Sub-Judul.
3. WHEN Exporter membuat Sheet Pendidikan, THE Sheet Pendidikan SHALL menerapkan style bold pada setiap sel di Baris Header Kolom.
4. WHEN Exporter membuat Sheet Pendidikan, THE Sheet Pendidikan SHALL menerapkan alignment horizontal center pada sel Judul Utama dan Sub-Judul.

### Requirement 4: Kolom JML PEG Ganda

**User Story:** Sebagai pengguna yang memverifikasi data, saya ingin kolom JML PEG muncul dua kali (di awal dan di akhir tabel), agar saya dapat memverifikasi bahwa penjumlahan kolom pendidikan sama dengan total pegawai.

#### Acceptance Criteria

1. THE Sheet Pendidikan SHALL memiliki Baris Header Kolom dengan urutan: NO. | UNIT KERJA | JML PEG | SD | SMP | SMA | D1 | D2 | D3 | D4 | S1 | S2 | S3 | JML PEG.
2. WHEN Exporter mengisi baris data per unit kerja, THE Sheet Pendidikan SHALL mengisi Kolom JML PEG Pertama dengan jumlah total pegawai ASN pada unit kerja tersebut.
3. WHEN Exporter mengisi baris data per unit kerja, THE Sheet Pendidikan SHALL mengisi Kolom JML PEG Kedua dengan nilai yang identik dengan Kolom JML PEG Pertama pada baris yang sama.
4. WHEN Exporter mengisi Baris JUMLAH, THE Sheet Pendidikan SHALL mengisi Kolom JML PEG Pertama dan Kolom JML PEG Kedua pada Baris JUMLAH dengan total keseluruhan pegawai ASN dari semua unit kerja.
5. FOR ALL baris data unit kerja, nilai Kolom JML PEG Pertama SHALL sama dengan penjumlahan nilai kolom SD + SMP + SMA + D1 + D2 + D3 + D4 + S1 + S2 + S3 pada baris yang sama (round-trip property: total = sum of parts).

### Requirement 5: Label Kolom Pendidikan Standar

**User Story:** Sebagai pengguna, saya ingin label kolom pendidikan menggunakan nama standar tanpa variasi, agar laporan konsisten dengan format resmi yang berlaku.

#### Acceptance Criteria

1. THE Sheet Pendidikan SHALL menggunakan label "SMA" (bukan "SMA/SMK") pada Baris Header Kolom untuk kolom pendidikan tingkat SMA.
2. THE Sheet Pendidikan SHALL menggunakan urutan kolom pendidikan: SD, SMP, SMA, D1, D2, D3, D4, S1, S2, S3 tanpa perubahan urutan.
3. WHEN data pegawai memiliki tingkat pendidikan "SMA/SMK" dalam database, THE Exporter SHALL menghitung pegawai tersebut ke dalam kolom berlabel "SMA" pada Sheet Pendidikan.

### Requirement 6: Border pada Sel Tabel

**User Story:** Sebagai pengguna, saya ingin setiap sel pada tabel (Baris Header Kolom dan baris data) memiliki border, agar tabel terlihat terstruktur dan mudah dibaca seperti dokumen resmi.

#### Acceptance Criteria

1. WHEN Exporter membuat Sheet Pendidikan, THE Sheet Pendidikan SHALL menerapkan border tipis (thin border) pada semua sisi (atas, bawah, kiri, kanan) setiap sel di Baris Header Kolom.
2. WHEN Exporter membuat Sheet Pendidikan, THE Sheet Pendidikan SHALL menerapkan border tipis pada semua sisi setiap sel di setiap baris data unit kerja.
3. WHEN Exporter membuat Sheet Pendidikan, THE Sheet Pendidikan SHALL menerapkan border tipis pada semua sisi setiap sel di Baris JUMLAH.

### Requirement 7: Baris JUMLAH di Akhir Tabel

**User Story:** Sebagai pengguna, saya ingin ada baris JUMLAH di akhir tabel yang menjumlahkan semua kolom numerik, agar saya dapat melihat total keseluruhan tanpa menghitung manual.

#### Acceptance Criteria

1. WHEN Exporter membuat Sheet Pendidikan, THE Sheet Pendidikan SHALL menampilkan Baris JUMLAH sebagai baris terakhir tabel, setelah semua baris data unit kerja.
2. THE Exporter SHALL mengisi sel "UNIT KERJA" pada Baris JUMLAH dengan teks "JUMLAH".
3. THE Exporter SHALL mengisi setiap kolom numerik pada Baris JUMLAH dengan penjumlahan nilai kolom yang sama dari seluruh baris data unit kerja.
4. WHEN Exporter membuat Sheet Pendidikan, THE Sheet Pendidikan SHALL menerapkan style bold pada seluruh sel di Baris JUMLAH.

### Requirement 8: Lebar Kolom yang Sesuai

**User Story:** Sebagai pengguna, saya ingin lebar kolom pada Sheet Pendidikan disesuaikan dengan konten, agar teks tidak terpotong dan dokumen langsung dapat dicetak tanpa penyesuaian manual.

#### Acceptance Criteria

1. THE Sheet Pendidikan SHALL menetapkan lebar kolom NO. sebesar 5 karakter.
2. THE Sheet Pendidikan SHALL menetapkan lebar kolom UNIT KERJA sebesar minimal 32 karakter.
3. THE Sheet Pendidikan SHALL menetapkan lebar setiap kolom Tingkat Pendidikan (SD, SMP, SMA, D1, D2, D3, D4, S1, S2, S3) sebesar 6 karakter.
4. THE Sheet Pendidikan SHALL menetapkan lebar kolom JML PEG (pertama dan kedua) sebesar 8 karakter.

### Requirement 9: Konsistensi Data dengan Sheet Lain

**User Story:** Sebagai pengguna, saya ingin data pada Sheet Pendidikan konsisten dengan data pada sheet lain dalam workbook yang sama, agar tidak ada inkonsistensi antar sheet dalam satu file export.

#### Acceptance Criteria

1. WHEN Exporter menghasilkan workbook, THE Sheet Pendidikan SHALL menggunakan sumber data yang sama (variabel `data` dan `deptEduMap`) dengan sheet-sheet lain dalam workbook yang sama.
2. WHEN Exporter menghasilkan workbook, THE Sheet Pendidikan SHALL menggunakan urutan unit kerja yang sama dengan `OFFICIAL_DEPT_ORDER` yang digunakan pada Sheet Golongan per Unit.
3. WHEN Exporter menghasilkan workbook, THE Sheet Pendidikan SHALL hanya menghitung pegawai dengan status ASN (PNS dan PPPK), mengecualikan Non ASN, konsisten dengan logika yang sudah ada.

### Requirement 10: Kondisi Pembuatan Sheet

**User Story:** Sebagai pengguna, saya ingin Sheet Pendidikan hanya dibuat ketika data mencakup semua unit kerja, agar sheet tidak muncul saat filter unit kerja aktif dan data tidak relevan untuk format tabel per unit.

#### Acceptance Criteria

1. WHEN `selectedDepartment` bernilai "all" DAN `aggregations.department.length` lebih dari 1, THE Exporter SHALL membuat Sheet Pendidikan dalam workbook.
2. WHEN `selectedDepartment` bukan "all" ATAU `aggregations.department.length` tidak lebih dari 1, THE Exporter SHALL tidak membuat Sheet Pendidikan dalam workbook.
3. IF pembuatan Sheet Pendidikan gagal karena error, THEN THE Exporter SHALL mencatat error ke console dan melanjutkan proses export sheet-sheet lain tanpa menghentikan keseluruhan proses export.
