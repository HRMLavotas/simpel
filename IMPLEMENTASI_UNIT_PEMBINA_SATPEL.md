# Implementasi Unit Pembina - Satpel/Workshop

## 📋 Overview

Sistem untuk mengelola hubungan parent-child antara Unit Pembina (BBPVP/BPVP) dengan Satpel/Workshop yang dibinanya, memungkinkan Admin Unit Pembina untuk mengelola data pegawai di Satpel/Workshop yang menjadi tanggung jawabnya.

## ✅ Yang Sudah Diimplementasikan

### 1. Penambahan 2 Satpel Baru

**File:** `src/lib/constants.ts`

Ditambahkan ke `DEPARTMENTS`:
- ✅ **Satpel Kotawaringin Timur** (Unit Pembina: BBPVP Bekasi)
- ✅ **Satpel Bali** (Unit Pembina: BPVP Lombok Timur)

**Total Satpel/Workshop:** 15 unit
- 13 Satpel
- 3 Workshop (Prabumulih, Batam, Gorontalo)

### 2. Mapping Unit Pembina

**Konstanta:** `UNIT_PEMBINA_MAPPING`

Mapping lengkap 15 Satpel/Workshop dengan unit pembinanya:

```typescript
export const UNIT_PEMBINA_MAPPING: Record<string, string> = {
  // BBPVP Serang (3 unit)
  'Satpel Lubuklinggau': 'BBPVP Serang',
  'Satpel Lampung': 'BBPVP Serang',
  'Workshop Prabumulih': 'BBPVP Serang',
  
  // BBPVP Bekasi (2 unit)
  'Satpel Bengkulu': 'BBPVP Bekasi',
  'Satpel Kotawaringin Timur': 'BBPVP Bekasi',
  
  // BBPVP Makassar (4 unit)
  'Satpel Majene': 'BBPVP Makassar',
  'Satpel Mamuju': 'BBPVP Makassar',
  'Satpel Palu': 'BBPVP Makassar',
  'Workshop Gorontalo': 'BBPVP Makassar',
  
  // BBPVP Medan (2 unit)
  'Satpel Pekanbaru': 'BBPVP Medan',
  'Workshop Batam': 'BBPVP Medan',
  
  // BPVP Surakarta (1 unit)
  'Satpel Bantul': 'BPVP Surakarta',
  
  // BPVP Padang (2 unit)
  'Satpel Jambi': 'BPVP Padang',
  'Satpel Sawahlunto': 'BPVP Padang',
  
  // BPVP Lombok Timur (2 unit)
  'Satpel Kupang': 'BPVP Lombok Timur',
  'Satpel Bali': 'BPVP Lombok Timur',
  
  // BPVP Ternate (1 unit)
  'Satpel Sofifi': 'BPVP Ternate',
  
  // BPVP Sorong (1 unit)
  'Satpel Jayapura': 'BPVP Sorong',
};
```

### 3. Helper Functions

**File:** `src/lib/constants.ts`

#### a. `getUnitPembina(department: string): string | null`
Mendapatkan unit pembina dari sebuah Satpel/Workshop.

**Contoh:**
```typescript
getUnitPembina('Satpel Lampung')  // Returns: 'BBPVP Serang'
getUnitPembina('BBPVP Bandung')   // Returns: null (bukan Satpel)
```

#### b. `isSatpelOrWorkshop(department: string): boolean`
Mengecek apakah sebuah unit adalah Satpel atau Workshop.

**Contoh:**
```typescript
isSatpelOrWorkshop('Satpel Lampung')    // Returns: true
isSatpelOrWorkshop('Workshop Batam')    // Returns: true
isSatpelOrWorkshop('BBPVP Bandung')     // Returns: false
```

#### c. `getSatpelsByPembina(pembina: string): string[]`
Mendapatkan semua Satpel/Workshop yang dibina oleh sebuah unit pembina.

**Contoh:**
```typescript
getSatpelsByPembina('BBPVP Serang')
// Returns: ['Satpel Lubuklinggau', 'Satpel Lampung', 'Workshop Prabumulih']

getSatpelsByPembina('BPVP Padang')
// Returns: ['Satpel Jambi', 'Satpel Sawahlunto']
```

#### d. `getAccessibleDepartments(userDepartment: string, role: AppRole): string[]`
Mendapatkan semua unit yang bisa diakses oleh user berdasarkan role dan departmentnya.

