# Panduan Deploy SIMPEL ke Vercel

## Persiapan Sebelum Deploy

### 1. Pastikan Supabase Sudah Production Ready

Sebelum deploy, pastikan database Supabase sudah siap:

```bash
# Link ke project Supabase production
npx supabase link --project-ref YOUR_PROJECT_REF

# Push semua migrations ke production
npx supabase db push --linked

# Verify migrations
npx supabase db remote commit
```

### 2. Dapatkan Supabase Credentials

Dari Supabase Dashboard (https://supabase.com/dashboard):
1. Buka project Anda
2. Pergi ke Settings > API
3. Copy:
   - Project URL (VITE_SUPABASE_URL)
   - anon/public key (VITE_SUPABASE_ANON_KEY)

## Deploy ke Vercel

### Opsi 1: Deploy via Vercel Dashboard (Recommended)

1. **Login ke Vercel**
   - Buka https://vercel.com
   - Login dengan GitHub/GitLab/Bitbucket

2. **Import Project**
   - Klik "Add New" > "Project"
   - Import repository Git Anda
   - Atau upload folder project secara manual

3. **Configure Project**
   - Framework Preset: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

4. **Set Environment Variables**
   Tambahkan environment variables berikut:
   ```
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```

5. **Deploy**
   - Klik "Deploy"
   - Tunggu proses build selesai (2-5 menit)
   - Aplikasi akan live di URL Vercel

### Opsi 2: Deploy via Vercel CLI

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Login**
   ```bash
   vercel login
   ```

3. **Deploy**
   ```bash
   # Deploy ke preview
   vercel
   
   # Deploy ke production
   vercel --prod
   ```

4. **Set Environment Variables**
   ```bash
   vercel env add VITE_SUPABASE_URL
   vercel env add VITE_SUPABASE_ANON_KEY
   ```

## Post-Deployment

### 1. Verify Deployment

Setelah deploy, test fitur-fitur berikut:
- ✅ Login/Authentication
- ✅ Dashboard loading
- ✅ Data Pegawai CRUD
- ✅ Import Excel
- ✅ Peta Jabatan
- ✅ Export Excel

### 2. Setup Custom Domain (Optional)

Di Vercel Dashboard:
1. Pergi ke Settings > Domains
2. Tambahkan custom domain Anda
3. Update DNS records sesuai instruksi Vercel

### 3. Configure Supabase Auth Redirect URLs

Di Supabase Dashboard:
1. Pergi ke Authentication > URL Configuration
2. Tambahkan production URL ke:
   - Site URL: `https://your-app.vercel.app`
   - Redirect URLs: `https://your-app.vercel.app/**`

### 4. Setup Continuous Deployment

Jika menggunakan Git:
- Setiap push ke branch `main` akan auto-deploy ke production
- Push ke branch lain akan create preview deployment

## Troubleshooting

### Build Failed

**Error: "Module not found"**
```bash
# Pastikan semua dependencies terinstall
npm install
npm run build
```

**Error: "Environment variables not found"**
- Pastikan VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY sudah di-set di Vercel

### Runtime Errors

**Error: "Failed to fetch"**
- Check Supabase URL dan API key
- Pastikan Supabase project tidak paused
- Check CORS settings di Supabase

**Error: "Authentication failed"**
- Verify redirect URLs di Supabase Auth settings
- Check Site URL configuration

### Performance Issues

**Slow Loading**
- Enable Vercel Analytics untuk monitoring
- Check Supabase query performance
- Consider adding caching

## Monitoring & Maintenance

### 1. Vercel Analytics
- Enable di Project Settings > Analytics
- Monitor page views, performance, errors

### 2. Supabase Monitoring
- Check database usage di Supabase Dashboard
- Monitor API requests
- Review logs untuk errors

### 3. Regular Updates
```bash
# Update dependencies
npm update

# Test locally
npm run dev

# Deploy updates
vercel --prod
```

## Security Checklist

- ✅ Environment variables tidak di-commit ke Git
- ✅ Supabase RLS (Row Level Security) enabled
- ✅ API keys menggunakan anon key (bukan service_role)
- ✅ HTTPS enabled (default di Vercel)
- ✅ Auth redirect URLs configured correctly

## Support

Jika ada masalah:
1. Check Vercel deployment logs
2. Check Supabase logs
3. Check browser console untuk errors
4. Review Vercel documentation: https://vercel.com/docs

## Useful Commands

```bash
# Check deployment status
vercel ls

# View deployment logs
vercel logs

# Remove deployment
vercel rm deployment-url

# List environment variables
vercel env ls

# Pull environment variables to local
vercel env pull
```

## Next Steps

Setelah deployment berhasil:
1. ✅ Test semua fitur di production
2. ✅ Setup monitoring dan alerts
3. ✅ Configure custom domain (optional)
4. ✅ Setup backup strategy untuk database
5. ✅ Document API endpoints (jika ada)
6. ✅ Train users on the new system

---

**Aplikasi SIMPEL siap digunakan! 🎉**
