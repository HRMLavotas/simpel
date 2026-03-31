# 🚀 Deploy SIMPEL ke Vercel - Langkah Cepat

## Persiapan (5 menit)

### 1. Pastikan Supabase Production Ready

```bash
# Link ke Supabase production
npx supabase link --project-ref YOUR_PROJECT_REF

# Push migrations
npx supabase db push --linked
```

### 2. Dapatkan Credentials dari Supabase

Buka: https://supabase.com/dashboard/project/YOUR_PROJECT/settings/api

Copy:
- **Project URL**: `https://xxxxx.supabase.co`
- **anon public key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

---

## Deploy ke Vercel (5 menit)

### Cara 1: Via Dashboard (Paling Mudah)

1. **Buka Vercel**
   ```
   https://vercel.com/new
   ```

2. **Import Project**
   - Klik "Import Git Repository" atau "Upload"
   - Pilih repository atau upload folder project

3. **Configure**
   - Framework Preset: **Vite** (auto-detect)
   - Build Command: `npm run build` (default)
   - Output Directory: `dist` (default)

4. **Add Environment Variables**
   Klik "Environment Variables" dan tambahkan:
   
   ```
   Name: VITE_SUPABASE_URL
   Value: https://xxxxx.supabase.co
   
   Name: VITE_SUPABASE_ANON_KEY
   Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

5. **Deploy!**
   - Klik "Deploy"
   - Tunggu 2-5 menit
   - ✅ Done! Aplikasi live di `https://your-app.vercel.app`

### Cara 2: Via CLI (Untuk Developer)

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
vercel

# Set environment variables
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_ANON_KEY

# Deploy to production
vercel --prod
```

---

## Post-Deploy (2 menit)

### Update Supabase Auth URLs

Buka: https://supabase.com/dashboard/project/YOUR_PROJECT/auth/url-configuration

Tambahkan:
- **Site URL**: `https://your-app.vercel.app`
- **Redirect URLs**: `https://your-app.vercel.app/**`

### Test Aplikasi

Buka aplikasi dan test:
- ✅ Login
- ✅ Dashboard
- ✅ Data Pegawai
- ✅ Import/Export

---

## Troubleshooting

### Build Error?
```bash
# Test build locally
npm run build

# Check logs
vercel logs
```

### Auth Error?
- Pastikan Redirect URLs sudah di-set di Supabase
- Check environment variables di Vercel

### Database Error?
- Pastikan migrations sudah di-push
- Check Supabase project tidak paused

---

## 🎉 Selesai!

Aplikasi SIMPEL sudah live dan siap digunakan!

**URL Production**: `https://your-app.vercel.app`

### Next Steps:
1. Share URL ke team
2. Setup custom domain (optional)
3. Enable analytics
4. Monitor usage

---

**Need Help?**
- Vercel Docs: https://vercel.com/docs
- Supabase Docs: https://supabase.com/docs
