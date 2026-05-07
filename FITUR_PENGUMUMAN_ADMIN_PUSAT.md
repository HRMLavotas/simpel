# Fitur Pengumuman untuk Admin Pusat

## 📋 Ringkasan

Fitur ini memungkinkan **Admin Pusat** untuk membuat pengumuman sistem yang akan muncul di dashboard **semua admin unit**. Pengumuman ditampilkan dalam bentuk **banner yang dapat ditutup** di bagian atas dashboard.

## ✨ Fitur Utama

### 1. **Kelola Pengumuman (Admin Pusat)**
- ✅ Buat pengumuman baru
- ✅ Edit pengumuman yang sudah ada
- ✅ Hapus pengumuman
- ✅ Aktifkan/nonaktifkan pengumuman
- ✅ Set prioritas pengumuman (angka lebih tinggi = prioritas lebih tinggi)
- ✅ Set tanggal kadaluarsa (opsional)
- ✅ 4 tipe pengumuman: Info, Sukses, Peringatan, Penting

### 2. **Tampilan Banner (Semua Admin)**
- ✅ Banner muncul di bagian atas dashboard
- ✅ Warna berbeda untuk setiap tipe pengumuman
- ✅ User dapat menutup banner (dismiss)
- ✅ Banner yang sudah ditutup tidak akan muncul lagi untuk user tersebut
- ✅ Pengumuman diurutkan berdasarkan prioritas dan tanggal
- ✅ Auto-refresh setiap 5 menit untuk pengumuman baru

## 🎨 Implementasi UI

### Banner Design
```
┌─────────────────────────────────────────────────────────┐
│ [Icon] Judul Pengumuman                            [X]  │
│                                                          │
│ Isi pesan pengumuman yang bisa multi-line...            │
│                                                          │
│ Dari: Admin Pusat • 7 Mei 2026, 10:30                  │
└─────────────────────────────────────────────────────────┘
```

### Tipe Banner
1. **Info** (Biru) - Informasi umum
2. **Sukses** (Hijau) - Berita baik, fitur baru
3. **Peringatan** (Kuning) - Perhatian khusus
4. **Penting** (Merah) - Urgent, maintenance, dll

## 🗄️ Struktur Database

### Tabel: `announcements`
```sql
- id: UUID (PK)
- title: TEXT (judul pengumuman)
- message: TEXT (isi pesan)
- type: TEXT (info|warning|success|error)
- is_active: BOOLEAN (aktif/nonaktif)
- created_by: UUID (FK ke auth.users)
- created_at: TIMESTAMPTZ
- updated_at: TIMESTAMPTZ
- expires_at: TIMESTAMPTZ (nullable)
- priority: INTEGER (default: 0)
```

### Tabel: `announcement_dismissals`
```sql
- id: UUID (PK)
- announcement_id: UUID (FK ke announcements)
- user_id: UUID (FK ke auth.users)
- dismissed_at: TIMESTAMPTZ
- UNIQUE(announcement_id, user_id)
```

### Function: `get_active_announcements()`
Mengembalikan pengumuman aktif yang belum di-dismiss oleh user saat ini.

## 🔐 Security (RLS Policies)

### Announcements Table
- ✅ Admin Pusat: Full access (CRUD)
- ✅ Semua user: Read-only untuk pengumuman aktif

### Announcement Dismissals Table
- ✅ User: Insert & read dismissals mereka sendiri
- ✅ Admin Pusat: Read all dismissals (untuk analytics)

## 📁 File yang Dibuat

### 1. Migration
```
supabase/migrations/20260507100000_create_announcements_table.sql
```

### 2. Hooks
```
src/hooks/useAnnouncements.ts
```
- `useAnnouncements()` - Fetch pengumuman aktif
- `useDismissAnnouncement()` - Tutup pengumuman
- `useCreateAnnouncement()` - Buat pengumuman (Admin Pusat)
- `useAllAnnouncements()` - Fetch semua pengumuman (Admin Pusat)
- `useUpdateAnnouncement()` - Update pengumuman (Admin Pusat)
- `useDeleteAnnouncement()` - Hapus pengumuman (Admin Pusat)

### 3. Components
```
src/components/notifications/AnnouncementBanner.tsx
```
Banner component yang muncul di dashboard

### 4. Pages
```
src/pages/Announcements.tsx
```
Halaman kelola pengumuman untuk Admin Pusat

### 5. Routes & Navigation
- Route: `/announcements` (Admin Pusat only)
- Menu sidebar: "Pengumuman" dengan icon Megaphone

## 🚀 Cara Menggunakan

### Untuk Admin Pusat

1. **Buat Pengumuman Baru**
   - Buka menu "Pengumuman" di sidebar
   - Klik tombol "Buat Pengumuman"
   - Isi form:
     - Judul pengumuman
     - Pesan (bisa multi-line)
     - Tipe (Info/Sukses/Peringatan/Penting)
     - Prioritas (0-100, default: 0)
     - Tanggal kadaluarsa (opsional)
   - Klik "Buat Pengumuman"

2. **Edit Pengumuman**
   - Klik icon Edit (pensil) pada pengumuman
   - Ubah data yang diperlukan
   - Klik "Perbarui Pengumuman"

3. **Aktifkan/Nonaktifkan**
   - Klik icon Eye/EyeOff untuk toggle status aktif

4. **Hapus Pengumuman**
   - Klik icon Trash
   - Konfirmasi penghapusan

### Untuk Admin Unit

1. **Lihat Pengumuman**
   - Buka Dashboard
   - Pengumuman aktif akan muncul di bagian atas
   - Pengumuman diurutkan berdasarkan prioritas

