# Integrasi Database: Hukuman Disiplin

## ✅ Status Integrasi

Fitur "Update Hukuman Disiplin" **SUDAH TERINTEGRASI PENUH** dengan database.

## 📊 Struktur Database

### Tabel: `employee_cases`

```sql
CREATE TABLE employee_cases (
  id UUID PRIMARY KEY,
  case_number TEXT,
  employee_id TEXT,
  employee_name TEXT,
  employee_nip TEXT,
  case_type TEXT,
  status TEXT,
  severity TEXT,
  description TEXT,
  report_date DATE,
  case_details JSONB DEFAULT '{}'::jsonb,  ← MENYIMPAN HUKUMAN DISIPLIN
  created_by UUID,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

### Field: `case_details` (JSONB)

```json
{
  "disciplinaryActions": [
    {
      "level": "sedang",
      "type": "penundaan_kenaikan_gaji_berkala_6_bulan",
      "decisionNumber": "123/SK/2026",
      "decisionDate": "2026-05-13",
      "effectiveDate": "2026-05-15",
      "endDate": "2026-11-15",
      "issuedBy": "Kepala BKN",
      "violation": "Tidak masuk kerja tanpa keterangan selama 5 hari",
      "notes": "Pegawai telah diberi peringatan sebelumnya",
      "documentLink": "https://example.com/sk-123.pdf",
      "addedAt": "2026-05-13T10:30:00.000Z"
    }
  ]
}
```

## 🔄 Alur Integrasi

### 1. User Submit Form

```typescript
// User mengisi form di DisciplinaryActionDialog
const formData = {
  level: "sedang",
  type: "penundaan_kenaikan_gaji_berkala_6_bulan",
  decisionNumber: "123/SK/2026",
  decisionDate: "2026-05-13",
  effectiveDate: "2026-05-15",
  endDate: "2026-11-15",
  issuedBy: "Kepala BKN",
  violation: "...",
  notes: "...",
  documentLink: "https://..."
};
```

### 2. Handler Processing

```typescript
const handleDisciplinaryAction = async (data: DisciplinaryAction) => {
  // 1. Get current case details
  const currentDetails = employeeCase.caseDetails || {};
  const disciplinaryActions = currentDetails.disciplinaryActions || [];
  
  // 2. Add new action with timestamp
  const newAction = {
    ...data,
    addedAt: new Date().toISOString(),
  };
  
  // 3. Update case_details
  const updatedDetails = {
    ...currentDetails,
    disciplinaryActions: [...disciplinaryActions, newAction],
  };
  
  // 4. Save to database
  await updateCase(employeeCase.id, {
    caseDetails: updatedDetails,
  });
  
  // 5. Auto-create timeline entry
  await addTimelineItem(...);
  
  // 6. Reload case data
  await loadCase();
};
```

### 3. Database Update

```typescript
// employeeCaseStorage.ts - updateCase()
export async function updateCase(id, updates) {
  const updateData: any = {};
  
  if (updates.caseDetails !== undefined) {
    updateData.case_details = updates.caseDetails;  // ← JSONB update
  }
  
  const { data, error } = await supabase
    .from("employee_cases")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();
    
  return mapDbCaseToEmployeeCase(data, timelines);
}
```

### 4. SQL Query Executed

```sql
UPDATE employee_cases
SET 
  case_details = '{
    "disciplinaryActions": [
      {
        "level": "sedang",
        "type": "penundaan_kenaikan_gaji_berkala_6_bulan",
        "decisionNumber": "123/SK/2026",
        ...
      }
    ]
  }'::jsonb,
  updated_at = NOW()
WHERE id = 'case-uuid-here'
RETURNING *;
```

### 5. Timeline Entry Created

```sql
INSERT INTO case_timeline (
  case_id,
  date,
  description,
  status,
  documents,
  created_at,
  updated_at
) VALUES (
  'case-uuid-here',
  '2026-05-13',
  'Hukuman Disiplin Sedang diterbitkan: Penundaan Kenaikan Gaji Berkala 6 Bulan. SK No. 123/SK/2026 oleh Kepala BKN.',
  'Hukuman Disiplin Diterbitkan',
  '[{"name": "SK Hukuman Disiplin No. 123/SK/2026", "link": "https://..."}]'::jsonb,
  NOW(),
  NOW()
);
```

## 📖 Read Operations

### 1. Get Case with Disciplinary Actions

```typescript
// employeeCaseStorage.ts - getCaseById()
export async function getCaseById(id: string) {
  const { data: caseData } = await supabase
    .from("employee_cases")
    .select("*")
    .eq("id", id)
    .single();
    
  // caseData.case_details contains disciplinaryActions
  return mapDbCaseToEmployeeCase(caseData, timelines);
}
```

### 2. Display in UI

```typescript
// EmployeeCaseDetail.tsx
{employeeCase.caseDetails?.disciplinaryActions && (
  <DisciplinaryActionsCard
    disciplinaryActions={employeeCase.caseDetails.disciplinaryActions}
  />
)}
```

### 3. Show in Informasi Kasus

```typescript
{employeeCase.caseDetails?.disciplinaryActions && 
 employeeCase.caseDetails.disciplinaryActions.length > 0 && (
  <div>
    <p className="text-sm text-muted-foreground">Hukuman Disiplin</p>
    <Badge className={getLevelColor(
      employeeCase.caseDetails.disciplinaryActions[0].level
    )}>
      {DISCIPLINARY_LEVELS[
        employeeCase.caseDetails.disciplinaryActions[0].level
      ]}
    </Badge>
  </div>
)}
```

## 🔐 RLS Policies

### Existing Policies (Already Applied)

```sql
-- Admin Pusat can view all cases (including case_details)
CREATE POLICY "Admin Pusat can view all cases"
  ON employee_cases
  FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin_pusat'));

