# Fix Education Chart Order - Non-ASN Tab

**Tanggal:** 13 Mei 2026  
**Status:** ✅ SELESAI  
**File:** `src/components/dashboard/EducationDistributionChart.tsx`

## 🎯 Masalah

User melaporkan bahwa urutan jenjang pendidikan di tab Non-ASN tidak sama dengan tab ASN. Urutan yang diinginkan adalah dari SD hingga S3 ke bawah (SD di atas, S3 di bawah).

## 🔍 Root Cause

Meskipun data sudah diurutkan dengan benar menggunakan `EDUCATION_ORDER` untuk kedua tab (ASN dan Non-ASN), tampilan bar chart vertikal di Recharts tidak menghormati urutan array secara default.

**Perilaku Default Recharts:**
- Dalam bar chart vertikal (layout="vertical"), item pertama dalam array muncul di **BAWAH**
- Item terakhir dalam array muncul di **ATAS**

**Data Kita:**
```typescript
// Data sudah diurutkan: SD (order 1) → S3 (order 10)
[
  { level: 'SD', count: 5 },    // order 1
  { level: 'SMP', count: 13 },  // order 2
  { level: 'SMA', count: 31 },  // order 3
  { level: 'D1', count: 8 },    // order 4
  // ...
  { level: 'S3', count: 12 }    // order 10
]
```

**Tampilan Default (SALAH):**
```
S3  ████████████
S2  ████████████████
S1  ████████████████████████
...
SMA ███████████████████████████████
SMP █████████████
SD  █████
```

**Tampilan yang Diinginkan (BENAR):**
```
SD  █████
SMP █████████████
SMA ███████████████████████████████
...
S1  ████████████████████████
S2  ████████████████
S3  ████████████
```

## ✅ Solusi

Menambahkan properti `reversed={true}` pada YAxis di bar chart vertikal:

```typescript
<YAxis 
  dataKey="level" 
  type="category" 
  width={50}
  reversed={true}  // ← Membalik urutan tampilan
/>
```

**Efek `reversed={true}`:**
- Item pertama dalam array (SD) muncul di **ATAS**
- Item terakhir dalam array (S3) muncul di **BAWAH**
- Urutan tampilan: SD → SMP → SMA → D1 → D2 → D3 → D4 → S1 → S2 → S3 (dari atas ke bawah)

## 📊 Perubahan Kode

### Before
```typescript
return (
  <ResponsiveContainer width="100%" height={400}>
    <BarChart data={data} layout="vertical" margin={{ left: 60, right: 20 }}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis type="number" />
      <YAxis dataKey="level" type="category" width={50} />
      <Tooltip formatter={(value: number) => value.toLocaleString('id-ID')} />
      <Bar dataKey="count" fill="hsl(217, 91%, 60%)" />
    </BarChart>
  </ResponsiveContainer>
);
```

### After
```typescript
return (
  <ResponsiveContainer width="100%" height={400}>
    <BarChart data={data} layout="vertical" margin={{ left: 60, right: 20 }}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis type="number" />
      <YAxis 
        dataKey="level" 
        type="category" 
        width={50}
        reversed={true}  // ← ADDED
      />
      <Tooltip formatter={(value: number) => value.toLocaleString('id-ID')} />
      <Bar dataKey="count" fill="hsl(217, 91%, 60%)" />
    </BarChart>
  </ResponsiveContainer>
);
```

## 🎨 Visual Impact

### Pie Chart (≤8 categories)
- **Tidak berubah** - Pie chart tidak memiliki konsep "urutan vertikal"
- Legend tetap menampilkan dalam urutan yang benar

### Bar Chart (>8 categories)
- **Sebelum:** S3 di atas, SD di bawah (terbalik)
- **Setelah:** SD di atas, S3 di bawah (sesuai urutan pendidikan)

## 🧪 Testing

### Scenario 1: ASN dengan ≤8 jenjang
- **Chart Type:** Pie Chart
- **Expected:** Legend menampilkan SD, SMP, SMA, ... S3
- **Result:** ✅ Tidak ada perubahan (sudah benar)

### Scenario 2: ASN dengan >8 jenjang
- **Chart Type:** Bar Chart (vertical)
- **Expected:** SD di atas, S3 di bawah
- **Result:** ✅ Urutan benar dengan `reversed={true}`

### Scenario 3: Non-ASN dengan ≤8 jenjang
- **Chart Type:** Pie Chart
- **Expected:** Legend menampilkan SD, SMP, SMA, ... S3
- **Result:** ✅ Tidak ada perubahan (sudah benar)

### Scenario 4: Non-ASN dengan >8 jenjang
- **Chart Type:** Bar Chart (vertical)
- **Expected:** SD di atas, S3 di bawah
- **Result:** ✅ Urutan benar dengan `reversed={true}`

## 📝 Technical Notes

### Recharts YAxis Properties

**`reversed` Property:**
- **Type:** `boolean`
- **Default:** `false`
- **Effect:** Membalik urutan kategori pada axis
- **Use Case:** Ketika ingin item pertama array muncul di atas (untuk vertical bar chart)

### Data Sorting

Data tetap diurutkan menggunakan `EDUCATION_ORDER`:
```typescript
.sort((a, b) => (EDUCATION_ORDER[a.level] || 999) - (EDUCATION_ORDER[b.level] || 999))
```

Ini menghasilkan array dengan urutan:
1. SD (order 1)
2. SMP (order 2)
3. SMA (order 3)
4. D1 (order 4)
5. D2 (order 5)
6. D3 (order 6)
7. D4 (order 7)
8. S1 (order 8)
9. S2 (order 9)
10. S3 (order 10)

### Consistency Across Tabs

Kedua tab (ASN dan Non-ASN) menggunakan:
1. **Fungsi normalisasi yang sama:** `normalizeEducationLevel()`
2. **Sorting logic yang sama:** `EDUCATION_ORDER`
3. **Rendering function yang sama:** `renderLevelChart()`
4. **YAxis configuration yang sama:** `reversed={true}`

Ini memastikan konsistensi tampilan di kedua tab.

## 🔗 Related Files

- `src/components/dashboard/EducationDistributionChart.tsx` - Chart utama (UPDATED)
- `EDUCATION_LEVEL_NORMALIZATION.md` - Dokumentasi normalisasi jenjang pendidikan
- `FIX_EDUCATION_DISTRIBUTION_CHART.md` - Dokumentasi perbaikan chart pendidikan

## 📚 References

- [Recharts YAxis Documentation](https://recharts.org/en-US/api/YAxis)
- [Recharts BarChart Examples](https://recharts.org/en-US/examples/SimpleBarChart)

## ✅ Verification Checklist

- [x] Data sorting menggunakan `EDUCATION_ORDER` (SD=1 → S3=10)
- [x] Normalisasi jenjang pendidikan (SLTP→SMP, SLTA→SMA)
- [x] YAxis dengan `reversed={true}` untuk bar chart vertikal
- [x] Konsistensi antara tab ASN dan Non-ASN
- [x] Pie chart tetap berfungsi dengan baik (≤8 categories)
- [x] Bar chart menampilkan urutan yang benar (>8 categories)

---

**Dikerjakan oleh:** Kiro AI Assistant  
**Diverifikasi:** 13 Mei 2026  
**Status:** ✅ SELESAI - Urutan chart pendidikan sudah konsisten (SD → S3 dari atas ke bawah)
