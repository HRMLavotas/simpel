# Implementasi Riwayat Jabatan & Perbaikan Data Pendidikan Non-ASN

## Tanggal: 2 April 2026

## Masalah yang Diperbaiki

### 1. Tidak Ada Tab Riwayat Jabatan di Form Non-ASN
- Form Non-ASN hanya memiliki 2 tab: Data Utama dan Riwayat Pendidikan
- Tidak ada cara untuk mencatat perubahan jabatan pegawai Non-ASN
- Form ASN sudah memiliki fitur lengkap dengan berbagai tab riwayat

### 2. Data Pendidikan Non-ASN Tidak Dimuat Saat Edit
- Ketika edit data Non-ASN yang diimport, data pendidikan tidak muncul di form
- Penyebab: `handleEditEmployee` tidak mengambil data education untuk Non-ASN
- Data pendidikan ada di database tapi tidak ditampilkan di form edit

### 3. Bug Field Name di Import Non-ASN
- Import menggunakan field `institution` yang tidak ada di database
- Seharusnya menggunakan `institution_name` sesuai schema

## Solusi yang Diimplementasikan

### 1. Tambah Tab Riwayat Jabatan di Form Non-ASN

**File: `src/components/employees/NonAsnFormModal.tsx`**

#### Perubahan Interface
```typescript
interface NonAsnFormModalProps {
  // ... existing props
  initialPositionHistory?: HistoryEntry[];  // ✅ BARU
}
```

#### Import Component Baru
```typescript
import { EmployeeHistoryForm, type HistoryEntry, POSITION_HISTORY_FIELDS } from './EmployeeHistoryForm';
```

#### State Management
```typescript
const [activeTab, setActiveTab] = useState<'main' | 'education' | 'history'>('main');  // ✅ Tambah 'history'
const [positionHistoryEntries, setPositionHistoryEntries] = useState<HistoryEntry[]>([]);  // ✅ BARU
```

#### UI - Tabs
```typescript
<TabsList className="grid w-full grid-cols-3">  {/* ✅ Ubah dari grid-cols-2 */}
  <TabsTrigger value="main">Data Utama</TabsTrigger>
  <TabsTrigger value="education">Riwayat Pendidikan</TabsTrigger>
  <TabsTrigger value="history">Riwayat Jabatan</TabsTrigger>  {/* ✅ BARU */}
</TabsList>

<TabsContent value="history" className="space-y-6">  {/* ✅ BARU */}
  <EmployeeHistoryForm
    title="Riwayat Jabatan"
    fields={POSITION_HISTORY_FIELDS}
    entries={positionHistoryEntries}
    onChange={setPositionHistoryEntries}
  />
  <p className="text-xs text-muted-foreground italic">
    💡 Catat perubahan jabatan untuk tracking karir pegawai Non-ASN
  </p>
</TabsContent>
```

#### Logic Penyimpanan Position History
```typescript
// Saat Edit
if (positionHistoryEntries.length > 0) {
  // Delete existing
  await supabase
    .from('position_history')
    .delete()
    .eq('employee_id', editData.id);

  // Insert new
  const positionData = positionHistoryEntries.map(entry => ({
    employee_id: editData.id,
    tanggal: entry.tanggal || null,
    jabatan_lama: entry.jabatan_lama || null,
    jabatan_baru: entry.jabatan_baru || null,
    unit_kerja: entry.unit_kerja || null,
    nomor_sk: entry.nomor_sk || null,
    keterangan: entry.keterangan || null,
  }));

  await supabase.from('position_history').insert(positionData);
}

// Saat Tambah Baru
if (newEmployee && positionHistoryEntries.length > 0) {
  const positionData = positionHistoryEntries.map(entry => ({
    employee_id: newEmployee.id,
    // ... same mapping
  }));
  
  await supabase.from('position_history').insert(positionData);
}
```

### 2. Perbaiki Loading Data Pendidikan Saat Edit

