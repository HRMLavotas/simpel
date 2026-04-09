# Dropdown Pangkat di Riwayat Kenaikan Pangkat

## 📋 Perubahan

Field "Pangkat" di form "Riwayat Kenaikan Pangkat" sekarang menggunakan **dropdown** dengan daftar pangkat yang tersedia, bukan text input.

## 🎯 Tujuan

1. **Konsistensi** dengan Quick Action yang juga menggunakan dropdown
2. **Validasi** otomatis - user hanya bisa pilih pangkat yang valid
3. **User Experience** lebih baik - tidak perlu mengetik manual
4. **Data Quality** - mencegah typo atau format pangkat yang salah

## 🔧 Implementasi

### 1. Props Baru di EmployeeHistoryForm

```typescript
interface EmployeeHistoryFormProps {
  // ... existing props
  rankOptions?: readonly string[]; // Options for rank dropdown (PNS or PPPK)
}
```

### 2. Logic untuk Detect Pangkat Field

```typescript
const fieldOptions = field.key.includes('pangkat') && rankOptions 
  ? rankOptions 
  : field.options;
```

**Penjelasan:**
- Jika field key mengandung kata "pangkat" DAN `rankOptions` tersedia
- Gunakan `rankOptions` sebagai options dropdown
- Jika tidak, gunakan `field.options` (untuk field lain seperti unit kerja)

### 3. Render Dropdown atau Input

```typescript
{(field.type === 'select' || fieldOptions) ? (
  <Select
    value={entry[field.key] || ''}
    onValueChange={(value) => updateEntry(index, field.key, value)}
  >
    <SelectTrigger className="h-9">
      <SelectValue placeholder={field.placeholder || 'Pilih...'} />
    </SelectTrigger>
    <SelectContent>
      {fieldOptions?.map((option) => (
        <SelectItem key={option} value={option}>
          {option}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
) : (
  <Input ... />
)}
```

### 4. Pass rankOptions dari Parent

```typescript
<EmployeeHistoryForm
  title="Riwayat Kenaikan Pangkat"
  fields={RANK_HISTORY_FIELDS}
  entries={rankHistoryEntries}
  onChange={handleRankHistoryChange}
  currentValue={form.watch('rank_group')}
  rankOptions={getRankOptions()} // ← Pass rank options
/>
```

**`getRankOptions()` function:**
```typescript
const getRankOptions = () => {
  const status = form.watch('asn_status');
  if (status === 'PPPK') return RANK_GROUPS_PPPK;
  if (status === 'PNS') return RANK_GROUPS_PNS;
  return ['Tidak Ada'];
};
```

## 📊 Comparison: Before vs After

### Before (Text Input):
```
┌────────────────────────────────────────────────────┐
│ #1                                          [🗑️]  │
│ ┌──────────────────────────────────────────────┐  │
│ │ Tanggal: [2022-01-01]                        │  │
│ │ Pangkat: [III/c]  ← Text input (manual)     │  │
│ │ Nomor SK: [123/SK/2022]                      │  │
│ └──────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────┘

Issues:
❌ User bisa typo (contoh: "III/C" vs "III/c")
❌ User bisa isi format salah (contoh: "3c", "III-c")
❌ Tidak ada validasi
```

### After (Dropdown):
```
┌────────────────────────────────────────────────────┐
│ #1                                          [🗑️]  │
│ ┌──────────────────────────────────────────────┐  │
│ │ Tanggal: [2022-01-01]                        │  │
│ │ Pangkat: [Pilih pangkat ▼]  ← Dropdown      │  │
│ │          - I/a                               │  │
│ │          - I/b                               │  │
│ │          - I/c                               │  │
│ │          - I/d                               │  │
│ │          - II/a                              │  │
│ │          - ...                               │  │
│ │          - III/c  ✓                          │  │
│ │ Nomor SK: [123/SK/2022]                      │  │
│ └──────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────┘

Benefits:
✅ Tidak ada typo
✅ Format selalu konsisten
✅ Validasi otomatis
✅ User experience lebih baik
```

## 🎨 Field yang Menggunakan Dropdown

### Riwayat Kenaikan Pangkat:
- ✅ **pangkat_lama**: Dropdown (auto-detect dari key "pangkat")
- ✅ **pangkat_baru**: Dropdown (auto-detect dari key "pangkat")
- ❌ **tanggal**: Date input
- ❌ **nomor_sk**: Text input
- ❌ **tmt**: Date input
- ❌ **keterangan**: Text input

### Riwayat Mutasi:
- ✅ **ke_unit**: Dropdown (dari field.options)
- ❌ **tanggal**: Date input
- ❌ **jabatan**: Text input
- ❌ **nomor_sk**: Text input
- ❌ **keterangan**: Text input

