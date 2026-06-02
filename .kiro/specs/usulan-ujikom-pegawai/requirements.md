# Requirements Document

## Introduction

Sistem Usulan Ujikom (Uji Kompetensi) Pegawai memungkinkan Admin Unit mengusulkan pegawai untuk mengikuti uji kompetensi kenaikan jenjang jabatan fungsional. Sistem ini terintegrasi dengan Peta Jabatan untuk memverifikasi ketersediaan formasi jabatan dan mengelola antrian usulan ketika formasi penuh. Admin Pusat bertugas mengelola seluruh proses usulan dari verifikasi berkas, proses ujikom, hingga hasil ujikom (lulus/tidak lulus).

**Status Workflow:**
1. **Draft** - Usulan masih dalam proses pengisian oleh Admin Unit
2. **Waiting_List** - Usulan menunggu karena formasi jabatan penuh
3. **Diajukan** - Usulan sudah disubmit dan menunggu verifikasi Admin Pusat
4. **Verifikasi_Berkas** - Admin Pusat sedang memverifikasi kelengkapan berkas
5. **Proses_Ujikom** - Pegawai sedang mengikuti ujikom
6. **Lulus_Ujikom** - Pegawai lulus ujikom dan mendapat jabatan target
7. **Tidak_Lulus_Ujikom** - Pegawai tidak lulus ujikom
8. **Dibatalkan** - Usulan dibatalkan oleh Admin Unit atau Admin Pusat

## Glossary

- **Admin_Unit**: Administrator unit kerja yang mengusulkan pegawai untuk ujikom
- **Admin_Pusat**: Administrator pusat yang mengelola seluruh proses usulan ujikom dari verifikasi hingga hasil ujikom
- **Usulan_Ujikom**: Proposal pengajuan pegawai untuk mengikuti uji kompetensi kenaikan jenjang jabatan fungsional
- **Ujikom**: Uji kompetensi untuk kenaikan jenjang jabatan fungsional PNS
- **Formasi_Jabatan**: Ketersediaan posisi/lowongan jabatan fungsional yang diambil dari field `abk_count` pada tabel `position_references`
- **Peta_Jabatan**: Referensi ketersediaan formasi jabatan fungsional per unit kerja (tabel `position_references`)
- **Waiting_List**: Antrian usulan yang menunggu karena formasi jabatan target sudah penuh
- **Surat_Pengantar**: Dokumen pengantar dari Pimpinan Unit Kerja yang diperlukan untuk usulan (format PDF/image)
- **Link_Dokumen_Persyaratan**: URL eksternal ke folder dokumen persyaratan lengkap (Google Drive, OneDrive, dll)
- **Jabatan_Target**: Jabatan fungsional yang diusulkan untuk pegawai (diambil dari `position_name` di `position_references`)
- **Pegawai_Eligible**: Pegawai ASN yang memenuhi syarat untuk diusulkan ujikom (status ASN aktif)
- **Promotion**: Proses otomatis memindahkan usulan dari Waiting_List ke Diajukan ketika formasi tersedia
- **Notification_System**: Sistem notifikasi yang memberitahu Admin Unit tentang perubahan status usulan
- **Status_Workflow**: Alur status usulan: Draft → Waiting_List/Diajukan → Verifikasi_Berkas → Proses_Ujikom → Lulus_Ujikom/Tidak_Lulus_Ujikom/Dibatalkan

## Requirements

### Requirement 1: Kelola Data Usulan Ujikom

**User Story:** As an Admin_Unit, I want to create and manage usulan ujikom for my employees, so that they can participate in competency tests for promotion.

#### Acceptance Criteria

1. THE Admin_Unit SHALL view a list of all Usulan_Ujikom from their department
2. WHEN an Admin_Unit creates a new Usulan_Ujikom, THE System SHALL validate the Pegawai_Eligible belongs to the Admin_Unit's department
3. WHEN an Admin_Unit saves a draft Usulan_Ujikom, THE System SHALL store the data with status "Draft"
4. THE Admin_Unit SHALL edit Usulan_Ujikom with status "Draft" or "Waiting_List"
5. THE Admin_Unit SHALL cancel any Usulan_Ujikom they created with status "Draft", "Waiting_List", or "Diajukan"
6. WHEN an Admin_Unit cancels an Usulan_Ujikom, THE System SHALL update status to "Dibatalkan" and trigger Promotion for the next waiting usulan
7. THE Admin_Unit SHALL view details of each Usulan_Ujikom including status, Jabatan_Target, Pegawai_Eligible, and uploaded documents

### Requirement 2: Integrasi dengan Peta Jabatan

**User Story:** As an Admin_Unit, I want to view available Formasi_Jabatan from Peta Jabatan, so that I can select appropriate target positions for my employees.

#### Acceptance Criteria

