# Debug: Satpel Filter Issue - Pegawai Tidak Muncul

## Masalah
Ketika beralih ke unit binaan "Satuan Pelayanan Majene", pegawai yang ditugaskan ke Satpel tersebut tidak muncul di daftar.

## Data Pegawai
```
id: f0659a37-fb99-4c6c-9f68-d137ecb65be7
name: akun demo tes
department: BBPVP Makassar
satuan_kerja_penugasan: Satuan Pelayanan Majene
is_active: true
```

## Alur Filter yang Seharusnya Bekerja

### 1. User Memilih "Satuan Pelayanan Majene"
- `selectedDepartment` = "Satuan Pelayanan Majene"

### 2. Resolve Effective Department
```typescript
const effective = getEffectiveDepartment("Satuan Pelayanan Majene");
// Hasil: "BBPVP Makassar" (dari UNIT_PEMBINA_MAPPING)
```

### 3. Set Active Satpel Filter
```typescript
if (isSatpelOrWorkshop("Satuan Pelayanan Majene")) {
  setActiveSatpelFilter("Satuan Pelayanan Majene");
}
// isSatpelOrWorkshop() checks if name starts with "Satuan Pelayanan "
// Hasil: activeSatpelFilter = "Satuan Pelayanan Majene"
```

### 4. Fetch Employees dari Database
```sql
SELECT * FROM employees 
WHERE department = 'BBPVP Makassar' 
  AND is_active = true
  AND (asn_status IS NULL OR asn_status != 'Non ASN')
```
**Pegawai "akun demo tes" HARUS masuk dalam hasil query ini** karena:
- ✅ department = "BBPVP Makassar"
- ✅ is_active = true
- ✅ asn_status bukan "Non ASN"

### 5. Client-Side Filter (Normalisasi)
```typescript
const filteredEmployees = activeSatpelFilter
  ? rawEmployees.filter(emp => {
      if (!emp.satuan_kerja_penugasan) return false;
      
      // Normalize: "Satpel X" → "Satuan Pelayanan X"
      const normalizeForComparison = (name: string) => {
        return name.replace(/^Satpel\s+/, 'Satuan Pelayanan ');
      };
      
      const normalizedFilter = normalizeForComparison("Satuan Pelayanan Majene");
      // Hasil: "Satuan Pelayanan Majene" (tidak berubah)
      
      const normalizedPenugasan = normalizeForComparison("Satuan Pelayanan Majene");
      // Hasil: "Satuan Pelayanan Majene" (tidak berubah)
      
      return normalizedPenugasan === normalizedFilter;
      // Hasil: true (HARUS MATCH!)
    })
  : rawEmployees;
```

## Debug Logging yang Ditambahkan

File: `src/pages/PetaJabatan.tsx` (sekitar line 270-300)

Logging akan menampilkan:
1. **activeSatpelFilter**: Filter Satpel yang aktif
2. **rawEmployees count**: Jumlah pegawai dari database (sebelum filter)
3. **Per Employee**:
   - Nama pegawai
   - `satuan_kerja_penugasan` (original)
   - `satuan_kerja_penugasan` (normalized)
   - Filter value (normalized)
   - Apakah match atau tidak
4. **filteredEmployees count**: Jumlah pegawai setelah filter

## Cara Testing

1. **Login sebagai Admin Unit Pembina** (BBPVP Makassar)
2. **Buka menu Peta Jabatan**
3. **Pilih "Satuan Pelayanan Majene"** dari dropdown
4. **Buka Browser Console** (F12 → Console tab)
5. **Cari log dengan prefix** `=== SATPEL FILTER DEBUG ===`

## Expected Output

```
=== SATPEL FILTER DEBUG ===
activeSatpelFilter: Satuan Pelayanan Majene
rawEmployees count: 1 (atau lebih)

Employee akun demo tes: {
  original: "Satuan Pelayanan Majene",
  normalized: "Satuan Pelayanan Majene",
  filter: "Satuan Pelayanan Majene",
  matches: true
}

filteredEmployees count: 1 (atau lebih)
=== END SATPEL FILTER DEBUG ===
```

## Kemungkinan Penyebab Jika Masih Gagal

### A. Pegawai Tidak Muncul di rawEmployees
**Penyebab**: Query database tidak mengembalikan pegawai
**Solusi**: 
- Cek apakah `effectiveDepartment` benar-benar "BBPVP Makassar"
- Cek apakah pegawai memiliki `is_active = true`
- Cek apakah pegawai memiliki `asn_status` yang valid (bukan "Non ASN")

### B. Normalisasi Tidak Bekerja
**Penyebab**: Ada karakter whitespace atau format yang berbeda
**Solusi**:
- Cek log untuk melihat nilai `original` vs `normalized`
- Pastikan tidak ada trailing/leading spaces
- Pastikan format nama persis sama (case-sensitive)

### C. Filter Tidak Aktif
**Penyebab**: `activeSatpelFilter` null atau undefined
**Solusi**:
- Cek apakah `isSatpelOrWorkshop()` mengenali "Satuan Pelayanan Majene"
- Cek apakah `getEffectiveDepartment()` mengembalikan nilai yang valid (bukan null)

### D. Mapping Tidak Lengkap
**Penyebab**: "Satuan Pelayanan Majene" tidak ada di `UNIT_PEMBINA_MAPPING`
**Solusi**:
- Cek file `src/lib/constants.ts`
- Pastikan ada entry:
  ```typescript
  'Satuan Pelayanan Majene': 'BBPVP Makassar',
  ```

## Status
✅ Debug logging telah ditambahkan
✅ Build berhasil (6.95s)
⏳ Menunggu hasil testing dari user

## Next Steps
1. User melakukan testing dengan langkah di atas
2. User share screenshot console log
3. Analisis hasil log untuk identifikasi root cause
4. Implementasi fix berdasarkan temuan
