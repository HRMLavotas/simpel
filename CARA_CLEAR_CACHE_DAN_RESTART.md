# 🔄 Cara Clear Cache dan Restart Development Server

## Masalah:
Perubahan pada EmployeeDetailsModal tidak muncul karena browser cache atau development server belum reload.

---

## ✅ Solusi 1: Hard Refresh Browser (COBA INI DULU)

### Chrome / Edge:
1. Tekan `Ctrl + Shift + R` (Windows/Linux)
2. Atau `Ctrl + F5`
3. Atau buka DevTools (`F12`) → klik kanan pada tombol refresh → pilih "Empty Cache and Hard Reload"

### Firefox:
1. Tekan `Ctrl + Shift + R` (Windows/Linux)
2. Atau `Ctrl + F5`

### Safari:
1. Tekan `Cmd + Option + R` (Mac)

---

## ✅ Solusi 2: Clear Browser Cache Completely

### Chrome / Edge:
1. Tekan `Ctrl + Shift + Delete`
2. Pilih "Cached images and files"
3. Time range: "Last hour" atau "All time"
4. Klik "Clear data"
5. Refresh halaman (`F5`)

### Firefox:
1. Tekan `Ctrl + Shift + Delete`
2. Pilih "Cache"
3. Time range: "Everything"
4. Klik "Clear Now"
5. Refresh halaman (`F5`)

---

## ✅ Solusi 3: Restart Development Server

### Jika menggunakan npm/yarn:

1. **Stop server** (di terminal):
   - Tekan `Ctrl + C`

2. **Clear cache** (opsional tapi direkomendasikan):
   ```bash
   # Hapus folder cache
   rm -rf node_modules/.vite
   rm -rf .next
   rm -rf dist
   rm -rf build
   ```

3. **Restart server**:
   ```bash
   npm run dev
   # atau
   yarn dev
   # atau
   pnpm dev
   ```

### Jika menggunakan Vite:
```bash
# Stop server (Ctrl + C)
# Lalu restart dengan clear cache
npm run dev -- --force
```

---

## ✅ Solusi 4: Verifikasi File Sudah Tersimpan

1. Buka file `src/components/employees/EmployeeDetailsModal.tsx`
2. Cari baris ini di bagian atas:
   ```tsx
   import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
   ```
3. Cari baris ini di component:
   ```tsx
   <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'main' | 'history' | 'notes')}>
   ```
4. Jika ada, berarti file sudah benar

---

## ✅ Solusi 5: Disable Browser Cache (Untuk Development)

### Chrome / Edge DevTools:
1. Buka DevTools (`F12`)
2. Pergi ke tab "Network"
3. Centang "Disable cache"
4. Biarkan DevTools tetap terbuka saat development

### Firefox DevTools:
1. Buka DevTools (`F12`)
2. Klik icon gear (⚙️) di kanan atas
3. Centang "Disable HTTP Cache (when toolbox is open)"

---

## 🔍 Cara Verifikasi Perubahan Sudah Muncul:

1. Buka aplikasi di browser
2. Buka halaman Data Pegawai
3. Klik tombol "Lihat Detail" pada salah satu pegawai
4. **Yang BENAR** (implementasi baru):
   - Ada 3 tab di atas: "Data Utama", "Riwayat", "Keterangan"
   - Field-field ditampilkan dalam kotak read-only (seperti input disabled)
   - Ada field "Jabatan Tambahan (Opsional)"
   - Riwayat ditampilkan dalam format tabel

5. **Yang SALAH** (implementasi lama):
   - Tidak ada tab
   - Menggunakan collapsible sections dengan tombol "Lihat Semua"
   - Card-based layout
   - Tidak ada field "Jabatan Tambahan"

---

## 🚨 Jika Masih Tidak Berhasil:

### Cek apakah ada error di console:
1. Buka DevTools (`F12`)
2. Pergi ke tab "Console"
3. Lihat apakah ada error merah
4. Screenshot dan share error jika ada

### Cek apakah file benar-benar ter-compile:
1. Lihat terminal development server
2. Cari pesan seperti:
   ```
   ✓ built in XXXms
   ```
   atau
   ```
   [vite] hmr update /src/components/employees/EmployeeDetailsModal.tsx
   ```

### Force rebuild:
```bash
# Stop server (Ctrl + C)

# Hapus semua cache dan build artifacts
rm -rf node_modules/.vite
rm -rf .next
rm -rf dist
rm -rf build
rm -rf .turbo

# Restart
npm run dev
```

---

## 💡 Tips untuk Development:

1. **Selalu buka DevTools** saat development
2. **Enable "Disable cache"** di Network tab
3. **Gunakan Incognito/Private mode** untuk testing tanpa cache
4. **Restart dev server** setelah perubahan besar
5. **Hard refresh** (`Ctrl + Shift + R`) setelah setiap perubahan penting

---

## ✅ Checklist:

- [ ] Hard refresh browser (`Ctrl + Shift + R`)
- [ ] Clear browser cache completely
- [ ] Restart development server
- [ ] Disable cache di DevTools
- [ ] Verifikasi file tersimpan dengan benar
- [ ] Cek console untuk error
- [ ] Coba di Incognito/Private mode
- [ ] Force rebuild jika perlu

---

## 📞 Jika Masih Bermasalah:

Jika setelah semua langkah di atas masih muncul implementasi lama, kemungkinan ada masalah lain. Silakan:
1. Screenshot tampilan modal yang muncul
2. Screenshot console errors (jika ada)
3. Share informasi development server yang digunakan (Vite/Next.js/dll)
