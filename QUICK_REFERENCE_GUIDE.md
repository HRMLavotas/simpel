# 📚 QUICK REFERENCE GUIDE - APLIKASI SIMPEL

## 🚀 Quick Start

### Development
```bash
npm install --legacy-peer-deps
npm run dev
```

### Build
```bash
npm run build
npm run preview
```

### Test
```bash
npm run test
npm run test:watch
```

---

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # shadcn/ui base components
│   ├── employees/      # Employee-specific components
│   ├── dashboard/      # Dashboard components
│   ├── admins/         # Admin management components
│   ├── departments/    # Department management
│   ├── data-builder/   # Query builder components
│   └── layout/         # Layout components (Sidebar, etc.)
├── hooks/              # Custom React hooks
│   ├── useAuth.tsx     # Authentication & authorization
│   ├── useDashboardData.ts  # Dashboard data fetching
│   ├── useDepartments.ts    # Dynamic departments
│   ├── useEmployeeValidation.ts  # NIP validation
│   └── useKeyboardShortcuts.ts   # Keyboard shortcuts
├── lib/                # Utilities & helpers
│   ├── constants.ts    # App constants
│   ├── logger.ts       # Logging utility
│   ├── utils.ts        # Helper functions
│   └── validation/     # Validation schemas
├── pages/              # Page components (routes)
│   ├── Auth.tsx        # Login page
│   ├── Dashboard.tsx   # Analytics dashboard
│   ├── Employees.tsx   # Employee management
│   ├── Import.tsx      # Excel import (ASN)
│   ├── ImportNonAsn.tsx # Excel import (Non-ASN)
│   ├── Profile.tsx     # User profile
│   ├── Admins.tsx      # Admin management
│   ├── Departments.tsx # Department management
│   ├── DataBuilder.tsx # Custom query builder
│   └── PetaJabatan.tsx # Position mapping
├── types/              # TypeScript type definitions
│   ├── employee.ts     # Employee types
│   └── chart.ts        # Chart types
└── integrations/       # External integrations
    └── supabase/       # Supabase client & types
```

---

## 🔑 Key Features

### 1. Authentication & Authorization
- **Admin Pusat:** Full access to all data
- **Admin Unit:** Access to own department only
- **Admin Pimpinan:** Read-only access

### 2. Employee Management
- ASN (PNS & PPPK) and Non-ASN employees
- CRUD operations with validation
- History tracking (rank, position, mutation)
- Education records
- Notes (placement, assignment, change)

### 3. Excel Import
- Parse Excel files (XLSX, XLS, CSV)
- Data validation & normalization
- Preview before import
- Error reporting
- Batch processing

### 4. Dashboard Analytics
- 15+ chart types
- Real-time statistics
- Department filtering
- ASN status filtering
- Export capability

### 5. Data Builder
- Custom query builder
- Column selection
- Filter builder
- Export to Excel

---

## 🎨 UI Components

### Base Components (shadcn/ui)
```typescript
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Dialog } from "@/components/ui/dialog";
import { Table } from "@/components/ui/table";
```

### Custom Components
```typescript
import { EmployeeFormModal } from "@/components/employees/EmployeeFormModal";
import { EmployeeDetailsModal } from "@/components/employees/EmployeeDetailsModal";
import { AppLayout } from "@/components/layout/AppLayout";
```

---

## 🔧 Utilities

### Logger
```typescript
import { logger } from "@/lib/logger";

