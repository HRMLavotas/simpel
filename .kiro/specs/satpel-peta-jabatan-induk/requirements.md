# Requirements Document

## Introduction

Fitur ini menangani tampilan Peta Jabatan untuk unit Satpel (Satuan Pelayanan) dan Workshop yang secara struktural tidak memiliki peta jabatan sendiri. Peta jabatan ASN Satpel menginduk ke unit pembinanya (BBPVP/BPVP). Ketika admin membuka Peta Jabatan untuk unit Satpel, sistem menampilkan peta jabatan dari unit pembinanya, dan pegawai yang secara fisik bertugas di Satpel tersebut mendapat badge/label penugasan khusus agar mudah diidentifikasi.

Konteks bisnis:
- Hierarki unit: Unit Pembina (BBPVP/BPVP) → Unit Binaan (Satpel/Workshop)
- Satpel tidak memiliki `position_references` sendiri — peta jabatan ASN-nya menginduk ke unit pembina
- Pegawai yang ditempatkan di Satpel secara administratif tetap ber-`department` = unit pembina, namun ada field `satuan_kerja_penugasan` yang menandai mereka bertugas di Satpel tertentu
- Saat ini halaman Peta Jabatan menampilkan data kosong jika unit yang dipilih adalah Satpel

## Glossary

- **Peta_Jabatan**: Halaman aplikasi yang menampilkan daftar jabatan (position_references) beserta pegawai yang mengisi jabatan tersebut untuk suatu unit kerja.
- **Satpel**: Satuan Pelayanan — unit kerja binaan yang tidak memiliki peta jabatan sendiri. Contoh: Satpel Lampung, Satpel Bantul.
- **Workshop**: Unit kerja binaan setara Satpel. Contoh: Workshop Prabumulih, Workshop Batam.
- **Unit_Pembina**: Unit kerja induk (BBPVP atau BPVP) yang membina satu atau lebih Satpel/Workshop. Contoh: BBPVP Serang membina Satpel Lampung.
- **UNIT_PEMBINA_MAPPING**: Konstanta di `src/lib/constants.ts` yang memetakan nama Satpel/Workshop ke nama Unit_Pembina-nya.
- **position_references**: Tabel database yang menyimpan daftar jabatan per unit kerja (department). Satpel tidak memiliki baris di tabel ini.
- **employees**: Tabel database yang menyimpan data pegawai. Field `department` berisi nama unit pembina untuk pegawai yang bertugas di Satpel.
- **satuan_kerja_penugasan**: Field baru di tabel `employees` yang menyimpan nama Satpel/Workshop tempat pegawai secara fisik bertugas. Null jika pegawai bertugas di unit pembina langsung.
- **Badge_Penugasan**: Label visual pada baris pegawai di Peta Jabatan yang menampilkan nama Satpel/Workshop tempat pegawai bertugas.
- **Admin_Unit**: Pengguna dengan role `admin_unit` yang mengelola data satu unit kerja.
- **Admin_Pusat**: Pengguna dengan role `admin_pusat` yang dapat mengakses semua unit kerja.
- **Admin_Pimpinan**: Pengguna dengan role `admin_pimpinan` yang dapat melihat semua unit kerja (read-only).

## Requirements

### Requirement 1: Tampilan Peta Jabatan Satpel Menginduk ke Unit Pembina

**User Story:** Sebagai admin yang membuka Peta Jabatan untuk unit Satpel, saya ingin melihat peta jabatan dari unit pembinanya, sehingga saya dapat mengetahui jabatan-jabatan yang relevan meskipun Satpel tidak memiliki peta jabatan sendiri.

#### Acceptance Criteria

1. WHEN pengguna memilih unit Satpel atau Workshop pada selector unit di halaman Peta_Jabatan, THE Peta_Jabatan SHALL menampilkan `position_references` milik Unit_Pembina dari Satpel tersebut berdasarkan `UNIT_PEMBINA_MAPPING`.
2. WHEN pengguna memilih unit Satpel atau Workshop pada selector unit di halaman Peta_Jabatan, THE Peta_Jabatan SHALL menampilkan label informasi yang menyatakan bahwa peta jabatan yang ditampilkan berasal dari Unit_Pembina tertentu.
3. WHILE unit yang dipilih adalah Satpel atau Workshop, THE Peta_Jabatan SHALL menonaktifkan tombol tambah, edit, dan hapus jabatan karena pengelolaan jabatan dilakukan di unit pembina.
4. WHEN pengguna memilih unit yang bukan Satpel atau Workshop, THE Peta_Jabatan SHALL menampilkan `position_references` milik unit tersebut secara langsung tanpa perubahan perilaku.
5. IF unit yang dipilih adalah Satpel atau Workshop tetapi tidak ditemukan dalam `UNIT_PEMBINA_MAPPING`, THEN THE Peta_Jabatan SHALL menampilkan pesan bahwa unit pembina tidak ditemukan dan tidak ada data jabatan yang ditampilkan.

---

### Requirement 2: Tampilan Pegawai Satpel dalam Peta Jabatan Unit Pembina

**User Story:** Sebagai admin unit pembina, saya ingin melihat pegawai yang bertugas di Satpel binaan saya ditandai dengan badge khusus di peta jabatan, sehingga saya dapat membedakan pegawai yang bertugas di unit pembina langsung dengan yang ditugaskan ke Satpel.

#### Acceptance Criteria

