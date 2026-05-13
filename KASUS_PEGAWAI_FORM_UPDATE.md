# ✅ Update: Form Tambah Kasus Baru

## 🎯 Perubahan yang Dilakukan

### 1. **Update Jenis Kasus** ✅

#### Sebelum:
- Pelanggaran Disiplin
- Masalah Kinerja
- Pelanggaran Etika
- Masalah Administrasi
- Kasus Hukum
- Masalah Kesehatan
- Lainnya

#### Sesudah:
- ✅ **Perceraian**
- ✅ **Hutang**
- ✅ **Pinjaman Online**
- ✅ **Presensi**
- ✅ **Pengunduran Diri**
- ✅ **Temuan**
- ✅ **Lainnya** (dengan field opsional untuk kategori)

### 2. **Field Kategori Lainnya** ✅

Ketika user memilih "Lainnya", muncul field opsional:
```
┌─────────────────────────────────────┐
│ Kategori Lainnya (Opsional)        │
│ ┌─────────────────────────────────┐ │
│ │ Sebutkan kategori kasus...      │ │
│ └─────────────────────────────────┘ │
│ Contoh: Masalah Keluarga, Konflik  │
│ Internal, dll.                      │
└─────────────────────────────────────┘
```

### 3. **Hapus Tingkat Keparahan** ✅

Field "Tingkat Keparahan" telah dihapus dari form:
- ❌ Dropdown Tingkat Keparahan (Ringan, Sedang, Berat, Sangat Berat)
- ✅ Akan diterapkan di fungsi lain nanti

## 📝 File yang Diubah

### 1. **employeeCaseTypes.ts**
**Path:** `src/lib/employeeCaseTypes.ts`

**Perubahan:**
```typescript
// Update CaseType enum
export type CaseType =
  | "perceraian"
  | "hutang"
  | "pinjaman_online"
  | "presensi"
  | "pengunduran_diri"
  | "temuan"
  | "lainnya";

// Update labels
export const CASE_TYPE_LABELS: Record<CaseType, string> = {
  perceraian: "Perceraian",
  hutang: "Hutang",
  pinjaman_online: "Pinjaman Online",
  presensi: "Presensi",
  pengunduran_diri: "Pengunduran Diri",
  temuan: "Temuan",
  lainnya: "Lainnya",
};

// Add lainnyaKategori to CaseDetails
export interface CaseDetails {
  lainnyaKategori?: string; // ← NEW
  // ... other fields
}
```

### 2. **CaseFormDialog.tsx**
**Path:** `src/components/cases/CaseFormDialog.tsx`

**Perubahan:**

#### A. Remove Severity
```typescript
// REMOVED
import { CASE_SEVERITY_OPTIONS, CaseSeverity } from "...";

// REMOVED from formData
severity: "sedang" as CaseSeverity,

// REMOVED from form
<div className="space-y-2">
  <Label>Tingkat Keparahan *</Label>
  <Select>...</Select>
</div>
```

#### B. Add Lainnya Kategori
```typescript
// ADDED to formData
lainnyaKategori: "",

// ADDED conditional field
const renderCaseSpecificFields = () => {
  if (formData.caseType === "lainnya") {
    return (
      <div className="space-y-2">
        <Label>Kategori Lainnya (Opsional)</Label>
        <Input
          placeholder="Sebutkan kategori kasus..."
          value={formData.lainnyaKategori}
          onChange={...}
        />
      </div>
    );
  }
  return null;
};
```

#### C. Update Submit
```typescript
// Save lainnya kategori
if (formData.caseType === "lainnya" && formData.lainnyaKategori) {
  caseDetails.lainnyaKategori = formData.lainnyaKategori;
}

// Remove severity
severity: undefined, // ← Changed from formData.severity
```

### 3. **CaseDetailCard.tsx**
**Path:** `src/components/cases/CaseDetailCard.tsx`

**Perubahan:**

#### A. Add New Icons
```typescript
import {
  Users,        // Perceraian
  DollarSign,   // Hutang
  CreditCard,   // Pinjaman Online
  Clock,        // Presensi
  UserMinus,    // Pengunduran Diri
  Search,       // Temuan
  HelpCircle,   // Lainnya
} from "lucide-react";
```

#### B. Update renderIcon
```typescript
const renderIcon = () => {
  switch (caseType) {
    case "perceraian":
      return <Users className="h-5 w-5 text-red-500" />;
    case "hutang":
      return <DollarSign className="h-5 w-5 text-orange-500" />;
    // ... etc
  }
};
```

#### C. Display Lainnya Kategori
```typescript
const renderDetails = () => {
  if (caseType === "lainnya" && caseDetails.lainnyaKategori) {
    return (
      <div>
        <p className="text-sm text-muted-foreground">Kategori</p>
        <Badge variant="outline">{caseDetails.lainnyaKategori}</Badge>
      </div>
    );
  }
  // ... legacy details
};
```