2. **Tutup Pengumuman**
   - Klik tombol [X] di pojok kanan atas banner
   - Pengumuman tidak akan muncul lagi untuk Anda

## 🎯 Use Cases

### 1. Maintenance Notification
```
Tipe: Penting (Error)
Judul: Maintenance Sistem Terjadwal
Pesan: Sistem akan maintenance pada Sabtu, 10 Mei 2026 pukul 22:00-24:00 WIB. 
       Mohon simpan pekerjaan Anda sebelum waktu tersebut.
Prioritas: 100
Expires: 2026-05-11
```

### 2. New Feature Announcement
```
Tipe: Sukses
Judul: Fitur Baru: Export Data ke Excel
Pesan: Sekarang Anda dapat mengekspor data pegawai ke format Excel langsung 
       dari halaman Data Pegawai. Klik tombol "Export" untuk mencoba!
Prioritas: 50
Expires: -
```

### 3. Important Reminder
```
Tipe: Peringatan
Judul: Deadline Update Data Pegawai
Pesan: Mohon segera update data pegawai di unit Anda sebelum tanggal 15 Mei 2026. 
       Data yang belum diupdate akan ditandai sebagai tidak valid.
Prioritas: 80
Expires: 2026-05-15
```

### 4. General Information
```
Tipe: Info
Judul: Panduan Penggunaan Sistem
Pesan: Panduan lengkap penggunaan sistem SIMPEL sudah tersedia di menu Info Sistem. 
       Silakan pelajari untuk memaksimalkan penggunaan aplikasi.
Prioritas: 10
Expires: -
```

## 🔄 Auto-Refresh Behavior

- Pengumuman di-fetch ulang setiap **5 menit**
- Data dianggap stale setelah **2 menit**
- Pengumuman baru akan muncul otomatis tanpa perlu refresh halaman

## 📊 Analytics (Future Enhancement)

Data dismissals dapat digunakan untuk:
- Melihat berapa banyak user yang sudah membaca pengumuman
- Mengidentifikasi pengumuman yang paling sering di-dismiss
- Menentukan efektivitas komunikasi

## ✅ Testing Checklist

### Admin Pusat
- [ ] Buat pengumuman baru
- [ ] Edit pengumuman
- [ ] Hapus pengumuman
- [ ] Toggle aktif/nonaktif
- [ ] Set prioritas berbeda
- [ ] Set tanggal kadaluarsa
- [ ] Coba semua tipe pengumuman

### Admin Unit
- [ ] Lihat pengumuman di dashboard
- [ ] Tutup pengumuman
- [ ] Verifikasi pengumuman tidak muncul lagi setelah ditutup
- [ ] Cek pengumuman dengan prioritas berbeda
- [ ] Cek pengumuman yang sudah kadaluarsa tidak muncul

### Edge Cases
- [ ] Pengumuman tanpa tanggal kadaluarsa
- [ ] Pengumuman dengan prioritas sama
- [ ] Multiple pengumuman aktif sekaligus
- [ ] Pengumuman dengan pesan panjang
- [ ] Pengumuman dengan pesan multi-line

## 🚀 Deployment Steps

1. **Apply Migration**
   ```bash
   # Pastikan Supabase CLI sudah terinstall
   supabase db push
   ```

2. **Verify Database**
   - Cek tabel `announcements` dan `announcement_dismissals` sudah dibuat
   - Cek function `get_active_announcements()` sudah ada
   - Cek RLS policies sudah aktif

3. **Test di Development**
   - Login sebagai Admin Pusat
   - Buat pengumuman test
   - Login sebagai Admin Unit
   - Verifikasi pengumuman muncul di dashboard

4. **Deploy ke Production**
   ```bash
   git add .
   git commit -m "feat: add announcement system for admin pusat"
   git push
   ```

## 🎨 Design Decisions

### Mengapa Banner, bukan Pop-up?
1. **Non-intrusive**: Tidak mengganggu workflow user
2. **Persistent**: Tetap terlihat sampai user dismiss
3. **Multiple announcements**: Bisa menampilkan beberapa pengumuman sekaligus
4. **Better UX**: User tidak perlu menutup pop-up setiap kali buka dashboard

### Mengapa Dismissible?
1. **User control**: User bisa memilih kapan menutup pengumuman
2. **Reduce noise**: Setelah dibaca, tidak perlu muncul lagi
3. **Better engagement**: User lebih likely membaca karena bisa kontrol

### Mengapa Priority System?
1. **Flexible ordering**: Admin bisa kontrol urutan pengumuman
2. **Important first**: Pengumuman penting bisa ditampilkan di atas
3. **Future-proof**: Bisa dikembangkan untuk auto-ordering

## 📝 Notes

- Pengumuman yang sudah kadaluarsa (`expires_at < now()`) tidak akan muncul
- Pengumuman yang nonaktif (`is_active = false`) tidak akan muncul
- User bisa dismiss pengumuman berkali-kali (jika admin re-activate)
- Admin Pusat bisa melihat semua dismissals untuk analytics

## 🔮 Future Enhancements

1. **Rich Text Editor**: Support formatting (bold, italic, links)
2. **Attachment**: Upload file/gambar ke pengumuman
3. **Target Audience**: Kirim ke unit tertentu saja
4. **Read Receipt**: Track siapa yang sudah baca
5. **Push Notification**: Notifikasi real-time saat ada pengumuman baru
6. **Scheduled Publishing**: Jadwalkan pengumuman untuk publish di waktu tertentu
7. **Templates**: Template pengumuman yang sering digunakan
8. **Analytics Dashboard**: Visualisasi engagement pengumuman

---

**Status**: ✅ Ready for Testing
**Version**: 1.0.0
**Date**: 7 Mei 2026
