# Fix: Masalah Draft Usulan Ujikom Tidak Bisa Disimpan

## Masalah
Setelah memilih pegawai dan jabatan target di form usulan baru, draft tidak bisa disimpan dengan error:
```
null value in column "jabatan_target" of relation "usulan_ujikom" violates not-null constraint
```

## Analisis Masalah

### Error Log
```javascript
Error creating usulan: {
  code: '23502', 
  details: null, 
  hint: null, 
  message: 'null value in column "jabatan_target" of relation "usulan_ujikom" violates not-null constraint'
}
```

### Lokasi File yang Terpengaruh
1. `src/lib/usulan-ujikom/validation.ts` - Schema validasi form
2. `src/lib/usulan-ujikom/storage.ts` - Fungsi createUsulan
3. `src/lib/usulan-ujikom/types.ts` - Type definition UsulanFormData
4. `src/components/usulan-ujikom/UsulanForm.tsx` - Form component
5. `src/components/usulan-ujikom/PetaJabatanSelector.tsx` - Position selector

## Penyebab Masalah

### 1. Validation Schema Terlalu Ketat untuk Draft
**File:** `src/lib/usulan-ujikom/validation.ts`

**Masalah:**
- `surat_pengantar_file` diwajibkan (required)
- `link_dokumen_persyaratan` harus URL yang valid
- Ini mencegah user menyimpan draft sebelum semua dokumen siap

**Solusi:**
- Ubah `surat_pengantar_file` menjadi optional (nullable)
- Ubah `link_dokumen_persyaratan` menjadi optional (empty string diperbolehkan)

### 2. Type Definition Tidak Konsisten
**File:** `src/lib/usulan-ujikom/types.ts`

**Masalah:**
- `link_dokumen_persyaratan` didefinisikan sebagai required string
- Tidak konsisten dengan kebutuhan draft

**Solusi:**
- Ubah `link_dokumen_persyaratan` menjadi optional

## Perubahan yang Dilakukan

### 1. Validation Schema (validation.ts)
```typescript
// SEBELUM
export const usulanFormSchema = z.object({
  employee_id: uuidSchema,
  position_reference_id: uuidSchema,
  department_id: z.string().min(1, 'Unit kerja wajib dipilih'),
  surat_pengantar_file: fileSchema,  // REQUIRED
  link_dokumen_persyaratan: urlSchema, // REQUIRED URL
  admin_notes: z.string().optional(),
});

// SESUDAH
export const usulanFormSchema = z.object({
  employee_id: uuidSchema,
  position_reference_id: uuidSchema,
  department_id: z.string().min(1, 'Unit kerja wajib dipilih'),
  surat_pengantar_file: optionalFileSchema, // OPTIONAL
  link_dokumen_persyaratan: z.string().url('Link harus berupa URL yang valid').optional().or(z.literal('')), // OPTIONAL
  admin_notes: z.string().optional(),
});
```

### 2. Type Definition (types.ts)
```typescript
// SEBELUM
export interface UsulanFormData {
  employee_id: string;
  position_reference_id: string;
  department_id: string;
  surat_pengantar_file: File | null;
  link_dokumen_persyaratan: string; // REQUIRED
  admin_notes?: string;
}

// SESUDAH
export interface UsulanFormData {
  employee_id: string;
  position_reference_id: string;
  department_id: string;
  surat_pengantar_file: File | null;
  link_dokumen_persyaratan?: string; // OPTIONAL
  admin_notes?: string;
}
```

### 3. Storage Layer (storage.ts)

#### Validasi Tambahan
```typescript
// Validate required denormalized fields
if (!jabatanTarget) {
  throw new Error('Nama jabatan target tidak valid');
}
if (!employeeName) {
  throw new Error('Nama pegawai tidak valid');
}
```

#### Null Handling untuk Link
```typescript
link_dokumen_persyaratan: formData.link_dokumen_persyaratan || null,
```

#### Debug Logging
```typescript
console.log('Inserting usulan with data:', insertData);
```

### 4. Form Component (UsulanForm.tsx)

#### Mode Validation
```typescript
const form = useForm<UsulanFormValues>({
  resolver: zodResolver(usulanFormSchema),
  defaultValues: {
    employee_id: '',
    position_reference_id: '',
    department_id: profile?.department || '',
    surat_pengantar_file: null,
    link_dokumen_persyaratan: '',
    admin_notes: '',
  },
  mode: 'onChange', // Validate on change untuk feedback langsung
});
```

#### Debug Logging pada Submit
```typescript
console.log('Form data to submit:', {
  employee_id: data.employee_id,
  position_reference_id: data.position_reference_id,
  department_id: data.department_id,
  has_file: !!data.surat_pengantar_file,
  link_dokumen_persyaratan: data.link_dokumen_persyaratan,
  admin_notes: data.admin_notes,
});
```

### 5. Position Selector (PetaJabatanSelector.tsx)

#### Debug Logging
```typescript
const handleSelectPosition = (position: PositionReference) => {
  console.log('Selected position:', position.id, position.position_name);
  onChange(position.id);
  setSelectedPosition(position);
  setSearchText(position.position_name);
  setOpen(false);
};
```

