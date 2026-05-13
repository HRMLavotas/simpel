# Migration: Tabel Disciplinary Actions

## ✅ Status: COMPLETED

Migrasi dari JSONB ke tabel terpisah untuk hukuman disiplin telah berhasil dilakukan.

## 🎯 Alasan Migrasi

### Sebelumnya (JSONB):
```json
employee_cases.case_details = {
  "disciplinaryActions": [...]
}
```

**Masalah**:
- ❌ Sulit untuk query dan filter
- ❌ Tidak ada foreign key constraints
- ❌ Tidak ada indexing yang optimal
- ❌ Sulit untuk membuat statistik
- ❌ Tidak normalized

### Sekarang (Tabel Terpisah):
```sql
CREATE TABLE disciplinary_actions (
  id UUID PRIMARY KEY,
  case_id UUID REFERENCES employee_cases(id),
  employee_id TEXT,
  level TEXT,
  type TEXT,
  ...
)
```

**Keuntungan**:
- ✅ Query lebih cepat dengan indexing
- ✅ Foreign key constraints untuk data integrity
- ✅ Mudah membuat statistik dan laporan
- ✅ Normalized database design
- ✅ Mudah untuk join dengan tabel lain

## 📊 Struktur Tabel Baru

### Table: `disciplinary_actions`

```sql
CREATE TABLE disciplinary_actions (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Foreign Keys
  case_id UUID NOT NULL REFERENCES employee_cases(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Employee Info (denormalized)
  employee_id TEXT NOT NULL,
  employee_name TEXT NOT NULL,
  employee_nip TEXT NOT NULL,
  
  -- Disciplinary Details
  level TEXT NOT NULL CHECK (level IN ('ringan', 'sedang', 'berat')),
  type TEXT NOT NULL,
  
  -- Decision Info
  decision_number TEXT NOT NULL,
  decision_date DATE NOT NULL,
  effective_date DATE NOT NULL,
  end_date DATE,
  
  -- Authority & Violation
  issued_by TEXT NOT NULL,
  violation TEXT NOT NULL,
  notes TEXT,
  
  -- Document
  document_link TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

## 🔍 Indexes

```sql
-- Performance indexes
CREATE INDEX idx_disciplinary_actions_case_id ON disciplinary_actions(case_id);
CREATE INDEX idx_disciplinary_actions_employee_id ON disciplinary_actions(employee_id);
CREATE INDEX idx_disciplinary_actions_level ON disciplinary_actions(level);
CREATE INDEX idx_disciplinary_actions_decision_date ON disciplinary_actions(decision_date DESC);
CREATE INDEX idx_disciplinary_actions_created_at ON disciplinary_actions(created_at DESC);

-- Composite index
CREATE INDEX idx_disciplinary_actions_employee_dates 
  ON disciplinary_actions(employee_id, decision_date DESC);
```

## 🔐 RLS Policies

```sql
-- Admin Pusat: Full access
CREATE POLICY "Admin Pusat can view all disciplinary actions"
  ON disciplinary_actions FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin_pusat'));

CREATE POLICY "Admin Pusat can insert disciplinary actions"
  ON disciplinary_actions FOR INSERT
  TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin_pusat'));

-- Users with case access: View only
CREATE POLICY "Users with access can view disciplinary actions"
  ON disciplinary_actions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM case_access_control
      WHERE user_id = auth.uid() AND can_view = true
    )
  );
```

## 📈 Views

### 1. Active Disciplinary Actions
```sql
CREATE VIEW active_disciplinary_actions AS
SELECT da.*, ec.case_number, ec.case_type, ec.status as case_status
FROM disciplinary_actions da
JOIN employee_cases ec ON ec.id = da.case_id
WHERE da.end_date IS NULL OR da.end_date >= CURRENT_DATE
ORDER BY da.decision_date DESC;
```

### 2. Employee Disciplinary Summary
```sql
CREATE VIEW employee_disciplinary_summary AS
SELECT 
  employee_id,
  employee_name,
  employee_nip,
  COUNT(*) as total_actions,
  COUNT(*) FILTER (WHERE level = 'ringan') as ringan_count,
  COUNT(*) FILTER (WHERE level = 'sedang') as sedang_count,
  COUNT(*) FILTER (WHERE level = 'berat') as berat_count,
  MAX(decision_date) as latest_action_date
FROM disciplinary_actions
GROUP BY employee_id, employee_name, employee_nip;
```

## 🔄 Data Migration

Migrasi otomatis dari JSONB ke tabel baru sudah dilakukan:

```sql
-- Migrate existing data from case_details JSONB
DO $$
DECLARE
  case_record RECORD;
  action_record JSONB;
BEGIN
  FOR case_record IN 
    SELECT id, employee_id, employee_name, employee_nip,
           case_details->'disciplinaryActions' as actions,
           created_by
    FROM employee_cases
    WHERE case_details->'disciplinaryActions' IS NOT NULL
  LOOP
    FOR action_record IN 
      SELECT * FROM jsonb_array_elements(case_record.actions)
    LOOP
      INSERT INTO disciplinary_actions (...) VALUES (...);
    END LOOP;
  END LOOP;
