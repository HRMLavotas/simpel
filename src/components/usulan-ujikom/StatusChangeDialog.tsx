/**
 * Status Change Dialog Component
 * Task 8.2: Dialog for Admin Pusat to change usulan status
 * Created: 2026-06-02
 */

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import { useUsulanUjikomMutations } from '@/hooks/useUsulanUjikomMutations';
import { VALID_STATUS_TRANSITIONS, type UsulanStatus } from '@/lib/usulan-ujikom/types';
import { STATUS_LABELS } from '@/lib/usulan-ujikom/types';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface StatusChangeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  usulanId: string;
  currentStatus: UsulanStatus;
}

const statusChangeSchema = z.object({
  new_status: z.string().min(1, 'Status baru wajib dipilih'),
  notes: z.string().optional(),
  cancellation_reason: z.string().optional(),
  feedback_notes: z.string().optional(),
}).refine(
  (data) => {
    if (data.new_status === 'Dibatalkan') {
      return !!data.cancellation_reason && data.cancellation_reason.trim().length >= 10;
    }
    return true;
  },
  {
    message: 'Alasan pembatalan wajib diisi minimal 10 karakter',
    path: ['cancellation_reason'],
  }
);

type StatusChangeFormValues = z.infer<typeof statusChangeSchema>;

export function StatusChangeDialog({
  open,
  onOpenChange,
  usulanId,
  currentStatus,
}: StatusChangeDialogProps) {
  const { changeStatus } = useUsulanUjikomMutations();
  const [selectedStatus, setSelectedStatus] = useState<UsulanStatus | ''>('');

  const form = useForm<StatusChangeFormValues>({
    resolver: zodResolver(statusChangeSchema),
    defaultValues: {
      new_status: '',
      notes: '',
      cancellation_reason: '',
      feedback_notes: '',
    },
  });

  // Get available status transitions
  const availableTransitions = VALID_STATUS_TRANSITIONS[currentStatus] || [];

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (open) {
      form.reset();
      setSelectedStatus('');
    }
  }, [open, form]);

  const onSubmit = async (data: StatusChangeFormValues) => {
    try {
      await changeStatus.mutateAsync({
        usulan_id: usulanId,
        new_status: data.new_status as UsulanStatus,
        notes: data.notes,
        cancellation_reason: data.cancellation_reason,
        feedback_notes: data.feedback_notes,
      });
      onOpenChange(false);
    } catch (error) {
      console.error('Error changing status:', error);
    }
  };

  const handleStatusChange = (value: string) => {
    setSelectedStatus(value as UsulanStatus);
    form.setValue('new_status', value);
  };

  const requiresCancellationReason = selectedStatus === 'Dibatalkan';
  const allowsFeedback = selectedStatus === 'Tidak_Lulus_Ujikom';

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle>Ubah Status Usulan</AlertDialogTitle>
          <AlertDialogDescription>
            Status saat ini: <strong>{STATUS_LABELS[currentStatus]}</strong>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {availableTransitions.length === 0 ? (
            <Alert>
              <AlertDescription>
                Status ini tidak dapat diubah lagi. Usulan sudah dalam status final.
              </AlertDescription>
            </Alert>
          ) : (
            <>
              {/* Status Selection */}
              <div className="space-y-2">
                <Label htmlFor="new-status">Status Baru</Label>
                <Select value={selectedStatus} onValueChange={handleStatusChange}>
                  <SelectTrigger id="new-status">
                    <SelectValue placeholder="Pilih status baru" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableTransitions.map((status) => (
                      <SelectItem key={status} value={status}>
                        {STATUS_LABELS[status]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.new_status && (
                  <p className="text-sm text-red-500">
                    {form.formState.errors.new_status.message}
                  </p>
                )}
              </div>

              {/* Cancellation Reason (required for Dibatalkan) */}
              {requiresCancellationReason && (
                <div className="space-y-2">
                  <Label htmlFor="cancellation-reason">
                    Alasan Pembatalan <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    id="cancellation-reason"
                    {...form.register('cancellation_reason')}
                    placeholder="Jelaskan alasan pembatalan (minimal 10 karakter)..."
                    rows={4}
                  />
                  {form.formState.errors.cancellation_reason && (
                    <p className="text-sm text-red-500">
                      {form.formState.errors.cancellation_reason.message}
                    </p>
                  )}
                </div>
              )}

              {/* Feedback Notes (optional for Tidak_Lulus_Ujikom) */}
              {allowsFeedback && (
                <div className="space-y-2">
                  <Label htmlFor="feedback-notes">
                    Catatan Feedback <span className="text-muted-foreground">(Opsional)</span>
                  </Label>
                  <Textarea
                    id="feedback-notes"
                    {...form.register('feedback_notes')}
                    placeholder="Berikan feedback untuk pegawai yang tidak lulus..."
                    rows={4}
                  />
                </div>
              )}

              {/* Admin Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">
                  Catatan Admin <span className="text-muted-foreground">(Opsional)</span>
                </Label>
                <Textarea
                  id="notes"
                  {...form.register('notes')}
                  placeholder="Tambahkan catatan untuk perubahan status ini..."
                  rows={3}
                />
              </div>

              {/* Info Alert */}
              {selectedStatus === 'Lulus_Ujikom' && (
                <Alert>
                  <AlertDescription>
                    <strong>Perhatian:</strong> Mengubah status ke "Lulus Ujikom" akan:
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      <li>Menandai formasi jabatan sebagai terisi</li>
                      <li>Memicu promosi otomatis dari daftar tunggu (jika ada)</li>
                      <li>Mengirim notifikasi ke Admin Unit</li>
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              {selectedStatus === 'Waiting_List' && (
                <Alert>
                  <AlertDescription>
                    Usulan akan masuk ke daftar tunggu dan akan otomatis dipromosikan 
                    ketika formasi jabatan tersedia.
                  </AlertDescription>
                </Alert>
              )}
            </>
          )}

          <AlertDialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={changeStatus.isPending}
            >
              Batal
            </Button>
            {availableTransitions.length > 0 && (
              <Button type="submit" disabled={changeStatus.isPending || !selectedStatus}>
                {changeStatus.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Ubah Status
              </Button>
            )}
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
}
