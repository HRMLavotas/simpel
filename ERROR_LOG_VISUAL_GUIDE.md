# Visual Guide: Error Log di Import Non-ASN

## Tampilan Lengkap

```
┌─────────────────────────────────────────────────────────────────────┐
│ Import Data Non-ASN                                                 │
│ Import data tenaga Non-ASN dari file Excel                          │
│ 💡 Sebagai Admin Pusat, Anda dapat mengimport ke berbagai unit     │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│ Upload File Excel                                                   │
│ Download template terlebih dahulu, isi data, lalu upload kembali   │
│                                                                     │
│ [Download Template]                                                 │
│                                                                     │
│ ┌─────────────────────────────────────────────────────────────┐   │
│ │ 📄 Nominatif_Non_ASN_2026.xlsx                              │   │
│ │ 156.32 KB                                                   [X] │
│ └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│ Preview Data Non-ASN (750 valid, 22 error dari 772 total)          │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│ ℹ️ Distribusi Unit Kerja                                            │
│                                                                     │
│ Data akan diimport ke unit kerja masing-masing:                    │
│                                                                     │
│ [Setditjen Binalavotas: 250]  [Bina Stankomproglat: 200]          │
│ [Bina Marga: 180]  [Bina Penataan Bangunan: 120]                  │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│ Preview Table (Scrollable)                                          │
├──────┬──────────────┬─────────────┬──────────┬─────────┬──────────┤
│Baris │ NIK          │ Nama        │ Jabatan  │ Unit    │ Status   │
├──────┼──────────────┼─────────────┼──────────┼─────────┼──────────┤
│  2   │ 327601230... │ Ahmad Fauzi │ Pengemudi│ Setdit..│ ✓ Valid  │
│  3   │ 317409110... │ Budi Santo..│ Kebersi..│ Bina M..│ ✓ Valid  │
│  4   │ 327503440... │ Citra Dewi  │ Pramubak.│ Bina S..│ ✓ Valid  │
│  5   │ -            │ Dedi Kurnia │ Pengemudi│ Setdit..│ NIK wajib│
│  6   │ 320123456... │ -           │ Kebersi..│ Bina M..│ Nama waj.│
│ ...  │ ...          │ ...         │ ...      │ ...     │ ...      │
└──────┴──────────────┴─────────────┴──────────┴─────────┴──────────┘
```

## Error Log Section (Muncul Jika Ada Error)

```
┌─────────────────────────────────────────────────────────────────────┐
│ ⚠️ Ditemukan 22 Error                                               │
│                                                                     │
│ Perbaiki error di bawah ini sebelum melakukan import.              │
│ Data dengan error tidak akan diimport.                             │
│                                                                     │
│ [NIK kosong: 8]  [Nama kosong: 5]  [Jabatan kosong: 6]            │
│ [Unit kerja tidak valid: 3]                                        │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│ Detail Error                                                        │
├──────┬──────────────────┬─────────────────┬─────────────────────────┤
│Baris │ NIK              │ Nama            │ Error                   │
├──────┼──────────────────┼─────────────────┼─────────────────────────┤
│  5   │ -                │ Dedi Kurniawan  │ NIK wajib diisi         │
│  6   │ 3201234567890123 │ -               │ Nama wajib diisi        │
│  12  │ 3301234567890124 │ Eko Prasetyo    │ Jabatan wajib diisi     │
│  18  │ 3401234567890125 │ Fitri Handayani │ NIK wajib diisi         │
│  25  │ 3501234567890126 │ Gita Savitri    │ Nama wajib diisi        │
│  32  │ 3601234567890127 │ Hadi Wijaya     │ Unit kerja "Direktorat  │
│      │                  │                 │ XYZ" tidak ditemukan.   │
│      │                  │                 │ Gunakan nama unit kerja │
│      │                  │                 │ yang sesuai.            │
│  45  │ -                │ Indra Gunawan   │ NIK wajib diisi         │
│  58  │ 3701234567890128 │ -               │ Nama wajib diisi        │
│  67  │ 3801234567890129 │ Joko Susilo     │ Jabatan wajib diisi     │
│  78  │ -                │ Kartika Sari    │ NIK wajib diisi         │
│ ...  │ ...              │ ...             │ ...                     │
└──────┴──────────────────┴─────────────────┴─────────────────────────┘
                                                    ↕️ Scrollable
```

## Tombol Import

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│              [📤 Import 750 Data Valid]                             │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

