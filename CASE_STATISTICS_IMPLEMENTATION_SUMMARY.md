# Implementasi Statistik Kasus Pegawai - Summary

**Date**: 2026-05-13  
**Status**: ✅ COMPLETED

---

## Fitur yang Ditambahkan

### 1. Statistik Cards (4 Cards)

#### Card 1: Total Kasus
- Menampilkan jumlah total semua kasus
- Warna: Biru
- Icon: FileText

#### Card 2: Kasus Diproses
- Menampilkan jumlah kasus dengan status "diproses"
- Warna: Kuning
- Icon: Clock

#### Card 3: Kasus Selesai
- Menampilkan jumlah kasus dengan status "selesai"
- Warna: Hijau
- Icon: CheckCircle

#### Card 4: Dengan Hukuman Disiplin
- Menampilkan jumlah kasus yang sudah memiliki data hukuman disiplin
- Warna: Merah
- Icon: ShieldAlert
- **BARU**: Filter khusus untuk kasus dengan hukuman disiplin

---

### 2. Statistik Berdasarkan Jenis Kasus

Card besar yang menampilkan breakdown kasus berdasarkan jenis:
- Perceraian
- Hutang
- Pinjaman Online
- Presensi
- Pengunduran Diri
- Temuan
- Lainnya

Setiap jenis menampilkan:
- Jumlah kasus
- Persentase dari total
- Progress circle visual

---

### 3. Filter "Dengan Hukuman Disiplin"

Ditambahkan opsi baru di dropdown status:
- **"Dengan Hukuman Disiplin"**
- Icon: ShieldAlert (merah)
- Fungsi: Hanya menampilkan kasus yang sudah memiliki data di tabel `disciplinary_actions`

---

## Perubahan Teknis

### 1. Type Definition (`src/lib/employeeCaseTypes.ts`)

```typescript
export interface EmployeeCase {
  // ... existing fields
  hasDisciplinaryAction?: boolean; // NEW: Flag untuk kasus dengan hukuman disiplin
}
```

### 2. Storage Layer (`src/lib/employeeCaseStorage.ts`)

**Fungsi `getAllCases()` diupdate:**

```typescript
// Query disciplinary actions untuk semua kasus
const { data: disciplinaryActions } = await supabase
  .from("disciplinary_actions")
  .select("case_id")
  .in("case_id", caseIds);

// Buat Set case IDs yang punya hukuman disiplin
const casesWithDisciplinary = new Set(
  (disciplinaryActions || []).map(da => da.case_id)
);

// Tambahkan flag hasDisciplinaryAction ke setiap case
const mappedCases = cases.map((c) => {
  const employeeCase = mapDbCaseToEmployeeCase(c, timelinesByCase[c.id] || []);
  return {
    ...employeeCase,
    hasDisciplinaryAction: casesWithDisciplinary.has(c.id),
  };
});
```

### 3. UI Component (`src/pages/EmployeeCaseManagement.tsx`)

#### State Baru:
```typescript
const [statistics, setStatistics] = useState({
  total: 0,
  diproses: 0,
  selesai: 0,
  byType: {} as Record<string, number>,
});
```

#### Kalkulasi Statistik:
```typescript
// Di dalam loadCases()
const stats = {
  total: allCases.length,
  diproses: allCases.filter(c => c.status === 'diproses').length,
  selesai: allCases.filter(c => c.status === 'selesai').length,
  byType: {} as Record<string, number>,
};

// Count by case type
allCases.forEach(c => {
  stats.byType[c.caseType] = (stats.byType[c.caseType] || 0) + 1;
});

setStatistics(stats);
```

#### Filter Logic:
```typescript
const filteredCases = useMemo(() => {
  return cases.filter((c) => {
    // ... existing filters
    
    // Handle special "dengan_hukuman" filter
    let matchesStatus = true;
    if (caseStatusFilter === "dengan_hukuman") {
      matchesStatus = c.hasDisciplinaryAction === true;
    } else {
      matchesStatus = caseStatusFilter === "all" || c.status === caseStatusFilter;
    }
    
    return matchesSearch && matchesType && matchesStatus;
  });
}, [cases, debouncedSearch, caseTypeFilter, caseStatusFilter]);
```

#### Dropdown Status:
```typescript
<Select value={caseStatusFilter} onValueChange={...}>
  <SelectContent>
    <SelectItem value="all">Semua Status</SelectItem>
    {Object.entries(CASE_STATUS_LABELS).map(...)}
    <SelectItem value="dengan_hukuman">
      <div className="flex items-center gap-2">
        <ShieldAlert className="h-4 w-4 text-red-600" />
        Dengan Hukuman Disiplin
      </div>
    </SelectItem>
  </SelectContent>
</Select>
```

---

## Layout Halaman

