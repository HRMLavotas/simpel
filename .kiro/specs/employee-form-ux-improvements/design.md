# Design Document: Employee Form UX Improvements

## Overview

This design document specifies the implementation approach for Phase 1 improvements to the Employee Form (EmployeeFormModal.tsx). The current implementation creates unnecessary friction for common administrative tasks by locking critical fields (rank_group, position_name, department) and requiring administrators to navigate to history sections to make simple changes. This results in an 8-step process for tasks that should take 2-3 steps.

The Phase 1 improvements focus on:
1. Unlocking critical fields for direct editing
2. Removing confusing locked field UI elements (lock icons, edit buttons)
3. Adding smart validation warnings to inform users of consequences
4. Implementing tab navigation to reduce scrolling
5. Enhancing auto-generate feedback with toast notifications

These changes maintain backward compatibility with existing functionality while significantly improving the user experience for mutations, promotions, and rank increases.

## Architecture

### Component Structure

The EmployeeFormModal component will maintain its current architecture with the following modifications:

```
EmployeeFormModal (src/components/employees/EmployeeFormModal.tsx)
├── Dialog (Container)
│   ├── DialogHeader
│   └── DialogContent
│       └── Form
│           ├── Tabs Component (NEW)
│           │   ├── TabsList
│           │   │   ├── TabsTrigger: "Data Utama"
│           │   │   ├── TabsTrigger: "Riwayat"
│           │   │   └── TabsTrigger: "Keterangan"
│           │   ├── TabsContent: "main"
│           │   │   ├── Data Pribadi Section
│           │   │   ├── Data Kepegawaian Section (MODIFIED)
│           │   │   └── Tanggal Penting Section
│           │   ├── TabsContent: "history"
│           │   │   ├── EducationHistoryForm
│           │   │   ├── EmployeeHistoryForm (Mutasi)
│           │   │   ├── EmployeeHistoryForm (Jabatan)
│           │   │   ├── EmployeeHistoryForm (Pangkat)
│           │   │   ├── EmployeeHistoryForm (Uji Kompetensi)
│           │   │   └── EmployeeHistoryForm (Diklat)
│           │   └── TabsContent: "notes"
│           │       ├── NotesForm (Penempatan)
│           │       ├── NotesForm (Penugasan)
│           │       └── NotesForm (Perubahan)
│           └── Form Actions (Submit/Cancel)
└── Toast Notifications (NEW)
```

### State Management

The component will add new state variables for change tracking and tab navigation:

```typescript
// Existing state (preserved)
- form: UseFormReturn<EmployeeFormData>
- educationEntries: EducationEntry[]
- mutationEntries: HistoryEntry[]
- positionHistoryEntries: HistoryEntry[]
- rankHistoryEntries: HistoryEntry[]
- competencyEntries: HistoryEntry[]
- trainingEntries: HistoryEntry[]
- placementNotes: NoteEntry[]
- assignmentNotes: NoteEntry[]
- changeNotes: NoteEntry[]
- originalValues: { rank_group, position_name, department }
- formModifiedRef: React.MutableRefObject<boolean>
- initialLoadCompleteRef: React.MutableRefObject<boolean>

// New state (added)
- activeTab: 'main' | 'history' | 'notes'
- hasRankChanged: boolean
- hasPositionChanged: boolean
- hasDepartmentChanged: boolean
```

### Data Flow

1. **Field Unlock Flow**:
   - User edits rank_group/position_name/department directly in form
   - onChange handler updates form state
   - useEffect hook detects change by comparing with originalValues
   - Auto-generate logic creates history entry
   - Toast notification displays confirmation
   - Warning message appears below field

2. **Tab Navigation Flow**:
   - User clicks tab trigger
   - activeTab state updates
   - TabsContent conditionally renders based on activeTab
   - Form sections organized into logical groups

3. **Change Detection Flow**:
   - useEffect watches form.watch() for field changes
   - Compares current value with originalValues
   - Sets hasXChanged flags
   - Prevents duplicate history entries
   - Maintains change state until form reset