1. WHEN an Admin_Unit opens the Usulan Ujikom form, THE System SHALL display Peta_Jabatan for their department
2. THE System SHALL calculate available formasi for each Jabatan_Target as (`abk_count` - count of approved usulan for that position)
3. THE System SHALL display the list of Jabatan_Target filtered by `position_category` equals "Jabatan Fungsional"
4. THE Admin_Unit SHALL select a Jabatan_Target from the available positions in Peta_Jabatan
5. THE System SHALL display the remaining formasi quota for each Jabatan_Target in the selection interface

### Requirement 3: Pemilihan Pegawai Eligible

**User Story:** As an Admin_Unit, I want to select eligible employees from my department, so that I can propose them for ujikom.

#### Acceptance Criteria

1. THE System SHALL display a list of Pegawai_Eligible filtered by department equals Admin_Unit's department and `asn_status` is not null and `is_active` equals true
2. THE Admin_Unit SHALL search Pegawai_Eligible by name or NIP
3. THE System SHALL display employee details including name, NIP, current position, and rank when selected
4. THE System SHALL validate that selected Pegawai_Eligible does not have an active Usulan_Ujikom (status "Draft", "Waiting", "Diajukan", "Diverifikasi", or "Disetujui") for the same Jabatan_Target
5. WHEN an Admin_Unit selects a Pegawai_Eligible with existing active usulan for same Jabatan_Target, THE System SHALL display an error message and prevent creation

### Requirement 4: Upload Persyaratan Usulan

**User Story:** As an Admin_Unit, I want to upload required documents for the usulan, so that BKPSDM can verify the application.

#### Acceptance Criteria

1. THE Admin_Unit SHALL upload a Surat_Pengantar file in PDF or image format (JPG, PNG)
2. THE System SHALL validate uploaded file size does not exceed 5MB
3. THE System SHALL validate uploaded file format is PDF, JPG, or PNG
4. THE Admin_Unit SHALL provide a Link_Dokumen_Persyaratan as text URL
5. THE System SHALL validate Link_Dokumen_Persyaratan is a valid URL format
6. WHEN an Admin_Unit uploads a Surat_Pengantar, THE System SHALL store the file in Supabase Storage under path `usulan-ujikom/{usulan_id}/surat-pengantar`
7. THE System SHALL generate a public URL for the uploaded Surat_Pengantar

### Requirement 5: Validasi Formasi dan Status Usulan

**User Story:** As the System, I want to validate formasi availability when usulan is submitted, so that usulan are properly queued or approved.

#### Acceptance Criteria

1. WHEN an Admin_Unit submits an Usulan_Ujikom, THE System SHALL calculate available formasi for the Jabatan_Target
2. IF available formasi is greater than 0, THEN THE System SHALL set usulan status to "Diajukan"
3. IF available formasi equals 0, THEN THE System SHALL set usulan status to "Waiting_List"
4. THE System SHALL assign a queue position number to usulan with status "Waiting_List" based on submission timestamp
5. WHEN calculating available formasi, THE System SHALL count usulan with status "Lulus_Ujikom" for the same Jabatan_Target and department

### Requirement 6: Sistem Waiting List dan Promosi Otomatis

**User Story:** As the System, I want to automatically promote waiting usulan when formasi becomes available, so that the queue is processed fairly.

#### Acceptance Criteria

1. WHEN an Usulan_Ujikom status changes from "Lulus_Ujikom" to "Tidak_Lulus_Ujikom" or "Dibatalkan", THE System SHALL recalculate available formasi
2. IF available formasi becomes greater than 0 after status change, THEN THE System SHALL promote the oldest Usulan_Ujikom from Waiting_List to "Diajukan"
3. THE System SHALL order Waiting_List by submission timestamp ascending (oldest first)
4. WHEN promoting from Waiting_List, THE System SHALL update status to "Diajukan" and clear queue position
5. THE System SHALL trigger a Notification_System to Admin_Unit when their usulan is promoted from "Waiting_List" to "Diajukan"

### Requirement 7: Kelola Usulan Ujikom oleh Admin Pusat

**User Story:** As an Admin_Pusat, I want to manage all usulan ujikom from submission to completion, so that I can track the entire competency test process.

#### Acceptance Criteria

1. THE Admin_Pusat SHALL view all Usulan_Ujikom with any status from all departments
2. THE Admin_Pusat SHALL filter Usulan_Ujikom by status, department, Jabatan_Target, or submission date
3. THE Admin_Pusat SHALL view all uploaded documents including Surat_Pengantar and Link_Dokumen_Persyaratan
4. THE Admin_Pusat SHALL change Usulan_Ujikom status from "Diajukan" to "Verifikasi_Berkas"
5. THE Admin_Pusat SHALL change Usulan_Ujikom status from "Verifikasi_Berkas" to "Proses_Ujikom" or "Dibatalkan"
6. THE Admin_Pusat SHALL change Usulan_Ujikom status from "Proses_Ujikom" to "Lulus_Ujikom" or "Tidak_Lulus_Ujikom"
7. WHEN Admin_Pusat changes status to "Dibatalkan", THE System SHALL require input of cancellation reason with minimum 10 characters
8. WHEN Admin_Pusat changes status to "Tidak_Lulus_Ujikom", THE System SHALL optionally allow input of notes/feedback
9. WHEN Admin_Pusat changes status to "Lulus_Ujikom", THE System SHALL mark the formasi as occupied and trigger Promotion for next waiting usulan if applicable
10. THE Admin_Pusat SHALL add notes to any Usulan_Ujikom at any stage of the process

