import { Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';

export interface NoteEntry {
  id?: string;
  note: string;
}

interface NotesFormProps {
  title: string;
  entries: NoteEntry[];
  onChange: (entries: NoteEntry[]) => void;
  placeholder?: string;
}

export function NotesForm({ title, entries, onChange, placeholder }: NotesFormProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const addEntry = () => {
    onChange([...entries, { note: '' }]);
    setIsExpanded(true); // Auto-expand when adding new entry
  };

  const removeEntry = (index: number) => {
    onChange(entries.filter((_, i) => i !== index));
  };

  const updateEntry = (index: number, value: string) => {
    const updated = entries.map((entry, i) =>
      i === index ? { ...entry, note: value } : entry
    );
    onChange(updated);
  };

  // Get summary for collapsed view
  const getSummary = () => {
    if (entries.length === 0) return 'Belum ada keterangan';
    const preview = entries[entries.length - 1].note; // Latest note
    const truncated = preview.length > 60 ? preview.substring(0, 60) + '...' : preview;
    return `${entries.length} keterangan${truncated ? ` • "${truncated}"` : ''}`;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Label className="text-base font-semibold">{title}</Label>
          {entries.length > 0 && (
            <Badge variant="secondary" className="text-xs">
              {entries.length}
            </Badge>
          )}
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
              Belum ada keterangan. Klik "Tambah" untuk menambahkan.
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

              <Textarea
                placeholder={placeholder || 'Masukkan keterangan...'}
                value={entry.note || ''}
                onChange={(e) => updateEntry(index, e.target.value)}
                rows={3}
              />
            </div>
          ))}
        </>
      )}
    </div>
  );
}
