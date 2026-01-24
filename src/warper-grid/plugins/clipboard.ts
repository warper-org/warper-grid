import type {
  RowData,
  GridPlugin,
  GridApi,
  CellValue,
} from '../types';
import type { CellRange, CellPosition } from './cell-selection';
import { getRangeValues, normalizeRange } from './cell-selection';

// ============================================================================
// Clipboard Types
// ============================================================================

export interface ClipboardPluginConfig {
  /** Enable copy */
  enableCopy?: boolean;
  /** Enable paste */
  enablePaste?: boolean;
  /** Enable cut */
  enableCut?: boolean;
  /** Include headers when copying */
  includeHeaders?: boolean;
  /** Custom copy processor */
  processCellForClipboard?: (params: ProcessCellParams) => string;
  /** Custom paste processor */
  processCellFromClipboard?: (params: ProcessCellParams) => CellValue;
  /** Callback after copy */
  onCopy?: (data: string) => void;
  /** Callback after paste */
  onPaste?: (data: string) => void;
}

export interface ProcessCellParams {
  value: CellValue;
  rowIndex: number;
  colId: string;
  column: { headerName?: string; field?: string };
}

export interface ClipboardData {
  /** Tab-separated values */
  text: string;
  /** Structured data */
  cells: CellValue[][];
  /** Headers if included */
  headers?: string[];
}

// ============================================================================
// Clipboard Utilities
// ============================================================================

/**
 * Convert cell value to clipboard string
 */
