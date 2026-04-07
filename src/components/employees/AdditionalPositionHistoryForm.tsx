import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export interface AdditionalPositionHistoryEntry {
  id?: string;
  tanggal?: string;
  jabatan_tambahan_lama?: string;
  jabatan_tambahan_baru?: string;
  nomor_sk?: string;
  tmt?: string;
  keterangan?: string;
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
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

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
    setEditingIndex(entries.length);
  };

  const handleRemove = (index: number) => {
    onChange(entries.filter((_, i) => i !== index));
    if (editingIndex === index) setEditingIndex(null);
  };

  const handleChange = (index: number, field: keyof AdditionalPositionHistoryEntry, value: string) => {
    const updated = [...entries];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-base font-semibold">Riwayat Jabatan Tambahan</Label>
        <Button type="button" variant="outline" size="sm" onClick={handleAdd}>
          <Plus className="h-4 w-4 mr-2" />
          Tambah Riwayat
        </Button>
      </div>

      {entries.length === 0 ? (
        <p className="text-sm text-muted-foreground">Belum ada riwayat jabatan tambahan</p>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[120px]">Tanggal</TableHead>
                <TableHead>Jabatan Lama</TableHead>
                <TableHead>Jabatan Baru</TableHead>
                <TableHead className="w-[140px]">Nomor SK</TableHead>
                <TableHead className="w-[120px]">TMT</TableHead>
                <TableHead>Keterangan</TableHead>
                <TableHead className="w-[60px]">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map((entry, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <Input
                      type="date"
                      value={entry.tanggal || ''}
                      onChange={(e) => handleChange(index, 'tanggal', e.target.value)}
                      className="h-8"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      value={entry.jabatan_tambahan_lama || ''}
                      onChange={(e) => handleChange(index, 'jabatan_tambahan_lama', e.target.value)}
                      placeholder="Jabatan lama"
                      className="h-8"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      value={entry.jabatan_tambahan_baru || ''}
                      onChange={(e) => handleChange(index, 'jabatan_tambahan_baru', e.target.value)}
                      placeholder="Jabatan baru"
                      className="h-8"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      value={entry.nomor_sk || ''}
                      onChange={(e) => handleChange(index, 'nomor_sk', e.target.value)}
                      placeholder="Nomor SK"
                      className="h-8"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="date"
                      value={entry.tmt || ''}
                      onChange={(e) => handleChange(index, 'tmt', e.target.value)}
                      className="h-8"
                    />
                  </TableCell>
                  <TableCell>
                    <Textarea
                      value={entry.keterangan || ''}
                      onChange={(e) => handleChange(index, 'keterangan', e.target.value)}
                      placeholder="Keterangan"
                      className="min-h-[32px] h-8"
                      rows={1}
                    />
                  </TableCell>
                  <TableCell>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemove(index)}
                      className="h-8 w-8"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
