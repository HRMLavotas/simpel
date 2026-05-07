# 🔧 AI Backend Functions Guide

## 📚 Available Functions

### 1. Basic Search & Statistics

#### `ai_search_employee_by_name(p_search_name, p_limit)`
**Purpose:** Search employees by name (fuzzy matching)

**Example:**
```sql
SELECT * FROM ai_search_employee_by_name('ignatius');
-- Returns: Full employee details
```

**Use Case:** "Cari pegawai dengan nama X"

---

#### `ai_get_employee_statistics(p_department)`
**Purpose:** Get comprehensive employee statistics

**Example:**
```sql
SELECT ai_get_employee_statistics(NULL); -- All departments
SELECT ai_get_employee_statistics('BBPVP Bekasi'); -- Specific department
```

**Returns:** JSON with total, PNS, CPNS, PPPK, distributions

**Use Case:** "Berapa jumlah pegawai PNS?"

---

#### `ai_search_employee_by_nip(p_nip)`
**Purpose:** Search employee by NIP

**Example:**
```sql
SELECT * FROM ai_search_employee_by_nip('198608132014');
```

**Use Case:** "Cari pegawai dengan NIP X"

---

### 2. Department & Status Queries

#### `ai_get_employees_by_department(p_department, p_limit)`
**Purpose:** Get list of employees in a department

**Example:**
```sql
SELECT * FROM ai_get_employees_by_department('BBPVP Bekasi', 50);
```

**Use Case:** "Siapa saja pegawai di BBPVP Bekasi?"

---

#### `ai_get_employees_by_status(p_asn_status, p_department, p_limit)`
**Purpose:** Get employees by ASN status

**Example:**
```sql
SELECT * FROM ai_get_employees_by_status('PNS', 'BBPVP Bekasi', 50);
```

**Use Case:** "Siapa saja PNS di BBPVP Bekasi?"

---

### 3. Advanced Analysis Functions

#### `ai_count_employees_by_position_and_department(p_position_name, p_department)`
**Purpose:** Count employees by position in a department

**Example:**
```sql
SELECT ai_count_employees_by_position_and_department('Instruktur Ahli Pertama', 'BBPVP Bekasi');
-- Returns: 48
```

**Use Case:** "Berapa orang Instruktur Ahli Pertama di BBPVP Bekasi?"

---

#### `ai_get_employees_by_position_and_department(p_position_name, p_department, p_limit)`
**Purpose:** Get list of employees by position in a department

**Example:**
```sql
SELECT * FROM ai_get_employees_by_position_and_department('Instruktur Ahli Pertama', 'BBPVP Bekasi', 100);
```

**Use Case:** "Siapa saja Instruktur Ahli Pertama di BBPVP Bekasi?"

---

#### `ai_get_position_breakdown_by_department(p_department)`
**Purpose:** Get detailed position breakdown for a department

**Example:**
```sql
SELECT ai_get_position_breakdown_by_department('BBPVP Bekasi');
```

**Returns:** JSON with:
- `total_employees`: Total count
- `by_position`: Count per position name
- `by_position_type`: Count per position type

**Use Case:** "Bagaimana distribusi jabatan di BBPVP Bekasi?"

---

#### `ai_search_employees_flexible(p_department, p_position_name, p_asn_status, p_rank_group, p_limit)`
**Purpose:** Flexible search with multiple filters

**Example:**
```sql
-- PNS Instruktur di BBPVP Bekasi dengan golongan III
SELECT * FROM ai_search_employees_flexible(
  'BBPVP Bekasi',
  'Instruktur',
  'PNS',
  'III',
  50
);
```

**Use Case:** Complex queries with multiple criteria

---

## 🎯 Query Pattern Matching

### Pattern 1: Name Search
**Triggers:** "cari", "siapa", "nama"
**Function:** `ai_search_employee_by_name()`
**Examples:**
- "Cari pegawai dengan nama Ignatius"
- "Siapa Mahmudah?"
- "Pegawai atas nama Ali"

