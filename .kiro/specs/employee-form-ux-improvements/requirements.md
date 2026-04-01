# Requirements Document

## Introduction

This document specifies requirements for improving the Employee Form UX to make common administrative tasks (mutations, promotions, rank increases) more efficient and intuitive. The current implementation requires 8 steps for simple tasks like employee mutations when it should take 2-3 steps. This feature focuses on Phase 1 improvements: unlocking critical fields, adding tab navigation, improving feedback, and removing confusing locked field UI elements.

## Glossary

- **Employee_Form**: The modal dialog component (EmployeeFormModal.tsx) used to create and edit employee records
- **Locked_Field**: A form field that is disabled and cannot be edited directly (rank_group, position_name, department)
- **History_Entry**: A record in one of the history sections (mutation, position, rank) that tracks changes over time
- **Auto_Generate**: The system behavior that automatically creates history entries when critical fields change
- **Tab_Navigation**: UI component that organizes form sections into tabs (Main Data, History, Notes)
- **Toast_Notification**: A temporary visual feedback message displayed to users
- **Smart_Validation**: Validation logic that warns users about consequences of field changes
- **Admin_Pusat**: Central administrator role with permissions to edit all departments
- **Mutation**: Transfer of an employee from one department/unit to another
- **Promotion**: Change in employee position/job title
- **Rank_Increase**: Change in employee rank/grade (golongan/pangkat)

## Requirements

### Requirement 1: Unlock Critical Fields for Direct Editing

**User Story:** As an administrator, I want to edit rank, position, and department fields directly in the form, so that I can make simple changes without navigating to history sections.

#### Acceptance Criteria

1. THE Employee_Form SHALL allow direct editing of the rank_group field
2. THE Employee_Form SHALL allow direct editing of the position_name field
3. THE Employee_Form SHALL allow direct editing of the department field
4. WHEN Admin_Pusat edits the department field, THE Employee_Form SHALL display all available departments
5. WHEN a non-Admin_Pusat user edits the department field, THE Employee_Form SHALL restrict selection to their assigned department
6. FOR ALL three unlocked fields, THE Employee_Form SHALL remove the disabled attribute from the input elements
7. FOR ALL three unlocked fields, THE Employee_Form SHALL remove the "bg-muted/50 cursor-not-allowed" CSS classes

### Requirement 2: Remove Locked Field UI Elements

**User Story:** As an administrator, I want the form to look clean without confusing lock icons and edit buttons, so that the interface is more intuitive.

#### Acceptance Criteria

1. THE Employee_Form SHALL remove the Lock icon component from the rank_group field
2. THE Employee_Form SHALL remove the Lock icon component from the position_name field
3. THE Employee_Form SHALL remove the Lock icon component from the department field
4. THE Employee_Form SHALL remove the "Edit" button from the rank_group field label
5. THE Employee_Form SHALL remove the "Edit" button from the position_name field label
6. THE Employee_Form SHALL remove the "Edit" button from the department field label
7. THE Employee_Form SHALL remove the scrollToSection function and all references to history section refs (mutationHistoryRef, positionHistoryRef, rankHistoryRef)
8. THE Employee_Form SHALL remove the Lock and Edit3 icon imports from lucide-react

### Requirement 3: Add Smart Validation Warnings

**User Story:** As an administrator, I want to see clear warnings when I change critical fields, so that I understand the consequences of my changes.

#### Acceptance Criteria

1. WHEN the rank_group field is changed, THE Employee_Form SHALL display a warning message below the field
2. WHEN the position_name field is changed, THE Employee_Form SHALL display a warning message below the field
3. WHEN the department field is changed, THE Employee_Form SHALL display a warning message below the field
4. THE warning message for rank_group SHALL state "⚠️ Perubahan pangkat akan otomatis menambahkan riwayat kenaikan pangkat"
5. THE warning message for position_name SHALL state "⚠️ Perubahan jabatan akan otomatis menambahkan riwayat jabatan"
6. THE warning message for department SHALL state "⚠️ Perubahan unit kerja akan otomatis menambahkan riwayat mutasi"
7. THE warning messages SHALL use the "text-xs text-muted-foreground" CSS classes for consistent styling

### Requirement 4: Implement Tab Navigation

**User Story:** As an administrator, I want to navigate between form sections using tabs, so that I can find information quickly without excessive scrolling.

#### Acceptance Criteria

1. THE Employee_Form SHALL display three tabs: "Data Utama", "Riwayat", and "Keterangan"
2. WHEN the "Data Utama" tab is active, THE Employee_Form SHALL display Data Pribadi, Data Kepegawaian, and Tanggal Penting sections
3. WHEN the "Riwayat" tab is active, THE Employee_Form SHALL display all history sections (Pendidikan, Mutasi, Jabatan, Pangkat, Uji Kompetensi, Diklat)
4. WHEN the "Keterangan" tab is active, THE Employee_Form SHALL display all notes sections (Penempatan, Penugasan, Perubahan)
5. THE Employee_Form SHALL maintain the activeTab state with type 'main' | 'history' | 'notes'
6. THE Employee_Form SHALL default to the 'main' tab when the form opens
7. THE Employee_Form SHALL use the Tabs, TabsContent, TabsList, and TabsTrigger components from @/components/ui/tabs

