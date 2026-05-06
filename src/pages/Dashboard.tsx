import { useState, useEffect } from 'react';
import { Users, UserCheck, UserPlus, UserMinus, Settings2, TrendingUp, AlertCircle, GraduationCap } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { ChartWrapper } from '@/components/dashboard/ChartWrapper';
import { StatsGridSkeleton, ChartSkeleton } from '@/components/ui/skeleton-screens';
import { 
  AsnPieChart, 
  RankBarChart, 
  DepartmentBarChart, 
  PositionTypePieChart,
  GenderPieChart,
  WorkDurationBarChart,
  COLORS 
} from '@/components/dashboard/Charts';
import {
  GradeBarChart,
  AgeBarChart,
  RetirementYearBarChart,
  EducationPieChart
} from '@/components/dashboard/AdditionalCharts';
import { PetaJabatanAsnTable, NonAsnPositionChart } from '@/components/dashboard/PetaJabatanCharts';
import { useAuth } from '@/hooks/useAuth';
import { useDashboardData } from '@/hooks/useDashboardData';
import { usePetaJabatanStats } from '@/hooks/usePetaJabatanStats';
import { useDepartments } from '@/hooks/useDepartments';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { logger } from '@/lib/logger';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

// Available chart categories
const CHART_CATEGORIES = [
  { id: 'asn_status', label: 'Status ASN', description: 'Distribusi PNS, PPPK, Non ASN' },
  { id: 'rank', label: 'Golongan', description: 'Distribusi per golongan/pangkat' },
  { id: 'position_type', label: 'Jenis Jabatan', description: 'Struktural, Fungsional, Pelaksana' },
  { id: 'department', label: 'Unit Kerja', description: 'Distribusi per unit kerja' },
  { id: 'work_duration', label: 'Masa Kerja', description: 'Distribusi masa kerja pegawai' },
  { id: 'grade', label: 'Grade Jabatan', description: 'Distribusi grade jabatan' },
  { id: 'age', label: 'Usia Pegawai', description: 'Distribusi usia pegawai' },
  { id: 'retirement_year', label: 'Tahun Pensiun', description: 'Tren pegawai pensiun per tahun' },
  { id: 'education', label: 'Jenjang Pendidikan', description: 'Distribusi berdasarkan pendidikan terakhir' },
  { id: 'gender', label: 'Jenis Kelamin', description: 'Distribusi berdasarkan gender' },
  { id: 'peta_jabatan_asn', label: 'Summary Peta Jabatan ASN', description: 'Perbandingan Target ABK vs Total ASN' },
  { id: 'non_asn_formasi', label: 'Distribusi Formasi Non ASN', description: 'Top 15 Formasi/Penugasan terbanyak untuk Non ASN' },
];

