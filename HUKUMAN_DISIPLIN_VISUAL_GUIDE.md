# Visual Guide: Fitur Hukuman Disiplin

## 🎨 UI Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  HEADER (Gradient Blue-Purple)                                  │
│  ┌──────┐                                                        │
│  │ 📄  │  [Nama Pegawai]                                        │
│  └──────┘  NIP: [NIP]                                           │
│            [Badge: Jenis Kasus] [Badge: Status]                 │
│                                                                  │
│            [⚖️ Update Hukuman Disiplin] [✏️ Edit]  ← TOMBOL BARU│
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  📋 Informasi Kasus                                             │
│  ─────────────────────────────────────────────────────────────  │
│  NIP: xxx    Jenis: xxx    Tanggal: xxx    Keparahan: xxx      │
│  Status: [Badge]                                                │
│  Deskripsi: ...                                                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  📊 Detail Kasus Spesifik                                       │
│  (CaseDetailCard - existing)                                    │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  ⚖️ Riwayat Hukuman Disiplin  ← CARD BARU                      │
│  ─────────────────────────────────────────────────────────────  │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ [Badge: SEDANG]  SK No. 123/SK/2026                       │ │
│  │ Penundaan Kenaikan Gaji Berkala 6 Bulan                   │ │
│  │                                                             │ │
│  │ 📅 Tanggal Keputusan: 13 Mei 2026                         │ │
│  │ 📅 Mulai Berlaku: 15 Mei 2026                             │ │
│  │ 📅 Berakhir: 15 November 2026                             │ │
│  │                                                             │ │
│  │ 👤 Ditetapkan oleh: Kepala BKN                            │ │
│  │ ⚠️ Pelanggaran: Tidak masuk kerja tanpa keterangan...     │ │
│  │                                                             │ │
│  │ 📄 [Lihat Dokumen SK]                                      │ │
│  └───────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  📅 Timeline Tindak Lanjut                                      │
│  ─────────────────────────────────────────────────────────────  │
│  ● 13 Mei 2026  [Hukuman Disiplin Diterbitkan]  ← AUTO-CREATED │
│    Hukuman Disiplin Sedang diterbitkan: Penundaan...           │
│    📄 SK Hukuman Disiplin No. 123/SK/2026                      │
│                                                                  │
│  ● [Timeline entries lainnya...]                                │
└─────────────────────────────────────────────────────────────────┘
```

## 🔄 Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    USER INTERACTION FLOW                         │
└─────────────────────────────────────────────────────────────────┘

    [User di Halaman Detail Kasus]
              ↓
    [Klik "Update Hukuman Disiplin"]
              ↓
    ┌─────────────────────────────────┐
    │   DIALOG FORM MUNCUL            │
    │                                 │
    │  1. Pilih Tingkat Hukuman       │
    │     ○ Ringan                    │
    │     ● Sedang  ← selected        │
    │     ○ Berat                     │
    │                                 │
    │  2. Pilih Jenis Hukuman         │
    │     [Dropdown berubah dinamis]  │
    │                                 │
    │  3. Isi Data SK                 │
    │     - Nomor SK                  │
    │     - Tanggal Keputusan         │
    │     - Tanggal Berlaku           │
    │     - Tanggal Berakhir          │
    │                                 │
    │  4. Isi Pejabat & Pelanggaran   │
    │                                 │
    │  5. (Optional) Catatan & Link   │
    │                                 │
    │  [Simpan] [Batal]               │
    └─────────────────────────────────┘
              ↓
    [User Klik "Simpan"]
              ↓
    ┌─────────────────────────────────┐
    │   SISTEM PROCESSING             │
    │                                 │
    │  1. Validasi Form ✓             │
    │  2. Update case_details ✓       │
    │  3. Create Timeline Entry ✓     │
    │  4. Reload Case Data ✓          │
    └─────────────────────────────────┘
              ↓
    ┌─────────────────────────────────┐
    │   USER SEES RESULT              │
    │                                 │
    │  ✅ Toast: "Berhasil!"          │
    │  📊 Card Riwayat Muncul         │
    │  📅 Timeline Baru Muncul        │
    └─────────────────────────────────┘
```

