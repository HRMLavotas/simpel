# Timeline Form Simplification

## 📋 Summary

Form tindak lanjut (timeline) telah disederhanakan dengan menghapus field yang tidak diperlukan.

## ✅ Perubahan yang Dilakukan

### 1. **Field yang Dihapus dari Form**

#### A. Status Singkat
- ❌ Field input "Status Singkat" dihapus
- ❌ Badge status di timeline display dihapus
- **Alasan**: Tidak diperlukan, deskripsi sudah cukup informatif

#### B. Pihak yang Terlibat
- ❌ Section "Pihak yang Terlibat (Opsional)" dihapus
- ❌ Input nama dan peran pihak terlibat dihapus
- ❌ Display pihak yang terlibat di timeline dihapus
- **Alasan**: Menyederhanakan form, fokus pada dokumen pendukung

### 2. **Field yang Tersisa (Simplified)**

Form timeline sekarang hanya memiliki:
1. ✅ **Tanggal Tindak Lanjut** (required)
2. ✅ **Deskripsi Tindakan** (required)
3. ✅ **Dokumen Pendukung** (optional, multiple)

### 3. **Kode yang Dihapus**

#### Functions:
```typescript
// ❌ Dihapus
const addParty = () => { ... }
const updateParty = (index, field, value) => { ... }
const removeParty = (index) => { ... }
const getPartyRoleColor = (role) => { ... }
```

#### Imports:
```typescript
// ❌ Dihapus
import { Users } from "lucide-react";
import { InvolvedParty, PARTY_ROLE_OPTIONS, PARTY_ROLE_LABELS } from "@/lib/employeeCaseTypes";
```

#### UI Components:
- ❌ Section "Pihak yang Terlibat" di form
- ❌ Display "Pihak yang Terlibat" di timeline items
- ❌ Badge status di timeline items
- ❌ Input "Status Singkat"

### 4. **Kode yang Diupdate**

#### `handleAddTimeline()`:
```typescript
// SEBELUM
const validParties = timelineForm.involvedPartiesList.filter(p => p.name.trim());
await addTimelineItem(
  employeeCase.id, timelineForm.date, timelineForm.description,
  timelineForm.status, undefined,
  undefined, undefined, validDocs, validParties
);

// SESUDAH
await addTimelineItem(
  employeeCase.id, timelineForm.date, timelineForm.description,
  "", undefined,
  undefined, undefined, validDocs, []
);
```

#### `handleEditTimeline()`:
```typescript
// SEBELUM
setTimelineForm({
  date: item.date,
  description: item.description,
  status: item.status,
  involvedPartiesList: item.involvedPartiesList?.length
    ? [...item.involvedPartiesList]
    : item.involvedParties
      ? [{ name: item.involvedParties, role: 'lainnya' }]
      : [],
  documents: item.documents.length > 0 ? [...item.documents] : [],
});

// SESUDAH
setTimelineForm({
  date: item.date,
  description: item.description,
  status: "",
  involvedPartiesList: [],
  documents: item.documents.length > 0 ? [...item.documents] : [],
});
```

#### `TimelineFormState` interface:
```typescript
// SEBELUM
interface TimelineFormState {
  date: string;
  description: string;
  status: string;
  involvedPartiesList: InvolvedParty[];
  documents: SupportingDocument[];
}

// SESUDAH
interface TimelineFormState {
  date: string;
  description: string;
  status: string;
  involvedPartiesList: any[];  // Kept for compatibility, always empty
  documents: SupportingDocument[];
}
```

## 📊 Perbandingan Form

### SEBELUM (Complex):
```
┌─────────────────────────────────────────┐
│ Tambah Timeline Baru                    │
├─────────────────────────────────────────┤
│ Tanggal Tindak Lanjut *                 │
│ [Input Date]                            │
│                                         │
│ Deskripsi Tindakan *                    │
│ [Textarea]                              │
│                                         │
│ Status Singkat                          │ ← DIHAPUS
│ [Input Text]                            │
│                                         │
│ Pihak yang Terlibat (Opsional)          │ ← DIHAPUS
│ ┌─────────────────────────────────────┐ │
│ │ Nama: [Input]  Peran: [Dropdown]   │ │
│ │ [Hapus]                             │ │
│ └─────────────────────────────────────┘ │
│ [+ Tambah Pihak]                        │
│                                         │
│ Dokumen Pendukung (Opsional)            │
│ ┌─────────────────────────────────────┐ │
│ │ Nama: [Input]  Link: [Input]       │ │
│ │ [Hapus]                             │ │
│ └─────────────────────────────────────┘ │
│ [+ Tambah Dokumen]                      │
│                                         │
│ [Tambahkan] [Batal]                     │
└─────────────────────────────────────────┘
```

