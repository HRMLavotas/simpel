# ✅ Deployment Checklist: Fitur Pengumuman

## 📋 Pre-Deployment

### 1. Code Review
- [x] Migration file sudah dibuat
- [x] Hooks sudah dibuat dan tested
- [x] Components sudah dibuat
- [x] Pages sudah dibuat
- [x] Routes sudah ditambahkan
- [x] Navigation menu sudah ditambahkan
- [x] No TypeScript errors
- [x] No console errors

### 2. Database
- [x] Migration applied successfully
  ```
  ✅ 20260507100000_create_announcements_table.sql
  ```
- [ ] Verify tables created:
  - [ ] `announcements`
  - [ ] `announcement_dismissals`
- [ ] Verify function created:
  - [ ] `get_active_announcements()`
- [ ] Verify RLS policies active:
  - [ ] Admin Pusat can manage announcements
  - [ ] All users can view active announcements
  - [ ] Users can dismiss announcements
  - [ ] Users can view their dismissals
  - [ ] Admin Pusat can view all dismissals

### 3. Testing (Development)
- [ ] **Admin Pusat Tests**
  - [ ] Login sebagai Admin Pusat
  - [ ] Buka menu "Pengumuman"
  - [ ] Buat pengumuman baru (Info)
  - [ ] Buat pengumuman baru (Sukses)
  - [ ] Buat pengumuman baru (Peringatan)
  - [ ] Buat pengumuman baru (Penting)
  - [ ] Edit pengumuman
  - [ ] Toggle aktif/nonaktif
  - [ ] Hapus pengumuman
  - [ ] Set prioritas berbeda
  - [ ] Set tanggal kadaluarsa
  - [ ] Verifikasi pengumuman muncul di dashboard

- [ ] **Admin Unit Tests**
  - [ ] Login sebagai Admin Unit
  - [ ] Buka Dashboard
  - [ ] Verifikasi pengumuman muncul di atas
  - [ ] Verifikasi urutan berdasarkan prioritas
  - [ ] Tutup pengumuman (klik X)
  - [ ] Refresh halaman
  - [ ] Verifikasi pengumuman tidak muncul lagi
  - [ ] Test dengan multiple pengumuman

- [ ] **Edge Cases**
  - [ ] Pengumuman tanpa expiration
  - [ ] Pengumuman dengan prioritas sama
  - [ ] Multiple pengumuman aktif (3-5 pengumuman)
  - [ ] Pengumuman dengan pesan panjang (>500 karakter)
  - [ ] Pengumuman dengan pesan multi-line
  - [ ] Pengumuman yang sudah kadaluarsa (tidak muncul)
  - [ ] Pengumuman nonaktif (tidak muncul)

### 4. Performance
- [ ] Check query performance
  - [ ] `get_active_announcements()` execution time
  - [ ] Index pada `announcements` table
  - [ ] Index pada `announcement_dismissals` table
- [ ] Check auto-refresh behavior (5 menit)
- [ ] Check stale time (2 menit)

### 5. Security
- [ ] RLS policies tested
  - [ ] Admin Unit tidak bisa create/update/delete
  - [ ] Admin Unit hanya bisa dismiss pengumuman sendiri
  - [ ] Admin Pusat bisa full CRUD
- [ ] SQL injection prevention
- [ ] XSS prevention (text sanitization)

---

## 🚀 Deployment Steps

### Step 1: Commit Changes
```bash
# Review changes
git status

# Add all files
git add .

# Commit with message
git commit -F COMMIT_MESSAGE_PENGUMUMAN.txt

# Or manual commit
git commit -m "feat: add announcement system for admin pusat"
```

### Step 2: Push to Repository
```bash
# Push to main/master
git push origin main

# Or push to feature branch first
git checkout -b feature/announcement-system
git push origin feature/announcement-system
```

### Step 3: Verify Deployment
- [ ] Check Vercel/deployment logs
- [ ] Verify build success
- [ ] Check deployment URL

### Step 4: Database Verification (Production)
```bash
# Connect to production database
# Verify tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('announcements', 'announcement_dismissals');

# Verify function
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name = 'get_active_announcements';

# Verify RLS enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('announcements', 'announcement_dismissals');
```

---

## 🧪 Post-Deployment Testing (Production)

### 1. Smoke Tests
- [ ] Open production URL
- [ ] Login sebagai Admin Pusat
- [ ] Buka menu "Pengumuman"
- [ ] Buat 1 pengumuman test
- [ ] Verifikasi muncul di dashboard
- [ ] Hapus pengumuman test

### 2. Admin Pusat Flow
- [ ] Buat pengumuman "Welcome"
  ```
  Judul: Selamat Datang di Sistem SIMPEL
  Tipe: Info
  Prioritas: 10
  Pesan: Sistem Manajemen Pegawai Lavotas sudah aktif.
  ```
- [ ] Verifikasi pengumuman tersimpan
- [ ] Verifikasi muncul di dashboard

