import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, X, Filter } from 'lucide-react';
import { AVAILABLE_COLUMNS } from './ColumnSelector';
import { randomId } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useDepartments } from '@/hooks/useDepartments';

export interface FilterRule {
  id: string;
  kind: 'general' | 'advanced';
  field: string;
  operator: 'eq' | 'ilike' | 'exact_word' | 'in';
  value: string;
  values?: string[];
}

const OPERATORS = [
  { value: 'eq', label: 'Sama dengan' },
  { value: 'ilike', label: 'Mengandung' },
  { value: 'exact_word', label: 'Hanya Mengandung' },
  { value: 'in', label: 'Salah satu dari' },
] as const;

const FILTER_OPTIONS: Record<string, string[]> = {
  asn_status: ['PNS', 'CPNS', 'PPPK', 'Non ASN'],
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

const getAvailableOperators = (field: string) => {
  if (FILTER_OPTIONS[field] || field === 'department') return OPERATORS;
  return OPERATORS.filter(operator => operator.value !== 'in');
};

const getDefaultFilterOperator = (field: string): FilterRule['operator'] => {
  return (FILTER_OPTIONS[field] || field === 'department') ? 'in' : 'ilike';
};

const isFilterRuleActive = (filter: FilterRule) => {
  if (filter.operator === 'in') {
    return (filter.values?.length || 0) > 0;
  }

  return filter.value.trim().length > 0;
};

const createFilter = (field: string, kind: FilterRule['kind']): FilterRule => ({
  id: randomId(),
  kind,
  field,
  operator: getDefaultFilterOperator(field),
  value: '',
  values: [],
});

interface FilterBuilderProps {
  selectedColumns: string[];
  filters: FilterRule[];
  onChange: (filters: FilterRule[]) => void;
}

export function FilterBuilder({ selectedColumns, filters, onChange }: FilterBuilderProps) {
  const { departments: dynamicDepartments } = useDepartments();
  const selectedFilterColumns = AVAILABLE_COLUMNS.filter(column => selectedColumns.includes(column.key));

  // Build filter options dynamically including departments
  const getFilterOptions = (field: string): string[] => {
    if (field === 'department') {
      return dynamicDepartments.filter(d => d !== 'Pusat');
    }
    return FILTER_OPTIONS[field] || [];
  };

  const updateFilter = (id: string, updates: Partial<FilterRule>) => {
    onChange(filters.map(filter => (filter.id === id ? { ...filter, ...updates } : filter)));
  };

  const removeFilter = (id: string) => {
    onChange(filters.filter(filter => filter.id !== id));
  };

  const setFilterOperator = (id: string, operator: FilterRule['operator']) => {
    onChange(
      filters.map(filter => {
        if (filter.id !== id) return filter;

        return {
          ...filter,
          operator,
          value: operator === 'in' ? '' : filter.value,
          values: operator === 'in' ? filter.values || [] : [],
        };
      })
    );
  };

  const clearFilter = (id: string) => {
    updateFilter(id, { value: '', values: [] });
  };

  const toggleMultiSelectValue = (filterId: string, value: string) => {
    const filter = filters.find(item => item.id === filterId);
    if (!filter) return;

    const currentValues = filter.values || [];
    const nextValues = currentValues.includes(value)
      ? currentValues.filter(item => item !== value)
      : [...currentValues, value];

    updateFilter(filterId, { values: nextValues });
  };

  const addAdvancedFilter = (field: string) => {
    onChange([...filters, createFilter(field, 'advanced')]);
  };

  const renderFilterEditor = (filter: FilterRule, options?: { removable?: boolean }) => {
    const removable = options?.removable || false;
    const availableOptions = getFilterOptions(filter.field);
    const allowedOperators = getAvailableOperators(filter.field);
    const isMultiSelect = filter.operator === 'in';
    const isActive = isFilterRuleActive(filter);

    return (
      <div className="space-y-3 p-3 rounded-lg border bg-muted/30">
        <div className="flex items-center gap-2 flex-wrap">
          <Select value={filter.operator} onValueChange={value => setFilterOperator(filter.id, value as FilterRule['operator'])}>
            <SelectTrigger id={`filter-operator-${filter.id}`} className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {allowedOperators.map(operator => (
                <SelectItem key={operator.value} value={operator.value}>
                  {operator.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {!isMultiSelect && (
            <Input
              id={`filter-value-${filter.id}`}
              className="flex-1 min-w-[180px]"
              placeholder="Masukkan nilai filter..."
              value={filter.value}
              onChange={event => updateFilter(filter.id, { value: event.target.value })}
            />
          )}

          {removable ? (
            <Button variant="ghost" size="icon" onClick={() => removeFilter(filter.id)}>
              <X className="h-4 w-4" />
            </Button>
          ) : isActive ? (
            <Button variant="ghost" size="icon" onClick={() => clearFilter(filter.id)}>
              <X className="h-4 w-4" />
            </Button>
          ) : null}
        </div>

        {isMultiSelect && availableOptions.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 pl-2">
            {availableOptions.map(option => (
              <div key={option} className="flex items-center gap-2">
                <Checkbox
                  id={`${filter.id}-${option}`}
                  checked={filter.values?.includes(option) || false}
                  onCheckedChange={() => toggleMultiSelectValue(filter.id, option)}
                />
                <Label htmlFor={`${filter.id}-${option}`} className="text-sm cursor-pointer">
                  {option}
                </Label>
              </div>
            ))}
          </div>
        )}

        {isMultiSelect && (
          <div className="text-xs text-muted-foreground pl-2">
            {filter.values?.length || 0} opsi dipilih
            {filter.values && filter.values.length > 0 && <span className="ml-2">({filter.values.join(', ')})</span>}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <Filter className="h-4 w-4" />
        Filter Cepat per Kolom
      </div>

      <p className="text-sm text-muted-foreground">
        Setiap kolom yang dipilih otomatis memiliki filter umum. Jika perlu, tambahkan advanced filter untuk kolom yang sama.
      </p>

      <Separator />

      {selectedFilterColumns.length === 0 ? (
        <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
          Pilih minimal satu kolom agar filter untuk kolom tersebut muncul di sini.
        </div>
      ) : (
        <div className="space-y-4">
          {selectedFilterColumns.map(column => {
            const generalFilter = filters.find(filter => filter.kind === 'general' && filter.field === column.dbField);
            const advancedFilters = filters.filter(filter => filter.kind === 'advanced' && filter.field === column.dbField);
            const activeCount = [generalFilter, ...advancedFilters].filter(
              (filter): filter is FilterRule => Boolean(filter)
            ).filter(isFilterRuleActive).length;

            return (
              <div key={column.key} className="space-y-3 rounded-xl border p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-medium">{column.label}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {column.description || 'Gunakan filter umum untuk pencarian cepat, lalu tambah advanced filter bila perlu.'}
                    </p>
                  </div>
                  <Badge variant={activeCount > 0 ? 'default' : 'secondary'}>
                    {activeCount} aktif
                  </Badge>
                </div>

                {generalFilter && (
                  <div className="space-y-2">
                    <div className="text-xs font-medium text-muted-foreground">Filter Umum</div>
                    {renderFilterEditor(generalFilter)}
                  </div>
                )}

                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-xs font-medium text-muted-foreground">Advanced Filter</div>
                    <Button variant="outline" size="sm" onClick={() => addAdvancedFilter(column.dbField)} className="gap-1">
                      <Plus className="h-4 w-4" /> Tambah Advanced Filter
                    </Button>
                  </div>

                  {advancedFilters.length > 0 ? (
                    <div className="space-y-3">
                      {advancedFilters.map((filter, index) => (
                        <div key={filter.id} className="space-y-2">
                          <div className="text-xs text-muted-foreground">Kondisi {index + 1}</div>
                          {renderFilterEditor(filter, { removable: true })}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-lg border border-dashed p-3 text-sm text-muted-foreground">
                      Belum ada advanced filter untuk kolom ini.
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
