# Implementation Plan: Usulan Ujikom Pegawai

## Overview

This implementation plan breaks down the Usulan Ujikom Pegawai feature into actionable tasks. The feature enables Admin Unit to propose employees for competency testing (ujikom) with integrated position quota validation from Peta Jabatan, intelligent waiting list management, and complete workflow processing by Admin Pusat from verification to final results.

The implementation follows the existing TypeScript/React architecture with Supabase backend, TanStack Query for state management, React Hook Form with Zod validation, and shadcn/ui components.

## Tasks

- [ ] 1. Set up database schema and storage infrastructure
  - [ ] 1.1 Create database tables and indexes
    - Create `usulan_ujikom` table with all required fields and constraints
    - Create `usulan_ujikom_status_history` audit table
    - Add indexes for performance optimization (employee, position, department, status, waiting queue)
    - Create trigger for `updated_at` timestamp
    - _Requirements: 1, 5, 11_
  
  - [ ] 1.2 Implement Row Level Security (RLS) policies
    - Create policies for Admin Pusat (full access to all usulan)
    - Create policies for Admin Unit (view/create/update/delete own department)
    - Create policies for status history table access
    - Test RLS policies with different user roles
    - _Requirements: 1, 7_
  
  - [ ] 1.3 Set up Supabase Storage bucket and policies
    - Create `usulan-ujikom` storage bucket
    - Create folder structure: `{usulan_id}/surat-pengantar/`
    - Implement storage policies for Admin Pusat and Admin Unit
    - Test file upload and access permissions
    - _Requirements: 4_

- [ ] 2. Create TypeScript types and validation schemas
  - [ ] 2.1 Define core TypeScript interfaces
    - Create `UsulanUjikom` interface with all fields
    - Create `UsulanStatus` type union
    - Create `UsulanStatusHistory` interface
    - Create `FormasiInfo` and `WaitingListInfo` interfaces
    - Create form data types (`UsulanFormData`, `UsulanUpdateData`, `StatusChangeData`)
    - Place in `src/lib/usulan-ujikom-types.ts`
    - _Requirements: 1, 2, 5_
  
  - [ ] 2.2 Create Zod validation schemas
    - Create `usulanFormSchema` with employee, position, document validations
    - Create `usulanUpdateSchema` for partial updates
    - Create `statusChangeSchema` for status transitions
    - Create `cancellationSchema` with minimum 10 character reason
    - Create `feedbackSchema` for ujikom results
    - Implement file size (5MB) and format (PDF/JPG/PNG) validation
    - Place in `src/lib/usulan-ujikom-validation.ts`
    - _Requirements: 4, 12_

- [ ] 3. Implement core API functions
  - [ ] 3.1 Create Supabase client functions for CRUD operations
    - Implement `fetchUsulanList()` with department filtering and joins
    - Implement `fetchUsulanById()` with full data joins
    - Implement `createUsulan()` with document upload
    - Implement `updateUsulan()` with optional document update
    - Implement `deleteUsulan()` for draft usulan
    - Implement `fetchStatusHistory()` for audit trail
    - Place in `src/lib/usulan-ujikom-storage.ts`
    - _Requirements: 1, 7_
  
  - [ ] 3.2 Implement formasi calculation logic
    - Create `calculateFormasi()` function to compute available positions
    - Query `position_references.abk_count` for total quota
    - Count usulan with status `Lulus_Ujikom` for same position and department
    - Return `FormasiInfo` object with availability status
    - Add error handling for missing position references
    - Place in `src/lib/usulan-ujikom-storage.ts`
    - _Requirements: 2, 5_
  
  - [ ] 3.3 Implement document storage operations
    - Create `uploadSuratPengantar()` to upload file to Supabase Storage
    - Generate file path: `usulan-ujikom/{usulan_id}/surat-pengantar/{filename}`
    - Create `deleteSuratPengantar()` for file cleanup
    - Create `getSuratPengantarUrl()` to generate public/signed URLs
    - Handle storage errors with user-friendly messages
    - Place in `src/lib/usulan-ujikom-storage.ts`
    - _Requirements: 4_
  
  - [ ] 3.4 Implement status change operations
    - Create `changeUsulanStatus()` function with validation
    - Record status change in `usulan_ujikom_status_history`
    - Trigger notification creation for status changes
    - Validate status transitions according to workflow rules
    - Handle cancellation reason and feedback notes
    - Place in `src/lib/usulan-ujikom-storage.ts`
    - _Requirements: 7, 8, 11_
  
  - [ ] 3.5 Implement automatic promotion algorithm
    - Create `promoteFromWaitingList()` function triggered after status changes
    - Check if status changed to `Tidak_Lulus_Ujikom` or `Dibatalkan`
    - Calculate available formasi after status change
    - Query waiting list ordered by `submitted_at` ASC (FIFO)
    - Update status to `Diajukan` and clear queue position
    - Create notifications for promoted usulan
    - Create `reorderWaitingList()` to update queue positions
    - Place in `src/lib/usulan-ujikom-storage.ts`
    - _Requirements: 6_

