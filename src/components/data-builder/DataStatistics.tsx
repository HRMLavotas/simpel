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

// Fields to exclude from statistics (technical/non-categorical fields)
const EXCLUDE_FROM_STATS = [
  'id',
  'created_at',
  'updated_at',
  'import_order',
];

// Date fields that should not be aggregated
const DATE_FIELDS = [
  'birth_date',
  'join_date',
  'tmt_cpns',
  'tmt_pns',
  'tmt_pensiun',
];

// Icon mapping for common field types
const FIELD_ICONS: Record<string, typeof Users> = {
  department: Users,
  asn_status: PieChart,
  position_type: BarChart3,
  position_sk: TrendingUp,
  position_name: TrendingUp,
  additional_position: TrendingUp,
  old_position: TrendingUp,
  rank_group: BarChart3,
  gender: PieChart,
  religion: PieChart,
  birth_place: Users,
  front_title: Users,
  back_title: Users,
  keterangan_formasi: BarChart3,
};

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
  // Generate stats for all selected columns that are categorical (not dates, IDs, etc)
  const availableStats = useMemo(() => {
    if (data.length === 0) return [];
    
    const dataKeys = Object.keys(data[0]);
    
    // Get all fields from AVAILABLE_COLUMNS that match selected columns
    const stats = selectedColumns
      .map(colKey => {
        const col = AVAILABLE_COLUMNS.find(c => c.key === colKey);
        if (!col) return null;
        
        // Skip if field is excluded or is a date field
        if (EXCLUDE_FROM_STATS.includes(col.dbField) || DATE_FIELDS.includes(col.dbField)) {
          return null;
        }
        
        // Skip if field is not in data
        if (!dataKeys.includes(col.dbField)) {
          return null;
        }
        
        // Check if field has reasonable number of unique values (not too many like NIP/name)
        const uniqueValues = new Set(data.map(row => String(row[col.dbField] ?? '')));
        // Skip fields with too many unique values (likely identifiers) or too few (all same)
        if (uniqueValues.size > 100 || uniqueValues.size <= 1) {
          return null;
        }
        
        return {
          key: col.dbField,
          label: col.label,
          icon: FIELD_ICONS[col.dbField] || BarChart3,
        };
      })
      .filter((stat): stat is { key: string; label: string; icon: typeof Users } => stat !== null);
    
    return stats;
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
