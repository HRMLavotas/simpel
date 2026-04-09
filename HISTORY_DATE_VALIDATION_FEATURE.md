# Fitur Validasi Tanggal Riwayat

## 📋 Deskripsi

Fitur validasi tanggal riwayat memastikan bahwa:
1. **Data "saat ini"** diambil dari entry riwayat dengan **tanggal terbaru**
2. User dapat menambahkan **riwayat lama** (historical data) tanpa mengubah data current
3. **Validasi:** Tanggal riwayat baru tidak boleh lebih baru dari tanggal entry terbaru yang sudah ada
4. **Quick Action** tetap dapat menambah entry dengan tanggal terbaru (yang akan update data current)

## 🎯 Tujuan

Mencegah user secara tidak sengaja mengubah data current ketika menambahkan riwayat lama (historical data).

## 💡 Konsep

### Data Current vs Historical Data

**Data Current (Saat Ini):**
- Diambil dari entry riwayat dengan tanggal terbaru
- Ditampilkan di form "Data Utama"
- Contoh: Pangkat saat ini = III/c (dari entry tanggal 2022-01-01)

**Historical Data (Riwayat Lama):**
- Entry dengan tanggal lebih lama dari entry terbaru
- Tidak mengubah data current
- Contoh: Menambah entry tanggal 2021-06-01 (tidak mengubah pangkat saat ini)

## 📊 Contoh Scenario

### Scenario 1: Menambah Riwayat Lama ✅

```
Riwayat Kenaikan Pangkat (existing):
┌─────────────┬──────────┬──────────┐
│ Tanggal     │ Pangkat  │ Status   │
├─────────────┼──────────┼──────────┤
│ 2022-01-01  │ III/c    │ Terbaru  │ ← Current rank
│ 2020-01-01  │ III/b    │          │
│ 2018-01-01  │ III/a    │          │
└─────────────┴──────────┴──────────┘

User ingin tambah riwayat lama:
- Tanggal: 2021-06-01
- Pangkat: III/b

Validasi:
✅ 2021-06-01 < 2022-01-01 (tanggal terbaru)
✅ Boleh ditambahkan

Hasil setelah ditambahkan:
┌─────────────┬──────────┬──────────┐
│ Tanggal     │ Pangkat  │ Status   │
├─────────────┼──────────┼──────────┤
│ 2022-01-01  │ III/c    │ Terbaru  │ ← Current rank (tidak berubah)
│ 2021-06-01  │ III/b    │ BARU     │
│ 2020-01-01  │ III/b    │          │
│ 2018-01-01  │ III/a    │          │
└─────────────┴──────────┴──────────┘
```

### Scenario 2: Menambah Riwayat Terbaru via Manual ❌

```
Riwayat Kenaikan Pangkat (existing):
┌─────────────┬──────────┬──────────┐
│ Tanggal     │ Pangkat  │ Status   │
├─────────────┼──────────┼──────────┤
│ 2022-01-01  │ III/c    │ Terbaru  │ ← Current rank
│ 2020-01-01  │ III/b    │          │
└─────────────┴──────────┴──────────┘

User ingin tambah riwayat baru via "Tambah" manual:
- Tanggal: 2023-01-01
- Pangkat: III/d

Validasi:
❌ 2023-01-01 > 2022-01-01 (tanggal terbaru)
❌ DITOLAK

Error Message:
"⚠️ Tanggal tidak boleh lebih baru dari 2022-01-01. 
Gunakan Quick Action untuk menambah data terbaru."
```

### Scenario 3: Menambah Riwayat Terbaru via Quick Action ✅

```
Riwayat Kenaikan Pangkat (existing):
┌─────────────┬──────────┬──────────┐
│ Tanggal     │ Pangkat  │ Status   │
├─────────────┼──────────┼──────────┤
│ 2022-01-01  │ III/c    │ Terbaru  │ ← Current rank
│ 2020-01-01  │ III/b    │          │
└─────────────┴──────────┴──────────┘

User gunakan Quick Action "Naik Pangkat":
- Tanggal: 2023-01-01
- Pangkat Baru: III/d

Validasi:
✅ Quick Action tidak ada validasi tanggal
✅ Boleh ditambahkan

Hasil setelah ditambahkan:
┌─────────────┬──────────┬──────────┐
│ Tanggal     │ Pangkat  │ Status   │
├─────────────┼──────────┼──────────┤
│ 2023-01-01  │ III/d    │ Terbaru  │ ← Current rank (BERUBAH)
│ 2022-01-01  │ III/c    │          │
│ 2020-01-01  │ III/b    │          │
└─────────────┴──────────┴──────────┘

Data Utama:
- Pangkat/Golongan: III/d (UPDATED)
```

## 🔧 Implementasi Teknis

### 1. Interface Update

```typescript
interface EmployeeHistoryFormProps {
  title: string;
  fields: HistoryField[];
  entries: HistoryEntry[];
  onChange: (entries: HistoryEntry[]) => void;
  allowFutureEntries?: boolean; // Allow adding entries with date > latest entry
  currentValue?: string; // Current value to display
}
```

