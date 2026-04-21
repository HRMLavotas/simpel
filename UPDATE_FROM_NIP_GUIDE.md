# Panduan Update Data dari NIP

## Deskripsi
Script untuk mengekstrak dan mengupdate data pegawai (tanggal lahir, TMT CPNS, jenis kelamin) dari NIP 18 digit.

## Format NIP 18 Digit

| Urutan | Digit | Kode | Keterangan | Contoh |
|--------|-------|------|------------|--------|
| 1 | 8 digit pertama | 19850312 | Tanggal lahir (YYYYMMDD) | 12 Maret 1985 |
| 2 | 6 digit kedua | 201012 | TMT CPNS (YYYYMM) | Desember 2010 |
| 3 | 1 digit ketiga | 1 | Jenis kelamin (1=Pria, 2=Wanita) | Pria |
| 4 | 3 digit terakhir | 002 | Nomor urut identitas | 002 |

**Contoh NIP**: `198503122010121002`
- Lahir: 12 Maret 1985
- TMT CPNS: Desember 2010 (01 Desember 2010)
- Jenis Kelamin: Laki-laki (kode 1)
- Nomor urut: 002

## File yang Tersedia

### 1. `extract_and_update_from_nip.sql`
SQL script untuk dijalankan langsung di Supabase SQL Editor.

**Fitur:**
- STEP 1: Preview data yang akan diupdate
- STEP 2: Validasi data
- STEP 3: Update data (uncomment untuk menjalankan)
- STEP 4: Verifikasi hasil
- STEP 5: Statistik

### 2. `update_from_nip.mjs`
Node.js script untuk update otomatis dengan validasi.

**Fitur:**
- Validasi otomatis
- Dry-run mode (preview tanpa update)
- Progress tracking
- Error handling

## Cara Menggunakan

### Metode 1: SQL Script (Recommended untuk First Time)

1. Buka Supabase SQL Editor
2. Copy isi file `extract_and_update_from_nip.sql`
3. Jalankan STEP 1 untuk preview:
   ```sql
   -- Lihat data yang akan diupdate
   SELECT id, nip, name, birth_date, tmt_cpns, gender...
   ```

4. Jalankan STEP 2 untuk validasi:
   ```sql
   -- Cek validasi data
   SELECT id, nip, name, validasi_tahun_lahir, validasi_bulan_lahir...
   ```

5. Jika validasi OK, uncomment dan jalankan STEP 3:
   ```sql
   UPDATE employees SET...
   ```

6. Verifikasi hasil dengan STEP 4 dan 5

### Metode 2: Node.js Script (Recommended untuk Automation)

#### Dry Run (Preview tanpa update)
```bash
node update_from_nip.mjs --dry-run
```

#### Update dengan konfirmasi
```bash
node update_from_nip.mjs
```

#### Update tanpa konfirmasi (force)
```bash
node update_from_nip.mjs --force
```

## Validasi yang Dilakukan

### Tanggal Lahir
- ✅ Tahun: 1940 - 2010
- ✅ Bulan: 1 - 12
- ✅ Hari: 1 - 31
- ✅ Format tanggal valid
- ✅ Tanggal lahir < TMT CPNS

### TMT CPNS
- ✅ Tahun: 1970 - sekarang
- ✅ Bulan: 1 - 12
- ✅ Format tanggal valid
- ✅ TMT CPNS > tanggal lahir

### Jenis Kelamin
- ✅ Kode 1 = Laki-laki
- ✅ Kode 2 = Perempuan
- ✅ Hanya kode 1 atau 2 yang valid

## Contoh Output

### SQL Script (STEP 1 - Preview)
```
id  | nip                | name           | birth_date_lama | birth_date_baru | tmt_cpns_lama | tmt_cpns_baru | gender_lama | gender_baru
----|--------------------|----------------|-----------------|-----------------|---------------|---------------|-------------|-------------
123 | 198503122010121002 | John Doe       | NULL            | 1985-03-12      | NULL          | 2010-12-01    | NULL        | Laki-laki
456 | 199001152015062001 | Jane Smith     | NULL            | 1990-01-15      | NULL          | 2015-06-01    | NULL        | Perempuan
```

