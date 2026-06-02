# Row Level Security (RLS) Quick Reference Guide

## Overview

The `usulan_ujikom` and `usulan_ujikom_status_history` tables are protected by Row Level Security (RLS) policies. This guide helps developers understand what operations are allowed for each role.

## Role-Based Access Matrix

### Admin Pusat (Central Admin)

| Operation | usulan_ujikom | usulan_ujikom_status_history |
|-----------|---------------|------------------------------|
| SELECT    | ✅ All records | ✅ All records |
| INSERT    | ✅ Any department | ✅ Yes |
| UPDATE    | ✅ All records, any status | ❌ No |
| DELETE    | ✅ All records | ❌ No |

**Key Points**:
- Full access to all usulan from all departments
- Can change usulan status at any time
- Can view complete audit trail

### Admin Unit (Department Admin)

| Operation | usulan_ujikom | usulan_ujikom_status_history |
|-----------|---------------|------------------------------|
| SELECT    | ✅ Own department only | ✅ Own department only |
| INSERT    | ✅ Own department only | ✅ Yes |
| UPDATE    | ⚠️ Draft/Waiting_List only* | ❌ No |
| DELETE    | ⚠️ Draft only* | ❌ No |

**Restrictions marked with * (asterisk)**:
- **UPDATE**: Can only update usulan they created, in Draft or Waiting_List status
- **DELETE**: Can only delete usulan they created, in Draft status only

**Key Points**:
- Access restricted to own department
- Cannot modify usulan after submission (Diajukan status)
- Must be the creator to modify/delete
- Can view status history for own department's usulan

## Code Examples

### Frontend: Checking User Permissions

```typescript
import { useAuth } from '@/hooks/useAuth';

function UsulanActions({ usulan }: { usulan: UsulanUjikom }) {
  const { user, profile } = useAuth();
  
  const isAdminPusat = profile?.role === 'admin_pusat';
  const isAdminUnit = profile?.role === 'admin_unit';
  const isOwnDepartment = profile?.department === usulan.department;
  const isCreator = user?.id === usulan.creator_id;
  const isDraft = usulan.status === 'Draft';
  const isWaiting = usulan.status === 'Waiting_List';
  
  // Admin Pusat can always update
  const canUpdate = isAdminPusat || 
    (isAdminUnit && isOwnDepartment && isCreator && (isDraft || isWaiting));
  
  // Only Draft usulan can be deleted, and only by creator or Admin Pusat
  const canDelete = isDraft && (isAdminPusat || (isAdminUnit && isOwnDepartment && isCreator));
  
  return (
    <>
      {canUpdate && <Button onClick={handleUpdate}>Edit</Button>}
      {canDelete && <Button onClick={handleDelete}>Delete</Button>}
    </>
  );
}
```

### Backend: Querying with RLS

```typescript
// RLS automatically filters based on authenticated user
// No need to add department filters in code for Admin Unit

// Example 1: Admin Unit viewing their usulan
// RLS will automatically filter by department
const { data, error } = await supabase
  .from('usulan_ujikom')
  .select('*')
  .order('created_at', { ascending: false });
// Returns only usulan from user's department

// Example 2: Admin Pusat viewing all usulan
// RLS allows access to all records
const { data, error } = await supabase
  .from('usulan_ujikom')
  .select('*')
  .order('created_at', { ascending: false });
// Returns usulan from all departments

// Example 3: Creating usulan (Admin Unit)
const { data, error } = await supabase
  .from('usulan_ujikom')
  .insert({
    employee_id: employeeId,
    position_reference_id: positionId,
    creator_id: user.id, // Required - must match auth.uid()
    department: userDepartment, // Required - must match user's department
    // ... other fields
  });
// RLS will verify department matches user's department

// Example 4: Updating usulan (Admin Unit)
const { data, error } = await supabase
  .from('usulan_ujikom')
  .update({
    link_dokumen_persyaratan: newLink,
  })
  .eq('id', usulanId);
// RLS will verify:
// - User is the creator
// - Usulan is in Draft or Waiting_List status
// - Usulan is from user's department
```

### Status History Logging

```typescript
// All authenticated users can insert status history
async function logStatusChange(
  usulanId: string,
  previousStatus: string,
  newStatus: string,
  notes?: string
) {
  const { data: user } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role')
    .eq('id', user.user?.id)
    .single();
  
  await supabase
    .from('usulan_ujikom_status_history')
    .insert({
      usulan_ujikom_id: usulanId,
      previous_status: previousStatus,
      new_status: newStatus,
      changed_by_id: user.user?.id,
      changed_by_name: profile?.full_name,
      changed_by_role: profile?.role,
      notes: notes,
    });
}
```

## Common Error Scenarios

### Error: Cannot create usulan (403 Forbidden)

**Cause**: Admin Unit trying to create usulan for a different department

**Solution**: Ensure `department` field matches `get_user_department(auth.uid())`

```typescript
// ❌ Wrong - hardcoded department
const { error } = await supabase
  .from('usulan_ujikom')
  .insert({
    department: 'Some Other Department', // RLS will reject this
    // ...
  });

// ✅ Correct - use user's department
const { data: profile } = await supabase
  .from('profiles')
  .select('department')
  .eq('id', user.id)
  .single();

const { error } = await supabase
  .from('usulan_ujikom')
  .insert({
    department: profile.department, // RLS will allow this
    // ...
  });
```

### Error: Cannot update usulan (403 Forbidden)

**Cause**: Admin Unit trying to update usulan that is:
- Not in Draft or Waiting_List status
- Created by someone else
- From a different department

**Solution**: Check all conditions before attempting update

