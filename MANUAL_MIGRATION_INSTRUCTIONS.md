# Manual Migration Instructions - Data Builder Templates

## Kenapa Manual?
Network tidak bisa akses database secara langsung, dan RPC function untuk execute SQL tidak tersedia. Cara termudah adalah via Supabase Dashboard.

## Langkah-langkah (5 menit)

### 1. Buka Supabase Dashboard
1. Buka browser
2. Pergi ke: https://supabase.com/dashboard
3. Login dengan akun Anda
4. Pilih project: **SIMPEL Production** (mauyygrbdopmpdpnwzra)

### 2. Buka SQL Editor
1. Di sidebar kiri, klik **SQL Editor**
2. Klik tombol **New Query** (atau tekan Ctrl+Enter)

### 3. Copy-Paste SQL Berikut

```sql
-- Add data_builder_templates column to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS data_builder_templates jsonb DEFAULT '[]'::jsonb;

-- Add comment for documentation
COMMENT ON COLUMN profiles.data_builder_templates IS 'User saved query templates for Data Builder stored as JSON array';

-- Verify column was added
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_name = 'profiles' 
  AND column_name = 'data_builder_templates';
```

### 4. Run Query
1. Klik tombol **Run** (atau tekan Ctrl+Enter)
2. Tunggu beberapa detik
3. Anda akan melihat hasil query di bawah

### 5. Verifikasi Hasil
Anda harus melihat output seperti ini:

| column_name              | data_type | column_default | is_nullable |
|--------------------------|-----------|----------------|-------------|
| data_builder_templates   | jsonb     | '[]'::jsonb    | YES         |

Jika muncul tabel dengan 1 row seperti di atas, berarti **BERHASIL!** ✅

### 6. Test di Aplikasi
1. Kembali ke aplikasi
2. Refresh browser dengan **Ctrl+F5** (hard refresh)
3. Buka menu **Data Builder**
4. Setup beberapa kolom dan filter
5. Klik tombol **"Simpan Query"**
6. Isi nama template (contoh: "Test Template")
7. Klik **"Simpan Template"**
8. Seharusnya muncul toast **"Template berhasil disimpan"** ✅

## Troubleshooting

### Error: permission denied for table profiles
**Solusi**: Pastikan Anda login sebagai owner project atau user dengan permission ALTER TABLE.

### Error: column "data_builder_templates" already exists
**Solusi**: Bagus! Artinya kolom sudah ada. Skip langkah ini dan langsung test di aplikasi.

### Tidak muncul hasil query
**Solusi**: 
1. Pastikan Anda di project yang benar (mauyygrbdopmpdpnwzra)
2. Coba refresh SQL Editor
3. Run query lagi

### Masih error 400 saat save template
**Solusi**:
1. Clear browser cache (Ctrl+Shift+Delete)
2. Hard refresh (Ctrl+F5)
3. Logout dan login lagi
4. Coba lagi

## Screenshot Lokasi (Untuk Referensi)

```
Supabase Dashboard
├── [Sidebar]
│   ├── Home
│   ├── Table Editor
│   ├── SQL Editor  ← KLIK INI
│   ├── Database
│   └── ...
└── [Main Area]
    ├── [New Query Button]  ← KLIK INI
    └── [Query Editor]      ← PASTE SQL DI SINI
```

## Alternative: Via psql (Advanced)

Jika Anda punya psql installed dan network bisa akses:

```bash
# Set environment variable
export PGPASSWORD="Aliham251118!"

# Connect and run
psql "postgresql://postgres@db.mauyygrbdopmpdpnwzra.supabase.co:5432/postgres" -c "
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS data_builder_templates jsonb DEFAULT '[]'::jsonb;
"
```

## Setelah Migration Berhasil

File-file yang sudah siap:
- ✅ `src/components/data-builder/QueryTemplates.tsx` - Component
- ✅ `src/pages/DataBuilder.tsx` - Integration
- ✅ Database column - **PERLU DIAPPLY MANUAL** (langkah di atas)

Setelah migration berhasil, fitur Query Templates akan langsung bisa digunakan!

## Support

Jika masih ada masalah, screenshot error dan tanyakan ke developer.
