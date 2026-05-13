import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, GraduationCap, BookOpen } from 'lucide-react';
import { logger } from '@/lib/logger';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface EducationDistributionChartProps {
  userDepartment: string | null;
  isAdminPusat: boolean;
  selectedDepartment?: string;
}

interface EducationLevelData {
  level: string;
  count: number;
  percentage: number;
}

interface EducationMajorData {
  major: string;
  count: number;
  percentage: number;
}

const EDUCATION_ORDER: Record<string, number> = {
  'SD': 1,
  'SMP': 2,
  'SLTP': 2,      // SLTP = Sekolah Lanjutan Tingkat Pertama (setara SMP)
  'SMA': 3,
  'SMK': 3,
  'SLTA': 3,      // SLTA = Sekolah Lanjutan Tingkat Atas (setara SMA/SMK)
  'D1': 4,
  'D2': 5,
  'D3': 6,
  'D4': 7,
  'S1': 8,
  'S2': 9,
  'S3': 10,
};

// Normalize education level to standard Indonesian education levels
const normalizeEducationLevel = (level: string): string => {
  const normalized = level.trim().toUpperCase();
  
  // SD (Sekolah Dasar) - check if contains SD or SR
  if (normalized.includes('SD') || normalized.includes('SR') || normalized.includes('SEKOLAH DASAR')) {
    return 'SD';
  }
  
  // SMP (Sekolah Menengah Pertama) - check if contains SMP or SLTP
  if (normalized.includes('SMP') || normalized.includes('SLTP') || normalized.includes('SEKOLAH MENENGAH PERTAMA')) {
    return 'SMP';
  }
  
  // SMA (Sekolah Menengah Atas) - check if contains SMA, SMK, or SLTA
  // This includes: "SMA", "SMK", "SLTA", "SMA/SMK", "SLTA/SMA Sederajat", "SMK Teknik Mesin", etc.
  if (normalized.includes('SMA') || normalized.includes('SMK') || normalized.includes('SLTA') ||
      normalized.includes('SEKOLAH MENENGAH ATAS') || normalized.includes('SEKOLAH MENENGAH KEJURUAN')) {
    return 'SMA';
  }
  
  // Diploma levels - check for exact match first, then contains
  // Handle: D1, D-1, DI, DI - Akuntansi, DIII, DIII - Teknik, Diploma 1, Diploma I, D1/Sederajat, etc.
  if (normalized === 'D1' || normalized === 'D-1' || normalized === 'DI' ||
      normalized.match(/^D1[\s\/\-]/i) || normalized.match(/^D-1[\s\/\-]/i) || normalized.match(/^DI[\s\/\-]/i) ||
      normalized.includes('DIPLOMA 1') || normalized.includes('DIPLOMA I')) {
    return 'D1';
  }
  if (normalized === 'D2' || normalized === 'D-2' || normalized === 'DII' ||
      normalized.match(/^D2[\s\/\-]/i) || normalized.match(/^D-2[\s\/\-]/i) || normalized.match(/^DII[\s\/\-]/i) ||
      normalized.includes('DIPLOMA 2') || normalized.includes('DIPLOMA II')) {
    return 'D2';
  }
  if (normalized === 'D3' || normalized === 'D-3' || normalized === 'DIII' ||
      normalized.match(/^D3[\s\/\-]/i) || normalized.match(/^D-3[\s\/\-]/i) || normalized.match(/^DIII[\s\/\-]/i) ||
      normalized.includes('DIPLOMA 3') || normalized.includes('DIPLOMA III')) {
    return 'D3';
  }
  if (normalized === 'D4' || normalized === 'D-4' || normalized === 'DIV' ||
      normalized.match(/^D4[\s\/\-]/i) || normalized.match(/^D-4[\s\/\-]/i) || normalized.match(/^DIV[\s\/\-]/i) ||
      normalized.includes('DIPLOMA 4') || normalized.includes('DIPLOMA IV')) {
    return 'D4';
  }
  
  // Sarjana (S1) - check for exact match first, then contains
  if (normalized === 'S1' || normalized === 'S-1' || 
      normalized.match(/^S1[\s\/]/i) || normalized.match(/^S-1[\s\/]/i) ||
      normalized.includes('SARJANA') || normalized.includes('STRATA 1') || normalized.includes('STRATA I')) {
    return 'S1';
  }
  
  // Magister (S2) - check for exact match first, then contains
  if (normalized === 'S2' || normalized === 'S-2' || 
      normalized.match(/^S2[\s\/]/i) || normalized.match(/^S-2[\s\/]/i) ||
      normalized.includes('MAGISTER') || normalized.includes('STRATA 2') || normalized.includes('STRATA II')) {
    return 'S2';
  }
  
  // Doktor (S3) - check for exact match first, then contains
  if (normalized === 'S3' || normalized === 'S-3' || 
      normalized.match(/^S3[\s\/]/i) || normalized.match(/^S-3[\s\/]/i) ||
      normalized.includes('DOKTOR') || normalized.includes('STRATA 3') || normalized.includes('STRATA III')) {
    return 'S3';
  }
  
  return level;
};

