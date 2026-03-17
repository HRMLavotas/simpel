import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { AVAILABLE_COLUMNS } from './ColumnSelector';

interface DataPreviewTableProps {
  data: Record<string, unknown>[];
  selectedColumns: string[];
  currentPage: number;
  pageSize: number;
  totalCount: number;
  onPageChange: (page: number) => void;
}

export function DataPreviewTable({
  data,
  selectedColumns,
  currentPage,
  pageSize,
  totalCount,
  onPageChange,
}: DataPreviewTableProps) {
  const columns = AVAILABLE_COLUMNS.filter(c => selectedColumns.includes(c.key));
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

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
      </div>

      <div className="rounded-lg border overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">No</TableHead>
              {columns.map(col => (
                <TableHead key={col.key}>{col.label}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row, idx) => (
              <TableRow key={idx}>
                <TableCell className="text-muted-foreground">
                  {(currentPage - 1) * pageSize + idx + 1}
                </TableCell>
                {columns.map(col => (
                  <TableCell key={col.key}>{String(row[col.dbField] ?? '-')}</TableCell>
                ))}
              </TableRow>
            ))}
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
