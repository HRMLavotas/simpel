"""
Script untuk update data pendidikan pegawai langsung ke database
Membaca dari Excel dan update ke Supabase
"""

import pandas as pd
import os
from supabase import create_client, Client
from dotenv import load_dotenv
from tqdm import tqdm
import time

# Load environment variables
load_dotenv()

# Supabase credentials
SUPABASE_URL = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
SUPABASE_SERVICE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
    print("❌ Error: SUPABASE_URL atau SUPABASE_SERVICE_ROLE_KEY tidak ditemukan di .env")
    print("   Pastikan file .env ada dan berisi:")
    print("   NEXT_PUBLIC_SUPABASE_URL=your_url")
    print("   SUPABASE_SERVICE_ROLE_KEY=your_key")
    exit(1)

# Initialize Supabase client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

# Baca file Excel
excel_file = 'DAFTAR-PEGAWAI-2026-05-08-.xlsx'

print(f"📖 Membaca file Excel: {excel_file}")
df = pd.read_excel(excel_file, sheet_name='Sheet1')

# Bersihkan nama kolom
df.columns = df.columns.str.strip()

print(f"✅ Total pegawai dalam Excel: {len(df)}")
print(f"📋 Kolom yang tersedia: {df.columns.tolist()}\n")

# Statistik
stats = {
    'total': len(df),
    'success': 0,
    'not_found': 0,
    'no_education': 0,
    'error': 0,
    'skipped': 0
}

# Process each row
print("🔄 Memulai update data pendidikan...\n")

for idx, row in tqdm(df.iterrows(), total=len(df), desc="Progress"):
    try:
        nip = str(row['NIP']).strip()
        jenjang = str(row['Jenjang']).strip() if pd.notna(row['Jenjang']) else None
        jurusan = str(row['Jurusan']).strip() if pd.notna(row['Jurusan']) else None
        nama_sekolah = str(row['Nama Sekolah']).strip() if pd.notna(row['Nama Sekolah']) else None
        
        # Skip jika NIP kosong
        if not nip or nip == 'nan':
            stats['skipped'] += 1
            continue
        
        # 1. Cari employee berdasarkan NIP
        employee_result = supabase.table('employees').select('id').eq('nip', nip).execute()
        
        if not employee_result.data or len(employee_result.data) == 0:
            stats['not_found'] += 1
            if idx < 10:  # Print first 10 not found
                print(f"⚠️  NIP {nip} tidak ditemukan di database")
            continue
        
        employee_id = employee_result.data[0]['id']
        
        # 2. Cari education_history terakhir untuk employee ini
        education_result = supabase.table('education_history')\
            .select('id')\
            .eq('employee_id', employee_id)\
            .order('graduation_year', desc=True)\
            .order('created_at', desc=True)\
            .limit(1)\
            .execute()
        
        if not education_result.data or len(education_result.data) == 0:
            stats['no_education'] += 1
            if idx < 10:  # Print first 10 without education
                print(f"⚠️  NIP {nip} tidak memiliki data pendidikan")
            continue
        
        education_id = education_result.data[0]['id']
        
        # 3. Update education_history
        update_data = {}
        if jenjang:
            update_data['level'] = jenjang
        if jurusan:
            update_data['major'] = jurusan
        if nama_sekolah:
            update_data['institution_name'] = nama_sekolah
        
        if update_data:
            supabase.table('education_history')\
                .update(update_data)\
                .eq('id', education_id)\
                .execute()
            
            stats['success'] += 1
        else:
            stats['skipped'] += 1
        
        # Rate limiting - avoid hitting API limits
        if (idx + 1) % 50 == 0:
            time.sleep(0.5)
            
    except Exception as e:
        stats['error'] += 1
        if stats['error'] <= 10:  # Print first 10 errors
            print(f"❌ Error processing NIP {nip}: {str(e)}")
        continue

# Print summary
print("\n" + "="*60)
print("📊 SUMMARY HASIL UPDATE")
print("="*60)
print(f"Total records di Excel    : {stats['total']}")
print(f"✅ Berhasil diupdate      : {stats['success']}")
print(f"⚠️  Pegawai tidak ditemukan: {stats['not_found']}")
print(f"⚠️  Tidak ada data pendidikan: {stats['no_education']}")
print(f"❌ Error                  : {stats['error']}")
print(f"⏭️  Skipped (data kosong) : {stats['skipped']}")
print("="*60)

success_rate = (stats['success'] / stats['total'] * 100) if stats['total'] > 0 else 0
print(f"\n✨ Success Rate: {success_rate:.1f}%")

if stats['success'] > 0:
    print(f"\n✅ Update selesai! {stats['success']} data pendidikan berhasil diupdate.")
else:
    print(f"\n⚠️  Tidak ada data yang berhasil diupdate. Periksa log error di atas.")
