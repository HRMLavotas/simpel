# 🚀 Commit Changes & Deploy

## ⚠️ PENTING: File Belum Ter-commit!

File fix dependency (`.npmrc`, `vercel.json`, `package.json`) belum ter-commit ke Git repository.

---

## 📝 Langkah 1: Commit Perubahan

Jalankan command berikut untuk commit semua perubahan:

```bash
# Add semua file yang berubah
git add .

# Commit dengan message
git commit -m "Fix: Add .npmrc and update configs for Vercel deployment

- Add .npmrc with legacy-peer-deps flag
- Update vercel.json with proper install command
- Add overrides in package.json for React dependencies
- Fix ERESOLVE dependency resolution issue"

# Push ke repository
git push origin main
```

---

## 🔄 Langkah 2: Vercel Auto-Deploy

Setelah push, Vercel akan otomatis:
1. Detect perubahan di repository
2. Trigger new deployment
3. Menggunakan `.npmrc` yang baru
4. Build dengan `npm install --legacy-peer-deps`

---

## ⏱️ Monitoring Deployment

### Via Vercel Dashboard

1. Buka: https://vercel.com/dashboard
2. Pilih project SIMPEL
3. Lihat tab "Deployments"
4. Monitor progress deployment terbaru

### Via CLI

```bash
# List deployments
vercel ls

# View logs
vercel logs
```

---

## ✅ Verifikasi Deployment Berhasil

Setelah deployment selesai, check:

1. **Status**: Ready (hijau)
2. **Build Logs**: No errors
3. **Application**: Buka URL production
4. **Test**: Login dan test fitur

---

## 🔧 Alternative: Manual Upload (Jika Tidak Pakai Git)

Jika tidak menggunakan Git, upload manual:

1. **Zip Project**
   - Zip seluruh folder project
   - Pastikan `.npmrc` included

2. **Upload ke Vercel**
   - Buka: https://vercel.com/new
   - Drag & drop zip file
   - Add environment variables
   - Deploy

---

## 📋 Files yang Harus Di-commit

Pastikan files ini ter-commit:

- ✅ `.npmrc` (NEW - PENTING!)
- ✅ `vercel.json` (UPDATED)
- ✅ `package.json` (UPDATED)
- ✅ All deployment docs
- ✅ All source code

---

## 🎯 Expected Result

Setelah commit dan push:

```
✅ Git push successful
✅ Vercel detects changes
✅ New deployment triggered
✅ npm install with --legacy-peer-deps
✅ Build successful
✅ Deployment ready
✅ Application live!
```

---

## 🆘 Troubleshooting

### Git Not Configured?

```bash
# Configure git
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"

# Initialize if needed
git init
git remote add origin YOUR_REPO_URL
```

### Permission Denied?

```bash
# Check remote
git remote -v

# Update remote if needed
git remote set-url origin YOUR_REPO_URL
```

### Merge Conflicts?

```bash
# Pull first
git pull origin main --rebase

# Then push
git push origin main
```

---

## ✨ Quick Commands

```bash
# All in one
git add . && git commit -m "Fix: Vercel deployment config" && git push origin main

# Check status
git status

# View last commit
git log -1
```

---

## 📞 Next Steps

1. ✅ Commit changes (command di atas)
2. ✅ Push to repository
3. ⏳ Wait for Vercel auto-deploy (2-5 min)
4. ✅ Verify deployment successful
5. ✅ Test application
6. ✅ Update Supabase Auth URLs
7. 🎉 Done!

---

**Jalankan command commit di atas sekarang! 🚀**
