# Perbaikan Dashboard - Distribusi Jabatan Kepmen 202/2024

## Masalah yang Ditemukan

User melaporkan perbedaan jumlah jabatan:
- **Dashboard "Distribusi Jabatan Kepmen 202/2024"**: 22 jabatan, 52 pegawai ❌ (SALAH)
- **Peta Jabatan**: 36 jabatan ✅ (BENAR)

Setelah penghitungan manual, ternyata **36 jabatan adalah jumlah yang benar**.

## Analisis Root Cause

### Dashboard (SALAH ❌)
**File**: `src/hooks/useDashboardData.ts` - `fetchPositionKepmenData()` (SEBELUM PERBAIKAN)
```typescript
// SALAH: Hanya menghitung jabatan yang ada pegawainya
supabase
  .from('employees')
  .select('position_name')
```

**Masalah:**
- Dashboard mengambil data dari tabel `employees`
- Hanya menghitung jabatan yang **sudah ada pegawainya**
- Jabatan kosong (belum ada pegawai) tidak dihitung
- **Hasil: 22 jabatan** (hanya yang ada pegawainya) ❌

**Breakdown:**
- 22 jabatan = jabatan yang sudah ada pegawainya
- 14 jabatan = jabatan kosong (belum ada pegawai, tidak dihitung!)
- **Total seharusnya: 36 jabatan**

### Peta Jabatan (BENAR ✅)
**File**: `src/pages/PetaJabatan.tsx`
```typescript
supabase
  .from('position_references')  // Ambil dari tabel referensi jabatan
  .select('*')
```

**Benar karena:**
- Mengambil data dari tabel `position_references`
- Menampilkan **SEMUA jabatan** yang terdaftar (termasuk yang kosong)
- **Hasil: 36 jabatan** ✅

## Solusi yang Diterapkan

### Perubahan di useDashboardData.ts - fetchPositionKepmenData()

**SEBELUM (SALAH):**
```typescript
// Hanya ambil dari employees - jabatan kosong tidak dihitung
supabase
  .from('employees')
  .select('position_name')
```

**SESUDAH (BENAR):**
```typescript
// 1. Ambil SEMUA jabatan dari position_references (termasuk yang kosong)
supabase
  .from('position_references')
  .select('position_name, department')

// Initialize semua jabatan dengan count 0
positions.forEach(pos => {
  positionCounts[pos.position_name] = 0;
});

// 2. Hitung jumlah pegawai untuk setiap jabatan
supabase
  .from('employees')
  .select('position_name')

employees.forEach(e => {
  if (positionCounts[e.position_name] !== undefined) {
    positionCounts[e.position_name]++;
  }
});
```

### Logika Baru:
1. **Ambil semua jabatan** dari `position_references` (36 jabatan)
2. **Initialize count = 0** untuk semua jabatan
3. **Hitung pegawai** untuk setiap jabatan dari tabel `employees`
4. **Hasil**: Semua 36 jabatan ditampilkan, termasuk yang count = 0

## Dampak Perbaikan

### Sebelum Perbaikan:
- Dashboard: 22 jabatan (hanya yang ada pegawainya) ❌
- Peta Jabatan: 36 jabatan (semua jabatan) ✅
- **Tidak konsisten!**

### Setelah Perbaikan:
- Dashboard: 36 jabatan (semua jabatan, termasuk yang kosong) ✅
- Peta Jabatan: 36 jabatan (semua jabatan) ✅
- **Konsisten!**

### Contoh Output Dashboard Setelah Perbaikan:
```
Distribusi Jabatan Kepmen 202/2024
Total: 52 pegawai dalam 36 jabatan

Direktur: 1 pegawai
Kepala Subbagian Tata Usaha: 1 pegawai
Analis Kebijakan Ahli Muda: 2 pegawai
...
Jabatan Kosong A: 0 pegawai  ← Sekarang ditampilkan!
Jabatan Kosong B: 0 pegawai  ← Sekarang ditampilkan!
...
```

## Mengapa Ini Penting?

### Dashboard Harus Menampilkan Semua Jabatan
- **Perencanaan Formasi**: Perlu tahu jabatan mana yang masih kosong
- **Analisis Kebutuhan**: Jabatan dengan count 0 = perlu rekrutmen
- **Konsistensi Data**: Dashboard dan Peta Jabatan harus sinkron
- **Transparansi**: Stakeholder perlu melihat jabatan kosong untuk perencanaan

### Jabatan Kosong = Informasi Penting
- Menunjukkan gap antara ABK dan existing
- Membantu perencanaan rekrutmen
- Indikator kekurangan SDM

## Perubahan di Import.tsx

**TIDAK ADA PERUBAHAN** - Logika import sudah benar:
```typescript
// Fallback ke SK jika Kepmen kosong - INI BENAR
const positionNameForRef = positionKepmen || positionSK;
```

**Mengapa fallback diperlukan?**
- Beberapa jabatan mungkin hanya ada di kolom SK
- Fallback memastikan semua jabatan tercatat di position_references
- Ini yang menyebabkan 36 jabatan (bukan 22)

## Langkah Testing

### 1. Refresh Dashboard
1. Buka halaman Dashboard
2. Pilih department: "Direktorat Bina Stankomproglat"
3. Aktifkan chart "Jabatan Sesuai Kepmen 202/2024"
4. Verifikasi:
   - Total jabatan: **36 jabatan** ✅
   - Total pegawai: **52 pegawai** ✅
   - Beberapa jabatan dengan count 0 ditampilkan ✅

### 2. Bandingkan dengan Peta Jabatan
1. Buka halaman Peta Jabatan
2. Pilih department: "Direktorat Bina Stankomproglat"
3. Verifikasi:
   - Total jabatan: **36 jabatan** ✅
   - Sama dengan Dashboard ✅

### 3. Verifikasi Chart Display
- Karena 36 jabatan > 20, chart akan otomatis menggunakan **Table View**
- Table view lebih cocok untuk data banyak
- Semua 36 jabatan ditampilkan dengan scrollable table

## Files Modified
1. `src/hooks/useDashboardData.ts` - `fetchPositionKepmenData()`: Ambil dari position_references, bukan employees

## Status
✅ FIXED - Dashboard sekarang menampilkan semua 36 jabatan (termasuk yang kosong)
✅ Konsisten dengan Peta Jabatan
✅ Siap untuk testing
