"""
Script untuk generate SQL update data pendidikan pegawai
Membaca dari Excel dan generate SQL statements yang efisien
"""

import pandas as pd
import re

# Baca file Excel
excel_file = 'DAFTAR-PEGAWAI-2026-05-08-.xlsx'
df = pd.read_excel(excel_file, sheet_name='Sheet1')

# Bersihkan nama kolom
df.columns = df.columns.str.strip()

print(f"Total pegawai: {len(df)}")
print(f"Kolom yang tersedia: {df.columns.tolist()}")

# Fungsi untuk escape string SQL
def escape_sql(value):
    if pd.isna(value):
        return 'NULL'
    value = str(value).replace("'", "''")
    return f"'{value}'"

# Generate SQL file
output_file = 'update_pendidikan_pegawai_generated.sql'

with open(output_file, 'w', encoding='utf-8') as f:
    f.write("""-- Script untuk update data pendidikan pegawai berdasarkan NIP
-- Generated from DAFTAR-PEGAWAI-2026-05-08-.xlsx
-- Total: {} pegawai
-- Generated at: {}

BEGIN;

""".format(len(df), pd.Timestamp.now()))

    # Counter untuk tracking
    success_count = 0
    error_count = 0
    
    for idx, row in df.iterrows():
        try:
            nip = str(row['NIP']).strip()
            jenjang = str(row['Jenjang']).strip() if pd.notna(row['Jenjang']) else ''
            jurusan = str(row['Jurusan']).strip() if pd.notna(row['Jurusan']) else ''
            nama_sekolah = str(row['Nama Sekolah']).strip() if pd.notna(row['Nama Sekolah']) else ''
            
            # Skip jika NIP kosong
            if not nip or nip == 'nan':
                error_count += 1
                continue
            
            # Escape values
            jenjang_sql = escape_sql(jenjang) if jenjang else 'NULL'
            jurusan_sql = escape_sql(jurusan) if jurusan else 'NULL'
            sekolah_sql = escape_sql(nama_sekolah) if nama_sekolah else 'NULL'
            
            # Generate UPDATE statement
            # Update hanya record pendidikan terakhir (dengan graduation_year tertinggi)
            sql = f"""-- Update pegawai NIP: {nip}
UPDATE education_history 
SET 
    level = {jenjang_sql},
    major = {jurusan_sql},
    institution_name = {sekolah_sql},
    updated_at = NOW()
WHERE employee_id = (SELECT id FROM employees WHERE nip = '{nip}' LIMIT 1)
  AND id = (
    SELECT id FROM education_history 
    WHERE employee_id = (SELECT id FROM employees WHERE nip = '{nip}' LIMIT 1)
    ORDER BY graduation_year DESC NULLS LAST, created_at DESC 
    LIMIT 1
  );

"""
            f.write(sql)
            success_count += 1
            
            # Progress indicator
            if (idx + 1) % 100 == 0:
                print(f"Processed {idx + 1}/{len(df)} records...")
                
        except Exception as e:
            print(f"Error processing row {idx}: {e}")
            error_count += 1
            continue
    
    f.write("""
COMMIT;

-- Summary:
-- Total records processed: {}
-- Successful: {}
-- Errors: {}
""".format(len(df), success_count, error_count))

print(f"\n✅ SQL file generated: {output_file}")
print(f"📊 Summary:")
print(f"   - Total records: {len(df)}")
print(f"   - Successful: {success_count}")
print(f"   - Errors: {error_count}")
print(f"\n📝 Next steps:")
print(f"   1. Review the generated SQL file: {output_file}")
print(f"   2. Run it against your database")
print(f"   3. Or use the direct update script below")
