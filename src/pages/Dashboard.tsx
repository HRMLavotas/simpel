import { useState, useEffect } from 'react';
import { Users, UserCheck, UserPlus, UserMinus, Settings2, TrendingUp } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { ChartWrapper } from '@/components/dashboard/ChartWrapper';
import { StatsGridSkeleton, ChartSkeleton } from '@/components/ui/skeleton-screens';
import { 
  AsnPieChart, 
  RankBarChart, 
  DepartmentBarChart, 
  PositionTypePieChart, 
  JoinYearBarChart,
  GenderPieChart,
  ReligionPieChart,
  PositionKepmenBarChart,
  TmtYearBarChart,
  WorkDurationBarChart,
  COLORS 
} from '@/components/dashboard/Charts';
import {
  GradeBarChart,
  AgeBarChart,
  RetirementYearBarChart,
  EducationPieChart
} from '@/components/dashboard/AdditionalCharts';
import { useAuth } from '@/hooks/useAuth';
import { useDashboardData } from '@/hooks/useDashboardData';
import { DEPARTMENTS } from '@/lib/constants';
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
  { id: 'join_year', label: 'Tahun Bergabung', description: 'Tren pegawai bergabung per tahun' },
  { id: 'gender', label: 'Jenis Kelamin', description: 'Distribusi berdasarkan gender' },
  { id: 'religion', label: 'Agama', description: 'Distribusi berdasarkan agama' },
  { id: 'position_kepmen', label: 'Jabatan Kepmen 202/2024', description: 'Distribusi jabatan sesuai Kepmen' },
  { id: 'tmt_cpns', label: 'TMT CPNS', description: 'Tren TMT CPNS per tahun' },
  { id: 'tmt_pns', label: 'TMT PNS', description: 'Tren TMT PNS per tahun' },
  { id: 'work_duration', label: 'Masa Kerja', description: 'Distribusi masa kerja pegawai' },
  { id: 'grade', label: 'Grade Jabatan', description: 'Distribusi grade jabatan' },
  { id: 'age', label: 'Usia Pegawai', description: 'Distribusi usia pegawai' },
  { id: 'retirement_year', label: 'Tahun Pensiun', description: 'Tren pegawai pensiun per tahun' },
  { id: 'education', label: 'Jenjang Pendidikan', description: 'Distribusi berdasarkan pendidikan terakhir' },
];

