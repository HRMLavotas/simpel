# Quick Action - Klarifikasi Cara Kerja & Solusi Double Data

## ❓ Pertanyaan User

> "Di tabs quick action ada tombol terapkan pergantian jabatan, terapkan kenaikan pangkat, terapkan pergantian jabatan.. ini akan memicu data tersimpan lalu ada lagi tombol simpan perubahan, yang sekali lagi juga akan memicu data tersimpan, ini menyebabkan double data, jadi bagaimana sebaiknya ini dilakukan?"

## 🎯 Klarifikasi: Cara Kerja Quick Action

### Flow yang Benar:

```
┌─────────────────────────────────────────────────────────┐
│ 1. User klik "Terapkan Kenaikan Pangkat"               │
│    ↓                                                    │
│    ✅ Data diupdate di FORM STATE (belum ke database)  │
│    ✅ Riwayat ditambahkan di FORM STATE                │
│    ✅ Alert sukses muncul: "Data diupdate di form!"    │
│                                                         │
│ 2. User bisa melakukan Quick Action lainnya (opsional) │
│    ↓                                                    │
│    ✅ Semua perubahan masih di FORM STATE              │
│                                                         │
│ 3. User klik "Simpan Perubahan" (tombol di bawah form) │
│    ↓                                                    │
│    ✅ Semua data di FORM STATE disimpan ke DATABASE    │
│    ✅ Hanya 1 kali save ke database                    │
│    ✅ Tidak ada duplikasi                              │
└─────────────────────────────────────────────────────────┘
```

### Penjelasan:

**Tombol "Terapkan" (di Quick Action):**
- ❌ TIDAK menyimpan ke database
- ✅ Hanya mengupdate state form (React state)
- ✅ Mengupdate field di tab "Data Utama"
- ✅ Menambahkan entry di tab "Riwayat"
- ✅ User bisa melihat perubahan langsung di form

**Tombol "Simpan Perubahan" (di bawah form):**
- ✅ Menyimpan semua perubahan ke database
- ✅ Hanya dipanggil 1 kali
- ✅ Menyimpan semua data sekaligus (main data + history)

## 🐛 Penyebab Double Data

Jika terjadi double data, kemungkinan penyebabnya:

### 1. User Klik "Terapkan" Berkali-kali
**Masalah:** User klik tombol "Terapkan Kenaikan Pangkat" 2x atau lebih dengan data yang sama.

**Solusi yang Sudah Diterapkan:**
- ✅ Validasi: Pangkat baru harus berbeda dari pangkat saat ini
- ✅ Duplicate check di handler (cek apakah entry sudah ada)
- ✅ Alert jelas: "Data diupdate di form! Klik Simpan Perubahan..."

**Kode:**
```typescript
const handleRankPromotion = () => {
  // Validasi: harus berbeda dari current
  if (newRank === currentRank) {
    alert('Pangkat baru harus berbeda dari pangkat saat ini');
    return;
  }
  
  // Panggil callback (hanya update state, tidak save)
  onRankChange(newRank, entry);
  
  // Reset form setelah apply
  setNewRank('');
};
```

### 2. Auto-Tracking Menambahkan Entry Lagi
**Masalah:** Sistem auto-tracking mendeteksi perubahan dan menambahkan entry duplikat.

**Solusi yang Sudah Diterapkan:**
- ✅ Update `originalValues` setelah Quick Action
- ✅ Duplicate check sebelum menambahkan entry
- ✅ Flag `quickActionUsedRef` untuk skip change detection dialog

**Kode:**
```typescript
const handleQuickRankChange = (newRank: string, entry: HistoryEntry) => {
  quickActionUsedRef.current = true;
  
  // Check for duplicate
  const isDuplicate = rankHistoryEntries.some(
    e => e.pangkat_lama === entry.pangkat_lama && 
         e.pangkat_baru === entry.pangkat_baru &&
         e.tanggal === entry.tanggal
  );
  
  if (!isDuplicate) {
    setRankHistoryEntries(prev => [...prev, entry]);
  }
  
  // Update original value to prevent auto-tracking
  setOriginalValues(prev => ({ ...prev, rank_group: newRank }));
};
```