## Color Scheme

### Error Alert (Red)
```
┌─────────────────────────────────────────────────────────────────────┐
│ 🔴 ⚠️ Ditemukan 22 Error                                            │
│ ┌─────────────────────────────────────────────────────────────────┐ │
│ │ Background: Light Red (destructive/5)                           │ │
│ │ Border: Red (destructive/30)                                    │ │
│ │ Text: Dark Red (destructive)                                    │ │
│ └─────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

### Error Badges
```
[NIK kosong: 8]  ← Red badge with dark red text
[Nama kosong: 5] ← Red badge with dark red text
```

### Error Table
```
┌─────────────────────────────────────────────────────────────────────┐
│ Background: Light Red (bg-destructive/5)                            │
│ Border: Red (border-destructive/30)                                 │
│ Header: White background (sticky)                                   │
│ Error Text: Dark Red (text-destructive)                             │
└─────────────────────────────────────────────────────────────────────┘
```

## Responsive Design

### Desktop (>768px)
```
┌─────────────────────────────────────────────────────────────────────┐
│ Full width table with all columns visible                           │
│ Error log side by side with preview                                 │
└─────────────────────────────────────────────────────────────────────┘
```

### Mobile (<768px)
```
┌───────────────────────────┐
│ Scrollable table          │
│ Error log below preview   │
│ Stacked layout            │
└───────────────────────────┘
```

## User Flow

### Step 1: Upload File
```
User uploads Excel → System parses → Detects 22 errors
```

### Step 2: View Preview
```
User scrolls through preview table
↓
Sees red rows with error messages in Status column
↓
Wants more detail about errors
```

### Step 3: View Error Log
```
User scrolls down below preview
↓
Sees error summary: "NIK kosong: 8, Nama kosong: 5, ..."
↓
Sees detailed error table with row numbers
```

### Step 4: Fix Errors
```
User opens Excel
↓
Goes to row 5, fills NIK
↓
Goes to row 6, fills Nama
↓
Goes to row 12, fills Jabatan
↓
Saves Excel
```

### Step 5: Re-upload
```
User uploads fixed Excel
↓
System parses → Detects 0 errors
↓
Preview shows: "772 valid, 0 error dari 772 total"
↓
No error log section (hidden)
↓
Import button enabled
```

### Step 6: Import
```
User clicks "Import 772 Data Valid"
↓
System imports all data
↓
Success message: "772 data berhasil diimport"
```

## Edge Cases

### All Data Valid
```
┌─────────────────────────────────────────────────────────────────────┐
│ Preview Data Non-ASN (772 valid, 0 error dari 772 total)           │
└─────────────────────────────────────────────────────────────────────┘

[Preview Table - All rows with ✓ Valid status]

[No Error Log Section - Hidden]

[📤 Import 772 Data Valid] ← Enabled
```

### All Data Error
```
┌─────────────────────────────────────────────────────────────────────┐
│ Preview Data Non-ASN (0 valid, 772 error dari 772 total)           │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│ 🔴 Semua Data Error                                                 │
│                                                                     │
│ Kemungkinan format header Excel tidak sesuai. Pastikan:            │
│ • Header ada di baris pertama                                      │
│ • Kolom wajib: NIK, Nama, Jabatan                                  │
│ • Tidak ada baris kosong di atas header                            │
│ • Gunakan template yang sudah disediakan                           │
└─────────────────────────────────────────────────────────────────────┘

[Preview Table - All rows with error status]

┌─────────────────────────────────────────────────────────────────────┐
│ ⚠️ Ditemukan 772 Error                                              │
│ [Error summary and detail table]                                    │
└─────────────────────────────────────────────────────────────────────┘

[📤 Import 0 Data Valid] ← Disabled
```

### Mixed Valid and Error
```
┌─────────────────────────────────────────────────────────────────────┐
│ Preview Data Non-ASN (750 valid, 22 error dari 772 total)          │
└─────────────────────────────────────────────────────────────────────┘

[Preview Table - Mix of ✓ Valid and error rows]

┌─────────────────────────────────────────────────────────────────────┐
│ ⚠️ Ditemukan 22 Error                                               │
│ [Error summary and detail table with 22 rows]                       │
└─────────────────────────────────────────────────────────────────────┘

[📤 Import 750 Data Valid] ← Enabled (will import only valid data)
```

---

**Visual Guide Complete!**

Fitur error log sekarang memberikan feedback yang jelas dan actionable untuk user. 🎉
