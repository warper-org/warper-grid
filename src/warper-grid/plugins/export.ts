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
  }

  return rows.join('\n');
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
let pluginConfig: ExportPluginConfig = {};

export const exportPlugin: GridPlugin<RowData> = {
  name: 'export',

  init(api: GridApi<RowData>, config?: ExportPluginConfig) {
    pluginApi = api;
    pluginConfig = config || {};
  },

  destroy() {
    pluginApi = null;
    pluginConfig = {};
  },
};

// ============================================================================
// Export Hook
// ============================================================================

export function useExport<TData extends RowData>(api: GridApi<TData>) {
  const exportToCsv = (fileName?: string, onlySelected: boolean = false) => {
    const state = api.getState();
    const columns = state.columns;
    const data = onlySelected 
      ? Array.from(state.selection.selectedRows).map(i => state.processedData[i])
      : state.processedData;
    
    const csvContent = dataToCSV(data, columns, {
      includeHeaders: true,
      getValue: (row, colId) => {
        const col = columns.find(c => c.id === colId);
        if (col?.field) {
          return (row as Record<string, unknown>)[col.field as string] as CellValue;
        }
        return '';
      },
    });
    
    downloadCSV(csvContent, fileName || 'export.csv');
  };

  const copySelected = async () => {
    const state = api.getState();
    const selectedData = Array.from(state.selection.selectedRows)
      .map(i => state.processedData[i]);
    
    if (selectedData.length === 0) {
      return false;
    }
    
    return copyToClipboard(selectedData, state.columns, {
      includeHeaders: false,
      getValue: (row, colId) => {
        const col = state.columns.find(c => c.id === colId);
        if (col?.field) {
          return (row as Record<string, unknown>)[col.field as string] as CellValue;
        }
        return '';
      },
    });
  };

  const copyAll = async (includeHeaders: boolean = true) => {
    const state = api.getState();
    
    return copyToClipboard(state.processedData, state.columns, {
      includeHeaders,
      getValue: (row, colId) => {
        const col = state.columns.find(c => c.id === colId);
        if (col?.field) {
          return (row as Record<string, unknown>)[col.field as string] as CellValue;
        }
        return '';
      },
    });
  };

  return {
    exportToCsv,
    copySelected,
    copyAll,
  };
}
