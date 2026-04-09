# Quick Action - Testing Guide

## 🧪 Panduan Testing Fitur Quick Action

Dokumen ini berisi langkah-langkah detail untuk testing fitur Quick Action di form edit data pegawai.

## 📋 Pre-requisites

1. Aplikasi sudah running (development atau production)
2. User sudah login dengan akun yang memiliki akses edit pegawai
3. Ada data pegawai yang bisa diedit

## 🎯 Test Scenarios

### Scenario 1: Akses Quick Action Tab

**Langkah:**
1. Login ke aplikasi
2. Navigasi ke halaman Employees
3. Klik tombol "Edit" pada salah satu pegawai
4. Modal form akan terbuka

**Expected Result:**
- ✅ Modal terbuka dengan 4 tabs: "Quick Action", "Data Utama", "Riwayat", "Keterangan"
- ✅ Tab "Quick Action" adalah tab pertama (paling kiri)
- ✅ Tab "Quick Action" aktif secara default
- ✅ Muncul info box dengan icon 💡 dan text penjelasan
- ✅ Muncul 3 sub-tabs: "Naik Pangkat", "Pindah/Mutasi", "Ganti Jabatan"

### Scenario 2: Quick Action - Naik Pangkat

**Langkah:**
1. Buka form edit pegawai (lihat Scenario 1)
2. Pastikan tab "Quick Action" aktif
3. Klik sub-tab "Naik Pangkat" (jika belum aktif)
4. Perhatikan form yang muncul

**Expected Result:**
- ✅ Muncul card dengan title "🎯 Kenaikan Pangkat"
- ✅ Field "Pangkat Saat Ini" terisi otomatis (read-only, background abu-abu)
- ✅ Field "Pangkat Baru" adalah dropdown (belum terisi)
- ✅ Field "Tanggal" terisi dengan tanggal hari ini
- ✅ Field "TMT" terisi dengan tanggal hari ini
- ✅ Field "Nomor SK" kosong (opsional)
- ✅ Field "Keterangan" kosong (opsional)
- ✅ Tombol "Terapkan Kenaikan Pangkat" disabled (karena Pangkat Baru belum dipilih)

**Langkah Lanjutan:**
5. Pilih pangkat baru dari dropdown (contoh: IV/a)
6. Isi Nomor SK (contoh: 123/SK/2024)
7. Isi Keterangan (contoh: Kenaikan pangkat reguler)
8. Klik tombol "Terapkan Kenaikan Pangkat"

**Expected Result:**
- ✅ Muncul alert sukses berwarna hijau dengan icon ✅
- ✅ Alert text: "Pangkat berhasil diupdate! Data telah tersimpan di Data Utama dan Riwayat."
- ✅ Muncul toast notification di pojok kanan atas: "✅ Kenaikan Pangkat Berhasil - Pangkat diupdate menjadi IV/a"
- ✅ Form Quick Action direset (Pangkat Baru kembali kosong, Nomor SK dan Keterangan kosong)
- ✅ Alert sukses hilang setelah 3 detik

**Verifikasi:**
9. Klik tab "Data Utama"
10. Scroll ke section "Data Kepegawaian"
11. Lihat field "Golongan/Pangkat"

**Expected Result:**
- ✅ Field "Golongan/Pangkat" berubah menjadi "IV/a"

**Verifikasi Lanjutan:**
12. Klik tab "Riwayat"
13. Scroll ke section "Riwayat Kenaikan Pangkat"
14. Expand section jika collapsed

**Expected Result:**
- ✅ Ada entry baru di Riwayat Kenaikan Pangkat
- ✅ Entry berisi:
  - Tanggal: (tanggal yang diisi)
  - Pangkat Lama: (pangkat sebelumnya)
  - Pangkat Baru: IV/a
  - TMT: (tanggal yang diisi)
  - Nomor SK: 123/SK/2024
  - Keterangan: Kenaikan pangkat reguler

### Scenario 3: Quick Action - Pindah/Mutasi

**Langkah:**
1. Buka form edit pegawai (lihat Scenario 1)
2. Klik tab "Quick Action"
3. Klik sub-tab "Pindah/Mutasi"
4. Perhatikan form yang muncul

