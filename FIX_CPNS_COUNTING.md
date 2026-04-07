# Fix CPNS Counting - Data Pegawai

## Masalah yang Ditemukan

1. **Status CPNS tidak ditampilkan di data view** - Pegawai dengan status CPNS tidak muncul atau tidak dihitung dengan benar
2. **CPNS tidak dihitung dalam total ASN** - Logika perhitungan jumlah ASN tidak mengikutsertakan CPNS, padahal CPNS adalah bagian dari ASN

## Perubahan yang Dilakukan

### 1. Database RPC Function (`get_dashboard_stats`)
**File**: `supabase/migrations/20260407100000_fix_cpns_counting.sql`

Mengubah query perhitungan PNS untuk mengikutsertakan CPNS:
```sql
-- Sebelum:
SELECT COUNT(*) INTO v_pns
FROM employees e
WHERE e.asn_status = 'PNS'
  AND (p_department IS NULL OR e.department = p_department);

-- Sesudah:
SELECT COUNT(*) INTO v_pns
FROM employees e
WHERE e.asn_status IN ('PNS', 'CPNS')
  AND (p_department IS NULL OR e.department = p_department);
```

### 2. Hook Peta Jabatan Stats
**File**: `src/hooks/usePetaJabatanStats.ts`

Mengubah logika perhitungan existing PNS untuk mengikutsertakan CPNS:
```typescript
// Sebelum:
if (emp.asn_status === 'PNS') stat.existing_pns += 1;
else if (emp.asn_status === 'PPPK') stat.existing_pppk += 1;

// Sesudah:
if (emp.asn_status === 'PNS' || emp.asn_status === 'CPNS') stat.existing_pns += 1;
else if (emp.asn_status === 'PPPK') stat.existing_pppk += 1;
```

### 3. Filter ASN Status
**File**: `src/hooks/useDashboardData.ts`

Menambahkan CPNS ke dalam filter "asn":
```typescript
// Sebelum:
if (selectedAsnStatus === 'asn') return ['PNS', 'PPPK'];

// Sesudah:
if (selectedAsnStatus === 'asn') return ['PNS', 'CPNS', 'PPPK'];
```

### 4. UI Dashboard
**File**: `src/pages/Dashboard.tsx`

Menambahkan opsi CPNS di dropdown filter:
```typescript
<SelectItem value="asn">ASN (PNS + CPNS + PPPK)</SelectItem>
<SelectItem value="PNS">PNS</SelectItem>
<SelectItem value="CPNS">CPNS</SelectItem>
<SelectItem value="PPPK">PPPK</SelectItem>
```

### 5. Badge Display
**File**: `src/pages/Employees.tsx`

Menambahkan badge untuk status CPNS:
```typescript
case 'CPNS': return <Badge className="badge-cpns">CPNS</Badge>;
```

### 6. CSS Styling
**File**: `src/index.css`

Menambahkan style untuk badge CPNS:
```css
.badge-cpns {
  @apply bg-blue-500/10 text-blue-600 border-blue-500/20;
}
```

## Cara Menerapkan Perubahan

### 1. Apply Migration ke Database
Jalankan migration untuk memperbarui RPC function:

```bash
# Menggunakan Supabase CLI
supabase db push

# Atau apply manual via Supabase Dashboard
# Copy isi file: supabase/migrations/20260407100000_fix_cpns_counting.sql
# Paste ke SQL Editor di Supabase Dashboard dan execute
```

### 2. Restart Development Server
Setelah migration berhasil, restart development server:

```bash
npm run dev
```

## Verifikasi

Setelah perubahan diterapkan, verifikasi hal berikut:

1. ✅ Pegawai dengan status CPNS muncul di data view
2. ✅ CPNS dihitung dalam total ASN di dashboard
3. ✅ Filter "ASN (PNS + CPNS + PPPK)" menampilkan semua pegawai ASN termasuk CPNS
4. ✅ Filter "CPNS" menampilkan hanya pegawai CPNS
5. ✅ Badge CPNS ditampilkan dengan warna biru
6. ✅ Peta Jabatan menghitung CPNS sebagai bagian dari existing PNS

## Catatan Penting

- CPNS (Calon Pegawai Negeri Sipil) adalah bagian dari ASN dan seharusnya dihitung bersama dengan PNS
- Dalam perhitungan statistik, CPNS digabung dengan PNS karena mereka adalah calon yang akan menjadi PNS
- Badge CPNS menggunakan warna biru untuk membedakan dari PNS (primary) dan PPPK (success)