## Components and Interfaces

### Modified Components

#### EmployeeFormModal

**Props** (unchanged):
```typescript
interface EmployeeFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee?: Employee | null;
  onSubmit: (data: EmployeeFormData) => Promise<void>;
  isLoading?: boolean;
  initialEducation?: EducationEntry[];
  initialMutationHistory?: HistoryEntry[];
  initialPositionHistory?: HistoryEntry[];
  initialRankHistory?: HistoryEntry[];
  initialCompetencyTestHistory?: HistoryEntry[];
  initialTrainingHistory?: HistoryEntry[];
  initialPlacementNotes?: NoteEntry[];
  initialAssignmentNotes?: NoteEntry[];
  initialChangeNotes?: NoteEntry[];
}
```

**New Imports**:
```typescript
import { useToast } from '@/hooks/use-toast';
// Remove: Lock, Edit3 from lucide-react
```

**New State Variables**:
```typescript
const [activeTab, setActiveTab] = useState<'main' | 'history' | 'notes'>('main');
const [hasRankChanged, setHasRankChanged] = useState(false);
const [hasPositionChanged, setHasPositionChanged] = useState(false);
const [hasDepartmentChanged, setHasDepartmentChanged] = useState(false);
const { toast } = useToast();
```

**Removed Elements**:
- Lock icon components from rank_group, position_name, department fields
- Edit button components from field labels
- scrollToSection function
- mutationHistoryRef, positionHistoryRef, rankHistoryRef refs
- Lock and Edit3 icon imports

### New UI Components

#### UnlockedFieldWithWarning

A reusable pattern for unlocked fields with smart validation warnings:

```typescript
interface UnlockedFieldProps {
  label: string;
  fieldName: keyof EmployeeFormData;
  value: string;
  onChange: (value: string) => void;
  options?: string[];
  warningMessage?: string;
  showWarning: boolean;
  required?: boolean;
  disabled?: boolean;
}
```

This is implemented inline within EmployeeFormModal using existing Select/Input components with conditional warning text.

### Integration Points

#### Toast Notification System

Uses existing `@/hooks/use-toast` hook:

```typescript
const { toast } = useToast();

// Usage for auto-generate feedback
toast({
  title: "✅ Riwayat Kenaikan Pangkat otomatis ditambahkan",
  duration: 3000,
});
```

#### Tab Navigation System

Uses existing `@/components/ui/tabs` components:

```typescript
<Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'main' | 'history' | 'notes')}>
  <TabsList>
    <TabsTrigger value="main">Data Utama</TabsTrigger>
    <TabsTrigger value="history">Riwayat</TabsTrigger>
    <TabsTrigger value="notes">Keterangan</TabsTrigger>
  </TabsList>
  <TabsContent value="main">{/* Main data sections */}</TabsContent>
  <TabsContent value="history">{/* History sections */}</TabsContent>
  <TabsContent value="notes">{/* Notes sections */}</TabsContent>
</Tabs>
```

## Data Models

### Existing Data Models (Preserved)

All existing data models remain unchanged:

```typescript
// Employee interface
interface Employee {
  id: string;
  nip: string | null;
  name: string;
  front_title: string | null;
  back_title: string | null;
  birth_place: string | null;
  birth_date: string | null;
  gender: string | null;
  religion: string | null;
  position_type: string | null;
  position_name: string | null;
  asn_status: string | null;
  rank_group: string | null;
  department: string;
  join_date: string | null;
  tmt_cpns: string | null;
  tmt_pns: string | null;
  tmt_pensiun: string | null;
}

// EmployeeFormData (from zod schema)
type EmployeeFormData = z.infer<typeof employeeSchema> & {
  education_history?: EducationEntry[];
  mutation_history?: HistoryEntry[];
  position_history?: HistoryEntry[];
  rank_history?: HistoryEntry[];
  competency_test_history?: HistoryEntry[];
  training_history?: HistoryEntry[];
  placement_notes?: NoteEntry[];
  assignment_notes?: NoteEntry[];
  change_notes?: NoteEntry[];
};

// HistoryEntry (from EmployeeHistoryForm)
interface HistoryEntry {
  tanggal: string;
  [key: string]: string; // Dynamic fields based on history type
}

// EducationEntry (from EducationHistoryForm)
interface EducationEntry {
  tingkat: string;
  nama_sekolah: string;
  jurusan: string;
  tahun_lulus: string;
}

// NoteEntry (from NotesForm)
interface NoteEntry {
  tanggal: string;
  keterangan: string;
}
```

