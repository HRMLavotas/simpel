# Implementasi Tabs di Peta Jabatan

## Ringkasan Perubahan

Menambahkan tabs di halaman Peta Jabatan untuk memisahkan:
1. **Peta Jabatan ASN** - Jabatan sesuai Kepmen 202/2024 dengan pemangku ASN
2. **Formasi Non-ASN** - Daftar pegawai Non-ASN per unit kerja

## File yang Dimodifikasi

### `src/pages/PetaJabatan.tsx`

**Perubahan:**

1. **Import Tabs Component**
   ```typescript
   import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
   ```

2. **State Baru**
   - `activeTab`: State untuk track tab aktif ('asn' | 'non-asn')
   - `nonAsnEmployees`: State untuk menyimpan data pegawai Non-ASN

3. **Update Interface EmployeeMatch**
   Menambahkan field untuk Non-ASN:
   - `nik`: NIK pegawai Non-ASN
   - `position`: Jabatan Non-ASN (berbeda dengan position_name untuk ASN)
   - `type_non_asn`: Tipe Non-ASN (Tenaga Alih Daya / Tenaga Ahli)

4. **Update fetchData()**
   - Fetch terpisah untuk ASN dan Non-ASN
   - ASN: `neq('asn_status', 'Non ASN')`
   - Non-ASN: `eq('asn_status', 'Non ASN')`
   - Menyimpan ke state terpisah

## Struktur Tabs

### Tab 1: Peta Jabatan ASN
**Fitur:**
- Menampilkan peta jabatan sesuai Kepmen 202/2024
- Kategori: Struktural, Fungsional, Pelaksana
- Kolom:
  - No
  - Jabatan Sesuai Kepmen 202/2024
  - Grade/Kelas
  - ABK (Analisis Beban Kerja)
  - Existing (Jumlah pemangku)
  - Nama Pemangku
  - Kriteria ASN (PNS/PPPK)
  - Status (Kurang/Lebih/Sesuai)
  - Aksi (Edit/Delete - Admin Pusat only)

**Counter:**
- Jumlah jabatan
- Jumlah pegawai ASN

### Tab 2: Formasi Non-ASN
**Fitur:**
- Menampilkan daftar pegawai Non-ASN per unit kerja
- Tidak ada struktur jabatan Kepmen (karena Non-ASN tidak mengikuti struktur tersebut)
- Kolom:
  - No
  - NIK
  - Nama
  - Jabatan (Pengemudi, Petugas Kebersihan, Pramubakti, dll)
  - Pendidikan
  - Jenis Kelamin
  - Type Non ASN (Tenaga Alih Daya / Tenaga Ahli)

**Counter:**
- Jumlah pegawai Non-ASN

**Badge Color:**
- Tenaga Alih Daya: Blue badge
- Tenaga Ahli: Purple badge

## Tampilan UI

### Tab Header
```
┌─────────────────────────────────────────────────────┐
│ [Peta Jabatan ASN (X jabatan, Y pegawai)]          │
│ [Formasi Non-ASN (Z pegawai)]                      │
└─────────────────────────────────────────────────────┘
```

### Tab ASN (Existing)
- Tetap sama seperti sebelumnya
- Struktur kategori dengan collapse/expand
- Search functionality
- Export Excel
- Add/Edit jabatan (Admin Pusat)

### Tab Non-ASN (New)
```
┌──────────────────────────────────────────────────────────────┐
│ Formasi Non-ASN - Setditjen Binalavotas                     │
│ (15 pegawai Non-ASN)                                         │
├──────────────────────────────────────────────────────────────┤
│ No │ NIK              │ Nama           │ Jabatan    │ ...   │
├──────────────────────────────────────────────────────────────┤
│ 1  │ 3276012302800010 │ Wachyudi M.    │ Pengemudi  │ ...   │
│ 2  │ 3174091103750012 │ Teguh Prihatin │ Petugas... │ ...   │
└──────────────────────────────────────────────────────────────┘
```

## Query Database

### Fetch ASN
```typescript
supabase
  .from('employees')
  .select('...')
  .eq('department', selectedDepartment)
  .neq('asn_status', 'Non ASN')
```

### Fetch Non-ASN
```typescript
supabase
  .from('employees')
  .select('...')
  .eq('department', selectedDepartment)
  .eq('asn_status', 'Non ASN')
```

## Fitur yang Dipertahankan

✅ Refresh button - refresh kedua tab
✅ Export Excel - export tab ASN (existing)
✅ Department selector - berlaku untuk kedua tab
✅ Loading state - berlaku untuk kedua tab
✅ Responsive design
✅ Permission system (canEdit, isAdminPusat)

## Fitur Baru

✅ Tab switching antara ASN dan Non-ASN
✅ Counter terpisah per tab
✅ Tabel khusus untuk Non-ASN dengan kolom yang relevan
✅ Badge color untuk Type Non ASN
✅ Empty state untuk Non-ASN

## Perbedaan ASN vs Non-ASN

| Aspek | ASN | Non-ASN |
|-------|-----|---------|
| Struktur | Kepmen 202/2024 | Tidak ada struktur formal |
| Kategori | Struktural/Fungsional/Pelaksana | Tidak ada kategori |
| ABK | Ada | Tidak ada |
| Grade | Ada | Tidak ada |
| NIP | Ada | Tidak ada (pakai NIK) |
| Pangkat | Ada | Tidak ada |
| Type | PNS/PPPK | Tenaga Alih Daya/Tenaga Ahli |
| Jabatan | position_name (Kepmen) | position (free text) |

## Use Case

### Skenario 1: Melihat Peta Jabatan ASN
1. User membuka halaman Peta Jabatan
2. Default tab: "Peta Jabatan ASN"
3. Melihat struktur jabatan dengan pemangku
4. Bisa export, edit, dll (existing features)

### Skenario 2: Melihat Formasi Non-ASN
1. User klik tab "Formasi Non-ASN"
2. Melihat daftar pegawai Non-ASN
3. Informasi: NIK, Nama, Jabatan, Type Non ASN
4. Tidak ada fitur edit di sini (edit via halaman Data Pegawai)

### Skenario 3: Ganti Unit Kerja
1. Admin Pusat pilih unit kerja lain
2. Kedua tab otomatis refresh
3. Counter update sesuai data unit kerja baru

## Testing Checklist

- [x] Tab ASN menampilkan data dengan benar
- [x] Tab Non-ASN menampilkan data dengan benar
- [x] Counter di tab header akurat
- [x] Ganti unit kerja refresh kedua tab
- [x] Refresh button bekerja untuk kedua tab
- [x] Loading state tampil dengan benar
- [x] Empty state untuk Non-ASN
- [x] Badge color untuk Type Non ASN
- [x] Responsive di mobile
- [x] No errors di console

## Next Steps (Optional)

1. Tambah search di tab Non-ASN
2. Tambah export Excel untuk Non-ASN
3. Tambah filter by Type Non ASN
4. Tambah statistik/summary di tab Non-ASN
5. Tambah link ke halaman edit pegawai

## Catatan

- Tab ASN tetap mempertahankan semua fitur existing
- Tab Non-ASN hanya menampilkan data (read-only di halaman ini)
- Edit data Non-ASN dilakukan di halaman "Data Pegawai"
- Struktur database tidak berubah, hanya query yang berbeda