**Expected Result:**
- ✅ Muncul card dengan title "🗺️ Pindah/Mutasi"
- ✅ Field "Unit Kerja Saat Ini" terisi otomatis (read-only)
- ✅ Field "Unit Kerja Tujuan" adalah dropdown (belum terisi)
- ✅ Field "Tanggal Mutasi" terisi dengan tanggal hari ini
- ✅ Field "Nomor SK" kosong (opsional)
- ✅ Field "Keterangan" kosong (opsional)
- ✅ Tombol "Terapkan Mutasi" disabled

**Langkah Lanjutan:**
5. Pilih unit kerja tujuan dari dropdown (contoh: Bagian Umum)
6. Isi Nomor SK (contoh: 456/SK/2024)
7. Isi Keterangan (contoh: Mutasi sesuai kebutuhan organisasi)
8. Klik tombol "Terapkan Mutasi"

**Expected Result:**
- ✅ Muncul alert sukses berwarna hijau
- ✅ Muncul toast notification: "✅ Mutasi Berhasil - Unit kerja diupdate menjadi Bagian Umum"
- ✅ Form direset

**Verifikasi:**
9. Klik tab "Data Utama"
10. Lihat field "Unit Kerja"

**Expected Result:**
- ✅ Field "Unit Kerja" berubah menjadi "Bagian Umum"

**Verifikasi Lanjutan:**
11. Klik tab "Riwayat"
12. Lihat section "Riwayat Mutasi"

**Expected Result:**
- ✅ Ada entry baru di Riwayat Mutasi
- ✅ Entry berisi data yang sesuai

### Scenario 4: Quick Action - Berganti Jabatan

**Langkah:**
1. Buka form edit pegawai (lihat Scenario 1)
2. Klik tab "Quick Action"
3. Klik sub-tab "Ganti Jabatan"
4. Perhatikan form yang muncul

**Expected Result:**
- ✅ Muncul card dengan title "💼 Pergantian Jabatan"
- ✅ Field "Jabatan Saat Ini" terisi otomatis (read-only)
- ✅ Field "Jabatan Baru" adalah text input (kosong)
- ✅ Field "Tanggal" terisi dengan tanggal hari ini
- ✅ Field "Nomor SK" kosong (opsional)
- ✅ Field "Keterangan" kosong (opsional)
- ✅ Tombol "Terapkan Pergantian Jabatan" disabled

**Langkah Lanjutan:**
5. Isi Jabatan Baru (contoh: Kepala Subbag Kepegawaian)
6. Isi Nomor SK (contoh: 789/SK/2024)
7. Isi Keterangan (contoh: Promosi jabatan)
8. Klik tombol "Terapkan Pergantian Jabatan"

**Expected Result:**
- ✅ Muncul alert sukses berwarna hijau
- ✅ Muncul toast notification: "✅ Pergantian Jabatan Berhasil - Jabatan diupdate menjadi Kepala Subbag Kepegawaian"
- ✅ Form direset

**Verifikasi:**
9. Klik tab "Data Utama"
10. Lihat field "Nama Jabatan"

**Expected Result:**
- ✅ Field "Nama Jabatan" berubah menjadi "Kepala Subbag Kepegawaian"

**Verifikasi Lanjutan:**
11. Klik tab "Riwayat"
12. Lihat section "Riwayat Jabatan"

**Expected Result:**
- ✅ Ada entry baru di Riwayat Jabatan
- ✅ Entry berisi data yang sesuai

### Scenario 5: Multiple Quick Actions

**Tujuan:** Test apakah user bisa melakukan multiple quick actions sebelum save

**Langkah:**
1. Buka form edit pegawai
2. Lakukan Quick Action "Naik Pangkat" (lihat Scenario 2)
3. Lakukan Quick Action "Pindah/Mutasi" (lihat Scenario 3)
4. Lakukan Quick Action "Ganti Jabatan" (lihat Scenario 4)
5. Verifikasi di tab "Data Utama" dan "Riwayat"

**Expected Result:**
- ✅ Semua 3 perubahan terlihat di tab "Data Utama"
- ✅ Semua 3 riwayat terlihat di tab "Riwayat"
- ✅ Tidak ada duplikasi entry
- ✅ Tidak ada error atau warning

