# Quick Reference: Hukuman Disiplin Feature

## 🚀 Quick Start

### Untuk User:
1. Buka detail kasus pegawai
2. Klik tombol merah "⚖️ Update Hukuman Disiplin"
3. Isi form → Klik "Simpan"
4. Lihat card riwayat & timeline baru

### Untuk Developer:
```bash
# File yang dibuat:
src/components/cases/DisciplinaryActionDialog.tsx
src/components/cases/DisciplinaryActionsCard.tsx

# File yang diubah:
src/pages/EmployeeCaseDetail.tsx
```

## 📁 File Structure

```
src/
├── components/
│   └── cases/
│       ├── DisciplinaryActionDialog.tsx    ← NEW (Dialog form)
│       ├── DisciplinaryActionsCard.tsx     ← NEW (Display card)
│       ├── CaseDetailCard.tsx              (existing)
│       └── CaseFormDialog.tsx              (existing)
└── pages/
    └── EmployeeCaseDetail.tsx              ← MODIFIED
```

## 🎯 Key Components

### 1. DisciplinaryActionDialog
**Purpose**: Form input hukuman disiplin

**Props**:
- `employeeName: string`
- `employeeNip: string`
- `onClose: () => void`
- `onSubmit: (data: DisciplinaryAction) => Promise<void>`

**Exports**:
- `DisciplinaryActionDialog` (default)
- `DISCIPLINARY_LEVELS`
- `DISCIPLINARY_TYPES`
- `DisciplinaryAction` (type)

### 2. DisciplinaryActionsCard
**Purpose**: Display riwayat hukuman disiplin

**Props**:
- `disciplinaryActions: DisciplinaryAction[]`

**Features**:
- Conditional rendering
- Sorted by date (newest first)
- Badge colors by level
- Document links

### 3. EmployeeCaseDetail (Modified)
**New State**:
```typescript
const [showDisciplinaryDialog, setShowDisciplinaryDialog] = useState(false);
```

**New Handler**:
```typescript
const handleDisciplinaryAction = async (data: DisciplinaryAction) => {
  // 1. Update case_details
  // 2. Create timeline entry
  // 3. Reload case
}
```

## 📊 Data Structure

### DisciplinaryAction Type:
```typescript
interface DisciplinaryAction {
  level: "ringan" | "sedang" | "berat";
  type: string;
  decisionNumber: string;
  decisionDate: string;
  effectiveDate: string;
  endDate?: string;
  issuedBy: string;
  violation: string;
  notes?: string;
  documentLink?: string;
  addedAt?: string;
}
```

### Storage Location:
```
employee_cases table
  └── case_details (JSONB)
      └── disciplinaryActions: DisciplinaryAction[]
```

## 🎨 UI Elements

### Button:
```tsx
<Button
  variant="outline"
  onClick={() => setShowDisciplinaryDialog(true)}
  className="bg-red-500/20 hover:bg-red-500/30 border-red-500/50 text-white"
>
  <Scale className="h-4 w-4 mr-2" />
  Update Hukuman Disiplin
</Button>
```

### Badge Colors:
```typescript
const getLevelColor = (level: string) => ({
  ringan: "bg-yellow-100 text-yellow-800",
  sedang: "bg-orange-100 text-orange-800",
  berat: "bg-red-100 text-red-800",
}[level]);
```

## 🔄 Workflow

```
Click Button → Dialog Opens → Fill Form → Submit
    ↓
Update case_details + Create timeline + Reload
    ↓
Show Toast + Display Card + Show Timeline Entry
```

## 📋 Jenis Hukuman (PP 94/2021)

### Ringan (3):
1. Teguran Lisan
2. Teguran Tertulis
3. Pernyataan Tidak Puas Secara Tertulis

### Sedang (3):
1. Penundaan Kenaikan Gaji Berkala 6 Bulan
2. Penundaan Kenaikan Gaji Berkala 12 Bulan
3. Penurunan Gaji 1 Tingkat Selama 12 Bulan

