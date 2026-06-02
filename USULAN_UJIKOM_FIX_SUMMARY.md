# Perbaikan Form Usulan Ujikom - Pangkat/Golongan & Koneksi Peta Jabatan

**Tanggal:** 2 Juni 2026  
**Status:** ✅ SELESAI

---

## 🎯 Masalah yang Diperbaiki

### 1. **Data Pangkat/Golongan Tidak Muncul**
Pada form usulan ujikom, data pegawai yang dipilih tidak menampilkan informasi pangkat/golongan seperti "Pembina (IV/a)", "Penata Muda (III/a)", dll.

### 2. **Jabatan Target Kurang Jelas Koneksinya dengan Peta Jabatan**
User tidak yakin bahwa jabatan target berasal dari data Peta Jabatan yang sudah ada.

---

## 🔧 Solusi yang Diterapkan

### A. Perbaikan Data Pangkat/Golongan

#### 1. **Update Interface TypeScript** (`src/lib/usulan-ujikom/types.ts`)
Menambahkan field `rank_group` ke interface `UsulanUjikomWithDetails`:

```typescript
export interface UsulanUjikomWithDetails extends UsulanUjikom {
  employee: {
    id: string;
    nip: string | null;
    name: string;
    position_name: string | null;
    rank: string | null;
    rank_group: string | null;  // ✅ DITAMBAHKAN
    asn_status: string | null;
    is_active: boolean;
  };
  // ... rest of interface
}
```

**Penjelasan:**
- `rank` = nama pangkat saja (e.g., "Pembina", "Penata Muda")
- `rank_group` = format lengkap pangkat + golongan (e.g., "Pembina (IV/a)", "Penata Muda (III/a)")

#### 2. **Update Query Database** (`src/lib/usulan-ujikom/storage.ts`)

**File: `fetchUsulanById`**
```typescript
.select(`
  *,
  employee:employees!inner(
    id,
    nip,
    name,
    position_name,
    rank,
    rank_group,  // ✅ DITAMBAHKAN
    asn_status,
    is_active
  ),
  // ... rest of query
`)
```

**File: `fetchUsulanList`**
```typescript
.select(`
  *,
  employee:employees!inner(
    id,
    nip,
    name,
    position_name,
    rank,
    rank_group,  // ✅ DITAMBAHKAN
    asn_status,
    is_active
  ),
  // ... rest of query
`)
```

#### 3. **Update EmployeeSelector Component** (`src/components/usulan-ujikom/EmployeeSelector.tsx`)

**a. Update Interface Employee:**
```typescript
interface Employee {
  id: string;
  nip: string | null;
  name: string;
  position_name: string | null;
  rank: string | null;
  rank_group: string | null;  // ✅ DITAMBAHKAN
  asn_status: string | null;
  is_active: boolean;
}
```

**b. Update Query untuk fetch employees:**
```typescript
.select('id, nip, name, position_name, rank, rank_group, asn_status, is_active')
```

**c. Update Tampilan di Dropdown:**
```typescript
<div className="text-xs text-muted-foreground">
  {employee.nip && <span>NIP: {employee.nip}</span>}
  {employee.position_name && (
    <>
      {employee.nip && <span> • </span>}
      <span>{employee.position_name}</span>
    </>
  )}
  {(employee.rank_group || employee.rank) && (
    <>
      {(employee.nip || employee.position_name) && <span> • </span>}
      <span className="font-medium">
        {employee.rank_group || employee.rank}
      </span>
    </>
  )}
</div>
```

**d. Update Tampilan Detail Pegawai yang Dipilih:**
```typescript
<div>
  <span className="text-muted-foreground">Pangkat/Golongan:</span>
  <span className="ml-2 font-medium">
    {selectedEmployee.rank_group || selectedEmployee.rank || '-'}
  </span>
</div>
```

#### 4. **Update UsulanDetail Component** (`src/components/usulan-ujikom/UsulanDetail.tsx`)
```typescript
<div>
  <p className="text-sm text-muted-foreground">Pangkat/Golongan</p>
  <p className="font-medium">
    {usulan.employee.rank_group || usulan.employee.rank || '-'}
  </p>
</div>
```

#### 5. **Update UsulanPusatDetail Component** (`src/components/usulan-ujikom/UsulanPusatDetail.tsx`)
```typescript
<div>
  <p className="text-sm text-muted-foreground">Pangkat/Golongan</p>
  <p className="font-medium">
    {usulan.employee.rank_group || usulan.employee.rank || '-'}
  </p>
</div>
```

---

### B. Perbaikan Koneksi dengan Peta Jabatan

#### 1. **Update PetaJabatanSelector Component** (`src/components/usulan-ujikom/PetaJabatanSelector.tsx`)

**a. Update Placeholder:**
```typescript
<SelectValue placeholder="Pilih jabatan target dari Peta Jabatan" />
```

**b. Update Tampilan Item Dropdown:**
```typescript
<SelectItem key={position.id} value={position.id}>
  <div className="flex flex-col gap-0.5">
    <span className="font-medium">{position.position_name}</span>
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      {position.grade && <span>Grade {position.grade}</span>}
      {position.abk_count > 0 && (
        <>
          {position.grade && <span>•</span>}
          <span>ABK: {position.abk_count}</span>
        </>
      )}
    </div>
  </div>
</SelectItem>
```

**c. Tambahkan Detail Box untuk Jabatan yang Dipilih:**
```typescript
{selectedPosition && (
  <div className="rounded-md border border-blue-200 bg-blue-50 p-3 text-sm">
    <div className="flex items-start gap-2">
      <div className="flex-1">
        <div className="font-medium text-blue-900">{selectedPosition.position_name}</div>
        <div className="text-xs text-blue-700 mt-1">
          Kategori: {selectedPosition.position_category}
          {selectedPosition.grade && ` • Grade ${selectedPosition.grade}`}
          {selectedPosition.abk_count > 0 && ` • ABK: ${selectedPosition.abk_count}`}
        </div>
      </div>
    </div>
  </div>
)}
```

