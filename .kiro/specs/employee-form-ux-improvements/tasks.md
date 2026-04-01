# Implementation Plan: Employee Form UX Improvements

## Overview

This implementation plan breaks down Phase 1 improvements to the Employee Form (EmployeeFormModal.tsx) into discrete, testable tasks. The improvements focus on unlocking critical fields for direct editing, removing confusing locked field UI elements, adding smart validation warnings, implementing tab navigation, and enhancing auto-generate feedback with toast notifications.

The implementation maintains backward compatibility with existing functionality while significantly improving the user experience for mutations, promotions, and rank increases.

## Tasks

- [x] 1. Remove locked field UI elements and unlock critical fields
  - Remove Lock and Edit3 icon imports from lucide-react
  - Remove Lock icon components from rank_group, position_name, and department fields
  - Remove Edit button components from field labels
  - Remove scrollToSection function and all history section refs (mutationHistoryRef, positionHistoryRef, rankHistoryRef)
  - Remove disabled attribute from rank_group, position_name, and department input elements
  - Remove "bg-muted/50 cursor-not-allowed" CSS classes from critical fields
  - Convert locked fields to editable Select/Input components with proper onChange handlers
  - _Requirements: 1.1, 1.2, 1.3, 1.6, 1.7, 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8_

- [ ] 2. Add change tracking state and detection logic
  - [x] 2.1 Add change tracking state variables
    - Add hasRankChanged state variable (boolean)
    - Add hasPositionChanged state variable (boolean)
    - Add hasDepartmentChanged state variable (boolean)
    - _Requirements: 7.1, 7.2, 7.3_

  - [x] 2.2 Implement change detection useEffect hooks
    - Add useEffect to detect rank_group changes and set hasRankChanged
    - Add useEffect to detect position_name changes and set hasPositionChanged
    - Add useEffect to detect department changes and set hasDepartmentChanged
    - Compare current values with originalValues to determine if changed
    - Reset change tracking states when form is reset or closed
    - _Requirements: 7.4, 7.5, 7.6, 7.7_

- [x] 3. Add smart validation warnings for critical fields
  - Add warning message below rank_group field when hasRankChanged is true
  - Add warning message below position_name field when hasPositionChanged is true
  - Add warning message below department field when hasDepartmentChanged is true
  - Use exact warning text: "⚠️ Perubahan pangkat akan otomatis menambahkan riwayat kenaikan pangkat"
  - Use exact warning text: "⚠️ Perubahan jabatan akan otomatis menambahkan riwayat jabatan"
  - Use exact warning text: "⚠️ Perubahan unit kerja akan otomatis menambahkan riwayat mutasi"
  - Apply "text-xs text-muted-foreground" CSS classes to warning messages
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7_

- [ ] 4. Implement tab navigation structure
  - [x] 4.1 Add tab navigation components
    - Import Tabs, TabsContent, TabsList, TabsTrigger from @/components/ui/tabs
    - Add activeTab state variable with type 'main' | 'history' | 'notes'
    - Create TabsList with three TabsTrigger components: "Data Utama", "Riwayat", "Keterangan"
    - Set default activeTab to 'main'
    - _Requirements: 4.1, 4.5, 4.6, 4.7_

  - [x] 4.2 Organize form sections into tab content
    - Create TabsContent for "main" tab containing Data Pribadi, Data Kepegawaian, and Tanggal Penting sections
    - Create TabsContent for "history" tab containing all history sections (Pendidikan, Mutasi, Jabatan, Pangkat, Uji Kompetensi, Diklat)
    - Create TabsContent for "notes" tab containing all notes sections (Penempatan, Penugasan, Perubahan)
    - _Requirements: 4.2, 4.3, 4.4_

- [x] 5. Enhance auto-generate feedback with toast notifications
  - Import useToast hook from @/hooks/use-toast
  - Add toast hook initialization: const { toast } = useToast()
  - Add toast notification when rank_group auto-generation occurs with text "✅ Riwayat Kenaikan Pangkat otomatis ditambahkan"
  - Add toast notification when position_name auto-generation occurs with text "✅ Riwayat Jabatan otomatis ditambahkan"
  - Add toast notification when department auto-generation occurs with text "✅ Riwayat Mutasi otomatis ditambahkan"
  - Set toast duration to 3000ms (3 seconds)
  - Replace console.log statements with toast notifications in auto-generate logic
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8_

- [x] 6. Checkpoint - Verify core functionality
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Verify backward compatibility
  - Test NIP auto-fill functionality for birth_date, tmt_cpns, and gender fields
  - Test required field validation for name, asn_status, and department
  - Test education history form functionality
  - Test all history types (mutation, position, rank, competency, training)
  - Test all notes types (placement, assignment, change)
  - Test form reset prevention with unsaved changes (formModifiedRef logic)
  - Test gender and religion value normalization for existing employees
  - Test department selection restriction for non-Admin_Pusat users
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8_

- [x] 8. Verify responsive layout
  - Test form display on desktop (>1024px width)
  - Test form display on tablet (640px-1024px width)
  - Test form display on mobile (640px width)
  - Verify tab navigation is accessible on all screen sizes
  - Verify modal width and height constraints work properly
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [x] 9. Final checkpoint - Complete end-to-end testing
  - Test complete flow: change rank_group → warning appears → save → history created → toast shown
  - Test complete flow: change position_name → warning appears → save → history created → toast shown
  - Test complete flow: change department → warning appears → save → history created → toast shown
  - Test tab switching preserves form state
  - Test form submission includes auto-generated entries
  - Verify duplicate history entries are prevented
  - Verify auto-generated entries have current date and standard keterangan
  - Ensure all tests pass, ask the user if questions arise.
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 10.1, 10.2, 10.3, 10.4, 10.5_

## Notes

- All tasks reference specific requirements for traceability
- Tasks are organized to build incrementally on previous work
- Checkpoints ensure validation at key milestones
- Focus is on code implementation and automated testing
- Manual user acceptance testing is outside the scope of this plan
