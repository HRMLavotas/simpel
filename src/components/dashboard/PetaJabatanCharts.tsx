import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useIsMobile } from '@/hooks/use-mobile';
import { Badge } from '@/components/ui/badge';

interface PetaJabatanStat {
  position_name: string;
  abk: number;
  existing_pns: number;
  existing_pppk: number;
  total_existing: number;
  gap: number;
}

export function PetaJabatanAsnTable({ data }: { data: PetaJabatanStat[] }) {
  const totalAbk = data.reduce((acc, curr) => acc + curr.abk, 0);
  const totalPns = data.reduce((acc, curr) => acc + curr.existing_pns, 0);
  const totalPppk = data.reduce((acc, curr) => acc + curr.existing_pppk, 0);
  const totalGap = totalAbk - (totalPns + totalPppk);
  
  return (
    <Card className="animate-fade-in flex flex-col h-full hover:shadow-md transition-all duration-300">
      <CardHeader className="pb-3 border-b">
         <CardTitle className="text-base text-primary">Summary Peta Jabatan ASN</CardTitle>
         <CardDescription>Perbandingan Analisis Beban Kerja (ABK) vs Kekuatan Eksisting</CardDescription>
      </CardHeader>
      <CardContent className="pt-4 flex-1 flex flex-col">
        <div className="flex flex-wrap gap-2 mb-4">
          <Badge variant="outline" className="bg-primary/5">Total ABK: {totalAbk}</Badge>
          <Badge variant="outline" className="bg-blue-500/10 text-blue-600">Total ASN Eksisting: {totalPns + totalPppk}</Badge>
          <Badge variant="outline" className={totalGap > 0 ? "bg-amber-500/10 text-amber-600" : "bg-green-500/10 text-green-600"}>
            Total Kesiapan/Formasi Tersedia: {totalGap > 0 ? totalGap : 0}
          </Badge>
        </div>
        <div className="max-h-[400px] overflow-auto rounded-lg border shadow-sm flex-1">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-muted/90 backdrop-blur z-10 hidden sm:table-header-group">
              <tr className="border-b">
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground w-10">No</th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Nama Jabatan</th>
                <th className="px-4 py-3 text-right font-semibold text-muted-foreground">ABK Target</th>
                <th className="px-4 py-3 text-right font-semibold text-muted-foreground">PNS/CPNS</th>
                <th className="px-4 py-3 text-right font-semibold text-muted-foreground">PPPK</th>
                <th className="px-4 py-3 text-right font-semibold text-muted-foreground">Total Eksisting</th>
                <th className="px-4 py-3 text-right font-semibold text-muted-foreground">Kekurangan</th>
              </tr>
            </thead>
            <tbody>
              {data.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-muted-foreground italic">
                    Tidak ada data peta jabatan (ABK) yang tersedia untuk unit ini.
                  </td>
                </tr>
              ) : (
                data.map((item, i) => (
                  <tr key={i} className="border-b last:border-0 hover:bg-muted/30 transition-colors flex flex-col sm:table-row py-2 sm:py-0">
                    <td className="px-4 sm:py-2.5 text-muted-foreground hidden sm:table-cell">{i + 1}</td>
                    <td className="px-4 py-1 sm:py-2.5 font-medium block sm:table-cell text-sm">{item.position_name}</td>
                    <td className="px-4 py-1 sm:py-2.5 text-left sm:text-right text-xs sm:text-sm text-amber-600 font-medium sm:table-cell">
                      <span className="inline-block w-24 sm:hidden text-muted-foreground">ABK Target:</span> {item.abk}
                    </td>
                    <td className="px-4 py-1 sm:py-2.5 text-left sm:text-right text-xs sm:text-sm text-blue-600 sm:table-cell">
                       <span className="inline-block w-24 sm:hidden text-muted-foreground">PNS:</span> {item.existing_pns}
                    </td>
                    <td className="px-4 py-1 sm:py-2.5 text-left sm:text-right text-xs sm:text-sm text-emerald-600 sm:table-cell">
                      <span className="inline-block w-24 sm:hidden text-muted-foreground">PPPK:</span> {item.existing_pppk}
                    </td>
                    <td className="px-4 py-1 sm:py-2.5 text-left sm:text-right text-xs sm:text-sm font-bold sm:table-cell">
                      <span className="inline-block w-24 sm:hidden text-muted-foreground font-normal">Total Eksisting:</span> {item.total_existing}
                    </td>
                    <td className="px-4 py-1 sm:py-2.5 text-left sm:text-right text-xs sm:text-sm sm:table-cell">
                      <span className="inline-block w-24 sm:hidden text-muted-foreground font-normal">Kekurangan:</span> 
                      <span className={item.gap > 0 ? "text-destructive font-bold" : "text-emerald-600 font-medium"}>
                        {item.gap > 0 ? `-${item.gap}` : 'Terpenuhi'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

export function NonAsnPositionChart({ data }: { data: { position_name: string; count: number }[] }) {
  const isMobile = useIsMobile();
  const sortedData = [...data].slice(0, 15).map(item => ({
    ...item,
    shortPos: item.position_name.length > (isMobile ? 12 : 18) 
      ? item.position_name.substring(0, isMobile ? 12 : 18) + '...' 
      : item.position_name
  }));
  const totalCount = data.reduce((sum, item) => sum + item.count, 0);

  return (
     <Card className="animate-fade-in flex flex-col h-full hover:shadow-md transition-all duration-300">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg text-amber-600">Distribusi Formasi Jabatan Non ASN</CardTitle>
        <CardDescription>Top 15 Formasi/Penugasan Non ASN terbanyak (Total {totalCount} orang)</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col justify-center pt-4">
         {data.length === 0 ? (
           <div className="text-center py-10 text-muted-foreground">Tidak ada data penugasan/jabatan Non ASN</div>
         ) : (
          <ResponsiveContainer width="100%" height={Math.max(350, sortedData.length * 35)}>
            <BarChart 
              data={sortedData} 
              layout="vertical" 
              margin={{ left: isMobile ? 10 : 20, right: 30, top: 10, bottom: 10 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={true} vertical={false} />
              <XAxis type="number" fontSize={12} stroke="hsl(215, 16%, 47%)" />
              <YAxis 
                type="category" 
                dataKey="shortPos" 
                width={isMobile ? 120 : 180}
                tick={{ fontSize: isMobile ? 10 : 11 }} 
                axisLine={{ stroke: 'hsl(var(--border))' }}
              />
              <Tooltip 
                formatter={(value: number) => [`${value} pegawai`, 'Jumlah']}
                labelFormatter={(label, payload) => payload?.[0]?.payload?.position_name || label}
                contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }}
              />
              <Bar dataKey="count" fill="hsl(38, 92%, 50%)" radius={[0, 6, 6, 0]} maxBarSize={28} name="Jumlah" />
            </BarChart>
          </ResponsiveContainer>
         )}
      </CardContent>
    </Card>
  );
}
