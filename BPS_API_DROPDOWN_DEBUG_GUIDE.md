# BPS API Dropdown Provinsi - Panduan Debug

## Status Saat Ini
- ✅ BPS API Key sudah dikonfigurasi: `49b3ee3219c4030633b6fff5e581ddc5`
- ✅ Proxy Vite sudah dikonfigurasi dengan benar
- ✅ Kode fetch provinces sudah benar
- ❌ Dropdown provinsi tidak berfungsi

## Langkah-Langkah Debug

### 1. Pastikan Dev Server Berjalan di Port 8082

Jalankan perintah berikut:

```bash
npm run dev
```

Server harus berjalan di `http://localhost:8082` (atau port yang dikonfigurasi).

### 2. Buka Browser Console

1. Buka aplikasi di browser: `http://localhost:8082`
2. Tekan `F12` untuk membuka Developer Tools
3. Buka tab **Console**
4. Buka tab **Network**

### 3. Periksa Error di Console

Cari error yang muncul saat halaman "Analisis Kebutuhan SDM" dimuat. Kemungkinan error:

#### Error A: CORS Error
```
Access to fetch at 'https://webapi.bps.go.id/...' from origin 'http://localhost:8082' has been blocked by CORS policy
```

**Solusi**: Proxy Vite seharusnya mengatasi ini. Pastikan server di-restart setelah perubahan `.env`.

#### Error B: 401 Unauthorized
```
Failed to fetch BPS provinces: 401 Unauthorized
```

**Solusi**: API Key tidak valid atau belum terdaftar. Verifikasi di https://webapi.bps.go.id/developer/

#### Error C: 403 Forbidden / WAF Block
```
Failed to fetch BPS provinces: 403 Forbidden
```

**Solusi**: BPS WAF (Web Application Firewall) memblokir request. Ini adalah masalah umum dengan BPS API.

#### Error D: Network Error
```
Failed to fetch BPS provinces: TypeError: Failed to fetch
```

**Solusi**: Koneksi internet bermasalah atau BPS API sedang down.

### 4. Periksa Network Tab

1. Buka tab **Network** di Developer Tools
2. Filter dengan kata kunci: `bps-api` atau `domain`
3. Cari request ke `/bps-api/v1/api/domain?type=prov&key=...`
4. Klik request tersebut dan periksa:
   - **Status Code**: Harus 200 OK
   - **Response**: Harus berisi data provinsi dalam format JSON
   - **Headers**: Periksa apakah proxy berfungsi

### 5. Test Manual dengan Curl

Buka terminal dan jalankan:

```bash
curl "http://localhost:8082/bps-api/v1/api/domain?type=prov&key=49b3ee3219c4030633b6fff5e581ddc5"
```

**Expected Response**:
```json
{
  "status": "OK",
  "data": [
    ["domain_id", "domain_name", "domain_url"],
    [
      {"domain_id": "11", "domain_name": "ACEH", "domain_url": "..."},
      {"domain_id": "12", "domain_name": "SUMATERA UTARA", "domain_url": "..."},
      ...
    ]
  ]
}
```

### 6. Test Langsung ke BPS API (Tanpa Proxy)

```bash
curl "https://webapi.bps.go.id/v1/api/domain?type=prov&key=49b3ee3219c4030633b6fff5e581ddc5"
```

Jika ini gagal dengan 403 atau 500, maka masalahnya ada di BPS API, bukan di aplikasi kita.

## Solusi Alternatif: Fallback Data

Jika BPS API terus bermasalah (WAF block, rate limit, dll), kita bisa menggunakan data provinsi statis sebagai fallback.

### Implementasi Fallback

Saya akan membuat file data provinsi statis yang akan digunakan jika BPS API gagal.

## Kemungkinan Penyebab Utama

Berdasarkan pengalaman dengan BPS API:

1. **WAF (Web Application Firewall) Block** - BPS API sangat ketat dengan WAF. Request dari localhost atau IP tertentu bisa diblokir.
2. **Rate Limiting** - BPS API membatasi jumlah request per menit.
3. **API Key Belum Aktif** - API key perlu waktu untuk aktif setelah registrasi.
4. **HTTPS Certificate Issues** - Proxy Vite mungkin gagal verify SSL certificate BPS.

## Rekomendasi

1. **Prioritas 1**: Periksa browser console dan network tab untuk error spesifik
2. **Prioritas 2**: Test dengan curl untuk isolasi masalah
3. **Prioritas 3**: Implementasi fallback data statis jika BPS API tidak reliable

## Next Steps

Setelah Anda menjalankan langkah-langkah di atas, berikan informasi berikut:

1. Error message dari browser console (screenshot atau copy-paste)
2. Status code dari Network tab
3. Response dari curl test (jika ada)

Dengan informasi ini, saya bisa memberikan solusi yang lebih spesifik.