**Props Baru:**
- `allowFutureEntries`: Boolean untuk allow/disallow entry dengan tanggal > terbaru
  - `false` (default): Validasi aktif, tidak boleh tambah entry dengan tanggal > terbaru
  - `true`: Validasi non-aktif, boleh tambah entry dengan tanggal apapun (untuk Quick Action)
- `currentValue`: String untuk menampilkan nilai current (contoh: "III/c", "Kepala Subbag")

### 2. Validasi Function

```typescript
// Get the latest entry date
const getLatestEntryDate = (): string | null => {
  if (entries.length === 0) return null;
  
  const dateField = fields.find(f => f.type === 'date')?.key;
  if (!dateField) return null;
  
  // Entries are already sorted by date (newest first)
  const latestEntry = entries[0];
  return latestEntry[dateField] || null;
};

// Validate if new entry date is allowed
const validateEntryDate = (entryDate: string): boolean => {
  if (allowFutureEntries) return true; // No validation for Quick Action
  if (!entryDate) return true; // Empty date is allowed
  
  const latestDate = getLatestEntryDate();
  if (!latestDate) return true; // No existing entries
  
  // Check if new entry date is not after latest date
  if (entryDate > latestDate) {
    setValidationError(
      `Tanggal tidak boleh lebih baru dari ${latestDate}. ` +
      `Gunakan Quick Action untuk menambah data terbaru.`
    );
    return false;
  }
  
  setValidationError('');
  return true;
};
```

### 3. Update Entry with Validation

```typescript
const updateEntry = (index: number, field: string, value: string) => {
  // Validate date if it's a date field
  const isDateField = fields.find(f => f.key === field)?.type === 'date';
  if (isDateField && value && !validateEntryDate(value)) {
    return; // Don't update if validation fails
  }
  
  const updated = entries.map((entry, i) =>
    i === index ? { ...entry, [field]: value } : entry
  );
  
  // Auto-sort after update if the changed field is a date field
  onChange(isDateField ? sortEntriesByDate(updated, fields) : updated);
};
```

### 4. UI Update

**Display Current Value:**
```typescript
{currentValue && (
  <p className="text-xs font-medium text-primary">
    Saat ini: {currentValue}
  </p>
)}
```

**Display Validation Error:**
```typescript
{validationError && (
  <div className="p-3 rounded-lg border border-destructive bg-destructive/10 text-sm text-destructive">
    ⚠️ {validationError}
  </div>
)}
```

**Display Warning:**
```typescript
<p className="text-xs text-amber-600 mt-1">
  ⚠️ Untuk menambah pangkat terbaru, gunakan Quick Action
</p>
```

## 🎨 User Interface

### Tampilan Riwayat dengan Current Value

```
┌────────────────────────────────────────────────────────┐
│ Riwayat Kenaikan Pangkat                          [3] │
│ Diurutkan dari yang terbaru ke terlama                │
│ Saat ini: III/c                                        │
│                                                        │
│ [Lihat Semua ▼] [+ Tambah]                           │
└────────────────────────────────────────────────────────┘
```

### Tampilan Error Validasi

```
┌────────────────────────────────────────────────────────┐
│ Riwayat Kenaikan Pangkat                          [3] │
│ Saat ini: III/c                                        │
│                                                        │
│ ┌────────────────────────────────────────────────────┐ │
│ │ ⚠️ Tanggal tidak boleh lebih baru dari 2022-01-01.│ │
│ │    Gunakan Quick Action untuk menambah data       │ │
│ │    terbaru.                                        │ │
│ └────────────────────────────────────────────────────┘ │
│                                                        │
│ #1                                              [🗑️]  │
│ ┌────────────────────────────────────────────────────┐ │
│ │ Tanggal: [2023-01-01] ← ERROR                     │ │
│ │ Pangkat: [III/d]                                   │ │
│ └────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────┘
```

### Tampilan Warning

```
┌────────────────────────────────────────────────────────┐
│ Riwayat Kenaikan Pangkat                          [3] │
│ Saat ini: III/c                                        │
│                                                        │
│ 💡 Pangkat lama akan otomatis terisi dari riwayat     │
│    sebelumnya atau data saat ini                      │
│                                                        │
│ ⚠️ Untuk menambah pangkat terbaru, gunakan Quick      │
│    Action                                              │
└────────────────────────────────────────────────────────┘
```

## 🧪 Testing Scenarios

### Test 1: Tambah Riwayat Lama
```
1. Buka form edit pegawai
2. Klik tab "Riwayat"
3. Lihat "Riwayat Kenaikan Pangkat"
4. Catat tanggal entry terbaru (contoh: 2022-01-01)
5. Klik "Tambah"
6. Isi tanggal dengan tanggal lama (contoh: 2021-06-01)
7. Isi pangkat
8. ✅ EXPECTED: Entry berhasil ditambahkan
9. ✅ EXPECTED: Current rank tidak berubah
10. ✅ EXPECTED: Entry di-sort otomatis
```

