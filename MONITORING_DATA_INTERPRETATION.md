# Interpretasi Data Monitoring Aktivitas Unit

## ⚠️ Penting: Memahami Angka Perubahan

### Situasi Saat Ini

Jika Anda melihat angka perubahan yang sangat tinggi (ratusan) di bulan April 2026, ini kemungkinan besar karena:

1. **Initial Data Import**: Data history di-generate saat pertama kali import data ke sistem
2. **Bulk Population**: Migration yang populate history dari data existing employees
3. **Bukan Update Manual**: Bukan hasil update manual oleh admin unit

### Mengapa Ini Terjadi?

Saat sistem pertama kali dijalankan:
```sql
-- Migration populate_history_from_current_data.sql
-- Membuat history record untuk semua employee existing
INSERT INTO mutation_history (employee_id, tanggal, ke_unit)
SELECT id, join_date, department FROM employees;
```

Ini menghasilkan ratusan/ribuan history records sekaligus.

## 🔧 Solusi yang Sudah Diimplementasikan

### V1: Exclude Bulk Imports (Threshold 10/detik)
Migration `20260421110000` mencoba exclude records yang dibuat 10+ dalam 1 detik yang sama.

**Limitasi**: 
- Jika import dilakukan lebih lambat, tetap terhitung
- Threshold mungkin perlu disesuaikan

### Alternatif Solusi

#### Opsi A: Gunakan Cutoff Date
Hanya hitung perubahan setelah tanggal tertentu (misal: setelah go-live):

```sql
WHERE created_at >= '2026-05-01'  -- Setelah sistem resmi digunakan
```

#### Opsi B: Tambah Flag Manual Entry
Tambah kolom `is_manual_entry` di setiap history table:

```sql
ALTER TABLE mutation_history ADD COLUMN is_manual_entry BOOLEAN DEFAULT true;

-- Set false untuk data import
UPDATE mutation_history SET is_manual_entry = false 
WHERE created_at < '2026-05-01';
```

#### Opsi C: Track by User
Tambah kolom `created_by` untuk track siapa yang input:

```sql
ALTER TABLE mutation_history ADD COLUMN created_by UUID REFERENCES auth.users(id);

-- Hanya hitung yang ada created_by (manual entry)
WHERE created_by IS NOT NULL
```

## 📊 Cara Membaca Data Saat Ini

### Untuk Bulan April 2026 (Bulan Import)
- ✅ **Abaikan angka tinggi** - Ini dari initial import
- ✅ **Fokus pada bulan berikutnya** - Mei 2026 dst
- ✅ **Gunakan sebagai baseline** - Untuk perbandingan

### Untuk Bulan Mei 2026 dan Seterusnya
- ✅ **Angka akan lebih realistis** - Hanya update manual
- ✅ **Bisa digunakan untuk monitoring** - Tracking aktivitas real
- ✅ **Follow-up unit tidak aktif** - Yang benar-benar tidak update

## 🎯 Rekomendasi Implementasi

### Jangka Pendek (Sekarang)
1. **Dokumentasikan tanggal go-live** sistem
2. **Informasikan ke users** bahwa April 2026 adalah bulan import
3. **Mulai monitoring dari Mei 2026**

### Jangka Menengah (1-2 Minggu)
Implementasi salah satu solusi:

**Rekomendasi: Opsi A (Cutoff Date)**
- Paling simple
- Tidak perlu ubah schema
- Cukup update view dengan WHERE clause

```sql
-- Update view dengan cutoff date
WHERE created_at >= '2026-05-01'  -- Go-live date
```

### Jangka Panjang (Future Enhancement)
**Rekomendasi: Opsi C (Track by User)**
- Paling akurat
- Bisa audit siapa yang input
- Berguna untuk accountability

## 📝 Action Items

### Untuk Admin Pusat
1. ✅ Tentukan tanggal go-live resmi sistem
2. ✅ Komunikasikan ke semua admin unit
3. ✅ Mulai monitoring dari bulan setelah go-live
4. ✅ Abaikan data bulan import (April 2026)

### Untuk Developer
1. ⏳ Implementasi cutoff date di view (jika diperlukan)
2. ⏳ Atau implementasi tracking by user (lebih robust)
3. ⏳ Update dokumentasi dengan tanggal go-live

## 🔍 Query Manual untuk Verifikasi

### Check Bulk Import Pattern
```sql
-- Lihat distribusi records per detik
SELECT 
  DATE_TRUNC('second', created_at) as time_bucket,
  COUNT(*) as record_count
FROM mutation_history
WHERE created_at >= '2026-04-01'
  AND created_at < '2026-05-01'
GROUP BY DATE_TRUNC('second', created_at)
ORDER BY record_count DESC
LIMIT 10;
```

### Check Manual Entries (After Go-Live)
```sql
-- Lihat perubahan setelah go-live
SELECT 
  e.department,
  COUNT(*) as changes
FROM mutation_history mh
JOIN employees e ON mh.employee_id = e.id
WHERE mh.created_at >= '2026-05-01'  -- Setelah go-live
GROUP BY e.department
ORDER BY changes DESC;
```

## 💡 Tips Penggunaan

### Saat Ini (Bulan Import)
- Gunakan fitur monitoring untuk **familiarisasi**
- Test semua fitur (search, filter, export)
- Berikan feedback untuk improvement

### Setelah Go-Live
- Gunakan untuk **monitoring real**
- Follow-up unit tidak aktif
- Export untuk reporting bulanan

## ❓ FAQ

**Q: Kenapa angka perubahan sangat tinggi?**
A: Karena data history di-generate saat import awal, bukan dari update manual.

**Q: Kapan angka akan normal?**
A: Mulai bulan setelah go-live (Mei 2026 dst), hanya akan ada update manual.

**Q: Apakah perlu fix sekarang?**
A: Tidak urgent. Bisa tunggu sampai ada data bulan berikutnya untuk evaluasi.

**Q: Bagaimana cara paling akurat?**
A: Implementasi tracking by user (created_by) untuk semua history tables.

## 📅 Timeline Rekomendasi

### Week 1 (Sekarang)
- ✅ Dokumentasi dan komunikasi
- ✅ Set ekspektasi ke users
- ✅ Fokus testing fitur

### Week 2-3
- ⏳ Observasi data bulan Mei
- ⏳ Evaluasi apakah perlu cutoff date
- ⏳ Decide on long-term solution

### Week 4+
- ⏳ Implementasi solution terpilih
- ⏳ Update dokumentasi
- ⏳ Training users

---

**Kesimpulan**: Angka tinggi di bulan April adalah **normal** untuk bulan import. Monitoring akan lebih akurat mulai bulan berikutnya. Tidak perlu panic atau fix urgent.