### 4. **Database Migration**
**Path:** `supabase/migrations/20260513120000_update_case_types.sql`

**Content:**
```sql
-- Drop old constraint
ALTER TABLE public.employee_cases 
DROP CONSTRAINT IF EXISTS employee_cases_case_type_check;

-- Add new constraint
ALTER TABLE public.employee_cases 
ADD CONSTRAINT employee_cases_case_type_check 
CHECK (case_type IN (
  'perceraian',
  'hutang',
  'pinjaman_online',
  'presensi',
  'pengunduran_diri',
  'temuan',
  'lainnya'
));
```

## 🎨 UI Changes

### Form Tambah Kasus (Before)
```
┌─────────────────────────────────────┐
│ Pilih Pegawai                       │
│ Jenis Kasus *                       │
│ ├─ Pelanggaran Disiplin            │
│ ├─ Masalah Kinerja                 │
│ ├─ Pelanggaran Etika               │
│ ├─ Masalah Administrasi            │
│ ├─ Kasus Hukum                     │
│ ├─ Masalah Kesehatan               │
│ └─ Lainnya                         │
│ Status *                            │
│ Tingkat Keparahan * ← REMOVED      │
│ Tanggal Laporan *                   │
│ Deskripsi Kasus *                   │
└─────────────────────────────────────┘
```

### Form Tambah Kasus (After)
```
┌─────────────────────────────────────┐
│ Pilih Pegawai                       │
│ Jenis Kasus *                       │
│ ├─ Perceraian                      │
│ ├─ Hutang                          │
│ ├─ Pinjaman Online                 │
│ ├─ Presensi                        │
│ ├─ Pengunduran Diri                │
│ ├─ Temuan                          │
│ └─ Lainnya                         │
│                                     │
│ [If "Lainnya" selected]            │
│ Kategori Lainnya (Opsional)        │
│ ┌─────────────────────────────────┐ │
│ │ Sebutkan kategori kasus...      │ │
│ └─────────────────────────────────┘ │
│                                     │
│ Status *                            │
│ Tanggal Laporan *                   │
│ Deskripsi Kasus *                   │
└─────────────────────────────────────┘
```

## 🎯 Case Type Icons

| Case Type | Icon | Color |
|-----------|------|-------|
| Perceraian | 👥 Users | Red |
| Hutang | 💵 DollarSign | Orange |
| Pinjaman Online | 💳 CreditCard | Yellow |
| Presensi | 🕐 Clock | Blue |
| Pengunduran Diri | 👤➖ UserMinus | Purple |
| Temuan | 🔍 Search | Green |
| Lainnya | ❓ HelpCircle | Gray |

## 🧪 Testing

### Test 1: Create Case - Perceraian
1. Login as Admin Pusat
2. Klik "Tambah Kasus"
3. Pilih pegawai
4. Pilih "Perceraian"
5. Isi deskripsi
6. Submit
7. ✅ Should create successfully

### Test 2: Create Case - Lainnya with Kategori
1. Login as Admin Pusat
2. Klik "Tambah Kasus"
3. Pilih pegawai
4. Pilih "Lainnya"
5. ✅ Field "Kategori Lainnya" should appear
6. Isi kategori: "Masalah Keluarga"
7. Isi deskripsi
8. Submit
9. ✅ Should save with kategori

### Test 3: View Case Detail - Lainnya
1. Open case with type "Lainnya"
2. ✅ Should show kategori badge
3. ✅ Should show HelpCircle icon

### Test 4: Severity Removed
1. Open form "Tambah Kasus"
2. ✅ "Tingkat Keparahan" field should NOT appear
3. ✅ Form should work without severity

## 📊 Data Structure

### Case with "Lainnya" Type
```json
{
  "id": "uuid",
  "case_type": "lainnya",
  "employee_name": "John Doe",
  "description": "Kasus masalah keluarga",
  "case_details": {
    "lainnyaKategori": "Masalah Keluarga"
  },
  "severity": null,
  "status": "baru"
}
```

### Case with Other Type
```json
{
  "id": "uuid",
  "case_type": "perceraian",
  "employee_name": "Jane Doe",
  "description": "Kasus perceraian",
  "case_details": {},
  "severity": null,
  "status": "baru"
}
```

## ✅ Checklist

- ✅ Update CaseType enum
- ✅ Update CASE_TYPE_LABELS
- ✅ Add lainnyaKategori field
- ✅ Remove severity from form
- ✅ Add conditional field for "Lainnya"
- ✅ Update icons for new case types
- ✅ Update database constraint
- ✅ Migration applied
- ✅ TypeScript no errors

## 🚀 Status

**READY TO USE!**

Form sudah diupdate dengan:
- ✅ 7 jenis kasus baru
- ✅ Field kategori untuk "Lainnya"
- ✅ Severity dihapus
- ✅ Icons updated
- ✅ Database updated

---

**Updated:** 13 Mei 2026
**Status:** ✅ COMPLETE
