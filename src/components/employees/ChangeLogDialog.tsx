import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Loader2, Link as LinkIcon } from 'lucide-react';

export interface DetectedChange {
  field: string;
  label: string;
  oldValue: string;
  newValue: string;
  /** Which history table this maps to */
  historyType: 'rank' | 'position' | 'mutation' | 'title' | 'general';
}

interface ChangeLogDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  changes: DetectedChange[];
  employeeName: string;
  onConfirm: (notes: string, link: string, date: string) => Promise<void>;
  onSkip: () => Promise<void>;
  isLoading?: boolean;
}

export function ChangeLogDialog({
  open,
  onOpenChange,
  changes,
  employeeName,
  onConfirm,
  onSkip,
  isLoading,
}: ChangeLogDialogProps) {
  const [notes, setNotes] = useState('');
  const [link, setLink] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const getChangeTypeLabel = (type: DetectedChange['historyType']) => {
    switch (type) {
      case 'rank': return 'Kenaikan Pangkat';
      case 'position': return 'Perubahan Jabatan';
      case 'mutation': return 'Mutasi';
      case 'title': return 'Perubahan Gelar';
      case 'general': return 'Perubahan Data';
    }
  };

  const getChangeTypeColor = (type: DetectedChange['historyType']) => {
    switch (type) {
      case 'rank': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'position': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'mutation': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'title': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'general': return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-lg">
        <DialogHeader>
          <DialogTitle>Perubahan Data Terdeteksi</DialogTitle>
          <DialogDescription>
            Perubahan berikut terdeteksi pada data <strong>{employeeName}</strong>. 
            Tambahkan catatan dan tanggal efektif untuk pencatatan riwayat.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Detected changes list */}
          <div className="space-y-2 max-h-[200px] overflow-y-auto">
            {changes.map((change, i) => (
              <div key={i} className="rounded-lg border p-3 space-y-1.5">
                <Badge className={getChangeTypeColor(change.historyType)} variant="secondary">
                  {getChangeTypeLabel(change.historyType)}
                </Badge>
                <p className="text-sm font-medium">{change.label}</p>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground line-through">
                    {change.oldValue || '(kosong)'}
                  </span>
                  <ArrowRight className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                  <span className="font-semibold text-foreground">
                    {change.newValue || '(kosong)'}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Date */}
          <div className="space-y-1.5">
            <Label>Tanggal Efektif *</Label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label>Catatan / Keterangan</Label>
            <Textarea
              placeholder="Nomor SK, alasan perubahan, dll. (opsional)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          {/* Link */}
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5">
              <LinkIcon className="h-3.5 w-3.5" />
              Lampiran / Link
            </Label>
            <Input
              type="url"
              placeholder="https://... (opsional)"
              value={link}
              onChange={(e) => setLink(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onSkip()}
            disabled={isLoading}
          >
            Simpan Tanpa Catatan
          </Button>
          <Button
            type="button"
            onClick={() => onConfirm(notes, link, date)}
            disabled={isLoading || !date}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Simpan dengan Catatan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
