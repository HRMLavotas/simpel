import { useState, useEffect } from 'react';
import { Users, UserCheck, UserPlus, UserMinus, Settings2, TrendingUp } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { StatCard } from '@/components/dashboard/StatCard';
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
  const { profile, isAdminPusat } = useAuth();
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
    isAdminPusat,
    selectedDepartment,
  });

  // Load user preferences on mount
  useEffect(() => {
    const loadPreferences = async () => {
      if (!profile?.id) return;
      
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('dashboard_preferences')
          .eq('id', profile.id)
          .single();

        if (error) throw error;

        if (data?.dashboard_preferences && Array.isArray(data.dashboard_preferences)) {
          setSelectedCharts(data.dashboard_preferences);
        }
      } catch (error) {
        console.error('Error loading dashboard preferences:', error);
      } finally {
        setIsLoadingPreferences(false);
      }
    };

    loadPreferences();
  }, [profile?.id]);

  // Save preferences to database
  const savePreferences = async (charts: string[]) => {
    if (!profile?.id) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ dashboard_preferences: charts })
        .eq('id', profile.id);

      if (error) throw error;

      // Optional: Show success toast (commented out to avoid too many notifications)
      // toast({
      //   title: 'Preferensi disimpan',
      //   description: 'Pilihan chart Anda telah disimpan',
      // });
    } catch (error) {
      console.error('Error saving dashboard preferences:', error);
      toast({
        title: 'Gagal menyimpan preferensi',
        description: 'Terjadi kesalahan saat menyimpan pilihan chart',
        variant: 'destructive',
      });
    }
  };

  const toggleChart = (chartId: string) => {
    setSelectedCharts(prev => {
      const newCharts = prev.includes(chartId)
        ? prev.filter(id => id !== chartId)
        : [...prev, chartId];
      
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

  const pageTitle = isAdminPusat 
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
            {isAdminPusat && (
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
          <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
            {selectedCharts.includes('asn_status') && (
              <AsnPieChart data={asnChartData} />
            )}
            {selectedCharts.includes('rank') && (
              <RankBarChart data={rankData} />
            )}
            {selectedCharts.includes('position_type') && positionTypeData.length > 0 && (
              <PositionTypePieChart data={positionTypeData} />
            )}
            {selectedCharts.includes('join_year') && joinYearData.length > 0 && (
              <JoinYearBarChart data={joinYearData} />
            )}
            {selectedCharts.includes('department') && isAdminPusat && selectedDepartment === 'all' && departmentData.length > 0 && (
              <DepartmentBarChart data={departmentData} />
            )}
            {selectedCharts.includes('gender') && genderData.length > 0 && (
              <GenderPieChart data={genderData} />
            )}
            {selectedCharts.includes('religion') && religionData.length > 0 && (
              <ReligionPieChart data={religionData} />
            )}
            {selectedCharts.includes('position_kepmen') && positionKepmenData.length > 0 && (
              <PositionKepmenBarChart data={positionKepmenData} />
            )}
            {selectedCharts.includes('tmt_cpns') && tmtCpnsData.length > 0 && (
              <TmtYearBarChart 
                data={tmtCpnsData} 
                title="Tren TMT CPNS" 
                description="Jumlah pegawai berdasarkan tahun TMT CPNS (15 tahun terakhir)"
              />
            )}
            {selectedCharts.includes('tmt_pns') && tmtPnsData.length > 0 && (
              <TmtYearBarChart 
                data={tmtPnsData} 
                title="Tren TMT PNS" 
                description="Jumlah pegawai berdasarkan tahun TMT PNS (15 tahun terakhir)"
              />
            )}
            {selectedCharts.includes('work_duration') && workDurationData.length > 0 && (
              <WorkDurationBarChart data={workDurationData} />
            )}
            {selectedCharts.includes('grade') && gradeData.length > 0 && (
              <GradeBarChart data={gradeData} />
            )}
            {selectedCharts.includes('age') && ageData.length > 0 && (
              <AgeBarChart data={ageData} />
            )}
            {selectedCharts.includes('retirement_year') && retirementYearData.length > 0 && (
              <RetirementYearBarChart data={retirementYearData} />
            )}
            {selectedCharts.includes('education') && educationData.length > 0 && (
              <EducationPieChart data={educationData} />
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