export function EducationDistributionChart({ 
  userDepartment, 
  isAdminPusat,
  selectedDepartment = 'all'
}: EducationDistributionChartProps) {
  const [activeTab, setActiveTab] = useState<'asn' | 'non-asn'>('asn');
  const [viewMode, setViewMode] = useState<'level' | 'major'>('level');
  const [asnLevelData, setAsnLevelData] = useState<EducationLevelData[]>([]);
  const [asnMajorData, setAsnMajorData] = useState<EducationMajorData[]>([]);
  const [nonAsnLevelData, setNonAsnLevelData] = useState<EducationLevelData[]>([]);
  const [nonAsnMajorData, setNonAsnMajorData] = useState<EducationMajorData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchEducationData();
  }, [userDepartment, isAdminPusat, selectedDepartment]);

  const fetchEducationData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Determine department filter
      let departmentFilter: string | null = null;
      if (!isAdminPusat && userDepartment) {
        departmentFilter = userDepartment;
      } else if (isAdminPusat && selectedDepartment && selectedDepartment !== 'all') {
        departmentFilter = selectedDepartment;
      }

      // Helper function to fetch all data with pagination
      const fetchAllData = async (buildQuery: (from: number, to: number) => any) => {
        const allData: any[] = [];
        let offset = 0;
        const batchSize = 1000;
        const maxRecords = 50000; // Safety limit

        while (true) {
          const { data, error } = await buildQuery(offset, offset + batchSize - 1);
          if (error) throw error;
          if (!data || data.length === 0) break;
          
          allData.push(...data);
          
          if (allData.length >= maxRecords) {
            logger.warn(`Reached maximum record limit (${maxRecords}). Some data may not be loaded.`);
            break;
          }
          
          if (data.length < batchSize) break;
          offset += batchSize;
        }
        
        return allData;
      };

      // Fetch ASN education data (by level) with pagination
      const asnLevelRaw = await fetchAllData((from, to) => {
        let query = supabase
          .from('education_history')
          .select(`
            level,
            employee:employees!inner(
              id,
              is_active,
              department,
              asn_status
            )
          `)
          .eq('employee.is_active', true)
          .or('asn_status.is.null,asn_status.neq.Non ASN', { foreignTable: 'employee' })
          .range(from, to);

        if (departmentFilter) {
          query = query.eq('employee.department', departmentFilter);
        }

        return query;
      });

      // Fetch ASN education data (by major) with pagination
      const asnMajorRaw = await fetchAllData((from, to) => {
        let query = supabase
          .from('education_history')
          .select(`
            major,
            employee:employees!inner(
              id,
              is_active,
              department,
              asn_status
            )
          `)
          .eq('employee.is_active', true)
          .not('major', 'is', null)
          .neq('major', '')
          .or('asn_status.is.null,asn_status.neq.Non ASN', { foreignTable: 'employee' })
          .range(from, to);

        if (departmentFilter) {
          query = query.eq('employee.department', departmentFilter);
        }

        return query;
      });

      // Fetch Non-ASN education data (by level) with pagination
      const nonAsnLevelRaw = await fetchAllData((from, to) => {
        let query = supabase
          .from('education_history')
          .select(`
            level,
            employee:employees!inner(
              id,
              is_active,
              department,
              asn_status
            )
          `)
          .eq('employee.is_active', true)
          .eq('employee.asn_status', 'Non ASN')
          .range(from, to);

        if (departmentFilter) {
          query = query.eq('employee.department', departmentFilter);
        }

        return query;
      });

      // Fetch Non-ASN education data (by major) with pagination
      const nonAsnMajorRaw = await fetchAllData((from, to) => {
        let query = supabase
          .from('education_history')
          .select(`
            major,
            employee:employees!inner(
              id,
              is_active,
              department,
              asn_status
            )
          `)
          .eq('employee.is_active', true)
          .eq('employee.asn_status', 'Non ASN')
          .not('major', 'is', null)
          .neq('major', '')
          .range(from, to);

        if (departmentFilter) {
          query = query.eq('employee.department', departmentFilter);
        }

        return query;
      });

      // Process ASN level data
      const asnLevelCounts: Record<string, number> = {};
      asnLevelRaw?.forEach((item: any) => {
        if (item.level) {
          const normalizedLevel = normalizeEducationLevel(item.level);
          asnLevelCounts[normalizedLevel] = (asnLevelCounts[normalizedLevel] || 0) + 1;
        }
      });

      const asnLevelTotal = Object.values(asnLevelCounts).reduce((sum, count) => sum + count, 0);
      const asnLevelProcessed = Object.entries(asnLevelCounts)
        .map(([level, count]) => ({
          level,
          count,
          percentage: asnLevelTotal > 0 ? (count / asnLevelTotal) * 100 : 0,
        }))
        .sort((a, b) => (EDUCATION_ORDER[a.level] || 999) - (EDUCATION_ORDER[b.level] || 999));

      setAsnLevelData(asnLevelProcessed);

      // Process ASN major data (top 10)
      const asnMajorCounts: Record<string, number> = {};
      asnMajorRaw?.forEach((item: any) => {
        if (item.major) {
          asnMajorCounts[item.major] = (asnMajorCounts[item.major] || 0) + 1;
        }
      });

      const asnMajorTotal = Object.values(asnMajorCounts).reduce((sum, count) => sum + count, 0);
      const asnMajorProcessed = Object.entries(asnMajorCounts)
        .map(([major, count]) => ({
          major,
          count,
          percentage: asnMajorTotal > 0 ? (count / asnMajorTotal) * 100 : 0,
        }))
        .sort((a, b) => b.count - a.count); // Show all majors, sorted by count

      setAsnMajorData(asnMajorProcessed);

      // Process Non-ASN level data
      const nonAsnLevelCounts: Record<string, number> = {};
      nonAsnLevelRaw?.forEach((item: any) => {
        if (item.level) {
          const normalizedLevel = normalizeEducationLevel(item.level);
          nonAsnLevelCounts[normalizedLevel] = (nonAsnLevelCounts[normalizedLevel] || 0) + 1;
        }
      });

      const nonAsnLevelTotal = Object.values(nonAsnLevelCounts).reduce((sum, count) => sum + count, 0);
      const nonAsnLevelProcessed = Object.entries(nonAsnLevelCounts)
        .map(([level, count]) => ({
          level,
          count,
          percentage: nonAsnLevelTotal > 0 ? (count / nonAsnLevelTotal) * 100 : 0,
        }))
        .sort((a, b) => (EDUCATION_ORDER[a.level] || 999) - (EDUCATION_ORDER[b.level] || 999));

      setNonAsnLevelData(nonAsnLevelProcessed);

      // Process Non-ASN major data (top 10)
      const nonAsnMajorCounts: Record<string, number> = {};
      nonAsnMajorRaw?.forEach((item: any) => {
        if (item.major) {
          nonAsnMajorCounts[item.major] = (nonAsnMajorCounts[item.major] || 0) + 1;
        }
      });

      const nonAsnMajorTotal = Object.values(nonAsnMajorCounts).reduce((sum, count) => sum + count, 0);
      const nonAsnMajorProcessed = Object.entries(nonAsnMajorCounts)
        .map(([major, count]) => ({
          major,
          count,
          percentage: nonAsnMajorTotal > 0 ? (count / nonAsnMajorTotal) * 100 : 0,
        }))
        .sort((a, b) => b.count - a.count); // Show all majors, sorted by count

      setNonAsnMajorData(nonAsnMajorProcessed);

      logger.debug('Education data loaded:', {
        asnLevel: asnLevelProcessed.length,
        asnLevelTotal,
        asnMajor: asnMajorProcessed.length,
        asnMajorTotal,
        nonAsnLevel: nonAsnLevelProcessed.length,
        nonAsnLevelTotal,
        nonAsnMajor: nonAsnMajorProcessed.length,
        nonAsnMajorTotal,
      });
    } catch (err) {
      logger.error('Error fetching education data:', err);
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan saat memuat data');
    } finally {
      setIsLoading(false);
    }
  };

  const renderLevelChart = (data: EducationLevelData[]) => {
    if (data.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <AlertCircle className="h-12 w-12 mb-3 opacity-50" />
          <p className="text-sm">Tidak ada data pendidikan</p>
        </div>
      );
    }

    // Always use bar chart (no pie chart)
    return (
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={data} layout="vertical" margin={{ left: 60, right: 20 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" />
          <YAxis 
            dataKey="level" 
            type="category" 
            width={50}
            reversed={true}
          />
          <Tooltip formatter={(value: number) => value.toLocaleString('id-ID')} />
          <Bar dataKey="count" fill="hsl(217, 91%, 60%)" />
        </BarChart>
      </ResponsiveContainer>
    );
  };

  const renderMajorChart = (data: EducationMajorData[]) => {
    if (data.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <AlertCircle className="h-12 w-12 mb-3 opacity-50" />
          <p className="text-sm">Tidak ada data jurusan</p>
        </div>
      );
    }

    const totalCount = data.reduce((sum, item) => sum + item.count, 0);

    return (
      <div className="space-y-4">
        <div className="text-sm text-muted-foreground">
          Total: <span className="font-semibold text-foreground">{totalCount.toLocaleString('id-ID')}</span> pegawai
          {' • '}
          <span className="font-semibold text-foreground">{data.length}</span> jurusan berbeda
        </div>
        <div className="rounded-lg border shadow-sm overflow-hidden">
          <div className="max-h-[500px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/80 backdrop-blur-sm sticky top-0 z-10">
                <tr className="border-b">
                  <th className="px-4 py-3 text-left font-semibold text-muted-foreground w-12">
                    No
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-muted-foreground">
                    Jurusan
                  </th>
                  <th className="px-4 py-3 text-right font-semibold text-muted-foreground w-24">
                    Jumlah
                  </th>
                  <th className="px-4 py-3 text-right font-semibold text-muted-foreground w-24">
                    Persentase
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.map((item, i) => (
                  <tr 
                    key={i} 
                    className="border-b last:border-0 hover:bg-muted/50 transition-colors"
                  >
                    <td className="px-4 py-3 text-muted-foreground">
                      {i + 1}
                    </td>
                    <td className="px-4 py-3 font-medium">
                      {item.major}
                    </td>
                    <td className="px-4 py-3 text-right font-medium">
                      {item.count.toLocaleString('id-ID')}
                    </td>
                    <td className="px-4 py-3 text-right text-muted-foreground">
                      {item.percentage.toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <Card className="col-span-full">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[400px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="col-span-full border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Error
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{error}</p>
        </CardContent>
      </Card>
    );
  }

  const currentLevelData = activeTab === 'asn' ? asnLevelData : nonAsnLevelData;
  const currentMajorData = activeTab === 'asn' ? asnMajorData : nonAsnMajorData;

  return (
    <Card className="col-span-full animate-fade-in hover:shadow-md transition-all duration-300">
      <CardHeader className="pb-3 border-b">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-primary" />
              Distribusi Pendidikan
            </CardTitle>
            <CardDescription>
              Distribusi pegawai berdasarkan jenjang pendidikan dan jurusan
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'asn' | 'non-asn')}>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
            <TabsList>
              <TabsTrigger value="asn" className="text-xs sm:text-sm">
                ASN ({asnLevelData.reduce((sum, d) => sum + d.count, 0)})
              </TabsTrigger>
              <TabsTrigger value="non-asn" className="text-xs sm:text-sm">
                Non-ASN ({nonAsnLevelData.reduce((sum, d) => sum + d.count, 0)})
              </TabsTrigger>
            </TabsList>

            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('level')}
                className={`px-3 py-1.5 text-xs sm:text-sm rounded-md transition-colors ${
                  viewMode === 'level'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                <GraduationCap className="h-4 w-4 inline mr-1" />
                Jenjang
              </button>
              <button
                onClick={() => setViewMode('major')}
                className={`px-3 py-1.5 text-xs sm:text-sm rounded-md transition-colors ${
                  viewMode === 'major'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                <BookOpen className="h-4 w-4 inline mr-1" />
                Jurusan
              </button>
            </div>
          </div>

          <TabsContent value="asn" className="mt-0">
            {viewMode === 'level' ? renderLevelChart(currentLevelData) : renderMajorChart(currentMajorData)}
          </TabsContent>

          <TabsContent value="non-asn" className="mt-0">
            {viewMode === 'level' ? renderLevelChart(currentLevelData) : renderMajorChart(currentMajorData)}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