### Requirement 5: Enhance Auto-Generate Feedback

**User Story:** As an administrator, I want to receive clear visual feedback when history entries are auto-generated, so that I know the system has recorded my changes.

#### Acceptance Criteria

1. WHEN a rank_group change triggers auto-generation, THE Employee_Form SHALL display a toast notification
2. WHEN a position_name change triggers auto-generation, THE Employee_Form SHALL display a toast notification
3. WHEN a department change triggers auto-generation, THE Employee_Form SHALL display a toast notification
4. THE toast notification for rank changes SHALL state "✅ Riwayat Kenaikan Pangkat otomatis ditambahkan"
5. THE toast notification for position changes SHALL state "✅ Riwayat Jabatan otomatis ditambahkan"
6. THE toast notification for department changes SHALL state "✅ Riwayat Mutasi otomatis ditambahkan"
7. THE toast notifications SHALL appear for 3 seconds before auto-dismissing
8. THE Employee_Form SHALL use the toast component from @/components/ui/use-toast

### Requirement 6: Preserve Auto-Generate History Logic

**User Story:** As an administrator, I want the system to automatically create history entries when I change critical fields, so that I don't have to manually duplicate data entry.

#### Acceptance Criteria

1. WHEN rank_group changes from an old value to a new value, THE Employee_Form SHALL create a new rank history entry
2. WHEN position_name changes from an old value to a new value, THE Employee_Form SHALL create a new position history entry
3. WHEN department changes from an old value to a new value, THE Employee_Form SHALL create a new mutation history entry
4. FOR ALL auto-generated entries, THE Employee_Form SHALL set the tanggal field to the current date
5. FOR ALL auto-generated entries, THE Employee_Form SHALL set the keterangan field to "Perubahan data - Auto-generated" or "Mutasi - Auto-generated"
6. THE Employee_Form SHALL prevent duplicate history entries by checking if an identical entry already exists
7. THE Employee_Form SHALL track original values (originalValues state) for change detection when editing existing employees

### Requirement 7: Maintain Change Detection State

**User Story:** As a developer, I want the form to track which critical fields have changed, so that future enhancements can use this information for conditional logic.

#### Acceptance Criteria

1. THE Employee_Form SHALL maintain a hasRankChanged state variable of type boolean
2. THE Employee_Form SHALL maintain a hasPositionChanged state variable of type boolean
3. THE Employee_Form SHALL maintain a hasDepartmentChanged state variable of type boolean
4. WHEN rank_group changes, THE Employee_Form SHALL set hasRankChanged to true
5. WHEN position_name changes, THE Employee_Form SHALL set hasPositionChanged to true
6. WHEN department changes, THE Employee_Form SHALL set hasDepartmentChanged to true
7. WHEN the form is reset or closed, THE Employee_Form SHALL reset all change tracking states to false

### Requirement 8: Preserve Existing Form Behavior

**User Story:** As an administrator, I want all existing form functionality to continue working, so that the improvements don't break current workflows.

#### Acceptance Criteria

1. THE Employee_Form SHALL continue to support NIP auto-fill for birth_date, tmt_cpns, and gender fields
2. THE Employee_Form SHALL continue to validate required fields (name, asn_status, department)
3. THE Employee_Form SHALL continue to support education history entries with EducationHistoryForm component
4. THE Employee_Form SHALL continue to support all history types (mutation, position, rank, competency, training)
5. THE Employee_Form SHALL continue to support all notes types (placement, assignment, change)
6. THE Employee_Form SHALL continue to prevent form reset when user has unsaved changes (formModifiedRef logic)
7. THE Employee_Form SHALL continue to normalize gender and religion values for existing employees
8. THE Employee_Form SHALL continue to restrict department selection for non-Admin_Pusat users

### Requirement 9: Maintain Responsive Layout

**User Story:** As an administrator using different devices, I want the form to display properly on various screen sizes, so that I can work efficiently on desktop and tablet devices.

#### Acceptance Criteria

1. THE Employee_Form SHALL use responsive grid layouts with "sm:grid-cols-2" for field groups
2. THE Employee_Form SHALL maintain the modal width at "w-[95vw] max-w-3xl"
3. THE Employee_Form SHALL maintain the modal height at "max-h-[90vh]" with overflow-y-auto
4. THE Employee_Form SHALL ensure tab navigation is accessible on mobile devices
5. THE Employee_Form SHALL ensure all form fields remain usable on screens as small as 640px width

### Requirement 10: Ensure Data Integrity

**User Story:** As a system administrator, I want the form to maintain data integrity when fields are unlocked, so that employee records remain accurate and consistent.

#### Acceptance Criteria

1. WHEN an employee is saved with changed critical fields, THE Employee_Form SHALL include all auto-generated history entries in the submission
2. THE Employee_Form SHALL validate that history entries have required fields (tanggal, old value, new value)
3. THE Employee_Form SHALL prevent saving if required fields (name, asn_status, department) are empty
4. THE Employee_Form SHALL maintain the relationship between current field values and the latest history entry
5. FOR ALL history entries, THE Employee_Form SHALL use the current date in ISO format (YYYY-MM-DD)