- [ ] 4. Create custom React hooks for data management
  - [ ] 4.1 Create `useUsulanUjikom` hook for listing and fetching
    - Use TanStack Query `useQuery` for data fetching
    - Implement department filtering based on user role
    - Add search, filter, and sort parameters
    - Include employee and position data in joins
    - Handle loading and error states
    - Place in `src/hooks/useUsulanUjikom.ts`
    - _Requirements: 1, 7_
  
  - [ ] 4.2 Create `useUsulanUjikomMutations` hook for CUD operations
    - Use TanStack Query `useMutation` for create/update/delete
    - Implement `createUsulanMutation` with document upload
    - Implement `updateUsulanMutation` with optional document update
    - Implement `deleteUsulanMutation` for draft usulan
    - Implement `changeStatusMutation` for Admin Pusat actions
    - Invalidate queries after successful mutations
    - Place in `src/hooks/useUsulanUjikomMutations.ts`
    - _Requirements: 1, 7_
  
  - [ ] 4.3 Create `useFormasi` hook for position quota calculation
    - Use TanStack Query `useQuery` to fetch formasi data
    - Accept `position_reference_id` and `department` parameters
    - Return `FormasiInfo` with availability status
    - Implement real-time updates when usulan status changes
    - Place in `src/hooks/useFormasi.ts`
    - _Requirements: 2, 5_
  
  - [ ] 4.4 Create `useUsulanNotifications` hook for real-time updates
    - Use Supabase real-time subscriptions for `notifications` table
    - Filter by `type = 'usulan_ujikom_status_change'` and user department
    - Trigger toast notifications for status changes
    - Mark notifications as read when clicked
    - Place in `src/hooks/useUsulanNotifications.ts`
    - _Requirements: 8_

- [ ] 5. Build reusable UI components
  - [ ] 5.1 Create `StatusBadge` component
    - Display status with appropriate color coding
    - Gray for Draft and Dibatalkan
    - Yellow for Waiting_List
    - Blue for Diajukan
    - Purple for Verifikasi_Berkas
    - Orange for Proses_Ujikom
    - Green for Lulus_Ujikom
    - Red for Tidak_Lulus_Ujikom
    - Use existing Badge component from shadcn/ui
    - Place in `src/components/usulan-ujikom/StatusBadge.tsx`
    - _Requirements: 10_
  
  - [ ] 5.2 Create `PetaJabatanSelector` component
    - Display list of available positions from `position_references`
    - Filter by `position_category = 'Jabatan Fungsional'` and user department
    - Show remaining formasi quota for each position using `useFormasi`
    - Highlight full positions with warning indicator
    - Use Select component from shadcn/ui
    - Place in `src/components/usulan-ujikom/PetaJabatanSelector.tsx`
    - _Requirements: 2_
  
  - [ ] 5.3 Create `EmployeeSelector` component
    - Display searchable list of eligible employees
    - Filter by department and `asn_status IS NOT NULL` and `is_active = true`
    - Show employee name, NIP, current position, and rank
    - Implement search by name or NIP with debounce
    - Validate no active usulan exists for same position
    - Use Combobox pattern with Command component from shadcn/ui
    - Place in `src/components/usulan-ujikom/EmployeeSelector.tsx`
    - _Requirements: 3_
  
  - [ ] 5.4 Create `DocumentUpload` component
    - File input for Surat Pengantar (PDF/JPG/PNG, max 5MB)
    - Text input for Link Dokumen Persyaratan with URL validation
    - Show upload progress indicator
    - Display uploaded file preview with download link
    - Show file size and format validation errors
    - Include delete file button for existing uploads
    - Place in `src/components/usulan-ujikom/DocumentUpload.tsx`
    - _Requirements: 4, 12_
  
  - [ ] 5.5 Create `StatusHistory` component
    - Display timeline of status changes with timestamps
    - Show previous status, new status, changed by, and notes
    - Highlight cancellation reasons and feedback notes
    - Use vertical timeline layout with icons
    - Place in `src/components/usulan-ujikom/StatusHistory.tsx`
    - _Requirements: 11_
  
  - [ ] 5.6 Create `WaitingListQueue` component
    - Display current queue position for waiting usulan
    - Show list of other waiting usulan for same position
    - Display estimated wait information
    - Use Card component from shadcn/ui
    - Place in `src/components/usulan-ujikom/WaitingListQueue.tsx`
    - _Requirements: 5, 9_

