# Deploy BPS Proxy Edge Function

## Langkah-Langkah Deployment

### 1. Set BPS API Key sebagai Secret

Jalankan command berikut di terminal:

```bash
npx supabase secrets set BPS_API_KEY="49b3ee3219c4030633b6fff5e581ddc5"
```

### 2. Deploy Edge Function

```bash
npx supabase functions deploy bps-proxy
```

### 3. Verifikasi Deployment

Setelah deploy, test Edge Function dengan curl:

```bash
curl "https://mauyygrbdopmpdpnwzra.supabase.co/functions/v1/bps-proxy?type=prov" \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

Ganti `YOUR_ANON_KEY` dengan anon key dari `.env`:
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1hdXl5Z3JiZG9wbXBkcG53enJhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ5MzEzODQsImV4cCI6MjA5MDUwNzM4NH0.rO9oPY2jbax8GNVjW_rkaE8T4FqrV6OoJa7ME96p4bQ
```

### 4. Test dengan Browser

Setelah deploy berhasil:
1. Refresh browser (Ctrl + F5)
2. Buka halaman "Analisis Kebutuhan SDM"
3. Dropdown provinsi seharusnya terisi dari BPS API (via Edge Function)
4. Pilih provinsi → dropdown kabupaten seharusnya terisi

## Cara Kerja

### Before (Direct API - BLOCKED by WAF)
```
Browser → BPS API ❌ (WAF Block)
```

### After (Server-Side Proxy - WORKS)
```
Browser → Supabase Edge Function → BPS API ✅
```

## Keuntungan Solusi Ini

1. **Bypass WAF**: Request dari server tidak diblokir
2. **Caching**: Data di-cache 24 jam, mengurangi request ke BPS
3. **CORS**: Tidak ada masalah CORS
4. **Reliable**: Lebih stabil daripada direct API call
5. **Real-time**: Data selalu dari BPS API (bukan static)

## Troubleshooting

### Error: "Edge Function not found"
Pastikan sudah login ke Supabase:
```bash
npx supabase login
```

Kemudian link project:
```bash
npx supabase link --project-ref mauyygrbdopmpdpnwzra
```

### Error: "Unauthorized"
Pastikan menggunakan anon key yang benar dari `.env`

### Error: "BPS API error"
Cek apakah BPS API key masih valid:
```bash
curl "https://webapi.bps.go.id/v1/api/domain?type=prov&key=49b3ee3219c4030633b6fff5e581ddc5"
```

## Alternative: Deploy Manual via Supabase Dashboard

Jika command line tidak work:

1. Buka https://supabase.com/dashboard/project/mauyygrbdopmpdpnwzra
2. Klik "Edge Functions" di sidebar
3. Klik "Create a new function"
4. Name: `bps-proxy`
5. Copy-paste code dari `supabase/functions/bps-proxy/index.ts`
6. Deploy
7. Klik "Secrets" tab
8. Add secret: `BPS_API_KEY` = `49b3ee3219c4030633b6fff5e581ddc5`

## Expected Result

Setelah deployment berhasil, console browser akan menampilkan:

```
✅ BPS API provinces loaded via Edge Function
✅ BPS API regencies loaded for province 32 via Edge Function
```

Dan dropdown akan terisi dengan data REAL dari BPS API untuk SEMUA provinsi! 🎉
