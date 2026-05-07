import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';

export interface ResponsiveTableColumn<T> {
  key: keyof T;
  label: string;
  render?: (value: T[keyof T], row: T) => React.ReactNode;
  className?: string;
  mobileHidden?: boolean; // Hide on mobile (below md breakpoint)
}

export interface ResponsiveTableProps<T> {
  columns: ResponsiveTableColumn<T>[];
  data: T[];
  isLoading?: boolean;
  emptyState?: React.ReactNode;
  className?: string;
  cardClassName?: string;
  rowKey?: (row: T, index: number) => string | number;
  onRowClick?: (row: T) => void;
  renderActions?: (row: T) => React.ReactNode;
}

/**
 * ResponsiveTable Component
 * 
 * Automatically switches between:
 * - Desktop (md+): Full table with all columns
 * - Mobile (<md): Card view with selected columns
 * 
 * Usage:
 * ```tsx
 * <ResponsiveTable
 *   columns={[
 *     { key: 'name', label: 'Name' },
 *     { key: 'email', label: 'Email', mobileHidden: true },
 *   ]}
 *   data={employees}
 *   renderActions={(row) => <ActionsMenu row={row} />}
 * />
 * ```
 */
export function ResponsiveTable<T extends Record<string, unknown>>({
  columns,
  data,
  isLoading = false,
  emptyState,
  className,
  cardClassName,
  rowKey,
  onRowClick,
  renderActions,
}: ResponsiveTableProps<T>) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return emptyState || (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        <p>No data available</p>
      </div>
    );
  }

  // Get visible columns (exclude mobileHidden on mobile)
  const getVisibleColumns = (isMobile: boolean) => {
    return columns.filter(col => {
      if (isMobile && col.mobileHidden) {
        return false;
      }
      return true;
    });
  };

  return (
    <div className={className}>
      {/* Mobile View - Card Layout (hidden on md and up) */}
      <div className="md:hidden space-y-3">
        {data.map((row, index) => {
          const key = rowKey ? rowKey(row, index) : index;
          const visibleCols = getVisibleColumns(true);

          return (
            <Card
              key={key}
              className={cn(
                "cursor-pointer hover:shadow-md transition-shadow",
                onRowClick && "hover:bg-muted/50",
                cardClassName
              )}
              onClick={() => onRowClick?.(row)}
            >
              <CardContent className="pt-6 pb-4">
                <div className="space-y-3">
                  {visibleCols.map((column) => {
                    const value = row[column.key];
                    const displayValue = column.render ? column.render(value, row) : value;

                    return (
                      <div key={String(column.key)} className="flex flex-col gap-1">
                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                          {column.label}
                        </span>
                        <div className={cn("text-sm font-medium", column.className)}>
                          {displayValue || '—'}
                        </div>
                      </div>
                    );
                  })}

                  {renderActions && (
                    <div className="pt-2 border-t flex gap-2">
                      {renderActions(row)}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Desktop View - Table Layout (hidden on mobile) */}
      <div className="hidden md:block rounded-lg border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {getVisibleColumns(false).map((column) => (
                  <TableHead
                    key={String(column.key)}
                    className={cn("font-semibold", column.className)}
                  >
                    {column.label}
                  </TableHead>
                ))}
                {renderActions && <TableHead className="w-20">Aksi</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((row, index) => {
                const key = rowKey ? rowKey(row, index) : index;

                return (
                  <TableRow
                    key={key}
                    className={onRowClick ? "cursor-pointer hover:bg-muted/50" : undefined}
                    onClick={() => onRowClick?.(row)}
                  >
                    {getVisibleColumns(false).map((column) => {
                      const value = row[column.key];
                      const displayValue = column.render ? column.render(value, row) : value;

                      return (
                        <TableCell key={String(column.key)} className={column.className}>
                          {displayValue || '—'}
                        </TableCell>
                      );
                    })}
                    {renderActions && (
                      <TableCell className="flex gap-2">
                        {renderActions(row)}
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
