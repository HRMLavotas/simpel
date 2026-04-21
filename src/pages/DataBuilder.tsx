import { useState, useCallback, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ColumnSelector, AVAILABLE_COLUMNS, formatEmployeeCellValue } from '@/components/data-builder/ColumnSelector';
import { FilterBuilder, FilterRule } from '@/components/data-builder/FilterBuilder';
import { DataPreviewTableWithRelations } from '@/components/data-builder/DataPreviewTableWithRelations';
import { DataStatistics } from '@/components/data-builder/DataStatistics';
import { RelatedDataSelector, RELATED_DATA_TABLES } from '@/components/data-builder/RelatedDataSelector';
import { QueryTemplates, QueryTemplate } from '@/components/data-builder/QueryTemplates';
import { QuickAggregation } from '@/components/data-builder/QuickAggregation';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { FileSpreadsheet, Search, Loader2, Table2, BarChart3, Database, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import * as XLSX from 'xlsx';
import { logger } from '@/lib/logger';
import { randomId } from '@/lib/utils';

/** Excel melarang karakter \ / * ? : [ ] pada nama sheet — tanpa sanitasi, export gagal diam-diam */
const EXCEL_SHEET_NAME_MAX = 31;

function allocateExcelSheetName(raw: string, used: Set<string>): string {
  let s = raw
    .replace(/[\\/*?:\[\]]/g, '-')
    .replace(/\s+/g, ' ')
    .trim();
  if (!s) s = 'Sheet';
  s = s.slice(0, EXCEL_SHEET_NAME_MAX);
  let candidate = s;
  let n = 2;
  while (used.has(candidate)) {
    const suffix = ` (${n})`;
    const headLen = Math.max(1, EXCEL_SHEET_NAME_MAX - suffix.length);
    candidate = (s.slice(0, headLen) + suffix).slice(0, EXCEL_SHEET_NAME_MAX);
    n++;
  }
  used.add(candidate);
  return candidate;
}

/** Supabase/PostgREST membatasi panjang query; .in() dengan ribuan UUID sering gagal */
const RELATED_EXPORT_ID_CHUNK = 120;

/** Field inti pegawai — selalu di-select agar relasi, pagination, dan export konsisten */
const EMPLOYEE_BASE_SELECT_FIELDS = ['id', 'nip', 'name', 'department'] as const;

type FilterableQuery = {
  eq: (field: string, value: string) => FilterableQuery;
  ilike: (field: string, value: string) => FilterableQuery;
  in: (field: string, values: string[]) => FilterableQuery;
};

const PAGE_SIZE = 50;
const DEFAULT_SELECTED_COLUMNS: string[] = [];
const FILTER_OPTIONS: Record<string, string[]> = {
  asn_status: ['PNS', 'CPNS', 'PPPK', 'Non ASN'],
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
  return (FILTER_OPTIONS[field] || field === 'department') ? 'in' : 'ilike';
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
        id: randomId(),
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
  const { profile, role, canViewAll } = useAuth();
  const isAdminUnit = role === 'admin_unit';
  // Restrict data to own department if not allowed to view all
  const shouldFilterByDepartment = !canViewAll && profile?.department;
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

    const merged = [...new Set([...EMPLOYEE_BASE_SELECT_FIELDS, ...dbFields])];
    const selectStr = merged.join(',');
    return { selectStr, dbFields: merged };
  }, [selectedColumns]);

  const applyFilters = (query: FilterableQuery) => {
    let q = query;
    for (const filter of filters) {
      if (!isFilterRuleActive(filter)) continue;

      if (filter.operator === 'in') {
        const vals = filter.values?.filter(Boolean) ?? [];
        if (vals.length === 0) continue;
        q = q.in(filter.field, vals);
        continue;
      }

      const value = filter.value.trim();
      if (!value) continue;

      if (filter.operator === 'exact_word') {
        // Pre-filter pada level server (Supabase) dengan ilike untuk menghindari O.O.M (Out of Memory)
        // Kueri akan sangat spesifik (tersaring substring) sebelum di-refine lebih lanjut di client-side dengan RegExp \b
        q = q.ilike(filter.field, `%${value}%`);
      } else if (filter.operator === 'eq') {
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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let q: any = supabase.from('employees').select(selectStr);
        q = applyFilters(q as FilterableQuery);
        // Batasi data ke unit kerja sendiri jika bukan admin yang bisa lihat semua
        if (shouldFilterByDepartment) {
          q = q.eq('department', profile!.department);
        }
        q = q.range(offset, offset + batchSize - 1).order('name');
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
      logger.error('[DataBuilder] Gagal mengambil data:', error);
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

  const handleApplyTemplate = (template: QueryTemplate) => {
    setSelectedColumns(template.columns);
    setFilters(template.filters);
    setSelectedRelatedTables(template.relatedTables);
  };

  const exportToExcel = async () => {
    if (allData.length === 0) {
      toast({ title: 'Tidak ada data untuk diexport', variant: 'destructive' });
      return;
    }

    // Batasi export ke unit kerja sendiri jika bukan admin yang bisa lihat semua
    if (shouldFilterByDepartment) {
      const hasOtherDept = allData.some(row => row.department && row.department !== profile!.department);
      if (hasOtherDept) {
        toast({ title: 'Akses ditolak', description: 'Anda hanya dapat mengexport data unit kerja Anda sendiri.', variant: 'destructive' });
        return;
      }
    }

    setIsExporting(true);
    try {
      const wb = XLSX.utils.book_new();
      const sheetNamesUsed = new Set<string>();
      const mainSheetName = allocateExcelSheetName('Data Pegawai', sheetNamesUsed);
      const summarySheetName = allocateExcelSheetName('Ringkasan', sheetNamesUsed);

      const employeeIds = allData
        .map(emp => emp.id)
        .filter((id): id is string => typeof id === 'string' && id.length > 0);
      const activeFilterCount = filters.filter(isFilterRuleActive).length;

      const columns = selectedColumns
        .map(key => AVAILABLE_COLUMNS.find(c => c.key === key))
        .filter((c): c is NonNullable<typeof c> => c !== undefined);
      const exportData = allData.map((row, idx) => {
        const obj: Record<string, unknown> = { No: idx + 1 };
        columns.forEach(col => {
          const raw = row[col.dbField];
          if (col.category === 'dates' && raw != null && raw !== '') {
            obj[col.label] = formatEmployeeCellValue(raw, col.dbField);
          } else {
            obj[col.label] = raw ?? '-';
          }
        });
        return obj;
      });
      const wsData = XLSX.utils.json_to_sheet(exportData);
      XLSX.utils.book_append_sheet(wb, wsData, mainSheetName);

      const exportRelationErrors: string[] = [];

      if (selectedRelatedTables.length > 0 && employeeIds.length > 0) {
        for (const tableKey of selectedRelatedTables) {
          const tableConfig = RELATED_DATA_TABLES.find(t => t.key === tableKey);
          if (!tableConfig) continue;

          const relatedMerged: Record<string, unknown>[] = [];
          let batchError: Error | null = null;

          for (let offset = 0; offset < employeeIds.length; offset += RELATED_EXPORT_ID_CHUNK) {
            const chunk = employeeIds.slice(offset, offset + RELATED_EXPORT_ID_CHUNK);
            const { data: batch, error } = await supabase
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              .from(tableConfig.table as any)
              .select('*')
              .in('employee_id', chunk);

            if (error) {
              batchError = new Error(error.message);
              logger.error(`[DataBuilder export] ${tableConfig.table}:`, error);
              break;
            }
            if (batch?.length) {
              relatedMerged.push(...(batch as unknown as Record<string, unknown>[]));
            }
          }

          if (batchError) {
            exportRelationErrors.push(tableConfig.label);
            continue;
          }

          relatedMerged.sort((a, b) => {
            const ta = new Date(String(a.created_at ?? 0)).getTime();
            const tb = new Date(String(b.created_at ?? 0)).getTime();
            return ta - tb;
          });

          if (relatedMerged.length === 0) continue;

          const employeeMap = new Map(
            allData.map(emp => [String(emp.id), emp] as [string, Record<string, unknown>])
          );

          const relatedExportData = relatedMerged.map((record: Record<string, unknown>, idx: number) => {
            const employee = employeeMap.get(String(record.employee_id));
            const obj: Record<string, unknown> = {
              No: idx + 1,
              NIP: employee?.nip || '-',
              Nama: employee?.name || '-',
              'Unit Kerja': employee?.department || '-',
            };

            tableConfig.fields.forEach(field => {
              let value = record[field.key];
              if (field.key.includes('tanggal') || field.key === 'created_at' || field.key === 'tmt') {
                value = value ? new Date(value as string | number | Date).toLocaleDateString('id-ID') : '-';
              }
              obj[field.label] = value ?? '-';
            });

            return obj;
          });

          const wsRelated = XLSX.utils.json_to_sheet(relatedExportData);
          const sheetName = allocateExcelSheetName(tableConfig.label, sheetNamesUsed);
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
      XLSX.utils.book_append_sheet(wb, wsSummary, summarySheetName);

      // Fields to exclude from statistics
      const EXCLUDE_FROM_STATS = ['id', 'created_at', 'updated_at', 'import_order'];
      const DATE_FIELDS = ['birth_date', 'join_date', 'tmt_cpns', 'tmt_pns', 'tmt_pensiun'];

      const dataKeys = allData.length > 0 ? Object.keys(allData[0]) : [];
      
      // Generate stats for all selected columns that are categorical
      const availableStats = selectedColumns
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
          
          // Check if field has reasonable number of unique values
          const uniqueValues = new Set(allData.map(row => String(row[col.dbField] ?? '')));
          // Skip fields with too many unique values (likely identifiers) or too few (all same)
          if (uniqueValues.size > 100 || uniqueValues.size <= 1) {
            return null;
          }
          
          return {
            key: col.dbField,
            label: col.label,
          };
        })
        .filter((stat): stat is { key: string; label: string } => stat !== null);

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
          const statSheetName = allocateExcelSheetName(`Stat ${stat.label}`, sheetNamesUsed);
          XLSX.utils.book_append_sheet(wb, wsStats, statSheetName);
        }
      });

      const timestamp = new Date().toISOString().slice(0, 10);
      const fileName = `data-pegawai-${timestamp}.xlsx`;
      
      // Menggunakan bawaan XLSX dengan opsi spesifik untuk memaksa encoding Excel tulen
      XLSX.writeFile(wb, fileName, { bookType: 'xlsx', compression: true });

      const totalSheets = 2 + (selectedRelatedTables.length - exportRelationErrors.length) + availableStats.length;
      toast({
        title: 'Export berhasil',
        description:
          exportRelationErrors.length === 0
            ? `${allData.length} pegawai, ${totalSheets} sheet (termasuk data relasi & ringkasan).`
            : `${allData.length} pegawai diunduh. Beberapa sheet relasi tidak dibuat: ${exportRelationErrors.join(', ')}.`,
        variant: 'default',
      });
    } catch (error) {
      logger.error('[DataBuilder export] Gagal export:', error);
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
        <div className="page-header flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="page-title flex items-center gap-2">
              <FileSpreadsheet className="h-7 w-7 text-primary" />
              Data Builder
            </h1>
            <p className="page-description max-w-2xl">
              Pilih kolom dan filter, lalu muat data dari tabel <code className="text-xs bg-muted px-1 rounded">employees</code>.
              Preview mendukung data relasi; export menghasilkan workbook Excel multi-sheet.
            </p>
          </div>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Query Templates</CardTitle>
          </CardHeader>
          <CardContent>
            <QueryTemplates
              onApplyTemplate={handleApplyTemplate}
              currentColumns={selectedColumns}
              currentFilters={filters}
              currentRelatedTables={selectedRelatedTables}
            />
          </CardContent>
        </Card>

        <Separator className="opacity-60" />

        <div className="grid gap-6 grid-cols-1 xl:grid-cols-2">
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

        <Separator className="opacity-60" />

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

        <div className="sticky top-16 z-30 flex flex-col gap-3 sm:flex-row sm:items-center bg-background/95 backdrop-blur-md p-4 rounded-xl border shadow-sm my-6 transition-all duration-300 hover:shadow-md">
          <Button onClick={fetchData} disabled={isLoading} size="lg" className="gap-2 w-full sm:w-auto font-medium">
            {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Search className="h-5 w-5" />}
            Tampilkan Data
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={exportToExcel}
            disabled={isExporting || allData.length === 0}
            className="gap-2 w-full sm:w-auto font-medium hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 transition-colors"
          >
            {isExporting ? <Loader2 className="h-5 w-5 animate-spin" /> : <FileSpreadsheet className="h-5 w-5 text-emerald-600" />}
            Export Excel
          </Button>
          {selectedColumns.length === 0 ? (
            <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 px-3 py-2 rounded-lg border border-amber-200 sm:ml-auto">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
              </span>
              Pilih minimal satu kolom untuk memuat data.
            </div>
          ) : (
            <p className="text-sm text-muted-foreground sm:ml-auto">
              Total <b>{allData.length}</b> baris siap ditampilkan atau diexport.
            </p>
          )}
        </div>

        <Card>
          <CardHeader className="pb-2 border-b">
            <CardTitle className="text-base">Hasil</CardTitle>
            <p className="text-sm text-muted-foreground font-normal">
              Tab Tabel untuk preview dan pagination; tab Statistik untuk distribusi field yang termuat.
            </p>
          </CardHeader>
          <CardContent className="pt-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-4 w-full sm:w-auto flex flex-wrap h-auto gap-1 p-1">
                <TabsTrigger value="table" className="gap-2">
                  <Table2 className="h-4 w-4" />
                  Tabel Data
                </TabsTrigger>
                <TabsTrigger value="statistics" className="gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Statistik
                </TabsTrigger>
                <TabsTrigger value="quick" className="gap-2">
                  <Zap className="h-4 w-4" />
                  Agregasi Cepat
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

              <TabsContent value="quick">
                <QuickAggregation />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
