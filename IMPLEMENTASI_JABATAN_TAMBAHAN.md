# Implementasi Jabatan Tambahan

## ✅ Yang Sudah Selesai:

### 1. Database Migration
- ✅ File: `supabase/migrations/20260407110000_add_additional_position.sql`
- ✅ Menambahkan kolom `additional_position` ke tabel `employees`
- ✅ Membuat tabel `additional_position_history` untuk riwayat
- ✅ Menambahkan RLS policies
- ✅ Migration sudah dijalankan ke database

### 2. TypeScript Types
- ✅ File: `src/types/employee.ts`
- ✅ Menambahkan `additional_position` ke interface `Employee`
- ✅ Menambahkan `additional_position` ke interface `EmployeeFormData`

### 3. Komponen Form Riwayat
- ✅ File: `src/components/employees/AdditionalPositionHistoryForm.tsx`
- ✅ Komponen untuk mengelola riwayat jabatan tambahan
- ✅ Fitur tambah, edit, hapus riwayat

## 📝 Yang Perlu Dilakukan Selanjutnya:

### 1. Update EmployeeFormModal.tsx

Tambahkan field "Jabatan Tambahan" setelah "Nama Jabatan" (sekitar baris 695):

```typescript
{/* Unlocked Field: Nama Jabatan */}
<div className="space-y-2">
  <Label htmlFor="position_name">Nama Jabatan</Label>
  <Input id="position_name" placeholder="Contoh: Kepala Subbag Kepegawaian" {...form.register('position_name')} />
  {hasPositionChanged && (
    <p className="text-xs text-muted-foreground">⚠️ Perubahan jabatan akan otomatis menambahkan riwayat jabatan</p>
  )}
</div>

{/* NEW: Jabatan Tambahan (Opsional) */}
<div className="space-y-2">
  <Label htmlFor="additional_position">
    Jabatan Tambahan 
    <span className="text-xs text-muted-foreground ml-2">(Opsional)</span>
  </Label>
  <Input 
    id="additional_position" 
    placeholder="Contoh: Subkoordinator Bidang Data dan Informasi" 
    {...form.register('additional_position')} 
  />
  <p className="text-xs text-muted-foreground">
    Jabatan tambahan di luar jabatan sesuai Kepmen
  </p>
</div>
```

### 2. Import AdditionalPositionHistoryForm

Tambahkan import di bagian atas file `EmployeeFormModal.tsx`:

```typescript
import { AdditionalPositionHistoryForm, type AdditionalPositionHistoryEntry } from './AdditionalPositionHistoryForm';
```

### 3. Tambahkan State untuk Riwayat Jabatan Tambahan

Tambahkan state baru di dalam komponen (sekitar baris 100-150):

```typescript
const [additionalPositionHistoryEntries, setAdditionalPositionHistoryEntries] = useState<AdditionalPositionHistoryEntry[]>([]);
```

### 4. Load Data Riwayat saat Edit

Di dalam `useEffect` yang load data employee (sekitar baris 200-300), tambahkan:

```typescript
// Load additional position history
if (employee?.id) {
  const { data: additionalPosHistory } = await supabase
    .from('additional_position_history')
    .select('*')
    .eq('employee_id', employee.id)
    .order('tanggal', { ascending: true, nullsFirst: false });
  
  if (additionalPosHistory) {
    setAdditionalPositionHistoryEntries(
      additionalPosHistory.map(h => ({
        id: h.id,
        tanggal: h.tanggal || '',
        jabatan_tambahan_lama: h.jabatan_tambahan_lama || '',
        jabatan_tambahan_baru: h.jabatan_tambahan_baru || '',
        nomor_sk: h.nomor_sk || '',
        tmt: h.tmt || '',
        keterangan: h.keterangan || '',
      }))
    );
  }
}
```

### 5. Tambahkan Tab Riwayat Jabatan Tambahan

Di bagian Tabs (sekitar baris 800-900), tambahkan tab baru:

```typescript
<TabsContent value="additional_position_history" className="space-y-4">
  <AdditionalPositionHistoryForm
    entries={additionalPositionHistoryEntries}
    onChange={setAdditionalPositionHistoryEntries}
    currentAdditionalPosition={form.watch('additional_position')}
  />
</TabsContent>
```

