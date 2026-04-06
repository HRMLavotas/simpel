# Tab Summary Peta Jabatan - Semua Unit Kerja

## Tanggal: 6 April 2026

## Overview

Menambahkan tab "Summary Semua Unit" di halaman Peta Jabatan yang menampilkan ringkasan ABK dan Existing dari semua unit kerja secara gabungan.

## Fitur

### 1. Summary Cards per Kategori Jabatan

Menampilkan 4 card untuk setiap kategori jabatan (Struktural, Fungsional, Pelaksana):

**Informasi per Card:**
- Total Existing / Total ABK
- Progress bar dengan warna dinamis:
  - Orange: Kurang pegawai (existing < ABK)
  - Blue: Lebih pegawai (existing > ABK)
  - Green: Sesuai ABK (existing = ABK)
- Persentase terisi
- Status gap (Kurang X, Lebih X, atau Sesuai ABK)

### 2. Filter dan Pencarian (NEW!)

Tab Summary memiliki filter dan pencarian independen yang tidak terpengaruh oleh tab lain:

**Search Box:**
- Mencari unit kerja atau nama jabatan
- Real-time filtering
- Clear button untuk reset pencarian

**Filter Kategori:**
- Semua Kategori (default)
- Struktural
- Fungsional
- Pelaksana

**Filter Status:**
- Semua Status (default)
- Kurang Pegawai (gap > 0)
- Sesuai ABK (gap = 0)
- Lebih Pegawai (gap < 0)

**Kombinasi Filter:**
- Semua filter dapat dikombinasikan
- Filter diterapkan pada kedua tabel (per unit kerja dan per jabatan)
- Empty state yang informatif saat tidak ada hasil

### 3. Tabel Summary per Unit Kerja

Tabel yang menampilkan ringkasan untuk setiap unit kerja:

**Kolom:**
- No
- Unit Kerja
- Total Jabatan (jumlah position_references)
- Total ABK (sum dari abk_count)
- Total Existing (jumlah pegawai yang match dengan jabatan)
- Gap (ABK - Existing)
- % Terisi
- Status (badge dengan warna)

**Fitur Tabel:**
- Hanya menampilkan unit kerja yang memiliki jabatan
- Sorting otomatis berdasarkan nama unit kerja
- Color-coded gap dan status
- Responsive design

### 4. Tabel Summary per Jabatan (NEW!)

Tabel yang menampilkan ringkasan untuk setiap jabatan dari semua unit kerja (gabungan):

**Kolom:**
- No
- Kategori (Struktural/Fungsional/Pelaksana)
- Nama Jabatan
- Total ABK (sum dari semua unit kerja)
- Total Existing (jumlah pegawai di semua unit kerja)
- Gap (ABK - Existing)
- % Terisi
- Status (badge dengan warna)

**Fitur Tabel:**
- Agregasi jabatan yang sama dari berbagai unit kerja
- Normalisasi nama jabatan untuk matching akurat
- Sorting: Kategori → Nama Jabatan (alfabetis)
- Menampilkan jabatan mana yang paling kekurangan/kelebihan pegawai
- Berguna untuk perencanaan rekrutmen per jabatan

## Implementasi Teknis

### State Management

```typescript
const [allPositions, setAllPositions] = useState<PositionReference[]>([]);
const [allEmployees, setAllEmployees] = useState<EmployeeMatch[]>([]);
const [isSummaryLoading, setIsSummaryLoading] = useState(false);

// Summary-specific filters (independent from other tabs)
const [summarySearchQuery, setSummarySearchQuery] = useState('');
const [summaryFilterCategory, setSummaryFilterCategory] = useState<string>('all');
const [summaryFilterStatus, setSummaryFilterStatus] = useState<string>('all');
```

### Data Fetching

**fetchSummaryData():**
- Fetch semua position_references dari semua unit kerja
- Fetch semua employees ASN dari semua unit kerja
- Menggunakan fetchAllUnlimited helper untuk handle data > 1000 rows
- Parallel fetching untuk performa optimal

