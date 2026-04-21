# Deployment Checklist - Monitoring Aktivitas Unit Kerja

## Pre-Deployment

### 1. Code Review
- [ ] Review semua file yang dibuat/diubah
- [ ] Pastikan tidak ada console.log yang tertinggal
- [ ] Check TypeScript errors: `npm run type-check` (jika ada)
- [ ] Check linting: `npm run lint` (jika ada)

### 2. Testing Lokal
- [ ] Test sebagai admin_pusat
  - [ ] Bisa akses menu "Monitoring Unit"
  - [ ] Summary cards menampilkan data benar
  - [ ] Daftar unit muncul dengan lengkap
  - [ ] Klik unit membuka dialog detail
  - [ ] Filter bulan berfungsi
  - [ ] Sort by aktivitas/nama berfungsi
  - [ ] Export CSV berhasil download
  
- [ ] Test sebagai admin_pimpinan
  - [ ] Bisa akses menu "Monitoring Unit"
  - [ ] Semua fitur berfungsi sama seperti admin_pusat
  
- [ ] Test sebagai admin_unit
  - [ ] Menu "Monitoring Unit" TIDAK muncul di sidebar
  - [ ] Akses langsung ke `/monitoring` redirect ke dashboard

### 3. Database Migration
- [ ] Backup database production (PENTING!)
- [ ] Test migration di development/staging dulu
- [ ] Verifikasi view `unit_activity_summary` terbuat
- [ ] Verifikasi function `get_unit_monthly_details` terbuat
- [ ] Test query manual untuk memastikan data muncul

## Deployment Steps

### Step 1: Apply Database Migration
```bash
# Option A: Via Supabase Dashboard (Recommended)
1. Login ke https://supabase.com/dashboard
2. Pilih project production
3. Klik "SQL Editor"
4. Copy-paste isi file: supabase/migrations/20260421100000_add_unit_activity_monitoring.sql
5. Klik "Run"
6. Pastikan success, tidak ada error

# Option B: Via Supabase CLI
supabase db push
```

- [ ] Migration berhasil dijalankan
- [ ] Tidak ada error di console
- [ ] View dan function terbuat

### Step 2: Verify Database
```sql
-- Test 1: Check view exists
SELECT * FROM unit_activity_summary LIMIT 5;

-- Test 2: Check function exists
SELECT get_unit_monthly_details('NAMA_UNIT_SAMPLE', '2026-04-01');

-- Test 3: Check data for current month
SELECT 
  department,
  total_changes,
  last_update
FROM unit_activity_summary
WHERE month = DATE_TRUNC('month', CURRENT_DATE)
ORDER BY total_changes DESC;
```

- [ ] Query 1 berhasil, menampilkan data
- [ ] Query 2 berhasil, menampilkan detail
- [ ] Query 3 berhasil, menampilkan data bulan ini

### Step 3: Deploy Frontend
```bash
# Build production
npm run build

# Deploy (sesuai platform Anda)
# Vercel:
vercel --prod

# Atau platform lain sesuai setup Anda
```

- [ ] Build berhasil tanpa error
- [ ] Deploy berhasil
- [ ] Deployment URL accessible

### Step 4: Post-Deployment Testing

#### Test di Production
- [ ] Login sebagai admin_pusat
- [ ] Menu "Monitoring Unit" muncul di sidebar
- [ ] Halaman monitoring terbuka tanpa error
- [ ] Data muncul dengan benar
- [ ] Summary cards menampilkan angka yang masuk akal
- [ ] Daftar unit lengkap
- [ ] Klik unit membuka dialog detail
- [ ] Detail perubahan muncul
- [ ] Filter bulan berfungsi
- [ ] Sort berfungsi
- [ ] Export CSV berhasil

#### Test Cross-Browser
- [ ] Chrome/Edge
- [ ] Firefox
- [ ] Safari (jika ada Mac)
- [ ] Mobile browser (Chrome/Safari mobile)

#### Test Responsive
- [ ] Desktop (1920x1080)
- [ ] Laptop (1366x768)
- [ ] Tablet (768px)
- [ ] Mobile (375px)

### Step 5: User Acceptance Testing (UAT)
- [ ] Demo ke admin_pusat
- [ ] Demo ke admin_pimpinan
- [ ] Collect feedback
- [ ] Fix critical issues (jika ada)

## Post-Deployment

### 1. Documentation
- [ ] Share `MONITORING_UNIT_QUICK_START.md` ke users
- [ ] Brief training session (optional)
- [ ] Update user manual (jika ada)

### 2. Monitoring
- [ ] Monitor error logs (24 jam pertama)
- [ ] Check database performance
- [ ] Monitor query execution time
- [ ] Check user feedback

### 3. Communication
- [ ] Announce fitur baru ke users
- [ ] Kirim email/notifikasi
- [ ] Update changelog (jika ada)

## Rollback Plan (Jika Ada Masalah)

### Database Rollback
```sql
-- Drop function
DROP FUNCTION IF EXISTS get_unit_monthly_details(TEXT, DATE);

-- Drop view
DROP VIEW IF EXISTS unit_activity_summary;
```

### Frontend Rollback
```bash
# Revert ke deployment sebelumnya
# Vercel: via dashboard, klik deployment sebelumnya, promote
# Platform lain: sesuai prosedur rollback Anda
```

## Success Criteria

✅ Fitur dianggap berhasil jika:
- [ ] Migration applied tanpa error
- [ ] Admin pusat & pimpinan bisa akses fitur
- [ ] Admin unit TIDAK bisa akses fitur
- [ ] Data ditampilkan dengan akurat
- [ ] Semua interaksi (klik, filter, sort, export) berfungsi
- [ ] Tidak ada error di console browser
- [ ] Tidak ada error di database logs
- [ ] Performance acceptable (load time < 3 detik)
- [ ] Users satisfied dengan fitur

## Known Issues / Limitations

Catat di sini jika ada:
- [ ] Issue 1: ...
- [ ] Issue 2: ...
- [ ] Limitation 1: ...
- [ ] Limitation 2: ...

## Contact for Issues

Jika ada masalah saat deployment:
1. Check error logs di Supabase Dashboard
2. Check browser console untuk frontend errors
3. Review dokumentasi di `UNIT_ACTIVITY_MONITORING_FEATURE.md`
4. Hubungi developer team

---

**Deployment Date**: _____________
**Deployed By**: _____________
**Status**: [ ] Success / [ ] Failed / [ ] Rolled Back
**Notes**: _____________________________________________
