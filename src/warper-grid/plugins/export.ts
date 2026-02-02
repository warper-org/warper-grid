import type { 
  RowData, 
  GridPlugin, 
  GridApi, 
  ExportPluginConfig,
  ColumnDef,
  CellValue,
} from '../types';
import { LARGE_DATASET_THRESHOLD } from '../constants';

// ============================================================================
// Export Format Types
// ============================================================================

export type ExportFormat = 'csv' | 'excel' | 'json' | 'pdf';

export interface ExcelExportOptions {
  /** Sheet name */
  sheetName?: string;
  /** Include styling */
  includeStyles?: boolean;
  /** Header background color */
  headerBgColor?: string;
  /** Header text color */
  headerTextColor?: string;
  /** Alternate row color */
  alternateRowColor?: string;
  /** Auto-fit column widths */
  autoWidth?: boolean;
}

export interface PdfExportOptions {
  /** Page orientation */
  orientation?: 'portrait' | 'landscape';
  /** Page size */
  pageSize?: 'A4' | 'A3' | 'Letter' | 'Legal';
  /** Title at top of PDF */
  title?: string;
  /** Include header row */
  includeHeader?: boolean;
  /** Font size */
  fontSize?: number;
  /** Header background color */
  headerBgColor?: string;
  /** Alternate row colors */
  alternateRowColors?: boolean;
}

export interface JsonExportOptions {
  /** Pretty print with indentation */
  pretty?: boolean;
  /** Include column metadata */
  includeMetadata?: boolean;
}

// ============================================================================
// Export Utilities - Performance Optimized
// ============================================================================

