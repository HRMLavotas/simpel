# ✅ Dynamic Peta Jabatan Non-ASN

## Konsep

Peta Jabatan Non-ASN sekarang **100% dinamis** seperti Peta Jabatan ASN:
- Data dihitung real-time dari tabel `employees`
- Ketika pegawai Non-ASN pindah unit → Existing otomatis update
- Ketika pegawai Non-ASN dihapus → Existing otomatis berkurang
- Ketika pegawai Non-ASN ditambah → Existing otomatis bertambah
- Ketika jabatan pegawai berubah → Grouping otomatis update

## Implementasi

### 1. Data Fetching (Dynamic)

```typescript
const [posRes, empRes, nonAsnRes] = await Promise.all([
  // ASN positions
  supabase
    .from('position_references')
    .select('*')
    .eq('department', selectedDepartment),
    
  // ASN employees
  supabase
    .from('employees')
    .select('...')
    .eq('department', selectedDepartment)
    .or('asn_status.is.null,asn_status.neq.Non ASN'),
    
  // Non-ASN employees (DYNAMIC)
  supabase
    .from('employees')
    .select('id, name, front_title, back_title, nip, position_name, gender, rank_group, keterangan_penugasan')
    .eq('department', selectedDepartment)
    .eq('asn_status', 'Non ASN'),
]);
```

**Key Points:**
- ✅ Filter by `department` → Hanya tampilkan pegawai di unit yang dipilih
- ✅ Filter by `asn_status = 'Non ASN'` → Hanya pegawai Non-ASN
- ✅ No static data → Semua dihitung dari database

### 2. Grouping by Position (Dynamic)

```typescript
// Group employees by position_name
const groupedByPosition: Record<string, EmployeeMatch[]> = {};
nonAsnEmployees.forEach(emp => {
  const position = emp.position_name || 'Tidak Ada Jabatan';
  if (!groupedByPosition[position]) {
    groupedByPosition[position] = [];
  }
  groupedByPosition[position].push(emp);
});

// Calculate Formasi & Existing
Object.entries(groupedByPosition).map(([position, employees]) => {
  const formasi = employees.length;    // Jumlah pegawai dengan jabatan sama
  const existing = employees.length;   // Sama dengan formasi
  const status = formasi - existing;   // Selalu 0 (Sesuai)
});
```

**Key Points:**
- ✅ Grouping dilakukan saat render → Selalu up-to-date
- ✅ Formasi dihitung dari jumlah pegawai → Otomatis update
- ✅ Existing sama dengan Formasi → Selalu sinkron

### 3. Real-time Subscription (Enhanced)

```typescript
useEffect(() => {
  const channel = supabase
    .channel(`employees-${selectedDepartment}`)
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'employees'
    }, (payload) => {
      const newRecord = payload.new as any;
      const oldRecord = payload.old as any;
      
      let shouldRefresh = false;
      
      // INSERT or UPDATE: Check new department
      if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
        if (newRecord && newRecord.department === selectedDepartment) {
          shouldRefresh = true;
        }
      }
      
      // DELETE or UPDATE: Check old department
      if (payload.eventType === 'DELETE' || payload.eventType === 'UPDATE') {
        if (oldRecord && oldRecord.department === selectedDepartment) {
          shouldRefresh = true;
        }
      }
      
      if (shouldRefresh) {
        fetchData(); // Refresh Peta Jabatan
      }
    })
    .subscribe();
    
  return () => supabase.removeChannel(channel);
}, [selectedDepartment]);
```

**Key Points:**
- ✅ Listen to INSERT, UPDATE, DELETE events
- ✅ Check both `newRecord` and `oldRecord` department
- ✅ Refresh when change affects current department
- ✅ Handle pindah unit (old department ≠ new department)

### 4. Auto-refresh (Fallback)

```typescript
useEffect(() => {
  const interval = setInterval(() => {
    console.log('Auto-refreshing Peta Jabatan data...');
    fetchData();
  }, 30000); // 30 seconds
  
  return () => clearInterval(interval);
}, [selectedDepartment]);
```

