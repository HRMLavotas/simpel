import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useState } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';

interface GradeData {
  grade: string;
  count: number;
}

interface AgeData {
  category: string;
  count: number;
  order: number;
}

interface RetirementYearData {
  year: string;
  count: number;
}

interface EducationData {
  level: string;
  count: number;
  details?: { major: string; count: number }[];
}

interface GradeBarChartProps {
  data: GradeData[];
}

interface AgeBarChartProps {
  data: AgeData[];
}

interface RetirementYearBarChartProps {
  data: RetirementYearData[];
}

interface EducationPieChartProps {
  data: EducationData[];
}

export function GradeBarChart({ data }: GradeBarChartProps) {
  const isMobile = useIsMobile();
  
  // Sort by grade number
  const sortedData = [...data].sort((a, b) => {
    const gradeA = parseInt(a.grade.replace('Grade ', ''));
    const gradeB = parseInt(b.grade.replace('Grade ', ''));
    return gradeA - gradeB;
  });
  
  return (
    <Card className="animate-fade-in flex flex-col h-full hover:shadow-md transition-all duration-300">
      <CardHeader className="pb-3 border-b">
        <CardTitle className="text-base">Distribusi Grade Jabatan</CardTitle>
        <CardDescription>Distribusi pegawai berdasarkan grade jabatan</CardDescription>
      </CardHeader>
      <CardContent className="pt-4">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart 
            data={sortedData}
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
            />
            <YAxis 
              tick={{ fontSize: isMobile ? 10 : 12 }}
              axisLine={{ stroke: 'hsl(var(--border))' }}
              width={isMobile ? 30 : 40}
            />
            <Tooltip 
              formatter={(value: number) => [`${value} pegawai`, 'Jumlah']}
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                fontSize: '12px',
              }}
            />
            <Bar 
              dataKey="count" 
              fill="hsl(280, 65%, 60%)" 
              radius={[4, 4, 0, 0]}
              name="Jumlah Pegawai"
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export function AgeBarChart({ data }: AgeBarChartProps) {
  const isMobile = useIsMobile();
  
  // Sort by order to maintain logical sequence
  const sortedData = [...data].sort((a, b) => a.order - b.order);
  
  const AGE_COLORS = [
    'hsl(142, 76%, 36%)',  // < 25 - green
    'hsl(199, 89%, 48%)',  // 25-35 - blue
    'hsl(217, 91%, 60%)',  // 35-45 - primary blue
    'hsl(38, 92%, 50%)',   // 45-55 - yellow
    'hsl(0, 84%, 60%)',    // > 55 - red
  ];
  
  return (
    <Card className="animate-fade-in flex flex-col h-full hover:shadow-md transition-all duration-300">
      <CardHeader className="pb-3 border-b">
        <CardTitle className="text-base">Distribusi Usia Pegawai</CardTitle>
        <CardDescription>Distribusi pegawai berdasarkan kategori usia</CardDescription>
      </CardHeader>
      <CardContent className="pt-4">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart 
            data={sortedData}
            margin={{ 
              left: isMobile ? 0 : 10, 
              right: isMobile ? 0 : 10,
              top: 10,
              bottom: 10
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis 
              dataKey="category" 
              tick={{ fontSize: isMobile ? 10 : 12 }}
              axisLine={{ stroke: 'hsl(var(--border))' }}
            />
            <YAxis 
              tick={{ fontSize: isMobile ? 10 : 12 }}
              axisLine={{ stroke: 'hsl(var(--border))' }}
              width={isMobile ? 30 : 40}
            />
            <Tooltip 
              formatter={(value: number) => [`${value} pegawai`, 'Jumlah']}
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
              {sortedData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={AGE_COLORS[index % AGE_COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export function RetirementYearBarChart({ data }: RetirementYearBarChartProps) {
  const isMobile = useIsMobile();
  
  return (
    <Card className="animate-fade-in flex flex-col h-full hover:shadow-md transition-all duration-300">
      <CardHeader className="pb-3 border-b">
        <CardTitle className="text-base">Tren Tahun Pensiun</CardTitle>
        <CardDescription>Jumlah pegawai yang akan pensiun per tahun (10 tahun ke depan)</CardDescription>
      </CardHeader>
      <CardContent className="pt-4">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart 
            data={data}
            margin={{ 
              left: isMobile ? 0 : 10, 
              right: isMobile ? 0 : 10,
              top: 10,
              bottom: 10
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis 
              dataKey="year" 
              tick={{ fontSize: isMobile ? 10 : 12 }}
              axisLine={{ stroke: 'hsl(var(--border))' }}
            />
            <YAxis 
              tick={{ fontSize: isMobile ? 10 : 12 }}
              axisLine={{ stroke: 'hsl(var(--border))' }}
              width={isMobile ? 30 : 40}
            />
            <Tooltip 
              formatter={(value: number) => [`${value} pegawai`, 'Jumlah']}
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                fontSize: '12px',
              }}
            />
            <Bar 
              dataKey="count" 
              fill="hsl(0, 84%, 60%)" 
              radius={[4, 4, 0, 0]}
              name="Jumlah Pegawai"
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export function EducationPieChart({ data }: EducationPieChartProps) {
  const isMobile = useIsMobile();
  
  // Define education level order for sorting
  const educationOrder: Record<string, number> = {
    'SD': 1,
    'SMP': 2,
    'SMA': 3,
    'D1': 4,
    'D2': 5,
    'D3': 6,
    'D4': 7,
    'S1': 8,
    'S2': 9,
    'S3': 10,
  };
  
  // Sort by education level
  const sortedData = [...data].sort((a, b) => {
    const orderA = educationOrder[a.level] || 999;
    const orderB = educationOrder[b.level] || 999;
    return orderA - orderB;
  });
  
  const totalCount = sortedData.reduce((sum, item) => sum + item.count, 0);
  
  // For level view, use chart if ≤8 categories
  const useLevelChart = sortedData.length <= 8;
  
  
  const EDUCATION_COLORS = [
    'hsl(217, 91%, 60%)',   // primary blue
    'hsl(142, 76%, 36%)',   // green
    'hsl(38, 92%, 50%)',    // yellow
    'hsl(280, 65%, 60%)',   // purple
    'hsl(0, 84%, 60%)',     // red
    'hsl(199, 89%, 48%)',   // cyan
    'hsl(170, 70%, 45%)',   // teal
    'hsl(330, 65%, 55%)',   // pink
    'hsl(45, 85%, 55%)',    // gold
    'hsl(200, 60%, 50%)',   // light blue
  ];
  
  return (
    <Card className="animate-fade-in flex flex-col h-full hover:shadow-md transition-all duration-300">
      <CardHeader className="pb-3 border-b">
        <CardTitle className="text-base">Distribusi Jenjang Pendidikan</CardTitle>
        <CardDescription>Distribusi pegawai berdasarkan pendidikan terakhir</CardDescription>
      </CardHeader>
      <CardContent className="pt-4">
        <div>
            {useLevelChart ? (
              // Pie chart for few categories
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={sortedData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="count"
                    nameKey="level"
                  >
                    {sortedData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={EDUCATION_COLORS[index % EDUCATION_COLORS.length]}
                        strokeWidth={0}
                      />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number, name: string) => [
                      `${value} pegawai`, 
                      name
                    ]}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                  <Legend 
                    verticalAlign="bottom"
                    height={36}
                    wrapperStyle={{ fontSize: isMobile ? '11px' : '12px' }}
                    formatter={(value: string) => {
                      const item = sortedData.find(d => d.level === value);
                      return `${value} (${item?.count || 0})`;
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              // Table view for many categories
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  Total: <span className="font-semibold text-foreground">{totalCount}</span> pegawai
                </div>
                <div className="rounded-lg border shadow-sm overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/80 backdrop-blur-sm">
                      <tr className="border-b">
                        <th className="px-4 py-3 text-left font-semibold text-muted-foreground">
                          Jenjang
                        </th>
                        <th className="px-4 py-3 text-right font-semibold text-muted-foreground">
                          Jumlah
                        </th>
                        <th className="px-4 py-3 text-right font-semibold text-muted-foreground">
                          Persentase
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedData.map((item, i) => (
                        <tr 
                          key={i} 
                          className="border-b last:border-0 hover:bg-muted/50 transition-colors"
                        >
                          <td className="px-4 py-3 font-medium">
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-3 h-3 rounded-full" 
                                style={{ backgroundColor: EDUCATION_COLORS[i % EDUCATION_COLORS.length] }}
                              />
                              {item.level}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right font-medium">
                            {item.count}
                          </td>
                          <td className="px-4 py-3 text-right text-muted-foreground">
                            {((item.count / totalCount) * 100).toFixed(1)}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
        </div>
      </CardContent>
    </Card>
  );
}