```typescript
// Check before updating
const { data: usulan } = await supabase
  .from('usulan_ujikom')
  .select('status, creator_id, department')
  .eq('id', usulanId)
  .single();

const canUpdate = 
  (usulan.status === 'Draft' || usulan.status === 'Waiting_List') &&
  usulan.creator_id === user.id &&
  usulan.department === userDepartment;

if (!canUpdate) {
  toast.error('You cannot edit this usulan');
  return;
}

// Proceed with update
await supabase
  .from('usulan_ujikom')
  .update({ /* ... */ })
  .eq('id', usulanId);
```

### Error: Cannot view usulan (empty result)

**Cause**: Admin Unit querying usulan from different department

**Solution**: RLS automatically filters by department - no manual filtering needed

```typescript
// ❌ Wrong - adding unnecessary department filter
const { data } = await supabase
  .from('usulan_ujikom')
  .select('*')
  .eq('department', 'Some Department'); // May not match user's department

// ✅ Correct - let RLS handle department filtering
const { data } = await supabase
  .from('usulan_ujikom')
  .select('*');
// RLS automatically filters by user's department for Admin Unit
```

## Testing RLS Policies

### Running Tests

```bash
# Run RLS integration tests
npm test src/lib/usulan-ujikom/__tests__/usulan-ujikom-rls-integration.test.ts

# Run all usulan-ujikom tests
npm test src/lib/usulan-ujikom/__tests__/
```

### Manual Testing in Supabase Dashboard

1. Go to Supabase SQL Editor
2. Test Admin Unit access:
```sql
-- Set session to Admin Unit user
SET LOCAL role TO authenticated;
SET LOCAL request.jwt.claims TO '{"sub": "admin-unit-user-id"}';

-- Try to view usulan (should only see own department)
SELECT * FROM usulan_ujikom;

-- Try to update usulan from different department (should fail)
UPDATE usulan_ujikom 
SET admin_notes = 'test' 
WHERE department != (SELECT department FROM profiles WHERE id = auth.uid());
```

## Helper Functions

### `public.has_role(user_id, role)`
Checks if a user has a specific role.

```sql
SELECT public.has_role(auth.uid(), 'admin_pusat');
-- Returns: true or false
```

### `public.get_user_department(user_id)`
Returns the department for a user.

```sql
SELECT public.get_user_department(auth.uid());
-- Returns: 'BKD' or 'BPKAD' or null
```

## Best Practices

### 1. Always Use Authenticated Client
```typescript
// ✅ Good - uses authenticated user's context
import { supabase } from '@/integrations/supabase/client';
const { data } = await supabase.from('usulan_ujikom').select('*');

// ❌ Bad - bypasses RLS (only for admin operations)
import { createClient } from '@supabase/supabase-js';
const adminClient = createClient(url, serviceRoleKey); // Bypasses RLS!
```

### 2. Let RLS Handle Filtering
```typescript
// ✅ Good - trust RLS to filter
const { data } = await supabase
  .from('usulan_ujikom')
  .select('*');

// ❌ Unnecessary - RLS already does this
const { data } = await supabase
  .from('usulan_ujikom')
  .select('*')
  .eq('department', userDepartment);
```

### 3. Validate on Frontend Too
```typescript
// Defense in depth - validate before attempting operations
if (profile?.role !== 'admin_pusat' && usulan.status !== 'Draft') {
  toast.error('Cannot edit submitted usulan');
  return;
}

// Still attempt the operation - RLS is the final authority
const { error } = await supabase
  .from('usulan_ujikom')
  .update({ /* ... */ })
  .eq('id', usulanId);

if (error) {
  toast.error('Update failed: ' + error.message);
}
```

### 4. Log All Status Changes
```typescript
// Always log to status_history when status changes
await supabase.from('usulan_ujikom_status_history').insert({
  usulan_ujikom_id: usulanId,
  previous_status: oldStatus,
  new_status: newStatus,
  changed_by_id: user.id,
  changed_by_name: user.full_name,
  changed_by_role: user.role,
  notes: reason,
});
```

## Troubleshooting

### Issue: RLS policies not working

1. Check if RLS is enabled:
```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('usulan_ujikom', 'usulan_ujikom_status_history');
-- rowsecurity should be 'true'
```

2. Check if user is authenticated:
```typescript
const { data: { user } } = await supabase.auth.getUser();
if (!user) {
  console.error('User not authenticated');
}
```

3. Check user's role and department:
```typescript
const { data: profile } = await supabase
  .from('profiles')
  .select('role, department')
  .eq('id', user.id)
  .single();

console.log('User role:', profile?.role);
console.log('User department:', profile?.department);
```

### Issue: Cannot insert status history

**Cause**: Not authenticated or missing required fields

**Solution**:
```typescript
// Ensure user is authenticated
const { data: { user } } = await supabase.auth.getUser();
if (!user) throw new Error('Not authenticated');

// Ensure all required fields are provided
await supabase.from('usulan_ujikom_status_history').insert({
  usulan_ujikom_id: usulanId, // Required
  new_status: 'Diajukan', // Required
  previous_status: 'Draft', // Optional but recommended
  changed_by_id: user.id,
  changed_by_name: user.full_name,
  changed_by_role: profile.role,
});
```

## Summary

- ✅ RLS policies are implemented and tested
- ✅ Admin Pusat has full access
- ✅ Admin Unit has department-scoped access
- ✅ Status-based permissions prevent unauthorized changes
- ✅ Complete audit trail maintained
- ✅ Helper functions available for role/department checks

For more details, see:
- [Design Document](../../../.kiro/specs/usulan-ujikom-pegawai/design.md)
- [RLS Implementation Doc](../../../.kiro/specs/usulan-ujikom-pegawai/TASK_1.2_RLS_POLICIES_IMPLEMENTATION.md)
- [Migration File](../../../../supabase/migrations/20260602114100_create_usulan_ujikom_tables.sql)
