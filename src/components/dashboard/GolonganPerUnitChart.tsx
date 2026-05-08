import { useState, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, Cell,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useIsMobile } from '@/hooks/use-mobile';
import { UNIT_PEMBINA_MAPPING, isSatpelOrWorkshop } from '@/lib/constants';
import { supabase } from '@/integrations/supabase/client';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface UnitGolonganRow {
  unit: string;
  pns_I: number;
  pns_II: number;
  pns_III: number;
  pns_IV: number;
  jumlah_pns: number;
  pppk_III: number;
  pppk_V: number;
  pppk_VII: number;
  pppk_IX: number;
  jumlah_pppk: number;
  total_asn: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const OFFICIAL_DEPT_ORDER = [
  'Setditjen Binalavotas',
  'Direktorat Bina Stankomproglat',
  'Direktorat Bina Lemlatvok',
  'Direktorat Bina Penyelenggaraan Latvogan',
  'Direktorat Bina Intala',
  'Direktorat Bina Peningkatan Produktivitas',
  'Sekretariat BNSP',
  'BBPVP Bekasi',
  'BBPVP Bandung',
  'BBPVP Serang',
  'BBPVP Medan',
  'BBPVP Semarang',
  'BBPVP Makassar',
  'BPVP Surakarta',
  'BPVP Ambon',
  'BPVP Ternate',
  'BPVP Banda Aceh',
  'BPVP Sorong',
  'BPVP Kendari',
  'BPVP Samarinda',
  'BPVP Padang',
  'BPVP Bandung Barat',
  'BPVP Lombok Timur',
  'BPVP Bantaeng',
  'BPVP Banyuwangi',
  'BPVP Sidoarjo',
  'BPVP Pangkep',
  'BPVP Belitung',
];

// Short labels for chart axis
const SHORT_LABELS: Record<string, string> = {
  'Setditjen Binalavotas': 'Setditjen',
  'Direktorat Bina Stankomproglat': 'Dit. Stankomproglat',
  'Direktorat Bina Lemlatvok': 'Dit. Lemlatvok',
  'Direktorat Bina Penyelenggaraan Latvogan': 'Dit. Latvogan',
  'Direktorat Bina Intala': 'Dit. Intala',
  'Direktorat Bina Peningkatan Produktivitas': 'Dit. Produktivitas',
  'Sekretariat BNSP': 'Set. BNSP',
};

function shortLabel(unit: string): string {
  if (SHORT_LABELS[unit]) return SHORT_LABELS[unit];
  // BBPVP / BPVP — keep as is (already short)
  return unit;
}

// Colors
const PNS_COLORS = {
  pns_I:   'hsl(217, 91%, 75%)',
  pns_II:  'hsl(217, 91%, 60%)',
  pns_III: 'hsl(217, 91%, 45%)',
  pns_IV:  'hsl(217, 91%, 30%)',
};
const PPPK_COLORS = {
  pppk_III: 'hsl(142, 76%, 65%)',
  pppk_V:   'hsl(142, 76%, 50%)',
  pppk_VII: 'hsl(142, 76%, 36%)',
  pppk_IX:  'hsl(142, 76%, 22%)',
};

type ViewMode = 'stacked' | 'grouped' | 'total' | 'table';

// ─── Helper ───────────────────────────────────────────────────────────────────

function getEffectiveDept(department: string | null | undefined): string {
  const dept = String(department || 'Tidak Ada');
  if (isSatpelOrWorkshop(dept)) return UNIT_PEMBINA_MAPPING[dept] ?? dept;
  return dept;
}

function normalizeAsnStatus(status: unknown): string {
  if (!status) return 'Tidak Ada';
  const s = String(status).trim().toUpperCase();
  if (s === 'CPNS' || s.includes('CPNS')) return 'CPNS';
  if (s === 'PNS' || s.includes('PNS')) return 'PNS';
  if (s === 'PPPK' || s.includes('PPPK')) return 'PPPK';
  return 'Lainnya';
}

function getPnsGolongan(rankGroup: string): string {
  const rg = String(rankGroup || '').trim();
  const subMatch = rg.match(/\b(IV|III|II|I)\/(a|b|c|d|e)\b/i);
  if (subMatch) return subMatch[1].toUpperCase();
  const longMatch = rg.match(/\((IV|III|II|I)\//i);
  if (longMatch) return longMatch[1].toUpperCase();
  return 'lainnya';
}

function getPppkGolongan(rankGroup: string): string {
  const rg = String(rankGroup || '').trim().toUpperCase();
  if (rg === 'III') return 'III';
  if (rg === 'V')   return 'V';
  if (rg === 'VII') return 'VII';
  if (rg === 'IX')  return 'IX';
  return 'lainnya';
}

// ─── Custom Tooltip ───────────────────────────────────────────────────────────

interface TooltipPayload {
  name: string;
  value: number;
  color: string;
}

function CustomTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: TooltipPayload[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  const total = payload.reduce((s, p) => s + (p.value || 0), 0);
  return (
    <div className="rounded-lg border bg-card p-3 shadow-lg text-xs max-w-[220px]">
      <p className="font-semibold text-sm mb-2 text-foreground">{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex justify-between gap-4 py-0.5">
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ background: p.color }} />
            {p.name}
          </span>
          <span className="font-medium">{p.value}</span>
        </div>
      ))}
      <div className="border-t mt-1.5 pt-1.5 flex justify-between font-semibold">
        <span>Total ASN</span>
        <span>{total}</span>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface GolonganPerUnitChartProps {
  /** If provided, only show this unit (for non-admin users) */
  userDepartment?: string | null;
  isAdminPusat?: boolean;
}

export function GolonganPerUnitChart({ userDepartment, isAdminPusat }: GolonganPerUnitChartProps) {
  const isMobile = useIsMobile();
  const [viewMode, setViewMode] = useState<ViewMode>('stacked');
  const [isLoading, setIsLoading] = useState(false);
  const [rawData, setRawData] = useState<{ department: string; asn_status: string; rank_group: string }[]>([]);
  const [loaded, setLoaded] = useState(false);

  // Fetch data
  useEffect(() => {
    if (loaded) return;
    setIsLoading(true);

    const fetchAll = async () => {
      const allRows: { department: string; asn_status: string; rank_group: string }[] = [];
      let offset = 0;
      const batchSize = 1000;

      while (true) {
        let query = supabase
          .from('employees')
          .select('department, asn_status, rank_group')
          .eq('is_active', true)
          .in('asn_status', ['PNS', 'CPNS', 'PPPK'])
          .range(offset, offset + batchSize - 1);

        if (!isAdminPusat && userDepartment) {
          query = query.eq('department', userDepartment);
        }

        const { data, error } = await query;
        if (error || !data || data.length === 0) break;
        allRows.push(...data);
        if (data.length < batchSize) break;
        offset += batchSize;
      }

      setRawData(allRows);
      setLoaded(true);
      setIsLoading(false);
    };

    fetchAll();
  }, [isAdminPusat, userDepartment, loaded]);

  // Aggregate
  const rows = useMemo<UnitGolonganRow[]>(() => {
    const map = new Map<string, UnitGolonganRow>();

    rawData.forEach(emp => {
      const unit = getEffectiveDept(emp.department);
      if (!map.has(unit)) {
        map.set(unit, {
          unit,
          pns_I: 0, pns_II: 0, pns_III: 0, pns_IV: 0, jumlah_pns: 0,
          pppk_III: 0, pppk_V: 0, pppk_VII: 0, pppk_IX: 0, jumlah_pppk: 0,
          total_asn: 0,
        });
      }
      const row = map.get(unit)!;
      const status = normalizeAsnStatus(emp.asn_status);

      if (status === 'PNS' || status === 'CPNS') {
        const gol = getPnsGolongan(emp.rank_group || '');
        if (gol === 'I')   row.pns_I++;
        else if (gol === 'II')  row.pns_II++;
        else if (gol === 'III') row.pns_III++;
        else if (gol === 'IV')  row.pns_IV++;
        row.jumlah_pns++;
      } else if (status === 'PPPK') {
        const gol = getPppkGolongan(emp.rank_group || '');
        if (gol === 'III') row.pppk_III++;
        else if (gol === 'V')   row.pppk_V++;
        else if (gol === 'VII') row.pppk_VII++;
        else if (gol === 'IX')  row.pppk_IX++;
        row.jumlah_pppk++;
      }
      row.total_asn++;
    });

    // Sort by official order
    const unitSet = new Set(map.keys());
    const sorted = [
      ...OFFICIAL_DEPT_ORDER.filter(d => unitSet.has(d)),
      ...[...unitSet].filter(d => !OFFICIAL_DEPT_ORDER.includes(d)).sort(),
    ];

    return sorted.map(u => map.get(u)!);
  }, [rawData]);

  // Totals
  const totals = useMemo(() => rows.reduce(
    (acc, r) => ({
      pns_I:   acc.pns_I   + r.pns_I,
      pns_II:  acc.pns_II  + r.pns_II,
      pns_III: acc.pns_III + r.pns_III,
      pns_IV:  acc.pns_IV  + r.pns_IV,
      jumlah_pns:  acc.jumlah_pns  + r.jumlah_pns,
      pppk_III: acc.pppk_III + r.pppk_III,
      pppk_V:   acc.pppk_V   + r.pppk_V,
      pppk_VII: acc.pppk_VII + r.pppk_VII,
      pppk_IX:  acc.pppk_IX  + r.pppk_IX,
      jumlah_pppk: acc.jumlah_pppk + r.jumlah_pppk,
      total_asn:   acc.total_asn   + r.total_asn,
    }),
    { pns_I: 0, pns_II: 0, pns_III: 0, pns_IV: 0, jumlah_pns: 0,
      pppk_III: 0, pppk_V: 0, pppk_VII: 0, pppk_IX: 0, jumlah_pppk: 0, total_asn: 0 }
  ), [rows]);

  // Chart data
  const chartData = rows.map(r => ({
    ...r,
    label: shortLabel(r.unit),
  }));

  const chartHeight = Math.max(400, rows.length * (isMobile ? 28 : 22));

  const tooltipStyle = {
    backgroundColor: 'hsl(var(--card))',
    border: '1px solid hsl(var(--border))',
    borderRadius: '8px',
    fontSize: '12px',
  };

  return (
    <Card className="animate-fade-in hover:shadow-md transition-all duration-300 col-span-full">
      <CardHeader className="pb-3 border-b">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div>
            <CardTitle className="text-base">Distribusi Golongan ASN per Unit Kerja</CardTitle>
            <CardDescription className="mt-1">
              PNS (Gol I–IV) dan PPPK (Gol III, V, VII, IX) — Satpel dihitung ke unit pembina
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {(['stacked', 'grouped', 'total', 'table'] as ViewMode[]).map(mode => (
              <Button
                key={mode}
                size="sm"
                variant={viewMode === mode ? 'default' : 'outline'}
                className="h-7 text-xs px-2.5"
                onClick={() => setViewMode(mode)}
              >
                {{ stacked: 'Stacked', grouped: 'Grouped', total: 'Total', table: 'Tabel' }[mode]}
              </Button>
            ))}
          </div>
        </div>

        {/* Summary badges */}
        <div className="flex flex-wrap gap-2 mt-3">
          <Badge variant="secondary" className="text-xs">
            Total ASN: <span className="font-bold ml-1">{totals.total_asn.toLocaleString('id-ID')}</span>
          </Badge>
          <Badge variant="outline" className="text-xs text-blue-600 border-blue-300">
            PNS+CPNS: <span className="font-bold ml-1">{totals.jumlah_pns.toLocaleString('id-ID')}</span>
          </Badge>
          <Badge variant="outline" className="text-xs text-emerald-600 border-emerald-300">
            PPPK: <span className="font-bold ml-1">{totals.jumlah_pppk.toLocaleString('id-ID')}</span>
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pt-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-48 gap-2 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-sm">Memuat data golongan...</span>
          </div>
        ) : rows.length === 0 ? (
          <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
            Tidak ada data ASN
          </div>
        ) : viewMode === 'table' ? (
          // ── Table View ──────────────────────────────────────────────────────
          <div className="overflow-auto rounded-lg border">
            <table className="w-full text-xs min-w-[700px]">
              <thead className="bg-muted/80 sticky top-0">
                <tr className="border-b">
                  <th className="px-3 py-2.5 text-left font-semibold text-muted-foreground w-8">No</th>
                  <th className="px-3 py-2.5 text-left font-semibold text-muted-foreground">Unit Kerja</th>
                  <th className="px-2 py-2.5 text-center font-semibold text-blue-600 bg-blue-50/50" colSpan={5}>PNS / CPNS</th>
                  <th className="px-2 py-2.5 text-center font-semibold text-emerald-600 bg-emerald-50/50" colSpan={5}>PPPK</th>
                  <th className="px-3 py-2.5 text-right font-semibold text-foreground">Total ASN</th>
                </tr>
                <tr className="border-b bg-muted/50">
                  <th className="px-3 py-1.5" />
                  <th className="px-3 py-1.5" />
                  {['I', 'II', 'III', 'IV', 'Jml'].map(h => (
                    <th key={h} className="px-2 py-1.5 text-center text-muted-foreground font-medium bg-blue-50/30">{h}</th>
                  ))}
                  {['III', 'V', 'VII', 'IX', 'Jml'].map(h => (
                    <th key={h} className="px-2 py-1.5 text-center text-muted-foreground font-medium bg-emerald-50/30">{h}</th>
                  ))}
                  <th className="px-3 py-1.5" />
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={r.unit} className="border-b last:border-0 hover:bg-muted/40 transition-colors">
                    <td className="px-3 py-2 text-muted-foreground">{i + 1}</td>
                    <td className="px-3 py-2 font-medium">{r.unit}</td>
                    {[r.pns_I, r.pns_II, r.pns_III, r.pns_IV, r.jumlah_pns].map((v, j) => (
                      <td key={j} className={`px-2 py-2 text-center ${j === 4 ? 'font-semibold text-blue-700' : ''}`}>{v || '–'}</td>
                    ))}
                    {[r.pppk_III, r.pppk_V, r.pppk_VII, r.pppk_IX, r.jumlah_pppk].map((v, j) => (
                      <td key={j} className={`px-2 py-2 text-center ${j === 4 ? 'font-semibold text-emerald-700' : ''}`}>{v || '–'}</td>
                    ))}
                    <td className="px-3 py-2 text-right font-bold">{r.total_asn}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 bg-muted/60 font-bold">
                  <td className="px-3 py-2.5" />
                  <td className="px-3 py-2.5">JUMLAH</td>
                  {[totals.pns_I, totals.pns_II, totals.pns_III, totals.pns_IV, totals.jumlah_pns].map((v, j) => (
                    <td key={j} className={`px-2 py-2.5 text-center ${j === 4 ? 'text-blue-700' : ''}`}>{v}</td>
                  ))}
                  {[totals.pppk_III, totals.pppk_V, totals.pppk_VII, totals.pppk_IX, totals.jumlah_pppk].map((v, j) => (
                    <td key={j} className={`px-2 py-2.5 text-center ${j === 4 ? 'text-emerald-700' : ''}`}>{v}</td>
                  ))}
                  <td className="px-3 py-2.5 text-right">{totals.total_asn}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        ) : viewMode === 'total' ? (
          // ── Total Bar Chart ─────────────────────────────────────────────────
          <ResponsiveContainer width="100%" height={chartHeight}>
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ left: isMobile ? 10 : 20, right: 40, top: 5, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11 }} axisLine={{ stroke: 'hsl(var(--border))' }} />
              <YAxis
                type="category" dataKey="label"
                width={isMobile ? 100 : 160}
                tick={{ fontSize: isMobile ? 9 : 11 }}
                axisLine={{ stroke: 'hsl(var(--border))' }}
              />
              <Tooltip
                formatter={(v: number) => [`${v} pegawai`, 'Total ASN']}
                contentStyle={tooltipStyle}
              />
              <Bar dataKey="total_asn" name="Total ASN" radius={[0, 4, 4, 0]} maxBarSize={20}>
                {chartData.map((_, i) => (
                  <Cell key={i} fill={`hsl(${217 + (i * 5) % 60}, 80%, ${55 - (i % 3) * 5}%)`} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : viewMode === 'stacked' ? (
          // ── Stacked Bar Chart ────────────────────────────────────────────────
          <ResponsiveContainer width="100%" height={chartHeight}>
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ left: isMobile ? 10 : 20, right: 40, top: 5, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11 }} axisLine={{ stroke: 'hsl(var(--border))' }} />
              <YAxis
                type="category" dataKey="label"
                width={isMobile ? 100 : 160}
                tick={{ fontSize: isMobile ? 9 : 11 }}
                axisLine={{ stroke: 'hsl(var(--border))' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
              <Bar dataKey="pns_I"   name="PNS Gol I"    stackId="a" fill={PNS_COLORS.pns_I}   maxBarSize={20} />
              <Bar dataKey="pns_II"  name="PNS Gol II"   stackId="a" fill={PNS_COLORS.pns_II}  maxBarSize={20} />
              <Bar dataKey="pns_III" name="PNS Gol III"  stackId="a" fill={PNS_COLORS.pns_III} maxBarSize={20} />
              <Bar dataKey="pns_IV"  name="PNS Gol IV"   stackId="a" fill={PNS_COLORS.pns_IV}  maxBarSize={20} />
              <Bar dataKey="pppk_III" name="PPPK Gol III" stackId="a" fill={PPPK_COLORS.pppk_III} maxBarSize={20} />
              <Bar dataKey="pppk_V"   name="PPPK Gol V"   stackId="a" fill={PPPK_COLORS.pppk_V}   maxBarSize={20} />
              <Bar dataKey="pppk_VII" name="PPPK Gol VII" stackId="a" fill={PPPK_COLORS.pppk_VII} maxBarSize={20} />
              <Bar dataKey="pppk_IX"  name="PPPK Gol IX"  stackId="a" fill={PPPK_COLORS.pppk_IX}  maxBarSize={20} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          // ── Grouped Bar Chart ────────────────────────────────────────────────
          <ResponsiveContainer width="100%" height={chartHeight}>
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ left: isMobile ? 10 : 20, right: 40, top: 5, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11 }} axisLine={{ stroke: 'hsl(var(--border))' }} />
              <YAxis
                type="category" dataKey="label"
                width={isMobile ? 100 : 160}
                tick={{ fontSize: isMobile ? 9 : 11 }}
                axisLine={{ stroke: 'hsl(var(--border))' }}
              />
              <Tooltip
                formatter={(v: number, name: string) => [`${v} pegawai`, name]}
                contentStyle={tooltipStyle}
              />
              <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
              <Bar dataKey="jumlah_pns"  name="Jumlah PNS+CPNS" fill="hsl(217, 91%, 55%)" maxBarSize={14} radius={[0, 3, 3, 0]} />
              <Bar dataKey="jumlah_pppk" name="Jumlah PPPK"      fill="hsl(142, 76%, 40%)" maxBarSize={14} radius={[0, 3, 3, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