export default function Dashboard() {
  const { profile, canViewAll } = useAuth();
  const { toast } = useToast();
  const { departments: dynamicDepartments } = useDepartments();
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [selectedAsnStatus, setSelectedAsnStatus] = useState<string>('all');
  // 4 Essential charts for Executive Leadership (default for new users)
  const EXECUTIVE_DEFAULT_CHARTS = [
    'asn_status',
    'peta_jabatan_asn',
    'position_type',
    'rank'
  ];

  const [selectedCharts, setSelectedCharts] = useState<string[]>(EXECUTIVE_DEFAULT_CHARTS);
  const [isLoadingPreferences, setIsLoadingPreferences] = useState(true);
  
  const { 
    stats, 
    rankData, 
    departmentData, 
    positionTypeData, 
    genderData, 
    workDurationData,
    gradeData,
    ageData,
    retirementYearData,
    educationData,
    isLoading,
    error: dashboardError
  } = useDashboardData({
    department: profile?.department || null,
    isAdminPusat: canViewAll,
    selectedDepartment,
    selectedAsnStatus,
  });

  const { asnStats, nonAsnStats, isLoading: isPetaLoading } = usePetaJabatanStats({
    isAdminPusat: canViewAll,
    userDepartment: profile?.department || null,
    selectedDepartment,
  });

  const savePreferences = async (charts: string[]) => {
    if (!profile?.id) return;
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ dashboard_preferences: charts })
        .eq('id', profile.id);
      if (error) throw error;
    } catch (error) {
      logger.error('Error saving preferences:', error);
    }
  };

  useEffect(() => {
    const loadPreferences = async () => {
      if (!profile?.id) {
        setIsLoadingPreferences(false);
        return;
      }
      setIsLoadingPreferences(true);
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('dashboard_preferences')
          .eq('id', profile.id)
          .single();

        if (data?.dashboard_preferences && Array.isArray(data.dashboard_preferences) && data.dashboard_preferences.length > 0) {
          logger.debug('Loaded dashboard preferences:', data.dashboard_preferences);
          setSelectedCharts([...data.dashboard_preferences]);
        } else {
          // If no preferences found, use executive default and save it
          logger.debug('No preferences found, using executive default');
          setSelectedCharts(EXECUTIVE_DEFAULT_CHARTS);
          await savePreferences(EXECUTIVE_DEFAULT_CHARTS);
        }
      } catch (error) {
        logger.error('Error loading preferences:', error);
      } finally {
        setIsLoadingPreferences(false);
      }
    };
    loadPreferences();
  }, [profile?.id]);

  const toggleChart = (chartId: string) => {
    setSelectedCharts(prev => {
      const newCharts = prev.includes(chartId)
        ? prev.filter(id => id !== chartId)
        : [...prev, chartId];
      savePreferences(newCharts);
      return newCharts;
    });
  };

  const selectAllCharts = () => {
    const allCharts = CHART_CATEGORIES.map(c => c.id);
    setSelectedCharts(allCharts);
    savePreferences(allCharts);
  };

  const clearAllCharts = () => {
    setSelectedCharts([]);
    savePreferences([]);
  };

  const asnChartData = [
    { name: 'PNS', value: stats.pns, color: COLORS.PNS },
    { name: 'PPPK', value: stats.pppk, color: COLORS.PPPK },
    { name: 'Non ASN', value: stats.nonAsn, color: COLORS['Non ASN'] },
  ].filter(d => d.value > 0);

  const pageTitle = canViewAll 
    ? selectedDepartment === 'all' 
      ? 'Dashboard - Semua Unit Kerja' 
      : `Dashboard - ${selectedDepartment}`
    : `Dashboard - ${profile?.department}`;

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:gap-4">
          <div className="page-header mb-0">
            <h1 className="page-title flex items-center gap-2 text-xl sm:text-2xl md:text-3xl">
              <TrendingUp className="h-6 w-6 sm:h-7 sm:w-7 text-primary flex-shrink-0" />
              <span className="truncate">{pageTitle}</span>
            </h1>
            <p className="page-description text-xs sm:text-sm">Dashboard eksekutif untuk monitoring data pegawai</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            {canViewAll && (
              <>
                <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                  <SelectTrigger className="w-full sm:w-[240px] h-9 sm:h-10">
                    <SelectValue placeholder="Pilih Unit Kerja" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Unit Kerja</SelectItem>
                    {dynamicDepartments.filter(d => d !== 'Pusat').map((dept) => (
                      <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={selectedAsnStatus} onValueChange={setSelectedAsnStatus}>
                  <SelectTrigger className="w-full sm:w-[200px] h-9 sm:h-10">
                    <SelectValue placeholder="Status ASN" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Status</SelectItem>
                    <SelectItem value="asn">ASN (PNS + CPNS + PPPK)</SelectItem>
                    <SelectItem value="PNS">PNS</SelectItem>
                    <SelectItem value="CPNS">CPNS</SelectItem>
                    <SelectItem value="PPPK">PPPK</SelectItem>
                    <SelectItem value="Non ASN">Non ASN</SelectItem>
                  </SelectContent>
                </Select>
              </>
            )}

            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" className="gap-2 h-9 sm:h-10 text-xs sm:text-sm w-full sm:w-auto">
                  <Settings2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  Pilih Data ({selectedCharts.length})
                </Button>
              </SheetTrigger>
              <SheetContent className="overflow-y-auto w-[90vw] sm:w-[400px]">
                <SheetHeader>
                  <SheetTitle>Pilih Data</SheetTitle>
                  <SheetDescription>Pilih kategori data yang ingin ditampilkan</SheetDescription>
                </SheetHeader>
                <div className="mt-4 space-y-4">
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={selectAllCharts} className="flex-1">Pilih Semua</Button>
                    <Button variant="outline" size="sm" onClick={clearAllCharts} className="flex-1">Hapus Semua</Button>
                  </div>
                  <div className="space-y-2">
                    {CHART_CATEGORIES.map(category => (
                      <div key={category.id} className="flex items-center space-x-2 border p-3 rounded-lg hover:bg-muted/50 cursor-pointer" onClick={() => toggleChart(category.id)}>
                        <Checkbox checked={selectedCharts.includes(category.id)} onCheckedChange={() => toggleChart(category.id)} />
                        <div>
                          <Label className="text-sm font-medium">{category.label}</Label>
                          <p className="text-xs text-muted-foreground">{category.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {dashboardError && (
          <Card className="border-destructive bg-destructive/5 p-4 text-destructive">{dashboardError}</Card>
        )}

        {!isLoading && !isPetaLoading && !isLoadingPreferences && stats.total === 0 && (
          <Card className="border-amber-500/30 bg-amber-500/5">
            <CardContent className="flex items-start gap-3 p-4 sm:p-5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-500/10 text-amber-600">
                <AlertCircle className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-foreground">Belum ada data untuk filter ini</p>
                <p className="text-sm text-muted-foreground">
                  Tidak ada pegawai yang cocok dengan pilihan unit kerja/status saat ini. Coba ubah filter agar grafik dan ringkasan muncul.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {(isLoading || isPetaLoading) ? (
          <StatsGridSkeleton count={6} />
        ) : (
          <>
            {/* Baris 1: 6 card utama */}
            <div className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
              <StatCard title="Total Pegawai" value={stats.total} icon={Users} variant="primary" />
              <StatCard
                title="ASN"
                value={stats.pns + stats.cpns + stats.pppk}
                icon={UserCheck}
                variant="primary"
                description={`${stats.total > 0 ? (((stats.pns + stats.cpns + stats.pppk) / stats.total) * 100).toFixed(1) : 0}%`}
              />
              <StatCard
                title="PNS"
                value={stats.pns}
                icon={UserCheck}
                variant="primary"
                description={`${stats.total > 0 ? ((stats.pns / stats.total) * 100).toFixed(1) : 0}%`}
              />
              <StatCard
                title="CPNS"
                value={stats.cpns}
                icon={GraduationCap}
                variant="info"
                description={`${stats.total > 0 ? ((stats.cpns / stats.total) * 100).toFixed(1) : 0}%`}
              />
              <StatCard
                title="PPPK"
                value={stats.pppk}
                icon={UserPlus}
                variant="success"
                description={`${stats.total > 0 ? ((stats.pppk / stats.total) * 100).toFixed(1) : 0}%`}
              />
              <StatCard
                title="Non ASN"
                value={stats.nonAsn}
                icon={UserMinus}
                variant="warning"
                description={`${stats.total > 0 ? ((stats.nonAsn / stats.total) * 100).toFixed(1) : 0}%`}
              />
            </div>

            {/* Baris 2: Card ringkasan ASN */}
            {(() => {
              const totalAsn = stats.pns + stats.cpns + stats.pppk;
              const pctPns  = totalAsn > 0 ? ((stats.pns  / totalAsn) * 100).toFixed(1) : '0';
              const pctCpns = totalAsn > 0 ? ((stats.cpns / totalAsn) * 100).toFixed(1) : '0';
              const pctPppk = totalAsn > 0 ? ((stats.pppk / totalAsn) * 100).toFixed(1) : '0';
              return (
                <div className="grid gap-3 sm:gap-4 grid-cols-1">
                  {/* Breakdown ASN - full width */}
                  <div className="rounded-xl border bg-card p-4 sm:p-5 shadow-sm">
                    <p className="text-sm font-medium text-muted-foreground mb-3">Komposisi ASN</p>
                    <div className="space-y-2">
                      {/* PNS bar */}
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="font-medium">PNS</span>
                          <span className="text-muted-foreground">{stats.pns.toLocaleString('id-ID')} ({pctPns}%)</span>
                        </div>
                        <div className="h-2 rounded-full bg-muted overflow-hidden">
                          <div className="h-full rounded-full bg-blue-500" style={{ width: `${pctPns}%` }} />
                        </div>
                      </div>
                      {/* CPNS bar */}
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="font-medium">CPNS</span>
                          <span className="text-muted-foreground">{stats.cpns.toLocaleString('id-ID')} ({pctCpns}%)</span>
                        </div>
                        <div className="h-2 rounded-full bg-muted overflow-hidden">
                          <div className="h-full rounded-full bg-indigo-500" style={{ width: `${pctCpns}%` }} />
                        </div>
                      </div>
                      {/* PPPK bar */}
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="font-medium">PPPK</span>
                          <span className="text-muted-foreground">{stats.pppk.toLocaleString('id-ID')} ({pctPppk}%)</span>
                        </div>
                        <div className="h-2 rounded-full bg-muted overflow-hidden">
                          <div className="h-full rounded-full bg-emerald-500" style={{ width: `${pctPppk}%` }} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}
          </>
        )}

        {(isLoading || isPetaLoading || isLoadingPreferences) ? (
          <div className="grid gap-6 grid-cols-1 md:grid-cols-2"><ChartSkeleton /><ChartSkeleton /></div>
        ) : (
          <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
            {selectedCharts.includes('asn_status') && <AsnPieChart data={asnChartData} />}
            {selectedCharts.includes('non_asn_formasi') && <NonAsnPositionChart data={nonAsnStats} />}
            {selectedCharts.includes('position_type') && (
              <ChartWrapper title="Jenis Jabatan" data={positionTypeData}><PositionTypePieChart data={positionTypeData} /></ChartWrapper>
            )}
            {selectedCharts.includes('retirement_year') && (
              <ChartWrapper title="Tahun Pensiun" data={retirementYearData}><RetirementYearBarChart data={retirementYearData} /></ChartWrapper>
            )}
            {selectedCharts.includes('rank') && (
              <ChartWrapper title="Distribusi Golongan" data={rankData}><RankBarChart data={rankData} /></ChartWrapper>
            )}
            
            {/* Other Secondary Charts */}
            {selectedCharts.includes('department') && canViewAll && selectedDepartment === 'all' && (
              <ChartWrapper title="Distribusi Unit Kerja" data={departmentData}><DepartmentBarChart data={departmentData} /></ChartWrapper>
            )}
            {selectedCharts.includes('gender') && (
              <ChartWrapper title="Jenis Kelamin" data={genderData}><GenderPieChart data={genderData} /></ChartWrapper>
            )}
            {selectedCharts.includes('work_duration') && (
              <ChartWrapper title="Masa Kerja" data={workDurationData}><WorkDurationBarChart data={workDurationData} /></ChartWrapper>
            )}
            {selectedCharts.includes('grade') && (
              <ChartWrapper title="Grade Jabatan" data={gradeData}><GradeBarChart data={gradeData} /></ChartWrapper>
            )}
            {selectedCharts.includes('age') && (
              <ChartWrapper title="Usia Pegawai" data={ageData}><AgeBarChart data={ageData} /></ChartWrapper>
            )}
            {selectedCharts.includes('education') && (
              <ChartWrapper title="Jenjang Pendidikan" data={educationData}><EducationPieChart data={educationData} /></ChartWrapper>
            )}

            {/* Peta Jabatan Table at the very bottom */}
            {selectedCharts.includes('peta_jabatan_asn') && <PetaJabatanAsnTable data={asnStats} />}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