- [ ] 6. Checkpoint - Ensure all components build without errors
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 7. Build Admin Unit forms and pages
  - [ ] 7.1 Create `UsulanForm` component for create/edit
    - Implement React Hook Form with Zod validation
    - Include `PetaJabatanSelector` for position selection
    - Include `EmployeeSelector` for employee selection
    - Include `DocumentUpload` for file uploads
    - Show real-time formasi availability status
    - Display validation errors inline
    - Enable edit only for Draft and Waiting_List status
    - Use Dialog component from shadcn/ui for modal form
    - Place in `src/components/usulan-ujikom/UsulanForm.tsx`
    - _Requirements: 1, 2, 3, 4, 12_
  
  - [ ] 7.2 Create `UsulanList` component with filters
    - Display table of usulan with columns: employee name, NIP, jabatan target, status, submission date
    - Implement status filter dropdown
    - Implement search by employee name or NIP
    - Implement date range filter
    - Show queue position for Waiting_List status
    - Include action buttons: View, Edit (Draft/Waiting), Cancel (Draft/Waiting/Diajukan)
    - Use DataTable pattern with shadcn/ui Table components
    - Place in `src/components/usulan-ujikom/UsulanList.tsx`
    - _Requirements: 1, 9_
  
  - [ ] 7.3 Create `UsulanDetail` component
    - Display complete usulan information with all fields
    - Show employee details and position information
    - Display uploaded documents with download links
    - Include `StatusHistory` component for audit trail
    - Show `WaitingListQueue` component if status is Waiting_List
    - Add Edit and Cancel buttons based on status
    - Use Card and Tabs components from shadcn/ui
    - Place in `src/components/usulan-ujikom/UsulanDetail.tsx`
    - _Requirements: 1, 11_
  
  - [ ] 7.4 Create `UsulanUjikom.tsx` page for Admin Unit
    - Implement main dashboard with statistics cards
    - Show count of usulan by status for user's department
    - Display `UsulanList` component
    - Add "Create Usulan" button to open `UsulanForm`
    - Include filter and search controls
    - Show warning indicators for full positions
    - Place in `src/pages/UsulanUjikom.tsx`
    - _Requirements: 1, 9_

- [ ] 8. Build Admin Pusat management interface
  - [ ] 8.1 Create `UsulanPusatList` component with advanced filters
    - Display table of all usulan from all departments
    - Add columns: employee name, NIP, jabatan target, department, status, submission date
    - Implement multi-select filters: status, department, jabatan target
    - Implement sortable columns
    - Show `StatusBadge` for each usulan
    - Add action buttons to open detail modal
    - Use DataTable pattern with shadcn/ui Table components
    - Place in `src/components/usulan-ujikom/UsulanPusatList.tsx`
    - _Requirements: 7, 10_
  
  - [ ] 8.2 Create `StatusChangeDialog` component
    - Display current status with transition options
    - Show status transition dropdown (Diajukan→Verifikasi, Verifikasi→Proses/Dibatalkan, etc.)
    - Require cancellation reason input (min 10 chars) when changing to Dibatalkan
    - Optional feedback notes textarea for Tidak_Lulus_Ujikom
    - Optional admin notes textarea for any status
    - Validate status transitions according to workflow
    - Use AlertDialog component from shadcn/ui
    - Place in `src/components/usulan-ujikom/StatusChangeDialog.tsx`
    - _Requirements: 7, 12_
  
  - [ ] 8.3 Create `UsulanPusatDetail` component
    - Display complete usulan information with all fields
    - Show uploaded documents with preview capability
    - Display `StatusHistory` timeline
    - Include `StatusChangeDialog` for status updates
    - Add admin notes section with edit capability
    - Show related data: employee full profile, position details
    - Use Sheet or Dialog component from shadcn/ui
    - Place in `src/components/usulan-ujikom/UsulanPusatDetail.tsx`
    - _Requirements: 7, 11_
  
  - [ ] 8.4 Create `UsulanUjikomPusat.tsx` page for Admin Pusat
    - Implement main management dashboard
    - Show overview statistics: total usulan, by status, by department
    - Display `UsulanPusatList` component
    - Add comprehensive filter controls
    - Include bulk actions capability (future enhancement placeholder)
    - Add navigation item to main menu
    - Place in `src/pages/UsulanUjikomPusat.tsx`
    - _Requirements: 7, 10_

