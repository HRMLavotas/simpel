import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, Building2 } from 'lucide-react';
import { logger } from '@/lib/logger';

interface DepartmentDistributionChartProps {
  userDepartment: string | null;
  isAdminPusat: boolean;
  selectedDepartment?: string;
}

interface DepartmentData {
  department: string;
  asn: number;
  nonAsn: number;
  total: number;
}

export function DepartmentDistributionChart({ 
  userDepartment, 
  isAdminPusat,
  selectedDepartment = 'all'
}: DepartmentDistributionChartProps) {
  const [activeTab, setActiveTab] = useState<'total' | 'asn' | 'non-asn'>('total');
  const [departmentData, setDepartmentData] = useState<DepartmentData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDepartmentData();
  }, [userDepartment, isAdminPusat, selectedDepartment]);

  const fetchDepartmentData = async () => {
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

      // Helper function to fetch all data with pagination
      const fetchAllData = async () => {
        const allData: any[] = [];
        let offset = 0;
        const batchSize = 1000;
        const maxRecords = 50000; // Safety limit

        while (true) {
          let query = supabase
            .from('employees')
            .select('department, asn_status')
            .eq('is_active', true)
            .range(offset, offset + batchSize - 1);

          if (departmentFilter) {
            query = query.eq('department', departmentFilter);
          }

          const { data, error: fetchError } = await query;
          if (fetchError) throw fetchError;
          if (!data || data.length === 0) break;
          
          allData.push(...data);
          
          if (allData.length >= maxRecords) {
            logger.warn(`Reached maximum record limit (${maxRecords}). Some data may not be loaded.`);
            break;
          }
          
          if (data.length < batchSize) break;
          offset += batchSize;
        }
        
        return allData;
      };

      const data = await fetchAllData();

      // Process data by department
      const deptMap: Record<string, { asn: number; nonAsn: number }> = {};
      
      data?.forEach((emp) => {
        if (!emp.department) return;
        
        if (!deptMap[emp.department]) {
          deptMap[emp.department] = { asn: 0, nonAsn: 0 };
        }

        // Count ASN (PNS, CPNS, PPPK) vs Non ASN
        if (emp.asn_status === 'Non ASN') {
          deptMap[emp.department].nonAsn++;
        } else {
          deptMap[emp.department].asn++;
        }
      });

      // Convert to array and calculate totals
      const processed: DepartmentData[] = Object.entries(deptMap)
        .map(([department, counts]) => ({
          department,
          asn: counts.asn,
          nonAsn: counts.nonAsn,
          total: counts.asn + counts.nonAsn,
        }))
        .sort((a, b) => b.total - a.total); // Sort by total descending

      setDepartmentData(processed);

      logger.debug('Department data loaded:', {
        departments: processed.length,
        totalEmployees: processed.reduce((sum, d) => sum + d.total, 0),
        recordsFetched: data.length,
      });
    } catch (err) {
      logger.error('Error fetching department data:', err);
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan saat memuat data');
    } finally {
      setIsLoading(false);
    }
  };

  const renderTable = (sortKey: 'total' | 'asn' | 'nonAsn') => {
    if (departmentData.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <AlertCircle className="h-12 w-12 mb-3 opacity-50" />
          <p className="text-sm">Tidak ada data unit kerja</p>
        </div>
      );
    }

    // Sort based on active tab
    const sortedData = [...departmentData].sort((a, b) => b[sortKey] - a[sortKey]);
    const totalCount = sortedData.reduce((sum, d) => sum + d[sortKey], 0);

    return (
      <div className="space-y-4">
        <div className="text-sm text-muted-foreground">
          Total: <span className="font-semibold text-foreground">{totalCount.toLocaleString('id-ID')}</span> pegawai
          {' • '}
          <span className="font-semibold text-foreground">{sortedData.length}</span> unit kerja
        </div>
        <div className="rounded-lg border shadow-sm overflow-hidden">
          <div className="max-h-[500px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/80 backdrop-blur-sm sticky top-0 z-10">
                <tr className="border-b">
                  <th className="px-4 py-3 text-left font-semibold text-muted-foreground w-12">
                    No
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-muted-foreground">
                    Unit Kerja
                  </th>
                  {sortKey === 'total' && (
                    <>
                      <th className="px-4 py-3 text-right font-semibold text-muted-foreground w-20">
                        ASN
                      </th>
                      <th className="px-4 py-3 text-right font-semibold text-muted-foreground w-24">
                        Non ASN
                      </th>
                    </>
                  )}
                  <th className="px-4 py-3 text-right font-semibold text-muted-foreground w-24">
                    Jumlah
                  </th>
                  <th className="px-4 py-3 text-right font-semibold text-muted-foreground w-24">
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
                    <td className="px-4 py-3 text-muted-foreground">
                      {i + 1}
                    </td>
                    <td className="px-4 py-3 font-medium">
                      {item.department}
                    </td>
                    {sortKey === 'total' && (
                      <>
                        <td className="px-4 py-3 text-right text-muted-foreground">
                          {item.asn.toLocaleString('id-ID')}
                        </td>
                        <td className="px-4 py-3 text-right text-muted-foreground">
                          {item.nonAsn.toLocaleString('id-ID')}
                        </td>
                      </>
                    )}
                    <td className="px-4 py-3 text-right font-medium">
                      {item[sortKey].toLocaleString('id-ID')}
                    </td>
                    <td className="px-4 py-3 text-right text-muted-foreground">
                      {totalCount > 0 ? ((item[sortKey] / totalCount) * 100).toFixed(1) : '0.0'}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <Card className="col-span-full">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[400px] w-full" />
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

  return (
    <Card className="col-span-full animate-fade-in hover:shadow-md transition-all duration-300">
      <CardHeader className="pb-3 border-b">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              Distribusi per Unit Kerja
            </CardTitle>
            <CardDescription>
              Distribusi pegawai berdasarkan unit kerja dan status kepegawaian
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'total' | 'asn' | 'non-asn')}>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
            <TabsList>
              <TabsTrigger value="total" className="text-xs sm:text-sm">
                Total ({departmentData.reduce((sum, d) => sum + d.total, 0)})
              </TabsTrigger>
              <TabsTrigger value="asn" className="text-xs sm:text-sm">
                ASN ({departmentData.reduce((sum, d) => sum + d.asn, 0)})
              </TabsTrigger>
              <TabsTrigger value="non-asn" className="text-xs sm:text-sm">
                Non-ASN ({departmentData.reduce((sum, d) => sum + d.nonAsn, 0)})
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="total" className="mt-0">
            {renderTable('total')}
          </TabsContent>

          <TabsContent value="asn" className="mt-0">
            {renderTable('asn')}
          </TabsContent>

          <TabsContent value="non-asn" className="mt-0">
            {renderTable('nonAsn')}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
