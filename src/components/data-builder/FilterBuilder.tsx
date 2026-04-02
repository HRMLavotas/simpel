import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, X } from 'lucide-react';
import { AVAILABLE_COLUMNS } from './ColumnSelector';

export interface FilterRule {
  id: string;
  field: string;
  operator: 'eq' | 'ilike' | 'exact_word';
  value: string;
}

const OPERATORS = [
  { value: 'eq', label: 'Sama dengan' },
  { value: 'ilike', label: 'Mengandung' },
  { value: 'exact_word', label: 'Hanya Mengandung' },
];

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

  return (
    <div className="space-y-3">
      {filters.map(filter => (
        <div key={filter.id} className="flex items-center gap-2 flex-wrap">
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

          <Input
            id={`filter-value-${filter.id}`}
            className="flex-1 min-w-[150px]"
            placeholder="Nilai filter..."
            value={filter.value}
            onChange={e => updateFilter(filter.id, { value: e.target.value })}
          />

          <Button variant="ghost" size="icon" onClick={() => removeFilter(filter.id)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      ))}

      <Button variant="outline" size="sm" onClick={addFilter} className="gap-1">
        <Plus className="h-4 w-4" /> Tambah Filter
      </Button>
    </div>
  );
}
