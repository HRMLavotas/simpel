# Fix: Table Skeleton DOM Nesting Error

**Tanggal**: 2 April 2026  
**Status**: ✅ Fixed

---

## 🐛 Issue

Console menampilkan warning:
```
Warning: validateDOMNesting(...): <div> cannot appear as a child of <tbody>
```

---

## 🔍 Root Cause

`TableSkeleton` component menggunakan `<div>` elements yang tidak valid di dalam `<tbody>`. HTML spec hanya mengizinkan `<tr>` sebagai direct child dari `<tbody>`.

---

## ✅ Solution

Refactor `TableSkeleton` untuk menggunakan proper table elements:

### Before (Invalid):
```tsx
export function TableSkeleton({ rows = 5, columns = 5 }) {
  return (
    <div className="space-y-3">
      {[...Array(rows)].map((_, rowIndex) => (
        <div key={rowIndex} className="flex gap-4">
          {[...Array(columns)].map((_, colIndex) => (
            <Skeleton key={colIndex} className="h-16 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}
```

### After (Valid):
```tsx
export function TableSkeleton({ rows = 5, columns = 5 }) {
  return (
    <>
      {[...Array(rows)].map((_, rowIndex) => (
        <TableRow key={rowIndex}>
          {[...Array(columns)].map((_, colIndex) => (
            <TableCell key={colIndex}>
              <Skeleton className="h-4 w-full" />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
}
```

---

## 📝 Changes Made

**File**: `src/components/ui/skeleton-screens.tsx`

1. ✅ Replaced `<div>` wrapper with React Fragment `<>`
2. ✅ Replaced inner `<div>` with `<TableRow>`
3. ✅ Replaced skeleton containers with `<TableCell>`
4. ✅ Added proper imports: `TableRow`, `TableCell`

---

## ✅ Result

- No more DOM nesting warnings
- Proper HTML structure
- Skeleton rows render correctly in table
- Maintains same visual appearance

---

## 🧪 Testing

- [x] No console warnings
- [x] Skeleton displays correctly in Employees page
- [x] Proper table structure in DOM
- [x] No layout issues

---

*Fixed as part of Quick Wins implementation.*
