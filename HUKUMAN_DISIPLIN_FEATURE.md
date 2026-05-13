# Fitur Hukuman Disiplin Pegawai

## 📋 Deskripsi

Fitur ini memungkinkan admin untuk mendokumentasikan hukuman disiplin yang diterbitkan untuk pegawai yang terlibat dalam kasus. Berdasarkan **PP 94 Tahun 2021 tentang Disiplin Pegawai Negeri Sipil**.

## 🎯 Fitur Utama

### 1. **Tombol "Update Hukuman Disiplin"**
- Terletak di header halaman detail kasus, di samping tombol "Edit"
- Warna merah untuk menandakan tingkat kepentingan
- Hanya muncul untuk user dengan akses edit (admin_pusat)

### 2. **Dialog Form Hukuman Disiplin**
Formulir lengkap dengan field:

#### A. Tingkat Hukuman (3 Kategori)
Berdasarkan PP 94/2021:

**1. Ringan**
- Teguran Lisan
- Teguran Tertulis
- Pernyataan Tidak Puas Secara Tertulis

**2. Sedang**
- Penundaan Kenaikan Gaji Berkala 6 Bulan
- Penundaan Kenaikan Gaji Berkala 12 Bulan
- Penurunan Gaji 1 Tingkat Selama 12 Bulan

**3. Berat**
- Penurunan Jabatan 1 Tingkat Selama 12 Bulan
- Pembebasan dari Jabatan
- Pemberhentian dengan Hormat Tidak Atas Permintaan Sendiri
- Pemberhentian Tidak dengan Hormat

#### B. Informasi Keputusan
- **Nomor Keputusan** (required): Nomor SK hukuman disiplin
- **Tanggal Keputusan** (required): Tanggal SK diterbitkan
- **Tanggal Mulai Berlaku** (required): Kapan hukuman mulai berlaku
- **Tanggal Berakhir** (optional): Untuk hukuman dengan batas waktu
- **Pejabat yang Menetapkan** (required): Nama pejabat yang mengeluarkan SK

#### C. Detail Pelanggaran
- **Pelanggaran yang Dilakukan** (required): Deskripsi lengkap pelanggaran
- **Catatan Tambahan** (optional): Informasi tambahan
- **Link Dokumen SK** (optional): URL ke dokumen SK

### 3. **Integrasi Otomatis dengan Timeline**
Setelah hukuman disiplin disimpan, sistem akan **otomatis**:

1. ✅ Menyimpan data hukuman disiplin di `case_details.disciplinaryActions`
2. ✅ Menambahkan entry baru di timeline dengan format:
   ```
   Tanggal: [Tanggal Keputusan]
   Status: "Hukuman Disiplin Diterbitkan"
   Deskripsi: "Hukuman Disiplin [Tingkat] diterbitkan: [Jenis]. 
              SK No. [Nomor] oleh [Pejabat]."
   Dokumen: Link ke SK (jika ada)
   ```

### 4. **Card Riwayat Hukuman Disiplin**
- Muncul di halaman detail kasus (setelah Case Detail Card)
- Menampilkan semua hukuman disiplin yang pernah diterbitkan
- Informasi yang ditampilkan:
  - Badge tingkat hukuman (warna: kuning/orange/merah)
  - Nomor SK
  - Jenis hukuman
  - Tanggal keputusan, mulai berlaku, dan berakhir
  - Pejabat yang menetapkan
  - Pelanggaran yang dilakukan
  - Catatan tambahan
  - Link dokumen SK
- Diurutkan dari yang terbaru

## 📁 File yang Dibuat/Diubah

### File Baru:
1. **`src/components/cases/DisciplinaryActionDialog.tsx`**
   - Dialog form untuk input hukuman disiplin
   - Konstanta tingkat dan jenis hukuman
   - Validasi form

2. **`src/components/cases/DisciplinaryActionsCard.tsx`**
   - Card untuk menampilkan riwayat hukuman disiplin
   - Formatting tanggal dan badge

### File yang Diubah:
1. **`src/pages/EmployeeCaseDetail.tsx`**
   - Import komponen baru
   - State management untuk dialog
   - Handler `handleDisciplinaryAction()`
   - Tombol "Update Hukuman Disiplin" di header
   - Render DisciplinaryActionsCard

## 🔄 Alur Kerja (Workflow)

```
1. User membuka halaman detail kasus
   ↓
2. User klik tombol "Update Hukuman Disiplin"
   ↓
3. Dialog form muncul dengan field lengkap
   ↓
4. User mengisi:
   - Pilih tingkat hukuman (Ringan/Sedang/Berat)
   - Pilih jenis hukuman (dropdown berubah sesuai tingkat)
   - Isi nomor SK, tanggal, pejabat, pelanggaran
   - (Optional) Isi tanggal berakhir, catatan, link dokumen
   ↓
5. User klik "Simpan Hukuman Disiplin"
   ↓
6. Sistem melakukan:
   a. Update case_details dengan data hukuman disiplin
   b. Auto-create timeline entry baru
   c. Reload data kasus
   ↓
7. User melihat:
   - Toast success notification
   - Card "Riwayat Hukuman Disiplin" muncul
   - Timeline baru muncul dengan status "Hukuman Disiplin Diterbitkan"
```

## 💾 Struktur Data

