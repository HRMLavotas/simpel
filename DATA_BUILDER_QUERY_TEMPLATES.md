# Data Builder - Query Templates Feature

## Overview
Implementasi fitur Query Templates yang menggabungkan preset filter templates dan save/load queries menjadi satu kesatuan di menu Data Builder.

## Tanggal Implementasi
7 April 2026

## Fitur yang Diimplementasikan

### 1. System Preset Templates (Read-Only)
Template bawaan sistem yang tidak bisa dihapus atau diubah:

1. **ASN Aktif (PNS + PPPK)**
   - Kolom: name, nip, asn_status, department, position_name, position_type, rank_group
   - Filter: asn_status in ['PNS', 'PPPK']
   - Relasi: education_history, position_history, rank_history

2. **Jabatan Struktural**
   - Kolom: name, nip, department, position_name, rank_group, grade
   - Filter: position_type = 'Struktural'
   - Relasi: position_history, rank_history

3. **Jabatan Fungsional**
   - Kolom: name, nip, department, position_name, rank_group, education_level
   - Filter: position_type = 'Fungsional'
   - Relasi: education_history, training_history, competency_test_history

4. **Golongan IV**
   - Kolom: name, nip, department, position_name, rank_group, tmt_rank
   - Filter: rank_group in ['IV/a', 'IV/b', 'IV/c', 'IV/d', 'IV/e']
   - Relasi: rank_history

5. **Non-ASN**
   - Kolom: name, department, position_name, keterangan_penugasan, gender
   - Filter: asn_status = 'Non ASN'
   - Relasi: []

### 2. User Saved Templates
User dapat menyimpan konfigurasi query mereka sendiri:
- Nama template (wajib)
- Deskripsi template (opsional)
- Kolom yang dipilih
- Filter yang aktif (general + advanced)
- Tabel relasi yang dipilih
- Timestamp created_at dan updated_at

### 3. Template Management
- **Load Template**: Pilih dari dropdown untuk apply konfigurasi
- **Save Template**: Simpan konfigurasi saat ini sebagai template baru
- **Delete Template**: Hapus template user (tidak bisa hapus system template)
- **Template Info**: Tampilkan detail template yang dipilih (jumlah kolom, filter aktif, tabel relasi)

## File yang Dibuat/Dimodifikasi

### 1. Component Baru
**File**: `src/components/data-builder/QueryTemplates.tsx`
- Component untuk mengelola query templates
- Menampilkan system presets dan user saved templates
- Dialog untuk save template baru
- Integrasi dengan Supabase untuk persist data

### 2. Page Update
**File**: `src/pages/DataBuilder.tsx`
- Import QueryTemplates component
- Tambah handler `handleApplyTemplate` untuk apply template
- Tambah Card untuk QueryTemplates di atas section Pilih Kolom
- Separator untuk visual separation

### 3. Database Migration
**File**: `supabase/migrations/20260407000000_add_data_builder_templates.sql`
- Tambah kolom `data_builder_templates` (JSONB) ke table profiles
- Default value: empty array []
- Comment untuk dokumentasi

## Struktur Data Template

```typescript
interface QueryTemplate {
  id: string;                    // Unique ID (system-xxx atau user-timestamp)
  name: string;                  // Nama template
  description: string;           // Deskripsi template
  type: 'system' | 'user';      // Tipe template
  columns: string[];             // Array column keys
  filters: FilterRule[];         // Array filter rules
  relatedTables: string[];       // Array related table keys
  createdAt?: string;            // ISO timestamp (user templates only)
  updatedAt?: string;            // ISO timestamp (user templates only)
}
```

## User Flow

### Menggunakan System Preset
1. User membuka menu Data Builder
2. User melihat section "Query Templates" di atas
3. User memilih salah satu preset dari dropdown (contoh: "ASN Aktif")
4. Sistem otomatis apply:
   - Kolom yang sesuai
   - Filter yang sesuai
   - Tabel relasi yang sesuai
5. User bisa langsung klik "Tampilkan Data" atau modifikasi dulu

### Menyimpan Template Sendiri
1. User setup kolom, filter, dan relasi sesuai kebutuhan
2. User klik tombol "Simpan Query"
3. Dialog muncul meminta:
   - Nama template (wajib)
   - Deskripsi (opsional)
4. User klik "Simpan Template"
5. Template tersimpan di database (profiles.data_builder_templates)
6. Template muncul di dropdown section "My Templates"

### Menggunakan Saved Template
1. User pilih template dari dropdown section "My Templates"
2. Sistem apply konfigurasi yang tersimpan
3. User bisa langsung gunakan atau modifikasi