#### 2. **Update UsulanForm Component** (`src/components/usulan-ujikom/UsulanForm.tsx`)

**Update Label dan Deskripsi:**
```typescript
<FormField
  control={form.control}
  name="position_reference_id"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Jabatan Target (dari Peta Jabatan)</FormLabel>
      <FormControl>
        <PetaJabatanSelector
          value={field.value}
          onChange={field.onChange}
          departmentId={form.watch('department_id')}
          disabled={isLoading || !canEdit}
          error={form.formState.errors.position_reference_id?.message}
        />
      </FormControl>
      <p className="text-xs text-muted-foreground">
        Pilih jabatan fungsional target dari Peta Jabatan unit kerja Anda
      </p>
      <FormMessage />
    </FormItem>
  )}
/>
```

---

## 📊 Hasil Perbaikan

### Sebelum:
❌ **Pangkat/Golongan:** Tidak muncul atau hanya tampil "-"  
❌ **Jabatan Target:** User tidak yakin sumber datanya  

### Sesudah:
✅ **Pangkat/Golongan:** Tampil lengkap dengan format "Pembina (IV/a)"  
✅ **Jabatan Target:** Jelas berasal dari Peta Jabatan dengan detail kategori, grade, dan ABK  

---

## 🔍 Tampilan Visual

### 1. **Employee Selector - Dropdown**
```
┌─────────────────────────────────────────────────┐
│ ✓ Ahmad Budiman                                 │
│   NIP: 123456789012345678 • Kepala Seksi •     │
│   Pembina (IV/a)                                │
└─────────────────────────────────────────────────┘
```

### 2. **Employee Selector - Detail Box**
```
┌─────────────────────────────────────────────────┐
│ Nama: Ahmad Budiman                NIP: 123...  │
│ Jabatan Saat Ini: Kepala Seksi                  │
│ Pangkat/Golongan: Pembina (IV/a)                │
└─────────────────────────────────────────────────┘
```

### 3. **Peta Jabatan Selector - Dropdown**
```
┌─────────────────────────────────────────────────┐
│ Analis Kepegawaian Ahli Pertama                │
│ Grade 9 • ABK: 5                                │
└─────────────────────────────────────────────────┘
```

### 4. **Peta Jabatan Selector - Detail Box (Biru)**
```
┌─────────────────────────────────────────────────┐
│ Analis Kepegawaian Ahli Pertama                │
│ Kategori: Jabatan Fungsional • Grade 9 • ABK: 5│
└─────────────────────────────────────────────────┘
```

---

## 📝 Catatan Teknis

### Database Schema
Tabel `employees` memiliki 2 field terkait pangkat:
- `rank` (VARCHAR): Nama pangkat saja (e.g., "Pembina")
- `rank_group` (VARCHAR): Format lengkap (e.g., "Pembina (IV/a)")

Migration yang menambahkan field `rank`:
- File: `supabase/migrations/20260507110000_add_rank_column_to_employees.sql`

### Koneksi Peta Jabatan
Tabel `position_references` sudah benar digunakan oleh `PetaJabatanSelector`:
- Query: `position_category = 'Jabatan Fungsional'`
- Filter: Berdasarkan `department` unit kerja
- Data: `position_name`, `grade`, `abk_count`, dll.

---

## 🧪 Testing Checklist

### Test Pangkat/Golongan:
- [ ] Buka form Usulan Ujikom baru
- [ ] Pilih pegawai dari dropdown
- [ ] Verifikasi muncul format "Nama Pangkat (Golongan)" di dropdown
- [ ] Verifikasi muncul di detail box bawah dropdown
- [ ] Simpan dan lihat di halaman detail usulan

### Test Koneksi Peta Jabatan:
- [ ] Buka form Usulan Ujikom baru
- [ ] Lihat dropdown jabatan target
- [ ] Verifikasi placeholder "Pilih jabatan target dari Peta Jabatan"
- [ ] Pilih jabatan
- [ ] Verifikasi muncul detail box biru dengan kategori, grade, ABK
- [ ] Verifikasi info formasi tersedia/penuh

---

## 🚀 Deployment

### File yang Diubah:
1. `src/lib/usulan-ujikom/types.ts`
2. `src/lib/usulan-ujikom/storage.ts`
3. `src/components/usulan-ujikom/EmployeeSelector.tsx`
4. `src/components/usulan-ujikom/PetaJabatanSelector.tsx`
5. `src/components/usulan-ujikom/UsulanForm.tsx`
6. `src/components/usulan-ujikom/UsulanDetail.tsx`
7. `src/components/usulan-ujikom/UsulanPusatDetail.tsx`

### Tidak Ada Migration Baru:
- ✅ Field `rank` dan `rank_group` sudah ada di database
- ✅ Tabel `position_references` sudah sesuai

### Langkah Deploy:
1. Commit semua perubahan
2. Push ke repository
3. Deploy ke production
4. Test di production sesuai checklist di atas

---

## ✅ Status Akhir

**SELESAI** - Form usulan ujikom sekarang:
1. ✅ Menampilkan pangkat/golongan pegawai dengan format lengkap
2. ✅ Menjelaskan dengan jelas bahwa jabatan target berasal dari Peta Jabatan
3. ✅ Menampilkan detail lengkap jabatan termasuk kategori, grade, dan ABK
4. ✅ Memberikan feedback visual yang lebih baik untuk user

---

**Created by:** Kiro AI Assistant  
**Date:** 2 Juni 2026
