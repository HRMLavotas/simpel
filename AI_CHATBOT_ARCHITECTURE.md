# 🤖 AI Chatbot Architecture - SIMPEL

## 📋 Overview

AI Chatbot untuk SIMPEL menggunakan arsitektur **Backend-First** di mana:
- **Backend (PostgreSQL Functions)** melakukan query data yang kompleks dan teroptimasi
- **AI (DeepSeek)** bertindak sebagai orchestrator yang memanggil function backend dan memformat jawaban

## 🏗️ Arsitektur

### Current Implementation: AI Function Calling ✅

```
User Query
    ↓
Edge Function (ai-chat)
    ↓
DeepSeek AI (with 12 tools)
    ├─ Analyze query
    ├─ Choose appropriate tool(s)
    └─ Generate tool calls
    ↓
Tool Execution (PostgreSQL RPC)
    ├─ ai_search_employee_by_name()
    ├─ ai_get_employee_statistics()
    ├─ ai_count_employees_by_position_and_department()
    ├─ ai_get_employees_by_position_and_department()
    ├─ ai_get_position_breakdown_by_department()
    ├─ ai_get_employees_by_department()
    ├─ ai_get_retirement_forecast()
    ├─ ai_get_newest_employees()
    ├─ ai_get_senior_employees()
    ├─ ai_compare_departments()
    ├─ ai_get_all_departments()
    └─ ai_get_employee_summary()
    ↓
Return Results to AI
    ↓
DeepSeek AI (format response)
    ↓
User Response
```

**Key Features:**
- ✅ AI automatically chooses which function to call
- ✅ Supports multi-turn tool calling (up to 5 iterations)
- ✅ No manual pattern matching needed
- ✅ Extremely flexible for complex queries

## 🔧 Backend Functions (12 Total)

### Basic Search & Statistics

#### 1. `ai_search_employee_by_name(p_search_name, p_limit)`
**Fungsi:** Mencari pegawai berdasarkan nama (fuzzy search)

**Parameter:**
- `p_search_name` (TEXT): Nama yang dicari
- `p_limit` (INTEGER): Maksimal hasil (default: 10)

**Return:** Detail lengkap pegawai (id, name, nip, asn_status, rank_group, position, department, contact, dll)

**Contoh:**
```sql
SELECT * FROM ai_search_employee_by_name('mahmudah');
```

#### 2. `ai_get_employee_statistics(p_department)`
**Fungsi:** Mendapatkan statistik lengkap pegawai

**Parameter:**
- `p_department` (TEXT): Filter department (NULL = semua)

**Return:** JSON dengan:
- `total`: Total pegawai
- `pns`, `cpns`, `pppk`, `non_asn`: Jumlah per status
- `by_department`: Distribusi per unit kerja
- `by_rank_group`: Distribusi per golongan
- `by_position_type`: Distribusi per jenis jabatan
- `by_gender`: Distribusi per jenis kelamin

**Contoh:**
```sql
SELECT ai_get_employee_statistics(NULL);
```

#### 3. `ai_get_employees_by_department(p_department, p_limit)`
**Fungsi:** Mendapatkan daftar pegawai di unit kerja tertentu

**Parameter:**
- `p_department` (TEXT): Nama unit kerja
- `p_limit` (INTEGER): Maksimal hasil (default: 50)

**Return:** List pegawai (name, nip, asn_status, rank_group, position_name)

**Contoh:**
```sql
SELECT * FROM ai_get_employees_by_department('BBPVP Bekasi');
```

### Position & Department Analysis

#### 4. `ai_count_employees_by_position_and_department(p_position_name, p_department)`
**Fungsi:** Menghitung jumlah pegawai per jabatan di unit kerja

**Parameter:**
- `p_position_name` (TEXT): Nama jabatan
- `p_department` (TEXT): Nama unit kerja

**Return:** INTEGER (jumlah pegawai)

**Contoh:**
```sql
SELECT ai_count_employees_by_position_and_department('Instruktur Ahli Pertama', 'BBPVP Bekasi');
-- Returns: 48
```

#### 5. `ai_get_employees_by_position_and_department(p_position_name, p_department, p_limit)`
**Fungsi:** Mendapatkan list pegawai per jabatan di unit kerja

**Parameter:**
- `p_position_name` (TEXT): Nama jabatan
- `p_department` (TEXT): Nama unit kerja
- `p_limit` (INTEGER): Maksimal hasil (default: 100)

