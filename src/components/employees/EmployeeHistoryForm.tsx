import { Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DEPARTMENTS } from '@/lib/constants';
import { useState } from 'react';

export interface HistoryField {
  key: string;
  label: string;
  type?: 'text' | 'date' | 'select';
  placeholder?: string;
  options?: readonly string[]; // For select type
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
  const [isExpanded, setIsExpanded] = useState(false);
  
  const addEntry = () => {
    const empty: HistoryEntry = {};
    fields.forEach(f => { empty[f.key] = ''; });
    const updated = [...entries, empty];
    onChange(sortEntriesByDate(updated, fields));
    setIsExpanded(true); // Auto-expand when adding new entry
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

  // Get summary info for collapsed view
  const getSummary = () => {
    if (entries.length === 0) return 'Belum ada data';
    
    const latestEntry = entries[entries.length - 1]; // Last entry (newest)
    
    // Find the most relevant field to display (not date, not SK, not keterangan)
    const relevantField = fields.find(f => 
      f.type !== 'date' && 
      !f.key.includes('nomor_sk') && 
      !f.key.includes('keterangan') &&
      !f.key.includes('tmt') &&
      latestEntry[f.key] // Has value
    );
    
    const relevantValue = relevantField ? latestEntry[relevantField.key] : null;
    
    if (relevantValue) {
      return `${entries.length} entri • Terbaru: ${relevantValue}`;
    }
    
    // Fallback to date if no relevant field found
    const dateField = fields.find(f => f.type === 'date')?.key;
    const latestDate = latestEntry[dateField || ''];
    return `${entries.length} entri${latestDate ? ` • Terakhir: ${latestDate}` : ''}`;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <Label className="text-base font-semibold">{title}</Label>
            {entries.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                {entries.length}
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Diurutkan dari yang terlama ke terbaru
          </p>
        </div>
        <div className="flex items-center gap-2">
          {entries.length > 0 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="mr-1 h-3 w-3" />
                  Sembunyikan
                </>
              ) : (
                <>
                  <ChevronDown className="mr-1 h-3 w-3" />
                  Lihat Semua
                </>
              )}
            </Button>
          )}
          <Button type="button" variant="outline" size="sm" onClick={addEntry}>
            <Plus className="mr-1 h-3 w-3" />
            Tambah
          </Button>
        </div>
      </div>

      {/* Collapsed Summary View */}
      {!isExpanded && entries.length > 0 && (
        <div className="p-4 rounded-lg border bg-muted/30 text-sm text-muted-foreground">
          {getSummary()}
        </div>
      )}

      {/* Expanded Full View */}
      {isExpanded && (
        <>
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
                    {field.type === 'select' ? (
                      <Select
                        value={entry[field.key] || ''}
                        onValueChange={(value) => updateEntry(index, field.key, value)}
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder={field.placeholder || 'Pilih...'} />
                        </SelectTrigger>
                        <SelectContent>
                          {field.options?.map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        className="h-9"
                        type={field.type || 'text'}
                        placeholder={field.placeholder || ''}
                        value={entry[field.key] || ''}
                        onChange={(e) => updateEntry(index, field.key, e.target.value)}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}

// Field configurations for each history type
export const MUTATION_FIELDS: HistoryField[] = [
  { key: 'tanggal', label: 'Tanggal', type: 'date' },
  { key: 'ke_unit', label: 'Unit Kerja Baru', type: 'select', placeholder: 'Pilih unit kerja tujuan', options: DEPARTMENTS.filter(d => d !== 'Pusat') },
  { key: 'nomor_sk', label: 'Nomor SK', placeholder: 'Nomor SK mutasi' },
  { key: 'keterangan', label: 'Keterangan', placeholder: 'Keterangan tambahan' },
];

export const POSITION_HISTORY_FIELDS: HistoryField[] = [
  { key: 'tanggal', label: 'Tanggal', type: 'date' },
  { key: 'jabatan_baru', label: 'Jabatan Baru', placeholder: 'Jabatan baru' },
  { key: 'unit_kerja', label: 'Unit Kerja', type: 'select', placeholder: 'Pilih unit kerja', options: DEPARTMENTS.filter(d => d !== 'Pusat') },
  { key: 'nomor_sk', label: 'Nomor SK', placeholder: 'Nomor SK' },
  { key: 'keterangan', label: 'Keterangan', placeholder: 'Keterangan tambahan' },
];

export const RANK_HISTORY_FIELDS: HistoryField[] = [
  { key: 'tanggal', label: 'Tanggal', type: 'date' },
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
