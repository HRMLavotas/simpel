# ✅ Checklist Deployment SIMPEL

## Pre-Deployment

- [ ] Semua fitur sudah di-test di local
- [ ] Database migrations sudah di-push ke Supabase production
- [ ] Environment variables sudah disiapkan
- [ ] Build berhasil di local (`npm run build`)

## Supabase Setup

- [ ] Project Supabase sudah dibuat
- [ ] Semua migrations sudah di-push (`npx supabase db push --linked`)
- [ ] RLS policies sudah enabled
- [ ] Auth settings sudah dikonfigurasi
- [ ] Copy SUPABASE_URL dan SUPABASE_ANON_KEY

## Vercel Deployment

### Quick Deploy (5 Menit)

1. **Buka Vercel Dashboard**
   - https://vercel.com/new
   - Login dengan GitHub/GitLab

2. **Import Project**
   - Pilih repository atau upload folder
   - Framework: Vite
   - Root Directory: ./

3. **Environment Variables**
   ```
   VITE_SUPABASE_URL=https://xxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

4. **Deploy**
   - Klik "Deploy"
   - Tunggu 2-5 menit

5. **Update Supabase Auth URLs**
   - Site URL: `https://your-app.vercel.app`
   - Redirect URLs: `https://your-app.vercel.app/**`

## Post-Deployment Testing

- [ ] Login berhasil
- [ ] Dashboard loading
- [ ] CRUD pegawai berfungsi
- [ ] Import Excel berfungsi
- [ ] Export Excel berfungsi
- [ ] Peta Jabatan berfungsi
- [ ] Riwayat dan catatan tersimpan
- [ ] Mutasi pegawai berfungsi

## Optional

- [ ] Setup custom domain
- [ ] Enable Vercel Analytics
- [ ] Setup monitoring alerts
- [ ] Configure backup strategy

---

**Status: Ready to Deploy! 🚀**

**Estimated Time: 10-15 minutes**