### Menghapus Template
1. User pilih template dari dropdown
2. Info template muncul dengan tombol delete (hanya untuk user templates)
3. User klik icon trash
4. Template dihapus dari database

## UI/UX Features

### Visual Indicators
- **System Templates**: Icon bintang (⭐) warna amber
- **User Templates**: Icon bookmark (🔖) warna biru
- **Badge**: Menampilkan jumlah kolom, filter aktif, tabel relasi
- **Timestamp**: Menampilkan "Terakhir diupdate" untuk user templates

### Responsive Design
- Dropdown full width di mobile
- Card info template responsive
- Dialog save template responsive

### Toast Notifications
- Success: Template diterapkan
- Success: Template berhasil disimpan
- Success: Template berhasil dihapus
- Error: Gagal menyimpan/menghapus template
- Error: Nama template wajib diisi

## Database Schema

### Table: profiles
```sql
-- Kolom baru
data_builder_templates JSONB DEFAULT '[]'::jsonb

-- Contoh data:
[
  {
    "id": "user-1712476800000",
    "name": "Laporan Bulanan ASN",
    "description": "Template untuk laporan bulanan pegawai ASN aktif",
    "type": "user",
    "columns": ["name", "nip", "department", "position_name"],
    "filters": [
      {
        "id": "filter-1",
        "kind": "general",
        "field": "asn_status",
        "operator": "in",
        "value": "",
        "values": ["PNS", "PPPK"]
      }
    ],
    "relatedTables": ["position_history"],
    "createdAt": "2026-04-07T10:00:00.000Z",
    "updatedAt": "2026-04-07T10:00:00.000Z"
  }
]
```

## Security & Permissions
- User hanya bisa melihat dan mengelola template mereka sendiri
- System templates read-only untuk semua user
- Data tersimpan di profiles table dengan RLS policies yang sudah ada
- User bisa update profiles.data_builder_templates untuk user_id mereka sendiri

## Testing Checklist

### Functional Testing
- [ ] System preset templates bisa dipilih dan apply dengan benar
- [ ] User bisa save template baru dengan nama dan deskripsi
- [ ] User bisa load saved template
- [ ] User bisa delete saved template
- [ ] System templates tidak bisa dihapus
- [ ] Template info menampilkan detail yang benar
- [ ] Toast notifications muncul dengan benar

### Integration Testing
- [ ] Template apply mengupdate kolom selector
- [ ] Template apply mengupdate filter builder
- [ ] Template apply mengupdate related data selector
- [ ] Data tersimpan ke database dengan benar
- [ ] Data ter-load dari database dengan benar

### UI/UX Testing
- [ ] Dropdown menampilkan system dan user templates dengan benar
- [ ] Icons dan badges tampil dengan benar
- [ ] Dialog save template responsive
- [ ] Card info template responsive
- [ ] Timestamp format dengan benar (id-ID locale)

## Migration Steps

### 1. Apply Database Migration
```bash
# Jika menggunakan Supabase CLI
supabase db push

# Atau apply manual via Supabase Dashboard
# SQL Editor > New Query > Paste migration content > Run
```

### 2. Verify Column Added
```sql
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'profiles' 
  AND column_name = 'data_builder_templates';
```

### 3. Test in Development
1. Login sebagai user
2. Buka menu Data Builder
3. Test system presets
4. Test save/load/delete user templates

## Benefits

### Untuk User
- **Efisiensi**: Setup cepat dengan preset templates
- **Konsistensi**: Query yang sama bisa digunakan berulang kali
- **Fleksibilitas**: Bisa save konfigurasi custom
- **Produktivitas**: Tidak perlu setup ulang kolom dan filter setiap kali

### Untuk Admin
- **Standardisasi**: System presets memastikan query standar
- **Best Practices**: Template mencontohkan cara query yang baik
- **Dokumentasi**: Template name dan description sebagai dokumentasi

## Future Enhancements (Optional)

1. **Share Templates**: User bisa share template ke user lain
2. **Template Categories**: Grouping templates by category
3. **Template Export/Import**: Export template sebagai JSON file
4. **Template Versioning**: Track perubahan template
5. **Template Analytics**: Track template usage statistics
6. **Template Validation**: Validate template sebelum save
7. **Template Duplication**: Duplicate existing template untuk modifikasi

## Notes
- Feature ini menggabungkan "preset filter templates" dan "save & load queries" menjadi satu kesatuan
- System presets tidak bisa diubah atau dihapus untuk menjaga konsistensi
- User templates tersimpan per-user di profiles table
- Template hanya menyimpan konfigurasi, bukan hasil query