END $$;
```

## 💻 Code Changes

### 1. New Storage Layer: `disciplinaryActionStorage.ts`

```typescript
// CRUD operations
export async function getDisciplinaryActionsByCase(caseId: string)
export async function getDisciplinaryActionsByEmployee(employeeId: string)
export async function createDisciplinaryAction(action: DisciplinaryAction)
export async function updateDisciplinaryAction(id: string, updates: Partial<...>)
export async function deleteDisciplinaryAction(id: string)
export async function getActiveDisciplinaryActions(employeeId?: string)
export async function getDisciplinaryActionsStats()
```

### 2. Updated: `EmployeeCaseDetail.tsx`

**Changes**:
- ✅ Import `disciplinaryActionStorage` functions
- ✅ Add state: `disciplinaryActions`
- ✅ Add function: `loadDisciplinaryActions()`
- ✅ Update: `handleDisciplinaryAction()` to use `createDisciplinaryAction()`
- ✅ Update: Display to use `disciplinaryActions` state instead of `case_details`

**Before**:
```typescript
// From JSONB
employeeCase.caseDetails?.disciplinaryActions
```

**After**:
```typescript
// From dedicated table
const [disciplinaryActions, setDisciplinaryActions] = useState([]);
await getDisciplinaryActionsByCase(caseId);
```

## 📊 Query Examples

### Get all disciplinary actions for a case:
```sql
SELECT * FROM disciplinary_actions
WHERE case_id = 'case-uuid'
ORDER BY decision_date DESC;
```

### Get all disciplinary actions for an employee:
```sql
SELECT * FROM disciplinary_actions
WHERE employee_id = 'employee-id'
ORDER BY decision_date DESC;
```

### Get active disciplinary actions:
```sql
SELECT * FROM active_disciplinary_actions
WHERE employee_id = 'employee-id';
```

### Statistics by level:
```sql
SELECT level, COUNT(*) as total
FROM disciplinary_actions
GROUP BY level;
```

### Recent actions (last 30 days):
```sql
SELECT * FROM disciplinary_actions
WHERE created_at > NOW() - INTERVAL '30 days'
ORDER BY created_at DESC;
```

## 🧪 Testing

### 1. Test Create:
```typescript
await createDisciplinaryAction({
  caseId: 'case-uuid',
  employeeId: 'emp-id',
  employeeName: 'John Doe',
  employeeNip: '199001012020121001',
  level: 'sedang',
  type: 'penundaan_kenaikan_gaji_berkala_6_bulan',
  decisionNumber: '123/SK/2026',
  decisionDate: '2026-05-13',
  effectiveDate: '2026-05-15',
  endDate: '2026-11-15',
  issuedBy: 'Kepala BKN',
  violation: 'Test violation',
  createdBy: 'user-uuid'
});
```

### 2. Test Read:
```typescript
const actions = await getDisciplinaryActionsByCase('case-uuid');
console.log(actions); // Array of DisciplinaryAction
```

### 3. Test Update:
```typescript
await updateDisciplinaryAction('action-uuid', {
  notes: 'Updated notes'
});
```

### 4. Test Delete:
```typescript
await deleteDisciplinaryAction('action-uuid');
```

## ✅ Migration Checklist

- [x] Create migration file
- [x] Run migration (`npx supabase db push`)
- [x] Create storage layer (`disciplinaryActionStorage.ts`)
- [x] Update `EmployeeCaseDetail.tsx`
- [x] Update `DisciplinaryActionsCard.tsx` (already compatible)
- [x] Test create operation
- [x] Test read operation
- [x] Test display in UI
- [x] Verify RLS policies
- [x] Verify indexes
- [x] Test data migration from JSONB

## 🔮 Future Enhancements

With dedicated table, we can now easily:
- [ ] Create dashboard for disciplinary actions statistics
- [ ] Generate reports by period, level, type
- [ ] Track disciplinary action history per employee
- [ ] Set up notifications for expiring actions
- [ ] Create audit trail for changes
- [ ] Export data to Excel/PDF
- [ ] Create charts and visualizations

## 📝 Notes

### Data Integrity:
- ✅ Foreign key constraints ensure referential integrity
- ✅ Check constraints validate level values
- ✅ NOT NULL constraints prevent incomplete data

### Performance:
- ✅ Indexes on frequently queried columns
- ✅ Composite index for employee + date queries
- ✅ Views for common queries

### Security:
- ✅ RLS policies protect sensitive data
- ✅ Only admin_pusat can create/update/delete
- ✅ Users with case access can view

## 🎉 Benefits Summary

1. **Better Performance**: Indexed queries vs JSONB scanning
2. **Data Integrity**: Foreign keys and constraints
3. **Easier Queries**: Standard SQL vs JSONB operators
4. **Better Reports**: Easy to aggregate and analyze
5. **Scalability**: Normalized design scales better
6. **Maintainability**: Clearer schema and relationships

---

**Migration Date**: 2026-05-13
**Migration File**: `20260513130000_create_disciplinary_actions.sql`
**Status**: ✅ COMPLETED SUCCESSFULLY
