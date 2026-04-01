# ✅ Import ASN & Non-ASN - Menggunakan Departments dari Database

## Perubahan yang Dilakukan

Kedua fitur import (ASN dan Non-ASN) sekarang mengambil daftar unit kerja dari tabel `departments` di database, bukan dari constants yang hardcoded.

## Files yang Diupdate

### 1. src/lib/constants.ts
**Ditambahkan:**
- Unit kerja baru: Satpel (Satuan Pelayanan) dan Workshop
- Total 44 unit kerja sekarang tersedia di constants
- DEPARTMENT_ALIASES diperluas untuk mapping nama panjang ke singkatan

**Unit Kerja Baru:**
```typescript
'Satpel Sawahlunto',
'Satpel Sofifi',
'Satpel Pekanbaru',
'Satpel Lubuklinggau',
'Satpel Lampung',
'Satpel Bengkulu',
'Satpel Mamuju',
'Satpel Majene',
'Satpel Palu',
'Satpel Bantul',
'Satpel Kupang',
'Satpel Jambi',
'Satpel Jayapura',
'Workshop Prabumulih',
'Workshop Batam',
'Workshop Gorontalo',
```

**Aliases Baru:**
```typescript
'Direktorat Bina Penyelenggaraan Latvogan': 'Direktorat Bina Lavogan',
'Satuan Pelayanan Sawahlunto': 'Satpel Sawahlunto',
'Satuan Pelayanan Sofifi': 'Satpel Sofifi',
// ... dan seterusnya
```

### 2. src/pages/ImportNonAsn.tsx
**Perubahan:**
- ✅ Added `useEffect` import
- ✅ Added `availableDepartments` state
- ✅ Fetch departments from database on component mount
- ✅ Updated `parseExcelFile` to accept `deptList` parameter
- ✅ Updated department matching logic to use `deptList` from database
- ✅ Updated validation to use `deptList`
- ✅ Changed `department` type from `Department` to `string` in `ParsedNonAsn` interface
- ✅ Fallback to constants if database fetch fails

**Matching Strategy:**
1. Check DEPARTMENT_ALIASES first (exact mapping)
2. Try exact match with database departments
3. Try partial match (contains)
4. Try keyword match (2+ significant words)

### 3. src/pages/Import.tsx
**Perubahan:**
- ✅ Added `useEffect` import
- ✅ Added `availableDepartments` state
- ✅ Fetch departments from database on component mount
- ✅ Updated position validation to use `availableDepartments`
- ✅ Updated employee validation to use `availableDepartments`
- ✅ Updated department dropdown to use `availableDepartments`
- ✅ Updated template download to use `availableDepartments`
- ✅ Fallback to constants if database fetch fails

## Cara Kerja

### 1. Component Mount
```typescript
useEffect(() => {
  const fetchDepartments = async () => {
    const { data } = await supabase
      .from('departments')
      .select('name')
      .order('name');
    
    const deptNames = (data || []).map(d => d.name);
    setAvailableDepartments(deptNames);
  };
  
  fetchDepartments();
}, []);
```

### 2. Parsing Excel (Non-ASN)
```typescript
const parseExcelFile = (file: File, deptList: string[]) => {
  // ... parsing logic
  
  // Match department using deptList from database
  let matchedDept = deptList.find(d => 
    d.toLowerCase() === department.toLowerCase()
  );
  
  // ... fallback matching strategies
};
```

### 3. Validation
```typescript
// Check if department exists in database
if (!availableDepartments.includes(employee.department)) {
  employee.error = 'Unit kerja tidak valid';
}
```

### 4. Dropdown
```typescript
<SelectContent>
  {availableDepartments.filter(d => d !== 'Pusat').map(d => (
    <SelectItem key={d} value={d}>{d}</SelectItem>
  ))}
</SelectContent>
```

## Keuntungan

### ✅ Dynamic Department List
- Unit kerja tidak perlu hardcoded di constants
- Admin dapat menambah/edit unit kerja di menu Departments
- Perubahan langsung terlihat di import tanpa perlu update code

### ✅ Konsisten dengan Database
- Import menggunakan data yang sama dengan tabel departments
- Tidak ada mismatch antara constants dan database
- Validasi akurat berdasarkan data aktual

### ✅ Fallback Mechanism
- Jika fetch database gagal, fallback ke constants
- Aplikasi tetap berfungsi meskipun ada masalah koneksi
- Error handling yang baik

### ✅ Backward Compatible
- Constants masih ada untuk fallback
- DEPARTMENT_ALIASES tetap digunakan untuk mapping
- Tidak breaking existing functionality

## Testing Checklist

### Import Non-ASN
- [ ] Upload Excel dengan unit kerja dari database
- [ ] Verifikasi unit kerja terdeteksi dengan benar
- [ ] Verifikasi error jika unit kerja tidak ada di database
- [ ] Verifikasi distribusi unit kerja di preview
- [ ] Verifikasi import berhasil ke unit kerja yang benar

### Import ASN
- [ ] Upload Excel dengan unit kerja dari database
- [ ] Verifikasi dropdown department menampilkan semua unit kerja dari database
- [ ] Verifikasi validasi unit kerja menggunakan data database
- [ ] Verifikasi template download berisi unit kerja dari database
- [ ] Verifikasi import berhasil

### Edge Cases
- [ ] Database fetch gagal → fallback ke constants
- [ ] Unit kerja baru ditambah di menu Departments → langsung tersedia di import
- [ ] Unit kerja dihapus di menu Departments → tidak tersedia di import
- [ ] Excel dengan unit kerja lama (sebelum update) → tetap bisa diimport jika ada di database

## Troubleshooting

### Error: "Unit kerja tidak ditemukan"
**Penyebab:** Unit kerja di Excel tidak ada di tabel departments

**Solusi:**
1. Buka menu "Departments"
2. Tambahkan unit kerja yang hilang
3. Refresh halaman import (Ctrl+Shift+R)
4. Upload ulang Excel

### Dropdown Department Kosong
**Penyebab:** Fetch database gagal dan fallback juga gagal

**Solusi:**
1. Check console browser (F12) untuk error
2. Verifikasi koneksi database
3. Refresh halaman

### Unit Kerja Tidak Muncul di Dropdown
**Penyebab:** Unit kerja belum ditambahkan di tabel departments

**Solusi:**
1. Buka menu "Departments"
2. Klik "Tambah Unit Kerja"
3. Isi nama unit kerja
4. Simpan
5. Refresh halaman import

## Migration Notes

Jika Anda memiliki unit kerja di Excel yang tidak ada di database:

1. **Identifikasi unit kerja yang hilang** dari error log
2. **Tambahkan ke tabel departments** via menu Departments
3. **Re-import Excel** setelah unit kerja ditambahkan

Atau:

1. **Update Excel** untuk menggunakan nama unit kerja yang sudah ada di database
2. **Gunakan DEPARTMENT_ALIASES** untuk mapping otomatis

---

**Status**: ✅ Implementasi Complete - Ready for Testing

Silakan hard refresh browser (Ctrl+Shift+R) dan test import dengan data Anda!