**Return:** List pegawai dengan detail

**Contoh:**
```sql
SELECT * FROM ai_get_employees_by_position_and_department('Instruktur Ahli Pertama', 'BBPVP Bekasi', 50);
```

#### 6. `ai_get_position_breakdown_by_department(p_department)`
**Fungsi:** Mendapatkan breakdown detail jabatan per unit kerja

**Parameter:**
- `p_department` (TEXT): Nama unit kerja

**Return:** JSON dengan distribusi lengkap

**Contoh:**
```sql
SELECT ai_get_position_breakdown_by_department('BBPVP Bekasi');
```

### Advanced Analysis

#### 7. `ai_get_retirement_forecast(p_years_ahead, p_department)`
**Fungsi:** Proyeksi pegawai yang akan pensiun

**Parameter:**
- `p_years_ahead` (INTEGER): Tahun ke depan (default: 5)
- `p_department` (TEXT): Filter unit kerja (NULL = semua)

**Return:** List pegawai dengan tanggal pensiun

#### 8. `ai_get_newest_employees(p_limit, p_department)`
**Fungsi:** Pegawai terbaru berdasarkan tanggal masuk

**Parameter:**
- `p_limit` (INTEGER): Jumlah pegawai (default: 10)
- `p_department` (TEXT): Filter unit kerja (NULL = semua)

**Return:** List pegawai terurut dari terbaru

#### 9. `ai_get_senior_employees(p_limit, p_department)`
**Fungsi:** Pegawai paling senior berdasarkan masa kerja

**Parameter:**
- `p_limit` (INTEGER): Jumlah pegawai (default: 10)
- `p_department` (TEXT): Filter unit kerja (NULL = semua)

**Return:** List pegawai terurut dari paling senior

#### 10. `ai_compare_departments(p_department1, p_department2)`
**Fungsi:** Membandingkan statistik 2 unit kerja

**Parameter:**
- `p_department1` (TEXT): Unit kerja pertama
- `p_department2` (TEXT): Unit kerja kedua

**Return:** JSON dengan perbandingan lengkap

#### 11. `ai_get_all_departments()`
**Fungsi:** Mendapatkan list semua unit kerja dengan jumlah pegawai

**Return:** List unit kerja dengan statistik

#### 12. `ai_get_employee_summary(p_search)`
**Fungsi:** Ringkasan lengkap pegawai berdasarkan nama atau NIP

**Parameter:**
- `p_search` (TEXT): Nama atau NIP

**Return:** Detail lengkap pegawai

## 🎯 AI Function Calling

**Current Implementation:** DeepSeek AI automatically chooses which function to call based on query.

### How It Works

1. **User sends query** → Edge Function receives message
2. **AI analyzes query** → DeepSeek determines intent and required data
3. **AI generates tool calls** → Chooses 1 or more functions to call
4. **Edge Function executes** → Maps tool calls to PostgreSQL RPC
5. **Results returned to AI** → AI receives function results
6. **AI formats response** → Natural language answer with data
7. **User receives answer** → Formatted, accurate response

### Example Flow

**Query:** "Ada berapa orang Instruktur Ahli Pertama di BBPVP Bekasi?"

```json
// AI generates tool call
{
  "tool_calls": [{
    "function": {
      "name": "count_employees_by_position_and_department",
      "arguments": {
        "position_name": "Instruktur Ahli Pertama",
        "department": "BBPVP Bekasi"
      }
    }
  }]
}

// Edge Function executes
supabase.rpc('ai_count_employees_by_position_and_department', {
  p_position_name: 'Instruktur Ahli Pertama',
  p_department: 'BBPVP Bekasi'
})

// Returns: 48

// AI formats response
"Berdasarkan data terkini, terdapat 48 orang Instruktur Ahli Pertama di BBPVP Bekasi."
```

### Benefits

✅ **No Manual Pattern Matching** - AI understands intent naturally  
✅ **Flexible** - Handles complex and ambiguous queries  
✅ **Multi-Step** - Can call multiple functions if needed  
✅ **Accurate** - AI chooses the most appropriate function  
✅ **Scalable** - Easy to add new functions

## 📊 Data Flow

