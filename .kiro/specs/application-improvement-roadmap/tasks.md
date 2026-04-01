# Implementation Plan: SIMPEL Application Improvement Roadmap - Phase 1

## Overview

This implementation plan focuses on Phase 1 (High Priority) requirements for the SIMPEL application improvement roadmap. The plan breaks down the design into discrete, actionable coding tasks that build incrementally toward a complete implementation.

Phase 1 includes:
- Enhanced Data Validation and Error Prevention (Requirement 1)
- Advanced Search and Filtering (Requirement 3)
- Mobile-Responsive Optimization (Requirement 11)
- Performance Optimization and Caching (Requirement 12)

All tasks reference specific requirements and design properties for traceability. Tasks marked with `*` are optional and can be skipped for faster MVP delivery.

## Tasks

### 1. Setup and Infrastructure

- [x] 1.1 Install and configure required dependencies
  - Install Zod 3.25 for validation schemas
  - Install fast-check for property-based testing
  - Install @tanstack/react-virtual for virtual scrolling
  - Verify React Query 5.83 is properly configured
  - _Requirements: 1, 3, 11, 12_

- [x] 1.2 Create database migrations for new tables
  - Create migration for `saved_filters` table with RLS policies
  - Create migration for `user_preferences` table with RLS policies
  - Create migration for performance indexes (nip, nik, nama with trigram)
  - Enable pg_trgm extension for fuzzy search
  - _Requirements: 3.12, 12.10_

- [x] 1.3 Update React Query configuration for optimal caching
  - Configure staleTime to 5 minutes and cacheTime to 10 minutes
  - Set up retry strategy with exponential backoff
  - Configure refetchOnWindowFocus to false
  - _Requirements: 12.1, 12.2_

### 2. Enhanced Data Validation System (Requirement 1)

- [x] 2.1 Create Zod validation schemas for employee data
  - Create `src/lib/validation/employee-schemas.ts` with base schemas (NIP, NIK, dates)
  - Implement cross-field validation for date logic (join date vs birth date)
  - Add Indonesian error messages for all validation rules
  - Create separate schemas for ASN and Non-ASN employees
  - _Requirements: 1.1, 1.2, 1.5, 1.6, 1.9_

- [x] 2.2 Write property test for ID format validation
  - **Property 1: ID Format Validation**
  - **Validates: Requirements 1.1, 1.2**
  - Test that invalid NIP/NIK formats are rejected with specific error messages
  - Use fast-check to generate invalid formats (wrong length, non-numeric)
  - Run minimum 100 iterations

- [x] 2.3 Write property test for date validation
  - **Property 3: Future Date Rejection**
  - **Property 4: Date Logic Validation**
  - **Validates: Requirements 1.5, 1.6**
  - Test that future birth dates are rejected
  - Test that join dates before birth dates are rejected
  - Run minimum 100 iterations per property

- [ ] 2.4 Create async validation hooks for duplicate checking
  - Create `src/hooks/useEmployeeValidation.ts` with checkDuplicateNIP function
  - Implement checkDuplicateNIK function with employee name in error message
  - Add debouncing to reduce API calls during typing
  - Handle loading and error states
  - _Requirements: 1.3, 1.4_

- [ ]* 2.5 Write property test for ID uniqueness validation
  - **Property 2: ID Uniqueness Validation**
  - **Validates: Requirements 1.3, 1.4**
  - Test that duplicate NIP/NIK are detected and rejected
  - Verify error message includes existing employee name

- [ ] 2.6 Create reusable form error display component
  - Create `src/components/ui/form-field-error.tsx` component
  - Display error messages with red border and icon
  - Support real-time error clearing when field becomes valid
  - _Requirements: 1.7, 1.10_

- [~] 2.7 Integrate validation into existing employee forms
  - Update `src/components/employees/EmployeeFormModal.tsx` with zodResolver
  - Set form mode to 'onChange' for real-time validation
  - Integrate async validation for NIP/NIK fields
  - Add auto-focus to first invalid field on submit
  - Update Non-ASN form modal with same validation patterns
  - _Requirements: 1.7, 1.8, 1.10_

- [ ]* 2.8 Write unit tests for validation integration
  - Test form validation with invalid inputs
  - Test async duplicate checking
  - Test error message display and clearing
  - Test auto-focus behavior

- [ ] 2.9 Checkpoint - Ensure validation tests pass
  - Ensure all validation tests pass, ask the user if questions arise.

### 3. Advanced Search and Filtering (Requirement 3)

- [ ] 3.1 Create search and filter state management hook
  - Create `src/hooks/useEmployeeSearch.ts` with SearchFilters interface
  - Implement debounced search query (300ms delay)
  - Build query function with multi-field OR search (NIP, NIK, nama, jabatan, unit_kerja)
  - Implement AND logic for combining multiple filters
  - _Requirements: 3.1, 3.2_

