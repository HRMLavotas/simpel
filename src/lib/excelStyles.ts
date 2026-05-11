/**
 * Excel Styling Helper Functions
 * 
 * Provides consistent styling for all Excel exports in the application.
 * Uses xlsx-js-style for advanced styling capabilities.
 * 
 * @module excelStyles
 */

import * as XLSX from 'xlsx-js-style';

// Type definitions for better TypeScript support
type WorkSheet = XLSX.WorkSheet;
type WorkBook = XLSX.WorkBook;

// ═══════════════════════════════════════════════════════════════════════
// STYLE CONSTANTS
// ═══════════════════════════════════════════════════════════════════════

/**
 * Standard border style for all cells
 */
export const borderStyle = {
  top: { style: 'thin', color: { rgb: '000000' } },
  bottom: { style: 'thin', color: { rgb: '000000' } },
  left: { style: 'thin', color: { rgb: '000000' } },
  right: { style: 'thin', color: { rgb: '000000' } },
} as const;

/**
 * Header row style (blue background, white text, bold)
 * Use for main table headers
 */
export const headerStyle = {
  fill: { fgColor: { rgb: '4472C4' } }, // Blue
  font: { bold: true, color: { rgb: 'FFFFFF' }, sz: 11 },
  alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
  border: borderStyle,
};

/**
 * Category header style (orange/gold background, black text, bold)
 * Use for category separators (e.g., STRUKTURAL, FUNGSIONAL, PELAKSANA)
 */
export const categoryStyle = {
  fill: { fgColor: { rgb: 'FFC000' } }, // Orange/Gold
  font: { bold: true, color: { rgb: '000000' }, sz: 11 },
  alignment: { horizontal: 'center', vertical: 'center' },
  border: borderStyle,
};

/**
 * Data cell style (no fill, border, wrap text)
 * Use for regular data cells
 */
export const dataStyle = {
  alignment: { vertical: 'center', wrapText: true },
  border: borderStyle,
};

/**
 * Aggregation table header style (green background, white text, bold)
 * Use for aggregation/summary table headers
 */
export const aggHeaderStyle = {
  fill: { fgColor: { rgb: '70AD47' } }, // Green
  font: { bold: true, color: { rgb: 'FFFFFF' }, sz: 10 },
  alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
  border: borderStyle,
};

/**
 * Aggregation table data style (center aligned, border)
 * Use for aggregation/summary table data cells
 */
export const aggDataStyle = {
  alignment: { horizontal: 'center', vertical: 'center' },
  border: borderStyle,
};

/**
 * Aggregation table label style (bold, left aligned, border)
 * Use for aggregation/summary table row labels
 */
export const aggLabelStyle = {
  font: { bold: true, sz: 10 },
  alignment: { horizontal: 'left', vertical: 'center' },
  border: borderStyle,
};

/**
 * Total/summary row style (bold, yellow background)
 * Use for total/summary rows in tables
 */
export const totalRowStyle = {
  fill: { fgColor: { rgb: 'FFFF00' } }, // Yellow
  font: { bold: true, sz: 10 },
  alignment: { horizontal: 'center', vertical: 'center' },
  border: borderStyle,
};

// ═══════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════

/**
 * Apply styling to all cells in a worksheet
 * 
 * @param ws - Worksheet object from xlsx-js-style
 * @param options - Styling options
 * @param options.headerRow - Row index for header (default: 0)
 * @param options.categoryRows - Array of row indices for category headers
 * @param options.totalRows - Array of row indices for total/summary rows
 * @param options.startRow - Starting row for styling (default: from worksheet range)
 * @param options.endRow - Ending row for styling (default: from worksheet range)
 * @param options.startCol - Starting column for styling (default: from worksheet range)
 * @param options.endCol - Ending column for styling (default: from worksheet range)
 * 
 * @example
 * ```typescript
 * const ws = XLSX.utils.json_to_sheet(data);
 * applyWorksheetStyling(ws, {
 *   headerRow: 0,
 *   categoryRows: [1, 5, 10],
 *   totalRows: [15]
 * });
 * ```
 */
