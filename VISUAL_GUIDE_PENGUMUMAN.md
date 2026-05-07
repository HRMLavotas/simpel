# 📢 Visual Guide: Fitur Pengumuman

## 🎨 User Interface Flow

### 1. Admin Pusat - Kelola Pengumuman

```
┌─────────────────────────────────────────────────────────────┐
│  SIMPEL - Kelola Pengumuman                                 │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  📢 Kelola Pengumuman                    [+ Buat Pengumuman]│
│  Buat dan kelola pengumuman yang akan muncul di dashboard   │
│  semua admin unit                                           │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │ Selamat Datang di Fitur Pengumuman!  [Sukses]     │    │
│  │                                       [👁️] [✏️] [🗑️]  │
│  │ Dibuat oleh: Admin Pusat                           │    │
│  │ 7 Mei 2026, 10:30                                  │    │
│  │                                                     │    │
│  │ Fitur pengumuman sistem sudah aktif. Admin Pusat   │    │
│  │ sekarang dapat mengirim pengumuman ke semua admin  │    │
│  │ unit.                                               │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │ Maintenance Sistem Terjadwal  [Penting] [Nonaktif]│    │
│  │                                       [👁️] [✏️] [🗑️]  │
│  │ Dibuat oleh: Admin Pusat                           │    │
│  │ 6 Mei 2026, 15:00                                  │    │
│  │ ⏰ Kadaluarsa: 11 Mei 2026                         │    │
│  │                                                     │    │
│  │ Sistem akan maintenance pada Sabtu, 10 Mei 2026   │    │
│  │ pukul 22:00-24:00 WIB.                            │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 2. Dialog Buat/Edit Pengumuman

```
┌─────────────────────────────────────────────────────┐
│  Buat Pengumuman Baru                          [X]  │
├─────────────────────────────────────────────────────┤
│  Pengumuman akan muncul di dashboard semua admin    │
│  unit sampai mereka menutupnya                      │
│                                                      │
│  Judul Pengumuman *                                 │
│  ┌────────────────────────────────────────────┐    │
│  │ Contoh: Pembaruan Sistem                   │    │
│  └────────────────────────────────────────────┘    │
│                                                      │
│  Pesan *                                            │
│  ┌────────────────────────────────────────────┐    │
│  │ Tulis pesan pengumuman di sini...          │    │
│  │                                             │    │
│  │                                             │    │
│  └────────────────────────────────────────────┘    │
│  Anda bisa menggunakan enter untuk membuat baris    │
│  baru                                               │
│                                                      │
│  Tipe *              Prioritas *                    │
│  ┌──────────────┐   ┌──────────────┐              │
│  │ Informasi  ▼ │   │ 0            │              │
│  └──────────────┘   └──────────────┘              │
│                      Angka lebih tinggi = prioritas │
│                      lebih tinggi                   │
│                                                      │
│  Tanggal Kadaluarsa (Opsional)                     │
│  ┌────────────────────────────────────────────┐    │
│  │ 📅 dd/mm/yyyy                              │    │
│  └────────────────────────────────────────────┘    │
│  Kosongkan jika pengumuman tidak memiliki batas     │
│  waktu                                              │
│                                                      │
│                          [Batal] [Buat Pengumuman] │
└─────────────────────────────────────────────────────┘
```

### 3. Admin Unit - Dashboard dengan Banner

```
┌─────────────────────────────────────────────────────────────┐
│  SIMPEL - Dashboard                                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ 🔴 Maintenance Sistem Terjadwal                  [X] │  │
│  │                                                       │  │
│  │ Sistem akan maintenance pada Sabtu, 10 Mei 2026     │  │
│  │ pukul 22:00-24:00 WIB. Mohon simpan pekerjaan Anda  │  │
│  │ sebelum waktu tersebut.                              │  │
│  │                                                       │  │
│  │ Dari: Admin Pusat • 6 Mei 2026, 15:00              │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ 🟢 Fitur Baru: Export ke Excel                   [X] │  │
│  │                                                       │  │
│  │ Sekarang Anda dapat mengekspor data pegawai ke       │  │
│  │ format Excel! Klik tombol "Export" di halaman Data   │  │
│  │ Pegawai untuk mencoba.                               │  │
│  │                                                       │  │
│  │ Dari: Admin Pusat • 5 Mei 2026, 09:15              │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  📊 Dashboard - BPVP Semarang                               │
│  Dashboard eksekutif untuk monitoring data pegawai          │
│                                                              │
│  ┌──────────┬──────────┬──────────┬──────────┬──────────┐ │
│  │ Total    │ ASN      │ PNS      │ CPNS     │ PPPK     │ │
│  │ Pegawai  │          │          │          │          │ │
│  │ 150      │ 120      │ 100      │ 5        │ 15       │ │
│  └──────────┴──────────┴──────────┴──────────┴──────────┘ │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## 🎨 Banner Color Variants

