# Panduan Komponen Reusable - PageHeader & StatCard

**Date**: 2026-05-13  
**Status**: ✅ READY TO USE

---

## Komponen yang Dibuat

### 1. **PageHeader** - Gradient Header dengan Icon
**File**: `src/components/ui/page-header.tsx`

### 2. **StatCard** - Statistics Card dengan Gradient
**File**: `src/components/ui/stat-card.tsx`

---

## 1. PageHeader Component

### Features
- ✅ Gradient background dengan 6 pilihan warna
- ✅ Icon support (Lucide icons)
- ✅ Responsive design
- ✅ Decorative background blur effects
- ✅ Dark mode support

### Props

```typescript
interface PageHeaderProps {
  icon: LucideIcon;           // Icon dari lucide-react
  title: string;              // Judul halaman
  description: string;        // Deskripsi halaman
  gradient?: "blue" | "green" | "purple" | "orange" | "red" | "indigo";
}
```

### Available Gradients
- `blue` - Default, untuk halaman umum
- `green` - Untuk halaman success/completed
- `purple` - Untuk halaman analytics/reports
- `orange` - Untuk halaman warnings/monitoring
- `red` - Untuk halaman critical/alerts
- `indigo` - Untuk halaman admin/settings

### Usage Example

```tsx
import { PageHeader } from "@/components/ui/page-header";
import { FileText, Users, BarChart, Settings } from "lucide-react";

// Basic usage
<PageHeader
  icon={FileText}
  title="Kasus Pegawai"
  description="Kelola kasus pegawai dan timeline tindak lanjutnya"
  gradient="blue"
/>

// Different colors
<PageHeader
  icon={Users}
  title="Data Pegawai"
  description="Kelola data pegawai ASN dan Non-ASN"
  gradient="green"
/>

<PageHeader
  icon={BarChart}
  title="Monitoring Aktivitas"
  description="Pantau update data pegawai per unit kerja"
  gradient="orange"
/>

<PageHeader
  icon={Settings}
  title="Pengaturan Sistem"
  description="Konfigurasi dan pengaturan aplikasi"
  gradient="indigo"
/>
```

---

## 2. StatCard Component

### Features
- ✅ Gradient background dengan 8 pilihan warna
- ✅ Icon support (Lucide icons atau custom SVG)
- ✅ Compact design (optimized spacing)
- ✅ Responsive
- ✅ Dark mode support

### Props

```typescript
interface StatCardProps {
  label: string;              // Label statistik
  value: string | number;     // Nilai statistik
  icon: LucideIcon | ReactNode; // Icon atau custom SVG
  color?: "blue" | "green" | "yellow" | "red" | "purple" | "orange" | "indigo" | "cyan";
  className?: string;         // Additional classes
}
```

### Available Colors
- `blue` - Default, untuk data umum
- `green` - Untuk success/completed
- `yellow` - Untuk in-progress/pending
- `red` - Untuk critical/alerts
- `purple` - Untuk special categories
- `orange` - Untuk warnings
- `indigo` - Untuk admin data
- `cyan` - Untuk info/secondary data

### Usage Examples

#### Basic Usage with Lucide Icons

```tsx
import { StatCard } from "@/components/ui/stat-card";
import { FileText, Users, CheckCircle, AlertTriangle } from "lucide-react";

<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
  <StatCard
    label="Total Pegawai"
    value={2500}
    icon={Users}
    color="blue"
  />
  
  <StatCard
    label="Aktif"
    value={2350}
    icon={CheckCircle}
    color="green"
  />
  
  <StatCard
    label="Cuti"
    value={100}
    icon={AlertTriangle}
    color="yellow"
  />
  
  <StatCard
    label="Non-Aktif"
    value={50}
    icon={FileText}
    color="red"
  />
</div>
```

#### Custom SVG Icons

```tsx
<StatCard
  label="Diproses"
  value={45}
  icon={(props: any) => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )}
  color="yellow"
/>
```

#### Dynamic Values

