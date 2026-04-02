import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, X, Filter } from 'lucide-react';
import { AVAILABLE_COLUMNS } from './ColumnSelector';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

export interface FilterRule {
  id: string;
  field: string;
  operator: 'eq' | 'ilike' | 'exact_word' | 'in';
  value: string;
  values?: string[]; // For multi-select filters
}

const OPERATORS = [
  { value: 'eq', label: 'Sama dengan' },
  { value: 'ilike', label: 'Mengandung' },
  { value: 'exact_word', label: 'Hanya Mengandung' },
  { value: 'in', label: 'Salah satu dari' },
];

// Predefined options for multi-select filters
const FILTER_OPTIONS: Record<string, string[]> = {
  asn_status: ['PNS', 'PPPK', 'Non ASN'],
  position_type: ['Struktural', 'Fungsional', 'Pelaksana'],
  gender: ['Laki-laki', 'Perempuan'],
  religion: ['Islam', 'Kristen', 'Katolik', 'Hindu', 'Buddha', 'Konghucu'],
  rank_group: [
    'I/a', 'I/b', 'I/c', 'I/d',
    'II/a', 'II/b', 'II/c', 'II/d',
    'III/a', 'III/b', 'III/c', 'III/d',
    'IV/a', 'IV/b', 'IV/c', 'IV/d', 'IV/e',
  ],
};

interface FilterBuilderProps {
  filters: FilterRule[];
  onChange: (filters: FilterRule[]) => void;
}

