# Implementation Plan: Satpel Peta Jabatan Induk

## Overview

Implementasi fitur ini dilakukan secara bertahap: mulai dari perubahan database, lalu helper functions, komponen baru, perubahan form pegawai, perubahan halaman Peta Jabatan, dan terakhir property-based tests. Setiap langkah membangun di atas langkah sebelumnya sehingga tidak ada kode yang tergantung tanpa integrasi.

## Tasks

- [x] 1. Tambah kolom `satuan_kerja_penugasan` ke tabel `employees` via migration
  - Buat file `supabase/migrations/20260510000000_add_satuan_kerja_penugasan.sql`
  - Tambahkan kolom `satuan_kerja_penugasan VARCHAR(255) DEFAULT NULL` ke tabel `public.employees`
  - Tambahkan komentar kolom untuk dokumentasi
  - Buat index `idx_employees_satuan_kerja_penugasan` pada kolom tersebut (partial index: `WHERE satuan_kerja_penugasan IS NOT NULL`)
  - Buat index `idx_employees_dept_satpel` pada `(department, satuan_kerja_penugasan)` (partial index)
  - _Requirements: 3.1_

- [x] 2. Tambah helper functions di `src/lib/constants.ts`
  - [x] 2.1 Implementasi fungsi `getEffectiveDepartment(department: string): string | null`
    - Jika bukan Satpel/Workshop: kembalikan `department` itu sendiri
    - Jika Satpel/Workshop: kembalikan `getUnitPembina(department)` (null jika tidak ada di mapping)
    - Tambahkan JSDoc yang menjelaskan kontrak fungsi
    - _Requirements: 1.1, 1.4, 4.1_
  - [x] 2.2 Implementasi fungsi `isPositionReadOnly(department: string): boolean`
    - Kembalikan `true` jika `isSatpelOrWorkshop(department)`, `false` untuk unit lain
    - Tambahkan JSDoc
    - _Requirements: 1.3, 4.3_
  - [ ]* 2.3 Tulis property test untuk Property 1 — Resolusi Department Efektif
    - **Property 1: `getEffectiveDepartment` mengembalikan unit pembina untuk semua Satpel dalam mapping**
    - **Validates: Requirements 1.1, 1.4, 4.1**
    - Buat file `src/lib/__tests__/constants.satpel.test.ts`
    - Test: untuk setiap Satpel dalam `UNIT_PEMBINA_MAPPING`, `getEffectiveDepartment(satpel) === UNIT_PEMBINA_MAPPING[satpel]`
    - Test: untuk setiap unit non-Satpel dalam `DEPARTMENTS`, `getEffectiveDepartment(dept) === dept`
    - Gunakan `fc.constantFrom(...satpelNames)` dengan `numRuns: 100`
  - [ ]* 2.4 Tulis property test untuk Property 2 — Read-Only Mode untuk Satpel
    - **Property 2: `isPositionReadOnly` mengembalikan `true` untuk semua Satpel/Workshop**
    - **Validates: Requirements 1.3, 4.3**
    - Test: untuk setiap Satpel dalam `UNIT_PEMBINA_MAPPING`, `isPositionReadOnly(satpel) === true`
    - Test: untuk setiap unit pembina (non-Satpel), `isPositionReadOnly(dept) === false`
    - Gunakan `fc.constantFrom(...)` dengan `numRuns: 100`

- [x] 3. Buat komponen `SatpelBadge`
  - Buat file `src/components/employees/SatpelBadge.tsx`
  - Definisikan interface `SatpelBadgeProps { satpelName: string; className?: string }`
  - Render `<span>` dengan class Tailwind: `inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200`
  - Gunakan `cn()` dari `@/lib/utils` untuk menggabungkan className
  - Export named export `SatpelBadge`
  - _Requirements: 2.1, 2.2, 2.3_
  - [ ]* 3.1 Tulis property test untuk Property 4 — Badge Muncul Jika dan Hanya Jika Ada Penugasan
    - **Property 4: badge muncul iff `satuan_kerja_penugasan` tidak null dan tidak kosong**
    - **Validates: Requirements 2.1, 2.2**
    - Tambahkan ke file `src/lib/__tests__/constants.satpel.test.ts`
    - Test: `Boolean(satpelValue)` harus sama dengan `satpelValue !== null && satpelValue !== ''`
    - Gunakan `fc.option(fc.constantFrom(...satpelNames), { nil: null })` dengan `numRuns: 100`

