import { useState, useCallback, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ColumnSelector, AVAILABLE_COLUMNS } from '@/components/data-builder/ColumnSelector';
import { FilterBuilder, FilterRule } from '@/components/data-builder/FilterBuilder';
import { DataPreviewTableWithRelations } from '@/components/data-builder/DataPreviewTableWithRelations';
import { DataStatistics } from '@/components/data-builder/DataStatistics';
import { RelatedDataSelector, RELATED_DATA_TABLES } from '@/components/data-builder/RelatedDataSelector';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { FileSpreadsheet, Search, Loader2, Table2, BarChart3, Database } from 'lucide-react';
import * as XLSX from 'xlsx';

type FilterableQuery = {
  eq: (field: string, value: string) => FilterableQuery;
  ilike: (field: string, value: string) => FilterableQuery;
};

const PAGE_SIZE = 50;
const DEFAULT_SELECTED_COLUMNS: string[] = [];
const FILTER_OPTIONS: Record<string, string[]> = {
  asn_status: ['PNS', 'PPPK', 'Non ASN'],
  position_type: ['Struktural', 'Fungsional', 'Pelaksana'],
  gender: ['Laki-laki', 'Perempuan'],
  religion: ['Islam', 'Kristen', 'Katolik', 'Hindu', 'Buddha', 'Konghucu'],
  rank_group: [
    'I/a', 'I/b', 'I/c', 'I/d',
    'II/a', 'II/b', 'II/c', 'II/d',
    'III/a', 'III/b', 'III/c', 'III/d',
    'IV/a', 'IV/b', 'IV/c', 'IV/d', 'IV/e',
  ],
};

const getDefaultFilterOperator = (field: string): FilterRule['operator'] => {
  return FILTER_OPTIONS[field] ? 'in' : 'ilike';
};

const isFilterRuleActive = (filter: FilterRule) => {
  if (filter.operator === 'in') {
    return (filter.values?.length || 0) > 0;
  }

  return filter.value.trim().length > 0;
};

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const buildFiltersForSelectedColumns = (selectedColumns: string[], existingFilters: FilterRule[] = []) => {
  const selectedDbFields = selectedColumns
    .map(key => AVAILABLE_COLUMNS.find(column => column.key === key)?.dbField)
    .filter(Boolean) as string[];

  return selectedDbFields.flatMap(field => {
    const generalFilter = existingFilters.find(filter => filter.kind === 'general' && filter.field === field);
    const advancedFilters = existingFilters.filter(filter => filter.kind === 'advanced' && filter.field === field);

    return [
      generalFilter || {
        id: crypto.randomUUID(),
        kind: 'general' as const,
        field,
        operator: getDefaultFilterOperator(field),
        value: '',
        values: [],
      },
      ...advancedFilters,
    ];
  });
};

