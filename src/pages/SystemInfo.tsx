import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Info, Wrench, Sparkles, CheckCircle2, Clock, ChevronDown, ChevronRight, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useAppUpdate } from '@/hooks/useAppUpdate';

interface ChangeItem {
  type: 'fix' | 'feature' | 'improvement';
  text: string;
}

interface Release {
  version: string;
  date: string;
  label?: string;
  changes: ChangeItem[];
}

const RELEASES: Release[] = [
  {
    version: '2.19.0',
    date: '7 Mei 2026',
    label: 'Terbaru',
    changes: [
      { type: 'feature', text: 'AI Chatbot: asisten AI untuk menjawab pertanyaan tentang data pegawai — tanya "Berapa jumlah PNS?", "Siapa saja Instruktur di BBPVP Bekasi?", dll.' },
      { type: 'feature', text: 'AI Chatbot: 12 backend functions untuk query data — search by name, statistics, position analysis, retirement forecast, department comparison, dll.' },
      { type: 'feature', text: 'AI Chatbot: AI Function Calling — DeepSeek AI otomatis memilih function yang tepat berdasarkan pertanyaan user.' },
      { type: 'feature', text: 'AI Chatbot: markdown rendering — tabel, heading, lists, code blocks, dan formatting lainnya ditampilkan dengan rapi.' },
      { type: 'feature', text: 'AI Chatbot: keepalive request — chat tetap berjalan meskipun user switch tab atau minimize browser.' },
      { type: 'feature', text: 'AI Chatbot: retry logic — 3x percobaan otomatis dengan exponential backoff jika terjadi network error.' },
      { type: 'feature', text: 'AI Chatbot: context awareness — AI mengingat percakapan sebelumnya untuk follow-up questions.' },
      { type: 'feature', text: 'Pengumuman: fitur pengumuman untuk admin pusat — buat, edit, hapus, dan publikasikan pengumuman untuk semua user.' },
      { type: 'feature', text: 'Pengumuman: banner notifikasi di atas dashboard — menampilkan pengumuman aktif dengan prioritas (Penting/Normal/Info).' },
      { type: 'feature', text: 'Pengumuman: halaman daftar pengumuman — user dapat melihat semua pengumuman yang pernah dipublikasikan.' },
      { type: 'feature', text: 'Pengumuman: rich text editor — mendukung formatting text, lists, links, dan styling lainnya.' },
      { type: 'feature', text: 'Pengumuman: penjadwalan publikasi — set tanggal mulai dan berakhir untuk pengumuman otomatis.' },
      { type: 'feature', text: 'Pegawai Non-Aktif: field is_active untuk menandai pegawai yang sudah tidak aktif (pensiun, pindah, resign, dll).' },
      { type: 'feature', text: 'Pegawai Non-Aktif: filter "Status Aktif" di Data Pegawai — toggle antara pegawai aktif dan non-aktif.' },
      { type: 'feature', text: 'Pegawai Non-Aktif: badge "Non-Aktif" di tabel dan detail pegawai — visual indicator untuk pegawai yang sudah tidak aktif.' },
      { type: 'feature', text: 'Pegawai Non-Aktif: pegawai non-aktif dikecualikan dari dashboard stats dan peta jabatan — hanya pegawai aktif yang dihitung.' },
      { type: 'feature', text: 'Pegawai Non-Aktif: migration otomatis set semua pegawai existing menjadi aktif — backward compatibility terjaga.' },
      { type: 'improvement', text: 'Dashboard: statistik hanya menghitung pegawai aktif — angka lebih akurat dan relevan.' },
      { type: 'improvement', text: 'Peta Jabatan: matching pegawai hanya untuk pegawai aktif — pegawai non-aktif tidak muncul di daftar pemangku jabatan.' },
      { type: 'improvement', text: 'Data Builder: filter "Status Aktif" tersedia — dapat memfilter pegawai aktif/non-aktif dalam query.' },
    ],
  },
  {
    version: '2.18.0',
    date: '6 Mei 2026',
    changes: [
      { type: 'fix', text: 'Data Pegawai & Peta Jabatan: konsistensi data ditingkatkan dari 75% ke 95%+ — Employees.tsx kini menggunakan normalizeString() di 4 lokasi dan real-time subscription untuk sinkronisasi otomatis.' },
      { type: 'fix', text: 'Peta Jabatan: urutan hierarki jabatan berjenjang diperbaiki — 364 posisi Analis dan Pranata di 56 unit kini terurut dari senior ke junior (Ahli Utama → Ahli Madya → Ahli Muda → Ahli Pertama → Penyelia → Mahir → Terampil → Pelaksana).' },
      { type: 'fix', text: 'Peta Jabatan: urutan alfabetis dalam level yang sama diperbaiki — 165 posisi dalam level hierarki yang sama kini terurut A-Z (contoh: Analis Hukum sebelum Analis Keuangan dalam level Ahli Muda).' },
      { type: 'fix', text: 'Peta Jabatan: pengelompokan jabatan sejenis diperbaiki — 795 posisi di 25 unit kini berkelompok rapi (semua Arsiparis berurutan 1-6, lalu Analis Hukum 7-9, tanpa jabatan lain di tengah).' },
      { type: 'fix', text: 'Peta Jabatan: sorting frontend ditambahkan tiebreaker position_name — urutan konsisten di 3 query database dan export function (position_category → position_order → position_name).' },
      { type: 'feature', text: 'Data Builder: kolom "Nomor HP" (mobile_phone) tersedia untuk dipilih, difilter, dan diexport — kategori Data Pribadi (identity).' },
      { type: 'fix', text: 'Data Builder: filter Pangkat/Golongan diperbaiki — format filter kini cocok dengan database (contoh: "Pembina (IV/a)" bukan hanya "IV/a"), termasuk semua golongan I-IV dan PPPK (III, V, VII, IX).' },
      { type: 'fix', text: 'Data Builder: filter "(Tidak Ada)" untuk Non ASN diperbaiki — kini menampilkan 786 pegawai (781 Non ASN dengan rank_group "Tenaga Alih Daya" + "Tidak Ada" + NULL, plus 5 lainnya).' },
      { type: 'improvement', text: 'Peta Jabatan: verifikasi semua jabatan berjenjang — 569 jabatan (Instruktur, Widyaiswara, Arsiparis, Analis, Pranata, dll) sudah terurut dengan benar (0 issues found).' },
      { type: 'improvement', text: 'Data Pegawai: urutan tampil kini konsisten dengan Peta Jabatan — perubahan urutan di Peta Jabatan otomatis berlaku di Data Pegawai.' },
    ],
  },
  {
    version: '2.17.0',
    date: '6 Mei 2026',
    changes: [
      { type: 'feature', text: 'Dashboard: card statistik CPNS terpisah dari PNS — sebelumnya PNS dan CPNS digabung dalam satu card, kini CPNS memiliki card tersendiri untuk visibilitas lebih baik.' },
      { type: 'feature', text: 'Dashboard: fungsi get_dashboard_stats() diupdate untuk menghitung PNS murni (tanpa CPNS) dan CPNS terpisah — memungkinkan tracking jumlah CPNS secara independen.' },
      { type: 'feature', text: 'Peta Jabatan: export Excel "Peta Jabatan ASN Semua Unit Kerja" — admin pusat dapat export peta jabatan seluruh unit kerja dalam satu file Excel multi-sheet (1 sheet per unit kerja).' },
      { type: 'feature', text: 'Peta Jabatan: tombol export baru "Export Semua Unit" di tab Formasi ASN — tersedia untuk admin pusat, menghasilkan file dengan 28+ sheet (sesuai jumlah unit kerja).' },
      { type: 'feature', text: 'Peta Jabatan: setiap sheet berisi daftar lengkap jabatan per unit dengan kolom: No, Kategori, Nama Jabatan, ABK, Existing, Selisih, Pemangku Jabatan.' },
      { type: 'feature', text: 'Peta Jabatan: filter Satpel dan Workshop — admin pusat dapat memfilter unit kerja Satpel dan Workshop di tab Formasi ASN untuk fokus pada unit binaan.' },
      { type: 'feature', text: 'Data Audit: filter unit kerja untuk admin pusat — dapat memilih unit kerja spesifik atau "Semua Unit Kerja" untuk audit data.' },
      { type: 'feature', text: 'Data Audit: summary cards (Total Pegawai, Data Lengkap, Perlu Perbaikan, Tingkat Kelengkapan) kini ter-filter sesuai unit kerja yang dipilih.' },
      { type: 'feature', text: 'Data Audit: tabel masalah data kini menampilkan unit kerja pegawai di kolom terpisah — memudahkan identifikasi masalah per unit.' },
      { type: 'feature', text: 'Data Builder: sheet baru "Jumlah ASN per Unit" di export Agregasi Cepat — menampilkan tabel jumlah ASN (PNS + CPNS + PPPK), Non ASN, dan Total per unit kerja dalam format laporan bulanan resmi.' },
      { type: 'feature', text: 'Data Builder: sheet "Jumlah ASN per Unit" mengikuti urutan resmi unit kerja (Setditjen, 5 Direktorat, BNSP, 6 BBPVP, 20 BPVP, 12 Satpel, 3 Workshop) dengan baris JUMLAH di akhir.' },
      { type: 'fix', text: 'Data: perbaikan rank_group pegawai PPPK Ruslan Abdul Gani (NIP 198008142025211020) dari "IV" menjadi "III" — PPPK golongan III adalah golongan terendah PPPK, berbeda dengan PNS yang memiliki golongan IV.' },
      { type: 'improvement', text: 'Peta Jabatan: export semua unit menggunakan kompresi Excel untuk ukuran file lebih kecil — file dengan 28+ sheet tetap ringan dan cepat diunduh.' },
      { type: 'improvement', text: 'Data Audit: performa query dioptimalkan dengan filter unit kerja di level database — audit data unit besar lebih cepat.' },
    ],
  },
  {
    version: '2.16.0',
    date: '5 Mei 2026',
    changes: [
      { type: 'feature', text: 'Data Pegawai: field baru Nomor HP, Nomor Telepon, dan Alamat — ditampilkan di detail pegawai pada section "Kontak & Alamat".' },
      { type: 'feature', text: 'Data Pegawai: field TMT Golongan (tmt_gol) — mencatat tanggal mulai berlaku golongan/pangkat terakhir.' },
      { type: 'feature', text: 'Import Data: tab baru "Daftar Pegawai" — import data kontak dan alamat pegawai dari format Excel daftar pegawai (NIP, Nama, Tempat/Tgl Lahir, Alamat, Telepon, No. HP, TMT Gol, Pendidikan Terakhir). Hanya field yang terisi yang diperbarui, field kosong tidak menghapus data yang sudah ada.' },
      { type: 'feature', text: 'Import Data: import Daftar Pegawai juga memperbarui riwayat pendidikan (education_history) secara otomatis dari kolom Pendidikan Terakhir di Excel.' },
      { type: 'improvement', text: 'Detail Pegawai: label NIP berubah menjadi NIK untuk pegawai Non ASN.' },
      { type: 'improvement', text: 'Informasi Sistem: tombol "Periksa Pembaruan" di pojok kanan atas — user dapat memeriksa update secara manual tanpa menunggu banner otomatis.' },
      { type: 'improvement', text: 'Informasi Sistem: card "Versi Saat Ini" menampilkan badge "Versi Lama" dan nomor versi terbaru saat ada update tersedia, serta badge "✓ Terkini" setelah cek manual berhasil.' },
      { type: 'fix', text: 'Informasi Sistem: versi yang ditampilkan di card kini sinkron dengan package.json — sebelumnya selalu menampilkan 0.0.0.' },
    ],
  },
  {
    version: '2.15.0',
    date: '5 Mei 2026',
    changes: [
      { type: 'fix', text: 'Auth: cooldown login kini menampilkan countdown mundur yang akurat (misal "Tunggu 28 detik...") — sebelumnya tombol hanya menampilkan "Tunggu sebentar..." tanpa update.' },
      { type: 'fix', text: 'Auth: cooldown timer menggunakan useEffect + setInterval agar tombol reaktif setiap detik, bukan hanya saat re-render.' },
      { type: 'fix', text: 'Data Pegawai: hapus import NoteData yang tidak digunakan dari @/types/employee.' },
      { type: 'fix', text: 'Data Pegawai: tambah batas maksimal iterasi (50x) pada loop fetch position_references dan employees untuk mencegah infinite loop.' },
      { type: 'fix', text: 'Data Pegawai: ganti (d: any) dengan tipe yang proper di handleViewDetails untuk education history.' },
      { type: 'fix', text: 'Profile: perbaikan dependency array useEffect untuk profileForm.reset — sebelumnya profileForm tidak masuk dependency.' },
    ],
  },
  {
    version: '2.14.0',
    date: '5 Mei 2026',
    changes: [
      { type: 'fix', text: 'useAuth: perbaikan race condition — flag isFetching mencegah double-fetch profile saat onAuthStateChange dan getSession terpanggil bersamaan.' },
      { type: 'fix', text: 'ResetPassword: tambah .catch() pada getSession() — network error kini ditangani dengan pesan yang jelas dan redirect ke halaman login.' },
      { type: 'fix', text: 'useDataAudit: ganti parameter any dengan interface RawEmployeeAuditData yang proper — type safety lebih baik.' },
      { type: 'fix', text: 'EmployeeDetailsModal: logger.debug dipindah dari render function ke useEffect — tidak lagi log setiap render. Tab juga di-reset ke Data Utama saat pegawai berubah.' },
      { type: 'fix', text: 'usePetaJabatanStats: while(true) diganti dengan batas maksimal 50 iterasi (50.000 records) untuk mencegah infinite loop.' },
      { type: 'feature', text: 'Login: cooldown UI setelah 5 kali gagal login — tombol dinonaktifkan 30 detik untuk mencegah brute force.' },
      { type: 'improvement', text: 'Kelola Admin: info box peringatan bahwa admin baru perlu konfirmasi email sebelum bisa login. Deteksi email duplikat lebih akurat.' },
      { type: 'improvement', text: 'Quick Action Mutasi: dialog konfirmasi sebelum mutasi diterapkan — menampilkan detail dari/ke unit dan jabatan baru.' },
    ],
  },
  {
    version: '2.13.0',
    date: '5 Mei 2026',
    changes: [
      { type: 'fix', text: 'QuickActionForm: hapus 5 console.log debug yang tertinggal di production code.' },
      { type: 'fix', text: 'QuickActionForm: ganti 5 alert() browser native dengan toast notification yang konsisten dengan UI aplikasi.' },
      { type: 'fix', text: 'EmployeeFormModal: ganti 3 console.log dengan logger.debug() agar tidak muncul di production.' },
      { type: 'fix', text: 'GlobalEmployeeSearch: ganti console.error dengan logger.error() dan hapus import Badge yang tidak digunakan.' },
      { type: 'fix', text: 'useNotifications: ganti console.error dengan logger.error() di fungsi createNotification.' },
      { type: 'improvement', text: 'QuickActionForm: tambah import useToast untuk mendukung toast notification pada validasi form.' },
    ],
  },
  {
    version: '2.12.1',
    date: '5 Mei 2026',
    changes: [
      { type: 'fix', text: 'useAuth: hapus fungsi signUp dan deklarasinya dari AuthContextType — tidak digunakan sejak halaman signup dihapus.' },
      { type: 'fix', text: 'Monitoring Unit: filter bulan menggunakan format date yang salah (toISOString() menghasilkan UTC penuh) — diperbaiki menggunakan nilai yyyy-MM-dd langsung.' },
      { type: 'fix', text: 'Data Pegawai: hapus import ikon yang tidak digunakan (CheckSquare, Square, ChevronUp) dari lucide-react.' },
      { type: 'fix', text: 'Audit Data: hapus import Filter (ikon tidak digunakan) dan isAdminPusat (variabel tidak digunakan) dari halaman.' },
    ],
  },
  {
    version: '2.12.0',
    date: '5 Mei 2026',
    changes: [
      { type: 'feature', text: 'Reset Password: fitur "Lupa Password?" di halaman login — kirim link reset ke email, halaman /reset-password untuk membuat password baru.' },
      { type: 'feature', text: 'Dark Mode: tombol toggle mode gelap/terang di header aplikasi — preferensi disimpan otomatis di browser.' },
      { type: 'feature', text: 'Pencarian Global Pegawai: tombol pencarian di header untuk admin pusat dan admin pimpinan — cari pegawai berdasarkan nama atau NIP di seluruh unit kerja sekaligus.' },
      { type: 'feature', text: 'Bulk Edit Pegawai: checkbox multi-select di tabel Data Pegawai — pilih beberapa pegawai sekaligus untuk pindah unit kerja atau ubah status ASN.' },
      { type: 'feature', text: 'Notifikasi Admin Pimpinan: admin pimpinan kini menerima notifikasi real-time untuk semua perubahan data pegawai (tambah, edit, hapus).' },
      { type: 'improvement', text: 'Profile: tambah form edit nama lengkap dan informasi login terakhir di halaman Profil Saya.' },
      { type: 'improvement', text: 'Sidebar: status collapse/expand sidebar kini tersimpan di browser — tidak reset saat halaman di-refresh.' },
      { type: 'improvement', text: 'Halaman 404: tampilan lebih informatif dengan tombol "Kembali" dan "Ke Dashboard".' },
      { type: 'fix', text: 'Audit Data: kalkulasi "Tingkat Kelengkapan" diperbaiki — sebelumnya menggunakan angka hardcoded 100, kini menggunakan total pegawai aktual.' },
      { type: 'fix', text: 'Peta Jabatan: double fetch data dihilangkan — sebelumnya fetchData() dipanggil dua kali saat komponen mount.' },
      { type: 'fix', text: 'Peta Jabatan: dialog konfirmasi hapus Non-ASN kini menggunakan komponen Dialog yang konsisten, bukan browser confirm() native.' },
      { type: 'fix', text: 'Peta Jabatan: validasi duplikat nama jabatan — tidak bisa menambahkan jabatan dengan nama yang sama dalam kategori dan unit yang sama.' },
      { type: 'fix', text: 'constants.ts: hapus duplicate key "Satpel Jayapura" di UNIT_PEMBINA_MAPPING yang menyebabkan warning saat build.' },
    ],
  },
  {
    version: '2.11.0',
    date: '4 Mei 2026',
    changes: [
      { type: 'feature', text: 'Akses Unit Binaan: Admin unit pembina kini dapat mengakses dan mengelola data pegawai di unit binaan (Satpel/Workshop) — 10 unit pembina dapat mengelola 26 unit binaan dengan total 1.605 pegawai.' },
      { type: 'feature', text: 'Data Pegawai: dropdown unit kerja otomatis muncul untuk admin unit yang memiliki unit binaan — memudahkan navigasi antara unit utama dan unit binaan.' },
      { type: 'feature', text: 'Mapping Unit Pembina: BBPVP Serang (3 unit binaan), BBPVP Bekasi (2 unit), BBPVP Makassar (6 unit), BBPVP Medan (2 unit), BPVP Surakarta (1 unit), BPVP Padang (2 unit), BPVP Lombok Timur (2 unit), BPVP Ternate (3 unit), BPVP Sorong (1 unit), BPVP Samarinda (2 unit).' },
      { type: 'improvement', text: 'Database: fungsi get_accessible_departments() untuk mengelola akses multi-unit secara terpusat — memudahkan maintenance dan konsistensi akses.' },
      { type: 'improvement', text: 'RLS Policies: semua tabel (employees, position_references, history tables) diupdate untuk mendukung akses unit binaan secara otomatis.' },
      { type: 'fix', text: 'Data Pegawai: perbaikan grouping logic untuk Non ASN — data Non ASN kini muncul di tab terpisah tanpa filter position_type yang tidak relevan.' },
      { type: 'fix', text: 'Admin Pusat: perbaikan filter unit kerja — admin pusat kembali dapat mengakses semua unit kerja tanpa pembatasan.' },
    ],
  },
  {
    version: '2.10.0',
    date: '4 Mei 2026',
    changes: [
      { type: 'feature', text: 'Data Pegawai: field "Kejuruan" untuk jabatan Instruktur — mencatat bidang keahlian instruktur seperti Otomotif, TIK, Las, Manufaktur, Refrigerasi, dll (40+ pilihan kejuruan).' },
      { type: 'feature', text: 'Data Builder: kolom "Kejuruan" tersedia untuk dipilih, difilter, dan diexport — mendukung 47 pilihan kejuruan dengan operator filter lengkap (sama dengan, mengandung, salah satu dari).' },
      { type: 'improvement', text: 'Form Pegawai: field Kejuruan hanya aktif jika jabatan adalah Instruktur (Instruktur Ahli Utama/Madya/Muda/Pertama, Instruktur Penyelia/Mahir/Terampil/Pelaksana).' },
      { type: 'improvement', text: 'Detail Pegawai: field Kejuruan ditampilkan di section Data Kepegawaian dengan label khusus "(Instruktur)".' },
      { type: 'fix', text: 'Data Pegawai: menghilangkan kategori "LAINNYA" yang tidak seharusnya muncul — kini hanya menampilkan 3 kategori standar: Struktural, Fungsional, dan Pelaksana.' },
      { type: 'improvement', text: 'Data Pegawai: pegawai dengan jenis jabatan tidak valid akan di-skip dari tampilan untuk menjaga konsistensi data.' },
      { type: 'improvement', text: 'Data Pegawai: validasi jenis jabatan diperkuat — hanya menerima nilai Struktural, Fungsional, atau Pelaksana.' },
    ],
  },
  {
    version: '2.9.0',
    date: '30 April 2026',
    changes: [
      { type: 'feature', text: 'Data Builder: filter pada kolom "Jabatan Sesuai Kepmen 202/2024" kini otomatis mencari juga di kolom "Jabatan Tambahan/PLT" — pegawai PLT muncul tanpa perlu memilih kolom PLT.' },
      { type: 'improvement', text: 'Data Builder: tabel preview menampilkan badge PLT (kuning) di bawah jabatan definitif jika pegawai memiliki jabatan PLT.' },
      { type: 'improvement', text: 'Data Builder: export Excel kolom Jabatan menyertakan keterangan PLT dalam satu cell — contoh: "Kepala Subbagian Umum (PLT: Plt. Kepala)".' },
      { type: 'feature', text: 'Data Builder: kolom virtual "Jabatan (termasuk PLT)" tersedia untuk filter sekaligus di jabatan definitif dan jabatan PLT.' },
      { type: 'fix', text: 'Data Builder: perbaikan filter dengan nilai yang mengandung karakter spesial (titik, koma, tanda kurung) — nilai kini di-quote agar tidak merusak parsing query PostgREST.' },
      { type: 'fix', text: 'Data Builder: field yang digunakan sebagai filter kini selalu ikut di-fetch meskipun kolom tidak dipilih di ColumnSelector.' },
    ],
  },
  {
    version: '2.8.0',
    date: '30 April 2026',
    changes: [
      { type: 'feature', text: 'Auto-update detection — aplikasi mendeteksi versi baru secara otomatis setiap 5 menit dan saat tab kembali aktif. Banner notifikasi muncul di atas halaman dengan tombol "Perbarui Sekarang".' },
      { type: 'improvement', text: 'Cache header Vercel dioptimalkan: index.html selalu fresh (no-cache), file JS/CSS di-cache permanen (immutable) karena sudah menggunakan content hash.' },
      { type: 'improvement', text: 'User tidak perlu lagi clear cache browser secara manual untuk mendapatkan versi terbaru aplikasi.' },
    ],
  },
  {
    version: '2.7.0',
    date: '30 April 2026',
    changes: [
      { type: 'feature', text: 'Fitur PLT (Pelaksana Tugas): field "Jabatan Tambahan / PLT" di form pegawai kini mendukung pencatatan jabatan PLT. Contoh: PLT Direktur, PLT Kepala Bagian Umum.' },
      { type: 'improvement', text: 'Data Pegawai: kolom Jabatan menampilkan badge PLT (kuning) atau jabatan tambahan (biru) di bawah jabatan definitif secara langsung di tabel.' },
      { type: 'improvement', text: 'Data Pegawai: export CSV kini menyertakan kolom "Jabatan Tambahan / PLT".' },
      { type: 'improvement', text: 'Data Builder: kolom "Jabatan Tambahan / PLT" tersedia untuk dipilih dan diexport, deskripsi diperbarui.' },
      { type: 'fix', text: 'Peta Jabatan tidak terpengaruh oleh data PLT — matching pegawai ke jabatan tetap hanya berdasarkan jabatan definitif (position_name).' },
      { type: 'fix', text: 'Data Pegawai: perbaikan urutan tampil untuk admin pusat — pegawai kini diurutkan berdasarkan unit kerja + urutan jabatan per unit (bukan lintas unit).' },
      { type: 'fix', text: 'Peta Jabatan: perbaikan urutan jabatan Direktur di 4 unit Direktorat — Direktur kini selalu di urutan 1 Struktural.' },
    ],
  },
  {
    version: '2.6.0',
    date: '30 April 2026',
    changes: [
      { type: 'feature', text: 'Menu Informasi Sistem — riwayat update, fitur, dan perbaikan aplikasi dapat diakses semua pengguna.' },
      { type: 'feature', text: 'Peta Jabatan: logika reorder jabatan — mengubah urutan jabatan kini menggeser jabatan lain secara otomatis (shift up/down). Perubahan lintas kategori juga ditangani dengan benar.' },
      { type: 'feature', text: 'Peta Jabatan: tombol "Perbaiki Urutan" untuk admin pusat — memperbaiki position_order semua jabatan sekaligus berdasarkan urutan tampil saat ini.' },
      { type: 'improvement', text: 'Peta Jabatan: field Urutan di modal edit kini menampilkan nilai aktual dan batas maksimal urutan dalam kategori secara dinamis.' },
      { type: 'feature', text: 'Data Pegawai: urutan tampil kini mengikuti urutan Peta Jabatan (department → kategori → position_order) bukan lagi import_order.' },
      { type: 'feature', text: 'Data Builder: operator filter baru "Persis sama dengan" — mencocokkan nilai field secara exact (case-insensitive). Contoh: "Kepala" tidak akan cocok dengan "Kepala Bagian Umum".' },
      { type: 'improvement', text: 'Data Builder: setiap operator filter kini dilengkapi hint penjelasan cara kerjanya.' },
      { type: 'fix', text: 'Data Builder: kolom Nama di export kini menyertakan gelar depan dan belakang (front_title + name + back_title).' },
      { type: 'fix', text: 'Data Builder: data hasil query kini selalu diurutkan berdasarkan Unit Kerja lalu Nama, meskipun kolom Unit Kerja tidak dipilih.' },
      { type: 'fix', text: 'Data Builder: advanced filter dengan banyak kondisi pada field yang sama kini digabung dengan OR (bukan AND yang saling bertentangan).' },
      { type: 'improvement', text: 'Data Builder: batas maksimal 5 advanced filter per kolom untuk mencegah query terlalu kompleks.' },
      { type: 'feature', text: 'Peta Jabatan Summary ASN: filter per unit kerja untuk admin pusat — summary cards dan tabel jabatan ikut ter-filter.' },
      { type: 'feature', text: 'Peta Jabatan Summary Non-ASN: filter per unit kerja untuk admin pusat.' },
      { type: 'feature', text: 'Export Summary ASN: sheet baru "Detail Jabatan per Unit" — daftar lengkap jabatan per unit kerja dengan subtotal.' },
    ],
  },
  {
    version: '2.5.0',
    date: '21 April 2026',
    changes: [
      { type: 'feature', text: 'Monitoring Unit: fitur pemantauan aktivitas perubahan data per unit kerja secara bulanan.' },
      { type: 'feature', text: 'Monitoring Unit: detail perubahan per unit dapat dilihat per bulan (mutasi, jabatan, pangkat, dll).' },
      { type: 'improvement', text: 'Monitoring Unit: bulk import dikecualikan dari hitungan aktivitas agar data lebih akurat.' },
      { type: 'feature', text: 'Riwayat perubahan kini mencatat siapa yang melakukan perubahan (created_by) secara otomatis via trigger database.' },
      { type: 'fix', text: 'Perbaikan RLS (Row Level Security) untuk operasi mutasi pegawai.' },
      { type: 'fix', text: 'Perbaikan insert riwayat setelah operasi mutasi.' },
    ],
  },
  {
    version: '2.4.0',
    date: 'April 2026',
    changes: [
      { type: 'feature', text: 'Audit Data: fitur pemeriksaan kualitas data pegawai — deteksi data kosong, tidak konsisten, dan duplikat.' },
      { type: 'feature', text: 'Audit Data: laporan audit dapat diexport ke Excel.' },
      { type: 'improvement', text: 'Validasi field rank_group (pangkat/golongan) diperbaiki dan distandarisasi.' },
    ],
  },
  {
    version: '2.3.0',
    date: 'April 2026',
    changes: [
      { type: 'feature', text: 'Data Builder: agregasi cepat (Quick Aggregation) — hitung jumlah pegawai berdasarkan kombinasi field secara instan.' },
      { type: 'feature', text: 'Data Builder: template query tersimpan — simpan dan muat kembali konfigurasi kolom + filter.' },
      { type: 'improvement', text: 'Data Builder: pagination data hasil query untuk performa lebih baik.' },
      { type: 'fix', text: 'Data Builder: perbaikan export Excel untuk dataset besar (chunking).' },
    ],
  },
  {
    version: '2.2.0',
    date: 'Maret 2026',
    changes: [
      { type: 'feature', text: 'Peta Jabatan: tab Summary ASN dan Summary Non-ASN dengan kartu statistik per kategori.' },
      { type: 'feature', text: 'Peta Jabatan: tabel summary per unit kerja dan per jabatan dengan expand detail pemangku.' },
      { type: 'feature', text: 'Peta Jabatan: export summary ke Excel (multi-sheet: per unit, per jabatan, per kategori).' },
      { type: 'improvement', text: 'Peta Jabatan: filter pencarian jabatan dan nama pegawai secara real-time.' },
    ],
  },
  {
    version: '2.1.0',
    date: 'Maret 2026',
    changes: [
      { type: 'feature', text: 'Import Non-ASN: import data pegawai Non-ASN dari file Excel.' },
      { type: 'feature', text: 'Peta Jabatan: tab Formasi Non-ASN — tampilkan dan kelola data pegawai Non-ASN per unit.' },
      { type: 'improvement', text: 'Filter status ASN (PNS, CPNS, PPPK, Non-ASN) di halaman Data Pegawai.' },
    ],
  },
  {
    version: '2.0.0',
    date: 'Februari 2026',
    changes: [
      { type: 'feature', text: 'Data Builder: query builder fleksibel — pilih kolom, filter, dan export data pegawai ke Excel.' },
      { type: 'feature', text: 'Peta Jabatan: manajemen jabatan sesuai Kepmen 202 Tahun 2024 per unit kerja.' },
      { type: 'feature', text: 'Peta Jabatan: matching otomatis pegawai ke jabatan berdasarkan position_name.' },
      { type: 'feature', text: 'Admin Pimpinan: role baru dengan akses baca semua unit tanpa bisa edit.' },
      { type: 'improvement', text: 'Notifikasi real-time untuk perubahan data pegawai.' },
    ],
  },
  {
    version: '1.0.0',
    date: 'Januari 2026',
    changes: [
      { type: 'feature', text: 'Rilis perdana SIMPEL — Sistem Manajemen Pegawai Lavotas.' },
      { type: 'feature', text: 'Manajemen data pegawai ASN: tambah, edit, hapus, dan lihat detail.' },
      { type: 'feature', text: 'Riwayat mutasi, jabatan, pangkat, pendidikan, kompetensi, dan pelatihan.' },
      { type: 'feature', text: 'Import data ASN dari file Excel.' },
      { type: 'feature', text: 'Dashboard statistik pegawai per unit kerja.' },
      { type: 'feature', text: 'Manajemen admin: kelola akun admin unit dan admin pusat.' },
      { type: 'feature', text: 'Manajemen unit kerja (departemen).' },
      { type: 'feature', text: 'Autentikasi dan otorisasi berbasis role (admin_pusat, admin_unit, admin_pimpinan).' },
    ],
  },
];

