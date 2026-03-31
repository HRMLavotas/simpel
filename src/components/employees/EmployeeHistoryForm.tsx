import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export interface HistoryField {
  key: string;
  label: string;
  type?: 'text' | 'date';
  placeholder?: string;
}

export interface HistoryEntry {
  id?: string;
  [key: string]: string | undefined;
}

interface EmployeeHistoryFormProps {
  title: string;
  fields: HistoryField[];
  entries: HistoryEntry[];
  onChange: (entries: HistoryEntry[]) => void;
}

// Helper function to sort entries by date field (ascending - oldest first)
const sortEntriesByDate = (entries: HistoryEntry[], fields: HistoryField[]): HistoryEntry[] => {
  // Find the date field (tanggal, tanggal_mulai, etc.)
  const dateField = fields.find(f => f.type === 'date')?.key;
  if (!dateField) return entries;

  return [...entries].sort((a, b) => {
    const dateA = a[dateField] || '';
    const dateB = b[dateField] || '';
    
    // Empty dates go to the end
    if (!dateA && !dateB) return 0;
    if (!dateA) return 1;
    if (!dateB) return -1;
    
    // Compare dates (ascending - oldest first)
    return dateA.localeCompare(dateB);
  });
};

export function EmployeeHistoryForm({ title, fields, entries, onChange }: EmployeeHistoryFormProps) {
  const addEntry = () => {
    const empty: HistoryEntry = {};
    fields.forEach(f => { empty[f.key] = ''; });
    const updated = [...entries, empty];
    onChange(sortEntriesByDate(updated, fields));
  };

  const removeEntry = (index: number) => {
    const updated = entries.filter((_, i) => i !== index);
    onChange(sortEntriesByDate(updated, fields));
  };

  const updateEntry = (index: number, field: string, value: string) => {
    const updated = entries.map((entry, i) =>
      i === index ? { ...entry, [field]: value } : entry
    );
    // Auto-sort after update if the changed field is a date field
    const isDateField = fields.find(f => f.key === field)?.type === 'date';
    onChange(isDateField ? sortEntriesByDate(updated, fields) : updated);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <Label className="text-base font-semibold">{title}</Label>
          <p className="text-xs text-muted-foreground mt-0.5">
            Diurutkan dari yang terlama ke terbaru
          </p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={addEntry}>
          <Plus className="mr-1 h-3 w-3" />
          Tambah
        </Button>
      </div>

      {entries.length === 0 && (
        <p className="text-sm text-muted-foreground py-2">
          Belum ada data. Klik "Tambah" untuk menambahkan.
        </p>
      )}

      {entries.map((entry, index) => (
        <div key={index} className="rounded-lg border p-4 space-y-3 relative">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">
              #{index + 1}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-destructive hover:text-destructive"
              onClick={() => removeEntry(index)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {fields.map((field) => (
              <div key={field.key} className="space-y-1.5">
                <Label className="text-xs">{field.label}</Label>
                <Input
                  className="h-9"
                  type={field.type || 'text'}
                  placeholder={field.placeholder || ''}
                  value={entry[field.key] || ''}
                  onChange={(e) => updateEntry(index, field.key, e.target.value)}
                />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// Field configurations for each history type
export const MUTATION_FIELDS: HistoryField[] = [
  { key: 'tanggal', label: 'Tanggal', type: 'date' },
  { key: 'dari_unit', label: 'Dari Unit', placeholder: 'Unit kerja asal' },
  { key: 'ke_unit', label: 'Ke Unit', placeholder: 'Unit kerja tujuan' },
  { key: 'nomor_sk', label: 'Nomor SK', placeholder: 'Nomor SK mutasi' },
  { key: 'keterangan', label: 'Keterangan', placeholder: 'Keterangan tambahan' },
];

export const POSITION_HISTORY_FIELDS: HistoryField[] = [
  { key: 'tanggal', label: 'Tanggal', type: 'date' },
  { key: 'jabatan_lama', label: 'Jabatan Lama', placeholder: 'Jabatan sebelumnya' },
  { key: 'jabatan_baru', label: 'Jabatan Baru', placeholder: 'Jabatan baru' },
  { key: 'nomor_sk', label: 'Nomor SK', placeholder: 'Nomor SK' },
  { key: 'keterangan', label: 'Keterangan', placeholder: 'Keterangan tambahan' },
];

export const RANK_HISTORY_FIELDS: HistoryField[] = [
  { key: 'tanggal', label: 'Tanggal', type: 'date' },
  { key: 'pangkat_lama', label: 'Pangkat Lama', placeholder: 'Pangkat sebelumnya' },
  { key: 'pangkat_baru', label: 'Pangkat Baru', placeholder: 'Pangkat baru' },
  { key: 'nomor_sk', label: 'Nomor SK', placeholder: 'Nomor SK' },
  { key: 'tmt', label: 'TMT', type: 'date' },
  { key: 'keterangan', label: 'Keterangan', placeholder: 'Keterangan tambahan' },
];

export const COMPETENCY_TEST_FIELDS: HistoryField[] = [
  { key: 'tanggal', label: 'Tanggal', type: 'date' },
  { key: 'jenis_uji', label: 'Jenis Uji', placeholder: 'Jenis uji kompetensi' },
  { key: 'hasil', label: 'Hasil', placeholder: 'Hasil uji' },
  { key: 'keterangan', label: 'Keterangan', placeholder: 'Keterangan tambahan' },
];

export const TRAINING_FIELDS: HistoryField[] = [
  { key: 'tanggal_mulai', label: 'Tanggal Mulai', type: 'date' },
  { key: 'tanggal_selesai', label: 'Tanggal Selesai', type: 'date' },
  { key: 'nama_diklat', label: 'Nama Diklat', placeholder: 'Nama pelatihan' },
  { key: 'penyelenggara', label: 'Penyelenggara', placeholder: 'Lembaga penyelenggara' },
  { key: 'sertifikat', label: 'Sertifikat', placeholder: 'Nomor sertifikat' },
  { key: 'keterangan', label: 'Keterangan', placeholder: 'Keterangan tambahan' },
];
