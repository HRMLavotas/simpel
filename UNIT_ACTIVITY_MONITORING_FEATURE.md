# Fitur Monitoring Aktivitas Unit Kerja

## Deskripsi
Fitur monitoring aktivitas unit kerja memungkinkan Admin Pusat dan Admin Pimpinan untuk memantau update data pegawai yang dilakukan oleh setiap unit kerja per bulan. Fitur ini membantu memastikan bahwa setiap unit melakukan update data secara rutin dan memudahkan follow-up terhadap unit yang tidak aktif.

## Tujuan
1. **Tracking Aktivitas**: Memantau aktivitas update data per unit kerja setiap bulan
2. **Identifikasi Unit Tidak Aktif**: Mengetahui unit mana yang belum melakukan update data
3. **Follow-up**: Memudahkan admin pusat untuk melakukan follow-up ke unit yang tidak aktif
4. **Audit Trail**: Melihat riwayat perubahan data per unit untuk keperluan audit

## Fitur Utama

### 1. Dashboard Monitoring
- **Summary Cards**: Menampilkan statistik agregat
  - Total unit aktif (yang melakukan update)
  - Total unit tidak aktif (perlu follow-up)
  - Total perubahan data di bulan terpilih
  - Total pegawai yang diupdate
  
- **Filter Bulan**: Dropdown untuk memilih bulan yang ingin dipantau (12 bulan terakhir)

### 2. Daftar Aktivitas Per Unit
Setiap unit ditampilkan dengan informasi:
- **Nama Unit Kerja**
- **Status Aktivitas**: Badge dengan warna berbeda
  - Merah: Tidak Ada Aktivitas (0 perubahan)
  - Kuning: Aktivitas Rendah (< 5 perubahan)
  - Biru: Aktivitas Sedang (5-19 perubahan)
  - Hijau: Aktivitas Tinggi (≥ 20 perubahan)
- **Breakdown Perubahan**:
  - Jumlah mutasi
  - Jumlah perubahan jabatan
  - Jumlah kenaikan pangkat
  - Jumlah diklat/pelatihan
  - Jumlah update pendidikan
- **Waktu Update Terakhir**
- **Total Perubahan**: Angka besar menunjukkan total semua perubahan

### 3. Detail Perubahan Data
Klik pada unit untuk melihat detail perubahan:
- **Dialog Modal** menampilkan semua perubahan data di bulan tersebut
- Setiap perubahan menampilkan:
  - Nama pegawai dan NIP
  - Jenis perubahan (badge)
  - Detail perubahan (sesuai jenis)
  - Tanggal input data

## Jenis Perubahan yang Dipantau

1. **Mutasi**: Perpindahan unit kerja
   - Unit asal dan tujuan
   - Nomor SK
   - Tanggal mutasi

2. **Perubahan Jabatan**: Perubahan posisi/jabatan
   - Jabatan lama dan baru
   - Nomor SK
   - Tanggal perubahan

3. **Kenaikan Pangkat**: Perubahan pangkat/golongan
   - Pangkat lama dan baru
   - Nomor SK
   - TMT (Terhitung Mulai Tanggal)

4. **Diklat/Pelatihan**: Riwayat pelatihan
   - Nama diklat
   - Penyelenggara
   - Tanggal mulai dan selesai

5. **Pendidikan**: Update riwayat pendidikan
   - Jenjang pendidikan
   - Institusi
   - Jurusan
   - Tahun lulus

## Akses & Permissions

### Yang Dapat Mengakses:
- **Admin Pusat**: Full access untuk monitoring semua unit
- **Admin Pimpinan**: Read-only access untuk monitoring semua unit

### Yang Tidak Dapat Mengakses:
- **Admin Unit**: Tidak memiliki akses ke halaman monitoring (hanya bisa melihat data unit sendiri di halaman lain)

## Implementasi Teknis

### Database
1. **View: `unit_activity_summary`**
   - Agregasi perubahan data per unit per bulan
   - Menghitung dari 12 bulan terakhir
   - Join dari semua tabel history

