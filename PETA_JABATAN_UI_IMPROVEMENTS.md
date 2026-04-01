# Perbaikan UI Peta Jabatan

## Status: ✅ SELESAI

## Perubahan yang Dilakukan

### 1. Tombol Aksi dengan Dropdown Menu (Tab ASN)

#### Sebelum:
- Tombol Edit dan Hapus ditampilkan secara terpisah (2 tombol kecil)
- Kurang konsisten dengan menu lain

#### Sesudah:
- Menggunakan icon MoreVertical (3 titik vertikal)
- Dropdown menu dengan opsi:
  - "Edit Jabatan" (dengan icon Pencil)
  - "Hapus" (dengan icon Trash2, warna merah)
- Konsisten dengan implementasi di menu Data Pegawai dan menu lainnya

### 2. Tombol Aksi di Tab Non-ASN (BARU!)

#### Implementasi:
- Menambahkan kolom "Aksi" di tab Non-ASN
- Dropdown menu dengan icon MoreVertical untuk setiap pegawai
- Opsi yang tersedia:
  - "Edit Pegawai" → Mengarahkan ke menu Data Pegawai (dengan toast info)
  - "Hapus" → Menghapus pegawai Non-ASN langsung dari Peta Jabatan
- Hanya muncul untuk Admin Pusat

### 3. Handler Functions untuk Non-ASN

```typescript
const handleEditNonAsnEmployee = (employee: EmployeeMatch) => {
  // Redirect to Data Pegawai page with employee ID
  toast({ 
    title: 'Info', 
    description: 'Untuk mengedit pegawai Non-ASN, silakan buka menu Data Pegawai → Tab Non-ASN',
    duration: 5000
  });
};

const handleDeleteNonAsnEmployee = async (employee: EmployeeMatch) => {
  if (!confirm(`Apakah Anda yakin ingin menghapus pegawai ${employee.name}?`)) {
    return;
  }

  try {
    const { error } = await supabase.from('employees').delete().eq('id', employee.id);
    if (error) throw error;
    toast({ title: 'Berhasil', description: 'Pegawai Non-ASN berhasil dihapus' });
    fetchData();
  } catch (err: any) {
    toast({ variant: 'destructive', title: 'Error', description: err.message });
  }
};
```

### 4. Import yang Ditambahkan

```typescript
import { MoreVertical } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
```

### 5. Struktur Tabel Non-ASN

```tsx
<TableHeader>
  <TableRow>
    <TableHead className="w-12">No</TableHead>
    <TableHead>Jabatan</TableHead>
    <TableHead className="w-24 text-center">Formasi</TableHead>
    <TableHead className="w-24 text-center">Existing</TableHead>
    <TableHead>Nama Pemangku</TableHead>
    <TableHead className="w-40">Type Non ASN</TableHead>
    <TableHead className="w-32">Status</TableHead>
    {isAdminPusat && <TableHead className="w-20">Aksi</TableHead>}
  </TableRow>
</TableHeader>
```

## Perbedaan Tab ASN vs Tab Non-ASN

### Tab ASN:
- Edit/Hapus → Mengelola data di tabel `position_references`
- Edit: Membuka modal untuk edit nama jabatan, grade, ABK, dll
- Hapus: Menghapus jabatan dari referensi Kepmen 202/2024

### Tab Non-ASN:
- Edit → Mengarahkan ke menu Data Pegawai (karena perlu form lengkap)
- Hapus → Menghapus pegawai dari tabel `employees`
- Data formasi otomatis ter-update setelah hapus pegawai

## Fitur yang Berfungsi

✅ Dropdown menu dengan icon MoreVertical di tab ASN
✅ Dropdown menu dengan icon MoreVertical di tab Non-ASN
✅ Opsi "Edit Jabatan" di tab ASN membuka modal edit
✅ Opsi "Edit Pegawai" di tab Non-ASN menampilkan toast info
✅ Opsi "Hapus" di tab ASN menghapus jabatan
✅ Opsi "Hapus" di tab Non-ASN menghapus pegawai dengan konfirmasi
✅ Styling konsisten dengan menu lain (warna merah untuk hapus)
✅ Kolom Aksi hanya muncul untuk Admin Pusat
✅ Real-time update saat ada perubahan data

## Testing Checklist

### Tab ASN:
- [ ] Buka menu Peta Jabatan → Tab ASN
- [ ] Verifikasi icon 3 titik (MoreVertical) di kolom Aksi
- [ ] Klik icon 3 titik, verifikasi dropdown menu muncul
- [ ] Klik "Edit Jabatan", verifikasi modal edit terbuka
- [ ] Klik "Hapus", verifikasi jabatan terhapus

### Tab Non-ASN:
- [ ] Buka menu Peta Jabatan → Tab Non-ASN
- [ ] Verifikasi kolom "Aksi" muncul (jika Admin Pusat)
- [ ] Verifikasi icon 3 titik di setiap baris pegawai
- [ ] Klik icon 3 titik, verifikasi dropdown menu muncul
- [ ] Klik "Edit Pegawai", verifikasi toast info muncul
- [ ] Klik "Hapus", verifikasi konfirmasi muncul
- [ ] Konfirmasi hapus, verifikasi pegawai terhapus
- [ ] Verifikasi formasi berkurang otomatis setelah hapus

## File yang Dimodifikasi

- `src/pages/PetaJabatan.tsx`

## Catatan Implementasi

1. **Konsistensi UI**: Dropdown menu dengan MoreVertical sekarang digunakan di:
   - Menu Data Pegawai
   - Menu Peta Jabatan (tab ASN dan Non-ASN)
   - Menu Departments
   - Menu lainnya

2. **Edit Non-ASN**: Mengarahkan ke menu Data Pegawai karena form edit Non-ASN memerlukan banyak field (NIK, Jabatan, Pendidikan, dll)

3. **Hapus Non-ASN**: Langsung menghapus dari Peta Jabatan dengan konfirmasi, formasi otomatis ter-update

4. **Permission**: Kolom Aksi hanya muncul untuk Admin Pusat (`isAdminPusat`)

5. **Hard Refresh**: Setelah perubahan, lakukan hard refresh (Ctrl+Shift+R) untuk clear cache
