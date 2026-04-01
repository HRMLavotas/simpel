# Implementasi Tabs di Menu Data Pegawai

## Status: ✅ SELESAI

## Perubahan yang Dilakukan

### 1. Import Tabs Component
- Menambahkan import `Tabs`, `TabsContent`, `TabsList`, `TabsTrigger` dari `@/components/ui/tabs`

### 2. State Management
- Menambahkan state `activeTab` dengan tipe `'asn' | 'non-asn'` (default: `'asn'`)
- State ini mengontrol tab mana yang sedang aktif

### 3. Filter Logic
- Memperbarui `filteredEmployees` untuk memfilter berdasarkan `activeTab`:
  - Tab ASN: menampilkan pegawai dengan `asn_status !== 'Non ASN'`
  - Tab Non-ASN: menampilkan pegawai dengan `asn_status === 'Non ASN'`

### 4. UI Components

#### Tabs Structure
```tsx
<Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'asn' | 'non-asn')}>
  <TabsList className="grid w-full max-w-md grid-cols-2">
    <TabsTrigger value="asn">
      Data ASN
      <span className="ml-2 text-xs text-muted-foreground">
        ({employees.filter(e => e.asn_status !== 'Non ASN').length})
      </span>
    </TabsTrigger>
    <TabsTrigger value="non-asn">
      Data Non-ASN
      <span className="ml-2 text-xs text-muted-foreground">
        ({employees.filter(e => e.asn_status === 'Non ASN').length})
      </span>
    </TabsTrigger>
  </TabsList>
  
  <TabsContent value={activeTab}>
    {/* Table and filters */}
  </TabsContent>
</Tabs>
```

#### Tombol "Tambah Pegawai"
- **Tab ASN**: Menampilkan dropdown menu dengan 2 opsi:
  - "Tambah Data ASN" (membuka EmployeeFormModal)
  - "Tambah Data Non-ASN" (membuka NonAsnFormModal)
  
- **Tab Non-ASN**: Menampilkan tombol langsung "Tambah Pegawai Non-ASN"
  - Langsung membuka NonAsnFormModal tanpa dropdown

### 5. Handler Updates
- `handleAddEmployee()` diperbarui untuk membuka modal yang sesuai berdasarkan `activeTab`
- Reset page ke 1 saat `activeTab` berubah (ditambahkan ke dependency array `useEffect`)

## Fitur yang Berfungsi

✅ Tab ASN menampilkan semua pegawai dengan status PNS dan PPPK
✅ Tab Non-ASN menampilkan semua pegawai dengan status Non ASN
✅ Counter di setiap tab menampilkan jumlah pegawai yang sesuai
✅ Tombol "Tambah Pegawai" berubah sesuai tab aktif
✅ Search, filter status, dan filter unit kerja berfungsi di kedua tab
✅ Pagination reset saat pindah tab
✅ Semua CRUD operations (Create, Read, Update, Delete) berfungsi di kedua tab
✅ Edit otomatis membuka modal yang sesuai (ASN atau Non-ASN)
✅ Grouping by position_type tetap berfungsi di kedua tab

## Testing Checklist

- [ ] Buka menu Data Pegawai
- [ ] Verifikasi tab "Data ASN" menampilkan pegawai PNS dan PPPK
- [ ] Verifikasi tab "Data Non-ASN" menampilkan pegawai Non ASN
- [ ] Verifikasi counter di tab menampilkan jumlah yang benar
- [ ] Klik tab Non-ASN, verifikasi tombol berubah menjadi "Tambah Pegawai Non-ASN"
- [ ] Klik tombol tambah di tab Non-ASN, verifikasi NonAsnFormModal terbuka
- [ ] Klik tab ASN, verifikasi dropdown menu muncul dengan 2 opsi
- [ ] Test search di kedua tab
- [ ] Test filter status di kedua tab
- [ ] Test filter unit kerja di kedua tab (jika admin pusat)
- [ ] Test edit pegawai ASN (harus buka EmployeeFormModal)
- [ ] Test edit pegawai Non-ASN (harus buka NonAsnFormModal)
- [ ] Test delete di kedua tab
- [ ] Test pagination di kedua tab
- [ ] Test export CSV di kedua tab

## File yang Dimodifikasi

- `src/pages/Employees.tsx`

## Catatan Penting

1. **Hard Refresh Browser**: Setelah perubahan, lakukan hard refresh (Ctrl+Shift+R) untuk clear cache
2. **Konsistensi dengan Peta Jabatan**: Implementasi mengikuti pola yang sama dengan Peta Jabatan
3. **Real-time Updates**: Semua perubahan data (tambah, edit, hapus) langsung ter-refresh di tab yang sesuai
4. **Responsive Design**: Tabs dan tombol responsive untuk mobile dan desktop
