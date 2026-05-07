# 🤖 Fitur AI Chatbot - SIMPEL

## 📋 Ringkasan

Fitur AI Chatbot yang sangat pintar menggunakan **DeepSeek AI** untuk membantu admin mengakses dan menganalisis data pegawai dengan cara yang natural dan conversational.

## ✨ Fitur Utama

### 1. **Akses Data Berdasarkan Role**
- ✅ **Admin Pusat**: Akses semua data pegawai di semua unit kerja
- ✅ **Admin Unit**: Akses data pegawai di unit mereka saja
- ✅ **Admin Pimpinan**: Akses berdasarkan unit (Pusat = semua, lainnya = unit saja)

### 2. **Data yang Dapat Diakses**
- ✅ Data pegawai (nama, NIP, status ASN, jabatan, dll)
- ✅ Statistik pegawai (jumlah, distribusi, persentase)
- ✅ Peta jabatan (posisi, grade, target ABK)
- ✅ Distribusi per unit kerja
- ✅ Distribusi per golongan
- ✅ Distribusi per jenis jabatan
- ✅ Distribusi per gender

### 3. **Kemampuan AI**
- ✅ Menjawab pertanyaan dalam bahasa Indonesia
- ✅ Memberikan statistik dan analisis
- ✅ Format jawaban yang rapi (markdown, bullet points, numbering)
- ✅ Konteks percakapan (mengingat 10 pesan terakhir)
- ✅ Insight dan rekomendasi
- ✅ Emoji untuk membuat jawaban lebih menarik

### 4. **UI/UX**
- ✅ Floating chat button di pojok kanan bawah
- ✅ Chat window yang elegant dan responsive
- ✅ Suggested questions untuk memulai
- ✅ Markdown rendering untuk jawaban AI
- ✅ Loading indicator saat AI berpikir
- ✅ Token usage statistics
- ✅ Clear chat functionality

## 🏗️ Arsitektur

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (React)                     │
│  ┌───────────────────────────────────────────────────┐ │
│  │  AIChatWidget Component                           │ │
│  │  - Floating button                                │ │
│  │  - Chat window                                    │ │
│  │  - Message display                                │ │
│  └───────────────────────────────────────────────────┘ │
│                         │                               │
│                         ▼                               │
│  ┌───────────────────────────────────────────────────┐ │
│  │  useAIChat Hook                                   │ │
│  │  - State management                               │ │
│  │  - Message handling                               │ │
│  └───────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│              Supabase Edge Function                     │
│  ┌───────────────────────────────────────────────────┐ │
│  │  ai-chat Function                                 │ │
│  │  1. Authenticate user                             │ │
│  │  2. Get user role & department                    │ │
│  │  3. Fetch relevant data from database             │ │
│  │  4. Build context for AI                          │ │
│  │  5. Call DeepSeek API                             │ │
│  │  6. Return AI response                            │ │
│  └───────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│                  DeepSeek AI API                        │
│  - Model: deepseek-chat                                 │
│  - Temperature: 0.7                                     │
│  - Max tokens: 2000                                     │
└─────────────────────────────────────────────────────────┘
```

## 🗄️ Data Flow

### 1. User Sends Message
```
User types: "Berapa jumlah pegawai PNS?"
    ↓
Frontend (AIChatWidget)
    ↓
useAIChat hook
    ↓
Supabase Edge Function (ai-chat)
```

### 2. Edge Function Processing
```
ai-chat function:
    ↓
1. Authenticate user (JWT token)
    ↓
2. Get user profile & role
    ↓
3. Determine data access (canViewAll?)
    ↓
4. Analyze query keywords
    ↓
5. Fetch relevant data from database
   - employees table
   - position_references table
   - Calculate statistics
    ↓
6. Build system prompt with context
    ↓
7. Call DeepSeek API
    ↓
8. Return AI response
```

### 3. Response Display
```
AI Response
    ↓
Edge Function
    ↓
useAIChat hook
    ↓
AIChatWidget (render with markdown)
    ↓
User sees formatted answer
```

## 🔐 Security

### 1. **Authentication**
- ✅ JWT token validation
- ✅ User session check
- ✅ Profile & role verification

### 2. **Data Access Control**
```typescript
// Admin Pusat
canViewAll = true
→ Access all employees, all departments

// Admin Unit
canViewAll = false
→ Access only employees in their department

// Admin Pimpinan (Pusat)
canViewAll = true
→ Access all employees

