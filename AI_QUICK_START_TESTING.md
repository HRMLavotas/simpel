# 🚀 Quick Start: Testing AI Function Calling

## ⚡ TL;DR

AI Function Calling is **DEPLOYED**. Test it now with these queries:

1. `Cari pegawai Ignatius` → Should find Ignatius Satria Dharmadhyaksa
2. `Berapa jumlah PNS?` → Should return 1,700
3. `Ada berapa Instruktur Ahli Pertama di BBPVP Bekasi?` → Should return 48

---

## 🎯 How to Test

### Option 1: Via Frontend (Recommended)
1. Login to SIMPEL: https://your-app-url.vercel.app
2. Navigate to AI Chat
3. Try the test queries below
4. Verify responses match expected results

### Option 2: Via Supabase Dashboard
1. Go to: https://supabase.com/dashboard/project/mauyygrbdopmpdpnwzra/functions
2. Click on `ai-chat` function
3. View logs to see function calls
4. Monitor for errors

### Option 3: Via API (Advanced)
```bash
curl -X POST https://mauyygrbdopmpdpnwzra.supabase.co/functions/v1/ai-chat \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Berapa jumlah pegawai PNS?",
    "history": []
  }'
```

---

## 🧪 10 Essential Test Queries

### 1. Name Search
**Query:** `Cari pegawai dengan nama Ignatius`

**Expected:**
- Finds: Ignatius Satria Dharmadhyaksa
- Unit: Setditjen Binalavotas
- Jabatan: (should show position)

---

### 2. Statistics
**Query:** `Berapa jumlah pegawai PNS?`

**Expected:**
- Answer: 1,700 PNS
- Shows breakdown of other statuses

---

### 3. Position Count
**Query:** `Ada berapa orang Instruktur Ahli Pertama di BBPVP Bekasi?`

**Expected:**
- Answer: 48 employees
- Clear, formatted response

---

### 4. Context Awareness
**Query 1:** `Cari pegawai Ignatius`  
**Query 2:** `Dia dari unit kerja apa?`

**Expected:**
- Second query remembers first query
- Answers: Setditjen Binalavotas

---

### 5. Department Comparison
**Query:** `Bandingkan BBPVP Bekasi dengan BBPVP Bandung`

**Expected:**
- Comparison table
- Shows totals, PNS, CPNS, PPPK for both

---

### 6. Retirement Forecast
**Query:** `Siapa saja pegawai yang akan pensiun 3 tahun ke depan?`

**Expected:**
- List of employees
- Retirement dates shown

---

### 7. Position Breakdown
**Query:** `Bagaimana distribusi jabatan di BBPVP Bekasi?`

**Expected:**
- Breakdown by position type
- Count per position

---

### 8. Newest Employees
**Query:** `Siapa 10 pegawai terbaru?`

**Expected:**
- 10 employees listed
- Sorted by join date (newest first)

---

### 9. List Departments
**Query:** `Berapa unit kerja yang ada?`

**Expected:**
- List of all departments
- Employee count per department

---

### 10. Employee Summary
**Query:** `Detail lengkap pegawai Ignatius`

**Expected:**
- Comprehensive info
- Personal, position, rank, contact details

---

## ✅ What to Check

### Response Quality
- [ ] Answer is accurate
- [ ] Data matches database
- [ ] No hallucinated information
- [ ] Formatted nicely (tables, bullets, emoji)
- [ ] Professional and friendly tone

### Functionality
- [ ] Correct function called (check logs)
- [ ] Parameters passed correctly
- [ ] Results returned successfully
- [ ] AI formats response properly
- [ ] Context maintained across queries

### Performance
- [ ] Response time < 3 seconds
- [ ] No timeout errors
- [ ] No SQL errors
- [ ] Logs show successful execution

---

## 🐛 Common Issues & Solutions

### Issue: "AI tidak memanggil function"
**Symptoms:** AI responds without calling any function

**Check:**
1. Look at Edge Function logs
2. Verify tool definitions in code
3. Check if query is clear enough

**Solution:** Make query more specific or improve tool descriptions

---

### Issue: "Function salah dipanggil"
**Symptoms:** AI calls wrong function for query

**Check:**
1. Review tool descriptions
2. Check if query is ambiguous
3. Look at AI's reasoning in logs