**Langkah Lanjutan:**
6. Klik tombol "Simpan Perubahan" di bagian bawah form
7. Tunggu proses save selesai
8. Modal tertutup
9. Buka kembali form edit pegawai yang sama

**Expected Result:**
- ✅ Data tersimpan ke database
- ✅ Semua perubahan masih terlihat
- ✅ Riwayat tersimpan dengan benar

### Scenario 6: Quick Action untuk Pegawai Baru

**Tujuan:** Verifikasi bahwa Quick Action tidak tersedia untuk pegawai baru

**Langkah:**
1. Navigasi ke halaman Employees
2. Klik tombol "Tambah Pegawai" atau "+" (bukan Edit)
3. Modal form terbuka
4. Klik tab "Quick Action"

**Expected Result:**
- ✅ Tab "Quick Action" ada dan bisa diklik
- ✅ Muncul alert dengan pesan:
  > "Quick Action hanya tersedia saat mengedit data pegawai yang sudah ada. Silakan simpan data pegawai terlebih dahulu, kemudian edit untuk menggunakan fitur Quick Action."
- ✅ Tidak ada form Quick Action yang muncul

### Scenario 7: Responsive Design - Mobile

**Langkah:**
1. Buka aplikasi di browser mobile atau resize browser ke ukuran mobile (< 640px)
2. Buka form edit pegawai
3. Klik tab "Quick Action"
4. Perhatikan layout

**Expected Result:**
- ✅ Tabs utama masih terlihat (mungkin dengan scroll horizontal)
- ✅ Sub-tabs menampilkan icon + text singkat:
  - "🎯 Pangkat" (bukan "Naik Pangkat")
  - "🗺️ Mutasi" (bukan "Pindah/Mutasi")
  - "💼 Jabatan" (bukan "Ganti Jabatan")
- ✅ Form fields stack vertical (1 kolom)
- ✅ Tombol "Terapkan" full width
- ✅ Semua elemen masih accessible dan clickable

### Scenario 8: Validation - Field Wajib

**Langkah:**
1. Buka form edit pegawai
2. Klik tab "Quick Action"
3. Klik sub-tab "Naik Pangkat"
4. Jangan isi field "Pangkat Baru"
5. Coba klik tombol "Terapkan Kenaikan Pangkat"

**Expected Result:**
- ✅ Tombol disabled (tidak bisa diklik)
- ✅ Tidak ada aksi yang terjadi

**Langkah Lanjutan:**
6. Pilih "Pangkat Baru"
7. Perhatikan tombol

**Expected Result:**
- ✅ Tombol enabled (bisa diklik)
- ✅ Warna tombol berubah dari abu-abu ke biru

### Scenario 9: Cancel/Batal

**Langkah:**
1. Buka form edit pegawai
2. Lakukan beberapa Quick Actions
3. Klik tombol "Batal" di bagian bawah form

**Expected Result:**
- ✅ Modal tertutup
- ✅ Perubahan tidak tersimpan ke database
- ✅ Tidak ada error

**Verifikasi:**
4. Buka kembali form edit pegawai yang sama

**Expected Result:**
- ✅ Data kembali ke state sebelum Quick Actions dilakukan
- ✅ Tidak ada riwayat baru yang tersimpan

### Scenario 10: Auto-Tracking Integration

**Tujuan:** Verifikasi bahwa Quick Action tidak conflict dengan auto-tracking

**Langkah:**
1. Buka form edit pegawai
2. Klik tab "Data Utama"
3. Ubah field "Golongan/Pangkat" secara manual (bukan via Quick Action)
4. Perhatikan notifikasi

**Expected Result:**
- ✅ Muncul toast: "✅ Riwayat Kenaikan Pangkat otomatis ditambahkan"
- ✅ Riwayat ditambahkan dengan keterangan "Perubahan data - Auto-generated"

**Langkah Lanjutan:**
5. Klik tab "Quick Action"
6. Lakukan Quick Action "Naik Pangkat" dengan pangkat yang berbeda
7. Klik tab "Riwayat"
8. Lihat section "Riwayat Kenaikan Pangkat"

