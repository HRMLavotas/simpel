# 🚀 Manual Deployment: AI Chatbot Edge Function

## ⚠️ Issue dengan CLI Deployment

Saat ini ada masalah dengan Supabase CLI deployment (401 Unauthorized). Berikut adalah cara manual deployment melalui Supabase Dashboard.

---

## 📋 Option 1: Deploy via Supabase Dashboard

### Step 1: Buka Supabase Dashboard
1. Go to: https://supabase.com/dashboard/project/mauyygrbdopmpdpnwzra
2. Login dengan akun Anda
3. Pilih project: **SIMPEL Production**

### Step 2: Navigate to Edge Functions
1. Di sidebar kiri, klik **Edge Functions**
2. Klik tombol **Create a new function**
3. Function name: `ai-chat`

### Step 3: Copy Code
Copy seluruh code dari file: `supabase/functions/ai-chat/index.ts`

```typescript
// File: supabase/functions/ai-chat/index.ts
// Copy seluruh isi file ini ke Dashboard
```

### Step 4: Set Environment Variables
1. Di Dashboard, klik tab **Settings** untuk function `ai-chat`
2. Add secret:
   - Key: `DEEPSEEK_API_KEY`
   - Value: `sk-7e89179748f24970b6e0869cc3fa03c7`
3. Save

### Step 5: Deploy
1. Klik tombol **Deploy**
2. Wait for deployment to complete
3. Verify function URL: `https://mauyygrbdopmpdpnwzra.supabase.co/functions/v1/ai-chat`

---

## 📋 Option 2: Deploy via API (Alternative)

Jika Dashboard tidak tersedia, gunakan Supabase Management API:

### Step 1: Get Access Token
```bash
# Your access token
SUPABASE_ACCESS_TOKEN="sbp_22ba3f60a354b232096872aabe63e66c1a8ebdd5"
PROJECT_REF="mauyygrbdopmpdpnwzra"
```

### Step 2: Create Function via API
```bash
curl -X POST \
  "https://api.supabase.com/v1/projects/${PROJECT_REF}/functions" \
  -H "Authorization: Bearer ${SUPABASE_ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "slug": "ai-chat",
    "name": "ai-chat",
    "verify_jwt": false
  }'
```

### Step 3: Upload Function Code
```bash
# Encode file to base64
BASE64_CODE=$(cat supabase/functions/ai-chat/index.ts | base64)

curl -X PUT \
  "https://api.supabase.com/v1/projects/${PROJECT_REF}/functions/ai-chat" \
  -H "Authorization: Bearer ${SUPABASE_ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d "{
    \"body\": \"${BASE64_CODE}\",
    \"verify_jwt\": false
  }"
```

### Step 4: Set Secrets
```bash
curl -X POST \
  "https://api.supabase.com/v1/projects/${PROJECT_REF}/secrets" \
  -H "Authorization: Bearer ${SUPABASE_ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "secrets": [
      {
        "name": "DEEPSEEK_API_KEY",
        "value": "sk-7e89179748f24970b6e0869cc3fa03c7"
      }
    ]
  }'
```

---

## 📋 Option 3: Deploy via GitHub Actions (Recommended for Production)

### Step 1: Create GitHub Workflow

Create file: `.github/workflows/deploy-edge-functions.yml`

```yaml
name: Deploy Edge Functions

on:
  push:
    branches:
      - main
    paths:
      - 'supabase/functions/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - uses: supabase/setup-cli@v1
        with:
          version: latest

      - name: Deploy Edge Functions
        run: |
          supabase functions deploy ai-chat \
            --project-ref ${{ secrets.SUPABASE_PROJECT_REF }} \
            --no-verify-jwt
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
```

### Step 2: Add GitHub Secrets
1. Go to GitHub repository settings
2. Secrets and variables > Actions
3. Add secrets:
   - `SUPABASE_ACCESS_TOKEN`: `sbp_22ba3f60a354b232096872aabe63e66c1a8ebdd5`
   - `SUPABASE_PROJECT_REF`: `mauyygrbdopmpdpnwzra`

### Step 3: Push to GitHub
```bash
git add .
git commit -m "feat: add AI chatbot edge function"
git push origin main
```

GitHub Actions will automatically deploy the function.

---

## ✅ Verification

### Test Edge Function
```bash
# Get auth token from your app
AUTH_TOKEN="your-jwt-token-here"

# Test function
curl -X POST \
  "https://mauyygrbdopmpdpnwzra.supabase.co/functions/v1/ai-chat" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Berapa jumlah pegawai PNS?",
    "history": []
  }'
```

### Expected Response
```json
{
  "message": "Berdasarkan data terkini...",
  "usage": {
    "prompt_tokens": 850,
    "completion_tokens": 400,
    "total_tokens": 1250
  }
}
```

---

## 🐛 Troubleshooting

### 401 Unauthorized
- Verify access token is correct
- Check if token has expired
- Try regenerating access token from Dashboard

### Function not found
- Verify function name is `ai-chat`
- Check project ref is correct
- Ensure function is deployed

### DeepSeek API error
- Verify `DEEPSEEK_API_KEY` secret is set
- Check API key is valid
- Test API key directly: https://api.deepseek.com/v1/models

### No data returned
- Check user authentication
- Verify RLS policies
- Check database connection
- Review Edge Function logs

---

## 📊 Monitor Function

### View Logs
1. Go to Supabase Dashboard
2. Edge Functions > ai-chat
3. Click **Logs** tab
4. Monitor real-time logs

### Check Invocations
1. Dashboard > Edge Functions > ai-chat
2. View invocation count
3. Check error rate
4. Monitor response time

---

## 🔄 Update Function

### Via Dashboard
1. Go to Edge Functions > ai-chat
2. Edit code
3. Click **Deploy**

### Via CLI (when fixed)
```bash
supabase functions deploy ai-chat --project-ref mauyygrbdopmpdpnwzra
```

### Via GitHub Actions
```bash
git add supabase/functions/ai-chat/index.ts
git commit -m "update: improve AI responses"
git push origin main
```

---

## 📝 Next Steps

1. ✅ Deploy Edge Function (choose one option above)
2. ✅ Set DEEPSEEK_API_KEY secret
3. ✅ Test function with curl
4. ✅ Test from frontend
5. ✅ Monitor logs
6. ✅ Optimize based on usage

---

## 🎯 Quick Deploy Checklist

- [ ] Edge Function code ready (`supabase/functions/ai-chat/index.ts`)
- [ ] DeepSeek API key ready (`sk-7e89179748f24970b6e0869cc3fa03c7`)
- [ ] Choose deployment method (Dashboard/API/GitHub Actions)
- [ ] Deploy function
- [ ] Set DEEPSEEK_API_KEY secret
- [ ] Test with curl
- [ ] Test from frontend
- [ ] Verify in Dashboard
- [ ] Monitor logs
- [ ] Done! 🎉

---

**Recommended**: Use **Option 1 (Dashboard)** for quick deployment, then setup **Option 3 (GitHub Actions)** for automated deployments.

**Status**: ⏳ Waiting for manual deployment  
**Date**: 7 Mei 2026