**Solution:** Improve tool descriptions to be more distinct

---

### Issue: "Error saat eksekusi function"
**Symptoms:** Tool call succeeds but RPC fails

**Check:**
1. Verify function exists in database
2. Check parameter mapping
3. Test RPC directly in SQL editor

**Solution:** Fix parameter mapping or RLS policies

---

### Issue: "Response terlalu lambat"
**Symptoms:** Takes > 5 seconds to respond

**Check:**
1. Check database query performance
2. Look for slow functions in logs
3. Verify indexes exist

**Solution:** Optimize slow queries or add indexes

---

## 📊 Quick Verification

Run these queries and verify results:

```sql
-- 1. Verify total employees
SELECT COUNT(*) FROM employees WHERE is_active = true;
-- Expected: 3,327

-- 2. Verify PNS count
SELECT COUNT(*) FROM employees WHERE is_active = true AND asn_status = 'PNS';
-- Expected: 1,700

-- 3. Verify Instruktur count at BBPVP Bekasi
SELECT ai_count_employees_by_position_and_department('Instruktur Ahli Pertama', 'BBPVP Bekasi');
-- Expected: 48

-- 4. Verify Ignatius exists
SELECT * FROM ai_search_employee_by_name('Ignatius');
-- Expected: Should find Ignatius Satria Dharmadhyaksa
```

---

## 🎯 Success Criteria

### ✅ Test Passes If:
- All 10 queries return correct results
- Response time < 3 seconds
- No errors in logs
- Context is maintained
- Data is accurate (no hallucinations)

### ❌ Test Fails If:
- Wrong data returned
- Function not called
- Errors in execution
- Response time > 5 seconds
- AI fabricates data

---

## 📝 Reporting Issues

If you find issues, report with:

1. **Query Used:** Exact query text
2. **Expected Result:** What should happen
3. **Actual Result:** What actually happened
4. **Logs:** Copy from Supabase Dashboard
5. **Timestamp:** When it occurred

**Example:**
```
Query: "Berapa jumlah PNS?"
Expected: 1,700
Actual: 1,500
Logs: [paste logs here]
Timestamp: 2026-05-07 14:30:00
```

---

## 🚀 Next Steps After Testing

### If All Tests Pass ✅
1. Mark as production-ready
2. Monitor usage patterns
3. Gather user feedback
4. Plan enhancements

### If Tests Fail ❌
1. Document issues
2. Fix critical bugs first
3. Re-test after fixes
4. Iterate until stable

---

## 📚 Additional Resources

- **Full Testing Checklist:** `AI_TESTING_CHECKLIST.md`
- **Deployment Details:** `AI_FUNCTION_CALLING_DEPLOYMENT.md`
- **Architecture Overview:** `AI_CHATBOT_ARCHITECTURE.md`
- **Function Reference:** `AI_BACKEND_FUNCTIONS_GUIDE.md`
- **Complete Summary:** `AI_FUNCTION_CALLING_SUMMARY.md`

---

## 💡 Pro Tips

1. **Test in order** - Start with simple queries, then complex
2. **Check logs** - Always verify function calls in logs
3. **Use real data** - Test with actual employee names
4. **Test context** - Try follow-up questions
5. **Monitor performance** - Track response times

---

## ⚡ Quick Commands

### View Logs
```bash
npx supabase functions logs ai-chat --project-ref mauyygrbdopmpdpnwzra
```

### Redeploy if Needed
```bash
$env:SUPABASE_ACCESS_TOKEN="YOUR_SUPABASE_ACCESS_TOKEN"
npx supabase functions deploy ai-chat --project-ref YOUR_PROJECT_REF
```

### Test RPC Directly
```sql
-- In Supabase SQL Editor
SELECT ai_get_employee_statistics(NULL);
SELECT ai_search_employee_by_name('Ignatius');
SELECT ai_count_employees_by_position_and_department('Instruktur Ahli Pertama', 'BBPVP Bekasi');
```

---

**Ready to test?** Start with Query #1 and work your way through! 🚀

**Questions?** Check the documentation files listed above.

**Issues?** Report with details and we'll fix them quickly.

---

**Status:** ✅ DEPLOYED - START TESTING NOW!  
**Date:** May 7, 2026