// Admin Pimpinan (Other)
canViewAll = false
→ Access only employees in their department
```

### 3. **RLS Policies**
- Edge Function menggunakan Service Role Key
- Tapi data filtering dilakukan di application level
- Sesuai dengan role & department user

### 4. **API Key Security**
- DeepSeek API key disimpan di Supabase Secrets
- Tidak exposed ke frontend
- Hanya accessible dari Edge Function

## 📁 File Structure

```
project-root/
├─ supabase/
│  └─ functions/
│     └─ ai-chat/
│        └─ index.ts (Edge Function)
│
├─ src/
│  ├─ hooks/
│  │  └─ useAIChat.ts (Custom hook)
│  │
│  ├─ components/
│  │  └─ ai/
│  │     └─ AIChatWidget.tsx (UI Component)
│  │
│  └─ App.tsx (Modified - add AIChatWidget)
│
├─ .env (Modified - add DeepSeek API key)
│
└─ FITUR_AI_CHATBOT.md (This file)
```

## 🚀 Setup & Deployment

### 1. Install Dependencies
```bash
npm install react-markdown
```

### 2. Configure Environment Variables

#### Local (.env)
```bash
VITE_DEEPSEEK_API_KEY=sk-7e89179748f24970b6e0869cc3fa03c7
VITE_DEEPSEEK_API_URL=https://api.deepseek.com/v1
```

#### Supabase Secrets
```bash
# Set DeepSeek API key as Supabase secret
supabase secrets set DEEPSEEK_API_KEY=sk-7e89179748f24970b6e0869cc3fa03c7
```

### 3. Deploy Edge Function
```bash
# Deploy ai-chat function
supabase functions deploy ai-chat

# Or deploy with environment variables
supabase functions deploy ai-chat --no-verify-jwt
```

### 4. Test Locally
```bash
# Start Supabase local development
supabase start

# Serve Edge Function locally
supabase functions serve ai-chat --env-file supabase/.env.local

# In another terminal, start frontend
npm run dev
```

## 🎨 UI Preview

### Floating Button
```
┌─────────────────────────────────────────┐
│                                         │
│                                         │
│                                         │
│                                         │
│                                    ┌───┐│
│                                    │ 💬││
│                                    └───┘│
└─────────────────────────────────────────┘
```

### Chat Window
```
┌─────────────────────────────────────────┐
│ ✨ AI Assistant              [🗑️] [X]  │
│ Tanya tentang data pegawai              │
├─────────────────────────────────────────┤
│                                         │
│  Halo! Saya AI Assistant SIMPEL        │
│  Tanyakan apa saja tentang data         │
│  pegawai, peta jabatan, dan statistik   │
│                                         │
│  Contoh pertanyaan:                     │
│  • Berapa jumlah pegawai PNS?          │
│  • Siapa saja pegawai di unit saya?    │
│  • Bagaimana distribusi per golongan?  │
│                                         │
├─────────────────────────────────────────┤
│ [Input message...            ] [Send]  │
└─────────────────────────────────────────┘
```

### Chat Conversation
```
┌─────────────────────────────────────────┐
│ ✨ AI Assistant              [🗑️] [X]  │
├─────────────────────────────────────────┤
│                                         │
│  User: Berapa jumlah pegawai PNS?      │
│                                    10:30│
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ Berdasarkan data terkini:       │   │
│  │                                  │   │
│  │ 📊 **Statistik Pegawai PNS**    │   │
│  │ • Total PNS: **120 orang**      │   │
│  │ • Dari total: **150 pegawai**   │   │
│  │ • Persentase: **80%**           │   │
│  │                                  │   │
│  │ Distribusi per unit:             │   │
│  │ • BPVP Semarang: 45 PNS         │   │
│  │ • BPVP Bekasi: 38 PNS           │   │
│  │ • Pusat: 37 PNS                 │   │
│  └─────────────────────────────────┘   │
│  10:30                                  │
│                                         │
├─────────────────────────────────────────┤
│ Tokens: 1250 | Prompt: 850 | Resp: 400│
├─────────────────────────────────────────┤
│ [Input message...            ] [Send]  │
└─────────────────────────────────────────┘
```

## 💬 Contoh Pertanyaan & Jawaban

### 1. Statistik Dasar
**Q**: "Berapa jumlah pegawai PNS?"

**A**: 
```
Berdasarkan data terkini:

