# ✅ Pemisahan Tab Summary ASN dan Non-ASN

## Status: SELESAI (Updated)

## Update Terbaru

### Tombol Export di Tab Summary Non-ASN
- ✅ Tombol "Export Summary Non-ASN" ditambahkan di CardHeader
- ✅ Fungsi `handleExportSummaryNonASN()` untuk export data Non-ASN
- ✅ Multi-sheet Excel: Summary per Unit, Summary per Jabatan, Summary per Type
- ✅ Filename dinamis berdasarkan role user

## Perubahan yang Dilakukan

### 1. Struktur Tab Baru

#### Sebelum:
```
┌─────────────────────────────────────────────────────┐
│ Tabs:                                               │
│ [Peta Jabatan ASN] [Formasi Non-ASN] [Summary]     │
│                                                     │
│ Tab Summary berisi:                                 │
│ - Summary ASN (cards + tables)                      │
│ - Summary Non-ASN (cards + tables)                  │
└─────────────────────────────────────────────────────┘
```

#### Sesudah:
```
┌─────────────────────────────────────────────────────┐
│ Tabs:                                               │
│ [Peta Jabatan ASN] [Formasi Non-ASN]               │
│ [Summary ASN] [Summary Non-ASN]                     │
│                                                     │
│ Tab Summary ASN berisi:                             │
│ - Summary ASN (cards + tables)                      │
│                                                     │
│ Tab Summary Non-ASN berisi:                         │
│ - Summary Non-ASN (cards + tables)                  │
│ - Expandable rows untuk daftar pemangku ✨ NEW      │
└─────────────────────────────────────────────────────┘
```

### 2. Fitur Expandable Rows di Summary Non-ASN

**Tabel "Summary per Jabatan" sekarang memiliki:**
- ✅ Kolom expand button (chevron icon)
- ✅ Click untuk expand/collapse
- ✅ Menampilkan daftar pemangku jabatan
- ✅ Informasi: nama lengkap, unit kerja, type Non-ASN
- ✅ Konsisten dengan Summary ASN

## Implementasi Teknis

### 1. Update Type activeTab
```typescript
// Before
const [activeTab, setActiveTab] = useState<'asn' | 'non-asn' | 'summary'>('asn');

// After
const [activeTab, setActiveTab] = useState<'asn' | 'non-asn' | 'summary-asn' | 'summary-non-asn'>('asn');
```

### 2. Update TabsList
```typescript
<TabsList>
  <TabsTrigger value="asn">Peta Jabatan ASN</TabsTrigger>
  <TabsTrigger value="non-asn">Formasi Non-ASN</TabsTrigger>
  <TabsTrigger value="summary-asn">Summary ASN</TabsTrigger>
  <TabsTrigger value="summary-non-asn">Summary Non-ASN</TabsTrigger>
</TabsList>
```

### 3. Update useEffect untuk Fetch Data
```typescript
useEffect(() => {
  if (activeTab === 'summary-asn' || activeTab === 'summary-non-asn') {
    fetchSummaryData();
  }
}, [activeTab]);
```

### 4. Pisahkan TabsContent
```typescript
// Tab Summary ASN
<TabsContent value="summary-asn">
  {/* Summary ASN content */}
</TabsContent>

// Tab Summary Non-ASN
<TabsContent value="summary-non-asn">
  {/* Summary Non-ASN content */}
</TabsContent>
```

### 5. Expandable Rows di Summary Non-ASN

**Struktur Data:**
```typescript
const positionGroups = new Map<string, {
  displayName: string;
  total: number;
  tenagaAlihDaya: number;
  lainnya: number;
  departments: Set<string>;
  employees: EmployeeMatch[];  // ✅ Added
}>();
```

**Render Logic:**
```typescript
const rows: JSX.Element[] = [];
sortedPositions.forEach(([normName, pos], idx) => {
  const isExpanded = expandedPositions.has(normName);
  
  // Main row with expand button
  rows.push(
    <TableRow key={normName}>
      <TableCell>
        <Button onClick={() => togglePositionExpand(normName)}>
          {isExpanded ? <ChevronDown /> : <ChevronRight />}
        </Button>
      </TableCell>
      {/* ... other cells ... */}
    </TableRow>
  );
  
  // Expanded row showing employees
  if (isExpanded && pos.employees.length > 0) {
    rows.push(
      <TableRow key={`${normName}-expanded`}>
        <TableCell colSpan={...}>
          {/* List of employees */}
        </TableCell>
      </TableRow>
    );
  }
});
```

**Employee Card:**
```typescript
<div className="flex items-center justify-between p-2 bg-background rounded border">
  <div className="flex-1">
    <div className="font-medium">{empIdx + 1}. {fullName}</div>
    <div className="text-xs text-muted-foreground">
      {emp.department && <span>Unit: {emp.department}</span>}
      {emp.rank_group && <span className="ml-3">Type: {emp.rank_group}</span>}
    </div>
  </div>
</div>
```

## Tampilan UI

### Tab Summary ASN
```
┌────────────────────────────────────────────────────────────┐
│ Summary Peta Jabatan ASN - Semua Unit Kerja                │
│ (Gabungan dari semua unit kerja)          [Export Summary] │
└────────────────────────────────────────────────────────────┘

📊 Summary Cards (4 cards: Struktural, Fungsional, Pelaksana)

📋 Summary per Unit Kerja (hanya Admin Pusat/Pimpinan)
📋 Summary per Jabatan (dengan expandable rows)
📋 Summary per Kategori
```

