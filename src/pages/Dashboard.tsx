import { useState, useEffect } from 'react';
import { Users, UserCheck, UserPlus, UserMinus, Settings2, TrendingUp } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { ChartWrapper } from '@/components/dashboard/ChartWrapper';
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
    isLoading 
  } = useDashboardData({
    department: profile?.department || null,
    isAdminPusat: canViewAll, // Use canViewAll instead of isAdminPusat
    selectedDepartment,
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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="page-header mb-0">
            <h1 className="page-title flex items-center gap-2">
              <TrendingUp className="h-7 w-7 text-primary" />
              {pageTitle}
            </h1>
            <p className="page-description">
              Dashboard eksekutif untuk monitoring data pegawai
            </p>
          </div>

          <div className="flex gap-2">
            {canViewAll && (
              <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                <SelectTrigger className="w-full sm:w-[240px]">
                  <SelectValue placeholder="Pilih Unit Kerja" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Unit Kerja</SelectItem>
                  {DEPARTMENTS.filter(d => d !== 'Pusat').map((dept) => (
                    <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {/* Chart Selector Sheet */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="default" className="gap-2">
                  <Settings2 className="h-4 w-4" />
                  Pilih Data ({selectedCharts.length})
                </Button>
              </SheetTrigger>
              <SheetContent className="overflow-y-auto">
                <SheetHeader>
                  <SheetTitle>Pilih Data untuk Ditampilkan</SheetTitle>
                  <SheetDescription>
                    Pilih kategori data yang ingin ditampilkan di dashboard
                  </SheetDescription>
                </SheetHeader>

                <div className="mt-6 space-y-4 pb-6">
                  <div className="flex gap-2 sticky top-0 bg-background z-10 pb-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={selectAllCharts}
                      className="flex-1"
                    >
                      Pilih Semua
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={clearAllCharts}
                      className="flex-1"
                    >
                      Hapus Semua
                    </Button>
                  </div>

                  <div className="space-y-3 max-h-[calc(100vh-220px)] overflow-y-auto pr-2">
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
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <Checkbox
                              checked={selectedCharts.includes(category.id)}
                              onCheckedChange={() => toggleChart(category.id)}
                              className="mt-1"
                            />
                            <div className="flex-1">
                              <Label className="text-sm font-medium cursor-pointer">
                                {category.label}
                              </Label>
                              <p className="text-xs text-muted-foreground mt-0.5">
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

        {/* Stats Grid */}
        {isLoading ? (
          <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
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
          <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
            <Skeleton className="h-80 rounded-xl" />
            <Skeleton className="h-80 rounded-xl" />
            <Skeleton className="h-80 rounded-xl" />
            <Skeleton className="h-80 rounded-xl" />
          </div>
        ) : selectedCharts.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Settings2 className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium text-muted-foreground mb-2">
                Tidak ada data yang dipilih
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                Klik tombol "Pilih Data" untuk memilih kategori yang ingin ditampilkan
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 grid-cols-1 md:grid-cols-2" key={`charts-${selectedCharts.join('-')}`}>
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
