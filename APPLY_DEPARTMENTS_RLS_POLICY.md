# 🔐 Panduan Lengkap: Menerapkan RLS Policy untuk Admin Unit Update Departments

## 📋 Ringkasan Masalah

**Masalah:** Admin Unit tidak bisa menyimpan data Sarpras (Sarana & Prasarana) karena Row Level Security (RLS) di tabel `departments` hanya mengizinkan `admin_pusat` untuk melakukan UPDATE.

**Dampak:** Setiap kali Admin Unit menekan tombol simpan Sarpras, Supabase langsung menolak (reject) aksi tersebut dengan error permission denied.

**Solusi:** Menambahkan RLS Policy baru yang mengizinkan Admin Unit untuk UPDATE departments yang menjadi tanggung jawab mereka (unit utama + unit binaan), tetapi tetap tidak bisa mengubah unit balai lain.

---

## 🚀 Cara Eksekusi (Pilih Salah Satu)

### **Opsi 1: Eksekusi Otomatis via Script Node.js** ⚡ (Direkomendasikan)

Jalankan perintah berikut di terminal proyek Anda:

```bash
node apply_departments_rls.mjs
```

**Apa yang dilakukan script ini?**
- Membaca file migrasi SQL: `supabase/migrations/20260518000000_add_admin_unit_update_departments_policy.sql`
- Mengeksekusinya langsung ke database Supabase Anda
- Memverifikasi bahwa policy berhasil diterapkan
- Menampilkan daftar semua policy aktif di tabel `departments`

**Output yang diharapkan:**
```
---------------------------------------------------------
🚀 SIMPEL DATABASE RUNNER: APPLY DEPARTMENTS RLS POLICY
---------------------------------------------------------
Connecting to PostgreSQL database...
Connected successfully!
Reading SQL file from: supabase/migrations/20260518000000_add_admin_unit_update_departments_policy.sql
Executing RLS migration script on Supabase...
RLS migration script executed successfully!

✅ Active policies on public.departments:
┌─────────────────────────────────────────────────────┬─────────┬─────────────┐
│ policyname                                          │ cmd     │ roles       │
├─────────────────────────────────────────────────────┼─────────┼─────────────┤
│ Admin unit can update accessible departments        │ UPDATE  │ {public}    │
│ ... (other policies)                                │ ...     │ ...         │
└─────────────────────────────────────────────────────┴─────────┴─────────────┘
---------------------------------------------------------
🎉 Database RLS updates complete! Admin Unit users can now
   successfully update their assigned departments & binaan.
---------------------------------------------------------
```

---

### **Opsi 2: Eksekusi Manual via Supabase Dashboard** 🖥️

Jika Anda lebih suka mengeksekusi SQL secara manual atau jika script Node.js gagal karena masalah koneksi:

1. **Buka Supabase Dashboard** Anda di browser
2. Navigasi ke: **SQL Editor** (biasanya di sidebar kiri)
3. Klik **New Query** untuk membuat query baru
4. **Copy-paste** SQL berikut ke editor:

```sql
-- Migration: Add Admin Unit Update Department RLS Policy
-- Allows Admin Unit to update fields (such as 'sarpras') in departments they have access to

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'departments' 
    AND policyname = 'Admin unit can update accessible departments'
  ) THEN
    CREATE POLICY "Admin unit can update accessible departments"
    ON public.departments FOR UPDATE
    USING (
      public.has_role(auth.uid(), 'admin_unit')
      AND name = ANY(public.get_accessible_departments(auth.uid()))
    );
    RAISE NOTICE 'Policy "Admin unit can update accessible departments" successfully created.';
  ELSE
    RAISE NOTICE 'Policy "Admin unit can update accessible departments" already exists.';
  END IF;
END $$;
```

5. Klik tombol **Run** atau tekan `Ctrl+Enter`
6. Pastikan muncul pesan sukses: `Policy "Admin unit can update accessible departments" successfully created.`

---

## 🔍 Penjelasan Teknis RLS Policy

### Policy yang Ditambahkan:

```sql
CREATE POLICY "Admin unit can update accessible departments"
ON public.departments FOR UPDATE
USING (
  public.has_role(auth.uid(), 'admin_unit')
  AND name = ANY(public.get_accessible_departments(auth.uid()))
);
```

### Cara Kerja:

1. **`public.has_role(auth.uid(), 'admin_unit')`**
   - Memastikan user yang login memiliki role `admin_unit`
   - Jika bukan admin_unit, policy ini tidak berlaku