### Riwayat Jabatan:
- ✅ **unit_kerja**: Dropdown (dari field.options)
- ❌ **tanggal**: Date input
- ❌ **jabatan_baru**: Text input
- ❌ **nomor_sk**: Text input
- ❌ **keterangan**: Text input

## 🧪 Testing

### Test 1: Dropdown Muncul
```
1. Buka form edit pegawai
2. Klik tab "Riwayat"
3. Expand "Riwayat Kenaikan Pangkat"
4. Klik "Tambah"
5. ✅ EXPECTED: Field "Pangkat Lama" adalah dropdown
6. ✅ EXPECTED: Field "Pangkat Baru" adalah dropdown
7. ✅ EXPECTED: Dropdown berisi daftar pangkat sesuai status ASN
```

### Test 2: Dropdown Options Sesuai Status ASN
```
Scenario A: PNS
1. Buka form edit pegawai dengan status ASN = PNS
2. Klik tab "Riwayat" → "Riwayat Kenaikan Pangkat"
3. Klik "Tambah"
4. Klik dropdown "Pangkat Baru"
5. ✅ EXPECTED: Options adalah RANK_GROUPS_PNS
6. ✅ EXPECTED: Ada options: I/a, I/b, I/c, I/d, II/a, ..., IV/e

Scenario B: PPPK
1. Buka form edit pegawai dengan status ASN = PPPK
2. Klik tab "Riwayat" → "Riwayat Kenaikan Pangkat"
3. Klik "Tambah"
4. Klik dropdown "Pangkat Baru"
5. ✅ EXPECTED: Options adalah RANK_GROUPS_PPPK
6. ✅ EXPECTED: Ada options: I, II, III, IV, V, VI, VII, VIII, IX
```

### Test 3: Pilih Pangkat dari Dropdown
```
1. Buka form edit pegawai
2. Klik tab "Riwayat" → "Riwayat Kenaikan Pangkat"
3. Klik "Tambah"
4. Klik dropdown "Pangkat Baru"
5. Pilih "III/c"
6. ✅ EXPECTED: Field terisi dengan "III/c"
7. ✅ EXPECTED: Format konsisten (tidak ada typo)
```

### Test 4: Edit Entry Existing
```
1. Buka form edit pegawai yang sudah ada riwayat pangkat
2. Klik tab "Riwayat" → "Riwayat Kenaikan Pangkat"
3. Expand riwayat
4. Edit entry existing
5. ✅ EXPECTED: Field "Pangkat Lama" dan "Pangkat Baru" adalah dropdown
6. ✅ EXPECTED: Value existing terselect di dropdown
```

### Test 5: Konsistensi dengan Quick Action
```
1. Buka form edit pegawai
2. Klik tab "Quick Action" → "Naik Pangkat"
3. Lihat dropdown "Pangkat Baru"
4. Catat options yang tersedia
5. Klik tab "Riwayat" → "Riwayat Kenaikan Pangkat"
6. Klik "Tambah"
7. Lihat dropdown "Pangkat Baru"
8. ✅ EXPECTED: Options sama dengan Quick Action
```

## 🎯 Benefits

1. **Data Quality** ✅
   - Format pangkat selalu konsisten
   - Tidak ada typo atau format salah

2. **User Experience** ✅
   - Lebih mudah memilih dari dropdown daripada mengetik
   - Tidak perlu mengingat format pangkat

3. **Validasi Otomatis** ✅
   - User hanya bisa pilih pangkat yang valid
   - Tidak perlu validasi manual

4. **Konsistensi** ✅
   - Sama dengan Quick Action
   - Sama dengan form Data Utama

5. **Maintenance** ✅
   - Jika ada perubahan daftar pangkat, cukup update di satu tempat (constants)

## 📝 Notes

- Dropdown options diambil dari `RANK_GROUPS_PNS` atau `RANK_GROUPS_PPPK` di `lib/constants`
- Auto-detect field pangkat berdasarkan key yang mengandung kata "pangkat"
- Field lain (tanggal, nomor SK, keterangan) tetap menggunakan text input
- Dropdown juga berlaku untuk field "pangkat_lama" dan "pangkat_baru"

## 🔮 Future Enhancements

1. **Smart Default**
   - Auto-select pangkat_lama dari entry sebelumnya atau current rank

2. **Validation**
   - Validasi bahwa pangkat_baru > pangkat_lama (kenaikan, bukan penurunan)

3. **Grouping**
   - Group pangkat by golongan (I, II, III, IV) di dropdown

4. **Search**
   - Enable search di dropdown untuk pangkat yang banyak

---

**Implemented By:** AI Assistant
**Date:** 9 April 2026
**Version:** 1.4.1
**Status:** ✅ Implemented
