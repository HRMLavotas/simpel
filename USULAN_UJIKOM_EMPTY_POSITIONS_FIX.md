# Perbaikan Pesan Error - Tidak Ada Jabatan Fungsional

**Tanggal:** 2 Juni 2026  
**Status:** ✅ SELESAI

---

## 🎯 Masalah

Ketika user membuka form Usulan Ujikom dan tidak ada jabatan fungsional di unit kerjanya, muncul pesan:

```
Tidak ada jabatan fungsional tersedia untuk unit kerja ini.
```

Pesan ini kurang informatif dan tidak memberikan solusi yang jelas.

---

## 🔍 Root Cause

### 1. **Data Jabatan Fungsional Belum Ada**
Tabel `position_references` mungkin belum memiliki data jabatan dengan:
- `position_category = 'Jabatan Fungsional'`
- `department = '<nama_unit_kerja_user>'`

### 2. **Query Match Berdasarkan Nama Department**
Query menggunakan field `department` (VARCHAR) yang berisi nama unit kerja:

```typescript
query = query.eq('department', effectiveDepartmentId)
```

Dimana:
- `effectiveDepartmentId` = nama department dari `profile.department`
- Field `department` di `position_references` = nama unit kerja

### 3. **Kasus Umum Terjadi**
Ini adalah kasus yang wajar terjadi karena:
- Unit kerja baru yang belum diatur Peta Jabatannya
- Data Peta Jabatan belum lengkap untuk semua unit
- Focus awal deployment pada unit-unit tertentu

---

## 🔧 Solusi yang Diterapkan

### 1. **Improved Error Handling**

#### File: `src/components/usulan-ujikom/PetaJabatanSelector.tsx`

**a. Tambahkan Error State:**
```typescript
const { data: positions, isLoading, error: positionsError } = useQuery<PositionReference[]>({
  // ... query config
});
```

**b. Handle Error dari Query:**
```typescript
if (positionsError) {
  return (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertDescription>
        Terjadi kesalahan saat memuat data jabatan: {positionsError.message}
      </AlertDescription>
    </Alert>
  );
}
```

**c. Improved Empty State dengan Context-Aware Message:**
```typescript
if (!positions || positions.length === 0) {
  const isAdminPusat = role === 'admin_pusat';
  
  return (
    <div className="space-y-2">
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <div className="space-y-2">
            <p className="font-medium">
              Tidak ada jabatan fungsional tersedia untuk unit kerja ini.
            </p>
            <p className="text-xs">
              {isAdminPusat ? (
                <>
                  Silakan buka menu <strong>Peta Jabatan</strong> untuk 
                  menambahkan jabatan fungsional ke unit kerja ini.
                </>
              ) : (
                <>
                  Silakan hubungi Admin Pusat untuk menambahkan jabatan 
                  fungsional ke Peta Jabatan unit kerja Anda.
                </>
              )}
            </p>
            {effectiveDepartmentId && (
              <p className="text-xs text-muted-foreground mt-2">
                Unit Kerja: <strong>{effectiveDepartmentId}</strong>
              </p>
            )}
          </div>
        </AlertDescription>
      </Alert>
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}
```

### 2. **Debugging Console Log**
Tambahkan logging untuk membantu debugging:

```typescript
console.log('Position references query result:', {
  departmentId: effectiveDepartmentId,
  count: data?.length || 0,
  positions: data
});
```

---

## 📊 User Experience Improvements

### Sebelum:
```
┌────────────────────────────────────────────────┐
│ ⚠️ Tidak ada jabatan fungsional tersedia       │
│    untuk unit kerja ini.                       │
└────────────────────────────────────────────────┘
```
❌ Tidak jelas apa yang harus dilakukan  
❌ Tidak ada info unit kerja mana  
❌ Pesan sama untuk semua role  

### Sesudah (Admin Unit):
```
┌────────────────────────────────────────────────┐
│ ⚠️ Tidak ada jabatan fungsional tersedia       │
│    untuk unit kerja ini.                       │
│                                                │
│    Silakan hubungi Admin Pusat untuk          │
│    menambahkan jabatan fungsional ke Peta     │
│    Jabatan unit kerja Anda.                   │
│                                                │
│    Unit Kerja: BPVP Serang                    │
└────────────────────────────────────────────────┘
```
✅ Jelas apa yang harus dilakukan  
✅ Menampilkan nama unit kerja  
✅ Instruksi sesuai role  

### Sesudah (Admin Pusat):
```
┌────────────────────────────────────────────────┐
│ ⚠️ Tidak ada jabatan fungsional tersedia       │
│    untuk unit kerja ini.                       │
│                                                │
│    Silakan buka menu Peta Jabatan untuk       │
│    menambahkan jabatan fungsional ke unit     │
│    kerja ini.                                  │
│                                                │
│    Unit Kerja: BPVP Serang                    │
└────────────────────────────────────────────────┘
```
✅ Instruksi actionable untuk admin pusat  
✅ Mengarahkan ke menu yang tepat  
✅ Menampilkan nama unit kerja  

---

## 🔍 Cara Troubleshooting