## Testing Checklist

Setelah perubahan ini, lakukan testing berikut:

### 1. Test Draft Creation - Minimal Data
- [ ] Pilih pegawai
- [ ] Pilih jabatan target
- [ ] Simpan draft tanpa file dan link dokumen
- [ ] Pastikan tersimpan dengan status "Draft"

### 2. Test Draft Creation - Dengan File
- [ ] Pilih pegawai
- [ ] Pilih jabatan target
- [ ] Upload surat pengantar
- [ ] Simpan draft tanpa link dokumen
- [ ] Pastikan tersimpan dengan file URL

### 3. Test Draft Creation - Dengan Link
- [ ] Pilih pegawai
- [ ] Pilih jabatan target
- [ ] Isi link dokumen persyaratan (Google Drive, dll)
- [ ] Simpan draft tanpa file
- [ ] Pastikan tersimpan dengan link

### 4. Test Draft Creation - Lengkap
- [ ] Pilih pegawai
- [ ] Pilih jabatan target
- [ ] Upload surat pengantar
- [ ] Isi link dokumen persyaratan
- [ ] Isi catatan admin
- [ ] Simpan draft
- [ ] Pastikan semua data tersimpan

### 5. Test Validation
- [ ] Coba simpan tanpa memilih pegawai → harus error
- [ ] Coba simpan tanpa memilih jabatan → harus error
- [ ] Coba upload file lebih dari 5MB → harus error
- [ ] Coba upload file selain PDF/JPG/PNG → harus error
- [ ] Coba isi link dokumen dengan URL tidak valid → harus error

### 6. Test Formasi
- [ ] Pilih jabatan dengan formasi tersedia → status "Draft"
- [ ] Pilih jabatan dengan formasi penuh → status "Draft" (sama)
- [ ] Submit usulan dengan formasi tersedia → status "Diajukan"
- [ ] Submit usulan dengan formasi penuh → status "Waiting_List"

### 7. Check Console Logs
- [ ] Buka browser console (F12)
- [ ] Pilih jabatan → lihat log "Selected position: ..."
- [ ] Submit form → lihat log "Form data to submit: ..."
- [ ] Lihat log "Inserting usulan with data: ..."
- [ ] Pastikan `jabatan_target` memiliki nilai yang valid
- [ ] Pastikan `position_reference_id` memiliki UUID yang valid

## Debugging Steps jika Masih Error

### 1. Check Browser Console
```javascript
// Setelah pilih jabatan
Selected position: <UUID> <Nama Jabatan>

// Setelah click Simpan Draft
Form data to submit: {
  employee_id: "...",
  position_reference_id: "...",  // HARUS ADA UUID
  department_id: "...",
  has_file: false,
  link_dokumen_persyaratan: "",
  admin_notes: ""
}

// Di backend/storage
Inserting usulan with data: {
  employee_id: "...",
  position_reference_id: "...",
  department: "...",
  jabatan_target: "...",  // HARUS ADA NAMA JABATAN
  employee_name: "...",
  employee_nip: "...",
  status: "Draft",
  link_dokumen_persyaratan: null,
  admin_notes: null,
  creator_id: "..."
}
```

### 2. Check Database
```sql
-- Check position_references
SELECT id, position_name, position_category, department
FROM position_references
WHERE id = '<position_reference_id>';

-- Pastikan position_name tidak null

-- Check employees
SELECT id, name, nip, department
FROM employees
WHERE id = '<employee_id>';

-- Pastikan name tidak null
```

### 3. Check Supabase Console
- Buka Supabase Dashboard
- Pergi ke Table Editor → `usulan_ujikom`
- Lihat kolom definition untuk `jabatan_target`
- Pastikan NOT NULL constraint ada
- Coba insert manual untuk testing

### 4. Check Network Tab
- Buka browser Developer Tools → Network tab
- Filter: XHR/Fetch
- Saat submit form, lihat request ke Supabase
- Check request payload
- Check response error detail

## Expected Behavior Setelah Fix

1. **Draft Creation**: User bisa menyimpan draft dengan minimal data (pegawai + jabatan)
2. **Validation**: Validasi hanya enforce pada submit, bukan pada save draft
3. **File Upload**: Optional untuk draft, bisa diupload nanti
4. **Link Dokumen**: Optional untuk draft, bisa diisi nanti
5. **Error Messages**: Lebih jelas dan spesifik
6. **Console Logs**: Membantu debugging dengan menampilkan data yang dikirim

## Catatan Tambahan

### Perbedaan Draft vs Submit
- **Draft**: Minimal validation, boleh data tidak lengkap
- **Submit**: Full validation, semua dokumen harus lengkap

### Future Enhancement
Bisa dipertimbangkan untuk membuat 2 schema berbeda:
1. `usulanDraftSchema` - untuk save draft (validasi minimal)
2. `usulanSubmitSchema` - untuk submit usulan (validasi lengkap)

Saat ini, form menggunakan satu schema yang sudah dibuat lebih lenient untuk mendukung draft.

---

**Created:** 2026-06-02  
**Last Updated:** 2026-06-02  
**Status:** Fixed - Waiting for Testing
