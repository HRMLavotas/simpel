import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Database, FileText, Briefcase, TrendingUp, Award, GraduationCap, StickyNote } from 'lucide-react';

export interface RelatedDataConfig {
  key: string;
  label: string;
  table: string;
  icon: any;
  description: string;
  fields: { key: string; label: string }[];
}

export const RELATED_DATA_TABLES: RelatedDataConfig[] = [
  {
    key: 'education_history',
    label: 'Riwayat Pendidikan',
    table: 'education_history',
    icon: GraduationCap,
    description: 'Jenjang pendidikan, institusi, jurusan, tahun lulus',
    fields: [
      { key: 'level', label: 'Jenjang' },
      { key: 'institution_name', label: 'Nama Institusi' },
      { key: 'major', label: 'Jurusan' },
      { key: 'graduation_year', label: 'Tahun Lulus' },
      { key: 'front_title', label: 'Gelar Depan' },
      { key: 'back_title', label: 'Gelar Belakang' },
    ],
  },
  {
    key: 'mutation_history',
    label: 'Riwayat Mutasi',
    table: 'mutation_history',
    icon: TrendingUp,
    description: 'Perpindahan unit kerja, tanggal, nomor SK',
    fields: [
      { key: 'tanggal', label: 'Tanggal' },
      { key: 'dari_unit', label: 'Dari Unit' },
      { key: 'ke_unit', label: 'Ke Unit' },
      { key: 'jabatan', label: 'Jabatan' },
      { key: 'nomor_sk', label: 'Nomor SK' },
      { key: 'keterangan', label: 'Keterangan' },
    ],
  },
  {
    key: 'position_history',
    label: 'Riwayat Jabatan',
    table: 'position_history',
    icon: Briefcase,
    description: 'Perubahan jabatan, tanggal, nomor SK',
    fields: [
      { key: 'tanggal', label: 'Tanggal' },
      { key: 'jabatan_lama', label: 'Jabatan Lama' },
      { key: 'jabatan_baru', label: 'Jabatan Baru' },
      { key: 'unit_kerja', label: 'Unit Kerja' },
      { key: 'nomor_sk', label: 'Nomor SK' },
      { key: 'keterangan', label: 'Keterangan' },
    ],
  },
  {
    key: 'additional_position_history',
    label: 'Riwayat Jabatan Tambahan',
    table: 'additional_position_history',
    icon: Briefcase,
    description: 'Perubahan jabatan tambahan, tanggal, nomor SK',
    fields: [
      { key: 'tanggal', label: 'Tanggal' },
      { key: 'jabatan_tambahan_lama', label: 'Jabatan Lama' },
      { key: 'jabatan_tambahan_baru', label: 'Jabatan Baru' },
      { key: 'nomor_sk', label: 'Nomor SK' },
      { key: 'tmt', label: 'TMT' },
      { key: 'keterangan', label: 'Keterangan' },
    ],
  },
  {
    key: 'rank_history',
    label: 'Riwayat Pangkat',
    table: 'rank_history',
    icon: Award,
    description: 'Kenaikan pangkat/golongan, TMT, nomor SK',
    fields: [
      { key: 'tanggal', label: 'Tanggal' },
      { key: 'pangkat_lama', label: 'Pangkat Lama' },
      { key: 'pangkat_baru', label: 'Pangkat Baru' },
      { key: 'nomor_sk', label: 'Nomor SK' },
      { key: 'tmt', label: 'TMT' },
      { key: 'keterangan', label: 'Keterangan' },
    ],
  },
  {
    key: 'training_history',
    label: 'Riwayat Diklat/Pelatihan',
    table: 'training_history',
    icon: Database,
    description: 'Pelatihan yang diikuti, penyelenggara, sertifikat',
    fields: [
      { key: 'tanggal_mulai', label: 'Tanggal Mulai' },
      { key: 'tanggal_selesai', label: 'Tanggal Selesai' },
      { key: 'nama_diklat', label: 'Nama Diklat' },
      { key: 'penyelenggara', label: 'Penyelenggara' },
      { key: 'sertifikat', label: 'Sertifikat' },
      { key: 'keterangan', label: 'Keterangan' },
    ],
  },
  {
    key: 'competency_test_history',
    label: 'Riwayat Uji Kompetensi',
    table: 'competency_test_history',
    icon: Award,
    description: 'Uji kompetensi, jenis, hasil',
    fields: [
      { key: 'tanggal', label: 'Tanggal' },
      { key: 'jenis_uji', label: 'Jenis Uji' },
      { key: 'hasil', label: 'Hasil' },
      { key: 'keterangan', label: 'Keterangan' },
    ],
  },
  {
    key: 'placement_notes',
    label: 'Keterangan Penempatan',
    table: 'placement_notes',
    icon: StickyNote,
    description: 'Catatan terkait penempatan pegawai',
    fields: [
      { key: 'note', label: 'Catatan' },
      { key: 'created_at', label: 'Tanggal Dibuat' },
    ],
  },
  {
    key: 'assignment_notes',
    label: 'Keterangan Penugasan',
    table: 'assignment_notes',
    icon: FileText,
    description: 'Catatan terkait penugasan tambahan',
    fields: [
      { key: 'note', label: 'Catatan' },
      { key: 'created_at', label: 'Tanggal Dibuat' },
    ],
  },
  {
    key: 'change_notes',
    label: 'Keterangan Perubahan',
    table: 'change_notes',
    icon: FileText,
    description: 'Catatan terkait perubahan data pegawai',
    fields: [
      { key: 'note', label: 'Catatan' },
      { key: 'created_at', label: 'Tanggal Dibuat' },
    ],
  },
];

