import { useState, useCallback } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ColumnSelector, AVAILABLE_COLUMNS } from '@/components/data-builder/ColumnSelector';
import { FilterBuilder, FilterRule } from '@/components/data-builder/FilterBuilder';
import { DataPreviewTable } from '@/components/data-builder/DataPreviewTable';
import { DataStatistics } from '@/components/data-builder/DataStatistics';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { FileSpreadsheet, Search, Loader2, Table2, BarChart3 } from 'lucide-react';
import * as XLSX from 'xlsx';

const PAGE_SIZE = 50;

export default function DataBuilder() {
  const { toast } = useToast();
  const [selectedColumns, setSelectedColumns] = useState<string[]>(['name', 'nip', 'department', 'position_type', 'position_sk', 'position_name']);
  const [filters, setFilters] = useState<FilterRule[]>([]);
  const [data, setData] = useState<Record<string, unknown>[]>([]);
  const [allData, setAllData] = useState<Record<string, unknown>[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [activeTab, setActiveTab] = useState('table');

  const buildQuery = useCallback(() => {
    const dbFields = selectedColumns.map(
      key => AVAILABLE_COLUMNS.find(c => c.key === key)?.dbField
    ).filter(Boolean) as string[];
    const selectStr = dbFields.length > 0 ? dbFields.join(',') : '*';
    return { selectStr, dbFields };
  }, [selectedColumns]);

  const applyFilters = (query: ReturnType<typeof supabase.from>) => {
    let q = query;
    for (const f of filters) {
      if (!f.value.trim()) continue;
      // Skip exact_word filters here - they'll be applied client-side
      if (f.operator === 'exact_word') continue;
      
      if (f.operator === 'eq') {
        q = q.eq(f.field, f.value.trim()) as typeof q;
      } else if (f.operator === 'ilike') {
        q = q.ilike(f.field, `%${f.value.trim()}%`) as typeof q;
      }
    }
    return q;
  };

  const applyClientSideFilters = (data: Record<string, unknown>[]) => {
    let filtered = data;
    
    // Apply exact_word filters client-side
    const exactWordFilters = filters.filter(f => f.operator === 'exact_word' && f.value.trim());
    
    for (const f of exactWordFilters) {
      const searchValue = f.value.trim().toLowerCase();
      filtered = filtered.filter(row => {
        const fieldValue = String(row[f.field] || '').toLowerCase();
        // Use word boundary regex to match whole words only
        const regex = new RegExp(`\\b${searchValue}\\b`, 'i');
        return regex.test(fieldValue);
      });
    }
    
    return filtered;
  };

  const fetchData = async () => {
    if (selectedColumns.length === 0) {
      toast({ title: 'Pilih minimal satu kolom', variant: 'destructive' });
      return;
    }

    setIsLoading(true);
    setCurrentPage(1);

    try {
      const { selectStr } = buildQuery();

      // Note: We can't get accurate count with client-side filters, so we fetch all data first
      const all: Record<string, unknown>[] = [];
      let offset = 0;
      const batchSize = 1000;

      while (true) {
        let q = supabase.from('employees').select(selectStr).range(offset, offset + batchSize - 1).order('name');
        q = applyFilters(q as any) as any;
        const { data: batch, error } = await q;
        if (error) throw error;
        if (!batch || batch.length === 0) break;
        all.push(...(batch as unknown as Record<string, unknown>[]));
        if (batch.length < batchSize) break;
        offset += batchSize;
      }

      // Apply client-side filters (for exact_word operator)
      const filtered = applyClientSideFilters(all);

      setAllData(filtered);
      setTotalCount(filtered.length);
      setData(filtered.slice(0, PAGE_SIZE));
    } catch (error: any) {
      toast({ title: 'Gagal mengambil data', description: error.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    setData(allData.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE));
  };

  const exportToExcel = async () => {
    if (allData.length === 0) {
      toast({ title: 'Tidak ada data untuk diexport', variant: 'destructive' });
      return;
    }

    setIsExporting(true);
    try {
      const columns = AVAILABLE_COLUMNS.filter(c => selectedColumns.includes(c.key));
      const exportData = allData.map((row, idx) => {
        const obj: Record<string, unknown> = { No: idx + 1 };
        columns.forEach(col => {
          obj[col.label] = row[col.dbField] ?? '-';
        });
        return obj;
      });

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Data Pegawai');

      const timestamp = new Date().toISOString().slice(0, 10);
      XLSX.writeFile(wb, `data-pegawai-${timestamp}.xlsx`);

      toast({ title: `${allData.length} data berhasil diexport` });
    } catch (error: any) {
      toast({ title: 'Gagal export', description: error.message, variant: 'destructive' });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="page-header">
          <h1 className="page-title flex items-center gap-2">
            <FileSpreadsheet className="h-7 w-7 text-primary" />
            Data Builder
          </h1>
          <p className="page-description">
            Bangun query data pegawai secara custom, preview hasilnya, lalu export ke Excel atau lihat statistiknya.
          </p>
        </div>

        <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Pilih Kolom</CardTitle>
            </CardHeader>
            <CardContent>
              <ColumnSelector selectedColumns={selectedColumns} onChange={setSelectedColumns} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Filter Data</CardTitle>
            </CardHeader>
            <CardContent>
              <FilterBuilder filters={filters} onChange={setFilters} />
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex gap-3 flex-wrap">
          <Button onClick={fetchData} disabled={isLoading} className="gap-2">
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            Tampilkan Data
          </Button>
          <Button variant="outline" onClick={exportToExcel} disabled={isExporting || allData.length === 0} className="gap-2">
            {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileSpreadsheet className="h-4 w-4" />}
            Export Excel
          </Button>
        </div>

        {/* Results with Tabs */}
        <Card>
          <CardContent className="pt-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-4">
                <TabsTrigger value="table" className="gap-2">
                  <Table2 className="h-4 w-4" />
                  Tabel Data
                </TabsTrigger>
                <TabsTrigger value="statistics" className="gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Statistik
                </TabsTrigger>
              </TabsList>

              <TabsContent value="table">
                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <DataPreviewTable
                    data={data}
                    selectedColumns={selectedColumns}
                    currentPage={currentPage}
                    pageSize={PAGE_SIZE}
                    totalCount={totalCount}
                    onPageChange={handlePageChange}
                  />
                )}
              </TabsContent>

              <TabsContent value="statistics">
                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <DataStatistics data={allData} selectedColumns={selectedColumns} />
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
