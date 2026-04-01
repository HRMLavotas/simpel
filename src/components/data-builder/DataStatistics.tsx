import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AVAILABLE_COLUMNS } from './ColumnSelector';
import { Users, BarChart3, PieChart, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart as RechartsPie, Pie, Cell, Legend } from 'recharts';
import { TooltipProps, YAxisTickProps } from '@/types/chart';

const CHART_COLORS = [
  'hsl(217, 91%, 60%)',   // primary
  'hsl(142, 76%, 36%)',   // success
  'hsl(38, 92%, 50%)',    // warning
  'hsl(280, 65%, 60%)',   // purple
  'hsl(0, 84%, 60%)',     // destructive
  'hsl(199, 89%, 48%)',   // info
  'hsl(170, 70%, 45%)',
  'hsl(330, 65%, 55%)',
  'hsl(45, 85%, 55%)',
  'hsl(200, 60%, 50%)',
];

// Categorizable fields for statistics
const STAT_FIELDS = [
  { key: 'department', label: 'Unit Kerja', icon: Users },
  { key: 'asn_status', label: 'Status ASN', icon: PieChart },
  { key: 'position_type', label: 'Jenis Jabatan', icon: BarChart3 },
  { key: 'position_sk', label: 'Jabatan Sesuai SK', icon: TrendingUp },
  { key: 'position_name', label: 'Jabatan Sesuai Kepmen 202 Tahun 2024', icon: TrendingUp },
  { key: 'rank_group', label: 'Pangkat/Golongan', icon: BarChart3 },
];

interface DataStatisticsProps {
  data: Record<string, unknown>[];
  selectedColumns: string[];
}

function groupBy(data: Record<string, unknown>[], field: string): { name: string; value: number }[] {
  const counts: Record<string, number> = {};
  data.forEach(row => {
    const val = String(row[field] ?? 'Tidak Ada');
    counts[val] = (counts[val] || 0) + 1;
  });
  return Object.entries(counts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

// Custom tooltip for better readability
import { TooltipProps } from '@/types/chart';

const CustomTooltip = ({ active, payload, totalData }: TooltipProps & { totalData: number }) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    const percentage = ((data.value / totalData) * 100).toFixed(1);
    return (
      <div className="bg-background border rounded-lg shadow-lg p-3">
        <p className="font-medium text-sm mb-1">{data.payload.name || data.name}</p>
        <p className="text-sm text-muted-foreground">
          Jumlah: <span className="font-semibold text-foreground">{data.value}</span>
        </p>
        <p className="text-sm text-muted-foreground">
          Persentase: <span className="font-semibold text-foreground">{percentage}%</span>
        </p>
      </div>
    );
  }
  return null;
};

// Truncate long text for display
const truncateText = (text: string, maxLength: number = 30) => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
};

// Custom YAxis tick for bar chart
import { YAxisTickProps } from '@/types/chart';

const CustomYAxisTick = ({ x, y, payload }: YAxisTickProps) => {
  return (
    <g transform={`translate(${x},${y})`}>
      <text
        x={0}
        y={0}
        dy={4}
        textAnchor="end"
        fill="hsl(215, 16%, 47%)"
        fontSize={11}
        title={String(payload.value)}
      >
        {truncateText(String(payload.value), 25)}
      </text>
    </g>
  );
};

export function DataStatistics({ data, selectedColumns }: DataStatisticsProps) {
  // Only show stats for fields present in the data
  const availableStats = useMemo(() => {
    // We need the raw data to have these fields — check against selected columns or data keys
    const dataKeys = data.length > 0 ? Object.keys(data[0]) : [];
    return STAT_FIELDS.filter(f => dataKeys.includes(f.key) || selectedColumns.includes(f.key));
  }, [data, selectedColumns]);

  const statsData = useMemo(() => {
    const result: Record<string, { name: string; value: number }[]> = {};
    availableStats.forEach(stat => {
      result[stat.key] = groupBy(data, stat.key);
    });
    return result;
  }, [data, availableStats]);

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        Belum ada data. Pilih kolom dan klik "Tampilkan Data" terlebih dahulu.
      </div>
    );
  }

  // Determine which fields to show as pie (few categories) vs bar (many categories)
  const renderChart = (field: string, items: { name: string; value: number }[], totalData: number) => {
    if (items.length <= 5) {
      // Pie chart for few categories
      return (
        <ResponsiveContainer width="100%" height={300}>
          <RechartsPie>
            <Pie
              data={items}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={90}
              innerRadius={50}
              paddingAngle={2}
            >
              {items.map((_, i) => (
                <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip totalData={totalData} />} />
            <Legend 
              verticalAlign="bottom" 
              height={36}
              formatter={(value) => truncateText(value, 40)}
              wrapperStyle={{ fontSize: '12px' }}
            />
          </RechartsPie>
        </ResponsiveContainer>
      );
    }

    // Bar chart for many categories — show top 20
    const top = items.slice(0, 20);
    const chartHeight = Math.max(350, top.length * 35);
    
    return (
      <ResponsiveContainer width="100%" height={chartHeight}>
        <BarChart 
          data={top} 
          layout="vertical" 
          margin={{ left: 20, right: 30, top: 10, bottom: 10 }}
        >
          <XAxis 
            type="number" 
            fontSize={12}
            stroke="hsl(215, 16%, 47%)"
          />
          <YAxis 
            type="category" 
            dataKey="name" 
            width={180}
            tick={<CustomYAxisTick />}
          />
          <Tooltip content={<CustomTooltip totalData={totalData} />} />
          <Bar 
            dataKey="value" 
            fill="hsl(217, 91%, 60%)" 
            radius={[0, 6, 6, 0]}
            maxBarSize={28}
          />
        </BarChart>
      </ResponsiveContainer>
    );
  };

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Total Data</p>
          <p className="text-3xl font-bold text-foreground mt-1">{data.length}</p>
        </div>
        {availableStats.slice(0, 3).map(stat => {
          const items = statsData[stat.key] || [];
          return (
            <div key={stat.key} className="rounded-xl border bg-card p-4 shadow-sm">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">
                Kategori {stat.label}
              </p>
              <p className="text-3xl font-bold text-foreground mt-1">{items.length}</p>
            </div>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {availableStats.map(stat => {
          const items = statsData[stat.key] || [];
          if (items.length === 0) return null;

          const StatIcon = stat.icon;

          return (
            <Card key={stat.key} className="shadow-sm">
              <CardHeader className="pb-3 border-b">
                <CardTitle className="text-base flex items-center gap-2">
                  <StatIcon className="h-5 w-5 text-primary" />
                  Distribusi {stat.label}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                {renderChart(stat.key, items, data.length)}

                {/* Table summary below chart */}
                <div className="mt-6 max-h-64 overflow-auto rounded-lg border shadow-sm">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-muted/80 backdrop-blur-sm">
                      <tr className="border-b">
                        <th className="px-4 py-3 text-left font-semibold text-muted-foreground">
                          {stat.label}
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
                      {items.map((item, i) => (
                        <tr 
                          key={i} 
                          className="border-b last:border-0 hover:bg-muted/50 transition-colors"
                        >
                          <td className="px-4 py-2.5" title={item.name}>
                            {truncateText(item.name, 50)}
                          </td>
                          <td className="px-4 py-2.5 text-right font-medium">
                            {item.value}
                          </td>
                          <td className="px-4 py-2.5 text-right text-muted-foreground">
                            {((item.value / data.length) * 100).toFixed(1)}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
