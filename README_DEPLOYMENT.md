# 🚀 SIMPEL - Ready to Deploy!

## ✅ Status: Build Successful

Aplikasi sudah siap untuk di-deploy ke Vercel!

---

## 📋 Langkah Deploy (Ikuti Urutan Ini)

### 1️⃣ Persiapan Supabase (Jika Belum)

Jika Supabase production belum ready, jalankan:

```bash
# Link ke project production
npx supabase link --project-ref YOUR_PROJECT_REF

# Push semua migrations
npx supabase db push --linked
```

**Dapatkan Credentials:**
- Buka: https://supabase.com/dashboard
- Pilih project Anda
- Pergi ke: Settings > API
- Copy:
  - **Project URL** (contoh: https://xxxxx.supabase.co)
  - **anon public key** (string panjang yang dimulai dengan eyJ...)

---

### 2️⃣ Deploy ke Vercel

#### Opsi A: Via Dashboard (Recommended - 5 menit)

1. **Buka Vercel**
   ```
   https://vercel.com/new
   ```

2. **Login**
   - Gunakan GitHub, GitLab, atau Bitbucket
   - Atau buat akun baru (gratis)

3. **Import Project**
   
   **Jika menggunakan Git:**
   - Klik "Import Git Repository"
   - Pilih repository SIMPEL
   - Authorize Vercel untuk akses repository
   
   **Jika tidak menggunakan Git:**
   - Klik "Deploy from CLI" atau upload manual
   - Zip folder project ini
   - Upload ke Vercel

4. **Configure Project**
   
   Vercel akan auto-detect settings:
   - Framework: **Vite** ✅
   - Build Command: `npm run build` ✅
   - Output Directory: `dist` ✅
   - Install Command: `npm install` ✅
   
   **Jangan ubah settings ini!**

5. **Add Environment Variables**
   
   Klik tab "Environment Variables" dan tambahkan:
   
   ```
   Variable 1:
   Name: VITE_SUPABASE_URL
   Value: [paste Project URL dari Supabase]
   
   Variable 2:
   Name: VITE_SUPABASE_ANON_KEY
   Value: [paste anon key dari Supabase]
   ```
   
   **PENTING:** Pastikan nama variable PERSIS seperti di atas (case-sensitive)!

6. **Deploy!**
   - Klik tombol "Deploy"
   - Tunggu 2-5 menit
   - Vercel akan build dan deploy aplikasi
   - Setelah selesai, kamu akan dapat URL production

#### Opsi B: Via CLI (Untuk Developer)

```bash
# Install Vercel CLI (jika belum)
npm install -g vercel

# Login ke Vercel
vercel login

# Deploy (akan create project baru)
vercel

# Ikuti prompt:
# - Set up and deploy? Yes
# - Which scope? [pilih account kamu]
# - Link to existing project? No
# - Project name? simpel (atau nama lain)
# - Directory? ./ (default)
# - Override settings? No

# Set environment variables
vercel env add VITE_SUPABASE_URL production
# [paste Supabase URL]

vercel env add VITE_SUPABASE_ANON_KEY production
# [paste Supabase anon key]

# Deploy to production
vercel --prod
```

---

### 3️⃣ Update Supabase Auth URLs

Setelah deploy berhasil, kamu akan dapat URL production (contoh: `https://simpel-xxx.vercel.app`)

**Update di Supabase:**

1. Buka: https://supabase.com/dashboard
2. Pilih project Anda
3. Pergi ke: Authentication > URL Configuration
4. Update:
   - **Site URL**: `https://simpel-xxx.vercel.app` (ganti dengan URL Vercel kamu)
   - **Redirect URLs**: Tambahkan `https://simpel-xxx.vercel.app/**`
5. Klik "Save"

---

### 4️⃣ Test Aplikasi Production

Buka URL production dan test:

- ✅ Halaman login muncul
- ✅ Bisa login dengan akun admin
- ✅ Dashboard loading dengan benar
- ✅ Data pegawai bisa di-load
- ✅ CRUD pegawai berfungsi
- ✅ Import Excel berfungsi
- ✅ Export Excel berfungsi
- ✅ Peta Jabatan berfungsi
- ✅ Riwayat dan catatan tersimpan

---

## 🎉 Selesai!

Aplikasi SIMPEL sudah live dan siap digunakan!

### Informasi Penting:

**URL Production**: `https://your-app.vercel.app`

**Akses Admin:**
- Email: [email admin yang sudah dibuat]
- Password: [password admin]

**Vercel Dashboard**: https://vercel.com/dashboard
- Monitor deployment
- View logs
- Manage environment variables
- Configure custom domain

---

## 🔧 Troubleshooting

### Build Failed?

**Check logs:**
```bash
vercel logs
```

**Common issues:**
- Missing environment variables → Add di Vercel dashboard
- Node version mismatch → Vercel uses Node 18 by default
- Dependencies error → Check package.json

### Auth Not Working?

1. Check Supabase redirect URLs
2. Verify environment variables di Vercel
3. Check browser console untuk error messages

### Database Error?

1. Pastikan migrations sudah di-push ke Supabase
2. Check Supabase project tidak paused (free tier)
3. Verify RLS policies enabled

### Can't Access Application?

1. Check deployment status di Vercel dashboard
2. View deployment logs untuk error
3. Test Supabase connection dari local

---

## 📊 Monitoring & Maintenance

### Vercel Analytics (Optional)

Enable di: Project Settings > Analytics
- Page views
- Performance metrics
- Error tracking

### Supabase Monitoring

Check di Supabase Dashboard:
- Database usage
- API requests
- Storage usage
- Active connections

### Auto-Deploy

Jika menggunakan Git:
- Push ke `main` branch → Auto-deploy to production
- Push ke branch lain → Create preview deployment

---

## 🔄 Update Aplikasi

Untuk deploy update:

**Via Git:**
```bash
git add .
git commit -m "Update feature"
git push origin main
# Vercel akan auto-deploy
```

**Via CLI:**
```bash
vercel --prod
```

---

## 📞 Support

**Dokumentasi:**
- Vercel: https://vercel.com/docs
- Supabase: https://supabase.com/docs
- Vite: https://vitejs.dev

**Logs:**
```bash
# Vercel logs
vercel logs [deployment-url]

# Local build test
npm run build
npm run preview
```

---

## ✨ Next Steps

Setelah deployment berhasil:

1. ✅ Share URL ke team
2. ✅ Setup custom domain (optional)
3. ✅ Configure backup strategy
4. ✅ Train users
5. ✅ Monitor usage dan performance

---

**Aplikasi SIMPEL siap digunakan untuk mengelola data pegawai Lavotas! 🎊**
