/**
 * Usulan Ujikom Page (Admin Unit)
 * Task 7.4: Main dashboard for Admin Unit
 * Created: 2026-06-02
 */

import { useState } from 'react';
import { Plus, TrendingUp, Clock, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useUsulanStatistics } from '@/hooks/useUsulanUjikom';
import { UsulanList } from '@/components/usulan-ujikom/UsulanList';
import { UsulanForm } from '@/components/usulan-ujikom/UsulanForm';
import { UsulanDetail } from '@/components/usulan-ujikom/UsulanDetail';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function UsulanUjikom() {
  const [showForm, setShowForm] = useState(false);
  const [editUsulanId, setEditUsulanId] = useState<string | null>(null);
  const [detailUsulanId, setDetailUsulanId] = useState<string | null>(null);
  const { data: statistics, isLoading: statsLoading } = useUsulanStatistics();

  const handleEdit = (id: string) => {
    setEditUsulanId(id);
    setShowForm(true);
  };

  const handleViewDetail = (id: string) => {
    setDetailUsulanId(id);
  };

  const handleCloseDetail = () => {
    setDetailUsulanId(null);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditUsulanId(null);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Usulan Ujikom</h1>
          <p className="text-muted-foreground mt-1">
            Kelola usulan uji kompetensi pegawai untuk kenaikan jenjang jabatan fungsional
          </p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Buat Usulan Baru
        </Button>
      </div>

      {/* Statistics Cards */}
      {statsLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      ) : statistics ? (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Usulan</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{statistics.total_usulan}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Semua usulan yang dibuat
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Dalam Proses</CardTitle>
                <Clock className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {(statistics.by_status.Diajukan || 0) +
                    (statistics.by_status.Verifikasi_Berkas || 0) +
                    (statistics.by_status.Proses_Ujikom || 0)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Diajukan, verifikasi, dan ujikom
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Lulus</CardTitle>
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {statistics.by_status.Lulus_Ujikom || 0}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Pegawai yang lulus ujikom
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Daftar Tunggu</CardTitle>
                <Clock className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  {statistics.by_status.Waiting_List || 0}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Menunggu formasi tersedia
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Warning for full positions */}
          {statistics.full_positions.length > 0 && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Perhatian:</strong> {statistics.full_positions.length} jabatan memiliki formasi penuh.
                Usulan baru untuk jabatan tersebut akan masuk daftar tunggu.
              </AlertDescription>
            </Alert>
          )}

          {/* Recent Lulus */}
          {statistics.recent_lulus.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Pegawai yang Lulus Ujikom (Terbaru)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {statistics.recent_lulus.map((item) => (
                    <div
                      key={item.employee_id}
                      className="flex items-center justify-between p-3 rounded-lg border bg-green-50"
                    >
                      <div>
                        <p className="font-medium">{item.employee_name}</p>
                        <p className="text-sm text-muted-foreground">{item.position_name}</p>
                      </div>
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      ) : null}

      {/* Usulan List */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Usulan</CardTitle>
        </CardHeader>
        <CardContent>
          <UsulanList onViewDetail={handleViewDetail} onEdit={handleEdit} />
        </CardContent>
      </Card>

      {/* Create/Edit Form Dialog */}
      <UsulanForm
        open={showForm}
        onOpenChange={handleFormClose}
        usulan={editUsulanId ? undefined : null}
        mode={editUsulanId ? 'edit' : 'create'}
      />

      {/* Detail Sheet */}
      <Sheet open={!!detailUsulanId} onOpenChange={handleCloseDetail}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Detail Usulan Ujikom</SheetTitle>
          </SheetHeader>
          {detailUsulanId && (
            <div className="mt-6">
              <UsulanDetail
                usulanId={detailUsulanId}
                onEdit={() => {
                  handleEdit(detailUsulanId);
                  handleCloseDetail();
                }}
                onClose={handleCloseDetail}
              />
            </div>
          )}
        </SheetContent>
      </Sheet>
      </div>
    </AppLayout>
  );
}
