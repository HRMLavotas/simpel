# Analisis Satpel dan Unit Pembina

## 📊 Data dari Excel vs Database

### ✅ Satpel yang Sudah Ada di Database:

| No | Unit Pembina | Satpel | Status Database |
|----|--------------|--------|-----------------|
| 1 | BBPVP Serang | Satpel Lubuklinggau | ✅ Ada (Satpel Lubuklinggau) |
| 2 | BBPVP Serang | Satpel Lampung | ✅ Ada |
| 4 | BBPVP Bekasi | Satpel Bengkulu | ✅ Ada |
| 6 | BBPVP Makassar | Satpel Majene | ✅ Ada |
| 7 | BBPVP Makassar | Satpel Mamuju | ✅ Ada |
| 8 | BBPVP Makassar | Satpel Palu | ✅ Ada |
| 12 | BBPVP Medan | Satpel Pekanbaru | ✅ Ada |
| 14 | BPVP Surakarta | Satpel Bantul | ✅ Ada |
| 15 | BPVP Padang | Satpel Jambi | ✅ Ada |
| 16 | BPVP Padang | Satpel Sawahlunto | ✅ Ada |
| 17 | BPVP Lotim | Satpel Kupang | ✅ Ada |
| 19 | BPVP Ternate | Satpel Sofifi | ✅ Ada |
| 22 | BPVP Sorong | Satpel Jayapura | ✅ Ada |

### ❌ Satpel/Workshop yang Belum Ada di Database:

| No | Unit Pembina | Satpel/Workshop | Nama di Excel | Nama yang Disarankan |
|----|--------------|-----------------|---------------|----------------------|
| 3 | BBPVP Serang | Calon Satpel | Calon Satpel Prabumulih | Workshop Prabumulih ✅ (sudah ada) |
| 5 | BBPVP Bekasi | Calon Satpel | Calon Satpel Kotawaringin Timur | ❌ Belum ada |
| 9 | BBPVP Makassar | Calon Satpel | Calon Satpel Gorontalo | Workshop Gorontalo ✅ (sudah ada) |
| 10 | BBPVP Makassar | Calon Satpel | Calon Satpel Morowali | ❌ Belum ada |
| 11 | BBPVP Makassar | Calon Satpel | Calon Satpel Morowali Utara | ❌ Belum ada |
| 13 | BBPVP Medan | Calon Satpel | Calon Satpel Batam | Workshop Batam ✅ (sudah ada) |
| 18 | BPVP Lotim | Calon Satpel | Calon Satpel Bali | ❌ Belum ada |
| 20 | BPVP Ternate | Calon Satpel | Calon Satpel Minahasa Utara | ❌ Belum ada |
| 21 | BPVP Ternate | Calon Satpel | Calon Satpel Halmahera Selatan | ❌ Belum ada |
| 23 | BPVP Samarinda | Calon Satpel | Calon Satpel Tanah Bumbu | ❌ Belum ada |
| 24 | BPVP Samarinda | Calon Satpel | Calon Satpel Bulungan | ❌ Belum ada |

### 📝 Catatan Perbedaan Nama:

1. **Satpel Lubuklinggau** di database vs **Satpel PVP Lubuk Linggau** di Excel
   - Rekomendasi: Gunakan "Satpel Lubuklinggau" (konsisten dengan database)

2. **BPVP Lotim** di Excel vs **BPVP Lombok Timur** di database
   - Sudah ada alias di `DEPARTMENT_ALIASES`

---

## 🏗️ Struktur Unit Pembina - Satpel

### Mapping Unit Pembina → Satpel:

```
BBPVP Serang (4 unit)
├── Satpel Lubuklinggau
├── Satpel Lampung
├── Workshop Prabumulih
└── (future: Satpel lainnya)

BBPVP Bekasi (2 unit)
├── Satpel Bengkulu
└── Satpel Kotawaringin Timur (BARU)

BBPVP Makassar (5 unit)
├── Satpel Majene
├── Satpel Mamuju
├── Satpel Palu
├── Workshop Gorontalo
└── (future: Satpel Morowali, Morowali Utara)

BBPVP Medan (2 unit)
├── Satpel Pekanbaru
└── Workshop Batam

BPVP Surakarta (1 unit)
└── Satpel Bantul

BPVP Padang (2 unit)
├── Satpel Jambi
└── Satpel Sawahlunto

BPVP Lombok Timur (2 unit)
├── Satpel Kupang
└── Satpel Bali (BARU)

BPVP Ternate (3 unit)
├── Satpel Sofifi
└── (future: Satpel Minahasa Utara, Halmahera Selatan)

BPVP Sorong (1 unit)
└── Satpel Jayapura

BPVP Samarinda (2 unit)
└── (future: Satpel Tanah Bumbu, Bulungan)
```

---

## 🎯 Rekomendasi Implementasi

### Fase 1: Tambahkan Satpel yang Sudah Jelas (Prioritas Tinggi)

Tambahkan ke `DEPARTMENTS`:

```typescript
'Satpel Kotawaringin Timur',  // Unit Pembina: BBPVP Bekasi
'Satpel Bali',                 // Unit Pembina: BPVP Lombok Timur
```

### Fase 2: Calon Satpel (Prioritas Rendah - Tunggu Konfirmasi)