### SESUDAH (Simplified):
```
┌─────────────────────────────────────────┐
│ Tambah Timeline Baru                    │
├─────────────────────────────────────────┤
│ Tanggal Tindak Lanjut *                 │
│ [Input Date]                            │
│                                         │
│ Deskripsi Tindakan *                    │
│ [Textarea]                              │
│                                         │
│ Dokumen Pendukung (Opsional)            │
│ ┌─────────────────────────────────────┐ │
│ │ Nama: [Input]  Link: [Input]       │ │
│ │ [Hapus]                             │ │
│ └─────────────────────────────────────┘ │
│ [+ Tambah Dokumen]                      │
│                                         │
│ [Tambahkan] [Batal]                     │
└─────────────────────────────────────────┘
```

## 📊 Timeline Display

### SEBELUM:
```
● 13 Mei 2026  [Badge: Status Singkat]  ← DIHAPUS
  Deskripsi tindakan...
  
  👥 Pihak yang Terlibat:                ← DIHAPUS
     John Doe [Pelapor]
     Jane Smith [Saksi]
  
  📄 Dokumen Pendukung (2):
     - Surat Keputusan No. 123
     - Berita Acara
```

### SESUDAH:
```
● 13 Mei 2026
  Deskripsi tindakan...
  
  📄 Dokumen Pendukung (2):
     - Surat Keputusan No. 123
     - Berita Acara
```

## 🎯 Manfaat Simplifikasi

1. ✅ **Form lebih sederhana** - Hanya 2 field required + dokumen optional
2. ✅ **Lebih cepat diisi** - Mengurangi waktu input data
3. ✅ **Fokus pada inti** - Tanggal, deskripsi, dan dokumen pendukung
4. ✅ **Lebih clean** - Timeline display lebih ringkas dan mudah dibaca
5. ✅ **Mengurangi kompleksitas** - Kode lebih maintainable

## 📝 Catatan

- **Data lama tetap aman**: Timeline yang sudah ada dengan status dan pihak terlibat tetap tersimpan di database
- **Backward compatible**: Sistem masih bisa membaca data lama, hanya tidak menampilkannya
- **Field status & involvedPartiesList**: Masih ada di interface untuk kompatibilitas, tapi selalu kosong untuk data baru

## 🔄 Migration Notes

Tidak ada migration database yang diperlukan karena:
- Struktur database tidak berubah
- Hanya UI/form yang disederhanakan
- Data lama tetap valid dan tersimpan

## ✅ Testing Checklist

- [ ] Form timeline hanya menampilkan 3 section (tanggal, deskripsi, dokumen)
- [ ] Field "Status Singkat" tidak muncul
- [ ] Section "Pihak yang Terlibat" tidak muncul
- [ ] Timeline baru bisa dibuat dengan sukses
- [ ] Timeline display tidak menampilkan badge status
- [ ] Timeline display tidak menampilkan pihak yang terlibat
- [ ] Dokumen pendukung masih berfungsi normal
- [ ] Edit timeline masih berfungsi
- [ ] Delete timeline masih berfungsi
- [ ] Data timeline lama masih bisa dibaca (backward compatible)

## 📁 File yang Diubah

- ✅ `src/pages/EmployeeCaseDetail.tsx`
  - Removed: Status input field
  - Removed: Pihak yang terlibat section
  - Removed: Functions (addParty, updateParty, removeParty, getPartyRoleColor)
  - Removed: Imports (Users, InvolvedParty, PARTY_ROLE_OPTIONS, PARTY_ROLE_LABELS)
  - Updated: handleAddTimeline()
  - Updated: handleEditTimeline()
  - Updated: Timeline display (removed status badge and involved parties)

---

**Status**: ✅ COMPLETED
**Date**: 2026-05-13
**Impact**: Low (UI only, no database changes)
