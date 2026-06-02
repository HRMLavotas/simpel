/**
 * Usulan Detail Component
 * Task 7.3: Display complete usulan information
 * Created: 2026-06-02
 */

import { ExternalLink, FileText, User, Briefcase, Calendar, Clock, Edit, Send, XCircle } from 'lucide-react';
import { useUsulan, useUsulanStatusHistory, useWaitingListInfo } from '@/hooks/useUsulanUjikom';
import { useUsulanUjikomMutations } from '@/hooks/useUsulanUjikomMutations';
import { StatusBadge } from './StatusBadge';
import { StatusHistory } from './StatusHistory';
import { WaitingListQueue } from './WaitingListQueue';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useState } from 'react';

interface UsulanDetailProps {
  usulanId: string;
  onEdit?: () => void;
  onClose?: () => void;
}

export function UsulanDetail({ usulanId, onEdit, onClose }: UsulanDetailProps) {
  const { data: usulan, isLoading } = useUsulan(usulanId);
  const { data: history } = useUsulanStatusHistory(usulanId);
  const { data: waitingListInfo } = useWaitingListInfo(usulanId);
  const { submitUsulan, cancelUsulan } = useUsulanUjikomMutations();

  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!usulan) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-muted-foreground">Usulan tidak ditemukan</p>
        </CardContent>
      </Card>
    );
  }

  const canEdit = usulan.status === 'Draft' || usulan.status === 'Waiting_List';
  const canSubmit = usulan.status === 'Draft';
  const canCancel = ['Draft', 'Waiting_List', 'Diajukan'].includes(usulan.status);

  const handleSubmit = async () => {
    await submitUsulan.mutateAsync(usulan.id);
  };

  const handleCancel = async () => {
    if (cancelReason.trim().length >= 10) {
      await cancelUsulan.mutateAsync({
        id: usulan.id,
        reason: cancelReason,
      });
      setShowCancelDialog(false);
      setCancelReason('');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <CardTitle>Detail Usulan Ujikom</CardTitle>
              <div className="flex items-center gap-2">
                <StatusBadge status={usulan.status} />
                {usulan.queue_position && (
                  <Badge variant="outline">Antrian #{usulan.queue_position}</Badge>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              {canEdit && onEdit && (
                <Button variant="outline" size="sm" onClick={onEdit}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </Button>
              )}
              {canSubmit && (
                <Button size="sm" onClick={handleSubmit}>
                  <Send className="mr-2 h-4 w-4" />
                  Ajukan
                </Button>
              )}
              {canCancel && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setShowCancelDialog(true)}
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Batalkan
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Employee Info */}
          <div>
            <h3 className="text-sm font-medium flex items-center gap-2 mb-3">
              <User className="h-4 w-4" />
              Informasi Pegawai
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Nama</p>
                <p className="font-medium">{usulan.employee.name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">NIP</p>
                <p className="font-medium">{usulan.employee.nip || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Jabatan Saat Ini</p>
                <p className="font-medium">{usulan.employee.position_name || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pangkat/Golongan</p>
                <p className="font-medium">
                  {usulan.employee.rank_group || usulan.employee.rank || '-'}
                </p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Position Info */}
          <div>
            <h3 className="text-sm font-medium flex items-center gap-2 mb-3">
              <Briefcase className="h-4 w-4" />
              Jabatan Target
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Nama Jabatan</p>
                <p className="font-medium">{usulan.position_reference.position_name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Jenjang</p>
                <p className="font-medium">{usulan.position_reference.grade ? `Grade ${usulan.position_reference.grade}` : '-'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Kategori</p>
                <p className="font-medium">{usulan.position_reference.position_category}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Formasi ABK</p>
                <p className="font-medium">{usulan.position_reference.abk_count}</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Documents */}
          <div>
            <h3 className="text-sm font-medium flex items-center gap-2 mb-3">
              <FileText className="h-4 w-4" />
              Dokumen
            </h3>
            <div className="space-y-3">
              {usulan.surat_pengantar_url ? (
                <a
                  href={usulan.surat_pengantar_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
                >
                  <FileText className="h-4 w-4" />
                  Surat Pengantar
                  <ExternalLink className="h-3 w-3" />
                </a>
              ) : (
                <p className="text-sm text-muted-foreground">Surat Pengantar: Belum diunggah</p>
              )}

              {usulan.link_dokumen_persyaratan ? (
                <a
                  href={usulan.link_dokumen_persyaratan}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
                >
                  <ExternalLink className="h-4 w-4" />
                  Link Dokumen Persyaratan Lengkap
                </a>
              ) : (
                <p className="text-sm text-muted-foreground">Link Dokumen: Belum diisi</p>
              )}
            </div>
          </div>

          {/* Admin Notes */}
          {usulan.admin_notes && (
            <>
              <Separator />
              <div>
                <h3 className="text-sm font-medium mb-2">Catatan Admin</h3>
                <p className="text-sm text-muted-foreground">{usulan.admin_notes}</p>
              </div>
            </>
          )}

          {/* Timestamps */}
          <Separator />
          <div>
            <h3 className="text-sm font-medium flex items-center gap-2 mb-3">
              <Clock className="h-4 w-4" />
              Waktu
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Dibuat</p>
                <p>{new Date(usulan.created_at).toLocaleString('id-ID')}</p>
              </div>
              {usulan.submitted_at && (
                <div>
                  <p className="text-muted-foreground">Diajukan</p>
                  <p>{new Date(usulan.submitted_at).toLocaleString('id-ID')}</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Waiting List Info */}
      {usulan.status === 'Waiting_List' && waitingListInfo && (
        <WaitingListQueue waitingListInfo={waitingListInfo} />
      )}

      {/* Status History */}
      {history && <StatusHistory history={history} />}

      {/* Cancel Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Batalkan Usulan</DialogTitle>
            <DialogDescription>
              Berikan alasan pembatalan usulan ini (minimal 10 karakter)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="cancel-reason">Alasan Pembatalan</Label>
            <Textarea
              id="cancel-reason"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Masukkan alasan pembatalan..."
              rows={4}
            />
            {cancelReason.length > 0 && cancelReason.length < 10 && (
              <p className="text-sm text-red-500">
                Minimal 10 karakter ({cancelReason.length}/10)
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCancelDialog(false)}>
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancel}
              disabled={cancelReason.trim().length < 10}
            >
              Batalkan Usulan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