**Trigger:**
- Otomatis fetch saat tab summary dibuka (useEffect dengan dependency activeTab)

### Matching Logic

**Normalisasi String:**
```typescript
const normalize = (str: string) => str.trim().toLowerCase().replace(/\s+/g, ' ');
```

**Matching Employees dengan Positions:**
- Buat Set dari normalized position names
- Filter employees yang position_name-nya ada di Set
- O(1) lookup untuk performa optimal

### Perhitungan Metrics

**Per Kategori:**
```typescript
const totalAbk = categoryPositions.reduce((sum, p) => sum + p.abk_count, 0);
const totalExisting = allEmployees.filter(emp => 
  emp.position_name && positionNames.has(normalize(emp.position_name))
).length;
const gap = totalAbk - totalExisting;
const percentage = totalAbk > 0 ? ((totalExisting / totalAbk) * 100).toFixed(1) : '0';
```

**Per Department:**
- Filter positions by department
- Filter employees by department AND matching position
- Calculate gap dan percentage

**Per Position (Across All Departments):**
```typescript
// Group positions by normalized name
const positionGroups = new Map<string, {
  category: string;
  displayName: string;
  totalAbk: number;
  totalExisting: number;
}>();

// Aggregate ABK from all departments
allPositions.forEach(pos => {
  const normName = normalize(pos.position_name);
  if (existing) {
    existing.totalAbk += pos.abk_count;
  } else {
    positionGroups.set(normName, { ... });
  }
});

// Count existing employees
allEmployees.forEach(emp => {
  const normName = normalize(emp.position_name);
  const group = positionGroups.get(normName);
  if (group) group.totalExisting++;
});
```

## UI/UX

### Tab Navigation
- Tab "Summary Semua Unit" ditambahkan setelah tab "Formasi Non-ASN"
- Lazy loading: data hanya di-fetch saat tab dibuka

### Loading State
- Spinner saat data sedang di-fetch
- Tidak mengganggu tab lain

### Color Coding
- Orange: Kurang pegawai (perlu rekrutmen)
- Blue: Lebih pegawai (over capacity)
- Green: Sesuai ABK (ideal)

### Responsive Design
- Cards: 1 kolom (mobile) → 2 kolom (tablet) → 4 kolom (desktop)
- Tabel: Horizontal scroll pada layar kecil

## Use Cases

### Use Case 1: Cari Unit Kerja Tertentu
Admin ingin melihat summary untuk unit kerja "Dinas Kesehatan":
1. Buka tab "Summary Semua Unit"
2. Ketik "kesehatan" di search box
3. Lihat hasil filtered untuk unit kerja yang mengandung "kesehatan"

### Use Case 2: Identifikasi Jabatan Struktural yang Kurang
Admin ingin fokus pada jabatan struktural yang kekurangan pegawai:
1. Filter Kategori: Pilih "Struktural"
2. Filter Status: Pilih "Kurang Pegawai"
3. Lihat tabel per jabatan untuk prioritas rekrutmen

### Use Case 3: Monitoring Unit Kerja yang Over Capacity
Pimpinan ingin tahu unit kerja mana yang kelebihan pegawai:
1. Filter Status: Pilih "Lebih Pegawai"
2. Lihat tabel per unit kerja
3. Identifikasi unit untuk redistribusi pegawai

### Use Case 4: Cari Jabatan Spesifik
Admin ingin melihat status jabatan "Analis":
1. Ketik "analis" di search box
2. Lihat semua jabatan yang mengandung kata "analis"
3. Lihat gap dan status untuk setiap jabatan

### Use Case 5: Monitoring Kebutuhan Rekrutmen per Unit Kerja
Admin Pusat ingin melihat unit kerja mana yang paling membutuhkan rekrutmen:
1. Buka tab "Summary Semua Unit"
2. Lihat tabel "Summary per Unit Kerja"
3. Sort by gap (descending)
4. Unit dengan gap positif terbesar = prioritas rekrutmen