export default function DataBuilder() {
  const { toast } = useToast();
  const [selectedColumns, setSelectedColumns] = useState<string[]>(DEFAULT_SELECTED_COLUMNS);
  const [selectedRelatedTables, setSelectedRelatedTables] = useState<string[]>([]);
  const [filters, setFilters] = useState<FilterRule[]>(() => buildFiltersForSelectedColumns(DEFAULT_SELECTED_COLUMNS));
  const [data, setData] = useState<Record<string, unknown>[]>([]);
  const [allData, setAllData] = useState<Record<string, unknown>[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [activeTab, setActiveTab] = useState('table');

  useEffect(() => {
    setFilters(currentFilters => buildFiltersForSelectedColumns(selectedColumns, currentFilters));
  }, [selectedColumns]);

  const buildQuery = useCallback(() => {
    const dbFields = selectedColumns
      .map(key => AVAILABLE_COLUMNS.find(c => c.key === key)?.dbField)
      .filter(Boolean) as string[];
    
    const selectStr = dbFields.length > 0 ? dbFields.join(',') : '*';
    return { selectStr, dbFields };
  }, [selectedColumns]);

  const applyFilters = (query: FilterableQuery) => {
    let q = query;
    for (const filter of filters) {
      if (!isFilterRuleActive(filter)) continue;
      if (filter.operator === 'exact_word' || filter.operator === 'in') continue;

      const value = filter.value.trim();
      if (!value) continue;
      
      if (filter.operator === 'eq') {
        q = q.eq(filter.field, value);
      } else if (filter.operator === 'ilike') {
        q = q.ilike(filter.field, `%${value}%`);
      }
    }
    return q;
  };

  const applyClientSideFilters = (rows: Record<string, unknown>[]) => {
    let filtered = rows;
    
    const exactWordFilters = filters.filter(filter => filter.operator === 'exact_word' && isFilterRuleActive(filter));
    
    for (const filter of exactWordFilters) {
      const searchValue = escapeRegExp(filter.value.trim().toLowerCase());
      filtered = filtered.filter(row => {
        const fieldValue = String(row[filter.field] || '').toLowerCase();
        const regex = new RegExp(`\\b${searchValue}\\b`, 'i');
        return regex.test(fieldValue);
      });
    }
    
    const inFilters = filters.filter(filter => filter.operator === 'in' && isFilterRuleActive(filter));
    
    for (const filter of inFilters) {
      filtered = filtered.filter(row => {
        const fieldValue = String(row[filter.field] || '').trim();
        return filter.values!.some(value => value.toLowerCase() === fieldValue.toLowerCase());
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

      const all: Record<string, unknown>[] = [];
      let offset = 0;
      const batchSize = 1000;

      while (true) {
        let q = supabase.from('employees').select(selectStr).range(offset, offset + batchSize - 1).order('name');
        q = applyFilters(q as unknown as FilterableQuery) as typeof q;
        const { data: batch, error } = await q;
        if (error) throw error;
        if (!batch || batch.length === 0) break;
        all.push(...(batch as unknown as Record<string, unknown>[]));
        if (batch.length < batchSize) break;
        offset += batchSize;
      }

      const filtered = applyClientSideFilters(all);

      setAllData(filtered);
      setTotalCount(filtered.length);
      setData(filtered.slice(0, PAGE_SIZE));
    } catch (error) {
      toast({
        title: 'Gagal mengambil data',
        description: error instanceof Error ? error.message : 'Terjadi kesalahan saat mengambil data.',
        variant: 'destructive',
      });
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
      const wb = XLSX.utils.book_new();
      const employeeIds = allData.map(emp => emp.id as string);
      const activeFilterCount = filters.filter(isFilterRuleActive).length;

      const columns = AVAILABLE_COLUMNS.filter(c => selectedColumns.includes(c.key));
      const exportData = allData.map((row, idx) => {
        const obj: Record<string, unknown> = { No: idx + 1 };
        columns.forEach(col => {
          obj[col.label] = row[col.dbField] ?? '-';
        });
        return obj;
      });
      const wsData = XLSX.utils.json_to_sheet(exportData);
      XLSX.utils.book_append_sheet(wb, wsData, 'Data Pegawai');

      if (selectedRelatedTables.length > 0) {
        for (const tableKey of selectedRelatedTables) {
          const tableConfig = RELATED_DATA_TABLES.find(t => t.key === tableKey);
          if (!tableConfig) continue;

          const { data: relatedData, error } = await supabase
            .from(tableConfig.table)
            .select('*')
            .in('employee_id', employeeIds)
            .order('created_at', { ascending: true });

          if (error) {
            console.error(`Error fetching ${tableConfig.table}:`, error);
            continue;
          }

          if (!relatedData || relatedData.length === 0) continue;

          const employeeMap = new Map(allData.map(emp => [emp.id as string, emp]));

          const relatedExportData = relatedData.map((record: Record<string, unknown>, idx: number) => {
            const employee = employeeMap.get(record.employee_id);
            const obj: Record<string, unknown> = {
              No: idx + 1,
              NIP: employee?.nip || '-',
              Nama: employee?.name || '-',
              'Unit Kerja': employee?.department || '-',
            };

            tableConfig.fields.forEach(field => {
              let value = record[field.key];
              if (field.key.includes('tanggal') || field.key === 'created_at' || field.key === 'tmt') {
                value = value ? new Date(value).toLocaleDateString('id-ID') : '-';
              }
              obj[field.label] = value ?? '-';
            });

            return obj;
          });

          const wsRelated = XLSX.utils.json_to_sheet(relatedExportData);
          const sheetName = tableConfig.label.substring(0, 31);
          XLSX.utils.book_append_sheet(wb, wsRelated, sheetName);
        }
      }

      const summaryData = [
        { Kategori: 'Total Pegawai', Nilai: allData.length },
        { Kategori: 'Kolom Dipilih', Nilai: selectedColumns.length },
        { Kategori: 'Data Relasi Dipilih', Nilai: selectedRelatedTables.length },
        { Kategori: 'Filter Aktif', Nilai: activeFilterCount },
      ];
      const wsSummary = XLSX.utils.json_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(wb, wsSummary, 'Ringkasan');

      const STAT_FIELDS = [
        { key: 'department', label: 'Unit Kerja' },
        { key: 'asn_status', label: 'Status ASN' },
        { key: 'position_type', label: 'Jenis Jabatan' },
        { key: 'rank_group', label: 'Pangkat/Golongan' },
        { key: 'gender', label: 'Jenis Kelamin' },
      ];

      const dataKeys = allData.length > 0 ? Object.keys(allData[0]) : [];
      const availableStats = STAT_FIELDS.filter(field => dataKeys.includes(field.key));

      availableStats.forEach(stat => {
        const counts: Record<string, number> = {};
        allData.forEach(row => {
          const val = String(row[stat.key] ?? 'Tidak Ada');
          counts[val] = (counts[val] || 0) + 1;
        });

        const statData = Object.entries(counts)
          .map(([name, value]) => ({
            [stat.label]: name,
            Jumlah: value,
            Persentase: `${((value / allData.length) * 100).toFixed(1)}%`,
          }))
          .sort((a, b) => b.Jumlah - a.Jumlah);

        if (statData.length > 0) {
          const wsStats = XLSX.utils.json_to_sheet(statData);
          const sheetName = `Stat ${stat.label}`.substring(0, 31);
          XLSX.utils.book_append_sheet(wb, wsStats, sheetName);
        }
      });

      const timestamp = new Date().toISOString().slice(0, 10);
      XLSX.writeFile(wb, `data-pegawai-${timestamp}.xlsx`);

      const totalSheets = 2 + selectedRelatedTables.length + availableStats.length;
      toast({ 
        title: `Export berhasil!`, 
        description: `${allData.length} pegawai dengan ${totalSheets} sheet (termasuk ${selectedRelatedTables.length} data relasi)` 
      });
    } catch (error) {
      toast({
        title: 'Gagal export',
        description: error instanceof Error ? error.message : 'Terjadi kesalahan saat export.',
        variant: 'destructive',
      });
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
              <FilterBuilder selectedColumns={selectedColumns} filters={filters} onChange={setFilters} />
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Database className="h-5 w-5 text-primary" />
              Data Relasi (Riwayat & Keterangan)
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Pilih data relasi yang ingin ditampilkan. Klik baris pegawai di preview untuk melihat detail riwayat.
              Data relasi juga akan di-export sebagai sheet terpisah di Excel.
            </p>
          </CardHeader>
          <CardContent>
            <RelatedDataSelector 
              selectedTables={selectedRelatedTables} 
              onChange={setSelectedRelatedTables} 
            />
          </CardContent>
        </Card>

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
                  <DataPreviewTableWithRelations
                    data={data}
                    selectedColumns={selectedColumns}
                    selectedRelatedTables={selectedRelatedTables}
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
