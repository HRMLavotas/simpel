# Manual Testing Quick Guide - Employee Form UX Improvements

## 🎯 Purpose
This guide helps you quickly test all the new features in the Employee Form to ensure everything works correctly.

## ⚡ Quick Test (5 minutes)

### Test 1: Rank Change Flow
1. Open Employees page
2. Click "Edit" on any employee with a rank
3. Change "Golongan/Pangkat" to a different value
4. ✅ **Check:** Warning appears below the field
5. Click "Riwayat" tab
6. ✅ **Check:** New rank history entry is visible
7. Click "Simpan Perubahan"
8. ✅ **Check:** Green toast notification appears for 3 seconds

### Test 2: Position Change Flow
1. Edit the same or different employee
2. Change "Nama Jabatan" to a different value
3. ✅ **Check:** Warning appears below the field
4. Click "Riwayat" tab
5. ✅ **Check:** New position history entry is visible
6. Click "Simpan Perubahan"
7. ✅ **Check:** Green toast notification appears

### Test 3: Department Change Flow (Admin Only)
1. Login as Admin_Pusat
2. Edit an employee
3. Change "Unit Kerja" to a different department
4. ✅ **Check:** Warning appears below the field
5. Click "Riwayat" tab
6. ✅ **Check:** New mutation history entry is visible
7. Click "Simpan Perubahan"
8. ✅ **Check:** Green toast notification appears

### Test 4: Tab Navigation
1. Edit an employee
2. Make changes in "Data Utama" tab
3. Click "Riwayat" tab
4. ✅ **Check:** History sections are visible
5. Click "Keterangan" tab
6. ✅ **Check:** Notes sections are visible
7. Click back to "Data Utama"
8. ✅ **Check:** Your changes are still there

## 📋 Expected Warnings

When you change these fields, you should see these warnings:

| Field Changed | Warning Message |
|---------------|-----------------|
| Golongan/Pangkat | ⚠️ Perubahan pangkat akan otomatis menambahkan riwayat kenaikan pangkat |
| Nama Jabatan | ⚠️ Perubahan jabatan akan otomatis menambahkan riwayat jabatan |
| Unit Kerja | ⚠️ Perubahan unit kerja akan otomatis menambahkan riwayat mutasi |

## 🎉 Expected Toast Notifications

After saving, you should see these green notifications:

| Field Changed | Toast Message |
|---------------|---------------|
| Golongan/Pangkat | ✅ Riwayat Kenaikan Pangkat otomatis ditambahkan |
| Nama Jabatan | ✅ Riwayat Jabatan otomatis ditambahkan |
| Unit Kerja | ✅ Riwayat Mutasi otomatis ditambahkan |

## 🔍 What to Check in History Entries

When you view auto-generated history entries in the "Riwayat" tab:

1. **Date:** Should be today's date (YYYY-MM-DD format)
2. **Old Value:** Should show the previous value
3. **New Value:** Should show the new value you entered
4. **Keterangan:** Should say:
   - "Perubahan data - Auto-generated" (for rank and position)
   - "Mutasi - Auto-generated" (for department)

## ❌ Common Issues to Report

If you encounter any of these, please report:

1. ❌ Warning doesn't appear when changing a field
2. ❌ Toast notification doesn't appear after saving
3. ❌ History entry is not created
4. ❌ Duplicate history entries are created
5. ❌ Form data is lost when switching tabs
6. ❌ Date is incorrect in history entries
7. ❌ Keterangan text is incorrect

## 🧪 Advanced Testing (Optional)

### Test Duplicate Prevention
1. Edit an employee with rank "III/a"
2. Change to "III/b" → Save
3. Edit again, change to "III/c" → Save
4. Edit again, change back to "III/b" → Save
5. ✅ **Check:** Only 3 history entries exist (no duplicates)

### Test Multiple Changes
1. Edit an employee
2. Change rank, position, AND department
3. ✅ **Check:** All 3 warnings appear
4. Click "Riwayat" tab
5. ✅ **Check:** All 3 history entries are visible
6. Save
7. ✅ **Check:** All 3 toast notifications appear

### Test Non-Admin User
1. Login as a non-Admin_Pusat user
2. Edit an employee
3. ✅ **Check:** Department field is disabled
4. ✅ **Check:** Only your department is shown

## 📝 Testing Checklist

Use this checklist to track your testing:

- [ ] Rank change shows warning
- [ ] Rank change creates history entry
- [ ] Rank change shows toast notification
- [ ] Position change shows warning
- [ ] Position change creates history entry
- [ ] Position change shows toast notification
- [ ] Department change shows warning (Admin only)
- [ ] Department change creates history entry (Admin only)
- [ ] Department change shows toast notification (Admin only)
- [ ] Tab switching preserves form data
- [ ] History entries have correct date
- [ ] History entries have correct keterangan
- [ ] Duplicate entries are prevented
- [ ] Non-admin users cannot change department
- [ ] All changes are saved to database

## 🐛 How to Report Issues

If you find any issues, please provide:

1. **What you did:** Step-by-step actions
2. **What you expected:** What should have happened
3. **What actually happened:** What went wrong
4. **Screenshots:** If possible
5. **User role:** Admin_Pusat or regular user

## ✅ Success Criteria

The feature is working correctly if:

1. ✅ All warnings appear when changing fields
2. ✅ All history entries are created automatically
3. ✅ All toast notifications appear after saving
4. ✅ No duplicate history entries are created
5. ✅ Tab switching preserves form data
6. ✅ All changes are saved to the database

## 📞 Need Help?

If you have questions or encounter issues:

1. Check the detailed testing guide: `task-9-e2e-testing.md`
2. Check the verification summary: `task-9-verification-summary.md`
3. Ask for assistance with specific issues

---

**Happy Testing! 🚀**