export function applyWorksheetStyling(
  ws: WorkSheet,
  options: {
    headerRow?: number;
    categoryRows?: number[];
    totalRows?: number[];
    startRow?: number;
    endRow?: number;
    startCol?: number;
    endCol?: number;
  } = {}
): void {
  const {
    headerRow = 0,
    categoryRows = [],
    totalRows = [],
    startRow,
    endRow,
    startCol,
    endCol,
  } = options;

  if (!ws['!ref']) return;

  const range = XLSX.utils.decode_range(ws['!ref']);
  const sRow = startRow ?? range.s.r;
  const eRow = endRow ?? range.e.r;
  const sCol = startCol ?? range.s.c;
  const eCol = endCol ?? range.e.c;

  for (let R = sRow; R <= eRow; ++R) {
    const isCategoryRow = categoryRows.includes(R);
    const isTotalRow = totalRows.includes(R);

    for (let C = sCol; C <= eCol; ++C) {
      const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });

      if (ws[cellAddress]) {
        if (R === headerRow) {
          ws[cellAddress].s = headerStyle;
        } else if (isCategoryRow) {
          ws[cellAddress].s = categoryStyle;
        } else if (isTotalRow) {
          ws[cellAddress].s = totalRowStyle;
        } else {
          ws[cellAddress].s = dataStyle;
        }
      }
    }
  }
}

/**
 * Apply styling to aggregation/summary table
 * 
 * @param ws - Worksheet object from xlsx-js-style
 * @param startRow - Starting row of aggregation table
 * @param endRow - Ending row of aggregation table
 * @param headerRows - Array of row indices for aggregation headers
 * @param options - Additional options
 * @param options.labelCol - Column index for labels (default: 0)
 * @param options.totalRows - Array of row indices for total rows
 * @param options.startCol - Starting column (default: 0)
 * @param options.endCol - Ending column (default: from worksheet range)
 * 
 * @example
 * ```typescript
 * const ws = XLSX.utils.json_to_sheet(data);
 * applyAggregationStyling(ws, 10, 20, [10, 11], {
 *   labelCol: 0,
 *   totalRows: [20]
 * });
 * ```
 */
export function applyAggregationStyling(
  ws: WorkSheet,
  startRow: number,
  endRow: number,
  headerRows: number[],
  options: {
    labelCol?: number;
    totalRows?: number[];
    startCol?: number;
    endCol?: number;
  } = {}
): void {
  const {
    labelCol = 0,
    totalRows = [],
    startCol = 0,
    endCol,
  } = options;

  if (!ws['!ref']) return;

  const range = XLSX.utils.decode_range(ws['!ref']);
  const eCol = endCol ?? range.e.c;

  for (let R = startRow; R <= endRow; ++R) {
    const isHeaderRow = headerRows.includes(R);
    const isTotalRow = totalRows.includes(R);

    for (let C = startCol; C <= eCol; ++C) {
      const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });

      if (ws[cellAddress]) {
        if (isHeaderRow) {
          ws[cellAddress].s = aggHeaderStyle;
        } else if (isTotalRow) {
          ws[cellAddress].s = totalRowStyle;
        } else if (C === labelCol) {
          ws[cellAddress].s = aggLabelStyle;
        } else {
          ws[cellAddress].s = aggDataStyle;
        }
      }
    }
  }
}

/**
 * Merge cells horizontally across columns
 * 
 * @param ws - Worksheet object
 * @param row - Row index to merge
 * @param startCol - Starting column index
 * @param endCol - Ending column index
 * 
 * @example
 * ```typescript
 * const ws = XLSX.utils.json_to_sheet(data);
 * mergeCellsHorizontal(ws, 0, 0, 5); // Merge A1:F1
 * ```
 */
export function mergeCellsHorizontal(
  ws: WorkSheet,
  row: number,
  startCol: number,
  endCol: number
): void {
  if (!ws['!merges']) ws['!merges'] = [];
  
  ws['!merges'].push({
    s: { r: row, c: startCol },
    e: { r: row, c: endCol },
  });
}

/**
 * Merge cells vertically across rows
 * 
 * @param ws - Worksheet object
 * @param col - Column index to merge
 * @param startRow - Starting row index
 * @param endRow - Ending row index
 * 
 * @example
 * ```typescript
 * const ws = XLSX.utils.json_to_sheet(data);
 * mergeCellsVertical(ws, 0, 1, 5); // Merge A2:A6
 * ```
 */