### Info (Biru)
```
┌──────────────────────────────────────────────────────┐
│ 🔵 Panduan Penggunaan Sistem                    [X] │
│                                                      │
│ Panduan lengkap penggunaan sistem SIMPEL sudah      │
│ tersedia di menu Info Sistem.                       │
│                                                      │
│ Dari: Admin Pusat • 7 Mei 2026, 10:00              │
└──────────────────────────────────────────────────────┘
```

### Sukses (Hijau)
```
┌──────────────────────────────────────────────────────┐
│ 🟢 Fitur Baru: Export ke Excel                  [X] │
│                                                      │
│ Sekarang Anda dapat mengekspor data pegawai ke      │
│ format Excel!                                        │
│                                                      │
│ Dari: Admin Pusat • 7 Mei 2026, 09:00              │
└──────────────────────────────────────────────────────┘
```

### Peringatan (Kuning)
```
┌──────────────────────────────────────────────────────┐
│ 🟡 Deadline Update Data                         [X] │
│                                                      │
│ Mohon segera update data pegawai di unit Anda       │
│ sebelum tanggal 15 Mei 2026.                        │
│                                                      │
│ Dari: Admin Pusat • 7 Mei 2026, 08:00              │
└──────────────────────────────────────────────────────┘
```

### Penting (Merah)
```
┌──────────────────────────────────────────────────────┐
│ 🔴 Maintenance Sistem Terjadwal                 [X] │
│                                                      │
│ Sistem akan maintenance pada Sabtu, 10 Mei 2026    │
│ pukul 22:00-24:00 WIB.                             │
│                                                      │
│ Dari: Admin Pusat • 6 Mei 2026, 15:00              │
└──────────────────────────────────────────────────────┘
```

## 🔄 User Flow Diagram

### Admin Pusat Flow
```
┌─────────────┐
│ Login Admin │
│   Pusat     │
└──────┬──────┘
       │
       ▼
┌─────────────────┐
│ Klik Menu       │
│ "Pengumuman"    │
└──────┬──────────┘
       │
       ▼
┌─────────────────────────────────────┐
│ Halaman Kelola Pengumuman           │
│ - List semua pengumuman             │
│ - Status aktif/nonaktif             │
│ - Tanggal kadaluarsa                │
└──────┬──────────────────────────────┘
       │
       ├─────────────────┬─────────────────┬──────────────┐
       ▼                 ▼                 ▼              ▼
┌──────────────┐  ┌──────────────┐  ┌──────────┐  ┌──────────┐
│ Buat Baru    │  │ Edit         │  │ Toggle   │  │ Hapus    │
│              │  │              │  │ Aktif    │  │          │
└──────┬───────┘  └──────┬───────┘  └────┬─────┘  └────┬─────┘
       │                 │                │             │
       ▼                 ▼                ▼             ▼
┌──────────────────────────────────────────────────────────┐
│ Pengumuman tersimpan & muncul di dashboard admin unit    │
└──────────────────────────────────────────────────────────┘
```

### Admin Unit Flow
```
┌─────────────┐
│ Login Admin │
│    Unit     │
└──────┬──────┘
       │
       ▼
┌─────────────────┐
│ Buka Dashboard  │
└──────┬──────────┘
       │
       ▼
┌─────────────────────────────────────┐
│ Banner Pengumuman Muncul            │
│ - Diurutkan berdasarkan prioritas   │
│ - Multiple banner jika ada          │
└──────┬──────────────────────────────┘
       │
       ├─────────────────┬─────────────────┐
       ▼                 ▼                 ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ Baca         │  │ Klik [X]     │  │ Biarkan      │
│ Pengumuman   │  │ untuk tutup  │  │ Terbuka      │
└──────────────┘  └──────┬───────┘  └──────────────┘
                         │
                         ▼
                  ┌──────────────────┐
                  │ Pengumuman       │
                  │ tidak muncul     │
                  │ lagi             │
                  └──────────────────┘
```

