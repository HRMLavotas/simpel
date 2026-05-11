# Summary: Tambah Field Satuan Kerja Penugasan di Form Non-ASN

## Perubahan

### File: `src/components/employees/NonAsnFormModal.tsx`

#### 1. Import Function
```typescript
import { getSatpelsByPembina } from '@/lib/constants';
```

#### 2. Interface Update
```typescript
interface NonAsnFormData {
  // ... existing fields
  satuan_kerja_penugasan: string;  // NEW: Satpel/Workshop assignment
  // ... other fields
}

interface NonAsnEmployee {
  // ... existing fields
  satuan_kerja_penugasan?: string;  // NEW
  // ... other fields
}
```

#### 3. State & Logic
```typescript
// Check if user is admin unit pembina (has supervised Satpel/Workshop)
const supervisedSatpels = userDepartment ? getSatpelsByPembina(userDepartment) : [];
const hasSupervisedUnits = supervisedSatpels.length > 0;
```

#### 4. Form Field (UI)
Field "Satuan Kerja Penugasan" ditambahkan setelah field "Type Non ASN":
- **Visibility**: Hanya muncul jika `hasSupervisedUnits = true` (admin unit pembina)
- **Options**: 
  - "Tidak ada (bertugas di unit pembina)" (value: empty string)
  - List Satpel/Workshop yang dibina
- **Optional**: Field ini tidak wajib diisi

```typescript
{hasSupervisedUnits && (
  <div className="space-y-2">
    <Label htmlFor="satuan_kerja_penugasan">Satuan Kerja Penugasan</Label>
    <Select
      value={formData.satuan_kerja_penugasan}
      onValueChange={(value) => setFormData({ ...formData, satuan_kerja_penugasan: value })}
    >
      <SelectTrigger id="satuan_kerja_penugasan">
        <SelectValue placeholder="Pilih Satpel/Workshop (opsional)" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="">Tidak ada (bertugas di unit pembina)</SelectItem>
        {supervisedSatpels.map((satpel) => (
          <SelectItem key={satpel} value={satpel}>{satpel}</SelectItem>
        ))}
      </SelectContent>
    </Select>
    <p className="text-xs text-muted-foreground">
      💡 Pilih Satpel/Workshop jika pegawai ditugaskan di unit binaan
    </p>
  </div>
)}
```

#### 5. Data Save
```typescript
const dataToSave = {
  // ... existing fields
  satuan_kerja_penugasan: formData.satuan_kerja_penugasan || null,
  // ... other fields
};
```

## Behavior

### Untuk Admin Unit Pembina (contoh: BBPVP Makassar)
1. **Field muncul** di form Non-ASN
2. **Options**:
   - Tidak ada (bertugas di unit pembina)
   - Satuan Pelayanan Majene
   - Satuan Pelayanan Mamuju
   - Satuan Pelayanan Palu
   - Workshop Gorontalo
   - Satuan Pelayanan Morowali
   - Satuan Pelayanan Morowali Utara

### Untuk Admin Unit Biasa (tidak punya Satpel binaan)
1. **Field tidak muncul** di form
2. `satuan_kerja_penugasan` akan tetap `NULL` di database

### Untuk Admin Pusat
1. **Field tidak muncul** di form (karena mereka bisa pilih unit kerja mana saja)
2. Jika mereka pilih unit pembina, field tetap tidak muncul (karena `userDepartment` bukan unit pembina mereka)

## Use Cases

### Use Case 1: Tambah Non-ASN Baru di Unit Pembina
1. Admin BBPVP Makassar login
2. Klik "Tambah Non-ASN"
3. Isi data pegawai
4. **Pilih "Satuan Pelayanan Majene"** di field "Satuan Kerja Penugasan"
5. Simpan
6. **Result**: 
   - `department = "BBPVP Makassar"`
   - `satuan_kerja_penugasan = "Satuan Pelayanan Majene"`