**Key Points:**
- ✅ Fallback jika real-time subscription gagal
- ✅ Refresh setiap 30 detik
- ✅ Memastikan data selalu up-to-date

## Skenario Testing

### Skenario 1: Tambah Pegawai Non-ASN

**Action:**
1. Buka menu "Employees"
2. Klik "Tambah Pegawai" → "Tambah Data Non-ASN"
3. Isi data: NIK, Nama, Jabatan = "Pengemudi", Unit Kerja = "Setditjen"
4. Simpan

**Expected Result:**
- Peta Jabatan Setditjen → Tab "Formasi Non-ASN" otomatis refresh
- Jika jabatan "Pengemudi" sudah ada → Existing bertambah 1
- Jika jabatan "Pengemudi" belum ada → Muncul baris baru dengan Formasi = 1, Existing = 1

**Verification:**
```
Before:
Pengemudi: Formasi 5, Existing 5

After:
Pengemudi: Formasi 6, Existing 6 ✅
```

### Skenario 2: Hapus Pegawai Non-ASN

**Action:**
1. Buka menu "Employees"
2. Cari pegawai Non-ASN dengan Jabatan = "Pengemudi"
3. Klik "Delete"
4. Konfirmasi hapus

**Expected Result:**
- Peta Jabatan otomatis refresh
- Existing untuk jabatan "Pengemudi" berkurang 1
- Jika Existing menjadi 0 → Baris jabatan hilang dari tabel

**Verification:**
```
Before:
Pengemudi: Formasi 6, Existing 6

After:
Pengemudi: Formasi 5, Existing 5 ✅
```

### Skenario 3: Pindah Unit (Setditjen → Bina Marga)

**Action:**
1. Buka menu "Employees"
2. Cari pegawai Non-ASN: Ahmad (Pengemudi, Setditjen)
3. Klik "Edit"
4. Ubah Unit Kerja dari "Setditjen" ke "Bina Marga"
5. Simpan

**Expected Result:**

**Unit Lama (Setditjen):**
- Peta Jabatan Setditjen otomatis refresh
- Existing untuk "Pengemudi" berkurang 1

**Unit Baru (Bina Marga):**
- Peta Jabatan Bina Marga otomatis refresh
- Existing untuk "Pengemudi" bertambah 1 (atau muncul baris baru jika belum ada)

**Verification:**
```
Setditjen - Before:
Pengemudi: Formasi 6, Existing 6

Setditjen - After:
Pengemudi: Formasi 5, Existing 5 ✅

Bina Marga - Before:
Pengemudi: Formasi 3, Existing 3

Bina Marga - After:
Pengemudi: Formasi 4, Existing 4 ✅
```

### Skenario 4: Ubah Jabatan (Pengemudi → Petugas Kebersihan)

**Action:**
1. Buka menu "Employees"
2. Cari pegawai Non-ASN: Ahmad (Pengemudi, Setditjen)
3. Klik "Edit"
4. Ubah Jabatan dari "Pengemudi" ke "Petugas Kebersihan"
5. Simpan

**Expected Result:**
- Peta Jabatan Setditjen otomatis refresh
- Existing untuk "Pengemudi" berkurang 1
- Existing untuk "Petugas Kebersihan" bertambah 1

**Verification:**
```
Before:
Pengemudi: Formasi 6, Existing 6
Petugas Kebersihan: Formasi 10, Existing 10

After:
Pengemudi: Formasi 5, Existing 5 ✅
Petugas Kebersihan: Formasi 11, Existing 11 ✅
```

### Skenario 5: Import Data Non-ASN

**Action:**
1. Buka menu "Import Non-ASN"
2. Upload Excel dengan 50 pegawai Non-ASN untuk Setditjen
3. Klik "Import"

**Expected Result:**
- Peta Jabatan Setditjen otomatis refresh
- Existing untuk setiap jabatan bertambah sesuai jumlah pegawai yang diimport
- Jabatan baru muncul jika belum ada