### New Internal State Models

```typescript
// Tab navigation state
type TabValue = 'main' | 'history' | 'notes';

// Change tracking state
interface ChangeTracking {
  hasRankChanged: boolean;
  hasPositionChanged: boolean;
  hasDepartmentChanged: boolean;
}

// Original values for change detection
interface OriginalValues {
  rank_group: string;
  position_name: string;
  department: string;
}
```

### Auto-Generated History Entry Format

When critical fields change, the system auto-generates history entries with this format:

**Rank History Entry**:
```typescript
{
  tanggal: "2024-01-15", // Current date in ISO format
  pangkat_lama: "III/c - Penata",
  pangkat_baru: "III/d - Penata Tingkat I",
  tmt: "2024-01-15",
  nomor_sk: "",
  keterangan: "Perubahan data - Auto-generated"
}
```

**Position History Entry**:
```typescript
{
  tanggal: "2024-01-15",
  jabatan_lama: "Kepala Subbag Kepegawaian",
  jabatan_baru: "Kepala Bagian Umum",
  nomor_sk: "",
  keterangan: "Perubahan data - Auto-generated"
}
```

**Mutation History Entry**:
```typescript
{
  tanggal: "2024-01-15",
  dari_unit: "Sesditjen",
  ke_unit: "Ditjen PAUD",
  nomor_sk: "",
  keterangan: "Mutasi - Auto-generated"
}
```


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property Reflection

After analyzing all acceptance criteria, I identified the following redundancies:
- Requirements 1.6 and 1.7 can be combined into a single property about unlocked field attributes
- Requirements 3.1, 3.2, 3.3 can be combined into a single property about warning display
- Requirements 5.1, 5.2, 5.3 can be combined into a single property about toast notifications
- Requirements 6.1, 6.2, 6.3 can be combined into a single property about history entry creation
- Requirement 8.2 and 10.3 are identical (required field validation)
- Requirement 10.4 is subsumed by the combined property from 6.1-6.3

The following properties provide unique validation value after eliminating redundancy:

### Property 1: Unlocked Fields Are Editable

*For any* of the three critical fields (rank_group, position_name, department), the field should not have the disabled attribute and should not have the "bg-muted/50 cursor-not-allowed" CSS classes.

**Validates: Requirements 1.6, 1.7**

### Property 2: Critical Field Changes Display Warnings

*For any* change to rank_group, position_name, or department fields, a warning message should appear below the changed field.

**Validates: Requirements 3.1, 3.2, 3.3**

### Property 3: Warning Messages Use Consistent Styling

*For any* warning message displayed below critical fields, the message should use the "text-xs text-muted-foreground" CSS classes.

**Validates: Requirements 3.7**

### Property 4: Auto-Generation Triggers Toast Notifications

*For any* critical field change (rank_group, position_name, department) that triggers auto-generation of a history entry, a toast notification should be displayed.

**Validates: Requirements 5.1, 5.2, 5.3**

### Property 5: Toast Notifications Auto-Dismiss

*For any* toast notification displayed by the Employee Form, the notification should auto-dismiss after 3 seconds.

**Validates: Requirements 5.7**

### Property 6: Critical Field Changes Create History Entries

*For any* change to rank_group, position_name, or department from an old value to a new value, the system should create a corresponding history entry (rank history, position history, or mutation history respectively).

