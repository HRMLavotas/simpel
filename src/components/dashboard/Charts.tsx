import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useIsMobile } from '@/hooks/use-mobile';

interface AsnData {
  name: string;
  value: number;
  color: string;
}

interface RankData {
  rank: string;
  count: number;
  shortRank?: string;
}

interface DepartmentData {
  department: string;
  count: number;
}

interface PositionTypeData {
  type: string;
  count: number;
}

interface JoinYearData {
  year: string;
  count: number;
}

interface GenderData {
  gender: string;
  count: number;
}

interface ReligionData {
  religion: string;
  count: number;
}

interface PositionKepmenData {
  position: string;
  count: number;
}

interface TmtYearData {
  year: string;
  count: number;
}

interface WorkDurationData {
  category: string;
  count: number;
  order: number;
}

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

interface AsnPieChartProps {
  data: AsnData[];
}

interface RankBarChartProps {
  data: RankData[];
}

interface DepartmentBarChartProps {
  data: DepartmentData[];
}

interface PositionTypePieChartProps {
  data: PositionTypeData[];
}

interface JoinYearBarChartProps {
  data: JoinYearData[];
}

interface GenderPieChartProps {
  data: GenderData[];
}

interface ReligionPieChartProps {
  data: ReligionData[];
}

interface PositionKepmenBarChartProps {
  data: PositionKepmenData[];
}

interface TmtYearBarChartProps {
  data: TmtYearData[];
  title: string;
  description: string;
}

interface WorkDurationBarChartProps {
  data: WorkDurationData[];
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

const COLORS = {
  PNS: 'hsl(217, 91%, 60%)',
  PPPK: 'hsl(142, 76%, 36%)',
  'Non ASN': 'hsl(38, 92%, 50%)',
};

const POSITION_COLORS = [
  'hsl(217, 91%, 60%)',
  'hsl(142, 76%, 36%)',
  'hsl(38, 92%, 50%)',
  'hsl(280, 70%, 50%)',
  'hsl(350, 80%, 55%)',
];

// Helper to extract short rank (e.g., "III/b" from "Penata Muda Tk I (III/b)")
function extractShortRank(rank: string): string {
  const match = rank.match(/\(([^)]+)\)/);
  if (match) return match[1];
  // For PPPK ranks like "PPPK Golongan IX"
  if (rank.includes('PPPK')) {
    return rank.replace('PPPK Golongan ', 'Gol ');
  }
  return rank.length > 8 ? rank.substring(0, 8) + '...' : rank;
}