// Pre-compiled regex for CSV escaping - avoid repeated regex creation
const CSV_ESCAPE_REGEX = /[",\n\r]/;
const QUOTE_REGEX = /"/g;

/**
 * Escape CSV value - Optimized with regex pre-check
 */
export function escapeCsvValue(value: CellValue): string {
  const strValue = value == null ? '' : String(value);
  
  // Fast path: no escaping needed (single regex test vs 4 includes calls)
  if (!CSV_ESCAPE_REGEX.test(strValue)) {
    return strValue;
  }
  
  // Escape quotes and wrap in quotes
  return `"${strValue.replace(QUOTE_REGEX, '""')}"`;
}

/**
 * Convert data to CSV string - Performance Optimized
 * Uses pre-allocated arrays and avoids repeated closures
 */
export function dataToCSV<TData extends RowData>(
  data: TData[],
  columns: ColumnDef<TData>[],
  options: {
    includeHeaders?: boolean;
    columnSeparator?: string;
    getValue?: (row: TData, colId: string) => CellValue;
  } = {}
): string {
  const { includeHeaders = true, columnSeparator = ',', getValue } = options;
  
  const visibleColumns = columns.filter(c => !c.hide);
  const colCount = visibleColumns.length;
  const rowCount = data.length;
  
  // Pre-allocate result array for exact size
  const totalRows = rowCount + (includeHeaders ? 1 : 0);
  const rows: string[] = new Array(totalRows);
  let rowIndex = 0;

  // Header row
  if (includeHeaders) {
    const headerValues = new Array<string>(colCount);
    for (let i = 0; i < colCount; i++) {
      const col = visibleColumns[i];
      headerValues[i] = escapeCsvValue(col.headerName || col.id);
    }
    rows[rowIndex++] = headerValues.join(columnSeparator);
  }

  // Pre-allocate row values array (reused across rows)
  const rowValues = new Array<string>(colCount);

  // Data rows - use indexed loops for better performance
  for (let r = 0; r < rowCount; r++) {
    const row = data[r];
    
    for (let c = 0; c < colCount; c++) {
      const col = visibleColumns[c];
      let value: CellValue;
      
      if (getValue) {
        value = getValue(row, col.id);
      } else if (col.field) {
        value = (row as Record<string, unknown>)[col.field as string] as CellValue;
      } else {
        value = '';
      }
      
      rowValues[c] = escapeCsvValue(value);
    }
    
    rows[rowIndex++] = rowValues.join(columnSeparator);
  }

  return rows.join('\n');
}

/**
 * Async CSV builder for very large datasets - Performance Optimized
 * Uses larger batch sizes and progress reporting
 */
export async function dataToCSVAsync<TData extends RowData>(
  data: TData[],
  columns: ColumnDef<TData>[],
  options: {
    includeHeaders?: boolean;
    columnSeparator?: string;
    getValue?: (row: TData, colId: string) => CellValue;
    onProgress?: (percent: number) => void;
  } = {}
): Promise<string> {
  const { includeHeaders = true, columnSeparator = ',', getValue, onProgress } = options;
  const visibleColumns = columns.filter(c => !c.hide);
  const colCount = visibleColumns.length;
  const rowCount = data.length;
  const chunks: string[] = [];

  if (includeHeaders) {
    const headerValues = new Array<string>(colCount);
    for (let i = 0; i < colCount; i++) {
      const col = visibleColumns[i];
      headerValues[i] = escapeCsvValue(col.headerName || col.id);
    }
    chunks.push(headerValues.join(columnSeparator));
  }

  // Larger batch size for better throughput
  const batchSize = 5000;
  
  // Pre-allocate row values array (reused)
  const rowValues = new Array<string>(colCount);

  for (let i = 0; i < rowCount; i += batchSize) {
    const batchEnd = Math.min(i + batchSize, rowCount);
    const batchLines: string[] = [];
    
    for (let r = i; r < batchEnd; r++) {
      const row = data[r];
      
      for (let c = 0; c < colCount; c++) {
        const col = visibleColumns[c];
        let value: CellValue;
        
        if (getValue) {
          value = getValue(row, col.id);
        } else if (col.field) {
          value = (row as Record<string, unknown>)[col.field as string] as CellValue;
        } else {
          value = '';
        }
        
        rowValues[c] = escapeCsvValue(value);
      }
      
      batchLines.push(rowValues.join(columnSeparator));
    }

    chunks.push(batchLines.join('\n'));
    
    // Report progress if callback provided
    if (onProgress) {
      onProgress(Math.round((batchEnd / rowCount) * 100));
    }

    // Yield to the event loop after processing a batch
    await new Promise<void>(res => setTimeout(res, 0));
  }

  return chunks.join('\n');
}

/**
 * Download CSV file - Optimized with proper cleanup
 */
export function downloadCSV(csvContent: string, fileName: string = 'export.csv'): void {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.style.display = 'none';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Revoke URL after a short delay to ensure download starts
  setTimeout(() => URL.revokeObjectURL(url), 100);
}

/**
 * Copy data to clipboard
 */
export async function copyToClipboard<TData extends RowData>(
  data: TData[],
  columns: ColumnDef<TData>[],
  options: {
    includeHeaders?: boolean;
    getValue?: (row: TData, colId: string) => CellValue;
  } = {}
): Promise<boolean> {
  try {
    const csvContent = dataToCSV(data, columns, {
      ...options,
      columnSeparator: '\t', // Use tabs for clipboard
    });
    
    await navigator.clipboard.writeText(csvContent);
    return true;
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
}

// ============================================================================
// JSON Export - Performance Optimized
// ============================================================================

/**
 * Convert data to JSON string
 */
export function dataToJSON<TData extends RowData>(
  data: TData[],
  columns: ColumnDef<TData>[],
  options: JsonExportOptions & {
    getValue?: (row: TData, colId: string) => CellValue;
  } = {}
): string {
  const { pretty = true, includeMetadata = false, getValue } = options;
  const visibleColumns = columns.filter(c => !c.hide);
  
  const rows = data.map((row) => {
    const obj: Record<string, CellValue> = {};
    for (const col of visibleColumns) {
      const key = col.field ? String(col.field) : col.id;
      if (getValue) {
        obj[key] = getValue(row, col.id);
      } else if (col.field) {
        obj[key] = (row as Record<string, unknown>)[col.field as string] as CellValue;
      }
    }
    return obj;
  });

  if (includeMetadata) {
    const result = {
      metadata: {
        exportedAt: new Date().toISOString(),
        rowCount: rows.length,
        columns: visibleColumns.map(c => ({
          id: c.id,
          field: c.field,
          headerName: c.headerName || c.id,
          type: c.filterType || 'text',
        })),
      },
      data: rows,
    };
    return pretty ? JSON.stringify(result, null, 2) : JSON.stringify(result);
  }

  return pretty ? JSON.stringify(rows, null, 2) : JSON.stringify(rows);
}

/**
 * Download JSON file
 */
export function downloadJSON(jsonContent: string, fileName: string = 'export.json'): void {
  const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.style.display = 'none';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  setTimeout(() => URL.revokeObjectURL(url), 100);
}

// ============================================================================
// Excel Export - Uses SheetJS (xlsx) dynamically loaded
// ============================================================================

/**
 * Convert data to Excel workbook and download
 */
export async function dataToExcel<TData extends RowData>(
  data: TData[],
  columns: ColumnDef<TData>[],
  options: ExcelExportOptions & {
    fileName?: string;
    getValue?: (row: TData, colId: string) => CellValue;
  } = {}
): Promise<void> {
  const {
    sheetName = 'Sheet1',
    includeStyles = true,
    headerBgColor = '4472C4',
    headerTextColor = 'FFFFFF',
    alternateRowColor = 'E8E8E8',
    autoWidth = true,
    fileName = 'export.xlsx',
    getValue,
  } = options;

  // Dynamically import xlsx (SheetJS)
  const XLSX = await import('xlsx');
  
  const visibleColumns = columns.filter(c => !c.hide);
  const headers = visibleColumns.map(c => c.headerName || c.id);
  
  // Build data array
  const wsData: (string | number | boolean | null | undefined)[][] = [headers];
  
  for (const row of data) {
    const rowData: (string | number | boolean | null | undefined)[] = [];
    for (const col of visibleColumns) {
      let value: CellValue;
      if (getValue) {
        value = getValue(row, col.id);
      } else if (col.field) {
        value = (row as Record<string, unknown>)[col.field as string] as CellValue;
      } else {
        value = '';
      }
      
      // Convert to Excel-compatible value
      if (value instanceof Date) {
        rowData.push(value.toISOString());
      } else if (typeof value === 'object' && value !== null) {
        rowData.push(JSON.stringify(value));
      } else {
        rowData.push(value as string | number | boolean | null | undefined);
      }
    }
    wsData.push(rowData);
  }
  
  // Create worksheet
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  
  // Auto-width columns
  if (autoWidth) {
    const colWidths: { wch: number }[] = [];
    for (let i = 0; i < visibleColumns.length; i++) {
      let maxWidth = headers[i].length;
      for (let r = 1; r < wsData.length && r < 100; r++) { // Sample first 100 rows
        const cellValue = wsData[r][i];
        const len = cellValue != null ? String(cellValue).length : 0;
        if (len > maxWidth) maxWidth = len;
      }
      colWidths.push({ wch: Math.min(maxWidth + 2, 50) }); // Cap at 50 chars
    }
    ws['!cols'] = colWidths;
  }
  
  // Apply styles if supported (xlsx-style or similar)
  if (includeStyles && ws['!ref']) {
    const range = XLSX.utils.decode_range(ws['!ref']);
    
    // Style header row
    for (let col = range.s.c; col <= range.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
      if (!ws[cellAddress]) continue;
      
      ws[cellAddress].s = {
        fill: { fgColor: { rgb: headerBgColor } },
        font: { bold: true, color: { rgb: headerTextColor } },
        alignment: { horizontal: 'center' },
      };
    }
    
    // Alternate row colors
    for (let row = 1; row <= range.e.r; row++) {
      if (row % 2 === 0) {
        for (let col = range.s.c; col <= range.e.c; col++) {
          const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
          if (!ws[cellAddress]) continue;
          ws[cellAddress].s = {
            fill: { fgColor: { rgb: alternateRowColor } },
          };
        }
      }
    }
  }
  
  // Create workbook
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  
  // Download
  XLSX.writeFile(wb, fileName);
}

// ============================================================================
// PDF Export - Uses jsPDF dynamically loaded
// ============================================================================

/**
 * Convert data to PDF and download
 */
export async function dataToPDF<TData extends RowData>(
  data: TData[],
  columns: ColumnDef<TData>[],
  options: PdfExportOptions & {
    fileName?: string;
    getValue?: (row: TData, colId: string) => CellValue;
  } = {}
): Promise<void> {
  const {
    orientation = 'landscape',
    pageSize = 'A4',
    title,
    includeHeader = true,
    fontSize = 10,
    headerBgColor = '#4472C4',
    alternateRowColors = true,
    fileName = 'export.pdf',
    getValue,
  } = options;

  // Dynamically import jsPDF and autoTable
  const { default: jsPDF } = await import('jspdf');
  const { default: autoTable } = await import('jspdf-autotable');
  
  const doc = new jsPDF({
    orientation,
    unit: 'mm',
    format: pageSize,
  });
  
  const visibleColumns = columns.filter(c => !c.hide);
  const headers = visibleColumns.map(c => c.headerName || c.id);
  
  // Build table data
  const tableData: string[][] = [];
  for (const row of data) {
    const rowData: string[] = [];
    for (const col of visibleColumns) {
      let value: CellValue;
      if (getValue) {
        value = getValue(row, col.id);
      } else if (col.field) {
        value = (row as Record<string, unknown>)[col.field as string] as CellValue;
      } else {
        value = '';
      }
      
      // Convert to string for PDF
      if (value == null) {
        rowData.push('');
      } else if (value instanceof Date) {
        rowData.push(value.toLocaleDateString());
      } else if (typeof value === 'object') {
        rowData.push(JSON.stringify(value));
      } else {
        rowData.push(String(value));
      }
    }
    tableData.push(rowData);
  }
  
  let startY = 15;
  
  // Add title if provided
  if (title) {
    doc.setFontSize(16);
    doc.text(title, 14, 12);
    startY = 20;
  }
  
  // Generate table using autoTable
  autoTable(doc, {
    head: includeHeader ? [headers] : undefined,
    body: tableData,
    startY,
    styles: {
      fontSize,
      cellPadding: 2,
    },
    headStyles: {
      fillColor: headerBgColor,
      textColor: '#FFFFFF',
      fontStyle: 'bold',
    },
    alternateRowStyles: alternateRowColors ? {
      fillColor: '#F5F5F5',
    } : undefined,
    margin: { top: 15, right: 10, bottom: 15, left: 10 },
  });
  
  // Save
  doc.save(fileName);
}

// ============================================================================
// Export Plugin
// ============================================================================

let pluginApi: GridApi<RowData> | null = null;
let _pluginConfig: ExportPluginConfig = {};

export const exportPlugin: GridPlugin<RowData> = {
  name: 'export',

  init(api: GridApi<RowData>, config?: ExportPluginConfig) {
    pluginApi = api;
    _pluginConfig = config || {};
  },

  destroy() {
    pluginApi = null;
    _pluginConfig = {};
  },

  // Exposed runtime helpers
  onStateChange() {
    // no-op: the helpers below read from pluginApi directly
  },

  // Expose an API-like interface from the plugin factory consumers can call via plugin manager if needed
  // For now export standard helpers as named exports via module-level functions
};

// Module-level helpers that operate against the registered pluginApi

/**
 * Export to CSV file - handles both sync and async for large datasets
 */
export function exportToCsv(fileName?: string, onlySelected: boolean = false) {
  if (!pluginApi) return;
  
  const state = pluginApi.getState();
  const columns = state.columns;
  
  // Get data based on selection
  let data: RowData[];
  if (onlySelected) {
    if (state.selection.allSelected) {
      data = state.processedData;
    } else {
      // Sort indices for consistent ordering
      const indices = Array.from(state.selection.selectedRows).sort((a, b) => a - b);
      data = indices.map(i => state.processedData[i]).filter(Boolean);
    }
  } else {
    data = state.processedData;
  }
  
  if (data.length === 0) return;

  // Pre-create value getter to avoid repeated lookups
  const colMap = new Map(columns.map(c => [c.id, c]));
  const getValue = (row: RowData, colId: string): CellValue => {
    const col = colMap.get(colId);
    if (col?.field) return (row as Record<string, unknown>)[col.field as string] as CellValue;
    return '';
  };
  
  const outputFileName = fileName || _pluginConfig.fileName || 'export.csv';

  if (data.length > LARGE_DATASET_THRESHOLD) {
    dataToCSVAsync(data, columns, {
      includeHeaders: true,
      getValue,
    }).then(csvContent => downloadCSV(csvContent, outputFileName));
  } else {
    const csvContent = dataToCSV(data, columns, {
      includeHeaders: true,
      getValue,
    });
    downloadCSV(csvContent, outputFileName);
  }
}

/**
 * Copy selected rows to clipboard
 */
export async function copySelected(): Promise<boolean> {
  if (!pluginApi) return false;
  
  const state = pluginApi.getState();
  
  // Get selected data
  let selectedData: RowData[];
  if (state.selection.allSelected) {
    selectedData = state.processedData;
  } else {
    const indices = Array.from(state.selection.selectedRows).sort((a, b) => a - b);
    selectedData = indices.map(i => state.processedData[i]).filter(Boolean);
  }

  if (selectedData.length === 0) return false;

  // Pre-create value getter with Map for O(1) lookup
  const colMap = new Map(state.columns.map(c => [c.id, c]));
  const getValue = (row: RowData, colId: string): CellValue => {
    const col = colMap.get(colId);
    if (col?.field) return (row as Record<string, unknown>)[col.field as string] as CellValue;
    return '';
  };

  try {
    if (selectedData.length > LARGE_DATASET_THRESHOLD) {
      const tsv = await dataToCSVAsync(selectedData, state.columns, { 
        includeHeaders: false, 
        columnSeparator: '\t',
        getValue,
      });
      await navigator.clipboard.writeText(tsv);
    } else {
      const tsv = dataToCSV(selectedData, state.columns, { 
        includeHeaders: false, 
        columnSeparator: '\t',
        getValue,
      });
      await navigator.clipboard.writeText(tsv);
    }
    return true;
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
}

/**
 * Copy all rows to clipboard
 */
export async function copyAll(includeHeaders: boolean = true): Promise<boolean> {
  if (!pluginApi) return false;
  
  const state = pluginApi.getState();
  
  if (state.processedData.length === 0) return false;

  // Pre-create value getter with Map for O(1) lookup
  const colMap = new Map(state.columns.map(c => [c.id, c]));
  const getValue = (row: RowData, colId: string): CellValue => {
    const col = colMap.get(colId);
    if (col?.field) return (row as Record<string, unknown>)[col.field as string] as CellValue;
    return '';
  };
  
  try {
    if (state.processedData.length > LARGE_DATASET_THRESHOLD) {
      const tsv = await dataToCSVAsync(state.processedData, state.columns, { 
        includeHeaders, 
        columnSeparator: '\t',
        getValue,
      });
      await navigator.clipboard.writeText(tsv);
    } else {
      const tsv = dataToCSV(state.processedData, state.columns, { 
        includeHeaders, 
        columnSeparator: '\t',
        getValue,
      });
      await navigator.clipboard.writeText(tsv);
    }
    return true;
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
}

/**
 * Export to JSON file
 */
export function exportToJson(
  fileName?: string,
  onlySelected: boolean = false,
  options: JsonExportOptions = {}
): void {
  if (!pluginApi) return;
  
  const state = pluginApi.getState();
  const columns = state.columns;
  
  // Get data based on selection
  let data: RowData[];
  if (onlySelected) {
    if (state.selection.allSelected) {
      data = state.processedData;
    } else {
      const indices = Array.from(state.selection.selectedRows).sort((a, b) => a - b);
      data = indices.map(i => state.processedData[i]).filter(Boolean);
    }
  } else {
    data = state.processedData;
  }
  
  if (data.length === 0) return;

  const colMap = new Map(columns.map(c => [c.id, c]));
  const getValue = (row: RowData, colId: string): CellValue => {
    const col = colMap.get(colId);
    if (col?.field) return (row as Record<string, unknown>)[col.field as string] as CellValue;
    return '';
  };
  
  const outputFileName = fileName || _pluginConfig.fileName?.replace(/\.(csv|xlsx|pdf)$/, '.json') || 'export.json';
  const jsonContent = dataToJSON(data, columns, { ...options, getValue });
  downloadJSON(jsonContent, outputFileName);
}

/**
 * Export to Excel file
 */
export async function exportToExcel(
  fileName?: string,
  onlySelected: boolean = false,
  options: ExcelExportOptions = {}
): Promise<void> {
  if (!pluginApi) return;
  
  const state = pluginApi.getState();
  const columns = state.columns;
  
  // Get data based on selection
  let data: RowData[];
  if (onlySelected) {
    if (state.selection.allSelected) {
      data = state.processedData;
    } else {
      const indices = Array.from(state.selection.selectedRows).sort((a, b) => a - b);
      data = indices.map(i => state.processedData[i]).filter(Boolean);
    }
  } else {
    data = state.processedData;
  }
  
  if (data.length === 0) return;

  const colMap = new Map(columns.map(c => [c.id, c]));
  const getValue = (row: RowData, colId: string): CellValue => {
    const col = colMap.get(colId);
    if (col?.field) return (row as Record<string, unknown>)[col.field as string] as CellValue;
    return '';
  };
  
  const outputFileName = fileName || _pluginConfig.fileName?.replace(/\.(csv|json|pdf)$/, '.xlsx') || 'export.xlsx';
  await dataToExcel(data, columns, { ...options, fileName: outputFileName, getValue });
}

/**
 * Export to PDF file
 */
export async function exportToPdf(
  fileName?: string,
  onlySelected: boolean = false,
  options: PdfExportOptions = {}
): Promise<void> {
  if (!pluginApi) return;
  
  const state = pluginApi.getState();
  const columns = state.columns;
  
  // Get data based on selection
  let data: RowData[];
  if (onlySelected) {
    if (state.selection.allSelected) {
      data = state.processedData;
    } else {
      const indices = Array.from(state.selection.selectedRows).sort((a, b) => a - b);
      data = indices.map(i => state.processedData[i]).filter(Boolean);
    }
  } else {
    data = state.processedData;
  }
  
  if (data.length === 0) return;

  const colMap = new Map(columns.map(c => [c.id, c]));
  const getValue = (row: RowData, colId: string): CellValue => {
    const col = colMap.get(colId);
    if (col?.field) return (row as Record<string, unknown>)[col.field as string] as CellValue;
    return '';
  };
  
  const outputFileName = fileName || _pluginConfig.fileName?.replace(/\.(csv|json|xlsx)$/, '.pdf') || 'export.pdf';
  await dataToPDF(data, columns, { ...options, fileName: outputFileName, getValue });
}

// Lightweight hook to consume export helpers in React components
export function useExport() {
  return {
    exportToCsv,
    exportToJson,
    exportToExcel,
    exportToPdf,
    copySelected,
    copyAll,
  };
}