```tsx
<StatCard
  label="Total Kasus"
  value={cases.length}
  icon={FileText}
  color="blue"
/>

<StatCard
  label="Dengan Hukuman"
  value={cases.filter(c => c.hasDisciplinaryAction).length}
  icon={ShieldAlert}
  color="red"
/>
```

---

## Contoh Implementasi di Halaman Lain

### 1. Monitoring Aktivitas Unit Kerja

**File**: `src/pages/UnitActivityMonitoring.tsx`

```tsx
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { Activity, CheckCircle, XCircle, TrendingUp, Users } from "lucide-react";

export default function UnitActivityMonitoring() {
  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-4 md:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <PageHeader
            icon={Activity}
            title="Monitoring Aktivitas Unit Kerja"
            description="Pantau update data pegawai per unit kerja setiap bulan"
            gradient="orange"
          />

          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard
              label="Unit Aktif"
              value={activityData?.filter((d) => d.total_changes > 0).length || 0}
              icon={CheckCircle}
              color="green"
            />
            
            <StatCard
              label="Unit Tidak Aktif"
              value={activityData?.filter((d) => d.total_changes === 0).length || 0}
              icon={XCircle}
              color="red"
            />
            
            <StatCard
              label="Total Perubahan"
              value={activityData?.reduce((sum, d) => sum + d.total_changes, 0) || 0}
              icon={TrendingUp}
              color="blue"
            />
            
            <StatCard
              label="Pegawai Diupdate"
              value={activityData?.reduce((sum, d) => sum + d.employees_updated, 0) || 0}
              icon={Users}
              color="purple"
            />
          </div>

          {/* Rest of the page... */}
        </div>
      </div>
    </DashboardLayout>
  );
}
```

---

### 2. Data Audit

**File**: `src/pages/DataAudit.tsx`

```tsx
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { AlertTriangle, FileWarning, CheckCircle, TrendingUp } from "lucide-react";

export default function DataAudit() {
  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-4 md:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <PageHeader
            icon={AlertTriangle}
            title="Audit Data Pegawai"
            description="Identifikasi dan perbaiki masalah data pegawai"
            gradient="red"
          />

          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            <StatCard
              label="Pegawai Bermasalah"
              value={auditData?.length || 0}
              icon={FileWarning}
              color="red"
            />
            
            <StatCard
              label="Total Masalah"
              value={auditData?.reduce((sum, d) => sum + d.issues.length, 0) || 0}
              icon={AlertTriangle}
              color="orange"
            />
            
            <StatCard
              label="Akurasi Data"
              value={`${totalEmployees > 0 ? Math.round(((totalEmployees - (auditData?.length || 0)) / totalEmployees) * 100) : 0}%`}
              icon={CheckCircle}
              color="green"
            />
          </div>

          {/* Rest of the page... */}
        </div>
      </div>
    </DashboardLayout>
  );
}
```

---

### 3. Peta Jabatan

**File**: `src/pages/PetaJabatan.tsx`

```tsx
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { Briefcase, Users, UserCheck, UserX } from "lucide-react";

export default function PetaJabatan() {
  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-4 md:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <PageHeader
            icon={Briefcase}
            title="Peta Jabatan"
            description="Kelola struktur organisasi dan pemetaan jabatan"
            gradient="purple"
          />

          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard
              label="Total Jabatan"
              value={totalAbk}
              icon={Briefcase}
              color="blue"
            />
            
            <StatCard
              label="Terisi"
              value={totalExisting}
              icon={UserCheck}
              color="green"
            />
            
            <StatCard
              label="Kosong"
              value={totalAbk - totalExisting}
              icon={UserX}
              color="red"
            />
            
            <StatCard
              label="Tingkat Pengisian"
              value={`${Math.round((totalExisting / totalAbk) * 100)}%`}
              icon={Users}
              color="purple"
            />
          </div>

          {/* Rest of the page... */}
        </div>
      </div>
    </DashboardLayout>
  );
}
```

---

## Migration Guide