### Node.js Script
```
🔍 Extract dan Update Data dari NIP
================================================================================
Mode: ✏️  UPDATE MODE
================================================================================

📥 Fetching employees dengan NIP 18 digit...

✅ Found 25 employees dengan NIP 18 digit yang perlu diupdate

📝 John Doe (198503122010121002)
   Changes: birth_date: 1985-03-12, tmt_cpns: 2010-12-01, gender: Laki-laki
   ✅ Updated successfully

📝 Jane Smith (199001152015062001)
   Changes: birth_date: 1990-01-15, tmt_cpns: 2015-06-01, gender: Perempuan
   ✅ Updated successfully

================================================================================
📊 Summary:
   ✅ Success: 23
   ⏭️  Skipped: 2
   ❌ Errors: 0
   📝 Total: 25
================================================================================
```

## Troubleshooting

### NIP tidak valid
**Masalah**: NIP tidak 18 digit atau ada spasi
**Solusi**: Script otomatis membersihkan spasi. Pastikan NIP benar-benar 18 digit angka.

### Tahun lahir di luar range
**Masalah**: Tahun lahir < 1940 atau > 2010
**Solusi**: Periksa NIP, mungkin ada kesalahan input. Update manual jika perlu.

### TMT CPNS tidak valid
**Masalah**: Tahun TMT < 1970 atau > tahun sekarang
**Solusi**: Periksa NIP, mungkin ada kesalahan input. Update manual jika perlu.

### Tanggal lahir >= TMT CPNS
**Masalah**: Tanggal lahir sama atau lebih baru dari TMT CPNS
**Solusi**: Data tidak logis, perlu koreksi manual.

### Gender code tidak valid
**Masalah**: Digit ke-15 bukan 1 atau 2
**Solusi**: Periksa NIP, mungkin ada kesalahan input.

## Best Practices

1. **Selalu jalankan dry-run terlebih dahulu**
   ```bash
   node update_from_nip.mjs --dry-run
   ```

2. **Backup data sebelum update massal**
   ```sql
   -- Backup table employees
   CREATE TABLE employees_backup AS SELECT * FROM employees;
   ```

3. **Verifikasi hasil setelah update**
   ```sql
   SELECT COUNT(*) FROM employees WHERE birth_date IS NULL AND nip IS NOT NULL;
   ```

4. **Update bertahap untuk data besar**
   - Gunakan SQL script dengan LIMIT
   - Atau jalankan Node.js script per batch

## Integrasi dengan Audit Data

Setelah menjalankan script ini:
1. Buka menu **Audit Data**
2. Verifikasi jumlah data bermasalah berkurang
3. Data yang sudah lengkap akan hilang dari daftar audit

## Statistik

Query untuk melihat statistik kelengkapan data:
```sql
SELECT 
  COUNT(*) AS total_pegawai_dengan_nip,
  COUNT(CASE WHEN birth_date IS NOT NULL THEN 1 END) AS ada_birth_date,
  COUNT(CASE WHEN birth_date IS NULL THEN 1 END) AS tidak_ada_birth_date,
  COUNT(CASE WHEN tmt_cpns IS NOT NULL THEN 1 END) AS ada_tmt_cpns,
  COUNT(CASE WHEN tmt_cpns IS NULL THEN 1 END) AS tidak_ada_tmt_cpns,
  COUNT(CASE WHEN gender IS NOT NULL AND gender != '' THEN 1 END) AS ada_gender,
  COUNT(CASE WHEN gender IS NULL OR gender = '' THEN 1 END) AS tidak_ada_gender
FROM employees
WHERE 
  nip IS NOT NULL 
  AND LENGTH(REPLACE(nip, ' ', '')) = 18;
```

## Catatan Penting

⚠️ **PERHATIAN**:
- Script ini hanya mengupdate data yang **KOSONG** (NULL atau empty string)
- Data yang sudah ada **TIDAK AKAN DITIMPA**
- Validasi ketat diterapkan untuk memastikan data yang diupdate valid
- Selalu backup data sebelum menjalankan update massal

✅ **AMAN**:
- Dry-run mode tersedia untuk preview
- Validasi otomatis untuk setiap field
- Error handling yang baik
- Tidak akan merusak data yang sudah ada
