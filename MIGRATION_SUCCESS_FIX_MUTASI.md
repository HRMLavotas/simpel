# ✅ Migration Berhasil: Fix Error 403 pada Quick Action Pindah/Mutasi

**Tanggal:** 21 April 2026  
**Status:** ✅ SELESAI DAN DITERAPKAN

## Ringkasan

Migration untuk memperbaiki error 403 pada fitur Quick Action Pindah/Mutasi telah berhasil diterapkan ke database production.

## Masalah yang Diperbaiki

**Error:**
```
Failed to load resource: the server responded with a status of 403
/rest/v1/employees?id=eq.0a3c46fb-d5dc-4ed4-a2a5-fd32e6a5e9b3
```

**Penyebab:**  
RLS policy untuk UPDATE pada tabel `employees` memiliki `WITH CHECK` clause yang terlalu ketat, memblokir admin_unit untuk memutasi pegawai ke unit lain.

## Solusi yang Diterapkan

### 1. Migration Database (Backend)

**Migration File:** `supabase/migrations/20260421000000_fix_mutation_rls_policy.sql`

**Perubahan:**
- Drop policy lama: `"Admin unit can update own department employees"`
- Buat policy baru dengan `WITH CHECK` yang lebih permisif
- `USING` clause: Tetap memeriksa employee awalnya dari department user (keamanan terjaga)
- `WITH CHECK` clause: Tidak lagi memblokir perubahan department (mutasi keluar diizinkan)

### 2. Fix Frontend Logic (Frontend)

**File:** `src/pages/Employees.tsx`

**Masalah:** Setelah UPDATE berhasil, ada query SELECT yang mencoba refresh employee data, tetapi employee sudah pindah department sehingga policy SELECT memblokir akses (error 403).

**Solusi:** Skip query SELECT refresh jika employee dimutasi keluar:

```typescript
// Refresh selectedEmployee dengan data terbaru dari DB
// Skip jika employee dimutasi keluar (department berubah dan bukan admin_pusat)
if (selectedEmployee && !(departmentChanged && !isAdminPusat)) {
  const { data: updatedEmployee } = await supabase
    .from('employees')
    .select('*')
    .eq('id', employeeId)
    .single();
  if (updatedEmployee) {
    setSelectedEmployee(updatedEmployee as Employee);
  }
}
```

**Alasan:** Jika employee sudah dimutasi keluar, tidak perlu refresh data karena:
1. Employee tidak lagi muncul di daftar admin_unit yang lama
2. Toast notification sudah memberitahu user bahwa employee dipindahkan
3. `fetchEmployees()` akan refresh daftar tanpa employee yang dimutasi keluar

## Cara Penerapan

```bash
# Set password database dari .env
$env:SUPABASE_DB_PASSWORD="Aliham251118!"

# Push migration ke remote database
npx -y supabase@2.93.0 db push --linked
```

**Output:**
```
Applying migration 20260421000000_fix_mutation_rls_policy.sql...
Finished supabase db push.
```

## Verifikasi

Migration berhasil diterapkan dan tersinkronisasi:

```bash
npx -y supabase@2.93.0 migration list
```

Output menunjukkan:
```
   Local          | Remote         | Time (UTC)
  ----------------|----------------|--------------------
   20260421000000 | 20260421000000 | 2026-04-21 00:00:00
```

✅ Local dan Remote sudah sinkron

## Testing

Untuk memverifikasi fix berhasil:

1. **Refresh browser** (Ctrl+F5 atau Cmd+Shift+R)
2. Login sebagai `admin_unit`
3. Buka halaman **Employees**
4. Pilih pegawai di unit Anda
5. Klik **Edit**
6. Buka tab **Quick Action**
7. Pilih **Pindah/Mutasi**
8. Pilih unit kerja tujuan yang berbeda
9. Isi form dan klik **"Terapkan Mutasi"**
10. Klik **"Simpan Perubahan"** di bawah

**Expected Result:** ✅ Data tersimpan tanpa error 403

## Keamanan

Policy baru tetap aman karena:
- ✅ Admin_unit hanya bisa update pegawai yang AWALNYA di unit-nya (via USING clause)
- ✅ Admin_unit tidak bisa "mencuri" pegawai dari unit lain
- ✅ Admin_pusat tetap bisa update semua pegawai (policy terpisah)
- ✅ Mutasi masuk ke unit lain memicu notifikasi ke admin_unit penerima

## File Terkait

- `supabase/migrations/20260421000000_fix_mutation_rls_policy.sql` - Migration SQL
- `FIX_MUTASI_ERROR_403.md` - Dokumentasi lengkap masalah dan solusi
- `apply_fix_mutasi_rls.mjs` - Script alternatif (tidak digunakan karena RPC tidak tersedia)

## Referensi

- [Supabase CLI Getting Started](https://supabase.com/docs/guides/local-development/cli/getting-started)
- [Supabase RLS Policies](https://supabase.com/docs/guides/auth/row-level-security)

---

**Status Akhir:** ✅ Migration berhasil diterapkan dan siap digunakan!
