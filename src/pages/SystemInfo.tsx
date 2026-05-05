import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Info, Wrench, Sparkles, CheckCircle2, Clock, ChevronDown, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

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
    version: '2.12.1',
    date: '5 Mei 2026',
    label: 'Terbaru',
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
    category: 'Data Pegawai',
    icon: '👥',
    items: [
      'Tambah, edit, hapus data pegawai ASN dan Non-ASN',
      'Riwayat mutasi, jabatan, pangkat, pendidikan, kompetensi, dan pelatihan',
      'Detail lengkap pegawai dengan catatan penempatan dan penugasan',
      'Filter berdasarkan unit kerja, status ASN, dan pencarian nama/NIP',
      'Akses Unit Binaan — admin unit pembina dapat mengelola data pegawai di unit binaan (Satpel/Workshop)',
      'Dropdown unit kerja otomatis untuk admin unit dengan unit binaan — navigasi mudah antara unit utama dan unit binaan',
      'Urutan tampil mengikuti struktur Peta Jabatan per unit kerja',
      'Pencatatan Pelaksana Tugas (PLT) — badge PLT tampil langsung di tabel, tidak mempengaruhi Peta Jabatan',
      'Field Kejuruan untuk jabatan Instruktur — mencatat bidang keahlian (Otomotif, TIK, Las, Manufaktur, dll)',
      'Export CSV menyertakan kolom Jabatan Tambahan / PLT',
    ],
  },
  {
    category: 'Peta Jabatan',
    icon: '🗺️',
    items: [
      'Daftar jabatan sesuai Kepmen 202 Tahun 2024 per unit kerja',
      'Matching otomatis pegawai ke jabatan definitif (Struktural, Fungsional, Pelaksana) — tidak terpengaruh data PLT',
      'Formasi Non-ASN per unit kerja',
      'Summary ASN dan Non-ASN dengan statistik ABK vs Existing',
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
      'Filter canggih: Sama dengan (case-sensitive), Persis sama dengan (case-insensitive), Mengandung, Mengandung kata utuh, Salah satu dari',
      'Filter kolom Jabatan otomatis mencari di jabatan PLT — pegawai PLT muncul tanpa perlu memilih kolom PLT',
      'Kolom Kejuruan tersedia untuk instruktur — pilih, filter, dan export data kejuruan (47 pilihan kejuruan)',
      'Tabel preview menampilkan badge PLT di bawah jabatan definitif',
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
      'Notifikasi real-time untuk perubahan data',
      'Auto-update detection — banner notifikasi muncul otomatis saat ada versi baru, tanpa perlu clear cache manual',
      'Profil pengguna',
      'Menu Informasi Sistem — riwayat versi, fitur, dan perbaikan aplikasi',
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

  const currentVersion = RELEASES[0].version;
  const totalFeatures = RELEASES.flatMap(r => r.changes).filter(c => c.type === 'feature').length;
  const totalFixes = RELEASES.flatMap(r => r.changes).filter(c => c.type === 'fix').length;

  return (
    <AppLayout>
      <div className="space-y-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="page-header">
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
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card className="shadow-sm">
            <CardContent className="pt-4 pb-3 px-4">
              <div className="text-2xl font-bold text-primary">{currentVersion}</div>
              <div className="text-xs text-muted-foreground mt-0.5">Versi Saat Ini</div>
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