- [x] 4. Perbarui `EmployeeFormModal.tsx` — tambah field `satuan_kerja_penugasan`
  - [x] 4.1 Perbarui Zod schema dan interface `Employee`
    - Tambahkan `satuan_kerja_penugasan: z.string().optional().or(z.literal(''))` ke `employeeSchema`
    - Tambahkan `satuan_kerja_penugasan: string | null` ke interface `Employee` (atau tipe data pegawai yang digunakan)
    - Import `getSatpelsByPembina` dari `@/lib/constants`
    - _Requirements: 3.1, 3.4_
  - [x] 4.2 Tambah logika `satpelOptions` dan `validateSatpelPenugasan`
    - Hitung `satpelOptions` menggunakan `getSatpelsByPembina(watchedDepartment)` — watch field `department`
    - Implementasi fungsi `validateSatpelPenugasan(value: string, pembinaDept: string): string | null`
      - Kembalikan `null` jika value kosong/null
      - Kembalikan `null` jika value ada dalam `getSatpelsByPembina(pembinaDept)`
      - Kembalikan pesan error jika value adalah Satpel valid tapi bukan binaan pembina
    - _Requirements: 3.2, 3.3, 3.4, 3.5_
  - [x] 4.3 Tambah dropdown selector di tab "Data Utama"
    - Tampilkan field hanya jika `satpelOptions.length > 0`
    - Gunakan komponen `Select` dari `@/components/ui/select`
    - Tambahkan opsi `__none__` dengan label "— Bertugas di unit pembina langsung —"
    - Tampilkan `satpelOptions` sebagai `SelectItem`
    - Saat value `__none__` dipilih, set form value ke `''`
    - Tampilkan `invalidSatpelWarning` jika ada
    - Posisikan di bawah field `department`
    - _Requirements: 3.4, 3.5_
  - [x] 4.4 Pastikan field `satuan_kerja_penugasan` disertakan saat save/update pegawai
    - Sertakan `satuan_kerja_penugasan` dalam payload upsert ke Supabase
    - Konversi string kosong `''` menjadi `null` sebelum disimpan
    - Sertakan dalam initial form values saat edit pegawai
    - _Requirements: 3.1, 3.5_
  - [ ]* 4.5 Tulis property test untuk Property 5 — Validasi Satpel Binaan
    - **Property 5: `validateSatpelPenugasan` menerima hanya Satpel yang merupakan binaan dari unit pembina**
    - **Validates: Requirements 3.2, 3.3, 3.5**
    - Tambahkan ke file `src/lib/__tests__/constants.satpel.test.ts`
    - Test: untuk setiap pasangan (pembina, satpel), jika `UNIT_PEMBINA_MAPPING[satpel] === pembina` maka `validateSatpelPenugasan(satpel, pembina) === null`
    - Test: jika `UNIT_PEMBINA_MAPPING[satpel] !== pembina` maka `validateSatpelPenugasan(satpel, pembina) !== null`
    - Gunakan `fc.constantFrom(...)` untuk pembina dan satpel dengan `numRuns: 100`

- [x] 5. Perbarui `src/pages/PetaJabatan.tsx` — logika Satpel induk
  - [x] 5.1 Tambah state dan computed values untuk resolusi Satpel
    - Import `getEffectiveDepartment`, `isPositionReadOnly`, `isSatpelOrWorkshop` dari `@/lib/constants`
    - Tambah state `activeSatpelFilter: string | null` (null = tampilkan semua pegawai unit pembina)
    - Tambah state `effectiveDepartment: string` (department yang digunakan untuk fetch data)
    - Tambah computed `isReadOnlyMode` menggunakan `useMemo(() => isPositionReadOnly(selectedDepartment), [selectedDepartment])`
    - _Requirements: 1.1, 1.3, 4.1, 4.3_
  - [x] 5.2 Tambah `useEffect` untuk resolusi department saat `selectedDepartment` berubah
    - Panggil `getEffectiveDepartment(selectedDepartment)`
    - Jika hasilnya `null`: set `effectiveDepartment('')` dan `activeSatpelFilter(null)`
    - Jika Satpel: set `effectiveDepartment` ke unit pembina dan `activeSatpelFilter` ke `selectedDepartment`
    - Jika bukan Satpel: set `effectiveDepartment` ke `selectedDepartment` dan `activeSatpelFilter(null)`
    - _Requirements: 1.1, 1.4, 4.1_
  - [x] 5.3 Perbarui query `fetchData` untuk menggunakan `effectiveDepartment`
    - Ganti `selectedDepartment` dengan `effectiveDepartment` pada query `position_references`
    - Ganti `selectedDepartment` dengan `effectiveDepartment` pada query `employees`
    - Tambahkan `satuan_kerja_penugasan` ke kolom yang di-select pada query employees
    - Perbarui interface `EmployeeMatch` untuk menyertakan `satuan_kerja_penugasan?: string | null`
    - Terapkan filter client-side: jika `activeSatpelFilter` tidak null, filter employees berdasarkan `satuan_kerja_penugasan === activeSatpelFilter`
    - _Requirements: 1.1, 2.4, 4.2_
  - [x] 5.4 Tambah banner informasi untuk mode Satpel
    - Tampilkan banner biru (`bg-blue-50 border-blue-200`) saat `isReadOnlyMode && effectiveDepartment`
    - Tampilkan pesan: "Peta jabatan untuk **{selectedDepartment}** menginduk ke **{effectiveDepartment}**. Pengelolaan jabatan dilakukan di unit pembina."
    - Import ikon `Info` dari `lucide-react`
    - _Requirements: 1.2_
  - [x] 5.5 Tambah error state untuk Satpel tidak ditemukan di mapping
    - Tampilkan error banner merah (`bg-red-50 border-red-200`) saat `isSatpelOrWorkshop(selectedDepartment) && !effectiveDepartment`
    - Pesan: "Unit **{selectedDepartment}** tidak memiliki unit pembina yang terdaftar. Hubungi admin pusat untuk konfigurasi."
    - Import ikon `AlertCircle` dari `lucide-react`
    - _Requirements: 1.5_
  - [x] 5.6 Nonaktifkan tombol tambah/edit/hapus jabatan saat `isReadOnlyMode`
    - Tambahkan `disabled={isReadOnlyMode || !canEdit}` pada tombol "Tambah Jabatan"
    - Tambahkan `disabled={isReadOnlyMode}` pada `DropdownMenuItem` Edit dan Hapus per baris jabatan
    - _Requirements: 1.3, 4.3_
  - [x] 5.7 Render `SatpelBadge` di baris pegawai
    - Import `SatpelBadge` dari `@/components/employees/SatpelBadge`
    - Di dalam render baris pegawai, tampilkan `<SatpelBadge satpelName={emp.satuan_kerja_penugasan} />` jika `emp.satuan_kerja_penugasan` tidak null/kosong
    - Letakkan badge di bawah nama pegawai dalam `flex flex-col gap-0.5`
    - _Requirements: 2.1, 2.2, 2.3_
  - [ ]* 5.8 Tulis property test untuk Property 3 — Filter Pegawai Satpel
    - **Property 3: filter `satuan_kerja_penugasan === targetSatpel` menghasilkan subset yang tepat**
    - **Validates: Requirements 2.4, 4.2**
    - Tambahkan ke file `src/lib/__tests__/constants.satpel.test.ts`
    - Test: semua pegawai dalam hasil filter memiliki `satuan_kerja_penugasan === targetSatpel`
    - Test: tidak ada pegawai dengan `satuan_kerja_penugasan !== targetSatpel` yang masuk ke hasil
    - Gunakan `fc.array(employeeArb, { minLength: 0, maxLength: 50 })` dengan `numRuns: 100`

