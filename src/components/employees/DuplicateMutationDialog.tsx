import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

export interface DuplicateEmployee {
  id: string;
  name: string;
  nip: string | null;
  department: string;
  position_name: string | null;
}

interface DuplicateMutationDialogProps {
  open: boolean;
  duplicate: DuplicateEmployee | null;
  targetDepartment: string;
  onMerge: () => void;       // Gabungkan: hapus duplikat, pakai record lama
  onKeepBoth: () => void;    // Biarkan keduanya ada
  onCancel: () => void;      // Batalkan simpan
  isLoading?: boolean;
}

export function DuplicateMutationDialog({
  open,
  duplicate,
  targetDepartment,
  onMerge,
  onKeepBoth,
  onCancel,
  isLoading,
}: DuplicateMutationDialogProps) {
  if (!duplicate) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onCancel(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-amber-600">
            <AlertTriangle className="h-5 w-5" />
            Duplikat Pegawai Terdeteksi
          </DialogTitle>
          <DialogDescription className="space-y-2 pt-2">
            <p>
              Ditemukan data pegawai dengan nama/NIP yang sama di unit tujuan:
            </p>
            <div className="rounded-md border bg-muted/50 p-3 text-sm space-y-1">
              <p><span className="font-medium">Nama:</span> {duplicate.name}</p>
              {duplicate.nip && <p><span className="font-medium">NIP/NIK:</span> {duplicate.nip}</p>}
              <p><span className="font-medium">Unit:</span> {duplicate.department}</p>
              {duplicate.position_name && (
                <p><span className="font-medium">Jabatan:</span> {duplicate.position_name}</p>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              Kemungkinan data ini adalah pegawai yang sama yang sudah diinput oleh admin unit <strong>{targetDepartment}</strong>.
            </p>
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <Button
            onClick={onMerge}
            disabled={isLoading}
            className="w-full flex-col h-auto py-2"
          >
            <span>Gabungkan Data</span>
            <span className="text-xs font-normal opacity-80">Hapus data duplikat, riwayat digabung ke data ini</span>
          </Button>
          <Button
            variant="outline"
            onClick={onKeepBoth}
            disabled={isLoading}
            className="w-full flex-col h-auto py-2"
          >
            <span>Biarkan Keduanya</span>
            <span className="text-xs font-normal opacity-70">Simpan mutasi, data duplikat tetap ada</span>
          </Button>
          <Button
            variant="ghost"
            onClick={onCancel}
            disabled={isLoading}
            className="w-full"
          >
            Batalkan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