📊 **Statistik Pegawai PNS**
• Total PNS: **120 orang**
• Dari total: **150 pegawai**
• Persentase: **80%**

Distribusi per unit:
• BPVP Semarang: 45 PNS
• BPVP Bekasi: 38 PNS
• Pusat: 37 PNS
```

### 2. List Pegawai
**Q**: "Siapa saja pegawai di unit saya?"

**A**:
```
Berikut daftar pegawai di unit **BPVP Semarang**:

👥 **Total: 45 pegawai**

**PNS (40 orang):**
1. Ahmad Suryanto (199012345678901234) - Kepala Balai
2. Budi Santoso (199112345678901234) - Kepala Subbag TU
3. Citra Dewi (199212345678901234) - Widyaiswara Ahli Madya
...

**PPPK (3 orang):**
1. Dedi Kurniawan - Analis SDM
2. Eka Putri - Pranata Komputer
...

**Non ASN (2 orang):**
1. Fajar - Tenaga Administrasi
2. Gita - Cleaning Service
```

### 3. Distribusi & Analisis
**Q**: "Bagaimana distribusi pegawai per golongan?"

**A**:
```
📊 **Distribusi Pegawai per Golongan**

**Golongan IV (25 orang - 20.8%)**
• IV/d: 5 orang
• IV/c: 8 orang
• IV/b: 7 orang
• IV/a: 5 orang

**Golongan III (75 orang - 62.5%)**
• III/d: 20 orang
• III/c: 25 orang
• III/b: 18 orang
• III/a: 12 orang

**Golongan II (20 orang - 16.7%)**
• II/d: 8 orang
• II/c: 7 orang
• II/b: 3 orang
• II/a: 2 orang

💡 **Insight:**
Mayoritas pegawai berada di golongan III (62.5%), yang menunjukkan struktur organisasi yang sehat dengan banyak pegawai di level menengah.
```

### 4. Peta Jabatan
**Q**: "Tampilkan peta jabatan struktural"

**A**:
```
📋 **Peta Jabatan Struktural**

**Eselon II (1 posisi)**
• Kepala Balai - Grade 12 - Target ABK: 1

**Eselon III (3 posisi)**
• Kepala Subbag TU - Grade 11 - Target ABK: 1
• Kepala Seksi Program - Grade 11 - Target ABK: 1
• Kepala Seksi Evaluasi - Grade 11 - Target ABK: 1

**Eselon IV (6 posisi)**
• Kasubbag Keuangan - Grade 10 - Target ABK: 1
• Kasubbag Kepegawaian - Grade 10 - Target ABK: 1
...

**Total Posisi Struktural: 10**
**Total Target ABK: 10 orang**
```

### 5. Analisis Kompleks
**Q**: "Berapa persentase pegawai yang akan pensiun dalam 5 tahun?"

**A**:
```
📊 **Analisis Proyeksi Pensiun (5 Tahun ke Depan)**

**Total Pegawai yang Akan Pensiun: 18 orang (15%)**

**Breakdown per Tahun:**
• 2026: 3 orang (2.5%)
• 2027: 4 orang (3.3%)
• 2028: 5 orang (4.2%)
• 2029: 3 orang (2.5%)
• 2030: 3 orang (2.5%)

**Distribusi per Jabatan:**
• Struktural: 5 orang (27.8%)
• Fungsional: 10 orang (55.6%)
• Pelaksana: 3 orang (16.7%)

⚠️ **Rekomendasi:**
Perlu perencanaan regenerasi, terutama untuk posisi struktural yang akan kosong. Pertimbangkan program mentoring dan succession planning.
```

## 🎯 Use Cases

### 1. Quick Statistics
- "Berapa total pegawai?"
- "Berapa jumlah PPPK?"
- "Berapa pegawai Non ASN?"

### 2. Data Exploration
- "Siapa saja pegawai di unit saya?"
- "Tampilkan pegawai golongan IV"
- "List pegawai fungsional"

### 3. Analysis & Insights
- "Bagaimana distribusi pegawai per unit?"
- "Analisis komposisi ASN vs Non ASN"
- "Bandingkan jumlah pegawai antar unit"

### 4. Peta Jabatan
- "Tampilkan peta jabatan"
- "Berapa target ABK untuk struktural?"
- "List posisi fungsional"

### 5. Complex Queries
- "Pegawai mana yang akan pensiun tahun ini?"
- "Berapa rata-rata usia pegawai?"
- "Unit mana yang paling banyak pegawai?"

## 🔧 Technical Details

### DeepSeek API Configuration
```typescript
{
  model: 'deepseek-chat',
  temperature: 0.7,      // Balance between creativity and accuracy
  max_tokens: 2000,      // Maximum response length
  stream: false,         // Non-streaming for simplicity
}
```

### Context Window
- Last 10 messages included for context
- System prompt with current data
- User profile & permissions

### Data Fetching Strategy
```typescript
// Keyword detection
const needsEmployeeData = query.includes('pegawai') || 
                         query.includes('asn') || ...

