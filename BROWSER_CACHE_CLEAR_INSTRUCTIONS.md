# 🔄 INSTRUKSI CLEAR BROWSER CACHE

## ⚠️ PENTING: Clear Cache Setelah Update

Setelah melakukan update kode (terutama React Router future flags), browser cache perlu di-clear agar perubahan terlihat.

---

## 🌐 Cara Clear Cache per Browser

### Google Chrome / Microsoft Edge:
1. Tekan `Ctrl + Shift + Delete` (Windows) atau `Cmd + Shift + Delete` (Mac)
2. Pilih "Cached images and files"
3. Pilih time range: "All time"
4. Klik "Clear data"

**Atau:**
1. Buka DevTools (`F12`)
2. Klik kanan pada tombol Refresh
3. Pilih "Empty Cache and Hard Reload"

### Firefox:
1. Tekan `Ctrl + Shift + Delete`
2. Pilih "Cache"
3. Pilih time range: "Everything"
4. Klik "Clear Now"

### Safari:
1. Tekan `Cmd + Option + E`
2. Atau: Safari menu → Clear History → All History

---

## 🚀 Quick Fix untuk Development

### Vite Dev Server:
```bash
# Stop dev server (Ctrl+C)
# Clear Vite cache
rm -rf node_modules/.vite

# Restart dev server
npm run dev
```

### Browser:
```
1. Open DevTools (F12)
2. Go to Network tab
3. Check "Disable cache" checkbox
4. Refresh page (F5)
```

---

## ✅ Verifikasi Cache Sudah Clear

Setelah clear cache, cek console browser:
- ✅ Tidak ada React Router warnings
- ✅ Tidak ada DOM nesting warnings
- ✅ Console bersih

Jika masih ada warnings:
1. Close semua tab browser
2. Restart browser
3. Buka aplikasi di tab baru

---

## 🔧 Untuk Production Deployment

Setelah deploy ke production:
1. Users mungkin perlu clear cache
2. Atau tunggu cache expire (biasanya 24 jam)
3. Atau gunakan cache busting dengan versioning

**Vercel automatically handles cache busting** dengan content hashing di filename.

---

## 📝 Notes

**React Router Warnings:**
- Warnings muncul karena browser cache old version
- Setelah clear cache, warnings hilang
- Future flags sudah di-set di `src/App.tsx`

**DOM Nesting Warning:**
- Sudah diperbaiki di `src/components/KeyboardShortcutsHelp.tsx`
- Changed `<p>` to `<div>` untuk avoid nesting issue

---

**Updated:** 2 April 2026, 00:05 WIB
