# ⚡ Quick Start - Deploy SIMPEL dalam 5 Menit

## 🎯 Cara Tercepat Deploy

### Opsi 1: Gunakan Script (Recommended)

**Windows:**
```powershell
.\deploy.ps1
```

**Linux/Mac:**
```bash
chmod +x deploy.sh
./deploy.sh
```

Script akan:
- ✅ Test build
- ✅ Check Supabase connection
- ✅ Deploy ke Vercel atau buka dashboard

---

### Opsi 2: Manual via Browser (5 menit)

#### 1️⃣ Buka Vercel
```
https://vercel.com/new
```

#### 2️⃣ Import Project
- Drag & drop folder project ini
- Atau connect Git repository

#### 3️⃣ Add Environment Variables

Klik "Environment Variables" dan paste:

**Variable 1:**
```
Name: VITE_SUPABASE_URL
Value: https://mauyygrbdopmpdpnwzra.supabase.co
```

**Variable 2:**
```
Name: VITE_SUPABASE_ANON_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1hdXl5Z3JiZG9wbXBkcG53enJhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ5MzEzODQsImV4cCI6MjA5MDUwNzM4NH0.rO9oPY2jbax8GNVjW_rkaE8T4FqrV6OoJa7ME96p4bQ
```

#### 4️⃣ Deploy
- Klik "Deploy"
- Tunggu 2-5 menit
- ✅ Done!

---

### Opsi 3: Via CLI (Untuk Developer)

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

---

## 🔧 Post-Deploy (1 menit)

Setelah dapat URL production (contoh: `https://simpel-xxx.vercel.app`):

### Update Supabase Auth URLs

1. Buka: https://supabase.com/dashboard/project/mauyygrbdopmpdpnwzra/auth/url-configuration

2. Update:
   - **Site URL**: `https://simpel-xxx.vercel.app`
   - **Redirect URLs**: Add `https://simpel-xxx.vercel.app/**`

3. Save

---

## ✅ Test Aplikasi

Buka URL production dan test:
- Login
- Dashboard
- CRUD Pegawai
- Import/Export

---

## 🎉 Selesai!

**Total waktu**: 5-10 menit  
**Aplikasi live**: `https://your-app.vercel.app`

---

## 📞 Butuh Bantuan?

- Lihat `README_DEPLOYMENT.md` untuk panduan lengkap
- Check `DEPLOYMENT_GUIDE.md` untuk troubleshooting
- Vercel Docs: https://vercel.com/docs

---

**SIMPEL siap digunakan! 🚀**