**Contoh:**
```typescript
// Admin BBPVP Serang
getAccessibleDepartments('BBPVP Serang', 'admin_unit')
// Returns: ['BBPVP Serang', 'Satpel Lubuklinggau', 'Satpel Lampung', 'Workshop Prabumulih']

// Admin Satpel Lampung
getAccessibleDepartments('Satpel Lampung', 'admin_unit')
// Returns: ['Satpel Lampung']

// Admin Pusat
getAccessibleDepartments('Pusat', 'admin_pusat')
// Returns: [all departments]
```

#### e. `canAccessDepartment(userDepartment: string, role: AppRole, targetDepartment: string): boolean`
Mengecek apakah user bisa mengakses department tertentu.

**Contoh:**
```typescript
// Admin BBPVP Serang mengakses Satpel Lampung
canAccessDepartment('BBPVP Serang', 'admin_unit', 'Satpel Lampung')  // Returns: true

// Admin BBPVP Serang mengakses Satpel Bengkulu (bukan binaannya)
canAccessDepartment('BBPVP Serang', 'admin_unit', 'Satpel Bengkulu')  // Returns: false

// Admin Satpel Lampung mengakses BBPVP Serang (unit pembina)
canAccessDepartment('Satpel Lampung', 'admin_unit', 'BBPVP Serang')  // Returns: false
```

---

## 🔐 Logika Akses

### Skenario 1: Admin Unit Pembina (contoh: Admin BBPVP Serang)

**Akses:**
- ✅ Bisa melihat dan edit data pegawai di **BBPVP Serang** (unit sendiri)
- ✅ Bisa melihat dan edit data pegawai di **Satpel Lubuklinggau** (binaan)
- ✅ Bisa melihat dan edit data pegawai di **Satpel Lampung** (binaan)
- ✅ Bisa melihat dan edit data pegawai di **Workshop Prabumulih** (binaan)
- ❌ Tidak bisa akses unit lain (contoh: BBPVP Bandung, Satpel Bengkulu)

**Use Case:**
- Mengelola data pegawai di unit sendiri
- Membantu Satpel/Workshop binaan dalam pengelolaan data pegawai
- Monitoring pegawai di seluruh unit yang dibina

### Skenario 2: Admin Satpel (contoh: Admin Satpel Lampung)

**Akses:**
- ✅ Bisa melihat dan edit data pegawai di **Satpel Lampung** (unit sendiri)
- ❌ Tidak bisa akses unit pembina (BBPVP Serang)
- ❌ Tidak bisa akses Satpel lain (Satpel Lubuklinggau, Workshop Prabumulih)

**Use Case:**
- Mengelola data pegawai di unit sendiri saja
- Fokus pada operasional Satpel

### Skenario 3: Admin Pusat

**Akses:**
- ✅ Bisa melihat dan edit **semua unit** (tidak berubah)

### Skenario 4: Admin Pimpinan

**Akses:**
- ✅ Bisa melihat **semua unit** (read-only, tidak berubah)

---

## 📊 Statistik Unit Pembina

### Unit Pembina dengan Satpel/Workshop Terbanyak:

1. **BBPVP Makassar** - 4 unit
   - Satpel Majene
   - Satpel Mamuju
   - Satpel Palu
   - Workshop Gorontalo

2. **BBPVP Serang** - 3 unit
   - Satpel Lubuklinggau
   - Satpel Lampung
   - Workshop Prabumulih

3. **BBPVP Bekasi** - 2 unit
   - Satpel Bengkulu
   - Satpel Kotawaringin Timur

4. **BBPVP Medan** - 2 unit
   - Satpel Pekanbaru
   - Workshop Batam

5. **BPVP Padang** - 2 unit
   - Satpel Jambi
   - Satpel Sawahlunto

6. **BPVP Lombok Timur** - 2 unit
   - Satpel Kupang
   - Satpel Bali

7. **BPVP Surakarta** - 1 unit
   - Satpel Bantul

8. **BPVP Ternate** - 1 unit
   - Satpel Sofifi

9. **BPVP Sorong** - 1 unit
   - Satpel Jayapura

**Total:** 9 Unit Pembina membina 18 Satpel/Workshop

---

## 🚀 Cara Menggunakan

### 1. Di Component/Page

```typescript
import { 
  getAccessibleDepartments, 
  canAccessDepartment,
  getSatpelsByPembina,
  isSatpelOrWorkshop 
} from '@/lib/constants';
import { useAuth } from '@/hooks/useAuth';

function MyComponent() {
  const { profile } = useAuth();
  
  // Get accessible departments
  const accessibleDepts = getAccessibleDepartments(
    profile.department, 
    profile.app_role
  );
  
  // Check if can access specific department
  const canEdit = canAccessDepartment(
    profile.department,
    profile.app_role,
    'Satpel Lampung'
  );
  
  // Get Satpel under supervision
  const satpels = getSatpelsByPembina(profile.department);
  
  return (
    <div>
      <p>Accessible Departments: {accessibleDepts.length}</p>
      {satpels.length > 0 && (
        <p>Satpel/Workshop Binaan: {satpels.join(', ')}</p>
      )}
    </div>
  );
}
```