## 📊 Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        DATA FLOW                                 │
└─────────────────────────────────────────────────────────────────┘

[User Input Form]
      ↓
{
  level: "sedang",
  type: "penundaan_kenaikan_gaji_berkala_6_bulan",
  decisionNumber: "123/SK/2026",
  decisionDate: "2026-05-13",
  effectiveDate: "2026-05-15",
  endDate: "2026-11-15",
  issuedBy: "Kepala BKN",
  violation: "Tidak masuk kerja...",
  notes: "...",
  documentLink: "https://..."
}
      ↓
[handleDisciplinaryAction()]
      ↓
      ├─────────────────────────────────────┐
      ↓                                     ↓
[Update case_details]              [Create Timeline]
      ↓                                     ↓
{                                   {
  disciplinaryActions: [              date: "2026-05-13",
    {                                 description: "Hukuman Disiplin...",
      level: "sedang",                status: "Hukuman Disiplin Diterbitkan",
      type: "...",                    documents: [{
      ...                               name: "SK Hukuman...",
    }                                   link: "https://..."
  ]                                   }]
}                                   }
      ↓                                     ↓
      └─────────────────┬───────────────────┘
                        ↓
              [Reload Case Data]
                        ↓
              [Update UI Components]
                        ↓
        ┌───────────────┴───────────────┐
        ↓                               ↓
[DisciplinaryActionsCard]      [Timeline Display]
    renders with data           shows new entry
```

## 🎨 Component Hierarchy

```
EmployeeCaseDetail
│
├── DashboardLayout
│   │
│   ├── Header Section
│   │   ├── Employee Info
│   │   └── Action Buttons
│   │       ├── [Update Hukuman Disiplin] ← NEW
│   │       └── [Edit]
│   │
│   ├── Main Content (Left Column)
│   │   ├── Card: Informasi Kasus
│   │   ├── Card: CaseDetailCard
│   │   ├── Card: DisciplinaryActionsCard ← NEW
│   │   │   └── List of Disciplinary Actions
│   │   │       └── Action Item
│   │   │           ├── Badge (Level)
│   │   │           ├── SK Number
│   │   │           ├── Type Label
│   │   │           ├── Dates
│   │   │           ├── Issued By
│   │   │           ├── Violation
│   │   │           ├── Notes
│   │   │           └── Document Link
│   │   │
│   │   └── Card: Timeline
│   │       └── Timeline Items
│   │           └── Auto-created Entry ← NEW
│   │
│   ├── Sidebar (Right Column)
│   │   ├── Card: Ringkasan Kasus
│   │   └── Card: Informasi Pegawai
│   │
│   └── Dialogs
│       ├── AlertDialog (Delete Timeline)
│       └── DisciplinaryActionDialog ← NEW
│           └── Form
│               ├── Select: Level
│               ├── Select: Type
│               ├── Input: Decision Number
│               ├── Input: Dates
│               ├── Input: Issued By
│               ├── Textarea: Violation
│               ├── Textarea: Notes
│               └── Input: Document Link
```

## 🎯 Badge Color System

```
┌─────────────────────────────────────────────────────────────────┐
│                    TINGKAT HUKUMAN BADGES                        │
└─────────────────────────────────────────────────────────────────┘

┌──────────┐
│  RINGAN  │  ← Yellow (bg-yellow-100 text-yellow-800)
└──────────┘

┌──────────┐
│  SEDANG  │  ← Orange (bg-orange-100 text-orange-800)
└──────────┘

┌──────────┐
│  BERAT   │  ← Red (bg-red-100 text-red-800)
└──────────┘
```

## 📱 Responsive Design

```
┌─────────────────────────────────────────────────────────────────┐
│                        DESKTOP VIEW                              │
└─────────────────────────────────────────────────────────────────┘

