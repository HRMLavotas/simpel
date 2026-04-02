# Peningkatan Form Tambah/Edit Pegawai Non ASN

## Tanggal: 2 April 2026

## Masalah yang Ditemukan

Form tambah dan edit pegawai Non ASN tidak memiliki field untuk mengelola data pendidikan, padahal:
1. Template import Non ASN sudah memiliki kolom Pendidikan dan Jurusan
2. Form pegawai ASN sudah memiliki tab Riwayat Pendidikan yang lengkap
3. Dashboard menampilkan data pendidikan dari tabel `education_history`
4. Tanpa field pendidikan di form, user tidak bisa menambah/edit data pendidikan secara manual

## Solusi yang Diterapkan

### 1. Menambahkan Komponen Pendidikan ke Form Non ASN

**File: `src/components/employees/NonAsnFormModal.tsx`**

#### Perubahan Import:
```typescript
// Menambahkan import komponen yang diperlukan
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { EducationHistoryForm, type EducationEntry } from './EducationHistoryForm';
import { logger } from '@/lib/logger';
```

#### Perubahan Interface:
```typescript
interface NonAsnFormModalProps {
  // ... props lainnya
  initialEducation?: EducationEntry[];  // ✅ Tambahan baru
}
```

#### Perubahan State:
```typescript
const [activeTab, setActiveTab] = useState<'main' | 'education'>('main');
const [educationEntries, setEducationEntries] = useState<EducationEntry[]>([]);
```

#### Perubahan useEffect:
```typescript
useEffect(() => {
  if (editData) {
    // ... set form data
    setEducationEntries(initialEducation || []); // ✅ Load education data saat edit
  } else {
    // ... reset form data
    setEducationEntries([]); // ✅ Reset education data saat tambah baru
  }
  
  if (!open) {
    resetNIKValidation();
    setActiveTab('main'); // ✅ Reset tab ke main saat modal ditutup
  }
}, [editData, userDepartment, open, resetNIKValidation, initialEducation]);
```

#### Perubahan handleSubmit:

**Untuk Mode Edit:**
```typescript
if (isEditing) {
  // Update employee data
  const { error } = await supabase
    .from('employees')
    .update(dataToSave)
    .eq('id', editData.id);

  if (error) throw error;

  // ✅ Update education history
  if (educationEntries.length > 0) {
    // Delete existing education entries
    await supabase
      .from('education_history')
      .delete()
      .eq('employee_id', editData.id);

    // Insert new education entries
    const educationData = educationEntries.map(entry => ({
      employee_id: editData.id,
      level: entry.level,
      institution: entry.institution_name || null,
      major: entry.major || null,
      graduation_year: entry.graduation_year ? parseInt(entry.graduation_year) : null,
      front_title: entry.front_title || null,
      back_title: entry.back_title || null,
    }));

    const { error: eduError } = await supabase
      .from('education_history')
      .insert(educationData);

    if (eduError) {
      logger.error('Error saving education history:', eduError);
      // Don't fail the entire operation if education save fails
    }
  }
}
```

**Untuk Mode Tambah Baru:**
```typescript
else {
  // Insert employee data
  const { data: newEmployee, error } = await supabase
    .from('employees')
    .insert([dataToSave])
    .select('id')
    .single();

  if (error) throw error;

  // ✅ Insert education history if available
  if (newEmployee && educationEntries.length > 0) {
    const educationData = educationEntries.map(entry => ({
      employee_id: newEmployee.id,
      level: entry.level,
      institution: entry.institution_name || null,
      major: entry.major || null,
      graduation_year: entry.graduation_year ? parseInt(entry.graduation_year) : null,
      front_title: entry.front_title || null,
      back_title: entry.back_title || null,
    }));

    const { error: eduError } = await supabase
      .from('education_history')
      .insert(educationData);

    if (eduError) {
      logger.error('Error saving education history:', eduError);
      // Don't fail the entire operation if education save fails
    }
  }
}
```