### 2. Di Filter/Query

```typescript
// Filter employees by accessible departments
const { data: employees } = await supabase
  .from('employees')
  .select('*')
  .in('department', accessibleDepts);
```

### 3. Di Dashboard

```typescript
// Show stats for unit pembina + satpels
const allUnits = getAccessibleDepartments(userDept, userRole);
const stats = await fetchStatsForDepartments(allUnits);
```

---

## 🧪 Testing

### Test 1: Admin Unit Pembina
1. ✅ Login sebagai Admin BBPVP Serang
2. ✅ Buka Dashboard → Lihat stats gabungan (BBPVP Serang + 3 Satpel)
3. ✅ Buka Data Pegawai → Filter unit kerja menampilkan 4 unit
4. ✅ Edit pegawai di Satpel Lampung → Berhasil
5. ✅ Coba akses Satpel Bengkulu → Tidak muncul di filter

### Test 2: Admin Satpel
1. ✅ Login sebagai Admin Satpel Lampung
2. ✅ Buka Dashboard → Hanya stats Satpel Lampung
3. ✅ Buka Data Pegawai → Filter unit kerja hanya Satpel Lampung
4. ✅ Coba akses BBPVP Serang → Tidak bisa

### Test 3: Helper Functions
```typescript
// Test getUnitPembina
console.log(getUnitPembina('Satpel Lampung'));  // 'BBPVP Serang'
console.log(getUnitPembina('BBPVP Bandung'));   // null

// Test isSatpelOrWorkshop
console.log(isSatpelOrWorkshop('Satpel Lampung'));  // true
console.log(isSatpelOrWorkshop('BBPVP Bandung'));   // false

// Test getSatpelsByPembina
console.log(getSatpelsByPembina('BBPVP Serang'));  // ['Satpel Lubuklinggau', ...]

// Test getAccessibleDepartments
console.log(getAccessibleDepartments('BBPVP Serang', 'admin_unit'));  // 4 units
console.log(getAccessibleDepartments('Satpel Lampung', 'admin_unit')); // 1 unit
```

---

## 📝 Catatan Penting

### 1. Calon Satpel (Belum Diimplementasikan)

Satpel berikut masih berstatus "Calon" dan **belum ditambahkan** ke database:
- Calon Satpel Morowali (Unit Pembina: BBPVP Makassar)
- Calon Satpel Morowali Utara (Unit Pembina: BBPVP Makassar)
- Calon Satpel Minahasa Utara (Unit Pembina: BPVP Ternate)
- Calon Satpel Halmahera Selatan (Unit Pembina: BPVP Ternate)
- Calon Satpel Tanah Bumbu (Unit Pembina: BPVP Samarinda)
- Calon Satpel Bulungan (Unit Pembina: BPVP Samarinda)

**Alasan:** Menunggu konfirmasi status resmi sebelum ditambahkan ke sistem.

### 2. Perbedaan Nama

- Excel: "Satpel PVP Lubuk Linggau"
- Database: "Satpel Lubuklinggau"
- **Rekomendasi:** Gunakan nama di database untuk konsistensi

### 3. Alias Unit

- Excel: "BPVP Lotim"
- Database: "BPVP Lombok Timur"
- **Sudah ada** di `DEPARTMENT_ALIASES`

---

## 🔄 Future Enhancements

### 1. UI Indicator untuk Unit Pembina

Tambahkan badge/label di UI untuk menunjukkan hubungan:
```tsx
{isSatpelOrWorkshop(dept) && (
  <Badge variant="secondary">
    Binaan: {getUnitPembina(dept)}
  </Badge>
)}
```

### 2. Dashboard Gabungan Unit Pembina

Dashboard khusus untuk Admin Unit Pembina yang menampilkan:
- Stats gabungan unit pembina + semua Satpel
- Breakdown per Satpel
- Comparison antar Satpel

### 3. Laporan Konsolidasi

Export laporan gabungan untuk unit pembina + Satpel binaannya.

### 4. Notifikasi ke Unit Pembina

Notifikasi otomatis ke Admin Unit Pembina jika ada perubahan data di Satpel binaan.

---

**Tanggal:** 4 Mei 2026  
**Status:** ✅ Selesai Diimplementasikan  
**Versi:** 2.10.0