const TYPE_CONFIG = {
  feature: { label: 'Fitur Baru', icon: Sparkles, className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' },
  fix: { label: 'Perbaikan', icon: Wrench, className: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300' },
  improvement: { label: 'Peningkatan', icon: CheckCircle2, className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' },
};

const FEATURES_OVERVIEW = [
  {
    category: 'AI Chatbot',
    icon: '🤖',
    items: [
      'Asisten AI untuk menjawab pertanyaan tentang data pegawai',
      'Query natural language — tanya dengan bahasa sehari-hari',
      '12 backend functions: search, statistics, position analysis, retirement forecast, comparison, dll',
      'AI Function Calling — AI otomatis memilih function yang tepat',
      'Markdown rendering — tabel, heading, lists, code blocks ditampilkan rapi',
      'Context awareness — AI mengingat percakapan sebelumnya',
      'Keepalive request — tetap berjalan saat switch tab atau minimize browser',
      'Retry logic — 3x percobaan otomatis jika network error',
      'Floating chat widget — akses mudah dari pojok kanan bawah',
      'Suggested questions — contoh pertanyaan untuk memulai',
    ],
  },
  {
    category: 'Pengumuman',
    icon: '📢',
    items: [
      'Buat, edit, hapus, dan publikasikan pengumuman (admin pusat)',
      'Banner notifikasi di atas dashboard untuk pengumuman aktif',
      'Halaman daftar pengumuman untuk semua user',
      'Rich text editor — formatting text, lists, links, styling',
      'Prioritas pengumuman: Penting (merah), Normal (biru), Info (hijau)',
      'Penjadwalan publikasi — set tanggal mulai dan berakhir',
      'Pengumuman otomatis muncul/hilang sesuai jadwal',
      'Badge jumlah pengumuman aktif di menu',
    ],
  },
  {
    category: 'Data Pegawai',
    icon: '👥',
    items: [
      'Tambah, edit, hapus data pegawai ASN dan Non-ASN',
      'Status Aktif/Non-Aktif — tandai pegawai yang sudah tidak aktif (pensiun, pindah, resign)',
      'Filter "Status Aktif" — toggle antara pegawai aktif dan non-aktif',
      'Badge "Non-Aktif" di tabel dan detail pegawai',
      'Pegawai non-aktif dikecualikan dari dashboard stats dan peta jabatan',
      'Riwayat mutasi, jabatan, pangkat, pendidikan, kompetensi, dan pelatihan',
      'Detail lengkap pegawai dengan catatan penempatan dan penugasan',
      'Filter berdasarkan unit kerja, status ASN, status aktif, dan pencarian nama/NIP',
      'Akses Unit Binaan — admin unit pembina dapat mengelola data pegawai di unit binaan (Satpel/Workshop)',
      'Dropdown unit kerja otomatis untuk admin unit dengan unit binaan — navigasi mudah antara unit utama dan unit binaan',
      'Urutan tampil mengikuti struktur Peta Jabatan per unit kerja',
      'Pencatatan Pelaksana Tugas (PLT) — badge PLT tampil langsung di tabel, tidak mempengaruhi Peta Jabatan',
      'Field Kejuruan untuk jabatan Instruktur — mencatat bidang keahlian (Otomotif, TIK, Las, Manufaktur, dll)',
      'Export CSV menyertakan kolom Jabatan Tambahan / PLT dan Status Aktif',
    ],
  },
  {
    category: 'Peta Jabatan',
    icon: '🗺️',
    items: [
      'Daftar jabatan sesuai Kepmen 202 Tahun 2024 per unit kerja',
      'Matching otomatis pegawai aktif ke jabatan definitif (Struktural, Fungsional, Pelaksana)',
      'Pegawai non-aktif tidak muncul di daftar pemangku jabatan',
      'Formasi Non-ASN per unit kerja',
      'Summary ASN dan Non-ASN dengan statistik ABK vs Existing (hanya pegawai aktif)',
      'Filter per unit kerja untuk admin pusat',
      'Export ke Excel (multi-sheet: per unit, per jabatan, per kategori, detail per unit)',
      'Manajemen urutan jabatan dengan reorder otomatis — mengubah urutan menggeser jabatan lain secara otomatis',
      'Tombol "Perbaiki Urutan" untuk normalisasi urutan semua jabatan sekaligus',
    ],
  },
  {
    category: 'Data Builder',
    icon: '🔧',
    items: [
      'Query builder fleksibel — pilih kolom dan filter sesuai kebutuhan',
      'Filter Status Aktif — dapat memfilter pegawai aktif/non-aktif',
      'Filter canggih: Sama dengan (case-sensitive), Persis sama dengan (case-insensitive), Mengandung, Mengandung kata utuh, Salah satu dari',
      'Filter kolom Jabatan otomatis mencari di jabatan PLT — pegawai PLT muncul tanpa perlu memilih kolom PLT',
      'Kolom Kejuruan tersedia untuk instruktur — pilih, filter, dan export data kejuruan (47 pilihan kejuruan)',
      'Tabel preview menampilkan badge PLT dan badge Non-Aktif',
      'Export Excel: jabatan PLT ditampilkan dalam satu cell bersama jabatan definitif',
      'Advanced filter per kolom dengan logika OR dalam satu field, maksimal 5 kondisi per kolom',
      'Template query tersimpan untuk penggunaan berulang',
      'Agregasi cepat (Quick Aggregation) — hitung jumlah per kombinasi field',
      'Export ke Excel dengan nama lengkap (gelar depan + nama + gelar belakang)',
      'Data selalu diurutkan berdasarkan Unit Kerja lalu Nama',
    ],
  },
  {
    category: 'Audit Data',
    icon: '🔍',
    items: [
      'Deteksi data pegawai yang tidak lengkap atau tidak konsisten',
      'Laporan audit dapat diexport ke Excel',
      'Tersedia untuk admin unit dan admin pusat',
    ],
  },
  {
    category: 'Monitoring Unit',
    icon: '📊',
    items: [
      'Pantau aktivitas perubahan data per unit kerja secara bulanan',
      'Detail perubahan: mutasi, jabatan, pangkat, pendidikan, dll',
      'Tersedia untuk admin pusat dan admin pimpinan',
    ],
  },
  {
    category: 'Import Data',
    icon: '📥',
    items: [
      'Import data ASN dari file Excel (admin pusat)',
      'Import data Non-ASN dari file Excel (admin pusat)',
      'Validasi data sebelum import',
    ],
  },
  {
    category: 'Manajemen Sistem',
    icon: '⚙️',
    items: [
      'Kelola akun admin (admin pusat, admin unit, admin pimpinan)',
      'Kelola unit kerja (departemen)',
      'Pengumuman untuk semua user (admin pusat)',
      'Notifikasi real-time untuk perubahan data',
      'AI Chatbot untuk query data pegawai',
      'Auto-update detection — banner notifikasi muncul otomatis saat ada versi baru, tanpa perlu clear cache manual',
      'Profil pengguna',
      'Menu Informasi Sistem — riwayat versi, fitur, dan perbaikan aplikasi',
      'Dark mode — toggle mode gelap/terang',
      'Reset password — fitur lupa password dengan email',
    ],
  },
];

function ReleaseCard({ release, defaultOpen }: { release: Release; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen ?? false);

  const featureCount = release.changes.filter(c => c.type === 'feature').length;
  const fixCount = release.changes.filter(c => c.type === 'fix').length;
  const improvementCount = release.changes.filter(c => c.type === 'improvement').length;

  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      <button
        className="w-full flex items-center justify-between gap-3 p-4 hover:bg-muted/40 transition-colors text-left"
        onClick={() => setOpen(v => !v)}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-sm">Versi {release.version}</span>
              {release.label && (
                <Badge className="text-[10px] px-1.5 py-0 bg-primary text-primary-foreground">
                  {release.label}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
              <Clock className="h-3 w-3" />
              <span>{release.date}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="hidden sm:flex items-center gap-1.5">
            {featureCount > 0 && (
              <span className="text-[10px] bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 px-1.5 py-0.5 rounded-full font-medium">
                {featureCount} fitur
              </span>
            )}
            {improvementCount > 0 && (
              <span className="text-[10px] bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 px-1.5 py-0.5 rounded-full font-medium">
                {improvementCount} peningkatan
              </span>
            )}
            {fixCount > 0 && (
              <span className="text-[10px] bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300 px-1.5 py-0.5 rounded-full font-medium">
                {fixCount} perbaikan
              </span>
            )}
          </div>
          {open ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
        </div>
      </button>

      {open && (
        <div className="border-t px-4 pb-4 pt-3 space-y-2">
          {release.changes.map((change, idx) => {
            const cfg = TYPE_CONFIG[change.type];
            const Icon = cfg.icon;
            return (
              <div key={idx} className="flex items-start gap-2.5">
                <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium flex-shrink-0 mt-0.5', cfg.className)}>
                  <Icon className="h-2.5 w-2.5" />
                  {cfg.label}
                </span>
                <span className="text-sm text-foreground/90 leading-relaxed">{change.text}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function SystemInfo() {
  const [activeTab, setActiveTab] = useState<'changelog' | 'features'>('changelog');
  const { updateAvailable, latestVersion, isUpToDate, applyUpdate, checkForUpdate } = useAppUpdate();
  const [isChecking, setIsChecking] = useState(false);
  const [justChecked, setJustChecked] = useState(false);

  const currentVersion = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : RELEASES[0].version;
  const totalFeatures = RELEASES.flatMap(r => r.changes).filter(c => c.type === 'feature').length;
  const totalFixes = RELEASES.flatMap(r => r.changes).filter(c => c.type === 'fix').length;

  const handleManualCheck = async () => {
    if (updateAvailable) {
      applyUpdate();
      return;
    }
    setIsChecking(true);
    setJustChecked(false);
    await checkForUpdate();
    setIsChecking(false);
    setJustChecked(true);
    // Reset "sudah terkini" badge setelah 5 detik
    setTimeout(() => setJustChecked(false), 5000);
  };

  return (
    <AppLayout>
      <div className="space-y-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="page-header">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 flex-shrink-0 mt-0.5">
                <Info className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="page-title">Informasi Sistem</h1>
                <p className="page-description">
                  Riwayat pembaruan, fitur, dan perbaikan aplikasi SIMPEL.
                </p>
              </div>
            </div>
            <Button
              variant={updateAvailable ? 'default' : 'outline'}
              size="sm"
              onClick={handleManualCheck}
              disabled={isChecking}
              className="flex-shrink-0 gap-2"
            >
              <RefreshCw className={cn('h-4 w-4', isChecking && 'animate-spin')} />
              {updateAvailable ? 'Perbarui Sekarang' : isChecking ? 'Memeriksa...' : 'Periksa Pembaruan'}
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Versi Saat Ini — menampilkan status update */}
          <Card className={cn(
            'shadow-sm col-span-2 sm:col-span-1',
            updateAvailable && 'border-orange-300 dark:border-orange-700',
            isUpToDate === true && justChecked && 'border-green-300 dark:border-green-700',
          )}>
            <CardContent className="pt-4 pb-3 px-4">
              <div className="flex items-start justify-between gap-1">
                <div className={cn(
                  'text-2xl font-bold',
                  updateAvailable ? 'text-orange-500 dark:text-orange-400' : 'text-primary',
                )}>
                  {currentVersion}
                </div>
                {updateAvailable && (
                  <span className="text-[10px] font-semibold bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300 px-1.5 py-0.5 rounded-full whitespace-nowrap mt-1">
                    Versi Lama
                  </span>
                )}
                {isUpToDate === true && justChecked && !updateAvailable && (
                  <span className="text-[10px] font-semibold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 px-1.5 py-0.5 rounded-full whitespace-nowrap mt-1">
                    ✓ Terkini
                  </span>
                )}
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">Versi Saat Ini</div>
              {updateAvailable && latestVersion && (
                <div className="text-xs text-orange-600 dark:text-orange-400 mt-1 font-medium">
                  Tersedia: v{latestVersion}
                </div>
              )}
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardContent className="pt-4 pb-3 px-4">
              <div className="text-2xl font-bold">{RELEASES.length}</div>
              <div className="text-xs text-muted-foreground mt-0.5">Total Rilis</div>
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardContent className="pt-4 pb-3 px-4">
              <div className="text-2xl font-bold text-blue-600">{totalFeatures}</div>
              <div className="text-xs text-muted-foreground mt-0.5">Fitur Ditambahkan</div>
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardContent className="pt-4 pb-3 px-4">
              <div className="text-2xl font-bold text-orange-600">{totalFixes}</div>
              <div className="text-xs text-muted-foreground mt-0.5">Bug Diperbaiki</div>
            </CardContent>
          </Card>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-1 border-b">
          <button
            onClick={() => setActiveTab('changelog')}
            className={cn(
              'px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px',
              activeTab === 'changelog'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            Riwayat Pembaruan
          </button>
          <button
            onClick={() => setActiveTab('features')}
            className={cn(
              'px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px',
              activeTab === 'features'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            Fitur Aplikasi
          </button>
        </div>

        {/* Changelog Tab */}
        {activeTab === 'changelog' && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>Klik pada versi untuk melihat detail perubahan</span>
            </div>
            {RELEASES.map((release, idx) => (
              <ReleaseCard key={release.version} release={release} defaultOpen={idx === 0} />
            ))}
          </div>
        )}

        {/* Features Tab */}
        {activeTab === 'features' && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Daftar lengkap fitur yang tersedia di SIMPEL berdasarkan modul.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              {FEATURES_OVERVIEW.map(section => (
                <Card key={section.category} className="shadow-sm">
                  <CardHeader className="pb-2 pt-4 px-4">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <span className="text-base">{section.icon}</span>
                      {section.category}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 pb-4">
                    <ul className="space-y-1.5">
                      {section.items.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-xs text-foreground/80">
                          <CheckCircle2 className="h-3.5 w-3.5 text-green-500 flex-shrink-0 mt-0.5" />
                          <span className="leading-relaxed">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Separator />

            {/* Legend */}
            <div className="rounded-lg border bg-muted/30 p-4">
              <p className="text-xs font-semibold text-muted-foreground mb-3">Keterangan Tipe Perubahan</p>
              <div className="flex flex-wrap gap-3">
                {Object.entries(TYPE_CONFIG).map(([key, cfg]) => {
                  const Icon = cfg.icon;
                  return (
                    <div key={key} className="flex items-center gap-1.5">
                      <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium', cfg.className)}>
                        <Icon className="h-2.5 w-2.5" />
                        {cfg.label}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {key === 'feature' ? '— Fungsi baru yang ditambahkan' :
                         key === 'fix' ? '— Bug atau kesalahan yang diperbaiki' :
                         '— Fungsi yang sudah ada diperbaiki/ditingkatkan'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