**Expected Result:**
- ✅ Ada 2 entry: 1 dari auto-tracking, 1 dari Quick Action
- ✅ Tidak ada duplikasi
- ✅ Keterangan berbeda (Auto-generated vs Quick Action)

## 🐛 Bug Report Template

Jika menemukan bug saat testing, gunakan template ini:

```markdown
### Bug: [Judul singkat bug]

**Scenario:** [Scenario mana yang sedang ditest]

**Langkah Reproduksi:**
1. [Langkah 1]
2. [Langkah 2]
3. [Langkah 3]

**Expected Result:**
[Apa yang seharusnya terjadi]

**Actual Result:**
[Apa yang sebenarnya terjadi]

**Screenshot/Video:**
[Attach jika ada]

**Environment:**
- Browser: [Chrome/Firefox/Safari/Edge]
- Version: [Version number]
- OS: [Windows/Mac/Linux]
- Screen Size: [Desktop/Tablet/Mobile]

**Severity:**
- [ ] Critical (aplikasi crash/tidak bisa digunakan)
- [ ] High (fitur tidak berfungsi)
- [ ] Medium (fitur berfungsi tapi ada issue)
- [ ] Low (cosmetic/minor issue)
```

## ✅ Testing Checklist

Gunakan checklist ini untuk memastikan semua scenario sudah ditest:

- [ ] Scenario 1: Akses Quick Action Tab
- [ ] Scenario 2: Quick Action - Naik Pangkat
- [ ] Scenario 3: Quick Action - Pindah/Mutasi
- [ ] Scenario 4: Quick Action - Berganti Jabatan
- [ ] Scenario 5: Multiple Quick Actions
- [ ] Scenario 6: Quick Action untuk Pegawai Baru
- [ ] Scenario 7: Responsive Design - Mobile
- [ ] Scenario 8: Validation - Field Wajib
- [ ] Scenario 9: Cancel/Batal
- [ ] Scenario 10: Auto-Tracking Integration

## 📊 Test Results Template

```markdown
## Test Results - Quick Action Feature

**Tested By:** [Nama Tester]
**Date:** [Tanggal Testing]
**Environment:** [Development/Staging/Production]

### Summary
- Total Scenarios: 10
- Passed: [X]
- Failed: [X]
- Blocked: [X]

### Detailed Results

| Scenario | Status | Notes |
|----------|--------|-------|
| 1. Akses Quick Action Tab | ✅ Pass | - |
| 2. Naik Pangkat | ✅ Pass | - |
| 3. Pindah/Mutasi | ✅ Pass | - |
| 4. Berganti Jabatan | ✅ Pass | - |
| 5. Multiple Quick Actions | ✅ Pass | - |
| 6. Pegawai Baru | ✅ Pass | - |
| 7. Responsive Mobile | ✅ Pass | - |
| 8. Validation | ✅ Pass | - |
| 9. Cancel/Batal | ✅ Pass | - |
| 10. Auto-Tracking | ✅ Pass | - |

### Issues Found
[List semua bug yang ditemukan dengan link ke bug report]

### Recommendations
[Saran untuk improvement atau enhancement]
```

## 🎯 Performance Testing

### Load Time
- [ ] Quick Action tab load < 1 detik
- [ ] Sub-tab switch < 500ms
- [ ] Form submit < 2 detik

### Memory Usage
- [ ] Tidak ada memory leak saat multiple quick actions
- [ ] Browser tidak lag atau freeze

### Network
- [ ] Tidak ada unnecessary API calls
- [ ] Data save hanya terjadi saat klik "Simpan Perubahan"

## 🔒 Security Testing

- [ ] User hanya bisa edit pegawai sesuai permission
- [ ] Admin Pusat bisa mutasi ke semua unit kerja
- [ ] Non-Admin Pusat tidak bisa mutasi ke unit kerja lain
- [ ] Input validation berfungsi (XSS, SQL injection prevention)

## 📝 Notes

- Testing sebaiknya dilakukan di multiple browser (Chrome, Firefox, Safari, Edge)
- Test di berbagai screen size (Desktop, Tablet, Mobile)
- Test dengan data pegawai yang berbeda-beda (PNS, PPPK, dengan/tanpa data lengkap)
- Dokumentasikan semua issue yang ditemukan

---

**Happy Testing! 🚀**
