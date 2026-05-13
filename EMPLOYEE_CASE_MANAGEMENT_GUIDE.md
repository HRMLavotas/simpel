# 📋 Panduan Lengkap: Sistem Management Kasus Pegawai

## 🎯 Ringkasan

Sistem Management Kasus Pegawai adalah fitur untuk mengelola dan melacak berbagai kasus yang melibatkan pegawai, seperti pelanggaran disiplin, masalah kinerja, kasus hukum, dan lainnya. Sistem ini dilengkapi dengan timeline tindak lanjut, manajemen dokumen pendukung, dan kontrol akses yang fleksibel.

## 📁 Struktur File

### 1. **Types & Constants**
```
src/lib/employeeCaseTypes.ts
```
- Definisi semua types, interfaces, dan constants
- Enum untuk CaseType, CaseStatus, CaseSeverity, PartyRole
- Helper functions untuk formatting dan validasi

### 2. **Storage Layer**
```
src/lib/employeeCaseStorage.ts
```
- CRUD operations untuk cases
- Timeline management
- Access control management
- Menggunakan localStorage (dapat diganti dengan Supabase API)

### 3. **Hooks**
```
src/hooks/useCaseAccess.ts
```
- Hook untuk mengecek hak akses user
- Mengelola permissions (view/edit)

### 4. **Components**

#### Main Pages
```
src/pages/EmployeeCaseManagement.tsx  - Halaman list/management kasus
src/pages/EmployeeCaseDetail.tsx      - Halaman detail kasus
```

#### Sub Components
```
src/components/cases/CaseFormDialog.tsx         - Form untuk membuat kasus baru
src/components/cases/CaseAccessManagement.tsx   - Manajemen akses user
src/components/cases/CaseDetailCard.tsx         - Card detail spesifik per jenis kasus
```

#### Utility Components
```
src/components/DashboardLayout.tsx    - Layout wrapper
src/components/skeletons.tsx          - Loading states
src/components/EmptyState.tsx         - Empty states
src/lib/date-utils.ts                 - Date formatting utilities
src/contexts/AuthContext.tsx          - Auth context
```

### 5. **Routing**
```
src/App.tsx
```
Routes yang ditambahkan:
- `/admin/kasus-pegawai` - List kasus
- `/admin/kasus-pegawai/:caseId` - Detail kasus

## 🎨 Fitur Utama

### 1. **Manajemen Kasus**

#### Jenis Kasus yang Didukung:
- 🚨 **Pelanggaran Disiplin** - Terlambat, tidak masuk, dll
- 📉 **Masalah Kinerja** - Target tidak tercapai, evaluasi buruk
- ⚖️ **Pelanggaran Etika** - Pelanggaran kode etik
- 📄 **Masalah Administrasi** - Dokumen tidak lengkap, dll
- ⚖️ **Kasus Hukum** - Proses hukum, pengadilan
- 💊 **Masalah Kesehatan** - Sakit berkepanjangan, dll
- 📝 **Lainnya** - Kasus lain yang tidak masuk kategori

#### Status Kasus:
- 🆕 **Baru** - Kasus baru dilaporkan
- ⏳ **Diproses** - Sedang ditangani
- ⏸️ **Tertunda** - Ditunda sementara
- ✅ **Selesai** - Sudah selesai ditangani
- 🔒 **Ditutup** - Kasus ditutup

#### Tingkat Keparahan:
- 🟢 **Ringan**
- 🟡 **Sedang**
- 🟠 **Berat**
- 🔴 **Sangat Berat**

### 2. **Timeline Tindak Lanjut**

Setiap kasus dapat memiliki multiple timeline items dengan:
- 📅 Tanggal tindakan
- 📝 Deskripsi tindakan
- 🏷️ Status singkat
- 👥 Pihak yang terlibat (dengan role/kapasitas)
- 📎 Dokumen pendukung (multiple files)

#### Role Pihak yang Terlibat:
- Pelapor
- Terlapor
- Saksi
- Mediator
- Penyidik
- Atasan Langsung
- Pihak Ketiga
- Lainnya

### 3. **Input Pegawai Fleksibel**

Sistem mendukung 2 cara input pegawai:
1. **Pilih dari Database** - Autocomplete search dari data pegawai
2. **Input Manual** - Untuk pegawai yang tidak ada di sistem

### 4. **Detail Spesifik per Jenis Kasus**

Setiap jenis kasus memiliki field tambahan yang relevan:

**Disiplin:**
- Jenis pelanggaran
- Tanggal pelanggaran
- Dilaporkan oleh

**Kinerja:**
- Masalah kinerja
- Periode penilaian
- Target yang tidak tercapai

**Hukum:**
- Kasus hukum
- Status hukum
- Nama pengadilan

**Kesehatan:**
- Masalah kesehatan
- Status perawatan
- Dokumen medis

### 5. **Kontrol Akses**

#### Hak Akses Default:
- **Admin Pusat**: Full access (view + edit) ke semua kasus
- **User Lain**: Perlu diberikan akses secara eksplisit

#### Manajemen Akses:
- Admin Pusat dapat memberikan akses ke user lain
- Dapat mengatur permission: View only atau View + Edit
- Dapat mencabut akses kapan saja

### 6. **Fitur Pencarian & Filter**

- 🔍 Search: Nama, NIP, atau deskripsi kasus
- 🏷️ Filter by: Jenis kasus
- 📊 Filter by: Status kasus
- 📄 Pagination: 20 items per page

## 🚀 Cara Penggunaan

### Membuat Kasus Baru

1. Klik tombol **"Tambah Kasus"**
2. Pilih pegawai (search atau input manual)
3. Pilih jenis kasus
4. Isi detail spesifik sesuai jenis kasus
5. Pilih status dan tingkat keparahan
6. Isi deskripsi kasus
7. Klik **"Simpan Kasus"**

