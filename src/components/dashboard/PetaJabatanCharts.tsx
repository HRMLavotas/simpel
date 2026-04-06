import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useIsMobile } from '@/hooks/use-mobile';
import { Badge } from '@/components/ui/badge';
import { BarChart3, Layers3, Building, Briefcase } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

interface PetaJabatanStat {
  position_name: string;
  position_category?: string;
  department?: string;
  abk: number;
  existing_pns: number;
  existing_pppk: number;
  total_existing: number;
  gap: number;
}

function EmptyChartState({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex min-h-[280px] flex-col items-center justify-center rounded-lg border border-dashed bg-muted/20 px-6 py-10 text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-background shadow-sm">
        <BarChart3 className="h-6 w-6 text-muted-foreground" />
      </div>
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

export function PetaJabatanAsnTable({ data }: { data: PetaJabatanStat[] }) {
  const [viewMode, setViewMode] = useState<'position' | 'department'>('position');
  
  const totalAbk = data.reduce((acc, curr) => acc + curr.abk, 0);
  const totalPns = data.reduce((acc, curr) => acc + curr.existing_pns, 0);
  const totalPppk = data.reduce((acc, curr) => acc + curr.existing_pppk, 0);
  const totalGap = totalAbk - (totalPns + totalPppk);

  // Group by department for department view
  const departmentData = data.reduce((acc, curr) => {
    const dept = curr.department || 'Tidak Ada Unit';
    if (!acc[dept]) {
      acc[dept] = {
        department: dept,
        abk: 0,
        existing_pns: 0,
        existing_pppk: 0,
        total_existing: 0,
        gap: 0,
        count: 0
      };
    }
    acc[dept].abk += curr.abk;
    acc[dept].existing_pns += curr.existing_pns;
    acc[dept].existing_pppk += curr.existing_pppk;
    acc[dept].total_existing += curr.total_existing;
    acc[dept].gap += curr.gap;
    acc[dept].count += 1;
    return acc;
  }, {} as Record<string, {
    department: string;
    abk: number;
    existing_pns: number;
    existing_pppk: number;
    total_existing: number;
    gap: number;
    count: number;
  }>);

  const departmentArray = Object.values(departmentData).sort((a, b) => 
    a.department.localeCompare(b.department)
  );
  
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
          <Badge variant="outline" className={cn(
            totalGap > 0 ? "bg-amber-500/10 text-amber-600" : 
            totalGap < 0 ? "bg-blue-500/10 text-blue-600" : 
            "bg-green-500/10 text-green-600"
          )}>
            {totalGap > 0 ? `Kesiapan/Formasi Tersedia: ${totalGap}` : 
             totalGap < 0 ? `Lebih ${Math.abs(totalGap)} dari ABK` : 
             'Sesuai ABK'}
          </Badge>
        </div>

        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'position' | 'department')} className="flex-1 flex flex-col">
          <TabsList className="mb-3">
            <TabsTrigger value="position" className="gap-2">
              <Briefcase className="h-4 w-4" />
              Per Jabatan
            </TabsTrigger>
            <TabsTrigger value="department" className="gap-2">
              <Building className="h-4 w-4" />
              Per Unit Kerja
            </TabsTrigger>
          </TabsList>

          <TabsContent value="position" className="flex-1 mt-0">
            <div className="max-h-[400px] overflow-auto rounded-lg border shadow-sm">
              {data.length === 0 ? (
                <div className="p-4 sm:p-6">
                  <div className="rounded-lg border border-dashed bg-muted/20 p-6 text-center">
                    <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-background shadow-sm">
                      <Layers3 className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <h3 className="text-sm font-semibold text-foreground">Belum ada data peta jabatan untuk ditampilkan</h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Data ABK belum tersedia untuk unit kerja ini atau belum cocok dengan filter yang sedang aktif.
                    </p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      Coba ubah unit kerja, lalu muat ulang data peta jabatan.
                    </p>
                  </div>
                </div>
              ) : (
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
                    {data.map((item, i) => (
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
                          <span className={cn(
                            "font-bold",
                            item.gap > 0 ? "text-destructive" : item.gap < 0 ? "text-blue-600" : "text-emerald-600"
                          )}>
                            {item.gap > 0 ? `-${item.gap}` : item.gap < 0 ? `Lebih ${Math.abs(item.gap)}` : 'Terpenuhi'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </TabsContent>

          <TabsContent value="department" className="flex-1 mt-0">
            <div className="max-h-[400px] overflow-auto rounded-lg border shadow-sm">
              {departmentArray.length === 0 ? (
                <div className="p-4 sm:p-6">
                  <div className="rounded-lg border border-dashed bg-muted/20 p-6 text-center">
                    <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-background shadow-sm">
                      <Building className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <h3 className="text-sm font-semibold text-foreground">Belum ada data unit kerja untuk ditampilkan</h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Data ABK belum tersedia atau belum cocok dengan filter yang sedang aktif.
                    </p>
                  </div>
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-muted/90 backdrop-blur z-10 hidden sm:table-header-group">
                    <tr className="border-b">
                      <th className="px-4 py-3 text-left font-semibold text-muted-foreground w-10">No</th>
                      <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Unit Kerja</th>
                      <th className="px-4 py-3 text-center font-semibold text-muted-foreground">Jumlah Jabatan</th>
                      <th className="px-4 py-3 text-right font-semibold text-muted-foreground">ABK Target</th>
                      <th className="px-4 py-3 text-right font-semibold text-muted-foreground">PNS/CPNS</th>
                      <th className="px-4 py-3 text-right font-semibold text-muted-foreground">PPPK</th>
                      <th className="px-4 py-3 text-right font-semibold text-muted-foreground">Total Eksisting</th>
                      <th className="px-4 py-3 text-center font-semibold text-muted-foreground">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {departmentArray.map((item, i) => {
                      const percentage = item.abk > 0 ? ((item.total_existing / item.abk) * 100).toFixed(1) : '0';
                      return (
                        <tr key={i} className="border-b last:border-0 hover:bg-muted/30 transition-colors flex flex-col sm:table-row py-2 sm:py-0">
                          <td className="px-4 sm:py-2.5 text-muted-foreground hidden sm:table-cell">{i + 1}</td>
                          <td className="px-4 py-1 sm:py-2.5 font-medium block sm:table-cell text-sm">{item.department}</td>
                          <td className="px-4 py-1 sm:py-2.5 text-left sm:text-center text-xs sm:text-sm sm:table-cell">
                            <span className="inline-block w-32 sm:hidden text-muted-foreground">Jumlah Jabatan:</span> {item.count}
                          </td>
                          <td className="px-4 py-1 sm:py-2.5 text-left sm:text-right text-xs sm:text-sm text-amber-600 font-medium sm:table-cell">
                            <span className="inline-block w-32 sm:hidden text-muted-foreground">ABK Target:</span> {item.abk}
                          </td>
                          <td className="px-4 py-1 sm:py-2.5 text-left sm:text-right text-xs sm:text-sm text-blue-600 sm:table-cell">
                             <span className="inline-block w-32 sm:hidden text-muted-foreground">PNS:</span> {item.existing_pns}
                          </td>
                          <td className="px-4 py-1 sm:py-2.5 text-left sm:text-right text-xs sm:text-sm text-emerald-600 sm:table-cell">
                            <span className="inline-block w-32 sm:hidden text-muted-foreground">PPPK:</span> {item.existing_pppk}
                          </td>
                          <td className="px-4 py-1 sm:py-2.5 text-left sm:text-right text-xs sm:text-sm font-bold sm:table-cell">
                            <span className="inline-block w-32 sm:hidden text-muted-foreground font-normal">Total Eksisting:</span> {item.total_existing}
                            <span className="ml-2 text-xs text-muted-foreground font-normal">({percentage}%)</span>
                          </td>
                          <td className="px-4 py-1 sm:py-2.5 text-left sm:text-center text-xs sm:text-sm sm:table-cell">
                            <span className="inline-block w-32 sm:hidden text-muted-foreground font-normal">Status:</span>
                            {item.gap > 0 ? (
                              <span className="inline-block bg-orange-100 text-orange-800 px-2 py-1 rounded text-xs font-medium">
                                Kurang {item.gap}
                              </span>
                            ) : item.gap < 0 ? (
                              <span className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">
                                Lebih {Math.abs(item.gap)}
                              </span>
                            ) : (
                              <span className="inline-block bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium">
                                Sesuai
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </TabsContent>
        </Tabs>
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
           <EmptyChartState
             title="Tidak ada data penugasan/jabatan Non ASN"
             description="Belum ada data yang cocok untuk unit kerja ini. Coba cek filter unit kerja atau pastikan data Non ASN sudah diisi."
           />
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
