# Fix: Filter Pangkat/Golongan Menampilkan Non ASN

**Tanggal**: 6 Mei 2026  
**Status**: ✅ **FIXED**

## 🔍 Masalah yang Dilaporkan

Setelah fix sebelumnya, user melaporkan masalah baru:

Saat memilih filter **Pangkat/Golongan** (misalnya "Penata Muda (III/a)"), pegawai **Non ASN** yang tidak memiliki pangkat/golongan **tidak muncul** di hasil.

**Contoh Kasus:**
1. User memilih kolom: Nama, Status ASN, Pangkat/Golongan
2. User memilih filter Pangkat/Golongan: "Penata Muda (III/a)"
3. User ingin melihat **semua pegawai** termasuk Non ASN
4. **Hasil:** Hanya pegawai dengan pangkat "Penata Muda (III/a)" yang muncul
5. **Masalah:** Pegawai Non ASN (rank_group = null) tidak muncul

## 🕵️ Root Cause

Filter `rank_group` dengan operator `in` hanya mencari nilai yang **persis cocok**:

```sql
WHERE rank_group IN ('Penata Muda (III/a)', 'Pembina (IV/a)')
```

Pegawai dengan `rank_group = NULL` (Non ASN) **tidak termasuk** dalam hasil query.

## ✅ Solusi yang Diterapkan

### 1. Tambahkan Opsi "(Tidak Ada)" di Filter

**File yang dimodifikasi:**
1. `src/pages/DataBuilder.tsx`
2. `src/components/data-builder/FilterBuilder.tsx`

**Perubahan:**
```typescript
rank_group: [
  'Juru Tk I (I/d)',
  'Pengatur Muda (II/a)',
  // ... pangkat lainnya ...
  'Pembina Madya (IV/d)',
  'III', 'V', 'VII', 'IX', // PPPK
  '(Tidak Ada)', // ← DITAMBAHKAN: Non ASN atau data kosong
]
```

### 2. Modifikasi Logika Filter untuk Menangani NULL

**File:** `src/pages/DataBuilder.tsx`

**Logika baru:**
```typescript
// Special handling for rank_group: if "(Tidak Ada)" is selected, include null values
if (field === 'rank_group' && vals.includes('(Tidak Ada)')) {
  const actualVals = vals.filter(v => v !== '(Tidak Ada)');
  if (actualVals.length > 0) {
    // Include both actual values AND null
    q = q.or(`${field}.in.(${actualVals.map(v => `"${v}"`).join(',')}),${field}.is.null`);
  } else {
    // Only null values
    q = q.is(field, null);
  }
} else {
  q = q.in(field, vals);
}
```

**Penjelasan:**
- Jika user memilih "(Tidak Ada)", query akan mencari `rank_group IS NULL`
- Jika user memilih "(Tidak Ada)" + pangkat lain, query akan mencari keduanya dengan OR
- Jika user tidak memilih "(Tidak Ada)", query normal (hanya nilai yang dipilih)

## 📊 Hasil

### Sebelum Fix:
```
Filter: Penata Muda (III/a)
Hasil: 
  ✅ Budi (PNS, Penata Muda (III/a))
  ✅ Ani (CPNS, Penata Muda (III/a))
  ❌ Citra (Non ASN, rank_group = null) ← TIDAK MUNCUL
```

### Setelah Fix:
```
Filter: Penata Muda (III/a) + (Tidak Ada)
Hasil:
  ✅ Budi (PNS, Penata Muda (III/a))
  ✅ Ani (CPNS, Penata Muda (III/a))
  ✅ Citra (Non ASN, rank_group = null) ← MUNCUL!
```

## 🎯 Cara Menggunakan

### Skenario 1: Hanya Pegawai dengan Pangkat Tertentu
1. Pilih kolom: Nama, Status ASN, Pangkat/Golongan
2. Filter Pangkat/Golongan: Centang "Penata Muda (III/a)"
3. **Hasil:** Hanya pegawai dengan pangkat tersebut

### Skenario 2: Pegawai dengan Pangkat Tertentu + Non ASN
1. Pilih kolom: Nama, Status ASN, Pangkat/Golongan
2. Filter Pangkat/Golongan: Centang "Penata Muda (III/a)" + "(Tidak Ada)"
3. **Hasil:** Pegawai dengan pangkat tersebut + Non ASN (tanpa pangkat)

### Skenario 3: Hanya Non ASN (Tanpa Pangkat)
1. Pilih kolom: Nama, Status ASN, Pangkat/Golongan
2. Filter Pangkat/Golongan: Centang "(Tidak Ada)" saja
3. **Hasil:** Hanya pegawai Non ASN atau yang tidak memiliki pangkat

### Skenario 4: Semua Pegawai (Tidak Filter Pangkat)
1. Pilih kolom: Nama, Status ASN, Pangkat/Golongan
2. Filter Pangkat/Golongan: **Jangan centang apapun** (kosong)
3. **Hasil:** Semua pegawai (ASN + Non ASN)

## 🧪 Cara Verifikasi

1. Buka menu **Data Builder**
2. Pilih kolom:
   - ✅ Nama
   - ✅ Status ASN
   - ✅ Pangkat/Golongan
3. Di filter Pangkat/Golongan, centang:
   - ✅ Penata Muda (III/a)
   - ✅ (Tidak Ada)
4. Klik **"Tampilkan Data"**
5. **Hasil:** Data akan menampilkan:
   - Pegawai PNS/CPNS dengan pangkat "Penata Muda (III/a)"
   - Pegawai Non ASN (tanpa pangkat)

## 📝 File yang Dimodifikasi

1. `src/pages/DataBuilder.tsx` - Tambah opsi "(Tidak Ada)" + logika filter NULL
2. `src/components/data-builder/FilterBuilder.tsx` - Tambah opsi "(Tidak Ada)"

## 💡 Catatan Teknis

### Query SQL yang Dihasilkan

**Jika memilih "Penata Muda (III/a)" + "(Tidak Ada)":**
```sql
WHERE (
  rank_group IN ('Penata Muda (III/a)') 
  OR rank_group IS NULL
)
```

**Jika hanya memilih "(Tidak Ada)":**
```sql
WHERE rank_group IS NULL
```

**Jika tidak memilih apapun:**
```sql
-- Tidak ada filter rank_group (semua data muncul)
```

## 🎉 Kesimpulan

**TASK COMPLETED** ✅

Filter Pangkat/Golongan di Data Builder sekarang mendukung pegawai Non ASN dengan menambahkan opsi **(Tidak Ada)** yang akan mencari pegawai dengan `rank_group = NULL`.

**Manfaat:**
- ✅ User bisa memilih pangkat tertentu + Non ASN sekaligus
- ✅ User bisa filter hanya Non ASN saja
- ✅ Fleksibilitas lebih tinggi dalam filtering data
- ✅ Tidak perlu membuat filter terpisah untuk Non ASN

---

**Dibuat oleh:** Kiro AI  
**Tanggal:** 6 Mei 2026  
**Versi:** 1.0
