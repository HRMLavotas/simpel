# Implementasi Badge Hukuman Disiplin Pegawai

## Ringkasan
Implementasi fitur badge dan riwayat hukuman disiplin aktif untuk pegawai di sistem SIMPEL.

## Fitur yang Diimplementasikan

### 1. **Badge Hukuman Disiplin Aktif**
- **Lokasi**: Halaman list pegawai (`/admin/pegawai`)
- **Tampilan**: Badge merah dengan icon peringatan dan teks "HD" (Hukuman Disiplin)
- **Fungsi**: Menunjukkan pegawai memiliki hukuman disiplin yang masih aktif
- **Varian**:
  - `compact`: Badge kecil dengan icon dan "HD" untuk list pegawai
  - `default`: Badge lengkap dengan teks "Hukuman Disiplin Aktif" dan counter untuk detail

### 2. **Section Riwayat Hukuman Disiplin**
- **Lokasi**: Modal detail pegawai → Tab "Riwayat" (bagian paling atas)
- **Tampilan**: Card dengan border merah menampilkan semua hukuman disiplin aktif
- **Informasi yang ditampilkan**:
  - Level hukuman (Ringan/Sedang/Berat) dengan badge berwarna
  - Jenis hukuman
  - Nomor SK keputusan
  - Tanggal keputusan
  - Tanggal mulai berlaku
  - Tanggal berakhir (jika ada)
  - Pejabat yang menetapkan
  - Pelanggaran yang dilakukan
  - Catatan tambahan
  - Link dokumen (jika ada)

### 3. **Badge di Header Modal Detail**
- **Lokasi**: Modal detail pegawai → Header (pojok kanan atas)
- **Tampilan**: Badge merah dengan jumlah hukuman disiplin aktif
- **Fungsi**: Memberikan indikasi visual langsung saat membuka detail pegawai

## Komponen yang Dibuat/Dimodifikasi

### Komponen Baru
1. **`DisciplinaryBadge.tsx`**
   - Path: `src/components/employees/DisciplinaryBadge.tsx`
   - Props:
     - `count`: Jumlah hukuman disiplin (default: 1)
     - `variant`: 'default' | 'compact'
     - `className`: Custom styling

### Komponen yang Dimodifikasi
1. **`EmployeeDetailsModal.tsx`**
   - Menambahkan state untuk menyimpan data hukuman disiplin aktif
   - Menambahkan fungsi `loadDisciplinaryActions()` untuk memuat data
   - Menambahkan komponen `ReadOnlyDisciplinaryActions` untuk menampilkan riwayat
   - Menambahkan badge di header modal
   - Menampilkan section hukuman disiplin di tab Riwayat

2. **`Employees.tsx`**
   - Menambahkan import `DisciplinaryBadge` dan `getActiveDisciplinaryActions`
   - Menambahkan state `employeeDisciplinaryCount` untuk menyimpan jumlah hukuman per pegawai
   - Menambahkan fungsi `loadDisciplinaryActionsCount()` untuk memuat data
   - Memanggil fungsi load saat `fetchEmployees()` selesai
   - Menampilkan badge di kolom nama pegawai

## Fungsi Storage yang Digunakan

### `getActiveDisciplinaryActions(employeeId?: string)`
- **File**: `src/lib/disciplinaryActionStorage.ts`
- **Fungsi**: Mengambil semua hukuman disiplin yang masih aktif (belum expired)
- **Parameter**: 
  - `employeeId` (optional): Filter untuk pegawai tertentu
- **Return**: Array of `DisciplinaryAction`

## Logika Hukuman Disiplin Aktif

Hukuman disiplin dianggap **aktif** jika:
1. `end_date` adalah `null` (tidak ada tanggal berakhir), ATAU
2. `end_date` >= tanggal hari ini (belum expired)

Query SQL:
```sql
SELECT * FROM disciplinary_actions
WHERE end_date IS NULL OR end_date >= CURRENT_DATE
```

## Alur Kerja