- [ ]* 3.2 Write property test for multi-field search
  - **Property 7: Multi-field Search**
  - **Validates: Requirements 3.1**
  - Test that search matches across all specified fields
  - Verify OR logic for field matching

- [ ]* 3.3 Write property test for filter combination
  - **Property 8: Filter Combination Logic**
  - **Validates: Requirements 3.2**
  - Test that multiple filters use AND logic
  - Verify all filters must match for result inclusion

- [ ] 3.4 Create filter UI components
  - Create `src/components/employees/EmployeeFilters.tsx` with search input
  - Add filter dropdowns for rank group, position type, join year range
  - Add filter dropdowns for education level, gender, religion, department
  - Implement responsive layout for mobile (bottom sheet on mobile)
  - _Requirements: 3.3, 3.4, 3.5, 3.6, 3.7, 3.8_

- [ ] 3.5 Create active filter badge component
  - Create `src/components/employees/FilterBadges.tsx` component
  - Display badge for each active filter with label and value
  - Add X button to remove individual filter
  - Add "Clear All Filters" button when filters are active
  - _Requirements: 3.10, 3.11_

- [ ]* 3.6 Write property test for filter reset
  - **Property 9: Filter Reset**
  - **Validates: Requirements 3.9**
  - Test that clear all resets all filters to default state

- [ ]* 3.7 Write property test for active filter display
  - **Property 10: Active Filter Display**
  - **Property 11: Individual Filter Removal**
  - **Validates: Requirements 3.10, 3.11**
  - Test that active filters are displayed as badges
  - Test that removing individual filter keeps others active

- [ ] 3.8 Implement saved filters feature
  - Create `src/hooks/useSavedFilters.ts` for saved filter management
  - Add save filter dialog with name input
  - Add saved filters dropdown to load saved configurations
  - Implement delete saved filter functionality
  - _Requirements: 3.12_

- [ ]* 3.9 Write property test for saved filter round-trip
  - **Property 12: Saved Filter Round-trip**
  - **Validates: Requirements 3.12**
  - Test that saving and loading restores exact filter state

- [ ] 3.10 Integrate search and filters into employee list page
  - Update `src/pages/Employees.tsx` to use useEmployeeSearch hook
  - Add EmployeeFilters component above employee table
  - Add FilterBadges component to show active filters
  - Update employee query to use filter parameters
  - _Requirements: 3.1, 3.2, 3.9, 3.10, 3.11_

- [ ]* 3.11 Write unit tests for search and filter components
  - Test filter UI interactions
  - Test badge display and removal
  - Test saved filter CRUD operations
  - Test debouncing behavior

- [ ] 3.12 Checkpoint - Ensure search and filter tests pass
  - Ensure all search and filter tests pass, ask the user if questions arise.

### 4. Mobile-Responsive Optimization (Requirement 11)

- [ ] 4.1 Enhance mobile detection hook
  - Update `src/hooks/use-mobile.tsx` to detect mobile, tablet, and desktop
  - Add window resize listener with proper cleanup
  - Export isMobile, isTablet, isDesktop flags
  - _Requirements: 11.1_

- [ ] 4.2 Create mobile card list component for employees
  - Create `src/components/employees/EmployeeCardList.tsx` component
  - Display employee data in card format with key information
  - Add dropdown menu for actions (detail, edit, delete)
  - Use proper spacing and touch-friendly sizing
  - _Requirements: 11.2_

- [ ] 4.3 Create responsive employee list wrapper
  - Create `src/components/employees/ResponsiveEmployeeList.tsx` component
  - Show EmployeeCardList on mobile, EmployeeTable on desktop
  - Ensure smooth transition between layouts
  - _Requirements: 11.2_

- [ ] 4.4 Create mobile navigation component
  - Create `src/components/layout/MobileNav.tsx` with hamburger menu
  - Implement slide-in drawer using Sheet component
  - Add all navigation links with proper styling
  - Ensure proper z-index and overlay behavior
  - _Requirements: 11.4_

- [ ] 4.5 Optimize forms for mobile input
  - Update date fields to use native date input on mobile
  - Update numeric fields to use number keyboard on mobile
  - Ensure all form fields are full-width on mobile
  - Stack form fields vertically on mobile
  - _Requirements: 11.3, 11.8_

- [ ] 4.6 Optimize dashboard for mobile
  - Update dashboard to stack widgets vertically on mobile
  - Adjust chart sizes for mobile viewports
  - Ensure proper spacing and readability
  - _Requirements: 11.5_