#### Perubahan UI - Menggunakan Tabs:

**Struktur Baru:**
```tsx
<form onSubmit={handleSubmit} className="space-y-6 pt-4">
  <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'main' | 'education')}>
    <TabsList className="grid w-full grid-cols-2">
      <TabsTrigger value="main">Data Utama</TabsTrigger>
      <TabsTrigger value="education">Riwayat Pendidikan</TabsTrigger>
    </TabsList>

    <TabsContent value="main" className="space-y-6">
      {/* Data Pribadi Section */}
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground mb-3">Data Pribadi</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          {/* NIK, Nama, Tempat Lahir, Tanggal Lahir, Jenis Kelamin, Agama */}
        </div>
      </div>

      <Separator />

      {/* Data Kepegawaian Section */}
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground mb-3">Data Kepegawaian</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Jabatan, Unit Kerja, Type Non ASN, Deskripsi Tugas, Catatan */}
        </div>
      </div>
    </TabsContent>

    <TabsContent value="education" className="space-y-6">
      {/* ✅ Education Section - Menggunakan komponen yang sama dengan form ASN */}
      <EducationHistoryForm entries={educationEntries} onChange={setEducationEntries} />
      <p className="text-xs text-muted-foreground italic">
        💡 Data pendidikan akan ditampilkan di dashboard dan laporan
      </p>
    </TabsContent>
  </Tabs>

  {/* Submit buttons */}
</form>
```

### 2. Update Penggunaan di Employees Page

**File: `src/pages/Employees.tsx`**

```tsx
<NonAsnFormModal
  open={nonAsnModalOpen}
  onOpenChange={setNonAsnModalOpen}
  onSuccess={fetchEmployees}
  editData={selectedEmployee?.asn_status === 'Non ASN' ? selectedEmployee : undefined}
  userDepartment={profile?.department}
  isAdminPusat={isAdminPusat}
  initialEducation={selectedEducation}  // ✅ Pass education data saat edit
/>
```

## Fitur yang Ditambahkan

### 1. Tab Navigation
- **Tab "Data Utama"**: Berisi data pribadi dan kepegawaian (sama seperti sebelumnya)
- **Tab "Riwayat Pendidikan"**: Tab baru untuk mengelola data pendidikan

### 2. Komponen EducationHistoryForm
Menggunakan komponen yang sama dengan form ASN, dengan fitur:
- ✅ Tambah multiple entries pendidikan
- ✅ Field: Jenjang, Nama Lembaga, Jurusan, Tahun Lulus, Gelar Depan, Gelar Belakang
- ✅ Collapse/Expand view untuk menghemat space
- ✅ Summary view saat collapsed
- ✅ Hapus entry individual
- ✅ Validasi jenjang pendidikan (required)

### 3. Integrasi dengan Database
- ✅ Saat tambah pegawai baru: Insert ke `employees` dan `education_history`
- ✅ Saat edit pegawai: Update `employees` dan replace semua entries di `education_history`
- ✅ Error handling: Jika save education gagal, tidak membatalkan save employee

### 4. UI/UX Improvements
- ✅ Grouping fields dengan section headers ("Data Pribadi", "Data Kepegawaian")
- ✅ Separator untuk visual clarity
- ✅ Grid layout 2 kolom untuk efisiensi space
- ✅ Textarea fields menggunakan full width (sm:col-span-2)
- ✅ Helper text untuk menjelaskan fungsi field pendidikan

## Konsistensi dengan Form ASN

Form Non ASN sekarang konsisten dengan form ASN dalam hal:

| Aspek | Form ASN | Form Non ASN (Sebelum) | Form Non ASN (Sesudah) |
|-------|----------|------------------------|------------------------|
| Tab Navigation | ✅ 3 tabs | ❌ Single page | ✅ 2 tabs |
| Riwayat Pendidikan | ✅ Ada | ❌ Tidak ada | ✅ Ada |
| Section Grouping | ✅ Ada | ❌ Tidak ada | ✅ Ada |
| Grid Layout | ✅ 2 kolom | ✅ 1 kolom | ✅ 2 kolom |
| Separator | ✅ Ada | ❌ Tidak ada | ✅ Ada |
| Education Component | ✅ EducationHistoryForm | ❌ - | ✅ EducationHistoryForm |

## Testing yang Diperlukan

### 1. Test Tambah Pegawai Non ASN Baru
- [ ] Buka form tambah Non ASN
- [ ] Isi data utama (NIK, Nama, Jabatan, dll)
- [ ] Pindah ke tab "Riwayat Pendidikan"
- [ ] Tambah 1-2 entry pendidikan
- [ ] Submit form
- [ ] Verifikasi data masuk ke tabel `employees` dan `education_history`
- [ ] Cek dashboard apakah data pendidikan muncul

### 2. Test Edit Pegawai Non ASN
- [ ] Pilih pegawai Non ASN yang sudah ada
- [ ] Klik Edit
- [ ] Verifikasi data pendidikan ter-load di tab "Riwayat Pendidikan"
- [ ] Edit/tambah/hapus entry pendidikan
- [ ] Submit form
- [ ] Verifikasi perubahan tersimpan di database
- [ ] Cek dashboard apakah data pendidikan ter-update

### 3. Test Edge Cases
- [ ] Tambah pegawai tanpa data pendidikan (hanya data utama)
- [ ] Edit pegawai: hapus semua entry pendidikan
- [ ] Tambah pegawai dengan multiple entries pendidikan (3-5 entries)
- [ ] Test validasi: submit tanpa mengisi jenjang pendidikan

### 4. Test Integrasi dengan Dashboard
- [ ] Tambah pegawai Non ASN dengan pendidikan S1
- [ ] Buka dashboard
- [ ] Filter: Semua Unit Kerja, ASN Status: Non ASN
- [ ] Verifikasi chart "Distribusi Jenjang Pendidikan" menampilkan data baru
- [ ] Verifikasi detail jurusan muncul saat hover/klik

## Dampak Perubahan

### Positif:
1. ✅ User sekarang bisa menambah/edit data pendidikan Non ASN secara manual
2. ✅ Konsistensi UI/UX antara form ASN dan Non ASN
3. ✅ Data pendidikan Non ASN akan muncul di dashboard
4. ✅ Laporan akan lebih lengkap dengan data pendidikan Non ASN
5. ✅ Menggunakan komponen yang sudah teruji (EducationHistoryForm)

### Catatan:
- Data Non ASN yang sudah ada sebelumnya tidak memiliki data pendidikan
- User perlu edit manual untuk menambahkan data pendidikan ke pegawai lama
- Atau bisa re-import dengan template yang sudah diperbaiki

## File yang Diubah

1. `src/components/employees/NonAsnFormModal.tsx` - Menambahkan tab pendidikan dan logic save
2. `src/pages/Employees.tsx` - Menambahkan prop initialEducation
3. `src/pages/ImportNonAsn.tsx` - Sudah diperbaiki sebelumnya untuk save education data

## Rekomendasi Selanjutnya

1. **Bulk Update Education Data:**
   - Buat script untuk update data pendidikan pegawai Non ASN yang sudah ada
   - Atau buat fitur import education data terpisah

2. **Validation Enhancement:**
   - Pertimbangkan membuat jenjang pendidikan required untuk pegawai baru
   - Atau minimal berikan warning jika tidak diisi

3. **UI Enhancement:**
   - Tambahkan badge di tab "Riwayat Pendidikan" untuk menunjukkan jumlah entries
   - Contoh: "Riwayat Pendidikan (2)" jika ada 2 entries

4. **Documentation:**
   - Update user manual untuk menjelaskan cara mengisi data pendidikan
   - Tambahkan screenshot form baru