export function mergeCellsVertical(
  ws: WorkSheet,
  col: number,
  startRow: number,
  endRow: number
): void {
  if (!ws['!merges']) ws['!merges'] = [];
  
  ws['!merges'].push({
    s: { r: startRow, c: col },
    e: { r: endRow, c: col },
  });
}

/**
 * Set column widths for a worksheet
 * 
 * @param ws - Worksheet object
 * @param widths - Array of column widths in characters
 * 
 * @example
 * ```typescript
 * const ws = XLSX.utils.json_to_sheet(data);
 * setColumnWidths(ws, [5, 30, 20, 15]); // Set widths for columns A-D
 * ```
 */
export function setColumnWidths(ws: WorkSheet, widths: number[]): void {
  ws['!cols'] = widths.map(wch => ({ wch }));
}

/**
 * Apply styling to category header rows and merge cells across all columns
 * 
 * @param ws - Worksheet object
 * @param categoryRows - Array of row indices for category headers
 * @param numColumns - Total number of columns to merge (default: from worksheet range)
 * 
 * @example
 * ```typescript
 * const ws = XLSX.utils.json_to_sheet(data);
 * applyCategoryHeaders(ws, [1, 5, 10], 15); // Merge category headers across 15 columns
 * ```
 */
export function applyCategoryHeaders(
  ws: WorkSheet,
  categoryRows: number[],
  numColumns?: number
): void {
  if (!ws['!ref']) return;

  const range = XLSX.utils.decode_range(ws['!ref']);
  const endCol = numColumns ? numColumns - 1 : range.e.c;

  if (!ws['!merges']) ws['!merges'] = [];

  categoryRows.forEach(rowIdx => {
    // Merge across all columns
    ws['!merges']!.push({
      s: { r: rowIdx, c: 0 },
      e: { r: rowIdx, c: endCol },
    });

    // Apply category style to all cells in the row
    for (let C = 0; C <= endCol; ++C) {
      const cellAddress = XLSX.utils.encode_cell({ r: rowIdx, c: C });
      if (ws[cellAddress]) {
        ws[cellAddress].s = categoryStyle;
      }
    }
  });
}

/**
 * Create a styled worksheet from JSON data with automatic styling
 * 
 * @param data - Array of objects to convert to worksheet
 * @param options - Styling options
 * @returns Styled worksheet
 * 
 * @example
 * ```typescript
 * const data = [
 *   { No: 1, Nama: 'John', Jabatan: 'Staff' },
 *   { No: 2, Nama: 'Jane', Jabatan: 'Manager' }
 * ];
 * const ws = createStyledWorksheet(data, {
 *   columnWidths: [5, 30, 20],
 *   categoryRows: []
 * });
 * ```
 */
export function createStyledWorksheet(
  data: unknown[],
  options: {
    columnWidths?: number[];
    categoryRows?: number[];
    totalRows?: number[];
    headerRow?: number;
  } = {}
): WorkSheet {
  const ws = XLSX.utils.json_to_sheet(data);

  // Apply column widths if provided
  if (options.columnWidths) {
    setColumnWidths(ws, options.columnWidths);
  }

  // Apply styling
  applyWorksheetStyling(ws, {
    headerRow: options.headerRow ?? 0,
    categoryRows: options.categoryRows ?? [],
    totalRows: options.totalRows ?? [],
  });

  // Apply category header merging if provided
  if (options.categoryRows && options.categoryRows.length > 0) {
    applyCategoryHeaders(ws, options.categoryRows);
  }

  return ws;
}

/**
 * Export workbook with compression
 * 
 * @param wb - Workbook object
 * @param filename - Output filename
 * 
 * @example
 * ```typescript
 * const wb = XLSX.utils.book_new();
 * XLSX.utils.book_append_sheet(wb, ws, 'Data');
 * exportWorkbook(wb, 'data-export.xlsx');
 * ```
 */
export function exportWorkbook(wb: WorkBook, filename: string): void {
  XLSX.writeFile(wb, filename, { bookType: 'xlsx', compression: true });
}