**File: `src/pages/Employees.tsx`**

#### Sebelum (❌ Bug)
```typescript
const handleEditEmployee = async (employee: Employee) => {
  setSelectedEmployee(employee);
  
  if (employee.asn_status === 'Non ASN') {
    setNonAsnModalOpen(true);  // ❌ Langsung buka modal tanpa load data
    return;
  }
  
  // Load data untuk ASN...
}
```

#### Sesudah (✅ Fixed)
```typescript
const handleEditEmployee = async (employee: Employee) => {
  setSelectedEmployee(employee);
  
  if (employee.asn_status === 'Non ASN') {
    // ✅ Load education dan position history untuk Non-ASN
    const [eduRes, posRes] = await Promise.all([
      supabase.from('education_history').select('*').eq('employee_id', employee.id).order('graduation_year', { ascending: true }),
      supabase.from('position_history').select('*').eq('employee_id', employee.id).order('tanggal', { ascending: true, nullsFirst: false }),
    ]);

    // ✅ Set data ke state
    setSelectedEducation(
      (eduRes.data || []).map((d) => ({
        id: d.id, 
        level: d.level || '', 
        institution_name: d.institution_name || '',
        major: d.major || '', 
        graduation_year: d.graduation_year?.toString() || '',
        front_title: d.front_title || '', 
        back_title: d.back_title || '',
      }))
    );
    setSelectedPositionHistory(mapHistoryRows(posRes.data || [], ['tanggal', 'jabatan_lama', 'jabatan_baru', 'unit_kerja', 'nomor_sk', 'keterangan']));
    
    setNonAsnModalOpen(true);
    return;
  }
  
  // Load data untuk ASN...
}
```

#### Pass Data ke Modal
```typescript
<NonAsnFormModal
  open={nonAsnModalOpen}
  onOpenChange={setNonAsnModalOpen}
  onSuccess={fetchEmployees}
  editData={selectedEmployee?.asn_status === 'Non ASN' ? selectedEmployee : undefined}
  userDepartment={profile?.department}
  isAdminPusat={isAdminPusat}
  initialEducation={selectedEducation}  // ✅ Sudah ada
  initialPositionHistory={selectedPositionHistory}  // ✅ BARU
/>
```

### 3. Perbaiki Bug Field Name di Import

**File: `src/pages/ImportNonAsn.tsx`**

#### Sebelum (❌ Bug)
```typescript
.insert([{
  employee_id: newEmployee.id,
  level: item.education,
  major: item.education_major || null,
  institution: null,  // ❌ Field tidak ada di database
  graduation_year: null,
}]);
```

#### Sesudah (✅ Fixed)
```typescript
.insert([{
  employee_id: newEmployee.id,
  level: item.education,
  major: item.education_major || null,
  institution_name: null,  // ✅ Sesuai schema database
  graduation_year: null,
}]);
```

## Database Schema yang Digunakan

### education_history
```sql
CREATE TABLE public.education_history (
  id uuid PRIMARY KEY,
  employee_id uuid REFERENCES employees(id),
  level varchar NOT NULL,
  institution_name varchar,  -- ✅ Field yang benar
  major varchar,
  graduation_year integer,
  front_title varchar,
  back_title varchar,
  created_at timestamptz,
  updated_at timestamptz
);
```

### position_history
```sql
CREATE TABLE public.position_history (
  id uuid PRIMARY KEY,
  employee_id uuid REFERENCES employees(id),
  tanggal date,
  jabatan_lama varchar,
  jabatan_baru varchar,
  unit_kerja varchar,
  nomor_sk varchar,
  keterangan text,
  created_at timestamptz,
  updated_at timestamptz
);
```

## Fitur yang Tersedia di Tab Riwayat Jabatan

### Field yang Dapat Diisi
1. **Tanggal** - Tanggal perubahan jabatan
2. **Jabatan Baru** - Jabatan yang baru
3. **Unit Kerja** - Unit kerja tujuan (dropdown)
4. **Nomor SK** - Nomor Surat Keputusan
5. **Keterangan** - Catatan tambahan

