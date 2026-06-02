/**
 * Status History Component
 * Task 5.5: Display timeline of status changes
 * Created: 2026-06-02
 */

import { formatDistanceToNow } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { 
  Clock, 
  FileCheck, 
  FileX, 
  ClipboardCheck, 
  ClipboardX,
  AlertCircle,
  CheckCircle2,
  XCircle,
  FileText,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { StatusBadge } from './StatusBadge';
import type { UsulanStatusHistory, UsulanStatus } from '@/lib/usulan-ujikom/types';

interface StatusHistoryProps {
  history: UsulanStatusHistory[];
}

const statusIcons: Record<UsulanStatus, React.ReactNode> = {
  Draft: <FileText className="h-4 w-4" />,
  Waiting_List: <Clock className="h-4 w-4" />,
  Diajukan: <FileCheck className="h-4 w-4" />,
  Verifikasi_Berkas: <ClipboardCheck className="h-4 w-4" />,
  Proses_Ujikom: <AlertCircle className="h-4 w-4" />,
  Lulus_Ujikom: <CheckCircle2 className="h-4 w-4" />,
  Tidak_Lulus_Ujikom: <XCircle className="h-4 w-4" />,
  Dibatalkan: <FileX className="h-4 w-4" />,
};

export function StatusHistory({ history }: StatusHistoryProps) {
  if (!history || history.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Riwayat Status</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Belum ada riwayat perubahan status.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Riwayat Status</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {history.map((item, index) => (
            <div key={item.id}>
              <div className="flex gap-4">
                {/* Timeline indicator */}
                <div className="flex flex-col items-center">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full border-2 bg-background">
                    {statusIcons[item.new_status]}
                  </div>
                  {index < history.length - 1 && (
                    <div className="w-px flex-1 bg-border mt-2" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 pb-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      {item.previous_status && (
                        <>
                          <StatusBadge status={item.previous_status} />
                          <span className="text-muted-foreground">→</span>
                        </>
                      )}
                      <StatusBadge status={item.new_status} />
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatDistanceToNow(new Date(item.changed_at), {
                        addSuffix: true,
                        locale: idLocale,
                      })}
                    </span>
                  </div>

                  <p className="text-sm text-muted-foreground mb-2">
                    {new Date(item.changed_at).toLocaleString('id-ID', {
                      dateStyle: 'long',
                      timeStyle: 'short',
                    })}
                  </p>

                  {item.changed_by_profile && (
                    <p className="text-sm">
                      Oleh: <span className="font-medium">{item.changed_by_profile.full_name}</span>
                      {item.changed_by_profile.role && (
                        <Badge variant="outline" className="ml-2">
                          {item.changed_by_profile.role}
                        </Badge>
                      )}
                    </p>
                  )}

                  {/* Notes */}
                  {item.notes && (
                    <div className="mt-2 rounded-md bg-muted p-3">
                      <p className="text-sm font-medium mb-1">Catatan:</p>
                      <p className="text-sm text-muted-foreground">{item.notes}</p>
                    </div>
                  )}

                  {/* Cancellation reason */}
                  {item.cancellation_reason && (
                    <div className="mt-2 rounded-md border border-orange-200 bg-orange-50 p-3">
                      <p className="text-sm font-medium text-orange-900 mb-1">
                        Alasan Pembatalan:
                      </p>
                      <p className="text-sm text-orange-700">{item.cancellation_reason}</p>
                    </div>
                  )}

                  {/* Feedback notes */}
                  {item.feedback_notes && (
                    <div className="mt-2 rounded-md border border-blue-200 bg-blue-50 p-3">
                      <p className="text-sm font-medium text-blue-900 mb-1">
                        Catatan Feedback:
                      </p>
                      <p className="text-sm text-blue-700">{item.feedback_notes}</p>
                    </div>
                  )}
                </div>
              </div>

              {index < history.length - 1 && <Separator className="my-2" />}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
