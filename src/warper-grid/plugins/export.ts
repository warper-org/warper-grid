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

// Lightweight hook to consume export helpers in React components
export function useExport() {
  return {
    exportToCsv,
    copySelected,
    copyAll,
  };
}