### 3. Dialog "Perubahan Terdeteksi" Menambahkan Entry Lagi
**Masalah:** Dialog konfirmasi muncul dan menambahkan entry ke history lagi.

**Solusi yang Sudah Diterapkan:**
- ✅ Skip dialog jika Quick Action digunakan
- ✅ Flag `_skipChangeDetection` di form data
- ✅ Langsung save tanpa dialog

**Kode:**
```typescript
const handleFormSubmit = async (data: EmployeeFormData) => {
  // Skip dialog jika Quick Action digunakan
  if (selectedEmployee && !data._skipChangeDetection) {
    const changes = detectChanges(selectedEmployee, data);
    if (changes.length > 0) {
      // Show dialog
      setChangeLogOpen(true);
      return;
    }
  }
  
  // Langsung save (tidak ada dialog)
  await executeSave(data, [], '', '', new Date().toISOString().split('T')[0]);
};
```

## ✅ Solusi yang Diterapkan

### 1. Validasi Input
```typescript
// Cegah user mengisi data yang sama
if (newRank === currentRank) {
  alert('Pangkat baru harus berbeda dari pangkat saat ini');
  return;
}
```

### 2. Duplicate Check
```typescript
// Cek duplikasi sebelum menambahkan
const isDuplicate = rankHistoryEntries.some(
  e => e.pangkat_lama === entry.pangkat_lama && 
       e.pangkat_baru === entry.pangkat_baru &&
       e.tanggal === entry.tanggal
);

if (!isDuplicate) {
  setRankHistoryEntries(prev => [...prev, entry]);
}
```

### 3. Update Original Values
```typescript
// Prevent auto-tracking dari trigger lagi
setOriginalValues(prev => ({ ...prev, rank_group: newRank }));
```

### 4. Skip Change Detection Dialog
```typescript
// Set flag saat Quick Action digunakan
quickActionUsedRef.current = true;

// Pass flag ke parent
await onSubmit({
  ...data,
  _skipChangeDetection: quickActionUsedRef.current,
});
```

### 5. Pesan yang Lebih Jelas
```typescript
// Alert sukses yang jelas
<Alert className="bg-green-50 border-green-200">
  <AlertDescription className="text-green-800">
    ✅ Pangkat berhasil diupdate di form! 
    Klik "Simpan Perubahan" di bawah untuk menyimpan ke database.
  </AlertDescription>
</Alert>
```

### 6. Info Box yang Jelas
```typescript
<Alert>
  <AlertDescription>
    💡 <strong>Cara Kerja Quick Action:</strong><br/>
    1. Pilih aksi (Naik Pangkat/Mutasi/Ganti Jabatan)<br/>
    2. Isi form dan klik tombol "Terapkan" → Data diupdate di form (belum tersimpan)<br/>
    3. Klik tombol "Simpan Perubahan" di bawah → Data tersimpan ke database<br/>
    <br/>
    ⚠️ <strong>Penting:</strong> Tombol "Terapkan" hanya mengupdate form, belum menyimpan ke database!
  </AlertDescription>
</Alert>
```

## 🧪 Testing untuk Memastikan Tidak Ada Double Data

### Test Case 1: Single Quick Action
```
1. Buka form edit pegawai
2. Klik tab "Quick Action"
3. Pilih "Naik Pangkat"
4. Pilih pangkat baru (contoh: IV/a)
5. Klik "Terapkan Kenaikan Pangkat"
6. Verifikasi: Alert sukses muncul
7. Klik tab "Riwayat"
8. Verifikasi: Ada 1 entry baru di Riwayat Kenaikan Pangkat
9. Klik "Simpan Perubahan"
10. Tunggu save selesai
11. Buka kembali form edit pegawai yang sama
12. Klik tab "Riwayat"
13. Verifikasi: Masih ada 1 entry (tidak duplikasi)
```

**Expected Result:** ✅ Hanya 1 entry, tidak ada duplikasi

### Test Case 2: Multiple Quick Actions
```
1. Buka form edit pegawai
2. Lakukan Quick Action "Naik Pangkat"
3. Lakukan Quick Action "Pindah/Mutasi"
4. Lakukan Quick Action "Ganti Jabatan"
5. Klik tab "Riwayat"
6. Verifikasi: Ada 3 entry baru (1 di setiap riwayat)
7. Klik "Simpan Perubahan"
8. Buka kembali form edit
9. Verifikasi: Masih ada 3 entry (tidak ada duplikasi)
```

