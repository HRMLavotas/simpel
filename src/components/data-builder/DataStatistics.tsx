import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AVAILABLE_COLUMNS } from './ColumnSelector';
import { Users, BarChart3, PieChart, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart as RechartsPie, Pie, Cell, Legend } from 'recharts';

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
  { key: 'position_name', label: 'Nama Jabatan', icon: TrendingUp },
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
  const renderChart = (field: string, items: { name: string; value: number }[]) => {
    if (items.length <= 5) {
      return (
        <ResponsiveContainer width="100%" height={250}>
          <RechartsPie>
            <Pie
              data={items}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={80}
              label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
              labelLine={false}
              fontSize={11}
            >
              {items.map((_, i) => (
                <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </RechartsPie>
        </ResponsiveContainer>
      );
    }

    // Bar chart for many categories — show top 15
    const top = items.slice(0, 15);
    return (
      <ResponsiveContainer width="100%" height={Math.max(250, top.length * 32)}>
        <BarChart data={top} layout="vertical" margin={{ left: 10, right: 20, top: 5, bottom: 5 }}>
          <XAxis type="number" fontSize={11} />
          <YAxis type="category" dataKey="name" width={140} fontSize={11} tick={{ fill: 'hsl(215, 16%, 47%)' }} />
          <Tooltip />
          <Bar dataKey="value" fill="hsl(217, 91%, 60%)" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    );
  };

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs text-muted-foreground">Total Data</p>
          <p className="text-2xl font-bold text-foreground">{data.length}</p>
        </div>
        {availableStats.slice(0, 3).map(stat => {
          const items = statsData[stat.key] || [];
          return (
            <div key={stat.key} className="rounded-xl border bg-card p-4">
              <p className="text-xs text-muted-foreground">Kategori {stat.label}</p>
              <p className="text-2xl font-bold text-foreground">{items.length}</p>
            </div>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        {availableStats.map(stat => {
          const items = statsData[stat.key] || [];
          if (items.length === 0) return null;

          const StatIcon = stat.icon;

          return (
            <Card key={stat.key}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <StatIcon className="h-4 w-4 text-primary" />
                  Distribusi {stat.label}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {renderChart(stat.key, items)}

                {/* Table summary below chart */}
                <div className="mt-4 max-h-48 overflow-auto rounded-lg border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="px-3 py-2 text-left font-medium text-muted-foreground">{stat.label}</th>
                        <th className="px-3 py-2 text-right font-medium text-muted-foreground">Jumlah</th>
                        <th className="px-3 py-2 text-right font-medium text-muted-foreground">%</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item, i) => (
                        <tr key={i} className="border-b last:border-0 hover:bg-muted/30">
                          <td className="px-3 py-1.5">{item.name}</td>
                          <td className="px-3 py-1.5 text-right font-medium">{item.value}</td>
                          <td className="px-3 py-1.5 text-right text-muted-foreground">
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
