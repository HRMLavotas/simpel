# Quick Start: Fitur Pengumuman

## ✅ Status Implementasi

**Migration**: ✅ Berhasil di-apply ke database
**Components**: ✅ Semua component sudah dibuat
**Routes**: ✅ Route sudah ditambahkan
**Navigation**: ✅ Menu sudah ditambahkan ke sidebar

## 🚀 Cara Testing

### 1. Start Development Server

```bash
npm run dev
```

### 2. Login sebagai Admin Pusat

Gunakan akun dengan role `admin_pusat`

### 3. Buat Pengumuman Pertama

1. Klik menu **"Pengumuman"** di sidebar (icon megaphone)
2. Klik tombol **"Buat Pengumuman"**
3. Isi form:
   - **Judul**: "Selamat Datang di Fitur Pengumuman!"
   - **Pesan**: "Fitur pengumuman sistem sudah aktif. Admin Pusat sekarang dapat mengirim pengumuman ke semua admin unit."
   - **Tipe**: Sukses
   - **Prioritas**: 50
   - **Tanggal Kadaluarsa**: (kosongkan)
4. Klik **"Buat Pengumuman"**

### 4. Verifikasi di Dashboard

1. Klik menu **"Dashboard"**
2. Pengumuman akan muncul di bagian atas dashboard
3. Coba klik tombol **[X]** untuk menutup pengumuman
4. Refresh halaman - pengumuman tidak akan muncul lagi

### 5. Test dengan Admin Unit

1. Logout dari Admin Pusat
2. Login sebagai Admin Unit
3. Buka Dashboard
4. Pengumuman akan muncul di bagian atas

## 🎨 Contoh Pengumuman

### Maintenance Notice
```
Judul: Maintenance Sistem Terjadwal
Tipe: Penting (Error)
Prioritas: 100
Pesan:
Sistem akan maintenance pada Sabtu, 10 Mei 2026 pukul 22:00-24:00 WIB.
Mohon simpan pekerjaan Anda sebelum waktu tersebut.
Terima kasih atas pengertiannya.
Expires: 2026-05-11
```

### New Feature
```
Judul: Fitur Baru: Export ke Excel
Tipe: Sukses
Prioritas: 50
Pesan:
Sekarang Anda dapat mengekspor data pegawai ke format Excel!
Klik tombol "Export" di halaman Data Pegawai untuk mencoba.
Expires: -
```

### Important Reminder
```
Judul: Deadline Update Data
Tipe: Peringatan
Prioritas: 80
Pesan:
Mohon segera update data pegawai di unit Anda sebelum tanggal 15 Mei 2026.
Data yang belum diupdate akan ditandai sebagai tidak valid.
Expires: 2026-05-15
```

### General Info
```
Judul: Panduan Penggunaan Sistem
Tipe: Info
Prioritas: 10
Pesan:
Panduan lengkap penggunaan sistem SIMPEL sudah tersedia di menu Info Sistem.
Silakan pelajari untuk memaksimalkan penggunaan aplikasi.
Expires: -
```

## 🔍 Fitur yang Bisa Dicoba

### Admin Pusat
- [x] Buat pengumuman baru
- [x] Edit pengumuman
- [x] Hapus pengumuman
- [x] Toggle aktif/nonaktif (icon Eye/EyeOff)
- [x] Set prioritas berbeda
- [x] Set tanggal kadaluarsa
- [x] Coba semua 4 tipe pengumuman

### Admin Unit
- [x] Lihat pengumuman di dashboard
- [x] Tutup pengumuman (dismiss)
- [x] Verifikasi pengumuman tidak muncul lagi setelah ditutup
- [x] Lihat multiple pengumuman sekaligus

## 📊 Database Tables

Cek di Supabase Dashboard:

1. **announcements** - Menyimpan semua pengumuman
2. **announcement_dismissals** - Track pengumuman yang sudah ditutup user

## 🎯 Key Features

1. **Banner Design**: Non-intrusive, muncul di atas dashboard
2. **Dismissible**: User bisa tutup, tidak muncul lagi
3. **Priority System**: Pengumuman penting muncul di atas
4. **Expiration**: Auto-hide setelah tanggal kadaluarsa
5. **Type Variants**: 4 warna berbeda (Info, Sukses, Peringatan, Penting)
6. **Auto-refresh**: Fetch pengumuman baru setiap 5 menit

## 🔐 Security

- ✅ RLS enabled
- ✅ Admin Pusat: Full CRUD access
- ✅ Admin Unit: Read-only untuk pengumuman aktif
- ✅ User hanya bisa dismiss pengumuman mereka sendiri

## 📝 Next Steps

1. Test semua fitur di development
2. Buat beberapa pengumuman test dengan tipe berbeda
3. Test dengan multiple user (Admin Pusat & Admin Unit)
4. Verifikasi dismiss functionality
5. Test expiration date
6. Deploy ke production

## 🐛 Troubleshooting

### Pengumuman tidak muncul?
- Cek apakah pengumuman `is_active = true`
- Cek apakah `expires_at` masih valid
- Cek apakah user sudah dismiss pengumuman tersebut

### Error saat buat pengumuman?
- Pastikan login sebagai Admin Pusat
- Cek console browser untuk error message
- Cek RLS policies di Supabase

### Banner tidak muncul di dashboard?
- Cek apakah ada pengumuman aktif
- Refresh halaman
- Clear browser cache

## 📚 Dokumentasi Lengkap

Lihat file: `FITUR_PENGUMUMAN_ADMIN_PUSAT.md`

---

**Ready to Test!** 🎉
