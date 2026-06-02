/**
 * Usulan Ujikom Pusat Page (Admin Pusat)
 * Task 8.4: Main management dashboard for Admin Pusat
 * Created: 2026-06-02
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { TrendingUp, Clock, CheckCircle2, XCircle, Users, AlertCircle } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { UsulanPusatList } from '@/components/usulan-ujikom/UsulanPusatList';
import { UsulanPusatDetail } from '@/components/usulan-ujikom/UsulanPusatDetail';
import { StatusChangeDialog } from '@/components/usulan-ujikom/StatusChangeDialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import type { UsulanStatus } from '@/lib/usulan-ujikom/types';

export default function UsulanUjikomPusat() {
  const [detailUsulanId, setDetailUsulanId] = useState<string | null>(null);
  const [statusChangeUsulan, setStatusChangeUsulan] = useState<{
    id: string;
    status: UsulanStatus;
  } | null>(null);

  // Fetch overall statistics
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['usulan-ujikom', 'admin-pusat-stats'],
    queryFn: async () => {
      // Get counts by status
      const { data: allUsulan, error } = await supabase
        .from('usulan_ujikom')
        .select('status, department');

      if (error) throw error;

      const byStatus: Record<string, number> = {};
      const byDepartment: Record<string, number> = {};

      allUsulan?.forEach((item) => {
        byStatus[item.status] = (byStatus[item.status] || 0) + 1;
        byDepartment[item.department] = (byDepartment[item.department] || 0) + 1;
      });

      return {
        total: allUsulan?.length || 0,
        byStatus,
        departmentCount: Object.keys(byDepartment).length,
      };
    },
  });

  const handleViewDetail = (id: string) => {
    setDetailUsulanId(id);
  };

  const handleCloseDetail = () => {
    setDetailUsulanId(null);
  };

  const handleChangeStatus = (id: string, currentStatus: UsulanStatus) => {
    setStatusChangeUsulan({ id, status: currentStatus });
  };

  const handleCloseStatusDialog = () => {
    setStatusChangeUsulan(null);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Menu Usulan Ujikom</h1>
        <p className="text-muted-foreground mt-1">
          Kelola dan verifikasi semua usulan uji kompetensi dari seluruh unit kerja
        </p>
      </div>

      {/* Statistics Cards */}
      {statsLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      ) : stats ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Usulan</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Dari {stats.departmentCount} unit kerja
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Menunggu Verifikasi</CardTitle>
              <Clock className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {stats.byStatus.Diajukan || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Perlu ditindaklanjuti
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Dalam Proses</CardTitle>
              <Users className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {(stats.byStatus.Verifikasi_Berkas || 0) +
                  (stats.byStatus.Proses_Ujikom || 0)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Verifikasi dan ujikom
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Selesai</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {(stats.byStatus.Lulus_Ujikom || 0) +
                  (stats.byStatus.Tidak_Lulus_Ujikom || 0)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Lulus: {stats.byStatus.Lulus_Ujikom || 0} • Tidak: {stats.byStatus.Tidak_Lulus_Ujikom || 0}
              </p>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {/* Quick Stats */}
      {stats && stats.byStatus.Waiting_List > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-orange-600" />
              <div>
                <p className="font-medium text-orange-900">
                  {stats.byStatus.Waiting_List} usulan dalam daftar tunggu
                </p>
                <p className="text-sm text-orange-700">
                  Usulan akan otomatis dipromosikan ketika formasi tersedia
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Usulan List */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Usulan</CardTitle>
        </CardHeader>
        <CardContent>
          <UsulanPusatList
            onViewDetail={handleViewDetail}
            onChangeStatus={handleChangeStatus}
          />
        </CardContent>
      </Card>

      {/* Detail Sheet */}
      <Sheet open={!!detailUsulanId} onOpenChange={handleCloseDetail}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Detail Usulan Ujikom</SheetTitle>
          </SheetHeader>
          {detailUsulanId && (
            <div className="mt-6">
              <UsulanPusatDetail usulanId={detailUsulanId} />
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Status Change Dialog */}
      {statusChangeUsulan && (
        <StatusChangeDialog
          open={!!statusChangeUsulan}
          onOpenChange={handleCloseStatusDialog}
          usulanId={statusChangeUsulan.id}
          currentStatus={statusChangeUsulan.status}
        />
      )}
      </div>
    </AppLayout>
  );
}