### Test 2: Tambah Riwayat Terbaru via Manual (Harus Ditolak)
```
1. Buka form edit pegawai
2. Klik tab "Riwayat"
3. Lihat "Riwayat Kenaikan Pangkat"
4. Catat tanggal entry terbaru (contoh: 2022-01-01)
5. Klik "Tambah"
6. Isi tanggal dengan tanggal baru (contoh: 2023-01-01)
7. ✅ EXPECTED: Error muncul
8. ✅ EXPECTED: Error message: "Tanggal tidak boleh lebih baru dari 2022-01-01..."
9. ✅ EXPECTED: Entry tidak ditambahkan
```

### Test 3: Tambah Riwayat Terbaru via Quick Action (Harus Berhasil)
```
1. Buka form edit pegawai
2. Klik tab "Quick Action"
3. Pilih "Naik Pangkat"
4. Isi tanggal dengan tanggal baru (contoh: 2023-01-01)
5. Isi pangkat baru
6. Klik "Terapkan Kenaikan Pangkat"
7. ✅ EXPECTED: Entry berhasil ditambahkan
8. ✅ EXPECTED: Current rank BERUBAH ke pangkat baru
9. Klik tab "Riwayat"
10. ✅ EXPECTED: Entry baru ada di posisi teratas (terbaru)
```

### Test 4: Edit Tanggal Entry Existing
```
1. Buka form edit pegawai
2. Klik tab "Riwayat"
3. Expand "Riwayat Kenaikan Pangkat"
4. Edit tanggal entry ke-2 menjadi lebih baru dari entry ke-1
5. ✅ EXPECTED: Error muncul
6. ✅ EXPECTED: Tanggal tidak berubah
```

### Test 5: Tidak Ada Entry (First Entry)
```
1. Buka form edit pegawai baru (atau hapus semua entry)
2. Klik tab "Riwayat"
3. Klik "Tambah" di "Riwayat Kenaikan Pangkat"
4. Isi tanggal dengan tanggal apapun
5. ✅ EXPECTED: Entry berhasil ditambahkan (no validation)
6. ✅ EXPECTED: Tidak ada error
```

### Test 6: Current Value Display
```
1. Buka form edit pegawai
2. Klik tab "Riwayat"
3. Lihat "Riwayat Kenaikan Pangkat"
4. ✅ EXPECTED: Ada text "Saat ini: [pangkat current]"
5. ✅ EXPECTED: Pangkat current sesuai dengan entry terbaru
```

## 📊 Comparison: Manual vs Quick Action

| Aspek | Tambah Manual | Quick Action |
|-------|---------------|--------------|
| **Validasi Tanggal** | ✅ Ya (tidak boleh > terbaru) | ❌ Tidak |
| **Update Current Data** | ❌ Tidak | ✅ Ya |
| **Use Case** | Menambah riwayat lama | Menambah data terbaru |
| **Tanggal Allowed** | ≤ tanggal terbaru | Tanggal apapun |
| **Auto-sort** | ✅ Ya | ✅ Ya |
| **Duplicate Check** | ❌ Tidak | ✅ Ya |

## 🎯 Benefits

1. **Prevent Accidental Changes** ✅
   - User tidak bisa secara tidak sengaja mengubah data current saat menambah riwayat lama

2. **Clear Separation** ✅
   - Jelas perbedaan antara menambah riwayat lama vs menambah data terbaru

3. **Data Integrity** ✅
   - Data current selalu diambil dari entry dengan tanggal terbaru

4. **User Guidance** ✅
   - Error message yang jelas mengarahkan user untuk gunakan Quick Action

5. **Flexibility** ✅
   - User tetap bisa menambah riwayat lama untuk melengkapi data historical

## 🔮 Future Enhancements

1. **Bulk Import Historical Data**
   - Import multiple historical entries sekaligus dari Excel/CSV

2. **Date Range Validation**
   - Validasi bahwa tanggal entry tidak overlap atau gap terlalu besar

3. **Auto-fill from Previous Entry**
   - Auto-fill "pangkat_lama" dari entry sebelumnya

4. **Timeline Visualization**
   - Visualisasi timeline riwayat dalam bentuk grafik

5. **Conflict Detection**
   - Detect jika ada conflict antara entry (contoh: 2 entry dengan tanggal sama)

## 📝 Notes

- Validasi hanya berlaku untuk field tanggal utama (tanggal, tanggal_mulai)
- Field TMT tidak divalidasi (bisa berbeda dari tanggal)
- Sorting otomatis berdasarkan tanggal (newest first)
- Current value diambil dari entry index 0 (setelah sorting)

---

**Implemented By:** AI Assistant
**Date:** 9 April 2026
**Version:** 1.4.0
**Status:** ✅ Implemented & Documented