- [x] 6. Checkpoint — Pastikan semua tests pass
  - Pastikan semua tests pass, tanyakan kepada user jika ada pertanyaan.

- [x] 7. Tambah helper `validateImportSatpelPenugasan` dan property tests sisa
  - [x] 7.1 Implementasi fungsi `validateImportSatpelPenugasan` di `src/lib/constants.ts`
    - Fungsi menerima `value: string` dan mengembalikan `{ value: string | null; warning: string | null }`
    - Jika `value` kosong/null: kembalikan `{ value: null, warning: null }`
    - Jika `value` ada dalam `Object.keys(UNIT_PEMBINA_MAPPING)`: kembalikan `{ value, warning: null }`
    - Jika tidak valid: kembalikan `{ value: null, warning: 'Nilai satuan_kerja_penugasan tidak valid: ...' }`
    - Export fungsi ini
    - _Requirements: 5.2, 5.3_
  - [ ]* 7.2 Tulis property test untuk Property 6 — Konsistensi Department-Penugasan
    - **Property 6: untuk setiap Satpel, `getUnitPembina(satpel) === UNIT_PEMBINA_MAPPING[satpel]`**
    - **Validates: Requirements 5.1**
    - Tambahkan ke file `src/lib/__tests__/constants.satpel.test.ts`
    - Test: `getUnitPembina(satpel) === UNIT_PEMBINA_MAPPING[satpel]` untuk semua Satpel dalam mapping
    - Gunakan `fc.constantFrom(...satpelNames)` dengan `numRuns: 100`
  - [ ]* 7.3 Tulis property test untuk Property 7 — Validasi Import Nilai Tidak Valid Dikosongkan
    - **Property 7: `validateImportSatpelPenugasan` mengosongkan nilai tidak valid dan menambahkan warning**
    - **Validates: Requirements 5.2, 5.3**
    - Tambahkan ke file `src/lib/__tests__/constants.satpel.test.ts`
    - Test: untuk string yang bukan Satpel valid, `result.value === null && result.warning !== null`
    - Gunakan `fc.string({ minLength: 1, maxLength: 50 }).filter(s => !validSatpels.has(s))` dengan `numRuns: 100`

- [x] 8. Final checkpoint — Pastikan semua tests pass
  - Pastikan semua tests pass, tanyakan kepada user jika ada pertanyaan.

## Notes

- Tasks bertanda `*` bersifat opsional dan dapat dilewati untuk MVP yang lebih cepat
- Setiap task mereferensikan requirement spesifik untuk traceability
- Property tests menggunakan library `fast-check` — pastikan sudah terinstall (`npm install fast-check --save-dev`)
- Kolom `satuan_kerja_penugasan` di database harus di-migrate sebelum kode frontend di-deploy
- Fungsi `validateSatpelPenugasan` yang diimplementasi di task 4.2 juga digunakan oleh property test di task 4.5 — pastikan fungsi tersebut di-export dari file yang sesuai atau dipindahkan ke `constants.ts`