**Validates: Requirements 6.1, 6.2, 6.3**

### Property 7: Auto-Generated Entries Have Current Date

*For any* auto-generated history entry, the tanggal field should be set to the current date in ISO format (YYYY-MM-DD).

**Validates: Requirements 6.4, 10.5**

### Property 8: Auto-Generated Entries Have Standard Keterangan

*For any* auto-generated history entry, the keterangan field should be set to either "Perubahan data - Auto-generated" (for rank and position) or "Mutasi - Auto-generated" (for department).

**Validates: Requirements 6.5**

### Property 9: Duplicate History Entries Are Prevented

*For any* critical field change, if an identical history entry already exists (same old value, same new value), the system should not create a duplicate entry.

**Validates: Requirements 6.6**

### Property 10: NIP Auto-Fill Works For Valid NIPs

*For any* valid 18-digit NIP entered, the system should automatically fill birth_date, tmt_cpns, and gender fields based on the NIP structure.

**Validates: Requirements 8.1**

### Property 11: Required Fields Are Validated

*For any* form submission attempt, if required fields (name, asn_status, department) are empty, the system should prevent submission and display validation errors.

**Validates: Requirements 8.2, 10.3**

### Property 12: Form Reset Is Prevented With Unsaved Changes

*For any* form state where the user has made changes (formModifiedRef is true), the system should prevent automatic form reset to avoid losing unsaved data.

**Validates: Requirements 8.6**

### Property 13: Gender and Religion Values Are Normalized

*For any* existing employee loaded into the form, gender and religion values should be normalized to match the exact values in the dropdown options (e.g., "L" → "Laki-laki", "p" → "Perempuan").

**Validates: Requirements 8.7**

### Property 14: Saved Data Includes Auto-Generated Entries

*For any* form submission with changed critical fields, all auto-generated history entries should be included in the submitted data.

**Validates: Requirements 10.1**

### Property 15: History Entries Have Required Fields

*For any* history entry (auto-generated or manual), the entry should have the required fields: tanggal, old value field, and new value field.

**Validates: Requirements 10.2**

## Error Handling

### Field Validation Errors

**Scenario**: User attempts to submit form with invalid or missing required fields

**Handling**:
1. Form validation (zod schema) catches errors before submission
2. Display inline error messages below each invalid field
3. Prevent form submission until all errors are resolved
4. Error messages use "text-xs text-destructive" styling

**Example Error Messages**:
- "Nama minimal 3 karakter" (name too short)
- "Status ASN wajib dipilih" (asn_status required)
- "Unit kerja wajib dipilih" (department required)
- "NIP maksimal 18 digit" (nip too long)

### NIP Auto-Fill Errors

**Scenario**: User enters invalid 18-digit NIP that cannot be parsed

**Handling**:
1. Try-catch block wraps NIP parsing logic
2. Log error to console for debugging
3. Silently fail without disrupting user experience
4. Allow user to manually fill birth_date, tmt_cpns, gender fields

**Code Pattern**:
```typescript
try {
  // Parse NIP and auto-fill fields
} catch (error) {
  console.error('Error parsing NIP:', error);
  // Continue without auto-fill
}
```

### History Entry Duplication

**Scenario**: User changes a critical field multiple times to the same value

**Handling**:
1. Check if identical history entry already exists before adding
2. Compare old value and new value with existing entries
3. Skip creation if duplicate found
4. No error message needed (silent prevention)

**Code Pattern**:
```typescript
const alreadyExists = rankHistoryEntries.some(
  entry => entry.pangkat_lama === oldRank && entry.pangkat_baru === newRank
);

if (!alreadyExists) {
  // Create new entry
}
```

### Toast Notification Errors

**Scenario**: Toast system fails to display notification

**Handling**:
1. Toast failures are non-critical (feedback only)
2. No try-catch needed (toast hook handles errors internally)
3. Auto-generation still succeeds even if toast fails
4. User can verify history entries in the Riwayat tab