## 📊 Data Relationship

```
┌─────────────────────────────────────────────────────────┐
│                    auth.users                           │
│  ┌──────────────────────────────────────────────────┐  │
│  │ id (UUID)                                        │  │
│  │ email                                            │  │
│  └──────────────────────────────────────────────────┘  │
└────────────┬────────────────────────────┬───────────────┘
             │                            │
             │ created_by                 │ user_id
             │                            │
             ▼                            ▼
┌────────────────────────────┐  ┌─────────────────────────┐
│     announcements          │  │ announcement_dismissals │
│ ┌────────────────────────┐ │  │ ┌─────────────────────┐ │
│ │ id (UUID) PK           │ │  │ │ id (UUID) PK        │ │
│ │ title                  │ │  │ │ announcement_id FK  │◄┤
│ │ message                │ │  │ │ user_id FK          │ │
│ │ type                   │ │  │ │ dismissed_at        │ │
│ │ is_active              │ │  │ └─────────────────────┘ │
│ │ priority               │ │  │                         │
│ │ expires_at             │ │  │ UNIQUE(announcement_id, │
│ │ created_by FK          │ │  │        user_id)         │
│ │ created_at             │ │  └─────────────────────────┘
│ │ updated_at             │ │
│ └────────────────────────┘ │
└────────────────────────────┘
```

## 🔐 Security Flow

```
┌─────────────────────────────────────────────────────────┐
│                    RLS Policies                         │
└─────────────────────────────────────────────────────────┘

announcements table:
┌─────────────────────────────────────────────────────────┐
│ Admin Pusat:                                            │
│   ✅ SELECT, INSERT, UPDATE, DELETE                     │
│   Policy: user_roles.role = 'admin_pusat'              │
│                                                          │
│ All Users:                                              │
│   ✅ SELECT (active announcements only)                 │
│   Policy: is_active = true AND                          │
│           (expires_at IS NULL OR expires_at > now())    │
└─────────────────────────────────────────────────────────┘

announcement_dismissals table:
┌─────────────────────────────────────────────────────────┐
│ All Users:                                              │
│   ✅ INSERT (own dismissals)                            │
│   Policy: user_id = auth.uid()                          │
│                                                          │
│   ✅ SELECT (own dismissals)                            │
│   Policy: user_id = auth.uid()                          │
│                                                          │
│ Admin Pusat:                                            │
│   ✅ SELECT (all dismissals for analytics)              │
│   Policy: user_roles.role = 'admin_pusat'              │
└─────────────────────────────────────────────────────────┘
```

## 🎯 Priority System

```
Prioritas 100 (Tertinggi)
    ↓
┌──────────────────────────────────────────┐
│ 🔴 Maintenance Sistem (Prioritas: 100)  │
└──────────────────────────────────────────┘
    ↓
┌──────────────────────────────────────────┐
│ 🟡 Deadline Update (Prioritas: 80)      │
└──────────────────────────────────────────┘
    ↓
┌──────────────────────────────────────────┐
│ 🟢 Fitur Baru (Prioritas: 50)           │
└──────────────────────────────────────────┘
    ↓
┌──────────────────────────────────────────┐
│ 🔵 Info Umum (Prioritas: 10)            │
└──────────────────────────────────────────┘
    ↓
Prioritas 0 (Terendah)
```

## ⏰ Expiration Flow

```
Pengumuman Dibuat
    │
    ├─ expires_at = NULL
    │     │
    │     └─► Tidak pernah kadaluarsa
    │
    └─ expires_at = 2026-05-15
          │
          ├─ now() < 2026-05-15
          │     │
          │     └─► Masih aktif, muncul di dashboard
          │
          └─ now() >= 2026-05-15
                │
                └─► Kadaluarsa, tidak muncul lagi
```

---

**Visual Guide ini membantu memahami:**
- ✅ UI/UX flow untuk Admin Pusat & Admin Unit
- ✅ Banner design & color variants
- ✅ Data relationship & security
- ✅ Priority & expiration system

**Untuk dokumentasi lengkap, lihat:**
- `FITUR_PENGUMUMAN_ADMIN_PUSAT.md`
- `QUICK_START_PENGUMUMAN.md`
