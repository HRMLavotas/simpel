import { useState } from 'react';
import { Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';

export interface AdditionalPositionHistoryEntry {
  id?: string;
  tanggal?: string;
  jabatan_tambahan_lama?: string;
  jabatan_tambahan_baru?: string;
  nomor_sk?: string;
  tmt?: string;
  keterangan?: string;
  [key: string]: string | undefined;
}

interface AdditionalPositionHistoryFormProps {
  entries: AdditionalPositionHistoryEntry[];
  onChange: (entries: AdditionalPositionHistoryEntry[]) => void;
  currentAdditionalPosition?: string;
}

export function AdditionalPositionHistoryForm({ 
  entries, 
  onChange,
  currentAdditionalPosition 
}: AdditionalPositionHistoryFormProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleAdd = () => {
    const newEntry: AdditionalPositionHistoryEntry = {
      tanggal: '',
      jabatan_tambahan_lama: '',
      jabatan_tambahan_baru: currentAdditionalPosition || '',
      nomor_sk: '',
      tmt: '',
      keterangan: '',
    };
    onChange([...entries, newEntry]);
    setIsExpanded(true);
  };

  const handleRemove = (index: number) => {
    onChange(entries.filter((_, i) => i !== index));
  };

  const handleChange = (index: number, field: keyof AdditionalPositionHistoryEntry, value: string) => {
    const updated = [...entries];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  // Get summary for collapsed view
  const getSummary = () => {
    if (entries.length === 0) return 'Belum ada riwayat jabatan tambahan';
    
    const latestEntry = entries[0];
    const jabatanBaru = latestEntry.jabatan_tambahan_baru || '';
    const tanggal = latestEntry.tanggal || '';
    
    if (jabatanBaru && tanggal) {
      return `${entries.length} entri • Terbaru: ${jabatanBaru} (${tanggal})`;
    } else if (jabatanBaru) {
      return `${entries.length} entri • Terbaru: ${jabatanBaru}`;
    }
    
    return `${entries.length} entri`;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <Label className="text-base font-semibold">Riwayat Jabatan Tambahan</Label>
            {entries.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                {entries.length}
              </Badge>
            )}
          </div>
          {currentAdditionalPosition && (
            <p className="text-xs font-medium text-primary mt-0.5">
              Saat ini: {currentAdditionalPosition}
            </p>
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
          <Button type="button" variant="outline" size="sm" onClick={handleAdd}>
            <Plus className="h-4 w-4 mr-2" />
            Tambah Riwayat
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
              Belum ada riwayat jabatan tambahan. Klik "Tambah Riwayat" untuk menambahkan.
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
                  onClick={() => handleRemove(index)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-xs">Tanggal</Label>
                  <Input
                    type="date"
                    value={entry.tanggal || ''}
                    onChange={(e) => handleChange(index, 'tanggal', e.target.value)}
                    className="h-9"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">TMT</Label>
                  <Input
                    type="date"
                    value={entry.tmt || ''}
                    onChange={(e) => handleChange(index, 'tmt', e.target.value)}
                    className="h-9"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Jabatan Lama</Label>
                  <Input
                    value={entry.jabatan_tambahan_lama || ''}
                    onChange={(e) => handleChange(index, 'jabatan_tambahan_lama', e.target.value)}
                    placeholder="Jabatan tambahan sebelumnya"
                    className="h-9"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Jabatan Baru</Label>
                  <Input
                    value={entry.jabatan_tambahan_baru || ''}
                    onChange={(e) => handleChange(index, 'jabatan_tambahan_baru', e.target.value)}
                    placeholder="Jabatan tambahan baru"
                    className="h-9"
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <Label className="text-xs">Nomor SK</Label>
                  <Input
                    value={entry.nomor_sk || ''}
                    onChange={(e) => handleChange(index, 'nomor_sk', e.target.value)}
                    placeholder="Nomor SK pengangkatan"
                    className="h-9"
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <Label className="text-xs">Keterangan</Label>
                  <Textarea
                    value={entry.keterangan || ''}
                    onChange={(e) => handleChange(index, 'keterangan', e.target.value)}
                    placeholder="Keterangan tambahan"
                    className="min-h-[60px]"
                    rows={2}
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