- [ ] 9. Implement notification system integration
  - [ ] 9.1 Create notification handlers for status changes
    - Create `createUsulanNotification()` function
    - Generate appropriate notification messages for each status change
    - Insert notifications into `notifications` table with correct recipient
    - Include usulan details in notification metadata
    - Place in `src/lib/usulan-ujikom-storage.ts`
    - _Requirements: 8_
  
  - [ ] 9.2 Integrate notifications with existing notification panel
    - Update notification panel to handle `usulan_ujikom_status_change` type
    - Display usulan-specific notification format
    - Add click handler to navigate to usulan detail
    - Mark notifications as read when clicked
    - Update existing notification components if needed
    - _Requirements: 8_

- [ ] 10. Add routing and navigation
  - [ ] 10.1 Add routes to router configuration
    - Add `/usulan-ujikom` route for Admin Unit page
    - Add `/usulan-ujikom-pusat` route for Admin Pusat page
    - Configure route guards based on user roles
    - Add route for individual usulan detail page (optional)
    - Update `src/App.tsx` or router configuration file
    - _Requirements: 1, 7, 10_
  
  - [ ] 10.2 Add navigation menu items
    - Add "Usulan Ujikom" menu item for Admin Unit role
    - Add "Menu Usulan Ujikom" menu item for Admin Pusat role
    - Use appropriate icons (Award or GraduationCap from lucide-react)
    - Place in main navigation sidebar
    - _Requirements: 10_

- [ ] 11. Checkpoint - Test complete workflow end-to-end
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 12. Implement error handling and edge cases
  - [ ] 12.1 Add comprehensive error handling
    - Handle network errors during form submission with retry option
    - Preserve draft data in localStorage on failure
    - Handle file upload failures with clear error messages
    - Handle concurrent status changes with optimistic locking
    - Display user-friendly error messages for all operations
    - Add error boundaries for component failures
    - _Requirements: 12_
  
  - [ ] 12.2 Handle edge cases and validations
    - Prevent duplicate submissions with loading states
    - Validate status transitions according to workflow rules
    - Handle edge case: employee has active usulan for same position
    - Handle edge case: position formasi changes while form is open
    - Handle edge case: usulan deleted while being viewed
    - Add confirmation dialogs for destructive actions (cancel, delete)
    - _Requirements: 3, 12_

- [ ]* 13. Write unit tests for core logic
  - [ ]* 13.1 Write unit tests for formasi calculation
    - Test `calculateFormasi()` with various ABK counts and occupied positions
    - Test edge case: ABK count is 0
    - Test edge case: occupied count exceeds ABK count
    - Test error handling for missing position reference
    - Place tests in `src/lib/__tests__/usulan-ujikom-storage.test.ts`
    - _Requirements: 5_
  
  - [ ]* 13.2 Write unit tests for automatic promotion
    - Test `promoteFromWaitingList()` FIFO ordering
    - Test promotion with multiple waiting usulan
    - Test promotion when no formasi available
    - Test promotion when waiting list is empty
    - Test queue position reordering after promotion
    - Place tests in `src/lib/__tests__/usulan-ujikom-storage.test.ts`
    - _Requirements: 6_
  
  - [ ]* 13.3 Write unit tests for validation schemas
    - Test file size validation (5MB limit)
    - Test file format validation (PDF/JPG/PNG)
    - Test URL validation for document links
    - Test cancellation reason minimum length (10 chars)
    - Test status transition validations
    - Place tests in `src/lib/__tests__/usulan-ujikom-validation.test.ts`
    - _Requirements: 4, 12_