### Halaman List Pegawai
1. User membuka halaman `/admin/pegawai`
2. Sistem memuat data pegawai via `fetchEmployees()`
3. Setelah pegawai dimuat, sistem memanggil `loadDisciplinaryActionsCount()`
4. Fungsi ini mengambil semua hukuman disiplin aktif dan menghitung per pegawai
5. Badge ditampilkan di kolom nama jika pegawai memiliki hukuman aktif

### Modal Detail Pegawai
1. User klik "Lihat Detail" pada pegawai
2. Modal terbuka dan memanggil `loadDisciplinaryActions(employee.id)`
3. Sistem mengambil hukuman disiplin aktif untuk pegawai tersebut
4. Badge ditampilkan di header jika ada hukuman aktif
5. Section riwayat ditampilkan di tab "Riwayat" (paling atas)

## Styling & Warna

### Badge Level Hukuman
- **Ringan**: Yellow (bg-yellow-100, text-yellow-800)
- **Sedang**: Orange (bg-orange-100, text-orange-800)
- **Berat**: Red (bg-red-100, text-red-800)

### Badge Hukuman Disiplin Aktif
- Background: Red 600 (bg-red-600)
- Hover: Red 700 (hover:bg-red-700)
- Text: White

### Card Riwayat
- Border: Red 200 (border-red-200)
- Background: Red 50/50 (bg-red-50/50)

## Integrasi dengan Sistem Kasus Pegawai

Hukuman disiplin terhubung dengan sistem kasus pegawai:
- Setiap hukuman disiplin terkait dengan satu kasus (`case_id`)
- Hukuman disiplin dibuat melalui halaman detail kasus
- Data disimpan di tabel `disciplinary_actions`

## Testing Checklist

- [ ] Badge muncul di list pegawai untuk pegawai dengan hukuman aktif
- [ ] Badge tidak muncul untuk pegawai tanpa hukuman aktif
- [ ] Badge menampilkan jumlah yang benar jika pegawai memiliki >1 hukuman
- [ ] Section riwayat muncul di tab Riwayat modal detail
- [ ] Section riwayat menampilkan semua informasi dengan benar
- [ ] Badge di header modal menampilkan jumlah yang benar
- [ ] Link dokumen berfungsi jika ada
- [ ] Warna badge sesuai dengan level hukuman
- [ ] Data ter-update setelah menambah/menghapus hukuman disiplin

## Catatan Pengembangan

1. **Performance**: Fungsi `loadDisciplinaryActionsCount()` memuat semua hukuman aktif sekaligus untuk efisiensi. Jika jumlah pegawai sangat besar (>10.000), pertimbangkan untuk menggunakan view atau materialized view di database.

2. **Real-time Update**: Saat ini badge tidak ter-update secara real-time. Perlu refresh halaman setelah menambah/menghapus hukuman disiplin. Untuk implementasi real-time, tambahkan subscription ke tabel `disciplinary_actions`.

3. **RLS Policy**: Pastikan RLS policy di tabel `disciplinary_actions` sudah benar agar admin unit hanya bisa melihat hukuman disiplin pegawai di unit mereka.

## File yang Terlibat

```
src/
├── components/
│   └── employees/
│       ├── DisciplinaryBadge.tsx (NEW)
│       └── EmployeeDetailsModal.tsx (MODIFIED)
├── pages/
│   └── Employees.tsx (MODIFIED)
└── lib/
    └── disciplinaryActionStorage.ts (EXISTING)
```

## Screenshot Lokasi

1. **List Pegawai**: Badge "HD" muncul di bawah nama pegawai (sejajar dengan badge Satpel)
2. **Modal Detail - Header**: Badge "Hukuman Disiplin Aktif" di pojok kanan atas
3. **Modal Detail - Tab Riwayat**: Section "Riwayat Hukuman Disiplin Aktif" di paling atas

---

**Tanggal Implementasi**: 13 Mei 2026
**Developer**: Kiro AI Assistant