### Menambah Timeline

1. Buka detail kasus
2. Klik **"Tambah Timeline"**
3. Isi tanggal tindakan
4. Isi deskripsi tindakan
5. (Opsional) Tambah pihak yang terlibat
6. (Opsional) Tambah dokumen pendukung
7. Klik **"Tambahkan"**

### Mengelola Akses

1. Buka tab **"Pengaturan Akses"** (hanya Admin Pusat)
2. Klik **"Tambah Akses"**
3. Cari dan pilih user
4. Toggle **"Izinkan Edit"** jika perlu
5. Klik **"Berikan Akses"**

## 🔧 Kustomisasi & Pengembangan

### Menambah Jenis Kasus Baru

Edit `src/lib/employeeCaseTypes.ts`:

```typescript
export type CaseType =
  | "disiplin"
  | "kinerja"
  // ... existing types
  | "jenis_baru"; // Tambahkan di sini

export const CASE_TYPE_LABELS: Record<CaseType, string> = {
  // ... existing labels
  jenis_baru: "Label Jenis Baru",
};
```

Tambahkan field spesifik di `CaseDetails` interface:

```typescript
export interface CaseDetails {
  // ... existing fields
  jenisBaruField1?: string;
  jenisBaruField2?: string;
}
```

Update `CaseFormDialog.tsx` untuk menambah form fields.

### Migrasi ke Supabase

Untuk mengganti localStorage dengan Supabase:

1. Buat tabel di Supabase:
```sql
CREATE TABLE employee_cases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_number TEXT,
  employee_id TEXT NOT NULL,
  employee_name TEXT NOT NULL,
  employee_nip TEXT NOT NULL,
  case_type TEXT NOT NULL,
  status TEXT NOT NULL,
  severity TEXT,
  description TEXT NOT NULL,
  report_date DATE NOT NULL,
  timeline JSONB DEFAULT '[]'::jsonb,
  case_details JSONB,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE case_access_control (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id),
  user_name TEXT NOT NULL,
  user_role TEXT NOT NULL,
  can_edit BOOLEAN DEFAULT false,
  can_view BOOLEAN DEFAULT true,
  granted_by UUID REFERENCES profiles(id),
  granted_at TIMESTAMPTZ DEFAULT NOW()
);
```

2. Update `src/lib/employeeCaseStorage.ts`:
```typescript
// Ganti localStorage dengan Supabase queries
export async function getAllCases(): Promise<EmployeeCase[]> {
  const { data, error } = await supabase
    .from('employee_cases')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data || [];
}
```

### Menambah Notifikasi

Tambahkan notifikasi untuk events penting:

```typescript
// Di CaseFormDialog.tsx setelah create case
await createCase(caseData);

// Kirim notifikasi ke admin terkait
await supabase.from('notifications').insert({
  user_id: adminId,
  title: 'Kasus Baru',
  message: `Kasus baru untuk ${formData.employeeName}`,
  type: 'case_created',
  reference_id: newCase.id,
});
```

## 📊 Data Structure

### EmployeeCase
```typescript
{
  id: string;
  caseNumber?: string;
  employeeId: string;
  employeeName: string;
  employeeNip: string;
  caseType: CaseType;
  status: CaseStatus;
  severity?: CaseSeverity;
  description: string;
  reportDate: string;
  timeline: TimelineItem[];
  caseDetails?: CaseDetails;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}
```

### TimelineItem
```typescript
{
  id: string;
  date: string;
  description: string;
  status: string;
  involvedPartiesList?: InvolvedParty[];
  documents: SupportingDocument[];
  createdAt: string;
  updatedAt: string;
}
```

## 🎨 UI/UX Features

### Responsive Design
- ✅ Mobile-first approach
- ✅ Tablet optimization
- ✅ Desktop full features

### Visual Indicators
- 🎨 Color-coded status badges
- 🎨 Severity indicators
- 🎨 Role badges untuk pihak terlibat
- 🎨 Gradient headers

### Loading States
- ⏳ Skeleton loaders
- ⏳ Smooth transitions
- ⏳ Loading indicators

### Empty States
- 📭 No data state
- 🔍 Search no results
- ℹ️ Helpful messages

## 🔐 Security & Permissions

### Access Control
- Admin Pusat: Full access
- Granted Users: Configurable (view/edit)
- Other Users: No access

### Data Validation
- Required fields validation
- Date validation
- URL validation untuk dokumen
- Input sanitization

## 📱 Mobile Optimization

- Touch-friendly buttons
- Responsive tables
- Collapsible sections
- Optimized forms

## 🐛 Troubleshooting

### Kasus tidak muncul
- Cek apakah user memiliki akses
- Cek localStorage: `employee_cases`
- Cek console untuk errors

### Timeline tidak tersimpan
- Cek required fields (date, description)
- Cek format tanggal
- Cek console untuk errors

### Akses tidak berfungsi
- Cek role user
- Cek localStorage: `case_access_control`
- Refresh halaman

## 📈 Future Enhancements

Fitur yang bisa ditambahkan:
- [ ] Export kasus ke PDF/Excel
- [ ] Email notifications
- [ ] Reminder untuk follow-up
- [ ] Dashboard analytics
- [ ] Bulk operations
- [ ] Advanced search & filters
- [ ] Attachment upload (bukan hanya link)
- [ ] Comments/discussion thread
- [ ] Audit trail
- [ ] Integration dengan sistem lain

## 📞 Support

Untuk pertanyaan atau bantuan:
- Dokumentasi: File ini
- Code comments: Lihat inline comments di setiap file
- Issues: Buat issue di repository

---

**Dibuat dengan ❤️ untuk sistem manajemen kepegawaian yang lebih baik**
