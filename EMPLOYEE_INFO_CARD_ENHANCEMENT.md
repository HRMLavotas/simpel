# Enhancement: Card Informasi Pegawai

## 📋 Summary

Card "Informasi Pegawai" di sidebar telah dilengkapi dengan data lengkap pegawai.

## ✅ Perubahan yang Dilakukan

### 1. **Interface EmployeeExtraInfo - Ditambahkan Field Baru**

```typescript
// SEBELUM
interface EmployeeExtraInfo {
  jabatan?: string;
  unitKerja?: string;
  createdByName?: string;
}

// SESUDAH
interface EmployeeExtraInfo {
  name?: string;              // ⭐ BARU
  nip?: string;               // ⭐ BARU
  pangkatGolongan?: string;   // ⭐ BARU
  jabatan?: string;
  unitKerja?: string;
  createdByName?: string;
}
```

### 2. **Fungsi loadExtraInfo - Enhanced Data Loading**

**Perubahan**:
- ✅ Prioritas data dari tabel `employees` (ASN)
- ✅ Fallback ke tabel `profiles` jika tidak ada di `employees`
- ✅ Fallback ke manual data jika tidak ada di kedua tabel
- ✅ Mengambil field: `name`, `nip`, `rank`, `position_name`, `department`

**Query Baru**:
```typescript
const { data: employee } = await supabase
  .from('employees')
  .select('name, nip, rank, position_name, department')
  .eq('id', c.employeeId)
  .maybeSingle();
```

### 3. **Card Display - Informasi Lengkap**

**Field yang Ditampilkan** (urutan):

1. ✅ **Nama** - Nama lengkap pegawai (icon: User)
2. ✅ **NIP** - Nomor Induk Pegawai dengan font mono (icon: FileText)
3. ✅ **Pangkat / Golongan** - Pangkat dan golongan pegawai (icon: Scale)
4. ✅ **Jabatan** - Jabatan pegawai (icon: Briefcase)
5. ✅ **Unit Kerja** - Unit kerja / departemen (icon: Building2)
6. ✅ **Kasus Dibuat oleh** - Nama admin yang membuat kasus (icon: User, separated by border)

## 📊 Tampilan Card

### SEBELUM (Minimal):
```
┌─────────────────────────────────┐
│  Informasi Pegawai              │
├─────────────────────────────────┤
│  💼 Jabatan                     │
│     Kepala Seksi                │
│                                 │
│  🏢 Unit Kerja                  │
│     Bagian Kepegawaian          │
│                                 │
│  👤 Dibuat oleh                 │
│     Admin Pusat                 │
└─────────────────────────────────┘
```

### SESUDAH (Lengkap):
```
┌─────────────────────────────────┐
│  Informasi Pegawai              │
├─────────────────────────────────┤
│  👤 Nama                        │
│     John Doe                    │
│                                 │
│  📄 NIP                         │
│     199001012020121001          │
│                                 │
│  ⚖️ Pangkat / Golongan          │
│     Penata Tk.I / III/d         │
│                                 │
│  💼 Jabatan                     │
│     Kepala Seksi                │
│                                 │
│  🏢 Unit Kerja                  │
│     Bagian Kepegawaian          │
│                                 │
│  ─────────────────────────      │
│  👤 Kasus Dibuat oleh           │
│     Admin Pusat                 │
└─────────────────────────────────┘
```

## 🎯 Fitur Utama

### 1. **Data Hierarchy (Priority)**
```
1. employees table (ASN data) ← PRIORITAS UTAMA
   ↓ (jika tidak ada)
2. profiles table (User data)
   ↓ (jika tidak ada)
3. Manual entry data (dari case_details)
   ↓ (jika tidak ada)
4. Data dari EmployeeCase (employeeName, employeeNip)
```

### 2. **Conditional Display**
- Setiap field hanya muncul jika ada datanya
- Tidak ada field kosong yang ditampilkan
- "Kasus Dibuat oleh" dipisahkan dengan border

### 3. **Styling**
- ✅ Icon yang sesuai untuk setiap field
- ✅ Font mono untuk NIP (lebih mudah dibaca)
- ✅ Spacing yang konsisten
- ✅ Border separator untuk section "Dibuat oleh"

## 📁 Data Source

### Tabel `employees`:
```sql
SELECT 
  name,              -- Nama pegawai
  nip,               -- NIP
  rank,              -- Pangkat/Golongan (e.g., "Penata Tk.I / III/d")
  position_name,     -- Jabatan
  department         -- Unit Kerja
FROM employees
WHERE id = employeeId
```

### Fallback - Tabel `profiles`:
```sql
SELECT 
  name,              -- Nama
  jabatan,           -- Jabatan
  work_unit_id       -- ID unit kerja (join ke work_units)
FROM profiles
WHERE id = employeeId
```

### Fallback - Manual Data:
```json
{
  "isManualEntry": true,
  "manualJabatan": "...",
  "manualUnitKerja": "..."
}
```

## 🔄 Flow Diagram

```
loadExtraInfo(employeeCase)
    ↓
Set basic info (name, nip from case)
    ↓
Query employees table
    ↓
    ├─ Found? → Use employee data ✅
    │            (name, nip, rank, position_name, department)
    │
    └─ Not Found? → Query profiles table
                      ↓
                      ├─ Found? → Use profile data
                      │            (name, jabatan, work_unit_id)
                      │
                      └─ Not Found? → Use manual data
                                       (manualJabatan, manualUnitKerja)
    ↓
Query creator name from profiles
    ↓
setExtraInfo(info)
    ↓
Card displays all available data
```

## ✅ Benefits

1. ✅ **Informasi Lengkap** - Semua data pegawai dalam satu card
2. ✅ **Tidak Perlu Scroll** - Data penting langsung terlihat
3. ✅ **Konteks Lengkap** - Admin bisa melihat siapa pegawai yang terlibat
4. ✅ **Verifikasi Mudah** - NIP dan pangkat golongan untuk validasi
5. ✅ **Audit Trail** - Tahu siapa yang membuat kasus

## 🧪 Testing Checklist

- [ ] Card menampilkan nama pegawai
- [ ] Card menampilkan NIP dengan font mono
- [ ] Card menampilkan pangkat/golongan (jika ada)
- [ ] Card menampilkan jabatan
- [ ] Card menampilkan unit kerja
- [ ] Card menampilkan nama pembuat kasus
- [ ] Data diambil dari tabel `employees` untuk ASN
- [ ] Fallback ke `profiles` jika tidak ada di `employees`
- [ ] Fallback ke manual data jika tidak ada di kedua tabel
- [ ] Field yang kosong tidak ditampilkan
- [ ] Border separator muncul sebelum "Dibuat oleh"
- [ ] Icon sesuai untuk setiap field

## 📝 Notes

- **NIP menggunakan font mono**: Lebih mudah dibaca dan copy
- **Pangkat/Golongan**: Diambil dari field `rank` di tabel `employees`
- **Conditional rendering**: Hanya field yang ada datanya yang ditampilkan
- **Separator**: Border sebelum "Dibuat oleh" untuk memisahkan info pegawai dan metadata kasus

## 🔮 Future Enhancements

Potensi pengembangan:
- [ ] Foto pegawai
- [ ] Link ke profil pegawai lengkap
- [ ] Status kepegawaian (Aktif/Pensiun/dll)
- [ ] Masa kerja
- [ ] Kontak (email, telepon)
- [ ] Riwayat kasus sebelumnya (jumlah)

---

**Status**: ✅ COMPLETED
**Date**: 2026-05-13
**Impact**: Medium (Enhanced UX, better data visibility)