### Sebelum (Old Style)

```tsx
<div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-blue-500 to-blue-400 p-6 md:p-8 text-white shadow-xl mb-8">
  <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32 blur-3xl" />
  <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-16 -translate-x-16 blur-2xl" />
  <div className="relative flex items-start gap-4">
    <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
      <FileText className="h-8 w-8 text-white" />
    </div>
    <div>
      <h1 className="text-2xl md:text-3xl font-bold text-white">Kasus Pegawai</h1>
      <p className="text-white/90 mt-2 text-sm md:text-base">Kelola kasus pegawai dan timeline tindak lanjutnya</p>
    </div>
  </div>
</div>

<Card className="border-blue-200 dark:border-blue-800 bg-gradient-to-br from-blue-50 to-white dark:from-blue-950 dark:to-background">
  <CardContent className="p-4">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-xs font-medium text-muted-foreground">Total Kasus</p>
        <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">96</p>
      </div>
      <div className="p-2.5 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
        <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
      </div>
    </div>
  </CardContent>
</Card>
```

### Sesudah (New Style)

```tsx
<PageHeader
  icon={FileText}
  title="Kasus Pegawai"
  description="Kelola kasus pegawai dan timeline tindak lanjutnya"
  gradient="blue"
/>

<StatCard
  label="Total Kasus"
  value={96}
  icon={FileText}
  color="blue"
/>
```

**Benefits**:
- ✅ 90% less code
- ✅ Consistent styling across pages
- ✅ Easy to maintain
- ✅ Type-safe props
- ✅ Reusable

---

## Best Practices

### 1. **Gradient Color Selection**

| Page Type | Recommended Gradient |
|-----------|---------------------|
| General/List | `blue` |
| Success/Completed | `green` |
| Analytics/Reports | `purple` |
| Monitoring/Warnings | `orange` |
| Critical/Alerts | `red` |
| Admin/Settings | `indigo` |

### 2. **StatCard Color Selection**

| Data Type | Recommended Color |
|-----------|------------------|
| Total/Count | `blue` |
| Active/Success | `green` |
| Pending/In Progress | `yellow` |
| Error/Critical | `red` |
| Special Category | `purple` |
| Warning | `orange` |
| Admin Data | `indigo` |
| Info/Secondary | `cyan` |

### 3. **Grid Layout**

```tsx
// 4 cards - recommended for main statistics
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

// 3 cards - for summary statistics
<div className="grid grid-cols-1 md:grid-cols-3 gap-4">

// 2 cards - for comparison
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
```

### 4. **Spacing**

```tsx
// Between header and stats
<PageHeader ... />
<div className="grid ... mb-6">  // mb-6 for spacing

// Between stats and content
<div className="grid ... mb-6">
<Card>  // Main content
```

---

## Files Created

1. ✅ `src/components/ui/page-header.tsx` - PageHeader component
2. ✅ `src/components/ui/stat-card.tsx` - StatCard component
3. ✅ `src/pages/EmployeeCaseManagement.tsx` - Updated to use new components

---

## Next Steps

### Halaman yang Bisa Diupdate

1. ✅ **EmployeeCaseManagement** - Already done
2. ⏳ **UnitActivityMonitoring** - Monitoring aktivitas unit
3. ⏳ **DataAudit** - Audit data pegawai
4. ⏳ **PetaJabatan** - Peta jabatan (tab Non-ASN)
5. ⏳ **SystemInfo** - Info sistem (optional)

### How to Apply

1. Import komponen:
```tsx
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
```

2. Replace header lama dengan `<PageHeader />`
3. Replace card statistik dengan `<StatCard />`
4. Test di browser
5. Adjust colors sesuai kebutuhan

---

## Support

Komponen ini sudah:
- ✅ Type-safe (TypeScript)
- ✅ Responsive
- ✅ Dark mode support
- ✅ Accessible
- ✅ Optimized (compact spacing)
- ✅ Tested (no diagnostics errors)

Siap digunakan di seluruh aplikasi! 🎉