### Berat (4):
1. Penurunan Jabatan 1 Tingkat Selama 12 Bulan
2. Pembebasan dari Jabatan
3. Pemberhentian dengan Hormat Tidak Atas Permintaan Sendiri
4. Pemberhentian Tidak dengan Hormat

## 🔐 Access Control

```typescript
// Only users with canEdit = true can add disciplinary actions
{canEdit && !isEditing && (
  <Button onClick={() => setShowDisciplinaryDialog(true)}>
    Update Hukuman Disiplin
  </Button>
)}
```

## 💾 Database Operations

### Save:
```typescript
await updateCase(employeeCase.id, {
  caseDetails: {
    ...currentDetails,
    disciplinaryActions: [...existing, newAction],
  },
});
```

### Auto-create Timeline:
```typescript
await addTimelineItem(
  employeeCase.id,
  data.decisionDate,
  `Hukuman Disiplin ${DISCIPLINARY_LEVELS[data.level]} diterbitkan: ${typeLabel}...`,
  "Hukuman Disiplin Diterbitkan",
  undefined, undefined, undefined,
  documents,
  []
);
```

## ✅ Validation Rules

**Required Fields**:
- ✅ Jenis hukuman (type)
- ✅ Nomor keputusan (decisionNumber)
- ✅ Pejabat yang menetapkan (issuedBy)
- ✅ Pelanggaran yang dilakukan (violation)

**Optional Fields**:
- Tanggal berakhir (endDate)
- Catatan tambahan (notes)
- Link dokumen (documentLink)

## 🎯 Testing Commands

```bash
# Run type check
npm run type-check

# Run linter
npm run lint

# Run tests (if available)
npm run test

# Build
npm run build
```

## 🐛 Common Issues & Solutions

### Issue 1: Tombol tidak muncul
**Solution**: Check `canEdit` permission

### Issue 2: Timeline tidak ter-create
**Solution**: Check `addTimelineItem()` function

### Issue 3: Data tidak tersimpan
**Solution**: Check `updateCase()` function & database connection

### Issue 4: Dropdown jenis hukuman kosong
**Solution**: Check `DISCIPLINARY_TYPES[level]` mapping

## 📚 Related Files

```
src/lib/employeeCaseTypes.ts       - Type definitions
src/lib/employeeCaseStorage.ts     - CRUD operations
src/hooks/useCaseAccess.ts         - Access control
src/lib/date-utils.ts              - Date formatting
```

## 🔗 API Endpoints (Supabase)

```typescript
// Update case
supabase.from("employee_cases").update({ case_details }).eq("id", caseId)

// Add timeline
supabase.from("case_timeline").insert({ ... })

// Get case
supabase.from("employee_cases").select("*").eq("id", caseId)
```

## 💡 Tips & Best Practices

1. **Always fill document link** for better documentation
2. **Use official SK number** format
3. **Describe violation in detail** for clarity
4. **Set end date** for time-limited punishments
5. **Check timeline** after submission to verify auto-creation

## 🎨 Styling Classes

```css
/* Button */
.bg-red-500/20 .hover:bg-red-500/30 .border-red-500/50

/* Badge - Ringan */
.bg-yellow-100 .text-yellow-800

/* Badge - Sedang */
.bg-orange-100 .text-orange-800

/* Badge - Berat */
.bg-red-100 .text-red-800

/* Card */
.border-red-200 .from-red-50/50
```

## 📞 Support

**Documentation**:
- `HUKUMAN_DISIPLIN_FEATURE.md` - Full documentation
- `HUKUMAN_DISIPLIN_IMPLEMENTATION_SUMMARY.md` - Implementation details
- `HUKUMAN_DISIPLIN_VISUAL_GUIDE.md` - Visual diagrams

**Legal Reference**:
- PP 94 Tahun 2021
- Peraturan BKN Nomor 6 Tahun 2022

---

**Version**: 1.0.0  
**Last Updated**: 2026-05-13  
**Status**: ✅ Production Ready
