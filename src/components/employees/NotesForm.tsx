import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

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
  const addEntry = () => {
    onChange([...entries, { note: '' }]);
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-base font-semibold">{title}</Label>
        <Button type="button" variant="outline" size="sm" onClick={addEntry}>
          <Plus className="mr-1 h-3 w-3" />
          Tambah
        </Button>
      </div>

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
    </div>
  );
}
