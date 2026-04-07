# Fix: Data Grade Tidak Muncul untuk Setditjen Binalavotas

## Masalah
Ketika memilih "Setditjen Binalavotas" di dropdown Peta Jabatan, kolom Grade tidak menampilkan data (menampilkan "-"), sedangkan unit kerja lain menampilkan data grade dengan normal.

## Analisis
Setelah memeriksa kode:
1. Query untuk mengambil data sudah benar dan mengambil field `grade`
2. Tampilan menggunakan `{pos.grade || '-'}` yang akan menampilkan "-" jika grade null
3. Tidak ada kondisi khusus yang mem-filter atau mengubah data untuk "Setditjen Binalavotas"

## Kesimpulan
**Ini bukan bug kode, tetapi masalah data di database.**

Data grade untuk jabatan di "Setditjen Binalavotas" kemungkinan:
- Belum diisi (NULL) di tabel `position_references`
- Atau memang sengaja dikosongkan

## Solusi

### Opsi 1: Isi Data Grade Manual (Recommended)
Masuk sebagai Admin Pusat dan edit setiap jabatan di "Setditjen Binalavotas" untuk mengisi grade:
1. Buka menu Peta Jabatan
2. Pilih "Setditjen Binalavotas"
3. Klik icon titik tiga (⋮) pada setiap jabatan
4. Pilih "Edit Jabatan"
5. Isi field "Grade/Kelas"
6. Simpan

### Opsi 2: Update Database Langsung
Jika ingin mengisi banyak data sekaligus, bisa update langsung via SQL:

```sql
-- Contoh: Set grade untuk semua jabatan Struktural di Setditjen Binalavotas
UPDATE position_references
SET grade = 17
WHERE department = 'Setditjen Binalavotas'
  AND position_category = 'Struktural'
  AND grade IS NULL;

-- Contoh: Set grade untuk jabatan tertentu
UPDATE position_references
SET grade = 15
WHERE department = 'Setditjen Binalavotas'
  AND position_name = 'Kepala Seksi';
```

### Opsi 3: Import Data Grade
Jika ada file Excel dengan data grade yang lengkap:
1. Export data Peta Jabatan untuk "Setditjen Binalavotas"
2. Isi kolom "Grade/Kelas Jabatan" di Excel
3. Import kembali (perlu fitur import untuk position_references)

## Verifikasi
Setelah mengisi data grade, refresh halaman Peta Jabatan dan pilih "Setditjen Binalavotas". Kolom Grade seharusnya sudah menampilkan angka grade yang diisi.

## Catatan
- Grade biasanya berkisar dari 1-17 untuk jabatan struktural
- Grade untuk jabatan fungsional bervariasi tergantung jenis jabatan
- Jika grade memang tidak diperlukan untuk unit tertentu, biarkan kosong (akan tampil "-")

---
**Tanggal**: 6 April 2026
**Status**: Bukan bug - Data grade perlu diisi di database