Dan tambahkan TabsTrigger:

```typescript
<TabsTrigger value="additional_position_history">Riwayat Jabatan Tambahan</TabsTrigger>
```

### 6. Save Riwayat Jabatan Tambahan

Di fungsi `onSubmit` (sekitar baris 400-500), tambahkan setelah save riwayat lainnya:

```typescript
// Save additional position history
if (savedEmployee?.id && additionalPositionHistoryEntries.length > 0) {
  // Delete existing entries
  await supabase
    .from('additional_position_history')
    .delete()
    .eq('employee_id', savedEmployee.id);
  
  // Insert new entries
  const historyToInsert = additionalPositionHistoryEntries
    .filter(entry => entry.jabatan_tambahan_baru || entry.jabatan_tambahan_lama)
    .map(entry => ({
      employee_id: savedEmployee.id,
      tanggal: entry.tanggal || null,
      jabatan_tambahan_lama: entry.jabatan_tambahan_lama || null,
      jabatan_tambahan_baru: entry.jabatan_tambahan_baru || null,
      nomor_sk: entry.nomor_sk || null,
      tmt: entry.tmt || null,
      keterangan: entry.keterangan || null,
    }));
  
  if (historyToInsert.length > 0) {
    await supabase
      .from('additional_position_history')
      .insert(historyToInsert);
  }
}
```

### 7. Update EmployeeDetailsModal.tsx

Tambahkan tampilan Jabatan Tambahan dan riwayatnya di modal detail pegawai.

### 8. Update Employees.tsx (halaman utama)

Pastikan query select menyertakan `additional_position`:

```typescript
.select('*, additional_position')
```

### 9. Update Export CSV

Di fungsi `handleExport` di `Employees.tsx`, tambahkan kolom Jabatan Tambahan:

```typescript
const headers = ['NIP', 'Gelar Depan', 'Nama', 'Gelar Belakang', 'Jenis Jabatan', 'Nama Jabatan', 'Jabatan Tambahan', 'Status ASN', ...];
```

## 🎯 Fitur yang Akan Tersedia:

1. ✅ Field "Jabatan Tambahan" di form (opsional)
2. ✅ Riwayat perubahan jabatan tambahan
3. ✅ Auto-tracking perubahan jabatan tambahan
4. ✅ Tampilan di detail pegawai
5. ✅ Export ke CSV termasuk jabatan tambahan

## 📋 Contoh Penggunaan:

**Pegawai:**
- Nama: Ahmad Fauzi
- Jabatan (Kepmen): Instruktur Ahli Madya
- **Jabatan Tambahan**: Subkoordinator Bidang Data dan Informasi

**Riwayat Jabatan Tambahan:**
| Tanggal | Jabatan Lama | Jabatan Baru | Nomor SK | TMT |
|---------|--------------|--------------|----------|-----|
| 2024-01-15 | - | Subkoordinator Bidang Data | SK-001/2024 | 2024-02-01 |
| 2025-06-20 | Subkoordinator Bidang Data | Subkoordinator Bidang Data dan Informasi | SK-045/2025 | 2025-07-01 |

## ⚠️ Catatan Penting:

1. Field "Jabatan Tambahan" bersifat **OPSIONAL**
2. Tidak semua pegawai memiliki jabatan tambahan
3. Riwayat hanya perlu diisi jika ada perubahan
4. Jabatan Tambahan berbeda dengan Jabatan Sesuai Kepmen
5. Sistem akan auto-track perubahan seperti riwayat jabatan lainnya

## 🔧 Testing:

Setelah implementasi selesai, test:
1. ✅ Tambah pegawai baru dengan jabatan tambahan
2. ✅ Edit pegawai existing, tambahkan jabatan tambahan
3. ✅ Ubah jabatan tambahan, cek riwayat ter-update
4. ✅ Hapus jabatan tambahan (kosongkan field)
5. ✅ Export CSV, pastikan kolom jabatan tambahan muncul
6. ✅ Lihat detail pegawai, pastikan jabatan tambahan dan riwayatnya tampil