### Contoh 1: Pencarian Pegawai
```
User: "Mahmudah pegawai di unit mana?"
  ↓
Query Analysis: isSearchingPerson = true
  ↓
Extract Name: "Mahmudah"
  ↓
Call: ai_search_employee_by_name('Mahmudah')
  ↓
Result: 2 pegawai ditemukan
  ↓
Build Context: Tampilkan detail lengkap
  ↓
AI Response: Format jawaban dengan detail pegawai
```

### Contoh 2: Statistik
```
User: "Berapa jumlah pegawai PNS?"
  ↓
Query Analysis: needsStatistics = true
  ↓
Call: ai_get_employee_statistics(NULL)
  ↓
Result: { total: 3327, pns: 1700, ... }
  ↓
Build Context: Tampilkan statistik lengkap
  ↓
AI Response: "Jumlah pegawai PNS adalah 1,700 dari 3,327 pegawai"
```

## ⚡ Performance Benefits

### Before (Direct Query)
- ❌ Fetch 300-5000 rows ke Edge Function
- ❌ Process data di JavaScript (slow)
- ❌ Limited by Edge Function memory
- ❌ Inconsistent results

### After (Backend Functions)
- ✅ Query optimized di PostgreSQL (fast)
- ✅ Only return relevant data
- ✅ Consistent and accurate
- ✅ Scalable to millions of records

## 🔐 Security

- Semua functions menggunakan `SECURITY DEFINER`
- RLS bypass untuk performance (data sudah filtered di function)
- Permissions granted ke `authenticated` dan `service_role`
- Edge Function validates user token dan role

## ✅ Recent Updates

### May 7, 2026: AI Function Calling Deployed
- ✅ Implemented full AI Function Calling with 12 tools
- ✅ Added 7 new backend functions for advanced analysis
- ✅ Deployed to production
- ✅ Ready for testing

**New Functions Added:**
- `ai_count_employees_by_position_and_department()`
- `ai_get_employees_by_position_and_department()`
- `ai_get_position_breakdown_by_department()`
- `ai_get_retirement_forecast()`
- `ai_get_newest_employees()`
- `ai_get_senior_employees()`
- `ai_compare_departments()`
- `ai_get_all_departments()`
- `ai_get_employee_summary()`

## 🚀 Future Enhancements

### 1. **Caching Layer**
```typescript
// Cache statistics for 5 minutes
const cachedStats = await redis.get('employee_stats')
if (!cachedStats) {
  const stats = await supabase.rpc('ai_get_employee_statistics')
  await redis.set('employee_stats', stats, 'EX', 300)
}
```

### 2. **More Backend Functions**
- `ai_get_promotion_candidates()` - Kandidat kenaikan pangkat
- `ai_get_training_recommendations()` - Rekomendasi pelatihan
- `ai_get_position_gaps()` - Analisis gap jabatan
- `ai_get_employees_by_rank()` - Filter by golongan
- `ai_count_employees_by_gender()` - Gender statistics
- `ai_get_employees_by_age_range()` - Age range filter

### 3. **Semantic Search**
```sql
-- Using PostgreSQL full-text search
CREATE INDEX idx_employees_name_fts ON employees 
USING gin(to_tsvector('indonesian', name));
```

### 4. **Query Suggestions**
Suggest follow-up questions based on current query:
```typescript
// After showing statistics
suggestions: [
  "Siapa pegawai terbaru?",
  "Bandingkan dengan unit lain",
  "Proyeksi pensiun 5 tahun"
]
```

## 📝 Maintenance

### Monitoring
```sql
-- Check function performance
SELECT 
  schemaname,
  funcname,
  calls,
  total_time,
  mean_time
FROM pg_stat_user_functions
WHERE funcname LIKE 'ai_%'
ORDER BY total_time DESC;
```

### Optimization
```sql
-- Add indexes if needed
CREATE INDEX IF NOT EXISTS idx_employees_name_lower 
ON employees(LOWER(name));

CREATE INDEX IF NOT EXISTS idx_employees_active_status 
ON employees(is_active, asn_status);
```

## 🎓 Best Practices

1. **Always use backend functions** untuk query kompleks
2. **Keep Edge Function logic simple** - hanya orchestration
3. **Cache when possible** - statistik jarang berubah
4. **Monitor performance** - track slow queries
5. **Test with real data** - gunakan production-like dataset

## 📚 References

- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [PostgreSQL Functions](https://www.postgresql.org/docs/current/sql-createfunction.html)
- [DeepSeek API](https://platform.deepseek.com/docs)
