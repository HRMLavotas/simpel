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
    <Card className="animate-fade-in">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Distribusi Status ASN</CardTitle>
        <CardDescription>Persentase pegawai berdasarkan status kepegawaian</CardDescription>
      </CardHeader>
      <CardContent>
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
              formatter={(value, entry: any) => {
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
    <Card className="animate-fade-in">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Distribusi per Golongan</CardTitle>
        <CardDescription>Top 10 golongan dengan jumlah pegawai terbanyak</CardDescription>
      </CardHeader>
      <CardContent>
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
    <Card className="animate-fade-in lg:col-span-2">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Distribusi per Unit Kerja</CardTitle>
        <CardDescription>Top 10 unit kerja dengan jumlah pegawai terbanyak</CardDescription>
      </CardHeader>
      <CardContent>
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
    <Card className="animate-fade-in">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Distribusi Jenis Jabatan</CardTitle>
        <CardDescription>Persentase pegawai berdasarkan jenis jabatan</CardDescription>
      </CardHeader>
      <CardContent>
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
              formatter={(value, entry: any) => {
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
    <Card className="animate-fade-in">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Tren Pegawai Bergabung</CardTitle>
        <CardDescription>Jumlah pegawai yang bergabung per tahun (10 tahun terakhir)</CardDescription>
      </CardHeader>
      <CardContent>
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
