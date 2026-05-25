# 🧪 Testing Guide: Sheet "Jumlah ASN per Unit" - Kolom Baru

## ✅ Quick Summary

**Perubahan:** Memisahkan kolom "JUMLAH ASN (PNS + CPNS + PPPK)" menjadi 3 kolom terpisah:
- Jumlah PNS
- Jumlah CPNS
- Jumlah PPPK

**Lokasi:**
1. Export Peta Jabatan Semua Unit → Sheet "Jumlah ASN per Unit"
2. Export Agregasi Cepat → Sheet "Jumlah ASN per Unit"

---

## 🎯 Testing Steps

### Test 1: Export Peta Jabatan Semua Unit

#### Step 1: Login dan Navigasi
```
1. Login sebagai Admin Pusat
2. Klik menu "Peta Jabatan"
3. Tunggu data dimuat
```

#### Step 2: Export Excel
```
4. Klik tombol "Export Peta Jabatan Semua Unit"
5. Tunggu proses export (toast notification muncul)
6. File Excel akan otomatis terdownload
```

#### Step 3: Verifikasi File Excel
```
7. Buka file Excel yang didownload
8. Cari sheet "Jumlah ASN per Unit" (biasanya sheet ke-4)
9. Verifikasi struktur kolom
```

#### Step 4: Verifikasi Kolom
```
Pastikan ada 8 kolom dengan urutan:
✅ Kolom A: No
✅ Kolom B: Nama Unit kerja
✅ Kolom C: Jumlah PNS ⭐ BARU
✅ Kolom D: Jumlah CPNS ⭐ BARU
✅ Kolom E: Jumlah PPPK ⭐ BARU
✅ Kolom F: JUMLAH ASN (PNS + CPNS + PPPK)
✅ Kolom G: Jumlah Tenaga Non ASN / Outsourcing
✅ Kolom H: Jumlah Keseluruhan Pegawai ⭐ RENAMED
```

#### Step 5: Verifikasi Data
```
Pilih salah satu baris (contoh: Setditjen Binalavotas)
Verifikasi formula:
✅ Kolom C + Kolom D + Kolom E = Kolom F
   (Jumlah PNS + Jumlah CPNS + Jumlah PPPK = JUMLAH ASN)
   
✅ Kolom F + Kolom G = Kolom H
   (JUMLAH ASN + Jumlah Non ASN = Jumlah Keseluruhan)
```

#### Step 6: Verifikasi Baris JUMLAH
```
Scroll ke baris terakhir (baris JUMLAH)
Verifikasi:
✅ Kolom B = "JUMLAH"
✅ Kolom C = Total semua Jumlah PNS
✅ Kolom D = Total semua Jumlah CPNS
✅ Kolom E = Total semua Jumlah PPPK
✅ Kolom F = Total semua JUMLAH ASN
✅ Kolom G = Total semua Jumlah Non ASN
✅ Kolom H = Total semua Jumlah Keseluruhan
```

#### Step 7: Verifikasi Styling
```
✅ Header (baris 1): Background biru, font putih bold
✅ Data rows: Background putih, border hitam
✅ Baris JUMLAH: Background kuning muda, font bold
✅ Semua cell memiliki border
✅ Column width sesuai dengan panjang data
```

---

### Test 2: Export Agregasi Cepat

#### Step 1: Login dan Navigasi
```
1. Login sebagai Admin Pusat
2. Klik menu "Data Builder"
3. Klik tab "Agregasi Cepat"
4. Tunggu data dimuat
```

#### Step 2: Export Excel
```
5. Klik tombol "Export Excel"
6. Tunggu proses export (toast notification muncul)
7. File Excel akan otomatis terdownload
```

#### Step 3: Verifikasi File Excel
```
8. Buka file Excel yang didownload
9. Cari sheet "Jumlah ASN per Unit" (biasanya sheet ke-12)
10. Verifikasi struktur kolom (sama dengan Test 1)
```

#### Step 4: Konsistensi Data
```
Bandingkan dengan hasil Export Peta Jabatan:
✅ Jumlah baris harus sama
✅ Nama unit kerja harus sama
✅ Data PNS, CPNS, PPPK harus identik
✅ Total di baris JUMLAH harus sama
```

---

## ✅ Validation Checklist

### Struktur Kolom
- [ ] Sheet memiliki 8 kolom
- [ ] Kolom C: "Jumlah PNS" (baru)
- [ ] Kolom D: "Jumlah CPNS" (baru)
- [ ] Kolom E: "Jumlah PPPK" (baru)
- [ ] Kolom H: "Jumlah Keseluruhan Pegawai" (renamed)

### Formula Validation
- [ ] PNS + CPNS + PPPK = JUMLAH ASN ✅
- [ ] JUMLAH ASN + Non ASN = Jumlah Keseluruhan ✅
- [ ] Sum(Jumlah PNS per unit) = Total PNS di JUMLAH ✅
- [ ] Sum(Jumlah CPNS per unit) = Total CPNS di JUMLAH ✅
- [ ] Sum(Jumlah PPPK per unit) = Total PPPK di JUMLAH ✅

### Data Quality
- [ ] Tidak ada cell kosong (kecuali kolom No di baris JUMLAH)
- [ ] Semua angka adalah integer (tidak ada desimal)
- [ ] Tidak ada nilai negatif
- [ ] Jumlah CPNS relatif kecil (< 10 biasanya)