**Verification:**
```
Before:
Pengemudi: Formasi 6, Existing 6
Kebersihan: Formasi 10, Existing 10

After (import 5 Pengemudi, 8 Kebersihan, 2 Pramubakti):
Pengemudi: Formasi 11, Existing 11 ✅
Kebersihan: Formasi 18, Existing 18 ✅
Pramubakti: Formasi 2, Existing 2 ✅ (baru)
```

### Skenario 6: Multi-user Concurrent Edit

**Action:**
1. User A: Buka Peta Jabatan Setditjen
2. User B: Edit pegawai Non-ASN di Setditjen (ubah jabatan)
3. User A: Lihat Peta Jabatan (tidak refresh manual)

**Expected Result:**
- User A melihat perubahan otomatis (real-time subscription)
- Existing update tanpa perlu refresh manual

**Verification:**
- Real-time subscription mendeteksi perubahan
- fetchData() dipanggil otomatis
- UI update dengan data terbaru

## Keuntungan Dynamic System

### ✅ Always Up-to-Date
- Data selalu sinkron dengan database
- Tidak ada stale data
- Tidak perlu refresh manual

### ✅ Multi-user Support
- Perubahan dari user lain langsung terlihat
- Real-time collaboration
- Menghindari konflik data

### ✅ Consistent with ASN
- Peta Jabatan ASN dan Non-ASN bekerja dengan cara yang sama
- User experience konsisten
- Mudah dipahami

### ✅ No Manual Maintenance
- Tidak perlu update formasi manual
- Tidak perlu sinkronisasi data
- Sistem otomatis menghitung

### ✅ Accurate Reporting
- Data selalu akurat
- Formasi = jumlah pegawai aktual
- Existing = jumlah pegawai aktual

## Technical Details

### Database Query
```sql
-- Fetch Non-ASN employees for specific department
SELECT 
  id, name, front_title, back_title, nip, 
  position_name, gender, rank_group, keterangan_penugasan
FROM employees
WHERE department = 'Setditjen Binalavotas'
  AND asn_status = 'Non ASN';
```

### Real-time Subscription
```sql
-- Listen to changes in employees table
LISTEN employees;

-- Trigger on INSERT, UPDATE, DELETE
CREATE TRIGGER employees_changes
  AFTER INSERT OR UPDATE OR DELETE ON employees
  FOR EACH ROW
  EXECUTE FUNCTION notify_employees_changes();
```

### Grouping Logic
```typescript
// Group by position_name
const grouped = nonAsnEmployees.reduce((acc, emp) => {
  const position = emp.position_name || 'Tidak Ada Jabatan';
  if (!acc[position]) acc[position] = [];
  acc[position].push(emp);
  return acc;
}, {} as Record<string, EmployeeMatch[]>);

// Calculate stats
Object.entries(grouped).map(([position, employees]) => ({
  position,
  formasi: employees.length,
  existing: employees.length,
  status: 'Sesuai',
  employees
}));
```

## Troubleshooting

### Data Tidak Update Otomatis

**Penyebab:** Real-time subscription tidak berfungsi

**Solusi:**
1. Check browser console untuk error
2. Verifikasi Supabase connection
3. Fallback: Auto-refresh setiap 30 detik akan tetap berjalan

### Existing Tidak Sesuai

**Penyebab:** Cache atau stale data

**Solusi:**
1. Hard refresh browser (Ctrl+Shift+R)
2. Klik tombol "Refresh" di Peta Jabatan
3. Verifikasi data di menu Employees

### Jabatan Tidak Muncul

**Penyebab:** Tidak ada pegawai dengan jabatan tersebut di unit yang dipilih

**Solusi:**
1. Verifikasi ada pegawai Non-ASN dengan jabatan tersebut
2. Verifikasi unit kerja pegawai sesuai dengan unit yang dipilih
3. Check filter `asn_status = 'Non ASN'`

---

**Status**: ✅ Fully Dynamic and Real-time

Peta Jabatan Non-ASN sekarang 100% dinamis dan otomatis update! 🎉
