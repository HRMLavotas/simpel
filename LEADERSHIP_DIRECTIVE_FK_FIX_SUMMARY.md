# Leadership Directive FK Constraint Fix - Summary

**Date**: 2026-05-13  
**Status**: ✅ COMPLETED

---

## Problem

When trying to save leadership directives after selecting a person from the search dropdown, the save operation failed with a Supabase error.

### Root Cause

The `leadership_directives.issued_by_id` column had a foreign key constraint referencing `profiles(id)`:

```sql
issued_by_id UUID REFERENCES public.profiles(id)
```

However, the search functionality searches from the `employees` table (ASN data), which contains all employee information. When a user selected an employee from the dropdown, the system tried to insert the employee's ID (from `employees` table) into `issued_by_id`, but this ID didn't exist in the `profiles` table, causing the FK constraint violation.

### Error Messages

```
Error searching profiles: Object
Error updating leadership directive: Object
Supabase update error: Object
```

---

## Solution

Created migration `20260513160000_remove_issued_by_fk_constraint.sql` to remove the foreign key constraint:

```sql
ALTER TABLE public.leadership_directives 
  DROP CONSTRAINT IF EXISTS leadership_directives_issued_by_id_fkey;
```

### Rationale

1. **Flexibility**: `issued_by_id` can now reference IDs from either `employees` or `profiles` table
2. **Data Integrity**: We store `issued_by_name` and `issued_by_position` anyway, so the FK is not needed for data integrity
3. **Search Functionality**: The search box searches from `employees` table which has the most complete ASN data
4. **Reference Only**: The `issued_by_id` is used for reference/linking purposes only, not for enforcing relationships

---

## Changes Made

### 1. Database Migration
- **File**: `supabase/migrations/20260513160000_remove_issued_by_fk_constraint.sql`
- **Action**: Dropped FK constraint on `issued_by_id`
- **Status**: ✅ Applied successfully

### 2. Code Cleanup
- **File**: `src/lib/leadershipDirectiveStorage.ts`
- **Changes**:
  - Removed excessive console.log statements from `createDirective()`
  - Removed excessive console.log statements from `updateDirective()`
  - Removed excessive console.log statements from `searchLeadershipPersonnel()`
  - Kept only error logging for debugging

---

## Testing Checklist

After this fix, test the following scenarios:

- [ ] **Add New Directive with Search**: Select person from dropdown, fill form, save
- [ ] **Add New Directive with Manual Entry**: Use manual entry, fill form, save
- [ ] **Edit Existing Directive**: Change person, change text, save
- [ ] **Search Functionality**: Search for various names, verify results appear
- [ ] **Auto-fill Position**: Verify position auto-fills when person is selected
- [ ] **Multiple Directives**: Add multiple directives to same case
- [ ] **Display**: Verify all directives display correctly in the card

---

## Technical Details

### Table Structure (After Fix)

```sql
CREATE TABLE public.leadership_directives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES public.employee_cases(id) ON DELETE CASCADE,
  directive_text TEXT NOT NULL,
  directive_date DATE NOT NULL,
  issued_by_id UUID,  -- NO FK CONSTRAINT (can be from employees or profiles)
  issued_by_name TEXT NOT NULL,
  issued_by_position TEXT,
  created_by UUID NOT NULL REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### Search Logic

The search function queries the `employees` table:

```typescript
const { data: employees } = await supabase
  .from("employees")
  .select("id, name, position_name")
  .ilike("name", `%${searchTerm}%`)
  .limit(20);
```

When a user selects an employee:
- `issued_by_id` = employee.id (from employees table)
- `issued_by_name` = employee.name
- `issued_by_position` = employee.position_name

This now works because there's no FK constraint requiring the ID to exist in `profiles`.

---

## Files Modified

1. `supabase/migrations/20260513160000_remove_issued_by_fk_constraint.sql` - NEW
2. `src/lib/leadershipDirectiveStorage.ts` - MODIFIED (cleaned up logging)

---

## Next Steps

1. ✅ Migration applied
2. ✅ Code cleaned up
3. ⏳ **USER TESTING REQUIRED**: Test save functionality in the UI
4. ⏳ Verify all scenarios in testing checklist above

---

## Notes

- The index `idx_leadership_directives_issued_by_id` is kept for query performance
- The `created_by` field still has FK to `profiles(id)` because it references the logged-in admin user
- Manual entry option still works as before (sets `issued_by_id` to null)
