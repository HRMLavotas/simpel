import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Info } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export interface ColumnConfig {
  key: string;
  label: string;
  dbField: string;
  category?: 'identity' | 'position' | 'employment' | 'dates' | 'other';
  description?: string;
}

export const AVAILABLE_COLUMNS: ColumnConfig[] = [
  // Identity & Personal Info
  { key: 'nip', label: 'NIP', dbField: 'nip', category: 'identity', description: 'Nomor Induk Pegawai (18 digit)' },
  { key: 'name', label: 'Nama', dbField: 'name', category: 'identity', description: 'Nama lengkap tanpa gelar' },
  { key: 'front_title', label: 'Gelar Depan', dbField: 'front_title', category: 'identity', description: 'Contoh: Dr., Ir., Drs.' },
  { key: 'back_title', label: 'Gelar Belakang', dbField: 'back_title', category: 'identity', description: 'Contoh: S.E., M.M., Ph.D.' },
  { key: 'gender', label: 'Jenis Kelamin', dbField: 'gender', category: 'identity' },
  { key: 'birth_place', label: 'Tempat Lahir', dbField: 'birth_place', category: 'identity' },
  { key: 'birth_date', label: 'Tanggal Lahir', dbField: 'birth_date', category: 'identity' },
  { key: 'religion', label: 'Agama', dbField: 'religion', category: 'identity' },
  
  // Position & Employment Status
  { key: 'asn_status', label: 'Status ASN', dbField: 'asn_status', category: 'employment', description: 'PNS, CPNS, PPPK, atau Non ASN' },
  { key: 'rank_group', label: 'Pangkat/Golongan', dbField: 'rank_group', category: 'employment', description: 'Contoh: III/a, IV/b' },
  { key: 'position_type', label: 'Jenis Jabatan', dbField: 'position_type', category: 'position', description: 'Struktural, Fungsional, atau Pelaksana' },
  { key: 'position_sk', label: 'Jabatan Sesuai SK', dbField: 'position_sk', category: 'position', description: 'Jabatan spesifik/tugas aktual pegawai' },
  { key: 'position_name', label: 'Jabatan Sesuai Kepmen 202/2024', dbField: 'position_name', category: 'position', description: 'Jabatan standar/klasifikasi' },
  { key: 'additional_position', label: 'Jabatan Tambahan', dbField: 'additional_position', category: 'position', description: 'Jabatan tambahan di luar jabatan sesuai Kepmen (opsional)' },
  { key: 'old_position', label: 'Jabatan Lama', dbField: 'old_position', category: 'position', description: 'Jabatan sebelum perubahan' },
  { key: 'department', label: 'Unit Kerja', dbField: 'department', category: 'employment', description: 'Nama unit kerja/dinas' },
  
  // Dates
  { key: 'join_date', label: 'Tanggal Masuk', dbField: 'join_date', category: 'dates', description: 'Tanggal mulai bekerja' },
  { key: 'tmt_cpns', label: 'TMT CPNS', dbField: 'tmt_cpns', category: 'dates', description: 'Terhitung Mulai Tanggal CPNS' },
  { key: 'tmt_pns', label: 'TMT PNS', dbField: 'tmt_pns', category: 'dates', description: 'Terhitung Mulai Tanggal PNS' },
  { key: 'tmt_pensiun', label: 'TMT Pensiun', dbField: 'tmt_pensiun', category: 'dates', description: 'Terhitung Mulai Tanggal Pensiun' },
  
  // Other
  { key: 'import_order', label: 'Urutan Import', dbField: 'import_order', category: 'other', description: 'Urutan data saat import' },
  { key: 'keterangan_formasi', label: 'Keterangan Formasi', dbField: 'keterangan_formasi', category: 'other', description: 'Catatan formasi jabatan' },
];

/** Kolom tanggal — dipakai untuk format tampilan & export */
export function isDateColumnDbField(dbField: string): boolean {
  const col = AVAILABLE_COLUMNS.find(c => c.dbField === dbField);
  return col?.category === 'dates';
}

