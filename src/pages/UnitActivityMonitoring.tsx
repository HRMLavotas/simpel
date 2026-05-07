import { useState, useMemo } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useUnitActivitySummary, useUnitMonthlyDetails } from '@/hooks/useUnitActivityMonitoring';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar, TrendingUp, AlertCircle, FileText, Users, ChevronRight, Search, Filter } from 'lucide-react';
import { format, startOfMonth, subMonths } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ExportMonitoringButton } from '@/components/monitoring/ExportMonitoringButton';

export default function UnitActivityMonitoring() {
  const currentMonth = format(startOfMonth(new Date()), 'yyyy-MM-dd');
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonth);
  const [selectedUnit, setSelectedUnit] = useState<{ department: string; month: string } | null>(null);
  const [sortBy, setSortBy] = useState<'name' | 'activity'>('activity');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [detailFilterType, setDetailFilterType] = useState<string>('all');

  const { data: activityData, isLoading, error } = useUnitActivitySummary(selectedMonth);
  const { data: detailsData, isLoading: isLoadingDetails } = useUnitMonthlyDetails(
    selectedUnit?.department || '',
    selectedUnit?.month || ''
  );

  // Generate last 12 months for dropdown
  const monthOptions = Array.from({ length: 12 }, (_, i) => {
    const date = subMonths(new Date(), i);
    return {
      value: format(startOfMonth(date), 'yyyy-MM-dd'),
      label: format(date, 'MMMM yyyy', { locale: localeId }),
    };
  });

  // Filter, search, and sort data
  const filteredAndSortedData = useMemo(() => {
    if (!activityData) return [];
    
    let filtered = [...activityData];
    
    // Apply status filter
    if (filterStatus === 'active') {
      filtered = filtered.filter(d => d.total_changes > 0);
    } else if (filterStatus === 'inactive') {
      filtered = filtered.filter(d => d.total_changes === 0);
    }
    
    // Apply search
    if (searchQuery) {
      filtered = filtered.filter(d => 
        d.department.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Sort
    filtered.sort((a, b) => {
      if (sortBy === 'activity') {
        return b.total_changes - a.total_changes;
      }
      return a.department.localeCompare(b.department);
    });
    
    return filtered;
  }, [activityData, filterStatus, searchQuery, sortBy]);

  const getActivityStatus = (totalChanges: number) => {
    if (totalChanges === 0) return { label: 'Tidak Ada Aktivitas', color: 'bg-red-500' };
    if (totalChanges < 5) return { label: 'Aktivitas Rendah', color: 'bg-yellow-500' };
    if (totalChanges < 20) return { label: 'Aktivitas Sedang', color: 'bg-blue-500' };
    return { label: 'Aktivitas Tinggi', color: 'bg-green-500' };
  };

  const formatDetailValue = (key: string, value: unknown): string => {
    if (value === null || value === undefined) return '-';
    if (key.includes('tanggal') || key.includes('tmt')) {
      try {
        return format(new Date(value as string), 'dd MMM yyyy', { locale: localeId });
      } catch {
        return String(value);
      }
    }
    return String(value);
  };

  const formatDetailLabel = (key: string) => {
    const labelMap: Record<string, string> = {
      'dari_unit': 'Dari Unit',
      'ke_unit': 'Ke Unit',
      'nomor_sk': 'Nomor SK',
      'tanggal': 'Tanggal',
      'jabatan_lama': 'Jabatan Lama',
      'jabatan_baru': 'Jabatan Baru',
      'pangkat_lama': 'Pangkat Lama',
      'pangkat_baru': 'Pangkat Baru',
      'tmt': 'TMT',
      'nama_diklat': 'Nama Diklat',
      'penyelenggara': 'Penyelenggara',
      'tanggal_mulai': 'Tanggal Mulai',
      'tanggal_selesai': 'Tanggal Selesai',
      'level': 'Jenjang',
      'institution_name': 'Institusi',
      'major': 'Jurusan',
      'graduation_year': 'Tahun Lulus',
    };
    return labelMap[key] || key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  // Filter details by type
  const filteredDetails = useMemo(() => {
    if (!detailsData) return [];
    if (detailFilterType === 'all') return detailsData;
    return detailsData.filter(d => d.change_type === detailFilterType);
  }, [detailsData, detailFilterType]);

  // Get unique change types for filter
  const changeTypes = useMemo(() => {
    if (!detailsData) return [];
    const types = [...new Set(detailsData.map(d => d.change_type))];
    return types.sort();
  }, [detailsData]);

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Monitoring Aktivitas Unit Kerja</h1>
            <p className="text-muted-foreground">
              Pantau update data pegawai per unit kerja setiap bulan
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {monthOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <ExportMonitoringButton data={activityData || []} month={selectedMonth} />
          </div>
        </div>

        {/* Summary Cards */}
        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i}>
                <CardHeader className="pb-2">
                  <Skeleton className="h-4 w-24" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-16" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  Total Unit Aktif
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {activityData?.filter((d) => d.total_changes > 0).length || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  dari {activityData?.length || 0} unit
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-red-500" />
                  Unit Tidak Aktif
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {activityData?.filter((d) => d.total_changes === 0).length || 0}
                </div>
                <p className="text-xs text-muted-foreground">perlu follow up</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <FileText className="h-4 w-4 text-blue-500" />
                  Total Perubahan
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {activityData?.reduce((sum, d) => sum + d.total_changes, 0) || 0}
                </div>
                <p className="text-xs text-muted-foreground">perubahan data</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Users className="h-4 w-4 text-purple-500" />
                  Pegawai Diupdate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {activityData?.reduce((sum, d) => sum + d.employees_updated, 0) || 0}
                </div>
                <p className="text-xs text-muted-foreground">pegawai</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Unit Activity List */}
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Aktivitas Per Unit Kerja</CardTitle>
                  <CardDescription>
                    Klik pada unit untuk melihat detail perubahan data
                  </CardDescription>
                </div>
                <Select value={sortBy} onValueChange={(value: 'name' | 'activity') => setSortBy(value)}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="activity">Urutkan: Aktivitas</SelectItem>
                    <SelectItem value="name">Urutkan: Nama Unit</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* Search and Filter */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Cari unit kerja..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select value={filterStatus} onValueChange={(value: 'all' | 'active' | 'inactive') => setFilterStatus(value)}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Unit</SelectItem>
                    <SelectItem value="active">Unit Aktif</SelectItem>
                    <SelectItem value="inactive">Unit Tidak Aktif</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* Results count */}
              {!isLoading && filteredAndSortedData.length > 0 && (
                <p className="text-sm text-muted-foreground">
                  Menampilkan {filteredAndSortedData.length} dari {activityData?.length || 0} unit
                </p>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {error ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
                <p className="text-lg font-semibold mb-2">Terjadi Kesalahan</p>
                <p className="text-muted-foreground mb-4">
                  {error instanceof Error ? error.message : 'Gagal memuat data monitoring'}
                </p>
                <p className="text-sm text-muted-foreground">
                  Kemungkinan penyebab:
                </p>
                <ul className="text-sm text-muted-foreground list-disc list-inside mt-2">
                  <li>Migration database belum dijalankan</li>
                  <li>View 'unit_activity_summary' belum dibuat</li>
                  <li>Koneksi database bermasalah</li>
                </ul>
                <p className="text-sm text-muted-foreground mt-4">
                  Silakan jalankan file: <code className="bg-muted px-2 py-1 rounded">debug_monitoring.sql</code> di Supabase SQL Editor
                </p>
              </div>
            ) : isLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : filteredAndSortedData && filteredAndSortedData.length > 0 ? (
              <div className="space-y-3">
                {filteredAndSortedData.map((unit) => {
                  const status = getActivityStatus(unit.total_changes);
                  return (
                    <div
                      key={`${unit.department}-${unit.month}`}
                      className="flex items-center justify-between rounded-lg border p-4 hover:bg-accent/50 transition-colors cursor-pointer"
                      onClick={() => setSelectedUnit({ department: unit.department, month: unit.month })}
                    >
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{unit.department}</h3>
                          <Badge variant={unit.total_changes === 0 ? 'destructive' : 'default'}>
                            {status.label}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                          <span>Mutasi: {unit.mutations}</span>
                          <span>Jabatan: {unit.position_changes}</span>
                          <span>Pangkat: {unit.rank_changes}</span>
                          <span>Diklat: {unit.training_records}</span>
                          <span>Pendidikan: {unit.education_records}</span>
                        </div>
                        {unit.last_update && (
                          <p className="text-xs text-muted-foreground">
                            Update terakhir: {format(new Date(unit.last_update), 'dd MMM yyyy HH:mm', { locale: localeId })}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="text-2xl font-bold">{unit.total_changes}</div>
                          <div className="text-xs text-muted-foreground">perubahan</div>
                        </div>
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-2">
                  {searchQuery || filterStatus !== 'all' 
                    ? 'Tidak ada unit yang sesuai dengan filter'
                    : 'Tidak ada data aktivitas untuk bulan yang dipilih'}
                </p>
                {(searchQuery || filterStatus !== 'all') && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSearchQuery('');
                      setFilterStatus('all');
                    }}
                  >
                    Reset Filter
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Details Dialog */}
        <Dialog open={!!selectedUnit} onOpenChange={() => {
          setSelectedUnit(null);
          setDetailFilterType('all');
        }}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Detail Perubahan Data</DialogTitle>
              <DialogDescription>
                {selectedUnit?.department} -{' '}
                {selectedUnit?.month && format(new Date(selectedUnit.month), 'MMMM yyyy', { locale: localeId })}
              </DialogDescription>
            </DialogHeader>
            
            {/* Filter by change type */}
            {!isLoadingDetails && detailsData && detailsData.length > 0 && (
              <div className="flex items-center gap-2 pb-2 border-b">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Select value={detailFilterType} onValueChange={setDetailFilterType}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Jenis ({detailsData.length})</SelectItem>
                    {changeTypes.map(type => {
                      const count = detailsData.filter(d => d.change_type === type).length;
                      return (
                        <SelectItem key={type} value={type}>
                          {type} ({count})
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
                {detailFilterType !== 'all' && (
                  <span className="text-sm text-muted-foreground">
                    Menampilkan {filteredDetails.length} dari {detailsData.length} perubahan
                  </span>
                )}
              </div>
            )}
            
            <div className="space-y-4">
              {isLoadingDetails ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-24 w-full" />
                  ))}
                </div>
              ) : filteredDetails && filteredDetails.length > 0 ? (
                filteredDetails.map((detail, index) => (
                  <Card key={index}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-base">{detail.employee_name}</CardTitle>
                          <CardDescription>NIP: {detail.employee_nip || '-'}</CardDescription>
                          {detail.created_by_email && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Diinput oleh: {detail.created_by_email}
                            </p>
                          )}
                        </div>
                        <Badge>{detail.change_type}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-2 text-sm">
                        {Object.entries(detail.details).map(([key, value]) => (
                          <div key={key} className="flex justify-between gap-4">
                            <span className="text-muted-foreground">
                              {formatDetailLabel(key)}:
                            </span>
                            <span className="font-medium text-right">{formatDetailValue(key, value)}</span>
                          </div>
                        ))}
                        <div className="flex justify-between pt-2 border-t">
                          <span className="text-muted-foreground">Tanggal Input:</span>
                          <span className="font-medium">
                            {format(new Date(detail.change_date), 'dd MMM yyyy HH:mm', { locale: localeId })}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-2">
                    {detailFilterType !== 'all' 
                      ? `Tidak ada perubahan jenis "${detailFilterType}"`
                      : 'Tidak ada detail perubahan data'}
                  </p>
                  {detailFilterType !== 'all' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDetailFilterType('all')}
                    >
                      Lihat Semua Jenis
                    </Button>
                  )}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