### Use Case 2: Edit Non-ASN Existing
1. Admin BBPVP Makassar login
2. Edit pegawai Non-ASN yang sudah ada
3. Field "Satuan Kerja Penugasan" menampilkan value saat ini
4. Bisa diubah ke Satpel lain atau dikosongkan
5. Simpan
6. **Result**: Data ter-update sesuai pilihan

### Use Case 3: Non-ASN Tanpa Penugasan
1. Admin BBPVP Makassar login
2. Tambah Non-ASN baru
3. **Pilih "Tidak ada (bertugas di unit pembina)"** atau biarkan kosong
4. Simpan
5. **Result**:
   - `department = "BBPVP Makassar"`
   - `satuan_kerja_penugasan = NULL`
   - Pegawai akan muncul di Peta Jabatan BBPVP Makassar (tidak di Satpel)

## Integration dengan Peta Jabatan

### Filter Logic
Ketika admin unit pembina memilih Satpel di Peta Jabatan:
1. Query fetch pegawai dari unit pembina (`department = "BBPVP Makassar"`)
2. Filter client-side: hanya tampilkan pegawai yang `satuan_kerja_penugasan = "Satuan Pelayanan Majene"`
3. Pegawai dengan `satuan_kerja_penugasan = NULL` **tidak muncul** di Satpel (hanya muncul di unit pembina)

### Consistency
- ✅ ASN dan Non-ASN menggunakan field yang sama (`satuan_kerja_penugasan`)
- ✅ Logika filter sama untuk ASN dan Non-ASN
- ✅ Data structure konsisten

## Testing Checklist

### Test 1: Field Visibility
- [ ] Login sebagai Admin Unit Pembina (BBPVP Makassar)
- [ ] Buka form tambah Non-ASN
- [ ] **Verify**: Field "Satuan Kerja Penugasan" muncul
- [ ] **Verify**: Dropdown berisi list Satpel binaan

### Test 2: Add Non-ASN dengan Penugasan
- [ ] Isi data pegawai Non-ASN baru
- [ ] Pilih "Satuan Pelayanan Majene" di field penugasan
- [ ] Simpan
- [ ] **Verify**: Data tersimpan dengan `satuan_kerja_penugasan = "Satuan Pelayanan Majene"`
- [ ] Buka Peta Jabatan → Pilih "Satuan Pelayanan Majene"
- [ ] **Verify**: Pegawai Non-ASN muncul di tab Non-ASN

### Test 3: Edit Non-ASN Existing
- [ ] Edit pegawai Non-ASN yang sudah ada
- [ ] **Verify**: Field "Satuan Kerja Penugasan" menampilkan value saat ini
- [ ] Ubah ke Satpel lain
- [ ] Simpan
- [ ] **Verify**: Data ter-update di database
- [ ] **Verify**: Pegawai muncul di Satpel yang baru

### Test 4: Non-ASN Tanpa Penugasan
- [ ] Tambah Non-ASN baru
- [ ] Pilih "Tidak ada (bertugas di unit pembina)"
- [ ] Simpan
- [ ] **Verify**: `satuan_kerja_penugasan = NULL`
- [ ] Buka Peta Jabatan → Pilih unit pembina (BBPVP Makassar)
- [ ] **Verify**: Pegawai muncul di unit pembina
- [ ] Pilih Satpel mana saja
- [ ] **Verify**: Pegawai TIDAK muncul di Satpel

### Test 5: Admin Unit Biasa
- [ ] Login sebagai Admin Unit biasa (tidak punya Satpel binaan)
- [ ] Buka form tambah Non-ASN
- [ ] **Verify**: Field "Satuan Kerja Penugasan" TIDAK muncul

## Status
✅ **Code Updated**
✅ **Ready for Testing**

## Next Steps
1. Build dan test di browser
2. Verify field muncul untuk admin unit pembina
3. Test add/edit Non-ASN dengan penugasan
4. Verify data tersimpan dengan benar
5. Verify integrasi dengan Peta Jabatan