┌────────────────────────────────┬──────────────────────────────┐
│                                │                              │
│  Main Content (2/3 width)      │  Sidebar (1/3 width)        │
│                                │                              │
│  - Informasi Kasus             │  - Ringkasan Kasus          │
│  - Case Detail                 │  - Informasi Pegawai        │
│  - Hukuman Disiplin ← NEW      │                              │
│  - Timeline                    │                              │
│                                │                              │
└────────────────────────────────┴──────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                        MOBILE VIEW                               │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  Header (Stacked)                                               │
│  [⚖️ Update Hukuman Disiplin]  ← Full width                    │
│  [✏️ Edit]                                                      │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  Main Content (Full width, stacked)                             │
│  - Informasi Kasus                                              │
│  - Case Detail                                                  │
│  - Hukuman Disiplin ← NEW                                       │
│  - Timeline                                                     │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  Sidebar (Full width, below main)                               │
│  - Ringkasan Kasus                                              │
│  - Informasi Pegawai                                            │
└─────────────────────────────────────────────────────────────────┘
```

## 🔐 Access Control Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    ACCESS CONTROL                                │
└─────────────────────────────────────────────────────────────────┘

User Login
    ↓
Check Role
    ↓
    ├─── admin_pusat ────────────────────┐
    │                                    ↓
    │                          canEdit = TRUE
    │                                    ↓
    │                    [Tombol "Update Hukuman Disiplin" MUNCUL]
    │                                    ↓
    │                          [Bisa tambah hukuman]
    │
    ├─── admin_unit ─────────────────────┐
    │                                    ↓
    │                          canEdit = TRUE (conditional)
    │                                    ↓
    │                    [Tombol "Update Hukuman Disiplin" MUNCUL]
    │
    └─── user_biasa ─────────────────────┐
                                         ↓
                               canEdit = FALSE
                                         ↓
                    [Tombol "Update Hukuman Disiplin" TIDAK MUNCUL]
                                         ↓
                         [Hanya bisa lihat riwayat]
```

## 📋 Form Validation Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    FORM VALIDATION                               │
└─────────────────────────────────────────────────────────────────┘

User Klik "Simpan"
    ↓
Check: Jenis hukuman dipilih?
    ├─ NO → ❌ Toast: "Pilih jenis hukuman disiplin"
    └─ YES ↓
Check: Nomor keputusan diisi?
    ├─ NO → ❌ Toast: "Nomor keputusan harus diisi"
    └─ YES ↓
Check: Pejabat diisi?
    ├─ NO → ❌ Toast: "Pejabat yang menetapkan harus diisi"
    └─ YES ↓
Check: Pelanggaran diisi?
    ├─ NO → ❌ Toast: "Pelanggaran yang dilakukan harus diisi"
    └─ YES ↓
✅ All Valid
    ↓
Submit to handleDisciplinaryAction()
```

## 🎬 Animation & Interaction

```
┌─────────────────────────────────────────────────────────────────┐
│                    USER INTERACTIONS                             │
└─────────────────────────────────────────────────────────────────┘

1. Hover Tombol "Update Hukuman Disiplin"
   bg-red-500/20 → bg-red-500/30 (smooth transition)

2. Klik Tombol
   Dialog fade in + scale animation

3. Pilih Tingkat Hukuman
   Dropdown jenis hukuman update instantly

4. Submit Form
   Button text: "Simpan" → "Menyimpan..." (disabled)
   Loading state

5. Success
   Dialog fade out
   Toast notification slide in from top
   Card riwayat fade in
   Timeline entry slide in from left

6. Hover Link Dokumen
   Text color change + underline
```

---

## 📸 Screenshot Placeholders

```
┌─────────────────────────────────────────────────────────────────┐
│  [Screenshot 1: Tombol Update Hukuman Disiplin di Header]       │
│  Menunjukkan lokasi tombol merah di samping tombol Edit         │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  [Screenshot 2: Dialog Form Hukuman Disiplin]                   │
│  Menunjukkan form lengkap dengan semua field                    │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  [Screenshot 3: Card Riwayat Hukuman Disiplin]                  │
│  Menunjukkan tampilan card dengan data hukuman disiplin         │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  [Screenshot 4: Timeline Entry Auto-Created]                    │
│  Menunjukkan entry timeline yang otomatis ter-create            │
└─────────────────────────────────────────────────────────────────┘
```

