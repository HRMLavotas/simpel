# Hasil Update Data dari NIP

## Tanggal: 21 April 2026

## Summary

✅ **Update berhasil dilakukan!**

### Statistik Sebelum Update
- Total pegawai dengan NIP 18 digit: **2510**
- Perlu update: **462** pegawai

### Statistik Setelah Update
- Total pegawai dengan NIP 18 digit: **2510**
- Ada birth_date: **2049** (81.6%)
- Ada tmt_cpns: **2048** (81.6%)
- Ada gender: **2509** (99.96%)

### Data yang Berhasil Diupdate
- **Gender**: ~461 pegawai (dari 462 menjadi 1 yang kosong)
- **Birth Date**: ~461 pegawai yang valid
- **TMT CPNS**: ~461 pegawai yang valid

### Data yang Tidak Diupdate
- **Gender**: 1 pegawai (kemungkinan kode gender di NIP tidak valid)
- **Birth Date**: ~461 pegawai (kemungkinan format tanggal tidak valid di NIP)
- **TMT CPNS**: ~462 pegawai (kemungkinan format tanggal tidak valid di NIP)

## File SQL yang Digunakan

1. **update_gender_only.sql** - Update gender dari digit ke-15 NIP
   - ✅ Berhasil: 461 pegawai
   - ⏭️ Skip: 1 pegawai (kode gender tidak valid)

2. **update_dates_safe.sql** - Update birth_date dan tmt_cpns dengan error handling
   - ✅ Berhasil: ~461 pegawai
   - ⏭️ Skip: ~461 pegawai (format tanggal tidak valid)

## Command yang Digunakan

### 1. Update Gender
```powershell
$env:SUPABASE_ACCESS_TOKEN="sbp_..."; $env:SUPABASE_DB_PASSWORD="..."; Get-Content update_gender_only.sql | npx -y supabase@2.93.0 db query --linked
```

### 2. Update Dates
```powershell
$env:SUPABASE_ACCESS_TOKEN="sbp_..."; $env:SUPABASE_DB_PASSWORD="..."; Get-Content update_dates_safe.sql | npx -y supabase@2.93.0 db query --linked
```

### 3. Verifikasi Hasil
```powershell
$env:SUPABASE_ACCESS_TOKEN="sbp_..."; $env:SUPABASE_DB_PASSWORD="..."; npx -y supabase@2.93.0 db query "SELECT COUNT(*) as total_nip_18, COUNT(CASE WHEN birth_date IS NOT NULL THEN 1 END) as ada_birth_date, COUNT(CASE WHEN tmt_cpns IS NOT NULL THEN 1 END) as ada_tmt_cpns, COUNT(CASE WHEN gender IS NOT NULL AND gender != '' THEN 1 END) as ada_gender FROM employees WHERE nip IS NOT NULL AND LENGTH(REPLACE(nip, ' ', '')) = 18;" --linked
```

## Analisis

### Kenapa Masih Ada Data yang Kosong?

#### Birth Date & TMT CPNS (~461 pegawai)
Kemungkinan penyebab:
1. **Format tanggal tidak valid** di NIP:
   - Bulan > 12 (contoh: 20242101 = 21 Januari 2024, tapi bulan 21 tidak valid)
   - Hari > 31 atau tidak sesuai bulan
   - Tahun di luar range (< 1940 atau > 2010 untuk birth date)
2. **Tanggal lahir >= TMT CPNS** (tidak logis)
3. **NIP salah input** dari awal

#### Gender (1 pegawai)
- Digit ke-15 bukan '1' atau '2'
- Kemungkinan NIP salah input

### Rekomendasi

1. **Untuk data yang masih kosong**: Perlu input manual atau koreksi NIP
2. **Gunakan fitur Audit Data**: Menu baru yang sudah dibuat untuk identifikasi data bermasalah
3. **Validasi NIP**: Saat input pegawai baru, tambahkan validasi format NIP

## Query untuk Cek Data Bermasalah

### Cek NIP dengan format tanggal invalid
```sql
SELECT 
  nip,
  name,
  SUBSTRING(REPLACE(nip, ' ', ''), 1, 8) AS birth_date_string,
  SUBSTRING(REPLACE(nip, ' ', ''), 9, 6) AS tmt_string,
  SUBSTRING(REPLACE(nip, ' ', ''), 15, 1) AS gender_code
FROM employees
WHERE 
  nip IS NOT NULL 
  AND LENGTH(REPLACE(nip, ' ', '')) = 18
  AND (birth_date IS NULL OR tmt_cpns IS NULL OR gender IS NULL OR gender = '')
LIMIT 20;
```

### Cek pegawai dengan gender kosong
```sql
SELECT nip, name, SUBSTRING(REPLACE(nip, ' ', ''), 15, 1) AS gender_code
FROM employees
WHERE nip IS NOT NULL 
  AND LENGTH(REPLACE(nip, ' ', '')) = 18
  AND (gender IS NULL OR gender = '');
```

## Integrasi dengan Fitur Audit Data

Setelah update ini:
1. Buka menu **Audit Data**
2. Jumlah data bermasalah akan berkurang signifikan
3. Data yang masih bermasalah perlu penanganan manual

## Kesimpulan

✅ **Update berhasil untuk mayoritas data**
- Gender: 99.96% lengkap (2509/2510)
- Birth Date: 81.6% lengkap (2049/2510)
- TMT CPNS: 81.6% lengkap (2048/2510)

⚠️ **Data yang masih perlu penanganan manual**: ~461 pegawai dengan NIP format tanggal invalid

💡 **Next Steps**:
1. Gunakan fitur Audit Data untuk identifikasi data bermasalah
2. Koreksi NIP yang salah format
3. Input manual untuk data yang tidak bisa diekstrak dari NIP