### Requirement 8: Notifikasi Perubahan Status

**User Story:** As an Admin_Unit, I want to receive notifications when my usulan status changes, so that I can track the progress.

#### Acceptance Criteria

1. WHEN an Usulan_Ujikom status changes from "Waiting_List" to "Diajukan", THE System SHALL create a notification for the Admin_Unit
2. WHEN an Usulan_Ujikom status changes to "Verifikasi_Berkas", THE System SHALL create a notification for the Admin_Unit
3. WHEN an Usulan_Ujikom status changes to "Proses_Ujikom", THE System SHALL create a notification for the Admin_Unit
4. WHEN an Usulan_Ujikom status changes to "Lulus_Ujikom", THE System SHALL create a notification for the Admin_Unit
5. WHEN an Usulan_Ujikom status changes to "Tidak_Lulus_Ujikom", THE System SHALL create a notification for the Admin_Unit with feedback notes if available
6. WHEN an Usulan_Ujikom status changes to "Dibatalkan", THE System SHALL create a notification for the Admin_Unit with the cancellation reason
7. THE System SHALL store notifications in the `notifications` table with `type` equals "usulan_ujikom_status_change"
8. THE Admin_Unit SHALL view notifications in their notification panel
9. THE System SHALL mark notification as read when Admin_Unit clicks on it

### Requirement 9: Dashboard dan Laporan Usulan

**User Story:** As an Admin_Unit, I want to view statistics of my usulan, so that I can monitor the submission status.

#### Acceptance Criteria

1. THE System SHALL display count of Usulan_Ujikom grouped by status for Admin_Unit's department
2. THE System SHALL display list of Pegawai_Eligible who have status "Lulus_Ujikom"
3. THE Admin_Unit SHALL filter usulan by status, Jabatan_Target, or submission date range
4. THE System SHALL display warning indicator when Formasi_Jabatan for a position is full
5. THE System SHALL display current queue position for usulan with status "Waiting_List"

### Requirement 10: Menu Usulan Ujikom untuk Admin Pusat

**User Story:** As an Admin_Pusat, I want a dedicated menu to manage all usulan ujikom, so that I can efficiently process submissions.

#### Acceptance Criteria

1. THE Admin_Pusat SHALL access "Menu Usulan Ujikom" from the main navigation
2. THE System SHALL display a table/list of all Usulan_Ujikom with columns: Pegawai Name, NIP, Jabatan_Target, Department, Status, Submission Date
3. THE Admin_Pusat SHALL sort the list by any column
4. THE Admin_Pusat SHALL search usulan by pegawai name, NIP, or department
5. THE Admin_Pusat SHALL filter by status using dropdown or tabs
6. THE Admin_Pusat SHALL click on any usulan row to view detail page
7. THE Admin_Pusat SHALL update status through action buttons or dropdown in the detail page
8. THE System SHALL display status badge with color coding: Draft (gray), Waiting_List (yellow), Diajukan (blue), Verifikasi_Berkas (purple), Proses_Ujikom (orange), Lulus_Ujikom (green), Tidak_Lulus_Ujikom (red), Dibatalkan (gray)
5. THE System SHALL display current queue position for usulan with status "Waiting"

### Requirement 11: Audit Trail Perubahan Status

**User Story:** As the System, I want to log all status changes for audit purposes, so that changes can be tracked and reviewed.

#### Acceptance Criteria

1. WHEN an Usulan_Ujikom status changes, THE System SHALL record the change in a status history table
2. THE System SHALL store previous status, new status, timestamp, and user who made the change
3. THE System SHALL store cancellation reason when status changes to "Dibatalkan"
4. THE System SHALL store feedback notes when status changes to "Tidak_Lulus_Ujikom"
5. THE Admin_Pusat SHALL view complete status history for any Usulan_Ujikom
6. THE Admin_Unit SHALL view status history for their own department's Usulan_Ujikom

### Requirement 12: Validasi Data dan Error Handling

**User Story:** As the System, I want to validate all input data and handle errors gracefully, so that data integrity is maintained.

#### Acceptance Criteria

1. WHEN an Admin_Unit submits an Usulan_Ujikom without required fields, THE System SHALL display specific error messages for each missing field
2. THE System SHALL validate Surat_Pengantar file is uploaded before submission
3. THE System SHALL validate Link_Dokumen_Persyaratan is provided before submission
4. THE System SHALL validate Pegawai_Eligible and Jabatan_Target are selected before submission
5. WHEN file upload fails, THE System SHALL display error message with retry option
6. WHEN network error occurs during submission, THE System SHALL preserve draft data and allow retry
7. THE System SHALL validate date fields are in valid format and not in the future
8. WHEN Admin_Pusat updates status, THE System SHALL validate the status transition is valid according to the workflow