- [ ] 4.7 Implement mobile-friendly action menus
  - Create `src/components/ui/bottom-sheet.tsx` component
  - Use bottom sheet for action menus on mobile instead of dropdowns
  - Ensure proper touch targets (minimum 44x44 pixels)
  - _Requirements: 11.10, 11.12_

- [ ] 4.8 Add mobile file upload with camera support
  - Update file upload fields to accept camera capture on mobile
  - Add proper input attributes for camera access
  - Test on actual mobile devices
  - _Requirements: 11.11_

- [ ]* 4.9 Write property test for responsive layout switching
  - **Property 13: Responsive Layout Switching**
  - **Validates: Requirements 11.1, 11.2, 11.3, 11.5, 11.7**
  - Test that mobile layouts are used below 768px breakpoint

- [ ]* 4.10 Write property test for mobile input types
  - **Property 14: Mobile Input Types**
  - **Validates: Requirements 11.8**
  - Test that native mobile inputs are used on mobile viewports

- [ ]* 4.11 Write property test for mobile action menus
  - **Property 15: Mobile Action Menus**
  - **Validates: Requirements 11.10**
  - Test that bottom sheets are used instead of dropdowns on mobile

- [ ]* 4.12 Write property test for touch target sizes
  - **Property 17: Touch Target Sizes**
  - **Validates: Requirements 11.12**
  - Test that all interactive elements meet 44x44 pixel minimum

- [ ] 4.13 Optimize Peta Jabatan for mobile
  - Create simplified tree view for mobile with expand/collapse
  - Enable horizontal scrolling with sticky columns
  - Adjust font sizes and spacing for mobile
  - _Requirements: 11.9, 11.7_

- [ ]* 4.14 Write E2E tests for mobile responsiveness
  - Test mobile layout rendering at 375px width (iPhone SE)
  - Test tablet layout at 768px width
  - Test navigation drawer functionality
  - Test form interactions on mobile

- [ ] 4.15 Checkpoint - Ensure mobile optimization tests pass
  - Ensure all mobile optimization tests pass, ask the user if questions arise.

### 5. Performance Optimization and Caching (Requirement 12)

- [~] 5.1 Configure React Query for optimal performance
  - Update `src/lib/query-client.ts` with staleTime and cacheTime settings
  - Configure retry strategy with exponential backoff
  - Set up proper error handling and retry logic
  - _Requirements: 12.1, 12.2_

- [~] 5.2 Write property test for cache freshness
  - **Property 18: Cache Freshness**
  - **Validates: Requirements 12.1**
  - Test that data less than 5 minutes old loads from cache

- [~] 5.3 Write property test for cache invalidation
  - **Property 19: Cache Invalidation**
  - **Validates: Requirements 12.2**
  - Test that mutations invalidate relevant cached queries

- [~] 5.4 Optimize employee data fetching hook
  - Update `src/hooks/useEmployees.ts` with proper caching configuration
  - Implement prefetching for next page
  - Add optimistic updates for mutations
  - Configure proper staleTime for employee data
  - _Requirements: 12.1, 12.2, 12.11_

- [~] 5.5 Implement virtual scrolling for employee table
  - Create `src/components/employees/VirtualEmployeeTable.tsx` using @tanstack/react-virtual
  - Configure virtualizer with proper row height and overscan
  - Only render visible rows in DOM
  - Test with large datasets (1000+ employees)
  - _Requirements: 12.3_

- [~] 5.6 Write property test for virtual scrolling
  - **Property 20: Virtual Scrolling**
  - **Validates: Requirements 12.3**
  - Test that only visible rows are rendered for lists over 100 items

- [~] 5.7 Implement debouncing utility
  - Create `src/lib/utils/debounce.ts` utility function
  - Use in search input to debounce API calls (300ms)
  - Add proper TypeScript types
  - _Requirements: 12.5_

- [~] 5.8 Write property test for search debouncing
  - **Property 22: Search Debouncing**
  - **Validates: Requirements 12.5**
  - Test that rapid input changes result in single API call after 300ms

- [~] 5.9 Implement lazy loading for routes
  - Update `src/App.tsx` to use React.lazy for route components
  - Wrap routes in Suspense with loading fallback
  - Implement code splitting for major routes (Dashboard, Employees, Import, PetaJabatan)
  - _Requirements: 12.12_

- [~] 5.10 Create skeleton loader components
  - Create `src/components/ui/skeleton-table.tsx` for table loading states
  - Create skeleton loaders for dashboard widgets
  - Create skeleton loaders for employee cards
  - Replace blank screens with skeleton loaders
  - _Requirements: 12.8_

- [~] 5.11 Write property test for loading state display
  - **Property 25: Loading State Display**
  - **Validates: Requirements 12.8**
  - Test that skeleton loaders are shown during loading

