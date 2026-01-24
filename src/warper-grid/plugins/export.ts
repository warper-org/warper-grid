import type { 
  RowData, 
  GridPlugin, 
  GridApi, 
  ExportPluginConfig,
  ColumnDef,
  CellValue,
} from '../types';

// ============================================================================
// Export Utilities
// ============================================================================

/**
 * Escape CSV value
 */
export function escapeCsvValue(value: CellValue): string {
  const strValue = String(value ?? '');
  
  // Check if escaping is needed
  if (strValue.includes(',') || strValue.includes('"') || strValue.includes('\n') || strValue.includes('\r')) {
    return `"${strValue.replace(/"/g, '""')}"`;
  }
  
  return strValue;
}

/**
 * Convert data to CSV string
 */
import { LARGE_DATASET_THRESHOLD } from '../constants';

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
  const rows: string[] = [];

  // Header row
  if (includeHeaders) {
    const headerValues = visibleColumns.map(col => 
      escapeCsvValue(col.headerName || col.id)
    );
    rows.push(headerValues.join(columnSeparator));
  }

  // Data rows
  for (const row of data) {
    const rowValues = visibleColumns.map(col => {
      let value: CellValue;
      
      if (getValue) {
        value = getValue(row, col.id);
      } else if (col.field) {
        value = (row as Record<string, unknown>)[col.field as string] as CellValue;
      } else {
        value = '';
      }
      
      return escapeCsvValue(value);
    });
    rows.push(rowValues.join(columnSeparator));

    // If dataset is huge, periodically yield to event loop to avoid blocking
    if (rows.length % 1000 === 0 && data.length > LARGE_DATASET_THRESHOLD) {
      // noop, just continue; async path will be used in large exports
    }
  }

  return rows.join('\n');
}

/**
 * Async CSV builder for very large datasets to avoid blocking the main thread.
 */
export async function dataToCSVAsync<TData extends RowData>(
  data: TData[],
  columns: ColumnDef<TData>[],
  options: {
    includeHeaders?: boolean;
    columnSeparator?: string;
    getValue?: (row: TData, colId: string) => CellValue;
  } = {}
): Promise<string> {
  const { includeHeaders = true, columnSeparator = ',', getValue } = options;
  const visibleColumns = columns.filter(c => !c.hide);
  const chunks: string[] = [];

  if (includeHeaders) {
    const headerValues = visibleColumns.map(col => escapeCsvValue(col.headerName || col.id));
    chunks.push(headerValues.join(columnSeparator));
  }

  const batchSize = 1000;

  for (let i = 0; i < data.length; i += batchSize) {
    const batch = data.slice(i, i + batchSize);
    const rows: string[] = batch.map(row => {
      const rowValues = visibleColumns.map(col => {
        let value: CellValue;
        if (getValue) {
          value = getValue(row, col.id);
        } else if (col.field) {
          value = (row as Record<string, unknown>)[col.field as string] as CellValue;
        } else {
          value = '';
        }
        return escapeCsvValue(value);
      });
      return rowValues.join(columnSeparator);
    });

    chunks.push(rows.join('\n'));

    // Yield to the event loop after processing a batch
    await new Promise<void>(res => setTimeout(res, 0));
  }

  return chunks.join('\n');
}

/**
 * Download CSV file
 */
export function downloadCSV(csvContent: string, fileName: string = 'export.csv'): void {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', fileName);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
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
export function exportToCsv(fileName?: string, onlySelected: boolean = false) {
  if (!pluginApi) return;
  const state = pluginApi.getState();
  const columns = state.columns;
  const data = onlySelected ? Array.from(state.selection.selectedRows).map(i => state.processedData[i]) : state.processedData;
  const useAsync = data.length > LARGE_DATASET_THRESHOLD;

  if (useAsync) {
    dataToCSVAsync(data, columns, {
      includeHeaders: true,
      getValue: (row, colId) => {
        const col = columns.find(c => c.id === colId);
        if (col?.field) return (row as Record<string, unknown>)[col.field as string] as CellValue;
        return '';
      },
    }).then(csvContent => downloadCSV(csvContent, fileName || 'export.csv'));
  } else {
    const csvContent = dataToCSV(data, columns, {
      includeHeaders: true,
      getValue: (row, colId) => {
        const col = columns.find(c => c.id === colId);
        if (col?.field) return (row as Record<string, unknown>)[col.field as string] as CellValue;
        return '';
      },
    });
    downloadCSV(csvContent, fileName || 'export.csv');
  }
}

export async function copySelected() {
  if (!pluginApi) return false;
  const state = pluginApi.getState();
  let selectedData: RowData[] = [];
  if (state.selection.allSelected) selectedData = state.processedData;
  else selectedData = Array.from(state.selection.selectedRows).map(i => state.processedData[i]);

  if (selectedData.length === 0) return false;

  if (selectedData.length > LARGE_DATASET_THRESHOLD) {
    const tsv = await dataToCSVAsync(selectedData, state.columns, { includeHeaders: false, columnSeparator: '\t' });
    await navigator.clipboard.writeText(tsv);
    return true;
  }

  return copyToClipboard(selectedData as any, state.columns, { includeHeaders: false });
}

export async function copyAll(includeHeaders: boolean = true) {
  if (!pluginApi) return false;
  const state = pluginApi.getState();
  return copyToClipboard(state.processedData as any, state.columns, { includeHeaders });
}

// Lightweight hook to consume export helpers in React components
export function useExport() {
  return {
    exportToCsv,
    copySelected,
    copyAll,
  };
}
