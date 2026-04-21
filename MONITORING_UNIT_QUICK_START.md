# Quick Start: Monitoring Aktivitas Unit Kerja

## Untuk Admin Pusat & Admin Pimpinan

### 1. Setup (One-time)

#### Apply Database Migration
Pilih salah satu cara:

**Cara Termudah - Via Supabase Dashboard:**
1. Buka https://supabase.com/dashboard
2. Pilih project Anda
3. Klik "SQL Editor"
4. Copy-paste isi file `supabase/migrations/20260421100000_add_unit_activity_monitoring.sql`
5. Klik "Run"

**Via Supabase CLI:**
```bash
supabase db push
```

### 2. Akses Fitur

1. Login sebagai Admin Pusat atau Admin Pimpinan
2. Klik menu "Monitoring Unit" di sidebar (icon Activity)
3. Halaman monitoring akan terbuka

### 3. Cara Menggunakan

#### A. Lihat Summary Bulan Ini
- Default menampilkan bulan berjalan
- Lihat 4 kartu statistik:
  - 🟢 Unit Aktif: Unit yang melakukan update
  - 🔴 Unit Tidak Aktif: Unit yang perlu follow-up
  - 📄 Total Perubahan: Jumlah semua perubahan data
  - 👥 Pegawai Diupdate: Jumlah pegawai yang datanya diupdate

#### B. Pilih Bulan Lain
- Klik dropdown bulan di kanan atas
- Pilih bulan yang ingin dilihat (tersedia 12 bulan terakhir)
- Data akan otomatis refresh

#### C. Lihat Daftar Unit
Setiap unit menampilkan:
- **Nama Unit**
- **Status Badge**:
  - 🔴 Tidak Ada Aktivitas (0 perubahan)
  - 🟡 Aktivitas Rendah (< 5 perubahan)
  - 🔵 Aktivitas Sedang (5-19 perubahan)
  - 🟢 Aktivitas Tinggi (≥ 20 perubahan)
- **Breakdown**: Mutasi, Jabatan, Pangkat, Diklat, Pendidikan
- **Update Terakhir**: Kapan terakhir kali unit update data
- **Total Perubahan**: Angka besar di kanan

#### D. Lihat Detail Perubahan
1. Klik pada unit yang ingin dilihat detailnya
2. Dialog akan muncul menampilkan semua perubahan
3. Setiap perubahan menampilkan:
   - Nama pegawai & NIP
   - Jenis perubahan (badge)
   - Detail lengkap perubahan
   - Tanggal input data
4. Klik di luar dialog atau tombol X untuk menutup

#### E. Urutkan Data
- Klik dropdown "Urutkan" di atas daftar unit
- Pilih:
  - **Aktivitas**: Unit dengan perubahan terbanyak di atas
  - **Nama Unit**: Urut alfabetis A-Z

#### F. Export Data
1. Klik tombol "Export CSV" di kanan atas
2. File CSV akan otomatis terdownload
3. Buka dengan Excel atau Google Sheets
4. File berisi semua data unit untuk bulan terpilih

### 4. Use Cases Praktis

#### Monthly Review (Setiap Awal Bulan)
```
1. Pilih bulan lalu
2. Lihat unit dengan badge merah (tidak aktif)
3. Catat nama unit yang perlu follow-up
4. Export CSV untuk dokumentasi
5. Kirim reminder ke admin unit yang tidak aktif
```

#### Follow-up Unit Tidak Aktif
```
1. Klik unit dengan badge merah
2. Lihat apakah ada perubahan sama sekali
3. Jika benar-benar tidak ada:
   - Hubungi admin unit
   - Tanyakan kendala yang dihadapi
   - Berikan bantuan jika diperlukan
```

#### Verifikasi Data Entry
```
1. Pilih unit dengan aktivitas tinggi
2. Klik untuk lihat detail
3. Review perubahan yang dilakukan
4. Pastikan data entry sesuai prosedur
5. Berikan feedback jika ada yang salah
```

#### Quarterly Report
```
1. Export data untuk 3 bulan terakhir
2. Gabungkan di Excel
3. Buat pivot table untuk analisis
4. Identifikasi tren per unit
5. Buat laporan untuk pimpinan
```

### 5. Tips & Best Practices

✅ **DO:**
- Review monitoring setiap awal bulan
- Follow-up unit tidak aktif dalam 1 minggu
- Export data untuk dokumentasi
- Apresiasi unit yang konsisten aktif
- Gunakan data untuk evaluasi kinerja admin unit

❌ **DON'T:**
- Jangan hanya fokus pada angka, lihat juga kualitas data
- Jangan langsung menyalahkan unit tidak aktif, tanyakan kendalanya
- Jangan lupa dokumentasi hasil follow-up
- Jangan abaikan unit dengan aktivitas rendah

### 6. Troubleshooting

**Q: Data tidak muncul?**
- Pastikan migration sudah dijalankan
- Refresh halaman (F5)
- Logout dan login kembali
- Check console browser untuk error

**Q: Unit saya tidak muncul di daftar?**
- Unit hanya muncul jika ada data pegawai
- Check apakah unit sudah terdaftar di master data
- Pastikan ada pegawai yang terdaftar di unit tersebut

**Q: Angka perubahan tidak sesuai?**
- Data dihitung dari history tables
- Hanya perubahan yang tercatat di history yang dihitung
- Update langsung di tabel employees tanpa history tidak terhitung

**Q: Export CSV tidak berfungsi?**
- Pastikan browser mengizinkan download
- Check popup blocker
- Coba browser lain

**Q: Detail perubahan tidak muncul?**
- Pastikan ada perubahan di bulan tersebut
- Refresh dan coba lagi
- Check koneksi internet

### 7. FAQ

**Q: Berapa lama data tersimpan?**
A: View menampilkan data 12 bulan terakhir. Data history tersimpan permanen di database.

**Q: Apakah data real-time?**
A: Ya, data diupdate otomatis saat ada perubahan. Refresh halaman untuk melihat data terbaru.

**Q: Bisa filter per jenis perubahan?**
A: Saat ini belum ada filter per jenis. Lihat breakdown di setiap unit atau detail perubahan.

**Q: Bisa export detail perubahan?**
A: Saat ini hanya export summary. Untuk detail, screenshot atau copy manual dari dialog.

**Q: Admin Unit bisa akses monitoring?**
A: Tidak. Fitur ini khusus untuk Admin Pusat dan Admin Pimpinan.

### 8. Kontak Support

Jika ada masalah atau pertanyaan:
1. Check dokumentasi lengkap di `UNIT_ACTIVITY_MONITORING_FEATURE.md`
2. Check troubleshooting di atas
3. Hubungi tim IT/developer

---

**Selamat menggunakan fitur Monitoring Aktivitas Unit Kerja!** 🎉

Fitur ini akan membantu Anda memastikan semua unit melakukan update data secara rutin dan konsisten.