- [ ]* 14. Write integration tests
  - [ ]* 14.1 Write integration tests for Admin Unit workflow
    - Test complete flow: create draft → upload docs → submit → waiting/submitted
    - Test edit usulan in Draft status
    - Test cancel usulan in various statuses
    - Test formasi availability check during submission
    - Mock Supabase client and file upload
    - Place tests in `src/test/integration/usulan-ujikom-admin-unit.test.tsx`
    - _Requirements: 1, 2, 3, 4, 5_
  
  - [ ]* 14.2 Write integration tests for Admin Pusat workflow
    - Test status change from Diajukan → Verifikasi → Proses → Lulus
    - Test cancellation with reason requirement
    - Test feedback notes for Tidak_Lulus
    - Test automatic promotion trigger after status change
    - Test notification creation for status changes
    - Place tests in `src/test/integration/usulan-ujikom-admin-pusat.test.tsx`
    - _Requirements: 6, 7, 8_

- [ ] 15. Final integration and polish
  - [ ] 15.1 Implement responsive design
    - Ensure all components work on mobile, tablet, and desktop
    - Use responsive layout patterns from existing pages
    - Test forms and tables on various screen sizes
    - Adjust DataTable for mobile view (card layout)
    - _Requirements: 1, 7, 10_
  
  - [ ] 15.2 Add loading states and optimistic updates
    - Show skeleton loaders while fetching data
    - Implement optimistic updates for status changes
    - Add loading spinners for file uploads
    - Show progress indicators for multi-step operations
    - Use existing skeleton components from `src/components/skeletons.tsx`
    - _Requirements: 1, 7_
  
  - [ ] 15.3 Implement accessibility features
    - Add proper ARIA labels to all interactive elements
    - Ensure keyboard navigation works for all forms
    - Add screen reader announcements for status changes
    - Verify color contrast for status badges
    - Test with keyboard-only navigation
    - _Requirements: 1, 7, 10_
  
  - [ ] 15.4 Add data export functionality
    - Add export to Excel button for usulan lists
    - Include all relevant fields in export
    - Apply filters before export
    - Use existing Excel export utilities
    - _Requirements: 9_

- [ ] 16. Final checkpoint - Complete testing and verification
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional test tasks and can be skipped for faster MVP delivery
- Each task references specific requirements from the requirements document for traceability
- The implementation follows existing project patterns: TypeScript/React, TanStack Query, React Hook Form, Zod, shadcn/ui
- Checkpoints at tasks 6, 11, and 16 ensure incremental validation and allow for user feedback
- Database setup (task 1) must be completed before any development work
- Core API functions (task 3) should be completed before building UI components
- The automatic promotion algorithm (task 3.5) is triggered by status changes and runs server-side
- RLS policies ensure data security based on user roles (Admin Unit vs Admin Pusat)
- Real-time notifications use Supabase subscriptions for instant status updates
- All file uploads use Supabase Storage with organized folder structure

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2", "1.3"] },
    { "id": 1, "tasks": ["2.1", "2.2"] },
    { "id": 2, "tasks": ["3.1", "3.2", "3.3"] },
    { "id": 3, "tasks": ["3.4", "3.5", "4.3"] },
    { "id": 4, "tasks": ["4.1", "4.2", "4.4"] },
    { "id": 5, "tasks": ["5.1", "5.2", "5.3", "5.4", "5.5", "5.6"] },
    { "id": 6, "tasks": ["7.1", "9.1"] },
    { "id": 7, "tasks": ["7.2", "7.3", "8.1", "8.2"] },
    { "id": 8, "tasks": ["7.4", "8.3", "9.2"] },
    { "id": 9, "tasks": ["8.4", "10.1", "10.2"] },
    { "id": 10, "tasks": ["12.1", "12.2"] },
    { "id": 11, "tasks": ["13.1", "13.2", "13.3"] },
    { "id": 12, "tasks": ["14.1", "14.2"] },
    { "id": 13, "tasks": ["15.1", "15.2", "15.3", "15.4"] }
  ]
}
```
