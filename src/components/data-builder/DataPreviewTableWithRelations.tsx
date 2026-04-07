import { Fragment, useRef, useState } from 'react';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { AVAILABLE_COLUMNS, formatEmployeeCellValue } from './ColumnSelector';
import { RELATED_DATA_TABLES } from './RelatedDataSelector';
import { ChevronDown, ChevronRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';

interface DataPreviewTableWithRelationsProps {
  data: Record<string, unknown>[];
  selectedColumns: string[];
  selectedRelatedTables: string[];
  currentPage: number;
  pageSize: number;
  totalCount: number;
  onPageChange: (page: number) => void;
}

export function DataPreviewTableWithRelations({
  data,
  selectedColumns,
  selectedRelatedTables,
  currentPage,
  pageSize,
  totalCount,
  onPageChange,
}: DataPreviewTableWithRelationsProps) {
  const { toast } = useToast();
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [relatedData, setRelatedData] = useState<Map<string, Map<string, Record<string, unknown>[]>>>(new Map());
  const relatedDataRef = useRef(relatedData);
  relatedDataRef.current = relatedData;

  const [loadingRelated, setLoadingRelated] = useState<Set<string>>(new Set());

  // Preserve user's column selection order
  const columns = selectedColumns
    .map(key => AVAILABLE_COLUMNS.find(c => c.key === key))
    .filter((c): c is NonNullable<typeof c> => c !== undefined);
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  const toggleRow = async (employeeId: string) => {
    if (!employeeId) {
      toast({
        title: 'ID pegawai tidak tersedia',
        description: 'Muat ulang data; kolom inti seharusnya menyertakan id dari server.',
        variant: 'destructive',
      });
      return;
    }

    if (expandedRows.has(employeeId)) {
      setExpandedRows(prev => {
        const next = new Set(prev);
        next.delete(employeeId);
        return next;
      });
      return;
    }

    setExpandedRows(prev => new Set(prev).add(employeeId));

    const alreadyLoaded = relatedDataRef.current.has(employeeId);
    if (alreadyLoaded || selectedRelatedTables.length === 0) {
      return;
    }

    setLoadingRelated(prev => new Set(prev).add(employeeId));

    try {
      const employeeRelatedData = new Map<string, Record<string, unknown>[]>();
      const failedTables: string[] = [];

      await Promise.all(
        selectedRelatedTables.map(async tableKey => {
          const tableConfig = RELATED_DATA_TABLES.find(t => t.key === tableKey);
          if (!tableConfig) return;

          const { data: records, error } = await supabase
            .from(tableConfig.table)
            .select('*')
            .eq('employee_id', employeeId)
            .order('created_at', { ascending: true });

          if (error) {
            failedTables.push(tableConfig.label);
            return;
          }
          if (records) {
            employeeRelatedData.set(tableKey, records as Record<string, unknown>[]);
          }
        })
      );

      if (failedTables.length > 0) {
        toast({
          title: 'Sebagian data relasi gagal dimuat',
          description: failedTables.join(', '),
          variant: 'destructive',
        });
      }

      setRelatedData(prev => new Map(prev).set(employeeId, employeeRelatedData));
    } catch (error) {
      logger.error('Error fetching related data:', error);
      toast({
        title: 'Gagal memuat data relasi',
        description: error instanceof Error ? error.message : 'Terjadi kesalahan.',
        variant: 'destructive',
      });
    } finally {
      setLoadingRelated(prev => {
        const next = new Set(prev);
        next.delete(employeeId);
        return next;
      });
    }
  };

  const formatValue = (value: unknown, fieldKey: string): string => {
    if (value === null || value === undefined) return '-';

    if (fieldKey.includes('tanggal') || fieldKey === 'created_at' || fieldKey === 'tmt') {
      try {
        return new Date(value as string).toLocaleDateString('id-ID');
      } catch {
        return String(value);
      }
    }

    return String(value);
  };

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-14 text-center text-muted-foreground px-4">
        <p>Belum ada data untuk ditampilkan.</p>
        <p className="text-sm max-w-md">
          Pilih kolom di panel kiri, sesuaikan filter bila perlu, lalu klik <strong>Tampilkan Data</strong>.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <span>
          Menampilkan {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, totalCount)} dari{' '}
          <span className="font-semibold text-foreground">{totalCount}</span> data
        </span>
        {selectedRelatedTables.length > 0 && (
          <span className="text-primary">
            — Klik baris untuk melihat {selectedRelatedTables.length} jenis data relasi
          </span>
        )}
      </div>

      <div className="rounded-lg border overflow-x-auto -mx-1 px-1 sm:mx-0 sm:px-0">
        <Table>
          <TableHeader>
            <TableRow>
              {selectedRelatedTables.length > 0 && <TableHead className="w-12" />}
              <TableHead className="w-12">No</TableHead>
              {columns.map(col => (
                <TableHead key={col.key} className="whitespace-nowrap">
                  {col.label}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row, idx) => {
              const employeeId = String(row.id ?? '');
              const isExpanded = expandedRows.has(employeeId);
              const isRowLoading = loadingRelated.has(employeeId);
              const employeeRelations = relatedData.get(employeeId);
              const rowKey = employeeId || `row-${idx}`;

              return (
                <Fragment key={rowKey}>
                  <TableRow className="hover:bg-muted/50">
                    {selectedRelatedTables.length > 0 && (
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          type="button"
                          onClick={() => void toggleRow(employeeId)}
                          aria-expanded={isExpanded}
                          aria-label={isExpanded ? 'Ciutkan detail' : 'Buka detail relasi'}
                        >
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </Button>
                      </TableCell>
                    )}
                    <TableCell className="text-muted-foreground tabular-nums">
                      {(currentPage - 1) * pageSize + idx + 1}
                    </TableCell>
                    {columns.map(col => (
                      <TableCell key={col.key} className="max-w-[min(280px,40vw)] truncate" title={formatEmployeeCellValue(row[col.dbField], col.dbField)}>
                        {formatEmployeeCellValue(row[col.dbField], col.dbField)}
                      </TableCell>
                    ))}
                  </TableRow>

                  {isExpanded && (
                    <TableRow>
                      <TableCell
                        colSpan={columns.length + (selectedRelatedTables.length > 0 ? 2 : 1)}
                        className="bg-muted/30 p-4"
                      >
                        {isRowLoading ? (
                          <div className="flex items-center justify-center gap-2 py-4">
                            <Loader2 className="h-5 w-5 animate-spin text-primary shrink-0" />
                            <span className="text-sm text-muted-foreground">Memuat data relasi...</span>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {selectedRelatedTables.map(tableKey => {
                              const tableConfig = RELATED_DATA_TABLES.find(t => t.key === tableKey);
                              if (!tableConfig) return null;

                              const records = employeeRelations?.get(tableKey) || [];
                              const Icon = tableConfig.icon;

                              return (
                                <div key={tableKey} className="space-y-2">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <Icon className="h-4 w-4 text-primary shrink-0" />
                                    <h4 className="font-semibold text-sm">{tableConfig.label}</h4>
                                    <Badge variant="secondary" className="text-xs">
                                      {records.length} record
                                    </Badge>
                                  </div>

                                  {records.length === 0 ? (
                                    <p className="text-sm text-muted-foreground italic pl-6">Tidak ada data</p>
                                  ) : (
                                    <div className="pl-2 sm:pl-6 space-y-2">
                                      {records.map((record, recordIdx) => (
                                        <div
                                          key={String(record.id ?? recordIdx)}
                                          className="p-3 rounded-md bg-background border text-sm"
                                        >
                                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                            {tableConfig.fields.map(field => (
                                              <div key={field.key} className="min-w-0">
                                                <span className="text-muted-foreground text-xs">{field.label}</span>
                                                <p className="font-medium break-words">{formatValue(record[field.key], field.key)}</p>
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  )}
                </Fragment>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-4">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={currentPage <= 1}
            onClick={() => onPageChange(currentPage - 1)}
            className="min-w-[7rem]"
          >
            Sebelumnya
          </Button>
          <span className="text-sm text-muted-foreground text-center tabular-nums">
            Hal {currentPage} / {totalPages}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={currentPage >= totalPages}
            onClick={() => onPageChange(currentPage + 1)}
            className="min-w-[7rem]"
          >
            Selanjutnya
          </Button>
        </div>
      )}
    </div>
  );
}