export function AsnPieChart({ data }: AsnPieChartProps) {
  const isMobile = useIsMobile();
  
  return (
    <Card className="animate-fade-in flex flex-col h-full hover:shadow-md transition-all duration-300">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Distribusi Status ASN</CardTitle>
        <CardDescription>Persentase pegawai berdasarkan status kepegawaian</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col justify-center">
        <ResponsiveContainer width="100%" height={isMobile ? 240 : 280}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={isMobile ? 40 : 60}
              outerRadius={isMobile ? 70 : 100}
              paddingAngle={3}
              dataKey="value"
              label={isMobile ? undefined : ({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              labelLine={!isMobile}
            >
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.color}
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
              wrapperStyle={{ fontSize: isMobile ? '11px' : '12px' }}
              formatter={(value: string) => {
                const item = data.find(d => d.name === value);
                return `${value} (${item?.value || 0})`;
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export function RankBarChart({ data }: RankBarChartProps) {
  const isMobile = useIsMobile();
  
  // Process data to add short rank labels
  const processedData = data.map(item => ({
    ...item,
    shortRank: extractShortRank(item.rank),
  }));

  return (
    <Card className="animate-fade-in flex flex-col h-full hover:shadow-md transition-all duration-300">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Distribusi per Golongan</CardTitle>
        <CardDescription>Top 10 golongan dengan jumlah pegawai terbanyak</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col justify-center">
        <ResponsiveContainer width="100%" height={isMobile ? 300 : 320}>
          <BarChart 
            data={processedData} 
            layout="vertical" 
            margin={{ 
              left: isMobile ? 10 : 20, 
              right: isMobile ? 10 : 20,
              top: 10,
              bottom: 10
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={true} vertical={false} />
            <XAxis 
              type="number" 
              tick={{ fontSize: isMobile ? 10 : 12 }}
              axisLine={{ stroke: 'hsl(var(--border))' }}
            />
            <YAxis 
              type="category" 
              dataKey="shortRank" 
              width={isMobile ? 55 : 70} 
              tick={{ fontSize: isMobile ? 10 : 12 }}
              axisLine={{ stroke: 'hsl(var(--border))' }}
            />
            <Tooltip 
              formatter={(value: number) => [`${value} pegawai`, 'Jumlah']}
              labelFormatter={(label, payload) => {
                if (payload && payload[0]) {
                  return payload[0].payload.rank;
                }
                return label;
              }}
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                fontSize: '12px',
              }}
            />
            <Bar 
              dataKey="count" 
              fill="hsl(var(--primary))" 
              radius={[0, 4, 4, 0]}
              name="Jumlah"
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export function DepartmentBarChart({ data }: DepartmentBarChartProps) {
  const isMobile = useIsMobile();
  
  // Sort by count descending and take top 10
  const sortedData = [...data]
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)
    .map(item => ({
      ...item,
      shortDept: item.department.length > (isMobile ? 12 : 20) 
        ? item.department.substring(0, isMobile ? 12 : 20) + '...' 
        : item.department,
    }));

  return (
    <Card className="animate-fade-in flex flex-col h-full hover:shadow-md transition-all duration-300">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Distribusi per Unit Kerja</CardTitle>
        <CardDescription>Top 10 unit kerja dengan jumlah pegawai terbanyak</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col justify-center">
        <ResponsiveContainer width="100%" height={isMobile ? 350 : 380}>
          <BarChart 
            data={sortedData} 
            layout="vertical" 
            margin={{ 
              left: isMobile ? 10 : 20, 
              right: isMobile ? 10 : 20,
              top: 10,
              bottom: 10
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={true} vertical={false} />
            <XAxis 
              type="number"
              tick={{ fontSize: isMobile ? 10 : 12 }}
              axisLine={{ stroke: 'hsl(var(--border))' }}
            />
            <YAxis 
              type="category" 
              dataKey="shortDept" 
              width={isMobile ? 90 : 150}
              tick={{ fontSize: isMobile ? 9 : 11 }} 
              axisLine={{ stroke: 'hsl(var(--border))' }}
            />
            <Tooltip 
              formatter={(value: number) => [`${value} pegawai`, 'Jumlah']}
              labelFormatter={(label, payload) => {
                if (payload && payload[0]) {
                  return payload[0].payload.department;
                }
                return label;
              }}
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                fontSize: '12px',
              }}
            />
            <Bar 
              dataKey="count" 
              fill="hsl(142, 76%, 36%)" 
              radius={[0, 4, 4, 0]}
              name="Jumlah Pegawai"
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export function PositionTypePieChart({ data }: PositionTypePieChartProps) {
  const isMobile = useIsMobile();
  
  return (
    <Card className="animate-fade-in flex flex-col h-full hover:shadow-md transition-all duration-300">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Distribusi Jenis Jabatan</CardTitle>
        <CardDescription>Persentase pegawai berdasarkan jenis jabatan</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col justify-center">
        <ResponsiveContainer width="100%" height={isMobile ? 240 : 280}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={isMobile ? 40 : 60}
              outerRadius={isMobile ? 70 : 100}
              paddingAngle={3}
              dataKey="count"
              nameKey="type"
              label={isMobile ? undefined : ({ type, percent }) => `${type} ${(percent * 100).toFixed(0)}%`}
              labelLine={!isMobile}
            >
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={POSITION_COLORS[index % POSITION_COLORS.length]}
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
              wrapperStyle={{ fontSize: isMobile ? '11px' : '12px' }}
              formatter={(value: string) => {
                const item = data.find(d => d.type === value);
                return `${value} (${item?.count || 0})`;
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export function JoinYearBarChart({ data }: JoinYearBarChartProps) {
  const isMobile = useIsMobile();
  
  return (
    <Card className="animate-fade-in flex flex-col h-full hover:shadow-md transition-all duration-300">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Tren Pegawai Bergabung</CardTitle>
        <CardDescription>Jumlah pegawai yang bergabung per tahun (10 tahun terakhir)</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col justify-center">
        <ResponsiveContainer width="100%" height={isMobile ? 240 : 280}>
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
              fill="hsl(280, 70%, 50%)" 
              radius={[4, 4, 0, 0]}
              name="Pegawai Baru"
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export { COLORS };

export function GenderPieChart({ data }: GenderPieChartProps) {
  const isMobile = useIsMobile();
  
  const GENDER_COLORS = [
    'hsl(217, 91%, 60%)',  // Male - blue
    'hsl(330, 65%, 55%)',  // Female - pink
  ];
  
  return (
    <Card className="animate-fade-in flex flex-col h-full hover:shadow-md transition-all duration-300">
      <CardHeader className="pb-3 border-b">
        <CardTitle className="text-base">Distribusi Jenis Kelamin</CardTitle>
        <CardDescription>Persentase pegawai berdasarkan jenis kelamin</CardDescription>
      </CardHeader>
      <CardContent className="pt-4">
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={90}
              paddingAngle={2}
              dataKey="count"
              nameKey="gender"
            >
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={GENDER_COLORS[index % GENDER_COLORS.length]}
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
                const item = data.find(d => d.gender === value);
                return `${value} (${item?.count || 0})`;
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export function ReligionPieChart({ data }: ReligionPieChartProps) {
  const isMobile = useIsMobile();
  
  const RELIGION_COLORS = [
    'hsl(217, 91%, 60%)',
    'hsl(142, 76%, 36%)',
    'hsl(38, 92%, 50%)',
    'hsl(280, 65%, 60%)',
    'hsl(0, 84%, 60%)',
    'hsl(199, 89%, 48%)',
  ];
  
  return (
    <Card className="animate-fade-in flex flex-col h-full hover:shadow-md transition-all duration-300">
      <CardHeader className="pb-3 border-b">
        <CardTitle className="text-base">Distribusi Agama</CardTitle>
        <CardDescription>Persentase pegawai berdasarkan agama</CardDescription>
      </CardHeader>
      <CardContent className="pt-4">
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={90}
              paddingAngle={2}
              dataKey="count"
              nameKey="religion"
            >
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={RELIGION_COLORS[index % RELIGION_COLORS.length]}
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
                const item = data.find(d => d.religion === value);
                return `${value} (${item?.count || 0})`;
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export function PositionKepmenBarChart({ data }: PositionKepmenBarChartProps) {
  const isMobile = useIsMobile();
  
  // Sort by count descending
  const sortedData = [...data].sort((a, b) => b.count - a.count);
  const totalCount = sortedData.reduce((sum, item) => sum + item.count, 0);
  
  // If too many positions (>20), use table view
  const useTableView = sortedData.length > 20;
  
  // For chart view, take top 15
  const chartData = sortedData.slice(0, 15).map(item => ({
    ...item,
    shortPosition: item.position.length > (isMobile ? 20 : 30) 
      ? item.position.substring(0, isMobile ? 20 : 30) + '...' 
      : item.position,
  }));

  const chartHeight = Math.max(350, chartData.length * 35);

  return (
    <Card className="animate-fade-in flex flex-col h-full hover:shadow-md transition-all duration-300">
      <CardHeader className="pb-3 border-b">
        <CardTitle className="text-base">Distribusi Jabatan Kepmen 202/2024</CardTitle>
        <CardDescription>
          {useTableView 
            ? `Daftar lengkap ${sortedData.length} jabatan` 
            : 'Top 15 jabatan dengan jumlah pegawai terbanyak'}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-4">
        {useTableView ? (
          // Table view for many positions
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              Total: <span className="font-semibold text-foreground">{totalCount}</span> pegawai dalam <span className="font-semibold text-foreground">{sortedData.length}</span> jabatan
            </div>
            <div className="max-h-[500px] overflow-auto rounded-lg border shadow-sm">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-muted/80 backdrop-blur-sm">
                  <tr className="border-b">
                    <th className="px-4 py-3 text-left font-semibold text-muted-foreground w-12">
                      No
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-muted-foreground">
                      Nama Jabatan
                    </th>
                    <th className="px-4 py-3 text-right font-semibold text-muted-foreground">
                      Jumlah
                    </th>
                    <th className="px-4 py-3 text-right font-semibold text-muted-foreground">
                      %
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sortedData.map((item, i) => (
                    <tr 
                      key={i} 
                      className="border-b last:border-0 hover:bg-muted/50 transition-colors"
                    >
                      <td className="px-4 py-2.5 text-muted-foreground">
                        {i + 1}
                      </td>
                      <td className="px-4 py-2.5">
                        {item.position}
                      </td>
                      <td className="px-4 py-2.5 text-right font-medium">
                        {item.count}
                      </td>
                      <td className="px-4 py-2.5 text-right text-muted-foreground">
                        {((item.count / totalCount) * 100).toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          // Bar chart for fewer positions
          <ResponsiveContainer width="100%" height={chartHeight}>
            <BarChart 
              data={chartData} 
              layout="vertical" 
              margin={{ 
                left: 20, 
                right: 30,
                top: 10,
                bottom: 10
              }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={true} vertical={false} />
              <XAxis 
                type="number"
                fontSize={12}
                stroke="hsl(215, 16%, 47%)"
              />
              <YAxis 
                type="category" 
                dataKey="shortPosition" 
                width={isMobile ? 140 : 220}
                tick={{ fontSize: isMobile ? 10 : 11 }} 
                axisLine={{ stroke: 'hsl(var(--border))' }}
              />
              <Tooltip 
                formatter={(value: number) => [`${value} pegawai`, 'Jumlah']}
                labelFormatter={(label, payload) => {
                  if (payload && payload[0]) {
                    return payload[0].payload.position;
                  }
                  return label;
                }}
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
                radius={[0, 6, 6, 0]}
                maxBarSize={28}
                name="Jumlah Pegawai"
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

export function TmtYearBarChart({ data, title, description }: TmtYearBarChartProps) {
  const isMobile = useIsMobile();
  
  return (
    <Card className="animate-fade-in flex flex-col h-full hover:shadow-md transition-all duration-300">
      <CardHeader className="pb-3 border-b">
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
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
              fill="hsl(199, 89%, 48%)" 
              radius={[4, 4, 0, 0]}
              name="Jumlah Pegawai"
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export function WorkDurationBarChart({ data }: WorkDurationBarChartProps) {
  const isMobile = useIsMobile();
  
  // Sort by order to maintain logical sequence
  const sortedData = [...data].sort((a, b) => a.order - b.order);
  
  const DURATION_COLORS = [
    'hsl(142, 76%, 36%)',  // < 5 years - green
    'hsl(199, 89%, 48%)',  // 5-10 years - blue
    'hsl(38, 92%, 50%)',   // 10-20 years - yellow
    'hsl(280, 65%, 60%)',  // 20-30 years - purple
    'hsl(0, 84%, 60%)',    // > 30 years - red
  ];
  
  return (
    <Card className="animate-fade-in flex flex-col h-full hover:shadow-md transition-all duration-300">
      <CardHeader className="pb-3 border-b">
        <CardTitle className="text-base">Distribusi Masa Kerja</CardTitle>
        <CardDescription>Distribusi pegawai berdasarkan masa kerja (dihitung dari TMT CPNS/PNS)</CardDescription>
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
              tick={{ fontSize: isMobile ? 9 : 11 }}
              axisLine={{ stroke: 'hsl(var(--border))' }}
              angle={isMobile ? -45 : 0}
              textAnchor={isMobile ? 'end' : 'middle'}
              height={isMobile ? 60 : 30}
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
                <Cell key={`cell-${index}`} fill={DURATION_COLORS[index % DURATION_COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