**Expected Result:** ✅ 3 entry total, tidak ada duplikasi

### Test Case 3: Klik "Terapkan" Berkali-kali (Same Data)
```
1. Buka form edit pegawai
2. Klik tab "Quick Action"
3. Pilih "Naik Pangkat"
4. Pilih pangkat baru (contoh: IV/a)
5. Klik "Terapkan Kenaikan Pangkat"
6. Coba pilih pangkat yang sama lagi (IV/a)
7. Klik "Terapkan Kenaikan Pangkat" lagi
```

**Expected Result:** ✅ Alert muncul: "Pangkat baru harus berbeda dari pangkat saat ini"

### Test Case 4: Cancel Setelah Quick Action
```
1. Buka form edit pegawai
2. Lakukan Quick Action "Naik Pangkat"
3. Klik tombol "Batal" (jangan klik "Simpan Perubahan")
4. Buka kembali form edit pegawai yang sama
5. Verifikasi: Tidak ada perubahan (rollback)
```

**Expected Result:** ✅ Data tidak tersimpan, tidak ada entry baru

## 📊 Diagram Flow

### Flow Lengkap Quick Action:

```
┌─────────────────────────────────────────────────────────────┐
│                    USER ACTIONS                             │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ 1. Klik "Terapkan Kenaikan Pangkat"                        │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. Validasi Input                                           │
│    - Pangkat baru harus berbeda dari current                │
│    - Field wajib harus terisi                               │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. Call onRankChange(newRank, entry)                        │
│    → Update form.setValue('rank_group', newRank)            │
│    → Check duplicate                                        │
│    → Add to rankHistoryEntries (if not duplicate)           │
│    → Update originalValues                                  │
│    → Set quickActionUsedRef = true                          │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. Show Success Alert                                       │
│    "✅ Pangkat berhasil diupdate di form!"                  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. Reset Quick Action Form                                  │
│    - newRank = ''                                           │
│    - rankSK = ''                                            │
│    - rankNotes = ''                                         │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ 6. User Klik "Simpan Perubahan"                            │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ 7. handleSubmit()                                           │
│    → Pass _skipChangeDetection = true                       │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ 8. handleFormSubmit()                                       │
│    → Check _skipChangeDetection flag                        │
│    → Skip ChangeLogDialog (karena flag = true)              │
│    → Call executeSave() langsung                            │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ 9. executeSave()                                            │
│    → Update employees table                                 │
│    → Save education_history                                 │
│    → Save mutation_history                                  │
│    → Save position_history                                  │
│    → Save rank_history (1 entry, tidak duplikasi)           │
│    → Save other histories                                   │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ 10. Success!                                                │
│     ✅ Data tersimpan ke database                           │
│     ✅ Tidak ada duplikasi                                  │
│     ✅ Modal tertutup                                       │
└─────────────────────────────────────────────────────────────┘
```

## 🎯 Kesimpulan

### Tombol "Terapkan" (Quick Action):
- ✅ Hanya update FORM STATE (React state)
- ❌ TIDAK save ke database
- ✅ User bisa melakukan multiple Quick Actions
- ✅ User bisa melihat preview perubahan di tabs lain

### Tombol "Simpan Perubahan":
- ✅ Save semua perubahan ke DATABASE
- ✅ Hanya dipanggil 1 kali
- ✅ Tidak ada duplikasi

### Proteksi dari Double Data:
1. ✅ Validasi input (harus berbeda dari current)
2. ✅ Duplicate check sebelum add entry
3. ✅ Update originalValues untuk prevent auto-tracking
4. ✅ Skip change detection dialog
5. ✅ Pesan yang jelas untuk user

### Jika Masih Terjadi Double Data:
1. Cek apakah user klik "Terapkan" berkali-kali
2. Cek apakah ada entry duplikat di database sebelum Quick Action
3. Cek console log untuk debug
4. Bersihkan cache browser
5. Test dengan data pegawai yang fresh (baru dibuat)

---

**Dokumentasi:** 9 April 2026
**Status:** ✅ Solusi Diterapkan
**Versi:** 1.2.0