logger.debug('Debug message');  // Development only
logger.log('Info message');     // Development only
logger.warn('Warning message'); // Development only
logger.error('Error message');  // Always logged
```

### Constants
```typescript
import { DEPARTMENTS, ASN_STATUS_OPTIONS, POSITION_TYPES } from "@/lib/constants";
```

### Validation
```typescript
import { employeeSchema } from "@/lib/validation/employee";
```

---

## 🎯 Custom Hooks

### useAuth
```typescript
const { user, profile, isAdminPusat, canEdit, canViewAll } = useAuth();
```

### useDashboardData
```typescript
const {
  stats,
  rankData,
  departmentData,
  isLoading,
  error,
  refetch
} = useDashboardData({
  department: profile?.department,
  isAdminPusat,
  selectedDepartment: 'all',
  selectedAsnStatus: 'all'
});
```

### useDepartments
```typescript
const { departments, isLoading, refetch } = useDepartments();
```

### useEmployeeValidation
```typescript
const { validateNIP, isValidating, error } = useEmployeeValidation();
```

---

## 🔐 Security

### Row Level Security (RLS)
```sql
-- Admin Pusat: Full access
CREATE POLICY "admin_pusat_all" ON employees
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
      AND admin_users.role = 'admin_pusat'
    )
  );

-- Admin Unit: Own department only
CREATE POLICY "admin_unit_own" ON employees
  FOR ALL USING (
    department = (
      SELECT department FROM admin_users
      WHERE user_id = auth.uid()
    )
  );
```

### Security Headers
```json
{
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-XSS-Protection": "1; mode=block",
  "Referrer-Policy": "strict-origin-when-cross-origin"
}
```

---

## 📊 Database Schema

### Main Tables
- `employees` - Core employee data
- `education_history` - Education records
- `mutation_history` - Department transfers
- `position_history` - Position changes
- `rank_history` - Rank promotions
- `competency_test_history` - Competency tests
- `training_history` - Training records
- `placement_notes` - Placement notes
- `assignment_notes` - Assignment notes
- `change_notes` - Change notes
- `admin_users` - Admin accounts
- `departments` - Department list
- `position_references` - Position master data

---

## ⌨️ Keyboard Shortcuts

- `Ctrl+K` - Search
- `Ctrl+N` - New employee
- `Ctrl+S` - Save
- `Esc` - Close modal
- `?` - Show help

---

## 🐛 Debugging

### Development Console
```typescript
// Logger automatically disabled in production
logger.debug('This only shows in development');
```

### React Query DevTools
```typescript
// Already configured in development
// Open browser console to see queries
```

### Supabase Logs
```bash
# View logs in Supabase Dashboard
# Logs → Database → Query Performance
```

---

## 📦 Dependencies

### Core
- React 18.3.1
- TypeScript 5.x
- Vite 5.4.21

### UI
- shadcn/ui (Radix UI)
- Tailwind CSS
- Lucide Icons

### Data
- Supabase 2.90.1
- TanStack Query 5.83.0
- React Hook Form
- Zod

### Charts
- Recharts

### Excel
- XLSX

---

## 🔄 Common Tasks

### Add New Page
1. Create page in `src/pages/`
2. Add route in `src/App.tsx`
3. Add navigation in `src/components/layout/AppSidebar.tsx`

### Add New Component
1. Create component in `src/components/`
2. Export from index file (if needed)
3. Import where needed

### Add New Hook
1. Create hook in `src/hooks/`
2. Follow naming convention: `use[Name].ts`
3. Export hook function

### Add New Type
1. Create type in `src/types/`
2. Export type/interface
3. Import where needed

---

## 🚨 Troubleshooting

### Build Errors
```bash
# Clear cache and rebuild
rm -rf node_modules dist
npm install --legacy-peer-deps
npm run build
```

### Type Errors
```bash
# Regenerate Supabase types
npx supabase gen types typescript --project-id mauyygrbdopmpdpnwzra > src/integrations/supabase/types.ts
```

### Database Issues
```bash
# Check RLS policies in Supabase Dashboard
# SQL Editor → Run diagnostics
```

---

## 📚 Resources

### Documentation
- [React Docs](https://react.dev)
- [TypeScript Docs](https://www.typescriptlang.org/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [shadcn/ui Docs](https://ui.shadcn.com)

### Tools
- [Vercel Dashboard](https://vercel.com/dashboard)
- [Supabase Dashboard](https://supabase.com/dashboard)
- [React Query DevTools](https://tanstack.com/query/latest/docs/react/devtools)

---

**Last Updated:** 2 April 2026  
**Version:** 1.0.0