export function FilterBuilder({ filters, onChange }: FilterBuilderProps) {
  const addFilter = () => {
    onChange([
      ...filters,
      { id: crypto.randomUUID(), field: 'position_name', operator: 'eq', value: '' },
    ]);
  };

  const removeFilter = (id: string) => {
    onChange(filters.filter(f => f.id !== id));
  };

  const updateFilter = (id: string, updates: Partial<FilterRule>) => {
    onChange(filters.map(f => (f.id === id ? { ...f, ...updates } : f)));
  };

  const toggleMultiSelectValue = (filterId: string, value: string) => {
    const filter = filters.find(f => f.id === filterId);
    if (!filter) return;

    const currentValues = filter.values || [];
    const newValues = currentValues.includes(value)
      ? currentValues.filter(v => v !== value)
      : [...currentValues, value];

    updateFilter(filterId, { values: newValues });
  };

  // Quick filter presets
  const addQuickFilter = (field: string, operator: FilterRule['operator'], values?: string[]) => {
    const existing = filters.find(f => f.field === field && f.operator === operator);
    if (existing) {
      // Remove if already exists
      removeFilter(existing.id);
    } else {
      // Add new quick filter
      onChange([
        ...filters,
        {
          id: crypto.randomUUID(),
          field,
          operator,
          value: '',
          values: values || [],
        },
      ]);
    }
  };

  const hasQuickFilter = (field: string, operator: FilterRule['operator']) => {
    return filters.some(f => f.field === field && f.operator === operator);
  };

  return (
    <div className="space-y-4">
      {/* Quick Filters */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Filter className="h-4 w-4" />
          Filter Cepat
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant={hasQuickFilter('asn_status', 'in') ? 'default' : 'outline'}
            size="sm"
            onClick={() => addQuickFilter('asn_status', 'in', ['PNS', 'PPPK'])}
            className="gap-1"
          >
            Status ASN
            {hasQuickFilter('asn_status', 'in') && (
              <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                {filters.find(f => f.field === 'asn_status' && f.operator === 'in')?.values?.length || 0}
              </Badge>
            )}
          </Button>
          <Button
            variant={hasQuickFilter('position_type', 'in') ? 'default' : 'outline'}
            size="sm"
            onClick={() => addQuickFilter('position_type', 'in')}
            className="gap-1"
          >
            Jenis Jabatan
            {hasQuickFilter('position_type', 'in') && (
              <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                {filters.find(f => f.field === 'position_type' && f.operator === 'in')?.values?.length || 0}
              </Badge>
            )}
          </Button>
          <Button
            variant={hasQuickFilter('rank_group', 'in') ? 'default' : 'outline'}
            size="sm"
            onClick={() => addQuickFilter('rank_group', 'in')}
            className="gap-1"
          >
            Pangkat/Golongan
            {hasQuickFilter('rank_group', 'in') && (
              <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                {filters.find(f => f.field === 'rank_group' && f.operator === 'in')?.values?.length || 0}
              </Badge>
            )}
          </Button>
          <Button
            variant={hasQuickFilter('gender', 'in') ? 'default' : 'outline'}
            size="sm"
            onClick={() => addQuickFilter('gender', 'in')}
            className="gap-1"
          >
            Jenis Kelamin
            {hasQuickFilter('gender', 'in') && (
              <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                {filters.find(f => f.field === 'gender' && f.operator === 'in')?.values?.length || 0}
              </Badge>
            )}
          </Button>
          <Button
            variant={hasQuickFilter('religion', 'in') ? 'default' : 'outline'}
            size="sm"
            onClick={() => addQuickFilter('religion', 'in')}
            className="gap-1"
          >
            Agama
            {hasQuickFilter('religion', 'in') && (
              <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                {filters.find(f => f.field === 'religion' && f.operator === 'in')?.values?.length || 0}
              </Badge>
            )}
          </Button>
        </div>
      </div>

      <Separator />

      {/* Custom Filters */}
      <div className="space-y-3">
        {filters.map(filter => {
          const isMultiSelect = filter.operator === 'in';
          const availableOptions = FILTER_OPTIONS[filter.field] || [];

          return (
            <div key={filter.id} className="space-y-3 p-3 rounded-lg border bg-muted/30">
              <div className="flex items-center gap-2 flex-wrap">
                <Select value={filter.field} onValueChange={v => updateFilter(filter.id, { field: v })}>
                  <SelectTrigger id={`filter-field-${filter.id}`} className="w-[160px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {AVAILABLE_COLUMNS.map(col => (
                      <SelectItem key={col.key} value={col.dbField}>
                        {col.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={filter.operator}
                  onValueChange={v => updateFilter(filter.id, { operator: v as FilterRule['operator'] })}
                >
                  <SelectTrigger id={`filter-operator-${filter.id}`} className="w-[150px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {OPERATORS.map(op => (
                      <SelectItem key={op.value} value={op.value}>
                        {op.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {!isMultiSelect && (
                  <Input
                    id={`filter-value-${filter.id}`}
                    className="flex-1 min-w-[150px]"
                    placeholder="Nilai filter..."
                    value={filter.value}
                    onChange={e => updateFilter(filter.id, { value: e.target.value })}
                  />
                )}

                <Button variant="ghost" size="icon" onClick={() => removeFilter(filter.id)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Multi-select options */}
              {isMultiSelect && availableOptions.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 pl-2">
                  {availableOptions.map(option => (
                    <div key={option} className="flex items-center gap-2">
                      <Checkbox
                        id={`${filter.id}-${option}`}
                        checked={filter.values?.includes(option) || false}
                        onCheckedChange={() => toggleMultiSelectValue(filter.id, option)}
                      />
                      <Label
                        htmlFor={`${filter.id}-${option}`}
                        className="text-sm cursor-pointer"
                      >
                        {option}
                      </Label>
                    </div>
                  ))}
                </div>
              )}

              {/* Show selected count for multi-select */}
              {isMultiSelect && (
                <div className="text-xs text-muted-foreground pl-2">
                  {filter.values?.length || 0} opsi dipilih
                  {filter.values && filter.values.length > 0 && (
                    <span className="ml-2">
                      ({filter.values.join(', ')})
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        })}

        <Button variant="outline" size="sm" onClick={addFilter} className="gap-1">
          <Plus className="h-4 w-4" /> Tambah Filter Custom
        </Button>
      </div>
    </div>
  );
}
