/**
 * Usulan Pusat Detail Component (Admin Pusat)
 * Task 8.3: Detail view for Admin Pusat with status change capability
 * Created: 2026-06-02
 */

import { useState } from 'react';
import { ExternalLink, FileText, User, Briefcase, Clock, Building, RefreshCw } from 'lucide-react';
import { useUsulan, useUsulanStatusHistory, useWaitingListInfo } from '@/hooks/useUsulanUjikom';
import { StatusBadge } from './StatusBadge';
import { StatusHistory } from './StatusHistory';
import { WaitingListQueue } from './WaitingListQueue';
import { StatusChangeDialog } from './StatusChangeDialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import type { UsulanStatus } from '@/lib/usulan-ujikom/types';

interface UsulanPusatDetailProps {
  usulanId: string;
}

export function UsulanPusatDetail({ usulanId }: UsulanPusatDetailProps) {
  const { data: usulan, isLoading } = useUsulan(usulanId);
  const { data: history } = useUsulanStatusHistory(usulanId);
  const { data: waitingListInfo } = useWaitingListInfo(usulanId);
  
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');

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
            <Button onClick={() => setShowStatusDialog(true)}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Ubah Status
            </Button>
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
              <div>
                <p className="text-sm text-muted-foreground">Status ASN</p>
                <p className="font-medium">{usulan.employee.asn_status || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status Aktif</p>
                <Badge variant={usulan.employee.is_active ? 'default' : 'secondary'}>
                  {usulan.employee.is_active ? 'Aktif' : 'Tidak Aktif'}
                </Badge>
              </div>
            </div>
          </div>

          <Separator />

          {/* Unit Kerja */}
          <div>
            <h3 className="text-sm font-medium flex items-center gap-2 mb-3">
              <Building className="h-4 w-4" />
              Unit Kerja
            </h3>
            <p className="font-medium">{usulan.department.name}</p>
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

          {/* Admin Notes from Unit */}
          {usulan.admin_notes && (
            <>
              <Separator />
              <div>
                <h3 className="text-sm font-medium mb-2">Catatan dari Admin Unit</h3>
                <p className="text-sm text-muted-foreground">{usulan.admin_notes}</p>
              </div>
            </>
          )}

          {/* Cancellation Reason */}
          {usulan.cancellation_reason && (
            <>
              <Separator />
              <div className="rounded-md border border-orange-200 bg-orange-50 p-4">
                <h3 className="text-sm font-medium text-orange-900 mb-2">Alasan Pembatalan</h3>
                <p className="text-sm text-orange-700">{usulan.cancellation_reason}</p>
              </div>
            </>
          )}

          {/* Feedback Notes */}
          {usulan.feedback_notes && (
            <>
              <Separator />
              <div className="rounded-md border border-blue-200 bg-blue-50 p-4">
                <h3 className="text-sm font-medium text-blue-900 mb-2">Catatan Feedback</h3>
                <p className="text-sm text-blue-700">{usulan.feedback_notes}</p>
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
              <div>
                <p className="text-muted-foreground">Terakhir Diperbarui</p>
                <p>{new Date(usulan.updated_at).toLocaleString('id-ID')}</p>
              </div>
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

      {/* Status Change Dialog */}
      <StatusChangeDialog
        open={showStatusDialog}
        onOpenChange={setShowStatusDialog}
        usulanId={usulan.id}
        currentStatus={usulan.status}
      />
    </div>
  );
}