Satpel yang masih berstatus "Calon" sebaiknya ditunggu konfirmasi dulu:
- Calon Satpel Morowali
- Calon Satpel Morowali Utara
- Calon Satpel Minahasa Utara
- Calon Satpel Halmahera Selatan
- Calon Satpel Tanah Bumbu
- Calon Satpel Bulungan

### Fase 3: Sistem Parent-Child Unit Pembina

**Opsi 1: Tambahkan Field `parent_unit` di Database**

```sql
ALTER TABLE profiles 
ADD COLUMN parent_unit VARCHAR(100);

COMMENT ON COLUMN profiles.parent_unit IS 'Unit pembina untuk Satpel/Workshop';
```

**Opsi 2: Gunakan Konstanta Mapping (Lebih Sederhana)**

```typescript
export const UNIT_PEMBINA_MAPPING: Record<string, string> = {
  // BBPVP Serang
  'Satpel Lubuklinggau': 'BBPVP Serang',
  'Satpel Lampung': 'BBPVP Serang',
  'Workshop Prabumulih': 'BBPVP Serang',
  
  // BBPVP Bekasi
  'Satpel Bengkulu': 'BBPVP Bekasi',
  'Satpel Kotawaringin Timur': 'BBPVP Bekasi',
  
  // BBPVP Makassar
  'Satpel Majene': 'BBPVP Makassar',
  'Satpel Mamuju': 'BBPVP Makassar',
  'Satpel Palu': 'BBPVP Makassar',
  'Workshop Gorontalo': 'BBPVP Makassar',
  
  // BBPVP Medan
  'Satpel Pekanbaru': 'BBPVP Medan',
  'Workshop Batam': 'BBPVP Medan',
  
  // BPVP Surakarta
  'Satpel Bantul': 'BPVP Surakarta',
  
  // BPVP Padang
  'Satpel Jambi': 'BPVP Padang',
  'Satpel Sawahlunto': 'BPVP Padang',
  
  // BPVP Lombok Timur
  'Satpel Kupang': 'BPVP Lombok Timur',
  'Satpel Bali': 'BPVP Lombok Timur',
  
  // BPVP Ternate
  'Satpel Sofifi': 'BPVP Ternate',
  
  // BPVP Sorong
  'Satpel Jayapura': 'BPVP Sorong',
};

// Helper function
export function getUnitPembina(department: string): string | null {
  return UNIT_PEMBINA_MAPPING[department] || null;
}

export function isSatpelOrWorkshop(department: string): boolean {
  return department.startsWith('Satpel ') || department.startsWith('Workshop ');
}

export function getSatpelsByPembina(pembina: string): string[] {
  return Object.entries(UNIT_PEMBINA_MAPPING)
    .filter(([_, parent]) => parent === pembina)
    .map(([satpel]) => satpel);
}
```

---

## 🔐 Sistem Akses Admin Unit Pembina

### Logika Akses:

1. **Admin Unit Pembina** (contoh: Admin BBPVP Serang):
   - Bisa melihat data unit sendiri (BBPVP Serang)
   - Bisa melihat data Satpel/Workshop yang dibina:
     - Satpel Lubuklinggau
     - Satpel Lampung
     - Workshop Prabumulih
   - Bisa edit data pegawai di Satpel/Workshop yang dibina

2. **Admin Satpel** (contoh: Admin Satpel Lampung):
   - Hanya bisa melihat dan edit data unit sendiri (Satpel Lampung)
   - Tidak bisa melihat data unit pembina atau Satpel lain

3. **Admin Pusat**:
   - Bisa melihat dan edit semua unit (tidak berubah)

4. **Admin Pimpinan**:
   - Bisa melihat semua unit (read-only, tidak berubah)

### Implementasi di Code:

```typescript
// Di hooks/useAuth.tsx atau utils
export function getAccessibleDepartments(
  userDepartment: string,
  role: AppRole
): string[] {
  if (role === 'admin_pusat' || role === 'admin_pimpinan') {
    return DEPARTMENTS as unknown as string[];
  }
  
  // Admin unit
  const accessible = [userDepartment];
  
  // Jika unit pembina, tambahkan Satpel/Workshop yang dibina
  const satpels = getSatpelsByPembina(userDepartment);
  accessible.push(...satpels);
  
  return accessible;
}
```

---

## 📋 Action Items

### Immediate (Sekarang):

1. ✅ Tambahkan 2 Satpel baru ke `DEPARTMENTS`:
   - Satpel Kotawaringin Timur
   - Satpel Bali

2. ✅ Buat konstanta `UNIT_PEMBINA_MAPPING` di `constants.ts`

3. ✅ Buat helper functions:
   - `getUnitPembina()`
   - `isSatpelOrWorkshop()`
   - `getSatpelsByPembina()`

4. ✅ Update logika akses di `useAuth` atau komponen terkait

### Future (Tunggu Konfirmasi):

1. ⏳ Tambahkan Calon Satpel setelah dikonfirmasi statusnya
2. ⏳ Pertimbangkan migrasi ke database jika mapping semakin kompleks

---

**Tanggal:** 4 Mei 2026  
**Status:** Analisis Selesai - Menunggu Approval untuk Implementasi