export function cellValueToString(value: CellValue): string {
  if (value === null || value === undefined) {
    return '';
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  return String(value);
}

/**
 * Parse clipboard string to cell values
 */
export function parseClipboardText(text: string): CellValue[][] {
  const rows = text.split('\n').filter(row => row.length > 0);
  return rows.map(row => 
    row.split('\t').map(cell => {
      // Try to parse as number
      const num = parseFloat(cell);
      if (!isNaN(num) && cell.trim() === String(num)) {
        return num;
      }
      // Try to parse as boolean
      if (cell.toLowerCase() === 'true') return true;
      if (cell.toLowerCase() === 'false') return false;
      // Return as string
      return cell;
    })
  );
}

/**
 * Format range values for clipboard
 */
export function formatForClipboard(
  values: CellValue[][],
  headers?: string[]
): string {
  const rows: string[] = [];
  
  if (headers) {
    rows.push(headers.join('\t'));
  }
  
  for (const row of values) {
    rows.push(row.map(cellValueToString).join('\t'));
  }
  
  return rows.join('\n');
}

/**
 * Copy range to clipboard
 */
export async function copyRangeToClipboard<TData extends RowData>(
  range: CellRange,
  data: TData[],
  columnOrder: string[],
  getFieldValue: (row: TData, colId: string) => CellValue,
  getColumnHeader: (colId: string) => string,
  includeHeaders: boolean = false
): Promise<string> {
  const values = getRangeValues(range, data, columnOrder, getFieldValue);
  
  let headers: string[] | undefined;
  if (includeHeaders) {
    const normalized = normalizeRange(range);
    const startColIndex = columnOrder.indexOf(normalized.startColId);
    const endColIndex = columnOrder.indexOf(normalized.endColId);
    const minCol = Math.min(startColIndex, endColIndex);
    const maxCol = Math.max(startColIndex, endColIndex);
    
    headers = [];
    for (let col = minCol; col <= maxCol; col++) {
      headers.push(getColumnHeader(columnOrder[col]));
    }
  }
  
  const text = formatForClipboard(values, headers);
  await navigator.clipboard.writeText(text);
  return text;
}

/**
 * Paste clipboard data to range
 */
export async function pasteFromClipboard(): Promise<CellValue[][] | null> {
  try {
    const text = await navigator.clipboard.readText();
    if (!text) return null;
    return parseClipboardText(text);
  } catch (e) {
    console.error('Failed to read clipboard:', e);
    return null;
  }
}

// ============================================================================
// Keyboard Event Handlers
// ============================================================================

export function handleClipboardKeyDown<TData extends RowData>(
  e: KeyboardEvent,
  // api is intentionally unused in this module scope
  api: GridApi<TData>,
  activeCell: CellPosition | null,
  ranges: CellRange[],
  columnOrder: string[],
  getData: () => TData[],
  getFieldValue: (row: TData, colId: string) => CellValue,
  getColumnHeader: (colId: string) => string,
  config: ClipboardPluginConfig,
  onPasteComplete?: (pasted?: CellValue[][] | null) => void
): void {
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const modKey = isMac ? e.metaKey : e.ctrlKey;
  
  if (!modKey) return;
  
  // Copy (Cmd/Ctrl + C)
  if (e.key === 'c' && config.enableCopy !== false) {
    e.preventDefault();
    
    if (ranges.length > 0) {
      const range = ranges[0]; // Copy first range
      copyRangeToClipboard(
        range,
        getData(),
        columnOrder,
        getFieldValue,
        getColumnHeader,
        config.includeHeaders
      ).then(text => {
        config.onCopy?.(text);
      });
    } else if (activeCell) {
      const data = getData();
      const value = getFieldValue(data[activeCell.rowIndex], activeCell.colId);
      navigator.clipboard.writeText(cellValueToString(value));
      config.onCopy?.(cellValueToString(value));
    }
  }
  
  // Cut (Cmd/Ctrl + X)
  if (e.key === 'x' && config.enableCut !== false) {
    e.preventDefault();
    // Copy first, then clear cells (requires edit support)
    if (ranges.length > 0) {
      const range = ranges[0];
      copyRangeToClipboard(
        range,
        getData(),
        columnOrder,
        getFieldValue,
        getColumnHeader,
        false
      );
      // TODO: Clear cells if editing is enabled
    }
  }
  
  // Paste (Cmd/Ctrl + V)
  if (e.key === 'v' && config.enablePaste !== false) {
    e.preventDefault();
    
    pasteFromClipboard().then(pastedData => {
      if (pastedData && pastedData.length > 0) {
        config.onPaste?.(formatForClipboard(pastedData));
        // Provide parsed pasted data back via callback for plugin to handle
        onPasteComplete?.(pastedData);
        // TODO: Apply pasted data if editing is enabled (plugin can handle onPasteComplete)      } else {
        onPasteComplete?.(null);      }
    });
  }
}

// ============================================================================
// Clipboard Plugin
// ============================================================================

export function createClipboardPlugin<TData extends RowData = RowData>(
  config?: ClipboardPluginConfig
): GridPlugin<TData> {
  let pluginApi: GridApi<TData> | null = null;
  const _pluginConfig: ClipboardPluginConfig = {
    enableCopy: true,
    enablePaste: true,
    enableCut: true,
    includeHeaders: false,
    ...config,
  };

  return {
    name: 'clipboard',
    init: (gridApi) => {
      pluginApi = gridApi;

      // Attach keyboard handler for copy/paste/cut
      const keyHandler = (e: KeyboardEvent) => {
        const state = pluginApi?.getState();
        const activeCell = (state as any).editing?.editingCell ? { rowIndex: (state as any).editing.editingCell.rowIndex, colId: (state as any).editing.editingCell.colId } : null;
        const ranges: any[] = []; // Range support will be added when cell-selection exposes state

        handleClipboardKeyDown(
          e,
          pluginApi as GridApi<TData>,
          activeCell as any,
          ranges as any,
          pluginApi!.getColumns().map(c => c.id),
          () => pluginApi!.getData() as TData[],
          (row: TData, colId: string): CellValue => {
            const field = pluginApi!.getColumn(colId)?.field as string;
            return (row as Record<string, unknown>)[field] as CellValue;
          },
          (colId) => pluginApi!.getColumn(colId)?.headerName || pluginApi!.getColumn(colId)?.id || '',
          _pluginConfig,
          (pasted) => {
            // Apply a simple single-cell paste: if pasted is non-null and activeCell present
            try {
              if (pasted && pasted.length > 0 && activeCell) {
                const first = pasted[0][0];
                const state = pluginApi!.getState();
                const colDef = pluginApi!.getColumn(activeCell.colId);
                const currentVal = (state.data[activeCell.rowIndex] as any)[String(colDef?.field)];
                pluginApi!.applyEdit?.(activeCell.rowIndex, activeCell.colId, currentVal, first);
              }
            } catch (err) {
              console.error('Clipboard: paste apply failed', err);
            }
          }
        );
      };

      document.addEventListener('keydown', keyHandler);

      // Store the handler so we can remove it on destroy
      (createClipboardPlugin as any)._keyHandler = keyHandler;
    },
    destroy: () => {
      const keyHandler = (createClipboardPlugin as any)._keyHandler;
      if (keyHandler) document.removeEventListener('keydown', keyHandler);
      pluginApi = null;
    },
  };
}

export default createClipboardPlugin;