2. **Function: `get_unit_monthly_details`**
   - Parameter: department, month
   - Return: Detail semua perubahan untuk unit dan bulan tertentu
   - Security: DEFINER untuk akses cross-department

### Frontend
1. **Page**: `/monitoring` (UnitActivityMonitoring.tsx)
2. **Hook**: `useUnitActivityMonitoring.ts`
   - `useUnitActivitySummary`: Fetch summary data
   - `useUnitMonthlyDetails`: Fetch detail perubahan
3. **Route**: Protected untuk admin_pusat dan admin_pimpinan
4. **Menu**: "Monitoring Unit" di sidebar (icon Activity)

## Cara Penggunaan

### Untuk Admin Pusat/Pimpinan:

1. **Akses Menu**
   - Klik "Monitoring Unit" di sidebar
   
2. **Pilih Bulan**
   - Gunakan dropdown di kanan atas untuk memilih bulan
   - Default: bulan berjalan
   
3. **Review Summary**
   - Lihat 4 kartu statistik di atas
   - Perhatikan jumlah unit tidak aktif (merah)
   
4. **Identifikasi Unit Tidak Aktif**
   - Scroll daftar unit
   - Unit dengan badge "Tidak Ada Aktivitas" perlu follow-up
   
5. **Lihat Detail Perubahan**
   - Klik pada unit untuk membuka dialog detail
   - Review semua perubahan yang dilakukan
   - Gunakan untuk verifikasi atau audit

## Use Cases

### 1. Monthly Review
Admin Pusat melakukan review bulanan:
- Pilih bulan berjalan
- Identifikasi unit yang tidak update data
- Kirim reminder ke admin unit yang tidak aktif

### 2. Quarterly Audit
Admin Pimpinan melakukan audit triwulanan:
- Review 3 bulan terakhir satu per satu
- Lihat tren aktivitas per unit
- Identifikasi unit yang konsisten tidak aktif

### 3. Data Quality Check
Admin Pusat melakukan pengecekan kualitas data:
- Klik detail unit dengan aktivitas tinggi
- Verifikasi perubahan data yang dilakukan
- Pastikan data entry sesuai prosedur

### 4. Performance Tracking
Tracking performa admin unit:
- Bandingkan aktivitas antar unit
- Identifikasi unit dengan aktivitas konsisten
- Apresiasi unit yang rajin update data

## Migration

File migration: `supabase/migrations/20260421100000_add_unit_activity_monitoring.sql`

Untuk apply migration:
```bash
# Via Supabase CLI
supabase db push

# Atau via script yang ada
node apply_migration_via_api.mjs
```

## Testing

### Test Scenarios:
1. ✅ Admin Pusat dapat akses halaman monitoring
2. ✅ Admin Pimpinan dapat akses halaman monitoring
3. ✅ Admin Unit tidak dapat akses halaman monitoring
4. ✅ Filter bulan berfungsi dengan benar
5. ✅ Summary cards menampilkan data akurat
6. ✅ Daftar unit menampilkan semua unit dengan data benar
7. ✅ Status badge sesuai dengan jumlah perubahan
8. ✅ Dialog detail menampilkan perubahan dengan lengkap
9. ✅ Data real-time (update otomatis saat ada perubahan)

## Future Enhancements

Potensi pengembangan fitur:
1. **Export Report**: Export data monitoring ke Excel/PDF
2. **Email Notification**: Auto-send reminder ke unit tidak aktif
3. **Trend Chart**: Grafik tren aktivitas per unit
4. **Comparison View**: Bandingkan aktivitas antar periode
5. **Target Setting**: Set target minimum update per unit
6. **Alert System**: Notifikasi real-time untuk admin pusat
7. **Detailed Analytics**: Analisis lebih dalam per jenis perubahan

## Notes

- Data monitoring mencakup 12 bulan terakhir
- View di-refresh setiap kali ada perubahan data
- Performance optimal karena menggunakan view yang sudah teragregasi
- Detail perubahan di-fetch on-demand (saat dialog dibuka)