### Tab Navigation Errors

**Scenario**: Invalid tab value is set

**Handling**:
1. TypeScript type system prevents invalid tab values at compile time
2. activeTab state is typed as 'main' | 'history' | 'notes'
3. Default to 'main' tab if state is somehow corrupted
4. No runtime error handling needed

### Form Reset Conflicts

**Scenario**: Form tries to reset while user has unsaved changes

**Handling**:
1. Check formModifiedRef before resetting
2. Skip reset if user has made changes
3. Log warning to console for debugging
4. Preserve user's work to prevent data loss

**Code Pattern**:
```typescript
if (formModifiedRef.current && initialLoadCompleteRef.current) {
  console.log('⚠️ Skipping form reset - user has unsaved changes');
  return;
}
```

### Department Selection Errors

**Scenario**: Non-Admin_Pusat user tries to select different department

**Handling**:
1. Restrict department dropdown to user's assigned department
2. Disable dropdown if only one option available
3. Display help text explaining restriction
4. No error message needed (preventive UI)

### Data Submission Errors

**Scenario**: API call fails when saving employee data

**Handling**:
1. Parent component (Employees.tsx) handles submission errors
2. Display toast notification with error message
3. Keep form open with user's data intact
4. Allow user to retry submission
5. Log error details to console

**Note**: This design focuses on form UI improvements. Actual submission error handling is implemented in the parent component.

## Testing Strategy

### Dual Testing Approach

This feature requires both unit tests and property-based tests to ensure comprehensive coverage:

**Unit Tests**: Focus on specific examples, edge cases, and UI integration
- Verify specific tab labels and content
- Check exact warning message text
- Test specific user role behaviors (Admin_Pusat vs non-admin)
- Validate UI element presence/absence (lock icons, edit buttons)
- Test form initialization and reset behavior

**Property-Based Tests**: Focus on universal properties across all inputs
- Field unlock behavior across all three critical fields
- Warning display for any field change
- Toast notifications for any auto-generation trigger
- History entry creation for any valid field change
- Duplicate prevention for any repeated change
- NIP auto-fill for any valid 18-digit NIP
- Required field validation for any submission attempt

### Property-Based Testing Configuration

**Library**: fast-check (JavaScript/TypeScript property-based testing library)

**Configuration**:
- Minimum 100 iterations per property test
- Each test tagged with feature name and property reference
- Tag format: `Feature: employee-form-ux-improvements, Property {number}: {property_text}`

**Example Test Structure**:
```typescript
import fc from 'fast-check';

describe('Employee Form UX Improvements', () => {
  it('Property 1: Unlocked Fields Are Editable', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('rank_group', 'position_name', 'department'),
        (fieldName) => {
          // Render form
          // Check field is not disabled
          // Check field doesn't have locked CSS classes
          return !isDisabled && !hasLockedClasses;
        }
      ),
      { numRuns: 100 }
    );
  });
  
  // Feature: employee-form-ux-improvements, Property 1: Unlocked Fields Are Editable
});
```

### Unit Testing Strategy

**Testing Library**: React Testing Library + Vitest

**Test Categories**:

1. **Field Unlock Tests**:
   - Verify rank_group field is editable
   - Verify position_name field is editable
   - Verify department field is editable
   - Verify no disabled attributes on critical fields
   - Verify no locked CSS classes on critical fields

2. **UI Element Removal Tests**:
   - Verify Lock icon is not rendered for rank_group
   - Verify Lock icon is not rendered for position_name
   - Verify Lock icon is not rendered for department
   - Verify Edit button is not rendered for any critical field

3. **Warning Message Tests**:
   - Verify warning appears when rank_group changes
   - Verify warning appears when position_name changes
   - Verify warning appears when department changes
   - Verify exact warning text for each field
   - Verify warning CSS classes