### Use Case 6: Monitoring Kebutuhan Rekrutmen per Jabatan
Admin Pusat ingin tahu jabatan apa yang paling dibutuhkan:
1. Buka tab "Summary Semua Unit"
2. Lihat tabel "Summary per Jabatan"
3. Identifikasi jabatan dengan gap terbesar
4. Fokus rekrutmen pada jabatan tersebut

### Use Case 7: Evaluasi Distribusi Pegawai
Pimpinan ingin evaluasi apakah distribusi pegawai sudah merata:
1. Lihat summary cards untuk overview per kategori
2. Lihat tabel per unit kerja untuk detail distribusi
3. Lihat tabel per jabatan untuk identifikasi jabatan yang over/under capacity

### Use Case 8: Perencanaan Formasi Tahunan
Untuk perencanaan formasi tahun depan:
1. Export data dari tab summary
2. Analisis gap per unit kerja dan per jabatan
3. Buat proposal formasi berdasarkan data
4. Prioritaskan jabatan dengan gap terbesar

## Files Modified

**src/pages/PetaJabatan.tsx:**
- Tambah state: allPositions, allEmployees, isSummaryLoading
- Tambah fungsi: fetchSummaryData()
- Tambah useEffect untuk trigger fetch saat tab summary dibuka
- Tambah TabsTrigger untuk "Summary Semua Unit"
- Tambah TabsContent dengan summary cards dan tabel

## Performance Considerations

1. **Lazy Loading**: Data summary hanya di-fetch saat tab dibuka
2. **Parallel Fetching**: position_references dan employees di-fetch bersamaan
3. **Efficient Matching**: Menggunakan Set untuk O(1) lookup
4. **Batch Processing**: fetchAllUnlimited handle data besar dengan batching
5. **Memoization**: Perhitungan dilakukan sekali saat render

## Testing Checklist

- [x] Tab summary muncul di navigation
- [x] Data di-fetch saat tab dibuka
- [x] Loading state ditampilkan
- [x] Summary cards menampilkan data yang benar
- [x] Progress bar warna sesuai dengan gap
- [x] Search box berfungsi untuk unit kerja dan jabatan
- [x] Clear button pada search box berfungsi
- [x] Filter kategori berfungsi (Struktural/Fungsional/Pelaksana)
- [x] Filter status berfungsi (Kurang/Sesuai/Lebih)
- [x] Kombinasi filter bekerja dengan benar
- [x] Empty state ditampilkan saat tidak ada hasil
- [x] Filter summary tidak mempengaruhi tab lain
- [x] Tabel per unit kerja menampilkan semua unit yang punya jabatan
- [x] Tabel per jabatan menampilkan agregasi dari semua unit kerja
- [x] Jabatan yang sama dari berbagai unit di-aggregate dengan benar
- [x] Gap calculation benar (ABK - Existing)
- [x] Percentage calculation benar
- [x] Status badge warna sesuai
- [x] Sorting per jabatan: Kategori → Nama (alfabetis)
- [x] Responsive di mobile, tablet, desktop
- [x] Performance baik dengan 1000+ records

## Future Enhancements

- Export summary ke Excel (dengan 3 sheets: Cards, Per Unit, Per Jabatan)
- Filter by kategori jabatan
- Search/filter dalam tabel
- Drill-down: klik unit kerja untuk lihat detail
- Drill-down: klik jabatan untuk lihat distribusi per unit kerja
- Chart visualization (pie chart, bar chart)
- Historical comparison (bandingkan dengan bulan/tahun sebelumnya)
- Alert untuk unit/jabatan dengan gap > threshold tertentu
- Rekomendasi otomatis untuk redistribusi pegawai


---

## Update: Expandable Rows untuk Daftar Pemangku (6 April 2026)

### Fitur Baru
Di tabel "Summary per Jabatan", setiap baris jabatan sekarang dapat di-expand untuk menampilkan daftar pemangku jabatan tersebut dari semua unit kerja.

### Cara Kerja
1. User mencari jabatan (misalnya "Pengantar kerja")
2. Tabel menampilkan summary jabatan tersebut
3. Klik pada baris jabatan atau icon chevron untuk expand
4. Muncul daftar pemangku dengan informasi:
   - Nomor urut
   - Nama lengkap (dengan gelar)
   - Unit kerja
   - Status ASN (PNS/PPPK)

