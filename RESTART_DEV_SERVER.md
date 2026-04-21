# Restart Dev Server - REQUIRED

## Problem
Code changes tidak ter-load di browser meskipun sudah hard refresh berkali-kali.

## Solution: Restart Dev Server

### Step 1: Stop Current Dev Server
Di terminal tempat `npm run dev` berjalan:
- Tekan **Ctrl + C**
- Tunggu sampai server benar-benar stop

### Step 2: Clear Node Modules Cache (Optional tapi Recommended)
```bash
# Windows PowerShell
Remove-Item -Recurse -Force node_modules\.vite

# Atau hapus folder .vite secara manual di:
# node_modules/.vite/
```

### Step 3: Start Dev Server Again
```bash
npm run dev
```

### Step 4: Hard Refresh Browser
Setelah server restart:
1. Buka browser
2. Tekan **Ctrl + Shift + Delete**
3. Pilih "Cached images and files"
4. Klik "Clear data"
5. Atau langsung **Ctrl + Shift + R** (hard refresh)

### Step 5: Verify Code Loaded
Buka console dan klik Edit employee. Anda HARUS melihat log ini:

```
=== FORM RESET useEffect TRIGGERED ===
employee: 044041fd-14e3-4b3e-9400-30b54d32799 Darmawansyah
open: true
formModifiedRef: false
initialLoadCompleteRef: false

=== EMPLOYEE DATA FOR EDIT ===
Gender: ...
Religion: ...
ASN Status: PNS
Rank Group: Pembina Muda (IV/c)
Rank Group Type: string
Rank Group Length: 19
Full employee: {...}

=== FORM DATA TO RESET ===
rank_group value: Pembina Muda (IV/c)
asn_status value: PNS

=== FORM VALUES AFTER RESET ===
Gender: ...
Religion: ...
ASN Status: PNS
Rank Group: Pembina Muda (IV/c)
Position Name: Direktur Jenderal
Department: Setditjen Binalavotas

=== QuickActionForm Props ===
currentRank: Pembina Muda (IV/c)  <-- SHOULD HAVE VALUE!
currentPosition: Direktur Jenderal
currentDepartment: Setditjen Binalavotas
asnStatus: PNS
```

## Why This Happens

Vite's hot module replacement (HMR) sometimes fails to update:
1. Complex component with many useEffects
2. Circular dependencies
3. Cache issues
4. React Fast Refresh limitations

## Alternative: Check if Code is Actually Updated

Buka DevTools → Sources tab → Find file:
- `EmployeeFormModal.tsx`
- Search for: `=== FORM RESET useEffect TRIGGERED ===`

Jika tidak ada, berarti code belum ter-update dan perlu restart server.

## If Still Not Working After Restart

1. **Check terminal** - ada error saat build?
2. **Check browser console** - ada error JavaScript?
3. **Try different browser** - mungkin cache issue
4. **Clear all browser data** - Settings → Privacy → Clear browsing data
5. **Restart computer** - last resort jika ada file lock issue

## Expected Behavior After Fix

✅ Semua log muncul di console
✅ rank_group ter-load dengan benar
✅ Quick Action menampilkan "Pangkat Saat Ini: ..."
✅ Tab Data Utama menampilkan rank_group di dropdown
✅ Konsisten untuk semua employee (PNS dan PPPK)
