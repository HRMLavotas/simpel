# ✅ Peta Jabatan Non-ASN - Formasi, Existing, Status

## Implementasi Baru

Peta Jabatan Non-ASN sekarang memiliki struktur yang mirip dengan Peta Jabatan ASN, dengan kolom:
- **Formasi**: Jumlah pegawai dengan jabatan yang sama
- **Existing**: Jumlah pegawai yang saat ini mengisi jabatan tersebut
- **Status**: Perbandingan Formasi vs Existing (Sesuai/Kurang/Lebih)

## Tampilan Baru

### Sebelum:
```
┌────┬──────────────┬─────────────┬──────────┬──────────┬──────────┬──────────┐
│ No │ NIK/NIP      │ Nama        │ Jabatan  │ Gender   │ Type     │ Deskripsi│
├────┼──────────────┼─────────────┼──────────┼──────────┼──────────┼──────────┤
│ 1  │ 327601230... │ Ahmad       │ Pengemudi│ L        │ Alih Daya│ ...      │
│ 2  │ 317409110... │ Budi        │ Pengemudi│ L        │ Alih Daya│ ...      │
│ 3  │ 327503440... │ Citra       │ Kebersihan│ P       │ Alih Daya│ ...      │
└────┴──────────────┴─────────────┴──────────┴──────────┴──────────┴──────────┘
```

### Sesudah:
```
┌────┬──────────┬────────┬─────────┬─────────────┬──────────┬────────┐
│ No │ Jabatan  │Formasi │Existing │ Nama        │ Type     │ Status │
├────┼──────────┼────────┼─────────┼─────────────┼──────────┼────────┤
│ 1  │Pengemudi │   5    │    5    │ Ahmad       │Alih Daya │        │
│    │          │        │         │ Budi        │Alih Daya │ Sesuai │
│    │          │        │         │ Citra       │Alih Daya │        │
│    │          │        │         │ Dedi        │Alih Daya │        │
│    │          │        │         │ Eko         │Alih Daya │        │
├────┼──────────┼────────┼─────────┼─────────────┼──────────┼────────┤
│ 2  │Kebersihan│   10   │   10    │ Fitri       │Alih Daya │        │
│    │          │        │         │ Gita        │Alih Daya │        │
│    │          │        │         │ ...         │...       │ Sesuai │
└────┴──────────┴────────┴─────────┴─────────────┴──────────┴────────┘
```

## Cara Kerja

### 1. Grouping by Position
```typescript
// Group employees by position_name
const groupedByPosition: Record<string, EmployeeMatch[]> = {};
nonAsnEmployees.forEach(emp => {
  const position = emp.position_name || 'Tidak Ada Jabatan';
  if (!groupedByPosition[position]) {
    groupedByPosition[position] = [];
  }
  groupedByPosition[position].push(emp);
});
```

### 2. Calculate Formasi & Existing
```typescript
Object.entries(groupedByPosition).map(([position, employees]) => {
  const formasi = employees.length;    // Jumlah pegawai dengan jabatan sama
  const existing = employees.length;   // Sama dengan formasi (data aktual)
  const status = formasi - existing;   // Selalu 0 (Sesuai)
  
  // ...
});
```

### 3. Render with rowSpan
```typescript
employees.map((emp, idx) => {
  const isFirst = idx === 0;
  
  return (
    <TableRow key={emp.id}>
      {isFirst && (
        <>
          <TableCell rowSpan={employees.length}>No</TableCell>
          <TableCell rowSpan={employees.length}>Jabatan</TableCell>
          <TableCell rowSpan={employees.length}>Formasi</TableCell>
          <TableCell rowSpan={employees.length}>Existing</TableCell>
        </>
      )}
      <TableCell>Nama Pegawai</TableCell>
      <TableCell>Type Non ASN</TableCell>
      {isFirst && (
        <TableCell rowSpan={employees.length}>Status</TableCell>
      )}
    </TableRow>
  );
});
```

## Struktur Tabel

### Kolom:
1. **No** - Nomor urut jabatan (bukan pegawai)
2. **Jabatan** - Nama jabatan (grouped)
3. **Formasi** - Jumlah pegawai dengan jabatan yang sama
4. **Existing** - Jumlah pegawai yang saat ini ada (sama dengan Formasi)
5. **Nama Pemangku** - Nama pegawai (satu baris per pegawai)
6. **Type Non ASN** - Tenaga Alih Daya / Tenaga Ahli
7. **Status** - Sesuai (karena Formasi = Existing)

### rowSpan:
- **No, Jabatan, Formasi, Existing, Status** → rowSpan = jumlah pegawai
- **Nama Pemangku, Type Non ASN** → Tidak ada rowSpan (satu baris per pegawai)

## Contoh Data

### Input (Database):
```
employees:
- Ahmad (Pengemudi)
- Budi (Pengemudi)
- Citra (Pengemudi)
- Dedi (Petugas Kebersihan)
- Eko (Petugas Kebersihan)
- Fitri (Petugas Kebersihan)
- Gita (Pramubakti)
```