- [~] 5.12 Implement progressive dashboard loading
  - Update dashboard to load critical widgets first
  - Lazy load secondary widgets after critical ones
  - Use React.lazy and Suspense for widget components
  - _Requirements: 12.4_

- [~] 5.13 Write property test for progressive widget loading
  - **Property 21: Progressive Widget Loading**
  - **Validates: Requirements 12.4**
  - Test that critical widgets load before secondary widgets

- [~] 5.14 Implement lazy image loading
  - Add loading="lazy" attribute to all image elements
  - Implement intersection observer for file previews
  - Only load images when they enter viewport
  - _Requirements: 12.6_

- [~] 5.15 Write property test for lazy image loading
  - **Property 23: Lazy Image Loading**
  - **Validates: Requirements 12.6**
  - Test that images only load when entering viewport

- [~] 5.16 Implement stale-while-revalidate strategy
  - Configure React Query to show stale data immediately
  - Fetch fresh data in background
  - Update UI when fresh data arrives
  - _Requirements: 12.7_

- [~] 5.17 Write property test for stale-while-revalidate
  - **Property 24: Stale-While-Revalidate**
  - **Validates: Requirements 12.7**
  - Test that stale data displays immediately while fetching fresh data

- [~] 5.18 Implement background export processing
  - Create export queue system for large exports (>1000 records)
  - Process exports in background without blocking UI
  - Show notification when export is complete
  - Provide download link in notification
  - _Requirements: 12.9_

- [~] 5.19 Write property test for background export
  - **Property 26: Background Export Processing**
  - **Validates: Requirements 12.9**
  - Test that large exports process in background without blocking UI

- [~] 5.20 Write property test for next page prefetching
  - **Property 27: Next Page Prefetching**
  - **Validates: Requirements 12.11**
  - Test that page N+1 is prefetched when viewing page N

- [~] 5.21 Write E2E performance tests
  - Test dashboard load time is under 2 seconds
  - Test search response time is under 500ms
  - Test virtual scrolling with 1000+ rows
  - Test cache hit rates

- [~] 5.22 Checkpoint - Ensure performance optimization tests pass
  - Ensure all performance optimization tests pass, ask the user if questions arise.

### 6. Integration and Polish

- [~] 6.1 Integrate all Phase 1 features into main application
  - Wire validation system into all employee forms
  - Wire search and filters into employee list page
  - Wire mobile components into layout
  - Wire performance optimizations into data fetching
  - _Requirements: 1, 3, 11, 12_

- [~] 6.2 Add error boundary for graceful error handling
  - Create `src/components/ErrorBoundary.tsx` component
  - Wrap application with error boundary
  - Display user-friendly error messages in Indonesian
  - Add reload button for recovery
  - _Requirements: All_

- [~] 6.3 Implement offline detection and handling
  - Create `src/hooks/useOnlineStatus.ts` hook
  - Show toast notification when connection is lost
  - Show toast notification when connection is restored
  - Refetch queries when connection is restored
  - _Requirements: 12_

- [~] 6.4 Add Supabase error translation
  - Create error translation utility for common Supabase errors
  - Translate RLS policy violations to Indonesian
  - Translate unique constraint violations to Indonesian
  - Translate foreign key violations to Indonesian
  - _Requirements: All_

- [~] 6.5 Write integration tests for complete user flows
  - Test complete employee creation flow with validation
  - Test complete search and filter flow
  - Test complete mobile navigation flow
  - Test complete data fetching and caching flow

- [~] 6.6 Update documentation
  - Document new validation schemas and usage
  - Document search and filter API
  - Document mobile-responsive patterns
  - Document performance optimization strategies
  - _Requirements: All_

- [~] 6.7 Final checkpoint - Ensure all Phase 1 tests pass
  - Run full test suite (unit, property, integration, E2E)
  - Verify all acceptance criteria are met
  - Verify all correctness properties are validated
  - Ask the user if questions arise before considering Phase 1 complete.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP delivery
- Each task references specific requirements for traceability
- Property-based tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- Integration tests validate complete user flows
- E2E tests validate critical paths in real browser environment
- Checkpoints ensure incremental validation and provide opportunities for user feedback
- All code should be written in TypeScript with React
- All user-facing text should be in Indonesian language
- All database operations must respect existing RLS policies
- All new features must maintain backward compatibility

## Success Criteria

Phase 1 is complete when:
- All non-optional tasks are completed
- All tests pass (unit, property, integration, E2E)
- All 27 correctness properties are validated
- All Phase 1 requirements (1, 3, 11, 12) acceptance criteria are met
- Application performance meets targets (page load <2s, search <500ms)
- Mobile responsiveness works on devices 375px width and up
- No regressions in existing functionality