### Di Database (case_details JSONB):
```json
{
  "disciplinaryActions": [
    {
      "level": "sedang",
      "type": "penundaan_kenaikan_gaji_berkala_6_bulan",
      "decisionNumber": "123/SK/2026",
      "decisionDate": "2026-05-13",
      "effectiveDate": "2026-05-15",
      "endDate": "2026-11-15",
      "issuedBy": "Kepala BKN",
      "violation": "Tidak masuk kerja tanpa keterangan selama 5 hari",
      "notes": "Pegawai telah diberi peringatan sebelumnya",
      "documentLink": "https://example.com/sk-123.pdf",
      "addedAt": "2026-05-13T10:30:00.000Z"
    }
  ]
}
```

### Timeline Entry (Auto-generated):
```json
{
  "date": "2026-05-13",
  "description": "Hukuman Disiplin Sedang diterbitkan: Penundaan Kenaikan Gaji Berkala 6 Bulan. SK No. 123/SK/2026 oleh Kepala BKN.",
  "status": "Hukuman Disiplin Diterbitkan",
  "documents": [
    {
      "name": "SK Hukuman Disiplin No. 123/SK/2026",
      "link": "https://example.com/sk-123.pdf"
    }
  ]
}
```

## 🎨 UI/UX

### Warna Badge Tingkat Hukuman:
- **Ringan**: Kuning (yellow-100/yellow-800)
- **Sedang**: Orange (orange-100/orange-800)
- **Berat**: Merah (red-100/red-800)

### Tombol "Update Hukuman Disiplin":
- Background: `bg-red-500/20`
- Hover: `bg-red-500/30`
- Border: `border-red-500/50`
- Icon: Scale (timbangan)

### Card Riwayat:
- Border: Red theme
- Background gradient: from-red-50/50
- Setiap entry dalam box dengan border

## 🔐 Akses & Permission

- ✅ Hanya user dengan `canEdit = true` yang bisa menambah hukuman disiplin
- ✅ Biasanya: `admin_pusat` atau user yang diberi akses khusus
- ✅ Semua user yang bisa melihat kasus bisa melihat riwayat hukuman disiplin

## 📚 Referensi Hukum

Fitur ini mengacu pada:
- **PP 94 Tahun 2021** tentang Disiplin Pegawai Negeri Sipil
- **Peraturan BKN Nomor 6 Tahun 2022** tentang Peraturan Pelaksanaan PP 94/2021

Sumber informasi:
- [Proses Disiplin Pegawai](https://sites.google.com/view/subbag-sdm-hukum/disiplin-pegawai/proses-disiplin-pegawai)

## ✅ Testing Checklist

- [ ] Tombol "Update Hukuman Disiplin" muncul di header (untuk admin_pusat)
- [ ] Dialog form terbuka saat tombol diklik
- [ ] Dropdown jenis hukuman berubah sesuai tingkat yang dipilih
- [ ] Validasi form bekerja (required fields)
- [ ] Data tersimpan di case_details
- [ ] Timeline otomatis ter-create dengan format yang benar
- [ ] Card "Riwayat Hukuman Disiplin" muncul setelah data disimpan
- [ ] Semua informasi ditampilkan dengan benar di card
- [ ] Link dokumen bisa diklik dan membuka tab baru
- [ ] Multiple hukuman disiplin bisa ditambahkan
- [ ] Urutan hukuman disiplin dari yang terbaru

## 🚀 Cara Menggunakan

1. **Buka halaman detail kasus pegawai**
   - Navigasi: Admin → Kasus Pegawai → Klik salah satu kasus

2. **Klik tombol "Update Hukuman Disiplin"**
   - Tombol merah di header, di samping tombol "Edit"

3. **Isi formulir:**
   - Pilih tingkat hukuman (Ringan/Sedang/Berat)
   - Pilih jenis hukuman dari dropdown
   - Isi nomor SK, tanggal keputusan, tanggal berlaku
   - Isi nama pejabat yang menetapkan
   - Jelaskan pelanggaran yang dilakukan
   - (Optional) Isi tanggal berakhir, catatan, link dokumen

4. **Klik "Simpan Hukuman Disiplin"**

5. **Verifikasi:**
   - Card "Riwayat Hukuman Disiplin" muncul
   - Timeline baru muncul dengan status "Hukuman Disiplin Diterbitkan"
   - Toast notification "Hukuman disiplin berhasil ditambahkan"

## 💡 Tips

- Untuk hukuman dengan batas waktu (misal: penundaan 6 bulan), isi field "Tanggal Berakhir"
- Selalu upload dokumen SK ke cloud storage dan masukkan linknya
- Gunakan nomor SK yang lengkap dan resmi
- Jelaskan pelanggaran secara detail untuk dokumentasi yang baik
- Timeline akan otomatis ter-update, tidak perlu manual input

## 🔮 Future Enhancements

Potensi pengembangan di masa depan:
- [ ] Notifikasi email ke pegawai saat hukuman disiplin diterbitkan
- [ ] Export laporan hukuman disiplin per periode
- [ ] Dashboard statistik hukuman disiplin
- [ ] Reminder otomatis saat hukuman disiplin akan berakhir
- [ ] Upload dokumen SK langsung (bukan hanya link)
- [ ] History log perubahan hukuman disiplin
- [ ] Filter kasus berdasarkan tingkat hukuman disiplin