export default function Dashboard() {
  const { profile, isAdminPusat, canViewAll } = useAuth();
  const { toast } = useToast();
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [selectedAsnStatus, setSelectedAsnStatus] = useState<string>('all'); // New: ASN status filter
  const [selectedCharts, setSelectedCharts] = useState<string[]>([
    'asn_status',
    'rank',
    'position_type',
    'join_year',
  ]);
  const [isLoadingPreferences, setIsLoadingPreferences] = useState(true);
  
  const { 
    stats, 
    rankData, 
    departmentData, 
    positionTypeData, 
    joinYearData, 
    genderData, 
    religionData, 
    positionKepmenData,
    tmtCpnsData,
    tmtPnsData,
    workDurationData,
    gradeData,
    ageData,
    retirementYearData,
    educationData,
    isLoading,
    error: dashboardError
  } = useDashboardData({
    department: profile?.department || null,
    isAdminPusat: canViewAll, // Use canViewAll instead of isAdminPusat
    selectedDepartment,
    selectedAsnStatus, // New: Pass ASN status filter
  });

  // Save preferences to database
  const savePreferences = async (charts: string[]) => {
    if (!profile?.id) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ dashboard_preferences: charts })
        .eq('id', profile.id);

      if (error) throw error;

      logger.debug('Dashboard preferences saved:', charts);
    } catch (error) {
      logger.error('Error saving dashboard preferences:', error);
      toast({
        title: 'Gagal menyimpan preferensi',
        description: 'Terjadi kesalahan saat menyimpan pilihan chart',
        variant: 'destructive',
      });
    }
  };

  // Load user preferences on mount
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

        if (error) {
          logger.error('Error loading dashboard preferences:', error);
          // Use default if error
          const defaultCharts = ['asn_status', 'rank', 'position_type', 'join_year'];
          setSelectedCharts(defaultCharts);
          setIsLoadingPreferences(false);
          return;
        }

        if (data?.dashboard_preferences && Array.isArray(data.dashboard_preferences) && data.dashboard_preferences.length > 0) {
          logger.debug('Loaded dashboard preferences:', data.dashboard_preferences);
          // Force state update by creating new array
          setSelectedCharts([...data.dashboard_preferences]);
        } else {
          // If no preferences found, use default
          logger.debug('No preferences found, using default');
          const defaultCharts = ['asn_status', 'rank', 'position_type', 'join_year'];
          setSelectedCharts([...defaultCharts]);
          // Save default to database
          await savePreferences(defaultCharts);
        }
      } catch (error) {
        logger.error('Error loading dashboard preferences:', error);
        // Use default on error
        const defaultCharts = ['asn_status', 'rank', 'position_type', 'join_year'];
        setSelectedCharts([...defaultCharts]);
      } finally {
        setIsLoadingPreferences(false);
      }
    };

    loadPreferences();
  }, [profile?.id]); // Only re-run when profile.id changes

  // Debug: Log selectedCharts changes
  useEffect(() => {
    logger.debug('=== SELECTED CHARTS UPDATED ===');
    logger.debug('Selected charts:', selectedCharts);
    logger.debug('Count:', selectedCharts.length);
    logger.debug('Is loading preferences:', isLoadingPreferences);
    logger.debug('Is loading data:', isLoading);
  }, [selectedCharts, isLoadingPreferences, isLoading]);

  const toggleChart = (chartId: string) => {
    setSelectedCharts(prev => {
      const newCharts = prev.includes(chartId)
        ? prev.filter(id => id !== chartId)
        : [...prev, chartId];
      
      logger.debug('Toggle chart:', chartId, 'New charts:', newCharts);
      
      // Save to database
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
        {/* Page Header */}
        <div className="flex flex-col gap-3 sm:gap-4">
          <div className="page-header mb-0">
            <h1 className="page-title flex items-center gap-2 text-xl sm:text-2xl md:text-3xl">
              <TrendingUp className="h-6 w-6 sm:h-7 sm:w-7 text-primary flex-shrink-0" />
              <span className="truncate">{pageTitle}</span>
            </h1>
            <p className="page-description text-xs sm:text-sm">
              Dashboard eksekutif untuk monitoring data pegawai
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            {canViewAll && (
              <>
                <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                  <SelectTrigger id="dashboard-department-filter" className="w-full sm:w-[240px] h-9 sm:h-10">
                    <SelectValue placeholder="Pilih Unit Kerja" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Unit Kerja</SelectItem>
                    {DEPARTMENTS.filter(d => d !== 'Pusat').map((dept) => (
                      <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={selectedAsnStatus} onValueChange={setSelectedAsnStatus}>
                  <SelectTrigger id="dashboard-asn-status-filter" className="w-full sm:w-[200px] h-9 sm:h-10">
                    <SelectValue placeholder="Status ASN" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Status</SelectItem>
                    <SelectItem value="asn">ASN (PNS + PPPK)</SelectItem>
                    <SelectItem value="PNS">PNS</SelectItem>
                    <SelectItem value="PPPK">PPPK</SelectItem>
                    <SelectItem value="Non ASN">Non ASN</SelectItem>
                  </SelectContent>
                </Select>
              </>
            )}

            <div className="flex gap-2">
              {/* Chart Selector Sheet */}
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="default" className="gap-2 h-9 sm:h-10 text-xs sm:text-sm w-full sm:w-auto">
                    <Settings2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    <span className="hidden xs:inline">Pilih Data</span>
                    <span className="xs:hidden">Data</span>
                    <span>({selectedCharts.length})</span>
                  </Button>
                </SheetTrigger>
                <SheetContent className="overflow-y-auto w-[90vw] sm:w-[400px] max-w-md">
                  <SheetHeader>
                    <SheetTitle className="text-base sm:text-lg">Pilih Data untuk Ditampilkan</SheetTitle>
                    <SheetDescription className="text-xs sm:text-sm">
                      Pilih kategori data yang ingin ditampilkan di dashboard
                    </SheetDescription>
                  </SheetHeader>

                  <div className="mt-4 sm:mt-6 space-y-3 sm:space-y-4 pb-6">
                    <div className="flex gap-2 sticky top-0 bg-background z-10 pb-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={selectAllCharts}
                        className="flex-1 h-8 text-xs"
                      >
                        Pilih Semua
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={clearAllCharts}
                        className="flex-1 h-8 text-xs"
                      >
                        Hapus Semua
                      </Button>
                    </div>

                    <div className="space-y-2 sm:space-y-3 max-h-[calc(100vh-220px)] overflow-y-auto pr-2">
                      {CHART_CATEGORIES.map(category => (
                        <Card
                          key={category.id}
                          className={`cursor-pointer transition-all ${
                            selectedCharts.includes(category.id)
                              ? 'border-primary bg-primary/5'
                              : 'hover:border-muted-foreground/50'
                          }`}
                          onClick={() => toggleChart(category.id)}
                        >
                          <CardContent className="p-3 sm:p-4">
                            <div className="flex items-start gap-2 sm:gap-3">
                              <Checkbox
                                checked={selectedCharts.includes(category.id)}
                                onCheckedChange={() => toggleChart(category.id)}
                                className="mt-0.5 sm:mt-1"
                              />
                              <div className="flex-1 min-w-0">
                                <Label className="text-xs sm:text-sm font-medium cursor-pointer">
                                  {category.label}
                                </Label>
                                <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 line-clamp-2">
                                  {category.description}
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {dashboardError && (
          <Card className="border-destructive bg-destructive/5">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
                  <svg className="w-5 h-5 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-destructive mb-1">Terjadi Kesalahan</h3>
                  <p className="text-sm text-muted-foreground">{dashboardError}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats Grid */}
        {isLoading ? (
          <StatsGridSkeleton count={4} />
        ) : (
          <div className="grid gap-3 sm:gap-4 grid-cols-2 md:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Total Pegawai"
              value={stats.total}
              icon={Users}
              variant="primary"
            />
            <StatCard
              title="Jumlah PNS"
              value={stats.pns}
              icon={UserCheck}
              variant="primary"
              description={`${stats.total > 0 ? ((stats.pns / stats.total) * 100).toFixed(1) : 0}% dari total`}
            />
            <StatCard
              title="Jumlah PPPK"
              value={stats.pppk}
              icon={UserPlus}
              variant="success"
              description={`${stats.total > 0 ? ((stats.pppk / stats.total) * 100).toFixed(1) : 0}% dari total`}
            />
            <StatCard
              title="Jumlah Non ASN"
              value={stats.nonAsn}
              icon={UserMinus}
              variant="warning"
              description={`${stats.total > 0 ? ((stats.nonAsn / stats.total) * 100).toFixed(1) : 0}% dari total`}
            />
          </div>
        )}

        {/* Charts */}
        {isLoading || isLoadingPreferences ? (
          <div className="grid gap-4 sm:gap-5 md:gap-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-2">
            <ChartSkeleton />
            <ChartSkeleton />
            <ChartSkeleton />
            <ChartSkeleton />
          </div>
        ) : selectedCharts.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12 sm:py-16 px-4">
              <Settings2 className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground mb-3 sm:mb-4" />
              <p className="text-base sm:text-lg font-medium text-muted-foreground mb-1 sm:mb-2 text-center">
                Tidak ada data yang dipilih
              </p>
              <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4 text-center max-w-md">
                Klik tombol "Pilih Data" untuk memilih kategori yang ingin ditampilkan
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:gap-5 md:gap-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-2" key={`charts-${selectedCharts.join('-')}`}>
            {selectedCharts.includes('asn_status') && (
              <AsnPieChart data={asnChartData} key="asn_status" />
            )}
            {selectedCharts.includes('rank') && (
              <ChartWrapper title="Distribusi Golongan" description="Jumlah pegawai per golongan/pangkat" data={rankData} key="rank">
                <RankBarChart data={rankData} />
              </ChartWrapper>
            )}
            {selectedCharts.includes('position_type') && (
              <ChartWrapper title="Jenis Jabatan" description="Distribusi berdasarkan jenis jabatan" data={positionTypeData} key="position_type">
                <PositionTypePieChart data={positionTypeData} />
              </ChartWrapper>
            )}
            {selectedCharts.includes('join_year') && (
              <ChartWrapper title="Tren Pegawai Bergabung" description="Jumlah pegawai bergabung per tahun" data={joinYearData} key="join_year">
                <JoinYearBarChart data={joinYearData} />
              </ChartWrapper>
            )}
            {selectedCharts.includes('department') && canViewAll && selectedDepartment === 'all' && (
              <ChartWrapper title="Distribusi Unit Kerja" description="Jumlah pegawai per unit kerja" data={departmentData} key="department">
                <DepartmentBarChart data={departmentData} />
              </ChartWrapper>
            )}
            {selectedCharts.includes('gender') && (
              <ChartWrapper title="Jenis Kelamin" description="Distribusi berdasarkan jenis kelamin" data={genderData} key="gender">
                <GenderPieChart data={genderData} />
              </ChartWrapper>
            )}
            {selectedCharts.includes('religion') && (
              <ChartWrapper title="Agama" description="Distribusi berdasarkan agama" data={religionData} key="religion">
                <ReligionPieChart data={religionData} />
              </ChartWrapper>
            )}
            {selectedCharts.includes('position_kepmen') && (
              <ChartWrapper title="Jabatan Kepmen 202/2024" description="Distribusi jabatan sesuai Kepmen" data={positionKepmenData} key="position_kepmen">
                <PositionKepmenBarChart data={positionKepmenData} />
              </ChartWrapper>
            )}
            {selectedCharts.includes('tmt_cpns') && (
              <ChartWrapper title="Tren TMT CPNS" description="Jumlah pegawai berdasarkan tahun TMT CPNS (15 tahun terakhir)" data={tmtCpnsData} key="tmt_cpns">
                <TmtYearBarChart 
                  data={tmtCpnsData} 
                  title="Tren TMT CPNS" 
                  description="Jumlah pegawai berdasarkan tahun TMT CPNS (15 tahun terakhir)"
                />
              </ChartWrapper>
            )}
            {selectedCharts.includes('tmt_pns') && (
              <ChartWrapper title="Tren TMT PNS" description="Jumlah pegawai berdasarkan tahun TMT PNS (15 tahun terakhir)" data={tmtPnsData} key="tmt_pns">
                <TmtYearBarChart 
                  data={tmtPnsData} 
                  title="Tren TMT PNS" 
                  description="Jumlah pegawai berdasarkan tahun TMT PNS (15 tahun terakhir)"
                />
              </ChartWrapper>
            )}
            {selectedCharts.includes('work_duration') && (
              <ChartWrapper title="Masa Kerja" description="Distribusi masa kerja pegawai" data={workDurationData} key="work_duration">
                <WorkDurationBarChart data={workDurationData} />
              </ChartWrapper>
            )}
            {selectedCharts.includes('grade') && (
              <ChartWrapper title="Grade Jabatan" description="Distribusi grade jabatan" data={gradeData} key="grade">
                <GradeBarChart data={gradeData} />
              </ChartWrapper>
            )}
            {selectedCharts.includes('age') && (
              <ChartWrapper title="Usia Pegawai" description="Distribusi usia pegawai" data={ageData} key="age">
                <AgeBarChart data={ageData} />
              </ChartWrapper>
            )}
            {selectedCharts.includes('retirement_year') && (
              <ChartWrapper title="Tahun Pensiun" description="Tren pegawai pensiun per tahun" data={retirementYearData} key="retirement_year">
                <RetirementYearBarChart data={retirementYearData} />
              </ChartWrapper>
            )}
            {selectedCharts.includes('education') && (
              <ChartWrapper title="Jenjang Pendidikan" description="Distribusi berdasarkan pendidikan terakhir" data={educationData} key="education">
                <EducationPieChart data={educationData} />
              </ChartWrapper>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
