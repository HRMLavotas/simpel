# Usulan Ujikom - Quick Start Guide

## 🚀 Quick Deployment (5 Minutes)

### Step 1: Apply Migrations (2 min)

Open Supabase SQL Editor and run these in order:

**Migration 1: Create Tables**
```bash
# File: supabase/migrations/20260602_create_usulan_ujikom_tables.sql
# Copy and paste entire file content into SQL Editor
# Click "Run"
```

**Migration 2: Create RLS Policies**
```bash
# File: supabase/migrations/20260602_create_usulan_ujikom_rls.sql
# Copy and paste entire file content into SQL Editor
# Click "Run"
```

**Migration 3: Create Storage**
```bash
# File: supabase/migrations/20260602_create_usulan_ujikom_storage.sql
# Copy and paste entire file content into SQL Editor
# Click "Run"
```

### Step 2: Verify Setup (1 min)

Run this verification query:

```sql
-- Check tables exist
SELECT COUNT(*) as table_count FROM information_schema.tables 
WHERE table_name IN ('usulan_ujikom', 'usulan_ujikom_status_history');
-- Should return 2

-- Check storage bucket
SELECT * FROM storage.buckets WHERE name = 'usulan-ujikom';
-- Should return 1 row
```

### Step 3: Test Application (2 min)

1. **Restart your dev server** (if running)
   ```bash
   npm run dev
   ```

2. **Login as Admin Unit**
   - Look for "Usulan Ujikom" in menu
   - Click to access page

3. **Login as Admin Pusat**
   - Look for "Menu Usulan Ujikom" in menu
   - Click to access page

### ✅ Done!

If you can see both menu items and access the pages, you're ready to go!

## 📖 Basic Usage

### For Admin Unit

1. **Create Usulan**
   - Click "Buat Usulan Baru"
   - Select employee and target position
   - Upload surat pengantar
   - Add document link
   - Click "Simpan Draft"

2. **Submit Usulan**
   - Find your draft usulan
   - Click "Ajukan"
   - System checks formasi availability
   - Goes to "Diajukan" or "Daftar Tunggu"

3. **Track Status**
   - View status badges
   - Check status history
   - Receive notifications on changes

### For Admin Pusat

1. **View All Usulan**
   - See usulan from all departments
   - Filter by status, department, etc.
   - Sort by various criteria

2. **Process Usulan**
   - Click "Lihat Detail"
   - Review documents
   - Click "Ubah Status"
   - Select next status
   - Add notes/feedback
   - Submit

3. **Monitor Progress**
   - Dashboard shows statistics
   - Track counts by status
   - View department breakdown

## 🎯 Common Scenarios

### Scenario 1: Formasi Available
```
Admin Unit creates usulan
→ System checks formasi
→ Formasi available (3/5 filled)
→ Status: "Diajukan"
→ Admin Pusat processes
```

### Scenario 2: Formasi Full
```
Admin Unit creates usulan
→ System checks formasi
→ Formasi full (5/5 filled)
→ Status: "Waiting_List" (queue position: 1)
→ Waits for promotion
```

### Scenario 3: Auto-Promotion
```
Usulan A is "Lulus_Ujikom"
→ Admin Pusat changes to "Tidak_Lulus"
→ Formasi becomes available (4/5)
→ System auto-promotes oldest waiting usulan
→ Waiting usulan → "Diajukan"
→ Notification sent
```

## 🔧 Troubleshooting

**Menu items not appearing?**
- Check your role (admin_unit or admin_pusat)
- Clear browser cache
- Restart dev server

**Cannot create usulan?**
- Verify migrations applied
- Check browser console for errors
- Ensure employee and position selected

**File upload fails?**
- Check file size (must be < 5MB)
- Verify format (PDF, JPG, PNG only)
- Check storage bucket exists

**Status change not working?**
- Verify valid status transition
- Check cancellation reason (min 10 chars)
- Ensure admin_pusat role

## 📞 Need Help?

Check detailed documentation in:
- `USULAN_UJIKOM_IMPLEMENTATION.md` - Full technical docs
- Browser console - For client errors
- Supabase logs - For backend errors

## 🎉 Next Steps

After basic setup works:

1. Test complete workflow end-to-end
2. Create sample usulan with real data
3. Test notification system
4. Try edge cases (full formasi, cancellations)
5. Test on mobile devices

---

**Ready to deploy?** All features are production-ready! 🚀