### 3. Admin Unit Flow
- [ ] Login sebagai Admin Unit (different account)
- [ ] Buka Dashboard
- [ ] Verifikasi pengumuman "Welcome" muncul
- [ ] Tutup pengumuman
- [ ] Refresh - verifikasi tidak muncul lagi

### 4. Multiple Users Test
- [ ] Login sebagai Admin Unit 1
- [ ] Dismiss pengumuman
- [ ] Login sebagai Admin Unit 2
- [ ] Verifikasi pengumuman masih muncul (belum di-dismiss)

### 5. Priority Test
- [ ] Buat 3 pengumuman dengan prioritas berbeda:
  - Prioritas 100 (Penting)
  - Prioritas 50 (Info)
  - Prioritas 10 (Info)
- [ ] Verifikasi urutan di dashboard (100 → 50 → 10)

### 6. Expiration Test
- [ ] Buat pengumuman dengan expires_at = besok
- [ ] Verifikasi muncul di dashboard
- [ ] (Tunggu sampai besok atau ubah expires_at ke kemarin)
- [ ] Verifikasi tidak muncul lagi

---

## 📊 Monitoring

### 1. Database Monitoring
```sql
-- Check total announcements
SELECT COUNT(*) FROM announcements;

-- Check active announcements
SELECT COUNT(*) FROM announcements 
WHERE is_active = true 
AND (expires_at IS NULL OR expires_at > now());

-- Check dismissals
SELECT COUNT(*) FROM announcement_dismissals;

-- Check most dismissed announcement
SELECT 
  a.title,
  COUNT(ad.id) as dismiss_count
FROM announcements a
LEFT JOIN announcement_dismissals ad ON ad.announcement_id = a.id
GROUP BY a.id, a.title
ORDER BY dismiss_count DESC
LIMIT 10;
```

### 2. Performance Monitoring
- [ ] Check query execution time
- [ ] Check API response time
- [ ] Check frontend render time
- [ ] Monitor auto-refresh behavior

### 3. Error Monitoring
- [ ] Check Sentry/error logs
- [ ] Check browser console errors
- [ ] Check Supabase logs
- [ ] Monitor failed queries

---

## 🐛 Rollback Plan

### If Issues Found:

#### Option 1: Disable Feature (Quick)
```sql
-- Deactivate all announcements
UPDATE announcements SET is_active = false;
```

#### Option 2: Remove from UI (Medium)
```typescript
// Comment out in Dashboard.tsx
// <AnnouncementBanner />

// Remove from sidebar
// { label: 'Pengumuman', href: '/announcements', ... }
```

#### Option 3: Rollback Migration (Last Resort)
```sql
-- Drop tables
DROP TABLE IF EXISTS announcement_dismissals CASCADE;
DROP TABLE IF EXISTS announcements CASCADE;

-- Drop function
DROP FUNCTION IF EXISTS get_active_announcements();
```

---

## 📝 Post-Deployment Tasks

### 1. Documentation
- [ ] Update README.md dengan fitur baru
- [ ] Update user manual/guide
- [ ] Create video tutorial (optional)

### 2. Communication
- [ ] Inform Admin Pusat tentang fitur baru
- [ ] Send email/notification ke semua admin
- [ ] Create announcement di sistem (meta!)

### 3. Training
- [ ] Train Admin Pusat cara menggunakan
- [ ] Prepare FAQ
- [ ] Setup support channel

### 4. Analytics Setup
- [ ] Track announcement creation
- [ ] Track dismissal rate
- [ ] Track engagement metrics

---

## 🎯 Success Criteria

Deployment dianggap sukses jika:

- ✅ Migration applied tanpa error
- ✅ No TypeScript/build errors
- ✅ Admin Pusat bisa create/edit/delete pengumuman
- ✅ Admin Unit bisa view & dismiss pengumuman
- ✅ Banner muncul dengan benar di dashboard
- ✅ Dismiss functionality bekerja
- ✅ Priority ordering bekerja
- ✅ Expiration bekerja
- ✅ RLS policies enforce dengan benar
- ✅ No performance degradation
- ✅ No security issues

---

## 📞 Support

### If Issues Occur:

1. **Check Logs**
   - Browser console
   - Supabase logs
   - Vercel deployment logs

2. **Common Issues**
   - Migration not applied → Re-run `npx supabase db push`
   - RLS blocking queries → Check policies
   - Banner not showing → Check `is_active` and `expires_at`
   - Dismiss not working → Check `announcement_dismissals` table

3. **Contact**
   - Developer team
   - Database admin
   - DevOps team

---

## ✅ Final Checklist

Before marking as complete:

- [ ] All pre-deployment checks passed
- [ ] Deployment successful
- [ ] Post-deployment tests passed
- [ ] Monitoring setup
- [ ] Documentation updated
- [ ] Team informed
- [ ] Rollback plan ready
- [ ] Success criteria met

---

**Deployment Status**: ⏳ Pending

**Deployed By**: _________________

**Deployment Date**: _________________

**Production URL**: _________________

**Notes**: _________________

---

**Sign-off**:

- [ ] Developer: _________________
- [ ] QA: _________________
- [ ] Product Owner: _________________
