import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

export interface ColumnConfig {
  key: string;
  label: string;
  dbField: string;
}

export const AVAILABLE_COLUMNS: ColumnConfig[] = [
  { key: 'nip', label: 'NIP', dbField: 'nip' },
  { key: 'name', label: 'Nama', dbField: 'name' },
  { key: 'front_title', label: 'Gelar Depan', dbField: 'front_title' },
  { key: 'back_title', label: 'Gelar Belakang', dbField: 'back_title' },
  { key: 'gender', label: 'Jenis Kelamin', dbField: 'gender' },
  { key: 'birth_place', label: 'Tempat Lahir', dbField: 'birth_place' },
  { key: 'birth_date', label: 'Tanggal Lahir', dbField: 'birth_date' },
  { key: 'religion', label: 'Agama', dbField: 'religion' },
  { key: 'asn_status', label: 'Status ASN', dbField: 'asn_status' },
  { key: 'rank_group', label: 'Pangkat/Golongan', dbField: 'rank_group' },
  { key: 'position_type', label: 'Jenis Jabatan', dbField: 'position_type' },
  { key: 'position_sk', label: 'Jabatan Sesuai SK', dbField: 'position_sk' },
  { key: 'position_name', label: 'Jabatan Sesuai Kepmen 202 Tahun 2024', dbField: 'position_name' },
  { key: 'old_position', label: 'Jabatan Lama', dbField: 'old_position' },
  { key: 'department', label: 'Unit Kerja', dbField: 'department' },
  { key: 'import_order', label: 'Urutan Import', dbField: 'import_order' },
  { key: 'join_date', label: 'Tanggal Masuk', dbField: 'join_date' },
  { key: 'tmt_cpns', label: 'TMT CPNS', dbField: 'tmt_cpns' },
  { key: 'tmt_pns', label: 'TMT PNS', dbField: 'tmt_pns' },
  { key: 'tmt_pensiun', label: 'TMT Pensiun', dbField: 'tmt_pensiun' },
];

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

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Checkbox
          id="select-all"
          checked={selectedColumns.length === AVAILABLE_COLUMNS.length}
          onCheckedChange={toggleAll}
        />
        <Label htmlFor="select-all" className="text-sm font-semibold cursor-pointer">
          Pilih Semua
        </Label>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
        {AVAILABLE_COLUMNS.map(col => (
          <div key={col.key} className="flex items-center gap-2">
            <Checkbox
              id={`col-${col.key}`}
              checked={selectedColumns.includes(col.key)}
              onCheckedChange={() => toggleColumn(col.key)}
            />
            <Label htmlFor={`col-${col.key}`} className="text-sm cursor-pointer">
              {col.label}
            </Label>
          </div>
        ))}
      </div>
    </div>
  );
}