-- Admin Pusat can update cases (including case_details)
CREATE POLICY "Admin Pusat can update cases"
  ON employee_cases
  FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'admin_pusat'));
```

**✅ RLS policies sudah mendukung read/write case_details**

## 🧪 Testing

### Manual Test Steps:

1. **Login sebagai admin_pusat**
2. **Buka detail kasus pegawai**
3. **Klik tombol "Update Hukuman Disiplin"**
4. **Isi form lengkap**:
   - Pilih tingkat: Sedang
   - Pilih jenis: Penundaan Kenaikan Gaji Berkala 6 Bulan
   - Nomor SK: 123/SK/2026
   - Tanggal keputusan: 13 Mei 2026
   - Tanggal berlaku: 15 Mei 2026
   - Tanggal berakhir: 15 November 2026
   - Pejabat: Kepala BKN
   - Pelanggaran: (isi deskripsi)
   - Link dokumen: https://example.com/sk.pdf
5. **Klik "Simpan Hukuman Disiplin"**
6. **Verifikasi**:
   - ✅ Toast success muncul
   - ✅ Card "Riwayat Hukuman Disiplin" muncul
   - ✅ Timeline baru muncul dengan status "Hukuman Disiplin Diterbitkan"
   - ✅ Badge hukuman disiplin muncul di "Informasi Kasus"

### Database Verification:

```sql
-- Check if data is saved
SELECT 
  id,
  case_number,
  employee_name,
  case_details->'disciplinaryActions' as actions
FROM employee_cases
WHERE id = 'your-case-id'
  AND case_details->'disciplinaryActions' IS NOT NULL;

-- Check timeline entry
SELECT *
FROM case_timeline
WHERE case_id = 'your-case-id'
  AND status = 'Hukuman Disiplin Diterbitkan'
ORDER BY created_at DESC
LIMIT 1;
```

## 📊 Query Examples

### Get all cases with disciplinary actions:

```sql
SELECT 
  ec.case_number,
  ec.employee_name,
  jsonb_array_length(ec.case_details->'disciplinaryActions') as action_count
FROM employee_cases ec
WHERE ec.case_details->'disciplinaryActions' IS NOT NULL
ORDER BY ec.created_at DESC;
```

### Get disciplinary actions by level:

```sql
SELECT 
  da.value->>'level' as level,
  COUNT(*) as total
FROM employee_cases ec,
     jsonb_array_elements(ec.case_details->'disciplinaryActions') as da(value)
GROUP BY da.value->>'level';
```

### Get recent disciplinary actions:

```sql
SELECT 
  ec.employee_name,
  da.value->>'level' as level,
  da.value->>'decisionNumber' as sk_number,
  da.value->>'decisionDate' as decision_date
FROM employee_cases ec,
     jsonb_array_elements(ec.case_details->'disciplinaryActions') as da(value)
WHERE (da.value->>'addedAt')::timestamp > NOW() - INTERVAL '30 days'
ORDER BY (da.value->>'addedAt')::timestamp DESC;
```

## 🔧 Troubleshooting

### Issue 1: Data tidak tersimpan

**Check**:
```sql
-- Verify case_details column exists
SELECT column_name, data_type 
FROM information_schema.columns
WHERE table_name = 'employee_cases' 
  AND column_name = 'case_details';
```

**Solution**: Column sudah ada, pastikan RLS policy allow update

### Issue 2: RLS policy block

**Check**:
```sql
-- Test as authenticated user
SELECT has_role(auth.uid(), 'admin_pusat');
```

**Solution**: Pastikan user memiliki role admin_pusat

### Issue 3: JSONB structure invalid

**Check**:
```sql
SELECT 
  id,
  jsonb_typeof(case_details) as type,
  jsonb_typeof(case_details->'disciplinaryActions') as actions_type
FROM employee_cases
WHERE case_details IS NOT NULL;
```

**Expected**: type = 'object', actions_type = 'array'

## ✅ Verification Checklist

- [x] Table `employee_cases` has `case_details` column (JSONB)
- [x] RLS policies allow admin_pusat to read/write case_details
- [x] `updateCase()` function handles caseDetails parameter
- [x] `handleDisciplinaryAction()` updates case_details correctly
- [x] Timeline entry auto-created after disciplinary action
- [x] `DisciplinaryActionsCard` reads from case_details
- [x] Badge in "Informasi Kasus" reads from case_details
- [x] Multiple disciplinary actions can be added (array)
- [x] Data persists after page reload
- [x] Toast notification shows success

## 📝 Summary

✅ **Integrasi database SUDAH LENGKAP dan BERFUNGSI**

**Data Flow**:
```
User Input → handleDisciplinaryAction() → updateCase() → 
Supabase UPDATE → case_details JSONB → Timeline Created → 
UI Reload → Display in Cards
```

**Storage**:
- ✅ Data disimpan di `employee_cases.case_details` (JSONB)
- ✅ Array `disciplinaryActions` untuk multiple entries
- ✅ Timeline auto-created di `case_timeline` table

**Security**:
- ✅ RLS policies protect data
- ✅ Only admin_pusat can add/edit
- ✅ All users with access can view

---

**Status**: ✅ FULLY INTEGRATED
**Last Verified**: 2026-05-13
**Test Script**: `test_disciplinary_action_integration.sql`