### Output (Tabel):
```
┌────┬──────────────────┬────────┬─────────┬────────┬──────────────┬────────┐
│ No │ Jabatan          │Formasi │Existing │ Nama   │ Type Non ASN │ Status │
├────┼──────────────────┼────────┼─────────┼────────┼──────────────┼────────┤
│ 1  │ Pengemudi        │   3    │    3    │ Ahmad  │ Alih Daya    │        │
│    │                  │        │         │ Budi   │ Alih Daya    │ Sesuai │
│    │                  │        │         │ Citra  │ Alih Daya    │        │
├────┼──────────────────┼────────┼─────────┼────────┼──────────────┼────────┤
│ 2  │ Petugas Kebersih │   3    │    3    │ Dedi   │ Alih Daya    │        │
│    │                  │        │         │ Eko    │ Alih Daya    │ Sesuai │
│    │                  │        │         │ Fitri  │ Alih Daya    │        │
├────┼──────────────────┼────────┼─────────┼────────┼──────────────┼────────┤
│ 3  │ Pramubakti       │   1    │    1    │ Gita   │ Alih Daya    │ Sesuai │
└────┴──────────────────┴────────┴─────────┴────────┴──────────────┴────────┘
```

## Tab Summary

Tab trigger sekarang menampilkan jumlah jabatan dan pegawai:

```
[Peta Jabatan ASN (36 jabatan, 53 pegawai)] [Formasi Non-ASN (7 jabatan, 150 pegawai)]
```

### Perhitungan Jumlah Jabatan:
```typescript
const uniquePositions = new Set(
  nonAsnEmployees.map(e => e.position_name || 'Tidak Ada Jabatan')
);
return uniquePositions.size;
```

## Keuntungan

### ✅ Konsisten dengan Peta Jabatan ASN
- Struktur tabel mirip dengan Peta Jabatan ASN
- Mudah dipahami oleh user yang sudah familiar dengan Peta Jabatan ASN

### ✅ Informasi Lebih Jelas
- Langsung terlihat berapa banyak pegawai per jabatan
- Mudah identifikasi jabatan mana yang paling banyak pegawainya

### ✅ Grouped by Position
- Pegawai dengan jabatan yang sama dikelompokkan
- Lebih mudah dibaca daripada list flat

### ✅ Status Formasi
- Menampilkan status "Sesuai" untuk setiap jabatan
- Siap untuk future enhancement (jika nanti ada target formasi yang berbeda)

## Future Enhancement

Jika nanti ingin menambahkan target formasi yang berbeda dari existing:

### 1. Tambah Tabel `non_asn_positions`
```sql
CREATE TABLE non_asn_positions (
  id UUID PRIMARY KEY,
  department TEXT,
  position_name TEXT,
  target_formasi INTEGER,
  created_at TIMESTAMP
);
```

### 2. Update Logic
```typescript
// Fetch target formasi from database
const targetFormasi = await fetchTargetFormasi(department);

// Calculate status
const formasi = targetFormasi[position] || employees.length;
const existing = employees.length;
const status = formasi - existing;

// Display status
if (status > 0) {
  return <Badge variant="warning">Kurang {status}</Badge>;
} else if (status < 0) {
  return <Badge variant="info">Lebih {Math.abs(status)}</Badge>;
} else {
  return <Badge variant="success">Sesuai</Badge>;
}
```

### 3. Add CRUD for Target Formasi
- Admin Pusat bisa set target formasi per jabatan
- Sistem akan compare target vs existing
- Status akan update otomatis

## Testing Checklist

- [ ] Buka Peta Jabatan
- [ ] Pilih unit kerja yang ada Non-ASN
- [ ] Klik tab "Formasi Non-ASN"
- [ ] Verifikasi pegawai dikelompokkan berdasarkan jabatan
- [ ] Verifikasi kolom Formasi = jumlah pegawai per jabatan
- [ ] Verifikasi kolom Existing = sama dengan Formasi
- [ ] Verifikasi kolom Status = "Sesuai"
- [ ] Verifikasi rowSpan berfungsi dengan benar
- [ ] Verifikasi tab summary menampilkan jumlah jabatan dan pegawai

## Notes

### Formasi = Existing (Saat Ini)
Karena kita belum punya tabel target formasi, maka:
- **Formasi** = Jumlah pegawai yang saat ini ada
- **Existing** = Sama dengan Formasi
- **Status** = Selalu "Sesuai"

Ini adalah implementasi fase 1. Jika nanti ada requirement untuk set target formasi yang berbeda, kita bisa enhance dengan menambahkan tabel dan CRUD untuk target formasi.

---

**Status**: ✅ Implemented - Ready for Testing

Silakan hard refresh browser (Ctrl+Shift+R) untuk melihat tampilan baru!