### Tab Summary Non-ASN
```
┌────────────────────────────────────────────────────────────┐
│ Summary Pegawai Non-ASN - Semua Unit Kerja                 │
│ (Gabungan dari semua unit kerja)                           │
└────────────────────────────────────────────────────────────┘

📊 Summary Cards (3 cards: Total, Tenaga Alih Daya, Lainnya)

📋 Summary per Unit Kerja (hanya Admin Pusat/Pimpinan)

📋 Summary per Jabatan (dengan expandable rows ✨)
┌────┬────┬──────────────┬───────┬──────────┬─────────┬──────┐
│ ▼  │ No │ Jabatan      │ Total │ Tenaga   │ Lainnya │ Unit │
│    │    │              │       │ Alih Daya│         │      │
├────┼────┼──────────────┼───────┼──────────┼─────────┼──────┤
│ ▶  │ 1  │ Pengemudi    │ 12    │ 12       │ 0       │ 3    │
├────┴────┴──────────────┴───────┴──────────┴─────────┴──────┤
│ Daftar Pemangku (12 orang):                                │
│ ┌────────────────────────────────────────────────────────┐ │
│ │ 1. Ahmad Suryadi                                       │ │
│ │    Unit: Setditjen Binalavotas  Type: Tenaga Alih Daya│ │
│ └────────────────────────────────────────────────────────┘ │
│ ┌────────────────────────────────────────────────────────┐ │
│ │ 2. Budi Santoso                                        │ │
│ │    Unit: Direktorat Bina Marga  Type: Tenaga Alih Daya│ │
│ └────────────────────────────────────────────────────────┘ │
│ ...                                                         │
└─────────────────────────────────────────────────────────────┘
```

## Manfaat

### 1. Separation of Concerns
- ✅ Summary ASN dan Non-ASN terpisah dengan jelas
- ✅ Tidak ada scroll panjang dalam satu tab
- ✅ Fokus pada satu jenis data per tab

### 2. Better Navigation
- ✅ User bisa langsung ke summary yang diinginkan
- ✅ Tab label yang jelas: "Summary ASN" vs "Summary Non-ASN"
- ✅ Tidak perlu scroll untuk mencari section

### 3. Consistent UX
- ✅ Expandable rows di kedua summary (ASN dan Non-ASN)
- ✅ Pattern yang sama untuk menampilkan detail
- ✅ User familiar dengan interaction

### 4. Scalability
- ✅ Mudah menambahkan fitur baru per tab
- ✅ Tidak ada coupling antara Summary ASN dan Non-ASN
- ✅ Bisa menambahkan export per tab di masa depan

### 5. Performance
- ✅ Hanya render data yang diperlukan per tab
- ✅ Tidak render semua data sekaligus
- ✅ Fetch data hanya ketika tab aktif

## Testing Checklist

### Tab Summary ASN
- [ ] Klik tab "Summary ASN"
- [ ] Verifikasi title: "Summary Peta Jabatan ASN - ..."
- [ ] Verifikasi summary cards ASN ditampilkan
- [ ] Verifikasi tabel Summary per Unit (untuk Admin Pusat/Pimpinan)
- [ ] Verifikasi tabel Summary per Jabatan
- [ ] Test expand/collapse rows di tabel per Jabatan
- [ ] Verifikasi daftar pemangku ditampilkan saat expand
- [ ] Verifikasi tabel Summary per Kategori

### Tab Summary Non-ASN
- [ ] Klik tab "Summary Non-ASN"
- [ ] Verifikasi title: "Summary Pegawai Non-ASN - ..."
- [ ] Verifikasi summary cards Non-ASN ditampilkan (3 cards)
- [ ] Verifikasi tabel Summary per Unit (untuk Admin Pusat/Pimpinan)
- [ ] Verifikasi tabel Summary per Jabatan
- [ ] Test expand/collapse rows di tabel per Jabatan ✨
- [ ] Verifikasi daftar pemangku ditampilkan saat expand ✨
- [ ] Verifikasi informasi: nama, unit, type Non-ASN ✨
- [ ] Verifikasi empty state jika tidak ada data

### Expandable Rows (Summary Non-ASN)
- [ ] Click chevron icon untuk expand
- [ ] Verifikasi icon berubah dari ChevronRight → ChevronDown
- [ ] Verifikasi daftar pemangku muncul
- [ ] Verifikasi format: "1. Nama Lengkap"
- [ ] Verifikasi info: "Unit: ... Type: ..."
- [ ] Click lagi untuk collapse
- [ ] Verifikasi daftar pemangku hilang
- [ ] Test expand multiple rows sekaligus
- [ ] Verifikasi state expand persistent saat switch tab

### Cross-Tab Navigation
- [ ] Switch dari tab ASN ke Summary ASN
- [ ] Switch dari tab Non-ASN ke Summary Non-ASN
- [ ] Switch antara Summary ASN dan Summary Non-ASN
- [ ] Verifikasi data loading hanya sekali per tab
- [ ] Verifikasi expand state tidak reset saat switch tab

### Role-Based Access
- [ ] Test sebagai Admin Pusat (canViewAll = true)
- [ ] Verifikasi tabel "Summary per Unit" ditampilkan di kedua summary
- [ ] Verifikasi kolom "Jumlah Unit" ditampilkan
- [ ] Test sebagai Admin Unit (canViewAll = false)
- [ ] Verifikasi tabel "Summary per Unit" TIDAK ditampilkan
- [ ] Verifikasi kolom "Jumlah Unit" TIDAK ditampilkan
- [ ] Verifikasi data hanya dari unit mereka

## Status
✅ **SELESAI** - Tab Summary sudah dipisah dan expandable rows sudah ditambahkan di Summary Non-ASN
