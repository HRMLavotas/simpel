# Debug: Kasus Tidak Muncul di List

## Masalah
Kasus berhasil dibuat (toast success muncul), tetapi tidak muncul di daftar kasus.

## Perubahan yang Dilakukan

### 1. **Perbaikan Role Check** ✅
**File**: `src/pages/EmployeeCaseManagement.tsx`

**Masalah**: 
- Menggunakan `user?.role` yang tidak ada di object user
- User dari Supabase Auth tidak memiliki property `role`

**Solusi**:
```typescript
// SEBELUM (SALAH)
const { user } = useAuth();
const isAdminPusat = user?.role === "admin_pusat";

// SESUDAH (BENAR)
const { user, role } = useAuth();
const isAdminPusat = role === "admin_pusat";
```

### 2. **Menambahkan Logging Komprehensif** 🔍

#### A. Di `loadCases()` function
```typescript
console.log("🔄 Loading cases...");
console.log("📦 Cases loaded:", allCases);
console.log("✅ Cases state updated, total:", allCases.length);
```

#### B. Di `getAllCases()` function
```typescript
console.log("🔍 Fetching all cases...");
console.log("📊 Cases query result:", { cases, error: casesError });
console.log("✅ Found X cases");
console.log("📝 Found X timeline items");
console.log("✅ Mapped cases:", mappedCases);
```

#### C. Di `createCase()` function
```typescript
console.log("📝 Creating new case with data:", caseData);
console.log("📤 Inserting data:", insertData);
console.log("✅ Case created successfully:", data);
```

## Cara Testing

### 1. Buka Browser Console
- Tekan F12 atau klik kanan → Inspect
- Buka tab "Console"

### 2. Buat Kasus Baru
- Klik tombol "Tambah Kasus"
- Isi form dengan data lengkap
- Klik "Simpan Kasus"

### 3. Perhatikan Console Log
Anda akan melihat urutan log seperti ini:

```
📝 Creating new case with data: {...}
📤 Inserting data: {...}
✅ Case created successfully: {...}
🔄 Loading cases...
🔍 Fetching all cases...
📊 Cases query result: {...}
✅ Found X cases
📝 Found X timeline items
✅ Mapped cases: [...]
📦 Cases loaded: [...]
✅ Cases state updated, total: X
```

## Kemungkinan Penyebab Masalah

### 1. **RLS Policy Issue** ⚠️
Jika di console muncul:
```
📊 Cases query result: { cases: [], error: null }
⚠️ No cases found in database
```

**Artinya**: RLS policy memblokir akses SELECT
**Solusi**: Periksa apakah `has_role(auth.uid(), 'admin_pusat')` mengembalikan `true`

**Test Query di Supabase SQL Editor**:
```sql
-- Test apakah user memiliki role admin_pusat
SELECT has_role(auth.uid(), 'admin_pusat');

-- Test query cases langsung
SELECT * FROM employee_cases;
```

### 2. **Data Tidak Ter-refresh** 🔄
Jika di console muncul:
```
✅ Case created successfully: {...}
```
Tapi tidak ada log `🔄 Loading cases...`

**Artinya**: Callback `onCaseCreated()` tidak dipanggil
**Solusi**: Sudah diperbaiki, callback sudah benar

### 3. **Filter Menyembunyikan Data** 🔍
Jika di console muncul:
```
📦 Cases loaded: [5 items]
```
Tapi di UI hanya muncul 0-4 items

**Artinya**: Filter (search, case type, status) menyembunyikan kasus baru
**Solusi**: Reset filter atau periksa apakah kasus baru match dengan filter aktif

### 4. **Mapping Error** ❌
Jika di console muncul error saat mapping:
```
❌ Error in getAllCases: ...
```

**Artinya**: Ada masalah saat mapping data dari database ke EmployeeCase type
**Solusi**: Periksa struktur data yang dikembalikan dari database

## Checklist Debugging

- [ ] Buka browser console (F12)
- [ ] Buat kasus baru
- [ ] Lihat apakah muncul log "✅ Case created successfully"
- [ ] Lihat apakah muncul log "🔄 Loading cases..."
- [ ] Lihat berapa jumlah cases yang di-load: "✅ Cases state updated, total: X"
- [ ] Periksa apakah ada error di console
- [ ] Periksa filter (search, case type, status) - pastikan "Semua"
- [ ] Refresh halaman dan lihat apakah kasus muncul

## File yang Diubah

1. ✅ `src/pages/EmployeeCaseManagement.tsx`
   - Perbaikan role check
   - Tambah logging di loadCases()

2. ✅ `src/lib/employeeCaseStorage.ts`
   - Tambah logging di getAllCases()
   - Tambah logging di createCase()

## Next Steps

Setelah testing dengan console log:

1. **Jika kasus muncul** ✅
   - Masalah sudah teratasi
   - Hapus console.log jika mengganggu

2. **Jika kasus tidak muncul** ❌
   - Screenshot console log
   - Jalankan test query di Supabase SQL Editor
   - Periksa RLS policies

3. **Jika ada error** ⚠️
   - Copy error message lengkap
   - Periksa stack trace
   - Identifikasi di function mana error terjadi
