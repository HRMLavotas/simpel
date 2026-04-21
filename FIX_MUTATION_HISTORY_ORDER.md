# Fix Urutan Riwayat Mutasi dengan Tanggal yang Sama

**Tanggal:** 21 April 2026  
**Status:** ✅ SELESAI

## Masalah

Riwayat mutasi tidak ditampilkan dengan urutan yang benar ketika 2 atau lebih mutasi memiliki tanggal yang sama.

**Contoh Kasus:**
- Pegawai Ali Hamzah:
  - Mutasi 1: Setditjen → Kendari (tanggal 21 April 2026)
  - Mutasi 2: Kendari → Setditjen (tanggal 21 April 2026)
  
Karena kedua mutasi memiliki tanggal yang sama, urutan di database tidak jelas dan bisa menyebabkan inferensi `dari_unit` yang salah.

## Penyebab

Query untuk fetch riwayat mutasi hanya mengurutkan berdasarkan `tanggal`:

```typescript
supabase.from('mutation_history')
  .select('*')
  .eq('employee_id', empId)
  .order('tanggal', { ascending: true, nullsFirst: false })
```

Ketika 2 record memiliki tanggal yang sama, urutan tidak deterministik.

## Solusi

Tambahkan `created_at` sebagai secondary sort untuk memastikan urutan yang benar:

```typescript
supabase.from('mutation_history')
  .select('*')
  .eq('employee_id', empId)
  .order('tanggal', { ascending: true, nullsFirst: false })
  .order('created_at', { ascending: true })  // ← Tiebreaker
```

Dengan ini:
1. Data diurutkan berdasarkan `tanggal` terlebih dahulu
2. Jika tanggal sama, diurutkan berdasarkan `created_at` (waktu insert ke database)
3. Urutan mutasi menjadi deterministik dan sesuai dengan urutan input

## File yang Diubah

1. `src/components/employees/EmployeeFormModal.tsx`
   - Query fetch mutation_history
   - Query fetch position_history
   - Query fetch rank_history

2. `src/pages/Employees.tsx`
   - Query fetch mutation_history (untuk view details)
   - Query fetch position_history
   - Query fetch rank_history

## Testing

1. Refresh browser (Ctrl+F5)
2. Buka detail pegawai Ali Hamzah
3. Lihat riwayat mutasi
4. Urutan seharusnya:
   - Setditjen → Kendari (yang lebih dulu dibuat)
   - Kendari → Setditjen (yang lebih baru dibuat)

## Catatan

- Field `created_at` sudah ada di tabel sejak awal (migration 20260317045038)
- Tidak perlu migration database, hanya perubahan query di frontend
- Solusi ini juga berlaku untuk `position_history` dan `rank_history`

---

**Status Akhir:** ✅ Urutan riwayat mutasi sekarang benar meskipun tanggal sama