### Fitur UI
- ✅ Collapsible form (dapat diperluas/diperkecil)
- ✅ Summary info saat collapsed
- ✅ Auto-sort berdasarkan tanggal (terbaru di atas)
- ✅ Tambah/hapus entry dinamis
- ✅ Validasi otomatis

## Testing yang Perlu Dilakukan

### 1. Test Form Non-ASN Baru
- [ ] Buka form tambah Non-ASN baru
- [ ] Pastikan ada 3 tabs: Data Utama, Riwayat Pendidikan, Riwayat Jabatan
- [ ] Isi data di semua tabs
- [ ] Simpan dan verifikasi data tersimpan

### 2. Test Edit Non-ASN dengan Data Pendidikan
- [ ] Import data Non-ASN dengan pendidikan
- [ ] Edit data tersebut
- [ ] Pastikan data pendidikan muncul di tab Riwayat Pendidikan
- [ ] Ubah data pendidikan
- [ ] Simpan dan verifikasi perubahan

### 3. Test Riwayat Jabatan
- [ ] Edit data Non-ASN
- [ ] Buka tab Riwayat Jabatan
- [ ] Tambah beberapa entry riwayat jabatan
- [ ] Simpan dan verifikasi data tersimpan
- [ ] Edit lagi dan pastikan data riwayat jabatan muncul

### 4. Test Import Non-ASN
- [ ] Import file Excel dengan data pendidikan
- [ ] Verifikasi data pendidikan tersimpan dengan benar
- [ ] Edit data yang diimport
- [ ] Pastikan data pendidikan muncul di form edit

## Manfaat Implementasi

### Untuk User
1. **Tracking Karir Non-ASN** - Dapat mencatat perubahan jabatan pegawai Non-ASN
2. **Data Lengkap** - Data pendidikan yang diimport sekarang muncul saat edit
3. **Konsistensi** - Form Non-ASN sekarang mirip dengan form ASN
4. **Audit Trail** - Riwayat perubahan jabatan tercatat dengan baik

### Untuk Developer
1. **Code Consistency** - Menggunakan komponen yang sama (EmployeeHistoryForm)
2. **Reusability** - Tidak perlu buat komponen baru untuk history
3. **Maintainability** - Lebih mudah maintain karena struktur mirip dengan ASN
4. **Bug Fixed** - Field name yang salah sudah diperbaiki

## File yang Diubah

1. ✅ `src/components/employees/NonAsnFormModal.tsx` - Tambah tab riwayat jabatan
2. ✅ `src/pages/Employees.tsx` - Load data education & position history untuk Non-ASN
3. ✅ `src/pages/ImportNonAsn.tsx` - Perbaiki field name `institution_name`

## Catatan Penting

### Backward Compatibility
- ✅ Data lama tetap bisa dibuka dan diedit
- ✅ Tidak ada breaking changes pada database
- ✅ Form tetap berfungsi tanpa data riwayat jabatan

### Data Validation
- ✅ Semua field riwayat jabatan optional
- ✅ Tidak ada validasi yang memblokir penyimpanan
- ✅ Error handling untuk gagal simpan riwayat

### Performance
- ✅ Load data education & position history hanya saat edit Non-ASN
- ✅ Tidak impact performance untuk ASN
- ✅ Parallel loading dengan Promise.all

## Kesimpulan

Implementasi ini berhasil:
1. ✅ Menambahkan tab Riwayat Jabatan di form Non-ASN
2. ✅ Memperbaiki bug data pendidikan tidak muncul saat edit
3. ✅ Memperbaiki bug field name di import
4. ✅ Menjaga konsistensi dengan form ASN
5. ✅ Tidak ada breaking changes
6. ✅ Semua diagnostics passed

Form Non-ASN sekarang memiliki fitur yang lebih lengkap dan konsisten dengan form ASN!
