# 🔧 FIX: Hukuman Disiplin Form Pre-fill

**Tanggal**: 13 Mei 2026  
**Status**: ✅ **SELESAI**

---

## 🐛 MASALAH

User melaporkan bahwa ketika membuka form "Update Hukuman Disiplin":
- **Di "Informasi Kasus"**: Tingkat hukuman disiplin menampilkan **"Sedang"**
- **Di Form Update**: Tingkat hukuman disiplin default ke **"Ringan"**

**Root Cause**: Form tidak menerima dan tidak menggunakan data hukuman disiplin yang sudah ada (existing data).

---

## ✅ SOLUSI

### 1. **Update `DisciplinaryActionDialog.tsx`**

#### **Tambah Prop `existingAction`**:
```typescript
interface DisciplinaryActionDialogProps {
  employeeName: string;
  employeeNip: string;
  existingAction?: DisciplinaryAction | null;  // ← NEW
  onClose: () => void;
  onSubmit: (data: DisciplinaryAction) => Promise<void>;
}
```

#### **Pre-fill Form dengan Data Existing**:
```typescript
const [formData, setFormData] = useState<DisciplinaryAction>(() => {
  if (existingAction) {
    return {
      level: existingAction.level,              // ← Pre-fill dari existing
      type: existingAction.type,
      decisionNumber: existingAction.decisionNumber,
      decisionDate: existingAction.decisionDate,
      effectiveDate: existingAction.effectiveDate,
      endDate: existingAction.endDate || "",
      issuedBy: existingAction.issuedBy,
      violation: existingAction.violation,
      notes: existingAction.notes || "",
      documentLink: existingAction.documentLink || "",
    };
  }
  
  // Default values untuk create new
  return {
    level: "ringan",
    type: "",
    // ... default values
  };
});
```

#### **Update UI Text**:
```typescript
<DialogTitle>
  {existingAction ? "Edit Hukuman Disiplin" : "Tambah Hukuman Disiplin"}
</DialogTitle>

<Button type="submit">
  {isSubmitting 
    ? "Menyimpan..." 
    : existingAction 
      ? "Update Hukuman Disiplin" 
      : "Simpan Hukuman Disiplin"
  }
</Button>
```

---

### 2. **Update `EmployeeCaseDetail.tsx`**

#### **Pass Existing Data ke Dialog**:
```typescript
<DisciplinaryActionDialog
  employeeName={employeeCase.employeeName}
  employeeNip={employeeCase.employeeNip}
  existingAction={
    disciplinaryActions && disciplinaryActions.length > 0 
      ? disciplinaryActions[0]  // ← Pass first action
      : null
  }
  onClose={() => setShowDisciplinaryDialog(false)}
  onSubmit={handleDisciplinaryAction}
/>
```

#### **Handle Both Create & Update**:
```typescript
const handleDisciplinaryAction = async (data: DisciplinaryAction) => {
  const existingAction = disciplinaryActions?.[0];
  
  if (existingAction?.id) {
    // UPDATE existing
    await updateDisciplinaryAction(existingAction.id, {
      level: data.level,
      type: data.type,
      // ... other fields
    });
    toast.success("Hukuman disiplin berhasil diupdate");
  } else {
    // CREATE new
    await createDisciplinaryAction({
      caseId: employeeCase.id,
      // ... all fields
    });
    
    // Auto-add timeline entry
    await addTimelineItem(...);
    
    toast.success("Hukuman disiplin berhasil ditambahkan");
  }
  
  await loadCase(); // Reload data
};
```

---

## 🔍 FLOW SETELAH FIX

### **Scenario 1: Case SUDAH ADA Hukuman Disiplin**

1. User klik "Update Hukuman Disiplin"
2. Dialog terbuka dengan:
   - Title: **"Edit Hukuman Disiplin"**
   - Form pre-filled dengan data existing:
     - Level: **Sedang** (sesuai data di database)
     - Type: **Penundaan KGB 1 Tahun** (sesuai data)
     - Decision Number: **Hukdis Sedang (...)** (sesuai data)
     - Semua field lain terisi
   - Button: **"Update Hukuman Disiplin"**
3. User edit data (jika perlu)
4. User klik "Update"
5. Data di-update di database
6. Toast: **"Hukuman disiplin berhasil diupdate"**
7. Data di UI ter-refresh

### **Scenario 2: Case BELUM ADA Hukuman Disiplin**

1. User klik "Update Hukuman Disiplin"
2. Dialog terbuka dengan:
   - Title: **"Tambah Hukuman Disiplin"**
   - Form kosong (default values):
     - Level: **Ringan** (default)
     - Type: (kosong)
     - Semua field kosong
   - Button: **"Simpan Hukuman Disiplin"**
3. User isi form
4. User klik "Simpan"
5. Data di-create di database
6. Timeline entry otomatis ditambahkan
7. Toast: **"Hukuman disiplin berhasil ditambahkan dan timeline diperbarui"**
8. Data di UI ter-refresh

---

## 📊 DATA STRUCTURE

### **DisciplinaryAction Interface**:
```typescript
interface DisciplinaryAction {
  id?: string;
  caseId: string;
  employeeId: string;
  employeeName: string;
  employeeNip: string;
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
  createdBy: string;
  createdAt?: string;
  updatedAt?: string;
}
```

### **Database Table**: `disciplinary_actions`
- Kolom menggunakan snake_case: `decision_number`, `effective_date`, dll
- Mapping dilakukan di `disciplinaryActionStorage.ts`

---

## ✅ TESTING CHECKLIST

- [x] Form pre-fill dengan data existing (level, type, dates, dll)
- [x] Title dialog berubah: "Edit" vs "Tambah"
- [x] Button text berubah: "Update" vs "Simpan"
- [x] Update existing action berhasil
- [x] Create new action berhasil
- [x] Timeline auto-created untuk new action
- [x] Toast message sesuai (update vs create)
- [x] Data ter-refresh setelah save
- [x] Validation tetap berjalan

---

## 📝 FILES MODIFIED

1. ✅ `src/components/cases/DisciplinaryActionDialog.tsx`
   - Added `existingAction` prop
   - Pre-fill form with existing data
   - Dynamic UI text (title, button)

2. ✅ `src/pages/EmployeeCaseDetail.tsx`
   - Pass existing action to dialog
   - Handle both create & update in `handleDisciplinaryAction`
   - Import `updateDisciplinaryAction` function

---

## 🎯 HASIL

✅ **Form sekarang menampilkan data yang benar**:
- Jika ada hukuman disiplin existing → Form pre-filled dengan data tersebut
- Jika belum ada → Form kosong dengan default values
- User bisa edit existing atau create new
- Data tersimpan dengan benar di database

---

**Status**: ✅ **BUG FIXED - FORM PRE-FILL WORKING**