### Styling
- [ ] Header berwarna biru dengan font putih bold
- [ ] Baris JUMLAH berwarna kuning muda dengan font bold
- [ ] Semua cell memiliki border hitam tipis
- [ ] Column width sesuai dengan panjang data
- [ ] Text alignment: center untuk angka, left untuk nama unit

### Konsistensi
- [ ] Data sama antara Export Peta Jabatan dan Agregasi Cepat
- [ ] Urutan unit kerja sesuai OFFICIAL_DEPT_ORDER
- [ ] Baris JUMLAH selalu di posisi terakhir

---

## 🐛 Common Issues & Solutions

### Issue 1: Kolom masih 5 (belum 8)
```
Penyebab: Browser cache belum di-clear
Solusi:
1. Hard refresh browser (Ctrl + Shift + R)
2. Clear browser cache
3. Logout dan login kembali
4. Coba export lagi
```

### Issue 2: Data PNS + CPNS + PPPK ≠ JUMLAH ASN
```
Penyebab: Ada pegawai dengan asn_status yang tidak valid
Solusi:
1. Cek data pegawai di database
2. Pastikan asn_status hanya: 'PNS', 'CPNS', 'PPPK', 'Non ASN'
3. Jalankan data audit untuk identifikasi masalah
```

### Issue 3: Baris JUMLAH tidak muncul
```
Penyebab: Bug di kode (seharusnya tidak terjadi)
Solusi:
1. Cek console browser untuk error
2. Cek network tab untuk error API
3. Report ke developer
```

### Issue 4: Styling tidak sesuai
```
Penyebab: Library xlsx-js-style tidak terinstall
Solusi:
1. Cek package.json
2. Pastikan "xlsx-js-style" ada di dependencies
3. Run: npm install
4. Rebuild aplikasi
```

---

## 📊 Sample Data for Validation

### Contoh Baris Data yang Valid:

```
No: 1
Nama Unit kerja: Setditjen Binalavotas
Jumlah PNS: 95
Jumlah CPNS: 2
Jumlah PPPK: 23
JUMLAH ASN: 120 (95 + 2 + 23 = 120 ✅)
Jumlah Non ASN: 15
Jumlah Keseluruhan: 135 (120 + 15 = 135 ✅)
```

### Contoh Baris JUMLAH yang Valid:

```
No: (kosong)
Nama Unit kerja: JUMLAH
Jumlah PNS: 416
Jumlah CPNS: 6
Jumlah PPPK: 96
JUMLAH ASN: 518 (416 + 6 + 96 = 518 ✅)
Jumlah Non ASN: 55
Jumlah Keseluruhan: 573 (518 + 55 = 573 ✅)
```

---

## 🎯 Expected Results

### Export Peta Jabatan Semua Unit
```
✅ File: peta-jabatan-semua-unit-YYYY-MM-DD.xlsx
✅ Sheet: "Jumlah ASN per Unit" (posisi ke-4)
✅ Jumlah baris: 45+ (tergantung jumlah unit)
✅ Jumlah kolom: 8
✅ Baris JUMLAH: Ada di baris terakhir
```

### Export Agregasi Cepat
```
✅ File: agregasi-cepat-YYYY-MM-DD.xlsx
✅ Sheet: "Jumlah ASN per Unit" (posisi ke-12)
✅ Jumlah baris: 45+ (tergantung jumlah unit)
✅ Jumlah kolom: 8
✅ Baris JUMLAH: Ada di baris terakhir
```

---

## 📝 Test Report Template

```
=== TEST REPORT ===
Date: [YYYY-MM-DD]
Tester: [Nama]
Browser: [Chrome/Firefox/Edge]
Version: [Versi Browser]

Test 1: Export Peta Jabatan Semua Unit
[ ] PASS / [ ] FAIL
Notes: _______________________________

Test 2: Export Agregasi Cepat
[ ] PASS / [ ] FAIL
Notes: _______________________________

Validation Checklist:
[ ] Struktur kolom (8 kolom)
[ ] Formula PNS + CPNS + PPPK = JUMLAH ASN
[ ] Formula JUMLAH ASN + Non ASN = Keseluruhan
[ ] Baris JUMLAH ada dan benar
[ ] Styling sesuai spesifikasi
[ ] Konsistensi data antar export

Issues Found:
1. _______________________________
2. _______________________________

Overall Result: [ ] PASS / [ ] FAIL
```

---

## 🎉 Success Criteria

Test dianggap **BERHASIL** jika:

1. ✅ Export Peta Jabatan Semua Unit berhasil
2. ✅ Export Agregasi Cepat berhasil
3. ✅ Sheet "Jumlah ASN per Unit" memiliki 8 kolom
4. ✅ Kolom baru (PNS, CPNS, PPPK) menampilkan data yang benar
5. ✅ Formula validasi terpenuhi (PNS + CPNS + PPPK = JUMLAH ASN)
6. ✅ Baris JUMLAH menampilkan total yang benar
7. ✅ Styling Excel sesuai spesifikasi
8. ✅ Data konsisten antara kedua export
9. ✅ Tidak ada error di console browser
10. ✅ File Excel dapat dibuka tanpa error

---

**Ready for Testing** ✅

Silakan ikuti langkah-langkah di atas dan laporkan hasilnya!
