# Fix ASN Status Data - Perbaikan Data Pegawai

## Masalah yang Ditemukan

Setelah memeriksa database, ditemukan beberapa masalah dengan data `asn_status`:

1. **"CPPPK"** - Typo, seharusnya **"PPPK"** (ada huruf C di depan)
2. **"PPPK 2025"** - Format salah, seharusnya hanya **"PPPK"**
3. Beberapa pegawai dengan `asn_status` NULL yang bisa dideteksi dari pola `rank_group`

## Pola Deteksi Otomatis

Berdasarkan analisis data, pola `rank_group` dapat digunakan untuk mendeteksi status ASN:

### PPPK
Pegawai PPPK memiliki `rank_group` dengan pola:
- **V** (Golongan 5)
- **VII** (Golongan 7)
- **IX** (Golongan 9)

### PNS/CPNS
Pegawai PNS/CPNS memiliki `rank_group` dengan format:
- **Pembina Tk I (IV/b)**
- **Penata Muda (III/a)**
- **Pembina Muda (IV/c)**
- Dan format serupa dengan pola `(Angka Romawi/huruf)`

## Perubahan yang Dilakukan

Migration `20260407100001_fix_asn_status_data.sql` melakukan:

### 1. Perbaikan Typo "CPPPK" → "PPPK"
```sql
UPDATE employees
SET asn_status = 'PPPK'
WHERE asn_status = 'CPPPK';
```

### 2. Perbaikan Format "PPPK 2025" → "PPPK"
```sql
UPDATE employees
SET asn_status = 'PPPK'
WHERE asn_status = 'PPPK 2025';
```

### 3. Auto-detect PPPK dari Pola Rank Group
```sql
UPDATE employees
SET asn_status = 'PPPK'
WHERE asn_status IS NULL
  AND rank_group ~ '^(V|VII|IX)$';
```

### 4. Auto-detect PNS dari Pola Rank Group
```sql
UPDATE employees
SET asn_status = 'PNS'
WHERE asn_status IS NULL
  AND rank_group ~ '\([IVX]+/[a-z]\)';
```

## Hasil Perbaikan

Setelah migration dijalankan:

| Status ASN | Jumlah | Persentase |
|------------|--------|------------|
| PNS        | 1,678  | 51.00%     |
| Non ASN    | 770    | 23.40%     |
| PPPK       | 469    | 14.26%     |
| CPNS       | 372    | 11.31%     |

**Total Pegawai: 3,290**

### Statistik Perbaikan
- ✅ **461 records** diperbaiki dari "CPPPK" → "PPPK"
- ✅ **469 records** total PPPK setelah perbaikan
- ✅ **0 records** dengan asn_status NULL tersisa
- ✅ **0 records** dengan format salah tersisa

## Cara Menjalankan

Migration sudah dijalankan ke database production dengan command:

```bash
npx supabase db push
```

## Verifikasi

Untuk memverifikasi hasil perbaikan, jalankan:

```bash
npx supabase db query --linked -f scripts/verify_asn_status_fix.sql -o table
```

Atau query manual:

```sql
-- Lihat distribusi status ASN
SELECT 
  asn_status,
  COUNT(*) as total,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM employees
GROUP BY asn_status
ORDER BY total DESC;

-- Cek apakah masih ada data bermasalah
SELECT COUNT(*) FROM employees WHERE asn_status IS NULL;
SELECT COUNT(*) FROM employees WHERE asn_status = 'CPPPK';
SELECT COUNT(*) FROM employees WHERE asn_status = 'PPPK 2025';
```

## Catatan Penting

1. **Backup Data**: Migration ini mengubah data existing, pastikan backup sudah dilakukan
2. **Validasi Manual**: Untuk unit yang baru mengisi data, pastikan mereka menggunakan format yang benar:
   - PNS
   - CPNS
   - PPPK
   - Non ASN
3. **Pola Rank Group**: Sistem sekarang bisa auto-detect status ASN dari pola rank_group jika ada data baru dengan asn_status NULL

## Rekomendasi untuk Input Data Baru

Untuk mencegah masalah serupa di masa depan:

1. Gunakan dropdown/select untuk field `asn_status` dengan nilai tetap:
   - PNS
   - CPNS
   - PPPK
   - Non ASN

2. Tambahkan validasi di form input untuk memastikan format yang benar

3. Jika memungkinkan, tambahkan auto-detection berdasarkan `rank_group` saat input data baru
