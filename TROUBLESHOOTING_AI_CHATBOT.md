# 🔧 Troubleshooting: AI Chatbot

## 🐛 Common Issues & Solutions

### Issue 1: AI Tidak Bisa Mengakses Data Pegawai

**Symptoms:**
- AI menjawab "belum memiliki informasi detail"
- AI tidak menampilkan data pegawai
- AI tidak bisa menjawab pertanyaan tentang pegawai spesifik

**Possible Causes:**
1. Data tidak di-fetch dari database
2. RLS policies blocking query
3. User tidak authenticated
4. Edge Function error

**Solutions:**

#### Step 1: Check Edge Function Logs
```bash
# Via Supabase Dashboard
1. Go to: https://supabase.com/dashboard/project/mauyygrbdopmpdpnwzra/functions
2. Click on "ai-chat" function
3. Click "Logs" tab
4. Look for console.log output
```

**What to look for:**
```
Query analysis: {
  queryLower: "ali hamzah dinillah pangkatnya apa",
  needsEmployeeData: true,
  ...
}

Employee query result: {
  count: 150,  // Should be > 0
  error: null,
  sample: { full_name: "...", rank: "..." }
}

Statistics calculated: {
  total: 150,
  pns: 120,
  ...
}
```

#### Step 2: Test Database Query Directly
```sql
-- Test if you can query employees
SELECT 
  id,
  full_name,
  nip,
  asn_status,
  rank,
  rank_group,
  position_type,
  position_name,
  department
FROM employees
WHERE is_active = true
AND full_name ILIKE '%Ali Hamzah%'
LIMIT 10;
```

#### Step 3: Check RLS Policies
```sql
-- Check if RLS is blocking
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'employees';

-- Should show: rowsecurity = true

-- Check policies
SELECT * FROM pg_policies 
WHERE tablename = 'employees';
```

#### Step 4: Verify User Authentication
```javascript
// In browser console
const { data: { session } } = await supabase.auth.getSession()
console.log('Session:', session)
console.log('User:', session?.user)
```

#### Step 5: Test Edge Function Directly
```bash
# Get your JWT token from browser
# Open DevTools > Application > Local Storage > supabase.auth.token

# Test with curl
curl -X POST \
  "https://mauyygrbdopmpdpnwzra.supabase.co/functions/v1/ai-chat" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Berapa jumlah pegawai PNS?",
    "history": []
  }'
```

---

### Issue 2: AI Response Slow

**Symptoms:**
- AI takes >10 seconds to respond
- Loading indicator shows for long time

**Possible Causes:**
1. Large dataset being fetched
2. DeepSeek API latency
3. Network issues
4. Database query slow

**Solutions:**

#### Optimize Data Fetching
```typescript
// Already implemented: limit to 200 employees
.limit(200)

// If still slow, reduce further
.limit(100)
```

#### Check Database Performance
```sql
-- Check query execution time
EXPLAIN ANALYZE
SELECT * FROM employees
WHERE is_active = true
LIMIT 200;
```

#### Monitor DeepSeek API
```javascript
// Check usage stats in response
{
  "usage": {
    "prompt_tokens": 850,
    "completion_tokens": 400,
    "total_tokens": 1250
  }
}
```

---

### Issue 3: AI Gives Wrong Information

**Symptoms:**
- Statistics don't match dashboard
- Employee data incorrect
- Counts are wrong

**Possible Causes:**
1. Data filtering issue (department)
2. is_active filter
3. Stale data
4. AI hallucination

**Solutions:**

#### Verify Data in Database
```sql
-- Check total employees
SELECT COUNT(*) FROM employees WHERE is_active = true;

-- Check by department
SELECT department, COUNT(*) 
FROM employees 
WHERE is_active = true 
GROUP BY department;

-- Check by ASN status
SELECT asn_status, COUNT(*) 
FROM employees 
WHERE is_active = true 
GROUP BY asn_status;
```

#### Compare with Dashboard
1. Open Dashboard
2. Check statistics
3. Compare with AI response
4. If different, check data filtering

#### Check AI Context
Look at Edge Function logs for "Statistics calculated" to see what data AI received.

---

### Issue 4: "Unauthorized" Error

**Symptoms:**
- 401 error in console
- "Invalid token" message
- Cannot send message

**Possible Causes:**
1. User not logged in
2. Session expired
3. JWT token invalid

**Solutions:**

#### Refresh Session
```javascript
// In browser console
const { data, error } = await supabase.auth.refreshSession()
console.log('Refreshed:', data)
```

