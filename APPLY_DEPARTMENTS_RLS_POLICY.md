# Panduan Migrasi RLS: Izin Update Sarpras Bagi Admin Unit

Dokumen ini berisi panduan untuk mengaktifkan izin pembaruan (*Update*) data **Sarana Prasarana (Sarpras)** bagi pengguna **Admin Unit** di unit kerja utama mereka dan seluruh sub-unit binaan mereka.

Sebab saat ini, tabel `departments` hanya memiliki izin `ALL` bagi `admin_pusat`, sehingga Supabase RLS memblokir upaya penyimpanan data Sarpras dari halaman Admin Unit.

---

## 🚀 Cara Menjalankan Migrasi

### Opsi 1: Otomatis via Terminal (Rekomendasi)

Karena lingkungan sandbox AI tidak memiliki koneksi keluar langsung ke database Supabase Anda, silakan jalankan perintah ini di terminal komputer lokal Anda (**DATA PC ALI**):

```bash
node apply_departments_rls.mjs
```

Script ini akan membaca file migrasi SQL di `supabase/migrations/20260518000000_add_admin_unit_update_departments_policy.sql` dan mengeksekusinya langsung melalui koneksi database resmi Anda.

---

### Opsi 2: Manual via Supabase Dashboard

Jika Anda lebih memilih mengeksekusi langsung di dasbor web Supabase:

1. Buka halaman **Supabase Dashboard** proyek Anda.
2. Klik menu **SQL Editor** di sidebar kiri.
3. Klik tombol **New Query** (+).
4. Buka file [20260518000000_add_admin_unit_update_departments_policy.sql](file:///d:/DATA%20PC%20ALI/CLONE%20APLIKASI/simpel/supabase/migrations/20260518000000_add_admin_unit_update_departments_policy.sql) dan copy seluruh isinya:

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

5. Paste kode tersebut ke dalam SQL Editor Supabase.
6. Klik tombol **Run** di kanan bawah.

---

## 👁️ Cara Verifikasi

Setelah migrasi selesai dijalankan, Anda dapat memastikan kebijakan RLS tersebut sudah aktif dengan menjalankan perintah SQL berikut di SQL Editor:

```sql
SELECT policyname, cmd, roles 
FROM pg_policies 
WHERE tablename = 'departments' AND schemaname = 'public';
```

Anda harus melihat baris baru:
* `policyname`: `Admin unit can update accessible departments`
* `cmd`: `UPDATE`
* `roles`: `{public}`

---

## 🎉 Hasil Akhir

Setelah kebijakan ini aktif:
1. **Admin Unit** kini dapat mengklik tombol **Edit** di unit utama dan unit binaan mereka.
2. Mereka dapat merubah data inventaris di tab **Prasarana**, **Sarana**, dan **Kejuruan**.
3. Saat mereka mengklik **"Simpan Profil Unit"**, data akan berhasil tersimpan ke database Supabase tanpa error RLS!
4. **Keamanan Tetap Terjamin**: Mereka tetap diblokir untuk merubah nama unit kerja master (`disabled`), diblokir untuk menambah unit baru, dan diblokir untuk mengubah unit milik balai lain.