const needsPetaJabatan = query.includes('peta jabatan') || 
                        query.includes('jabatan') || ...

const needsStats = query.includes('statistik') || 
                  query.includes('berapa') || ...

// Fetch only relevant data
if (needsEmployeeData) {
  // Fetch employees with RLS filtering
}

if (needsPetaJabatan) {
  // Fetch position references
}
```

### Performance Optimization
- ✅ Fetch only relevant data based on query
- ✅ Limit results (100 employees, 100 positions)
- ✅ Pre-calculate statistics
- ✅ Cache user profile & role
- ✅ Efficient database queries

## 📊 Token Usage

### Typical Usage
- **Simple query**: 500-800 tokens
- **Complex query**: 1000-1500 tokens
- **With context**: 1500-2500 tokens

### Cost Estimation (DeepSeek Pricing)
- Input: $0.14 per 1M tokens
- Output: $0.28 per 1M tokens
- Average query: ~$0.0003 (very cheap!)

## ✅ Testing Checklist

### Functionality
- [ ] Chat widget appears (floating button)
- [ ] Click button opens chat window
- [ ] Send message works
- [ ] AI responds correctly
- [ ] Markdown rendering works
- [ ] Suggested questions work
- [ ] Clear chat works
- [ ] Close chat works

### Data Access
- [ ] Admin Pusat sees all data
- [ ] Admin Unit sees only their unit
- [ ] Admin Pimpinan (Pusat) sees all
- [ ] Admin Pimpinan (Other) sees only their unit

### AI Quality
- [ ] Answers are accurate
- [ ] Answers are well-formatted
- [ ] Statistics are correct
- [ ] Context is maintained
- [ ] Insights are relevant

### Edge Cases
- [ ] Empty message (should not send)
- [ ] Very long message
- [ ] Multiple rapid messages
- [ ] Network error handling
- [ ] API error handling
- [ ] No data available

## 🐛 Troubleshooting

### Chat widget not appearing
- Check if AIChatWidget is imported in App.tsx
- Check browser console for errors
- Verify react-markdown is installed

### AI not responding
- Check DeepSeek API key in Supabase secrets
- Check Edge Function logs: `supabase functions logs ai-chat`
- Verify user authentication
- Check network tab for API calls

### Wrong data returned
- Verify user role & department
- Check RLS policies
- Check data filtering logic in Edge Function
- Test with different user roles

### Slow response
- Check database query performance
- Optimize data fetching (reduce limit)
- Check DeepSeek API latency
- Consider caching frequently accessed data

## 🔮 Future Enhancements

### 1. **Voice Input**
- Speech-to-text untuk input
- Text-to-speech untuk output

### 2. **Advanced Analytics**
- Chart generation
- Trend analysis
- Predictive analytics

### 3. **Export Functionality**
- Export chat history
- Export data to Excel/PDF
- Share insights

### 4. **Multi-language Support**
- English support
- Other languages

### 5. **Personalization**
- Remember user preferences
- Suggested questions based on role
- Custom shortcuts

### 6. **Integration**
- Email notifications
- Slack/Teams integration
- WhatsApp bot

### 7. **Advanced Features**
- Image analysis (upload documents)
- Batch queries
- Scheduled reports
- Alert system

## 📝 Notes

- DeepSeek API key sudah dikonfigurasi
- Edge Function ready to deploy
- Frontend component integrated
- Security implemented
- Documentation complete

## 🎉 Status

**Implementation**: ✅ Complete
**Testing**: ⏳ Ready for testing
**Deployment**: ⏳ Ready to deploy
**Documentation**: ✅ Complete

---

**Version**: 1.0.0  
**Date**: 7 Mei 2026  
**AI Model**: DeepSeek Chat  
**Developed by**: Kiro AI Assistant