### Implementasi Teknis

#### 1. State Management
```typescript
const [expandedPositions, setExpandedPositions] = useState<Set<string>>(new Set());
```

#### 2. Toggle Function
```typescript
const togglePositionExpand = (positionName: string) => {
  setExpandedPositions(prev => {
    const newSet = new Set(prev);
    if (newSet.has(positionName)) {
      newSet.delete(positionName);
    } else {
      newSet.add(positionName);
    }
    return newSet;
  });
};
```

#### 3. Tabel dengan Expandable Rows
- Kolom chevron di awal tabel (sebelum kolom No)
- Icon ChevronRight (▶) untuk collapsed
- Icon ChevronDown (▼) untuk expanded
- Baris dapat diklik untuk toggle expand/collapse
- Background highlight untuk baris yang di-expand
- Hanya menampilkan chevron jika ada pemangku

#### 4. Detail Pemangku
Ketika di-expand, menampilkan:
- Header: "Daftar Pemangku (X orang)"
- Card untuk setiap pemangku dengan:
  - Nomor urut dan nama lengkap
  - Unit kerja dan status ASN
  - Border dan background untuk visual hierarchy

### UI/UX

#### Visual Hierarchy
```
┌─────────────────────────────────────────────────────────┐
│ ▶ 1  Struktural  Pengantar Kerja  5  3  -2  60%  Kurang│
├─────────────────────────────────────────────────────────┤
│ ▼ 2  Fungsional  Analis Data     10 12  +2  120% Lebih │
│   Daftar Pemangku (12 orang):                           │
│   ┌───────────────────────────────────────────────────┐ │
│   │ 1. Dr. Ahmad Wijaya, S.Kom, M.T.                  │ │
│   │    Unit: Dinas Pendidikan • Status: PNS          │ │
│   └───────────────────────────────────────────────────┘ │
│   ┌───────────────────────────────────────────────────┐ │
│   │ 2. Siti Nurhaliza, S.E.                           │ │
│   │    Unit: Dinas Kesehatan • Status: PPPK          │ │
│   └───────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

#### Interaksi
- Hover effect pada baris utama (bg-muted/50)
- Cursor pointer untuk menunjukkan baris dapat diklik
- Background berbeda untuk baris yang di-expand (bg-muted/30)
- Expanded content dengan background bg-muted/20
- Smooth transition saat expand/collapse

### Keunggulan
1. **Informasi Lengkap**: User dapat melihat detail pemangku tanpa pindah halaman
2. **Efficient**: Data sudah tersedia dari `allEmployees`, tidak perlu query tambahan
3. **User-Friendly**: Expand/collapse dengan satu klik di mana saja pada baris
4. **Responsive**: Tetap berfungsi baik di mobile dan desktop
5. **Searchable**: Filter pencarian tetap berfungsi dengan baik
6. **Smart Display**: Hanya menampilkan chevron jika ada pemangku

### Filter dan Pencarian
Fitur expandable rows bekerja dengan semua filter:
- Search query (cari nama jabatan atau unit kerja)
- Filter kategori (Struktural/Fungsional/Pelaksana)
- Filter status (Kurang/Sesuai/Lebih)

### Data yang Ditampilkan
Untuk setiap pemangku:
- Nama lengkap dengan gelar depan dan belakang
- Unit kerja (department)
- Status ASN (PNS/PPPK)
- Nomor urut dalam daftar

### Technical Details
- Menggunakan `flatMap` untuk generate main row + expanded rows
- Normalisasi nama jabatan untuk matching yang akurat
- Filter employees berdasarkan normalized position name
- State management dengan Set untuk efficient lookup
- Click handler pada entire row untuk better UX

---

## Files Modified
1. `src/pages/PetaJabatan.tsx` - Added expandable rows functionality
   - New state: `expandedPositions`
   - New function: `togglePositionExpand`
   - Updated table structure with chevron column
   - Added expanded row content with employee details