2. **`name = ANY(public.get_accessible_departments(auth.uid()))`**
   - Mengambil daftar unit kerja yang boleh diakses oleh admin_unit tersebut
   - Termasuk: unit utama mereka + unit binaan yang ditugaskan
   - Hanya mengizinkan UPDATE jika nama department ada dalam daftar tersebut

### Keamanan:

✅ **Yang BISA dilakukan Admin Unit:**
- Update data Sarpras di unit utama mereka sendiri
- Update data Sarpras di unit binaan yang ditugaskan kepada mereka

❌ **Yang TIDAK BISA dilakukan Admin Unit:**
- Update data Sarpras di unit balai lain yang bukan tanggung jawab mereka
- Mengubah nama department atau field sensitif lainnya (jika ada policy tambahan)

---

## ✅ Verifikasi Setelah Eksekusi

### 1. Cek Policy di Database

Jalankan query berikut di SQL Editor Supabase:

```sql
SELECT policyname, cmd, roles, qual, with_check
FROM pg_policies 
WHERE tablename = 'departments' AND schemaname = 'public';
```

Pastikan ada policy dengan nama: **"Admin unit can update accessible departments"**

### 2. Test Fungsionalitas

1. Login sebagai **Admin Unit** di aplikasi SIMPEL
2. Buka halaman **Sarpras** (Sarana & Prasarana)
3. Pilih unit kerja yang menjadi tanggung jawab Anda
4. Ubah data Sarpras (misalnya: jumlah ruang kelas, luas tanah, dll)
5. Klik tombol **Simpan**
6. **Hasil yang diharapkan:** Data berhasil tersimpan tanpa error

### 3. Test Keamanan

1. Masih login sebagai **Admin Unit**
2. Coba akses unit kerja yang BUKAN tanggung jawab Anda
3. Coba ubah data Sarpras di unit tersebut
4. Klik tombol **Simpan**
5. **Hasil yang diharapkan:** Muncul error "Permission denied" atau data tidak tersimpan

---

## 🐛 Troubleshooting

### Error: "DATABASE_URL is not defined in .env"

**Solusi:**
- Pastikan file `.env` Anda memiliki variabel `DATABASE_URL`
- Format: `DATABASE_URL=postgresql://postgres:[PASSWORD]@[HOST]:[PORT]/postgres`
- Anda bisa mendapatkan connection string ini dari Supabase Dashboard → Settings → Database

### Error: "Connection timeout" atau "ECONNREFUSED"

**Solusi:**
- Pastikan komputer Anda terhubung ke internet
- Cek apakah IP Anda diblokir oleh firewall Supabase
- Gunakan **Opsi 2** (eksekusi manual via Dashboard) sebagai alternatif

### Error: "Policy already exists"

**Solusi:**
- Ini bukan error! Policy sudah berhasil diterapkan sebelumnya
- Anda tidak perlu melakukan apa-apa lagi
- Langsung test fungsionalitas Sarpras

### Sarpras masih tidak bisa disimpan setelah apply policy

**Solusi:**
1. Logout dan login ulang sebagai Admin Unit
2. Clear cache browser (Ctrl+Shift+Delete)
3. Cek apakah user tersebut benar-benar memiliki role `admin_unit`:
   ```sql
   SELECT email, role FROM profiles WHERE id = '[USER_ID]';
   ```
4. Cek apakah unit kerja tersebut ada dalam daftar accessible departments:
   ```sql
   SELECT public.get_accessible_departments('[USER_ID]');
   ```

---

## 📚 File Terkait

- **Migrasi SQL:** `supabase/migrations/20260518000000_add_admin_unit_update_departments_policy.sql`
- **Script Eksekusi:** `apply_departments_rls.mjs`
- **Dokumentasi:** `APPLY_DEPARTMENTS_RLS_POLICY.md` (file ini)

---

## 🎯 Kesimpulan

Dengan menerapkan RLS policy ini, Admin Unit kini dapat:
- ✅ Menyimpan data Sarpras untuk unit kerja yang menjadi tanggung jawab mereka
- ✅ Tetap terjaga keamanannya (tidak bisa mengubah unit balai lain)
- ✅ Sistem lebih fleksibel dan sesuai dengan hierarki organisasi

Jika ada pertanyaan atau masalah, silakan hubungi tim developer atau buka issue di repository proyek ini.

---

**Dibuat pada:** 18 Mei 2026  
**Versi:** 1.0.0  
**Status:** ✅ Ready for Production