export function formatEmployeeCellValue(value: unknown, dbField: string): string {
  if (value === null || value === undefined || value === '') return '-';
  if (isDateColumnDbField(dbField)) {
    try {
      const d = new Date(value as string);
      if (Number.isNaN(d.getTime())) return String(value);
      return d.toLocaleDateString('id-ID');
    } catch {
      return String(value);
    }
  }
  return String(value);
}

const CATEGORY_LABELS = {
  identity: 'Data Pribadi',
  position: 'Jabatan',
  employment: 'Kepegawaian',
  dates: 'Tanggal Penting',
  other: 'Lainnya',
};

interface ColumnSelectorProps {
  selectedColumns: string[];
  onChange: (columns: string[]) => void;
}

export function ColumnSelector({ selectedColumns, onChange }: ColumnSelectorProps) {
  const toggleColumn = (key: string) => {
    if (selectedColumns.includes(key)) {
      onChange(selectedColumns.filter(c => c !== key));
    } else {
      onChange([...selectedColumns, key]);
    }
  };

  const toggleAll = () => {
    if (selectedColumns.length === AVAILABLE_COLUMNS.length) {
      onChange([]);
    } else {
      onChange(AVAILABLE_COLUMNS.map(c => c.key));
    }
  };

  const toggleCategory = (category: string) => {
    const categoryColumns = AVAILABLE_COLUMNS.filter(c => c.category === category).map(c => c.key);
    const allSelected = categoryColumns.every(key => selectedColumns.includes(key));
    
    if (allSelected) {
      // Deselect all in category
      onChange(selectedColumns.filter(key => !categoryColumns.includes(key)));
    } else {
      // Select all in category
      const newSelection = [...new Set([...selectedColumns, ...categoryColumns])];
      onChange(newSelection);
    }
  };

  // Group columns by category
  const columnsByCategory = AVAILABLE_COLUMNS.reduce((acc, col) => {
    const cat = col.category || 'other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(col);
    return acc;
  }, {} as Record<string, ColumnConfig[]>);

  return (
    <TooltipProvider>
      <div className="space-y-4">
        {/* Select All */}
        <div className="flex items-center gap-2 pb-2 border-b">
          <Checkbox
            id="select-all"
            checked={selectedColumns.length === AVAILABLE_COLUMNS.length}
            onCheckedChange={toggleAll}
          />
          <Label htmlFor="select-all" className="text-sm font-semibold cursor-pointer">
            Pilih Semua ({selectedColumns.length}/{AVAILABLE_COLUMNS.length})
          </Label>
        </div>

        {/* Columns by Category */}
        {Object.entries(columnsByCategory).map(([category, columns]) => {
          const categorySelected = columns.filter(c => selectedColumns.includes(c.key)).length;
          const allCategorySelected = categorySelected === columns.length;
          
          return (
            <div key={category} className="space-y-2">
              {/* Category Header */}
              <div className="flex items-center gap-2">
                <Checkbox
                  id={`cat-${category}`}
                  checked={allCategorySelected}
                  onCheckedChange={() => toggleCategory(category)}
                />
                <Label 
                  htmlFor={`cat-${category}`} 
                  className="text-sm font-medium cursor-pointer flex items-center gap-2"
                >
                  {CATEGORY_LABELS[category as keyof typeof CATEGORY_LABELS] || category}
                  <Badge variant="secondary" className="text-xs">
                    {categorySelected}/{columns.length}
                  </Badge>
                </Label>
              </div>

              {/* Category Columns */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 ml-6">
                {columns.map(col => (
                  <div key={col.key} className="flex items-center gap-2">
                    <Checkbox
                      id={`col-${col.key}`}
                      checked={selectedColumns.includes(col.key)}
                      onCheckedChange={() => toggleColumn(col.key)}
                    />
                    <Label 
                      htmlFor={`col-${col.key}`} 
                      className="text-sm cursor-pointer flex items-center gap-1 flex-1"
                    >
                      {col.label}
                      {col.description && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-3 w-3 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-xs max-w-xs">{col.description}</p>
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </TooltipProvider>
  );
}