1. WHEN peta jabatan unit pembina ditampilkan dan terdapat pegawai dengan `satuan_kerja_penugasan` yang tidak null, THE Peta_Jabatan SHALL menampilkan Badge_Penugasan berisi nama Satpel/Workshop pada baris pegawai tersebut.
2. WHEN peta jabatan unit pembina ditampilkan dan pegawai memiliki `satuan_kerja_penugasan` null atau kosong, THE Peta_Jabatan SHALL menampilkan baris pegawai tersebut tanpa Badge_Penugasan.
3. THE Badge_Penugasan SHALL ditampilkan secara visual berbeda dari teks nama pegawai, menggunakan warna atau gaya yang konsisten dengan design system aplikasi.
4. WHEN peta jabatan ditampilkan untuk unit Satpel (menginduk ke unit pembina), THE Peta_Jabatan SHALL hanya menampilkan pegawai yang memiliki `satuan_kerja_penugasan` sama dengan nama Satpel yang dipilih, bukan seluruh pegawai unit pembina.
5. WHEN peta jabatan ditampilkan untuk unit pembina secara langsung, THE Peta_Jabatan SHALL menampilkan semua pegawai unit pembina termasuk yang memiliki `satuan_kerja_penugasan` (pegawai yang ditugaskan ke Satpel).

---

### Requirement 3: Field Satuan Kerja Penugasan pada Data Pegawai

**User Story:** Sebagai admin unit pembina, saya ingin dapat mencatat di Satpel mana seorang pegawai bertugas, sehingga sistem dapat menampilkan badge penugasan yang akurat di peta jabatan.

#### Acceptance Criteria

1. THE System SHALL menyediakan field `satuan_kerja_penugasan` bertipe varchar pada tabel `employees` di database untuk menyimpan nama Satpel/Workshop tempat pegawai bertugas.
2. WHEN admin mengisi atau mengubah field `satuan_kerja_penugasan` pada form pegawai, THE System SHALL memvalidasi bahwa nilai yang dimasukkan adalah nama Satpel/Workshop yang valid sesuai `UNIT_PEMBINA_MAPPING` atau null/kosong.
3. WHEN admin mengisi `satuan_kerja_penugasan` dengan nama Satpel yang bukan binaan dari unit pembina pegawai tersebut, THEN THE System SHALL menampilkan pesan peringatan bahwa Satpel yang dipilih bukan binaan dari unit pembina pegawai.
4. THE System SHALL menyediakan dropdown selector untuk field `satuan_kerja_penugasan` pada form pegawai, yang hanya menampilkan Satpel/Workshop yang merupakan binaan dari unit pembina pegawai tersebut.
5. WHEN `satuan_kerja_penugasan` dikosongkan atau di-null-kan, THE System SHALL menginterpretasikan pegawai tersebut bertugas langsung di unit pembina tanpa penugasan ke Satpel.

---

### Requirement 4: Akses Admin Satpel ke Peta Jabatan

**User Story:** Sebagai admin yang memiliki akun untuk unit Satpel, saya ingin dapat membuka halaman Peta Jabatan dan melihat peta jabatan yang relevan, sehingga saya memiliki visibilitas terhadap jabatan-jabatan di unit saya.

#### Acceptance Criteria

1. WHEN Admin_Unit dengan department Satpel atau Workshop membuka halaman Peta_Jabatan, THE Peta_Jabatan SHALL secara otomatis menampilkan peta jabatan dari Unit_Pembina yang sesuai.
2. WHILE Admin_Unit ber-department Satpel atau Workshop menggunakan halaman Peta_Jabatan, THE Peta_Jabatan SHALL menampilkan hanya pegawai yang memiliki `satuan_kerja_penugasan` sama dengan department admin tersebut.
3. WHILE Admin_Unit ber-department Satpel atau Workshop menggunakan halaman Peta_Jabatan, THE Peta_Jabatan SHALL menonaktifkan semua fungsi edit jabatan (tambah, ubah, hapus position_references) karena jabatan dikelola oleh unit pembina.
4. WHEN Admin_Unit ber-department Unit_Pembina membuka halaman Peta_Jabatan dan memilih salah satu Satpel binaannya dari selector, THE Peta_Jabatan SHALL menampilkan peta jabatan unit pembina dengan filter hanya pegawai yang bertugas di Satpel tersebut.

---

### Requirement 5: Konsistensi Data dan Integritas Referensial

**User Story:** Sebagai admin pusat, saya ingin memastikan data penugasan Satpel konsisten dan tidak menyebabkan inkonsistensi data, sehingga laporan dan peta jabatan selalu akurat.

#### Acceptance Criteria

1. THE System SHALL memastikan bahwa `department` pegawai yang memiliki `satuan_kerja_penugasan` selalu berisi nama Unit_Pembina dari Satpel tersebut, bukan nama Satpel itu sendiri.
2. WHEN data pegawai diimpor melalui fitur import Excel dan kolom `satuan_kerja_penugasan` tersedia, THE System SHALL memvalidasi bahwa nilai `satuan_kerja_penugasan` adalah Satpel/Workshop yang valid sesuai `UNIT_PEMBINA_MAPPING`.
3. IF nilai `satuan_kerja_penugasan` pada data impor tidak valid atau tidak dikenali, THEN THE System SHALL menampilkan peringatan pada baris data tersebut dan mengosongkan field `satuan_kerja_penugasan` daripada menyimpan nilai tidak valid.
4. THE System SHALL memastikan bahwa perubahan pada `UNIT_PEMBINA_MAPPING` di `constants.ts` tidak menyebabkan data `satuan_kerja_penugasan` yang sudah tersimpan menjadi tidak valid tanpa notifikasi kepada admin.
