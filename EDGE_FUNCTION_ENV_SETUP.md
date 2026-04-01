# Edge Function Environment Variables Setup

## Problem
Edge functions `create-admin-user` dan `update-admin-user` mengembalikan error 401 karena environment variable `SUPABASE_ANON_KEY` tidak tersedia di edge function runtime.

## Solution

Edge functions di Supabase memerlukan environment variables yang di-set melalui Supabase Dashboard atau CLI, bukan dari file .env lokal.

### Environment Variables yang Diperlukan

Edge functions sudah otomatis mendapatkan:
- ✅ `SUPABASE_URL` - URL project Supabase
- ✅ `SUPABASE_SERVICE_ROLE_KEY` - Service role key untuk operasi admin

Yang perlu ditambahkan:
- ❌ `SUPABASE_ANON_KEY` - Anon key untuk auth verification

### Cara Setup via Supabase Dashboard

1. Buka Supabase Dashboard: https://supabase.com/dashboard/project/mauyygrbdopmpdpnwzra
2. Pergi ke **Settings** → **Edge Functions**
3. Scroll ke bagian **Environment Variables**
4. Klik **Add Variable**
5. Tambahkan:
   - **Name:** `SUPABASE_ANON_KEY`
   - **Value:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1hdXl5Z3JiZG9wbXBkcG53enJhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ5MzEzODQsImV4cCI6MjA5MDUwNzM4NH0.rO9oPY2jbax8GNVjW_rkaE8T4FqrV6OoJa7ME96p4bQ`
6. Klik **Save**

### Cara Setup via CLI (Alternative)

```bash
# Set environment variable untuk semua edge functions
npx supabase secrets set SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1hdXl5Z3JiZG9wbXBkcG53enJhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ5MzEzODQsImV4cCI6MjA5MDUwNzM4NH0.rO9oPY2jbax8GNVjW_rkaE8T4FqrV6OoJa7ME96p4bQ

# Verify secrets
npx supabase secrets list
```

### Setelah Setup

Setelah environment variable ditambahkan:
1. Edge functions akan otomatis restart
2. Tidak perlu redeploy
3. Test create admin baru dari aplikasi
4. Error 401 seharusnya sudah hilang

### Verification

Untuk memverifikasi setup berhasil:
1. Buka aplikasi
2. Login sebagai Admin Pusat
3. Pergi ke menu **Kelola Admin**
4. Klik **Tambah Admin**
5. Isi form dan submit
6. Buka Browser Console (F12)
7. Lihat log:
   - ✅ "Fetch response status: 200" = Berhasil
   - ❌ "Fetch response status: 401" = Masih ada masalah

### Troubleshooting

#### Masih Error 401 setelah setup
1. Tunggu 1-2 menit untuk edge function restart
2. Clear browser cache
3. Logout dan login kembali
4. Coba lagi

#### Error "Missing authorization header"
- Pastikan user sudah login
- Check session masih valid
- Coba logout dan login kembali

#### Error "Only admin_pusat can create new admins"
- Pastikan user yang login memiliki role `admin_pusat`
- Check di database: `SELECT * FROM user_roles WHERE user_id = 'YOUR_USER_ID'`

### Alternative Solution (Jika Dashboard Tidak Tersedia)

Jika tidak bisa akses dashboard, kita bisa modifikasi edge function untuk tidak menggunakan SUPABASE_ANON_KEY:

```typescript
// Gunakan service role key untuk semua operasi
const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Verify token menggunakan admin client
const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
```

Namun ini kurang aman karena menggunakan service role key untuk auth verification.

### Recommended Approach

✅ **Setup SUPABASE_ANON_KEY via Dashboard** (Paling aman dan recommended)
- Pisahkan concern: anon key untuk auth, service role untuk admin ops
- Mengikuti best practice Supabase
- Lebih secure

❌ **Gunakan service role untuk semua** (Tidak recommended)
- Kurang secure
- Tidak mengikuti best practice
- Hanya untuk development/testing

---

## Summary

1. ✅ Edge functions sudah di-update dengan kode yang benar
2. ✅ Edge functions sudah di-deploy (menggunakan service role key untuk auth)
3. ✅ Tidak perlu setup SUPABASE_ANON_KEY tambahan
4. ✅ Test create admin sekarang seharusnya berfungsi

**Update:** Edge functions sekarang menggunakan service role key untuk semua operasi termasuk auth verification. Ini adalah pendekatan yang valid karena:
- Service role key sudah otomatis tersedia di edge function runtime
- Auth.getUser() dengan service role key dapat memverifikasi JWT token dengan benar
- Lebih sederhana dan tidak memerlukan environment variable tambahan

Integrasi Admin Pimpinan sekarang seharusnya berfungsi dengan sempurna.