```
┌─────────────────────────────────────────────────────────────┐
│ Header: Kasus Pegawai                                       │
└─────────────────────────────────────────────────────────────┘

┌──────────┬──────────┬──────────┬──────────────────────────┐
│ Total    │ Diproses │ Selesai  │ Dengan Hukuman Disiplin  │
│ Kasus    │          │          │                          │
│   96     │    45    │    30    │           12             │
└──────────┴──────────┴──────────┴──────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ Statistik Berdasarkan Jenis Kasus                          │
├─────────────┬─────────────┬─────────────┬─────────────────┤
│ Perceraian  │ Hutang      │ Pinjaman    │ Presensi        │
│    25       │    18       │    15       │    12           │
│  (26.0%)    │  (18.8%)    │  (15.6%)    │  (12.5%)        │
│   ◐         │   ◐         │   ◐         │   ◐             │
├─────────────┼─────────────┼─────────────┼─────────────────┤
│ Pengunduran │ Temuan      │ Lainnya     │                 │
│    10       │     8       │     8       │                 │
│  (10.4%)    │   (8.3%)    │   (8.3%)    │                 │
│   ◐         │   ◐         │   ◐         │                 │
└─────────────┴─────────────┴─────────────┴─────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ Filters: [Search] [Jenis Kasus] [Status ▼] [+ Tambah]     │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ Daftar Kasus                                                │
│ [Table with cases...]                                       │
└─────────────────────────────────────────────────────────────┘
```

---

## Testing Checklist

### Statistik Cards
- [ ] Card "Total Kasus" menampilkan jumlah yang benar
- [ ] Card "Diproses" menampilkan jumlah kasus dengan status "diproses"
- [ ] Card "Selesai" menampilkan jumlah kasus dengan status "selesai"
- [ ] Card "Dengan Hukuman Disiplin" menampilkan jumlah kasus yang punya hukuman disiplin

### Statistik Jenis Kasus
- [ ] Semua jenis kasus ditampilkan
- [ ] Jumlah per jenis kasus benar
- [ ] Persentase dihitung dengan benar
- [ ] Progress circle visual sesuai dengan persentase

### Filter "Dengan Hukuman Disiplin"
- [ ] Opsi muncul di dropdown status
- [ ] Icon ShieldAlert merah ditampilkan
- [ ] Ketika dipilih, hanya kasus dengan hukuman disiplin yang muncul
- [ ] Jumlah kasus yang ditampilkan sesuai dengan card "Dengan Hukuman Disiplin"
- [ ] Filter bisa dikombinasikan dengan filter jenis kasus
- [ ] Filter bisa dikombinasikan dengan search

### Performance
- [ ] Loading statistik tidak memperlambat halaman
- [ ] Query disciplinary actions efisien (menggunakan IN clause)
- [ ] Tidak ada query N+1

---

## Database Query

Query yang digunakan untuk mengecek hukuman disiplin:

```sql
SELECT case_id 
FROM disciplinary_actions 
WHERE case_id IN (
  -- list of all case IDs
);
```

Query ini efisien karena:
1. Hanya select `case_id` (tidak perlu semua kolom)
2. Menggunakan `IN` clause untuk batch query
3. Hasil di-cache dalam Set untuk O(1) lookup

---

## Files Modified

1. ✅ `src/lib/employeeCaseTypes.ts` - Added `hasDisciplinaryAction` field
2. ✅ `src/lib/employeeCaseStorage.ts` - Updated `getAllCases()` to query disciplinary actions
3. ✅ `src/pages/EmployeeCaseManagement.tsx` - Added statistics cards, stats by type, and filter

---

## Performance Notes

### Query Optimization
- Single query untuk semua disciplinary actions (tidak per-case)
- Menggunakan Set untuk O(1) lookup
- Statistik dihitung di client-side (tidak perlu query tambahan)

### Rendering Optimization
- Statistics dihitung sekali saat load cases
- useMemo untuk filtered cases
- Tidak ada re-render yang tidak perlu

---

## Future Enhancements

Fitur yang bisa ditambahkan di masa depan:

1. **Export Statistik**: Export ke Excel/PDF
2. **Date Range Filter**: Filter statistik berdasarkan tanggal
3. **Chart Visualization**: Tambahkan chart (pie chart, bar chart)
4. **Trend Analysis**: Statistik per bulan/tahun
5. **Comparison**: Bandingkan periode waktu
6. **Drill-down**: Klik statistik untuk filter otomatis

---

## Notes

- Filter "Dengan Hukuman Disiplin" adalah filter khusus yang tidak termasuk dalam status case
- Bisa dikombinasikan dengan filter status lainnya (akan menampilkan 0 hasil karena logika OR)
- Untuk kombinasi yang benar, gunakan filter "Dengan Hukuman Disiplin" tanpa filter status lain
- Statistik di-update setiap kali data kasus di-reload