### 1. **Check Console Log**
Buka Developer Tools Console, akan muncul log:

```javascript
Position references query result: {
  departmentId: "BPVP Serang",
  count: 0,
  positions: []
}
```

Ini membantu memverifikasi:
- Department ID yang digunakan query
- Jumlah hasil yang ditemukan
- Data jabatan yang tersedia

### 2. **Verify Database**
Jalankan query di Supabase SQL Editor:

```sql
-- Check jabatan fungsional untuk unit tertentu
SELECT 
  id,
  department,
  position_name,
  position_category,
  grade,
  abk_count
FROM position_references
WHERE position_category = 'Jabatan Fungsional'
  AND department = 'BPVP Serang'  -- Ganti dengan nama unit
ORDER BY position_name;
```

### 3. **Check All Functional Positions**
```sql
-- Lihat semua jabatan fungsional yang ada
SELECT 
  department,
  COUNT(*) as jumlah_jabatan,
  array_agg(position_name) as daftar_jabatan
FROM position_references
WHERE position_category = 'Jabatan Fungsional'
GROUP BY department
ORDER BY department;
```

---

## 🛠️ Solusi untuk Admin Pusat

### Cara Menambahkan Jabatan Fungsional ke Unit Kerja:

1. **Login sebagai Admin Pusat**
2. **Buka Menu "Peta Jabatan"**
3. **Pilih Unit Kerja yang dimaksud** dari dropdown
4. **Klik tombol "+ Tambah Jabatan"**
5. **Isi form:**
   - Nama Jabatan: (e.g., "Analis Kepegawaian Ahli Pertama")
   - Kategori: **Jabatan Fungsional**
   - Grade: (e.g., 9)
   - ABK Count: (e.g., 5)
6. **Simpan**

### Import Bulk (Jika Ada Banyak Jabatan):

Jika ingin menambahkan banyak jabatan sekaligus, gunakan SQL Insert:

```sql
INSERT INTO position_references (department, position_name, position_category, grade, abk_count)
VALUES
  ('BPVP Serang', 'Analis Kepegawaian Ahli Pertama', 'Jabatan Fungsional', 9, 5),
  ('BPVP Serang', 'Analis Kepegawaian Ahli Muda', 'Jabatan Fungsional', 10, 3),
  ('BPVP Serang', 'Pranata Komputer Ahli Pertama', 'Jabatan Fungsional', 9, 4);
```

---

## ✅ Testing Checklist

### Scenario 1: Unit Tanpa Jabatan Fungsional
- [ ] Login sebagai Admin Unit (unit yang belum ada jabatan fungsional)
- [ ] Buka form Usulan Ujikom baru
- [ ] Verifikasi muncul pesan error yang informatif
- [ ] Verifikasi menampilkan nama unit kerja
- [ ] Verifikasi instruksi sesuai (hubungi Admin Pusat)

### Scenario 2: Admin Pusat Melihat Unit Kosong
- [ ] Login sebagai Admin Pusat
- [ ] Buka form Usulan Ujikom baru
- [ ] Verifikasi instruksi mengarahkan ke menu Peta Jabatan
- [ ] Verifikasi menampilkan nama unit kerja

### Scenario 3: Setelah Menambahkan Jabatan
- [ ] Admin Pusat menambahkan jabatan fungsional ke unit
- [ ] Refresh/reload form Usulan Ujikom
- [ ] Verifikasi jabatan muncul di dropdown
- [ ] Verifikasi bisa dipilih

### Scenario 4: Error Handling
- [ ] Simulate network error
- [ ] Verifikasi muncul pesan error yang jelas

---

## 📝 Notes

### Database Schema Reminder:

**Tabel: `position_references`**
- `department` (VARCHAR) = Nama unit kerja (bukan UUID)
- `position_category` (VARCHAR) = Kategori jabatan
  - 'Jabatan Fungsional' ← Yang digunakan untuk usulan ujikom
  - 'Jabatan Struktural'
  - 'Jabatan Pelaksana'

**Tabel: `profiles`**
- `department` (VARCHAR) = Nama unit kerja user (bukan UUID)

**Matching Logic:**
```typescript
profile.department === position_references.department
```

---

## 🚀 Deployment

### File yang Diubah:
1. `src/components/usulan-ujikom/PetaJabatanSelector.tsx`

### Tidak Ada Migration:
- ✅ Tidak ada perubahan database schema
- ✅ Hanya perbaikan UI/UX dan error handling

### Deploy Steps:
1. Commit perubahan
2. Push ke repository  
3. Deploy ke production
4. Test dengan checklist di atas

---

## ✅ Status Akhir

**SELESAI** - Pesan error sekarang:
1. ✅ Lebih informatif dengan konteks yang jelas
2. ✅ Menampilkan nama unit kerja
3. ✅ Memberikan instruksi yang berbeda untuk Admin Pusat vs Admin Unit
4. ✅ Mengarahkan ke solusi yang tepat
5. ✅ Menambahkan logging untuk debugging

---

**Created by:** Kiro AI Assistant  
**Date:** 2 Juni 2026
