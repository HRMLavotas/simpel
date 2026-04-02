import { useState } from 'react';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { AVAILABLE_COLUMNS } from './ColumnSelector';
import { RELATED_DATA_TABLES } from './RelatedDataSelector';
import { ChevronDown, ChevronRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';

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
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [relatedData, setRelatedData] = useState<Map<string, Map<string, any[]>>>(new Map());
  const [loadingRelated, setLoadingRelated] = useState<Set<string>>(new Set());

  const columns = AVAILABLE_COLUMNS.filter(c => selectedColumns.includes(c.key));
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  const toggleRow = async (employeeId: string) => {
    const newExpanded = new Set(expandedRows);
    
    if (expandedRows.has(employeeId)) {
      newExpanded.delete(employeeId);
      setExpandedRows(newExpanded);
    } else {
      newExpanded.add(employeeId);
      setExpandedRows(newExpanded);

      // Fetch related data if not already loaded
      if (!relatedData.has(employeeId) && selectedRelatedTables.length > 0) {
        setLoadingRelated(new Set(loadingRelated).add(employeeId));
        
        try {
          const employeeRelatedData = new Map<string, any[]>();

          // Fetch all selected related tables
          await Promise.all(
            selectedRelatedTables.map(async (tableKey) => {
              const tableConfig = RELATED_DATA_TABLES.find(t => t.key === tableKey);
              if (!tableConfig) return;

              const { data: records, error } = await supabase
                .from(tableConfig.table)
                .select('*')
                .eq('employee_id', employeeId)
                .order('created_at', { ascending: true });

              if (!error && records) {
                employeeRelatedData.set(tableKey, records);
              }
            })
          );

          setRelatedData(new Map(relatedData).set(employeeId, employeeRelatedData));
        } catch (error) {
          console.error('Error fetching related data:', error);
        } finally {
          const newLoading = new Set(loadingRelated);
          newLoading.delete(employeeId);
          setLoadingRelated(newLoading);
        }
      }
    }
  };

  const formatValue = (value: any, fieldKey: string): string => {
    if (value === null || value === undefined) return '-';
    
    // Format dates
    if (fieldKey.includes('tanggal') || fieldKey === 'created_at' || fieldKey === 'tmt' || 
        fieldKey === 'birth_date' || fieldKey === 'join_date') {
      try {
        return new Date(value).toLocaleDateString('id-ID');
      } catch {
        return String(value);
      }
    }
    
    return String(value);
  };

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        Belum ada data. Pilih kolom dan klik "Tampilkan Data".
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground">
        Menampilkan {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, totalCount)} dari{' '}
        <span className="font-semibold text-foreground">{totalCount}</span> data
        {selectedRelatedTables.length > 0 && (
          <span className="ml-2 text-primary">
            (Klik baris untuk melihat {selectedRelatedTables.length} data relasi)
          </span>
        )}
      </div>

      <div className="rounded-lg border overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {selectedRelatedTables.length > 0 && <TableHead className="w-12"></TableHead>}
              <TableHead className="w-12">No</TableHead>
              {columns.map(col => (
                <TableHead key={col.key}>{col.label}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row, idx) => {
              const employeeId = row.id as string;
              const isExpanded = expandedRows.has(employeeId);
              const isLoading = loadingRelated.has(employeeId);
              const employeeRelations = relatedData.get(employeeId);

              return (
                <>
                  {/* Main employee row */}
                  <TableRow key={idx} className="hover:bg-muted/50">
                    {selectedRelatedTables.length > 0 && (
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => toggleRow(employeeId)}
                        >
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </Button>
                      </TableCell>
                    )}
                    <TableCell className="text-muted-foreground">
                      {(currentPage - 1) * pageSize + idx + 1}
                    </TableCell>
                    {columns.map(col => (
                      <TableCell key={col.key}>{String(row[col.dbField] ?? '-')}</TableCell>
                    ))}
                  </TableRow>

                  {/* Expanded related data */}
                  {isExpanded && (
                    <TableRow>
                      <TableCell 
                        colSpan={columns.length + (selectedRelatedTables.length > 0 ? 2 : 1)} 
                        className="bg-muted/30 p-4"
                      >
                        {isLoading ? (
                          <div className="flex items-center justify-center py-4">
                            <Loader2 className="h-5 w-5 animate-spin text-primary mr-2" />
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
                                  <div className="flex items-center gap-2">
                                    <Icon className="h-4 w-4 text-primary" />
                                    <h4 className="font-semibold text-sm">{tableConfig.label}</h4>
                                    <Badge variant="secondary" className="text-xs">
                                      {records.length} record
                                    </Badge>
                                  </div>

                                  {records.length === 0 ? (
                                    <p className="text-sm text-muted-foreground italic pl-6">
                                      Tidak ada data
                                    </p>
                                  ) : (
                                    <div className="pl-6 space-y-2">
                                      {records.map((record, recordIdx) => (
                                        <div 
                                          key={record.id || recordIdx} 
                                          className="p-3 rounded-md bg-background border text-sm"
                                        >
                                          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                            {tableConfig.fields.map(field => (
                                              <div key={field.key}>
                                                <span className="text-muted-foreground text-xs">
                                                  {field.label}:
                                                </span>
                                                <p className="font-medium">
                                                  {formatValue(record[field.key], field.key)}
                                                </p>
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
                </>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            disabled={currentPage <= 1}
            onClick={() => onPageChange(currentPage - 1)}
            className="rounded-md border px-3 py-1.5 text-sm disabled:opacity-40 hover:bg-muted transition-colors"
          >
            Sebelumnya
          </button>
          <span className="text-sm text-muted-foreground">
            Hal {currentPage} / {totalPages}
          </span>
          <button
            disabled={currentPage >= totalPages}
            onClick={() => onPageChange(currentPage + 1)}
            className="rounded-md border px-3 py-1.5 text-sm disabled:opacity-40 hover:bg-muted transition-colors"
          >
            Selanjutnya
          </button>
        </div>
      )}
    </div>
  );
}