### Pattern 2: Statistics
**Triggers:** "berapa", "jumlah", "total", "statistik"
**Function:** `ai_get_employee_statistics()`
**Examples:**
- "Berapa jumlah pegawai PNS?"
- "Total ASN di BBPVP Bekasi?"
- "Statistik pegawai per unit"

### Pattern 3: Department List
**Triggers:** "siapa saja", "daftar", "list" + department
**Function:** `ai_get_employees_by_department()`
**Examples:**
- "Siapa saja pegawai di BBPVP Bekasi?"
- "Daftar pegawai Setditjen"

### Pattern 4: Position Analysis (NEW!)
**Triggers:** "berapa" + position + "di" + department
**Function:** `ai_count_employees_by_position_and_department()`
**Examples:**
- "Berapa orang Instruktur Ahli Pertama di BBPVP Bekasi?"
- "Ada berapa Analis di Setditjen?"

### Pattern 5: Position List (NEW!)
**Triggers:** "siapa saja" + position + "di" + department
**Function:** `ai_get_employees_by_position_and_department()`
**Examples:**
- "Siapa saja Instruktur Ahli Pertama di BBPVP Bekasi?"
- "Daftar Analis di Setditjen"

### Pattern 6: Department Breakdown (NEW!)
**Triggers:** "distribusi jabatan", "breakdown", "rincian jabatan" + department
**Function:** `ai_get_position_breakdown_by_department()`
**Examples:**
- "Bagaimana distribusi jabatan di BBPVP Bekasi?"
- "Rincian jabatan Setditjen"

---

## 🚀 Implementation Strategy

### Current Approach (Simple)
Edge Function detects basic patterns and calls appropriate functions.

**Pros:**
- Simple and predictable
- Fast response time
- Easy to debug

**Cons:**
- Limited flexibility
- Can't handle complex queries
- Needs manual pattern matching

### Future Approach (AI Function Calling)
Let DeepSeek AI choose which function to call based on user query.

**Implementation:**
```typescript
const tools = [
  {
    type: 'function',
    function: {
      name: 'search_employee_by_name',
      description: 'Search for employee by name',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Employee name to search' }
        },
        required: ['name']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'count_employees_by_position',
      description: 'Count employees by position in a department',
      parameters: {
        type: 'object',
        properties: {
          position: { type: 'string', description: 'Position name' },
          department: { type: 'string', description: 'Department name' }
        },
        required: ['position', 'department']
      }
    }
  }
  // ... more tools
]

// Call DeepSeek with tools
const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
  body: JSON.stringify({
    model: 'deepseek-chat',
    messages: messages,
    tools: tools,
    tool_choice: 'auto'
  })
})

// If AI wants to call a function
if (response.tool_calls) {
  const toolCall = response.tool_calls[0]
  const result = await supabase.rpc(toolCall.function.name, toolCall.function.arguments)
  // Send result back to AI
}
```

**Pros:**
- Extremely flexible
- Handles complex queries
- AI chooses best function
- Natural language understanding

**Cons:**
- More complex implementation
- Slightly slower (2 API calls)
- Requires careful prompt engineering

---

## 📊 Performance Comparison

| Function | Avg Time | Max Rows | Use Case |
|----------|----------|----------|----------|
| `ai_search_employee_by_name` | ~50ms | 10 | Name search |
| `ai_get_employee_statistics` | ~200ms | N/A | Statistics |
| `ai_count_employees_by_position_and_department` | ~30ms | 1 | Count only |
| `ai_get_employees_by_position_and_department` | ~100ms | 100 | List employees |
| `ai_get_position_breakdown_by_department` | ~150ms | N/A | Detailed breakdown |
| `ai_search_employees_flexible` | ~80ms | 50 | Complex search |

---

## 🎓 Best Practices

1. **Use specific functions** for better performance
2. **Limit results** to avoid overwhelming AI context
3. **Cache statistics** for frequently asked questions
4. **Monitor slow queries** and optimize indexes
5. **Test with real user queries** to improve pattern matching

---

## 🔮 Future Enhancements

1. **Semantic Search** using PostgreSQL full-text search
2. **Aggregation Functions** for complex analytics
3. **Time-series Analysis** for historical data
4. **Predictive Functions** for forecasting
5. **Export Functions** for generating reports
