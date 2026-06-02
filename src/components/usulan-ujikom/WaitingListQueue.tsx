/**
 * Waiting List Queue Component
 * Task 5.6: Display queue position and waiting list information
 * Created: 2026-06-02
 */

import { Clock, Users, TrendingUp } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { WaitingListInfo } from '@/lib/usulan-ujikom/types';

interface WaitingListQueueProps {
  waitingListInfo: WaitingListInfo;
}

export function WaitingListQueue({ waitingListInfo }: WaitingListQueueProps) {
  const { queue_position, total_waiting, estimated_wait_message, other_waiting_usulan } = waitingListInfo;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Informasi Daftar Tunggu
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Queue position badge */}
        <Alert>
          <AlertDescription className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            <span className="font-medium">{estimated_wait_message}</span>
          </AlertDescription>
        </Alert>

        {/* Statistics */}
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-lg border p-4 text-center">
            <div className="text-3xl font-bold text-primary">{queue_position}</div>
            <div className="text-sm text-muted-foreground">Posisi Anda</div>
          </div>
          <div className="rounded-lg border p-4 text-center">
            <div className="text-3xl font-bold text-muted-foreground">{total_waiting}</div>
            <div className="text-sm text-muted-foreground">Total Antrian</div>
          </div>
        </div>

        {/* Other waiting usulan */}
        {other_waiting_usulan.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Users className="h-4 w-4" />
              <span>Usulan Lain dalam Antrian</span>
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto">
              {other_waiting_usulan.map((usulan) => (
                <div
                  key={usulan.id}
                  className={`flex items-center justify-between gap-2 rounded-md border p-3 ${
                    usulan.queue_position === queue_position
                      ? 'border-primary bg-primary/5'
                      : ''
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {usulan.employee_name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Diajukan{' '}
                      {formatDistanceToNow(new Date(usulan.submitted_at), {
                        addSuffix: true,
                        locale: idLocale,
                      })}
                    </p>
                  </div>
                  <Badge variant={usulan.queue_position === queue_position ? 'default' : 'outline'}>
                    #{usulan.queue_position}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Info about promotion */}
        <Alert>
          <AlertDescription className="text-xs">
            <strong>Catatan:</strong> Anda akan otomatis dipromosikan ke status "Diajukan" 
            ketika formasi jabatan tersedia. Urutan prioritas berdasarkan waktu pengajuan (FIFO).
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}
