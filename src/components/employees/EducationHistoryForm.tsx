import { Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
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
import { EDUCATION_LEVELS } from '@/lib/constants';
import { useState } from 'react';

export interface EducationEntry {
  id?: string;
  level: string;
  institution_name: string;
  major: string;
  graduation_year: string;
  front_title: string;
  back_title: string;
}

interface EducationHistoryFormProps {
  entries: EducationEntry[];
  onChange: (entries: EducationEntry[]) => void;
}

const emptyEntry: EducationEntry = {
  level: '',
  institution_name: '',
  major: '',
  graduation_year: '',
  front_title: '',
  back_title: '',
};

export function EducationHistoryForm({ entries, onChange }: EducationHistoryFormProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const addEntry = () => {
    onChange([...entries, { ...emptyEntry }]);
    setIsExpanded(true); // Auto-expand when adding new entry
  };

  const removeEntry = (index: number) => {
    onChange(entries.filter((_, i) => i !== index));
  };

  const updateEntry = (index: number, field: keyof EducationEntry, value: string) => {
    const updated = entries.map((entry, i) =>
      i === index ? { ...entry, [field]: value } : entry
    );
    onChange(updated);
  };

  // Get summary for collapsed view
  const getSummary = () => {
    if (entries.length === 0) return 'Belum ada data';
    
    const latestEntry = entries[entries.length - 1];
    const level = latestEntry.level || '';
    const major = latestEntry.major || '';
    
    if (level && major) {
      return `${entries.length} entri • Terbaru: ${level} ${major}`;
    } else if (level) {
      return `${entries.length} entri • Terbaru: ${level}`;
    }
    
    return `${entries.length} entri`;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Label className="text-base font-semibold">Riwayat Pendidikan</Label>
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
              Belum ada riwayat pendidikan. Klik "Tambah" untuk menambahkan.
            </p>
          )}

          {entries.map((entry, index) => (
        <div key={index} className="rounded-lg border p-4 space-y-3 relative">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">
              Pendidikan #{index + 1}
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
            <div className="space-y-1.5">
              <Label className="text-xs">Jenjang *</Label>
              <Select
                value={entry.level}
                onValueChange={(v) => updateEntry(index, 'level', v)}
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Pilih jenjang" />
                </SelectTrigger>
                <SelectContent>
                  {EDUCATION_LEVELS.map((lvl) => (
                    <SelectItem key={lvl} value={lvl}>{lvl}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Nama Lembaga</Label>
              <Input
                className="h-9"
                placeholder="Nama sekolah/universitas"
                value={entry.institution_name}
                onChange={(e) => updateEntry(index, 'institution_name', e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Jurusan</Label>
              <Input
                className="h-9"
                placeholder="Jurusan/program studi"
                value={entry.major}
                onChange={(e) => updateEntry(index, 'major', e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Tahun Lulus</Label>
              <Input
                className="h-9"
                type="number"
                placeholder="Contoh: 2015"
                value={entry.graduation_year}
                onChange={(e) => updateEntry(index, 'graduation_year', e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Gelar Depan</Label>
              <Input
                className="h-9"
                placeholder="Contoh: Dr., Ir., Drs."
                value={entry.front_title}
                onChange={(e) => updateEntry(index, 'front_title', e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Gelar Belakang</Label>
              <Input
                className="h-9"
                placeholder="Contoh: S.E., M.M., Ph.D."
                value={entry.back_title}
                onChange={(e) => updateEntry(index, 'back_title', e.target.value)}
              />
            </div>
          </div>
        </div>
      ))}
        </>
      )}
    </div>
  );
}
