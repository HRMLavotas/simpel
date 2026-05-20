import { useState } from 'react';
import { Plus, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export const ADDITIONAL_POSITION_CATEGORIES = [
  'Ketua Tim',
  'Wakil Ketua Tim',
  'Koordinator',
  'Subkoordinator',
  'PLT',
  'Anggota Tim',
  'Sekretaris Tim',
  'Lainnya',
] as const;

export type AdditionalPositionCategory = typeof ADDITIONAL_POSITION_CATEGORIES[number];

export interface AdditionalPositionItem {
  id?: string;
  category: AdditionalPositionCategory | '';
  position_name: string;
}

interface AdditionalPositionsManagerProps {
  positions: AdditionalPositionItem[];
  onChange: (positions: AdditionalPositionItem[]) => void;
  disabled?: boolean;
  title?: string;
  hideLabel?: boolean;
}

export function AdditionalPositionsManager({
  positions,
  onChange,
  disabled = false,
  title = 'Jabatan Tambahan',
  hideLabel = false,
}: AdditionalPositionsManagerProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newCategory, setNewCategory] = useState<AdditionalPositionCategory | ''>('');
  const [newPositionName, setNewPositionName] = useState('');

  const handleAdd = () => {
    if (!newCategory || !newPositionName.trim()) {
      return;
    }

    const newPosition: AdditionalPositionItem = {
      id: `temp-${Date.now()}`,
      category: newCategory,
      position_name: newPositionName.trim(),
    };

    onChange([...positions, newPosition]);
    
    // Reset form
    setNewCategory('');
    setNewPositionName('');
    setIsAdding(false);
  };

  const handleRemove = (index: number) => {
    onChange(positions.filter((_, i) => i !== index));
  };

  const handleCancel = () => {
    setNewCategory('');
    setNewPositionName('');
    setIsAdding(false);
  };

  // Format display text
  const formatPositionDisplay = (item: AdditionalPositionItem) => {
    return `${item.category}: ${item.position_name}`;
  };

  // Get badge color based on category
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Ketua Tim':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'Wakil Ketua Tim':
        return 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300';
      case 'Koordinator':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';
      case 'Subkoordinator':
        return 'bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300';
      case 'PLT':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300';
      case 'Anggota Tim':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'Sekretaris Tim':
        return 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
    }
  };

  return (
    <div className="space-y-3">
      {!hideLabel && (
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">
            {title}
            <span className="text-xs text-muted-foreground ml-2">(Opsional)</span>
          </Label>
          {!isAdding && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsAdding(true)}
              disabled={disabled}
            >
              <Plus className="h-3 w-3 mr-1" />
              Tambah
            </Button>
          )}
        </div>
      )}

      {hideLabel && !isAdding && (
        <div className="flex justify-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsAdding(true)}
            disabled={disabled}
          >
            <Plus className="h-3 w-3 mr-1" />
            Tambah Jabatan
          </Button>
        </div>
      )}

      {/* List of existing positions */}
      {positions.length > 0 && (
        <div className="space-y-2">
          {positions.map((item, index) => (
            <div
              key={item.id || index}
              className="flex items-center gap-2 p-2 rounded-lg border bg-muted/30"
            >
              <Badge className={`${getCategoryColor(item.category)} shrink-0`}>
                {item.category}
              </Badge>
              <span className="text-sm flex-1 truncate" title={item.position_name}>
                {item.position_name}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0"
                onClick={() => handleRemove(index)}
                disabled={disabled}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {positions.length === 0 && !isAdding && (
        <p className="text-xs text-muted-foreground py-2">
          Belum ada jabatan tambahan. Klik "Tambah" untuk menambahkan.
        </p>
      )}

      {/* Add new position form */}
      {isAdding && (
        <div className="rounded-lg border p-3 space-y-3 bg-background">
          <div className="space-y-2">
            <Label className="text-xs">Kategori *</Label>
            <Select value={newCategory} onValueChange={(v) => setNewCategory(v as AdditionalPositionCategory)}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Pilih kategori..." />
              </SelectTrigger>
              <SelectContent>
                {ADDITIONAL_POSITION_CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-xs">Nama Jabatan *</Label>
            <Input
              className="h-9"
              placeholder="Contoh: Tim Kerja Pengembangan SDM"
              value={newPositionName}
              onChange={(e) => setNewPositionName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAdd();
                } else if (e.key === 'Escape') {
                  handleCancel();
                }
              }}
              autoFocus
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCancel}
            >
              Batal
            </Button>
            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={handleAdd}
              disabled={!newCategory || !newPositionName.trim()}
            >
              <Plus className="h-3 w-3 mr-1" />
              Tambah
            </Button>
          </div>
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        💡 Tambahkan jabatan tambahan seperti Ketua Tim, Koordinator, atau PLT yang dipegang pegawai.
      </p>
    </div>
  );
}

// Helper function to convert array to string (for backward compatibility)
export function additionalPositionsToString(positions: AdditionalPositionItem[]): string {
  if (positions.length === 0) return '';
  return positions.map(p => formatPositionDisplay(p)).join('; ');
}

// Helper function to convert string to array (for backward compatibility)
export function stringToAdditionalPositions(str: string | null | undefined): AdditionalPositionItem[] {
  if (!str || str.trim() === '') return [];
  
  // Try to parse as structured data first
  // Format: "Category: Position Name; Category: Position Name"
  const items: AdditionalPositionItem[] = [];
  const parts = str.split(';').map(s => s.trim()).filter(Boolean);
  
  for (const part of parts) {
    const colonIndex = part.indexOf(':');
    if (colonIndex > 0) {
      const category = part.substring(0, colonIndex).trim();
      const positionName = part.substring(colonIndex + 1).trim();
      
      // Validate category
      if (ADDITIONAL_POSITION_CATEGORIES.includes(category as AdditionalPositionCategory)) {
        items.push({
          id: `parsed-${Date.now()}-${Math.random()}`,
          category: category as AdditionalPositionCategory,
          position_name: positionName,
        });
      } else {
        // Unknown category, treat as "Lainnya"
        items.push({
          id: `parsed-${Date.now()}-${Math.random()}`,
          category: 'Lainnya',
          position_name: part,
        });
      }
    } else {
      // No category found, try to infer from content
      const lowerPart = part.toLowerCase();
      let inferredCategory: AdditionalPositionCategory = 'Lainnya';
      
      if (lowerPart.includes('plt')) {
        inferredCategory = 'PLT';
      } else if (lowerPart.includes('ketua tim')) {
        inferredCategory = 'Ketua Tim';
      } else if (lowerPart.includes('wakil ketua')) {
        inferredCategory = 'Wakil Ketua Tim';
      } else if (lowerPart.includes('koordinator') && !lowerPart.includes('sub')) {
        inferredCategory = 'Koordinator';
      } else if (lowerPart.includes('subkoordinator') || lowerPart.includes('sub koordinator')) {
        inferredCategory = 'Subkoordinator';
      } else if (lowerPart.includes('anggota')) {
        inferredCategory = 'Anggota Tim';
      } else if (lowerPart.includes('sekretaris')) {
        inferredCategory = 'Sekretaris Tim';
      }
      
      items.push({
        id: `parsed-${Date.now()}-${Math.random()}`,
        category: inferredCategory,
        position_name: part,
      });
    }
  }
  
  return items;
}

// Helper function for display
function formatPositionDisplay(item: AdditionalPositionItem): string {
  return `${item.category}: ${item.position_name}`;
}