#### Re-login
1. Logout from app
2. Login again
3. Try AI chat again

---

### Issue 5: Edge Function Not Found

**Symptoms:**
- 404 error
- "Function not found"

**Possible Causes:**
1. Function not deployed
2. Wrong project ref
3. Function name mismatch

**Solutions:**

#### Verify Deployment
```bash
# Check if function exists
curl https://mauyygrbdopmpdpnwzra.supabase.co/functions/v1/ai-chat

# Should return 400 (not 404)
```

#### Redeploy Function
```bash
$env:SUPABASE_ACCESS_TOKEN="YOUR_SUPABASE_ACCESS_TOKEN"
npx supabase functions deploy ai-chat
```

---

### Issue 6: DeepSeek API Error

**Symptoms:**
- "DeepSeek API error" message
- 500 error from Edge Function

**Possible Causes:**
1. API key invalid
2. API key not set
3. DeepSeek service down
4. Rate limit exceeded

**Solutions:**

#### Verify API Key
```bash
# Check if secret is set
$env:SUPABASE_ACCESS_TOKEN="YOUR_SUPABASE_ACCESS_TOKEN"
npx supabase secrets list
```

#### Test API Key Directly
```bash
curl https://api.deepseek.com/v1/models \
  -H "Authorization: Bearer sk-7e89179748f24970b6e0869cc3fa03c7"
```

#### Reset API Key
```bash
# Set new API key
npx supabase secrets set DEEPSEEK_API_KEY=sk-7e89179748f24970b6e0869cc3fa03c7
```

---

## 🔍 Debugging Checklist

### Before Asking for Help

- [ ] Check browser console for errors
- [ ] Check Edge Function logs in Dashboard
- [ ] Test database query directly
- [ ] Verify user is logged in
- [ ] Check RLS policies
- [ ] Test Edge Function with curl
- [ ] Verify DeepSeek API key
- [ ] Check network tab in DevTools

### Information to Provide

When reporting an issue, include:

1. **Error Message**: Exact error from console
2. **Steps to Reproduce**: What you did
3. **Expected Behavior**: What should happen
4. **Actual Behavior**: What actually happened
5. **User Role**: Admin Pusat/Unit/Pimpinan
6. **Browser**: Chrome/Firefox/Safari
7. **Logs**: Edge Function logs if available

---

## 📊 Monitoring

### Key Metrics to Watch

1. **Response Time**
   - Target: <5 seconds
   - Alert if: >10 seconds

2. **Error Rate**
   - Target: <1%
   - Alert if: >5%

3. **Token Usage**
   - Average: 1000-1500 tokens/query
   - Alert if: >3000 tokens

4. **Data Fetch Success**
   - Target: 100%
   - Alert if: <95%

### How to Monitor

#### Via Supabase Dashboard
1. Go to Functions > ai-chat
2. Check "Invocations" graph
3. Check "Errors" graph
4. Review logs regularly

#### Via Application
1. Track usage stats in UI
2. Monitor response times
3. Collect user feedback

---

## 🚀 Performance Optimization

### If AI is Slow

1. **Reduce Data Limit**
   ```typescript
   .limit(100) // Instead of 200
   ```

2. **Add Indexes**
   ```sql
   CREATE INDEX idx_employees_active_dept 
   ON employees(is_active, department);
   ```

3. **Cache Frequently Asked Questions**
   - Implement caching layer
   - Store common queries

4. **Optimize System Prompt**
   - Reduce context size
   - Remove unnecessary data

---

## 🎯 Quick Fixes

### AI Can't Access Data
```bash
# 1. Check logs
# 2. Verify RLS policies
# 3. Test database query
# 4. Redeploy function
```

### Slow Response
```bash
# 1. Reduce data limit
# 2. Add database indexes
# 3. Check DeepSeek API latency
```

### Wrong Information
```bash
# 1. Verify data in database
# 2. Check data filtering
# 3. Compare with dashboard
# 4. Review AI context in logs
```

---

## 📞 Getting Help

### Resources
- **Documentation**: FITUR_AI_CHATBOT.md
- **Quick Start**: QUICK_START_AI_CHATBOT.md
- **Deployment**: DEPLOY_AI_CHATBOT_MANUAL.md

### Support Channels
1. Check Edge Function logs first
2. Review this troubleshooting guide
3. Test with provided SQL queries
4. Contact development team with details

---

**Last Updated**: 7 Mei 2026  
**Version**: 1.0.0