interface RelatedDataSelectorProps {
  selectedTables: string[];
  onChange: (tables: string[]) => void;
}

export function RelatedDataSelector({ selectedTables, onChange }: RelatedDataSelectorProps) {
  const toggleTable = (key: string) => {
    if (selectedTables.includes(key)) {
      onChange(selectedTables.filter(t => t !== key));
    } else {
      onChange([...selectedTables, key]);
    }
  };

  const toggleAll = () => {
    if (selectedTables.length === RELATED_DATA_TABLES.length) {
      onChange([]);
    } else {
      onChange(RELATED_DATA_TABLES.map(t => t.key));
    }
  };

  return (
    <div className="space-y-4">
      {/* Select All */}
      <div className="flex items-center gap-2 pb-2 border-b">
        <Checkbox
          id="select-all-related"
          checked={selectedTables.length === RELATED_DATA_TABLES.length}
          onCheckedChange={toggleAll}
        />
        <Label htmlFor="select-all-related" className="text-sm font-semibold cursor-pointer">
          Pilih Semua Data Relasi ({selectedTables.length}/{RELATED_DATA_TABLES.length})
        </Label>
      </div>

      {/* Related Tables */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {RELATED_DATA_TABLES.map(table => {
          const Icon = table.icon;
          return (
            <div
              key={table.key}
              className={`p-3 rounded-lg border transition-colors ${
                selectedTables.includes(table.key)
                  ? 'bg-primary/5 border-primary'
                  : 'bg-muted/30 hover:bg-muted/50'
              }`}
            >
              <div className="flex items-start gap-2">
                <Checkbox
                  id={`table-${table.key}`}
                  checked={selectedTables.includes(table.key)}
                  onCheckedChange={() => toggleTable(table.key)}
                />
                <div className="flex-1 min-w-0">
                  <Label
                    htmlFor={`table-${table.key}`}
                    className="text-sm font-medium cursor-pointer flex items-center gap-2"
                  >
                    <Icon className="h-4 w-4 text-primary flex-shrink-0" />
                    {table.label}
                    <Badge variant="secondary" className="text-xs ml-auto">
                      {table.fields.length} kolom
                    </Badge>
                  </Label>
                  <p className="text-xs text-muted-foreground mt-1">{table.description}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {selectedTables.length > 0 && (
        <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
          <p className="text-sm text-blue-900 dark:text-blue-100">
            <strong>Cara Melihat:</strong> Klik ikon panah (▶) di sebelah kiri setiap baris pegawai untuk 
            melihat detail riwayat. Data relasi juga akan di-export sebagai sheet terpisah dalam file Excel.
          </p>
        </div>
      )}
    </div>
  );
}