4. **Tab Navigation Tests**:
   - Verify three tabs are rendered with correct labels
   - Verify "Data Utama" tab shows correct sections
   - Verify "Riwayat" tab shows all history sections
   - Verify "Keterangan" tab shows all notes sections
   - Verify default tab is "main"

5. **Toast Notification Tests**:
   - Verify toast appears for rank_group auto-generation
   - Verify toast appears for position_name auto-generation
   - Verify toast appears for department auto-generation
   - Verify exact toast text for each field
   - Verify toast duration is 3 seconds

6. **Auto-Generation Tests**:
   - Verify rank history entry created on rank_group change
   - Verify position history entry created on position_name change
   - Verify mutation history entry created on department change
   - Verify auto-generated entries have current date
   - Verify auto-generated entries have standard keterangan
   - Verify duplicate entries are prevented

7. **Backward Compatibility Tests**:
   - Verify NIP auto-fill still works
   - Verify required field validation still works
   - Verify education history form still works
   - Verify all history types still work
   - Verify all notes types still work
   - Verify form reset prevention still works
   - Verify gender/religion normalization still works

8. **Role-Based Tests**:
   - Verify Admin_Pusat sees all departments
   - Verify non-admin sees only their department

9. **Integration Tests**:
   - Verify complete flow: change field → warning appears → save → history created → toast shown
   - Verify tab switching preserves form state
   - Verify form submission includes auto-generated entries

### Test Data Generators

For property-based tests, we need generators for:

```typescript
// Employee data generator
const employeeArb = fc.record({
  id: fc.uuid(),
  nip: fc.option(fc.stringOf(fc.integer(0, 9), { minLength: 18, maxLength: 18 })),
  name: fc.string({ minLength: 3, maxLength: 255 }),
  rank_group: fc.option(fc.constantFrom(...RANK_GROUPS_PNS)),
  position_name: fc.option(fc.string({ maxLength: 255 })),
  department: fc.constantFrom(...DEPARTMENTS),
  // ... other fields
});

// Field change generator
const fieldChangeArb = fc.record({
  fieldName: fc.constantFrom('rank_group', 'position_name', 'department'),
  oldValue: fc.string(),
  newValue: fc.string(),
});

// Valid NIP generator (18 digits with valid structure)
const validNipArb = fc.tuple(
  fc.date({ min: new Date('1950-01-01'), max: new Date('2005-12-31') }), // birth date
  fc.date({ min: new Date('1970-01-01'), max: new Date('2024-12-31') }), // tmt cpns
  fc.constantFrom('1', '2'), // gender code
).map(([birthDate, tmtCpns, genderCode]) => {
  const birthStr = birthDate.toISOString().slice(0, 10).replace(/-/g, '');
  const tmtStr = tmtCpns.toISOString().slice(0, 7).replace(/-/g, '');
  const randomDigits = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return birthStr + tmtStr + genderCode + randomDigits;
});
```

### Edge Cases to Test

1. **Empty/Null Values**:
   - Changing from empty to value
   - Changing from value to empty
   - Null vs empty string handling

2. **Rapid Changes**:
   - Changing field multiple times quickly
   - Changing back to original value
   - Changing between multiple different values

3. **Special Characters**:
   - Position names with special characters
   - Department names with special characters

4. **Boundary Values**:
   - Minimum length names (3 characters)
   - Maximum length names (255 characters)
   - Maximum NIP length (18 digits)

5. **Role Transitions**:
   - User role changes while form is open
   - Department assignment changes while form is open

6. **Tab Switching**:
   - Switching tabs with unsaved changes
   - Switching tabs after auto-generation
   - Switching tabs during validation errors

### Test Coverage Goals

- **Line Coverage**: > 90%
- **Branch Coverage**: > 85%
- **Function Coverage**: > 90%
- **Property Test Iterations**: 100 per property

### Continuous Integration

All tests should run on:
- Pre-commit hooks (unit tests only)
- Pull request CI pipeline (all tests)
- Main branch CI pipeline (all tests)
- Nightly builds (extended property test runs with 1000 iterations)

