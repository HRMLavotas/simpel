import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, Award } from 'lucide-react';
import { logger } from '@/lib/logger';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useIsMobile } from '@/hooks/use-mobile';

interface PositionGradeChartProps {
  userDepartment: string | null;
  isAdminPusat: boolean;
  selectedDepartment?: string;
}

interface GradeData {
  grade: number;
  count: number;
}

const GRADE_COLORS = [
  'hsl(217, 91%, 60%)',   // Blue
  'hsl(142, 76%, 36%)',   // Green
  'hsl(38, 92%, 50%)',    // Yellow
  'hsl(280, 65%, 60%)',   // Purple
  'hsl(0, 84%, 60%)',     // Red
  'hsl(199, 89%, 48%)',   // Cyan
  'hsl(170, 70%, 45%)',   // Teal
  'hsl(330, 65%, 55%)',   // Pink
  'hsl(45, 85%, 55%)',    // Gold
  'hsl(200, 60%, 50%)',   // Light blue
];

export function PositionGradeChart({ 
  userDepartment, 
  isAdminPusat,
  selectedDepartment = 'all'
}: PositionGradeChartProps) {
  const isMobile = useIsMobile();
  const [gradeData, setGradeData] = useState<GradeData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchGradeData();
  }, [userDepartment, isAdminPusat, selectedDepartment]);

  const fetchGradeData = async () => {
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

      // Fetch all employees with pagination
      const allEmployees: any[] = [];
      let from = 0;
      const batchSize = 1000;
      let hasMore = true;

      while (hasMore) {
        let query = supabase
          .from('employees')
          .select('id, position_name, department, is_active')
          .eq('is_active', true)
          .range(from, from + batchSize - 1);

        if (departmentFilter) {
          query = query.eq('department', departmentFilter);
        }

        const { data, error: fetchError } = await query;
        
        if (fetchError) {
          logger.error('Supabase error:', fetchError);
          throw fetchError;
        }

        if (data && data.length > 0) {
          allEmployees.push(...data);
          from += batchSize;
          hasMore = data.length === batchSize;
        } else {
          hasMore = false;
        }
      }

      // Fetch all position_references with pagination
      const allPositions: any[] = [];
      from = 0;
      hasMore = true;

      while (hasMore) {
        let query = supabase
          .from('position_references')
          .select('position_name, grade, department')
          .range(from, from + batchSize - 1);

        if (departmentFilter) {
          query = query.eq('department', departmentFilter);
        }

        const { data, error: fetchError } = await query;
        
        if (fetchError) {
          logger.error('Supabase error fetching positions:', fetchError);
          throw fetchError;
        }

        if (data && data.length > 0) {
          allPositions.push(...data);
          from += batchSize;
          hasMore = data.length === batchSize;
        } else {
          hasMore = false;
        }
      }

      // Create a map of position_name -> grade
      const positionGradeMap: Record<string, number> = {};
      allPositions.forEach((pos) => {
        if (pos.position_name && pos.grade !== null && pos.grade !== undefined) {
          positionGradeMap[pos.position_name] = pos.grade;
        }
      });

      // Count employees by grade
      const gradeCounts: Record<number, number> = {};
      
      allEmployees.forEach((employee) => {
        if (employee.position_name) {
          const grade = positionGradeMap[employee.position_name];
          if (grade !== null && grade !== undefined) {
            gradeCounts[grade] = (gradeCounts[grade] || 0) + 1;
          }
        }
      });

      // Convert to array and sort by grade
      const processed: GradeData[] = Object.entries(gradeCounts)
        .map(([grade, count]) => ({
          grade: parseInt(grade),
          count: count as number,
        }))
        .sort((a, b) => a.grade - b.grade);

      setGradeData(processed);

      logger.debug('Position grade data loaded:', {
        grades: processed.length,
        totalPositions: processed.reduce((sum, d) => sum + d.count, 0),
        employeesProcessed: allEmployees.length,
        positionsLoaded: allPositions.length,
      });
    } catch (err) {
      logger.error('Error fetching position grade data:', err);
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan saat memuat data');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="col-span-full">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
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

  if (gradeData.length === 0) {
    return (
      <Card className="col-span-full">
        <CardHeader className="pb-3 border-b">
          <CardTitle className="text-base flex items-center gap-2">
            <Award className="h-5 w-5 text-primary" />
            Distribusi Grade Jabatan
          </CardTitle>
          <CardDescription>Distribusi pegawai berdasarkan grade jabatan di peta jabatan</CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <AlertCircle className="h-12 w-12 mb-3 opacity-50" />
            <p className="text-sm">Tidak ada data grade jabatan</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalCount = gradeData.reduce((sum, d) => sum + d.count, 0);

  return (
    <Card className="col-span-full animate-fade-in hover:shadow-md transition-all duration-300">
      <CardHeader className="pb-3 border-b">
        <CardTitle className="text-base flex items-center gap-2">
          <Award className="h-5 w-5 text-primary" />
          Distribusi Grade Jabatan
        </CardTitle>
        <CardDescription>
          Distribusi pegawai berdasarkan grade jabatan di peta jabatan (Grade 1-25)
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            Total: <span className="font-semibold text-foreground">{totalCount.toLocaleString('id-ID')}</span> pegawai
            {' • '}
            <span className="font-semibold text-foreground">{gradeData.length}</span> grade berbeda
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart 
              data={gradeData}
              margin={{ 
                left: isMobile ? 0 : 10, 
                right: isMobile ? 0 : 10,
                top: 10,
                bottom: 10
              }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis 
                dataKey="grade" 
                tick={{ fontSize: isMobile ? 10 : 12 }}
                axisLine={{ stroke: 'hsl(var(--border))' }}
                label={{ value: 'Grade', position: 'insideBottom', offset: -5, fontSize: 12 }}
              />
              <YAxis 
                tick={{ fontSize: isMobile ? 10 : 12 }}
                axisLine={{ stroke: 'hsl(var(--border))' }}
                width={isMobile ? 30 : 40}
                label={{ value: 'Jumlah Pegawai', angle: -90, position: 'insideLeft', fontSize: 12 }}
              />
              <Tooltip 
                formatter={(value: number) => [`${value} pegawai`, 'Jumlah']}
                labelFormatter={(label) => `Grade ${label}`}
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
              />
              <Bar 
                dataKey="count" 
                radius={[4, 4, 0, 0]}
                name="Jumlah Pegawai"
              >
                {gradeData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={GRADE_COLORS[index % GRADE_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
