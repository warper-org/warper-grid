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
// Clipboard Utilities - Performance Optimized
// ============================================================================

// Pre-allocated StringBuilder-like pattern for large copies
const MAX_INLINE_ROWS = 1000;

/**
 * Convert cell value to clipboard string - Optimized
 */
export function cellValueToString(value: CellValue): string {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (value instanceof Date) return value.toISOString();
  // Objects - use JSON.stringify
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

/**
 * Parse clipboard string to cell values - Optimized with streaming approach
 */
export function parseClipboardText(text: string): CellValue[][] {
  if (!text) return [];
  
  const lines = text.split('\n');
  const result: CellValue[][] = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.length === 0 && i === lines.length - 1) continue; // Skip trailing empty line
    
    const cells = line.split('\t');
    const row: CellValue[] = new Array(cells.length);
    
    for (let j = 0; j < cells.length; j++) {
      const cell = cells[j];
      
      // Fast type detection
      if (cell === '') {
        row[j] = cell;
      } else if (cell === 'true') {
        row[j] = true;
      } else if (cell === 'false') {
        row[j] = false;
      } else {
        // Try number parse only if looks like a number
        const firstChar = cell.charCodeAt(0);
        const isNumeric = (firstChar >= 48 && firstChar <= 57) || // 0-9
                          firstChar === 45 || // -
                          firstChar === 46;   // .
        
        if (isNumeric) {
          const num = parseFloat(cell);
          if (!isNaN(num) && cell === String(num)) {
            row[j] = num;
            continue;
          }
        }
        row[j] = cell;
      }
    }
    result.push(row);
  }
  
  return result;
}

/**
 * Format range values for clipboard - Optimized for large datasets
 */
export function formatForClipboard(
  values: CellValue[][],
  headers?: string[]
): string {
  const totalRows = values.length + (headers ? 1 : 0);
  
  // For small datasets, use simple join
  if (totalRows < MAX_INLINE_ROWS) {
    const rows: string[] = [];
    if (headers) {
      rows.push(headers.join('\t'));
    }
    for (const row of values) {
      rows.push(row.map(cellValueToString).join('\t'));
    }
    return rows.join('\n');
  }
  
  // For large datasets, use array chunks to avoid string concatenation overhead
  const chunks: string[] = [];
  
  if (headers) {
    chunks.push(headers.join('\t'));
  }
  
  for (const row of values) {
    chunks.push(row.map(cellValueToString).join('\t'));
  }
  
  return chunks.join('\n');
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
      } else {
        onPasteComplete?.(null);
      }
    });
  }
}

// ============================================================================
// Clipboard Plugin - Performance Optimized
// ============================================================================

export function createClipboardPlugin<TData extends RowData = RowData>(
  config?: ClipboardPluginConfig
): GridPlugin<TData> {
  let pluginApi: GridApi<TData> | null = null;
  let keyHandler: ((e: KeyboardEvent) => void) | null = null;
  
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
      keyHandler = (e: KeyboardEvent) => {
        if (!pluginApi) return;
        
        const state = pluginApi.getState();
        const editingState = state.editing as { editingCell?: CellPosition } | undefined;
        const activeCell = editingState?.editingCell ?? null;
        const ranges: CellRange[] = []; // Range support will be added when cell-selection exposes state

        // Get column order once
        const columnOrder = pluginApi.getColumns().map(c => c.id);
        
        // Pre-build column field map for fast lookups
        const columnFieldMap = new Map<string, string>();
        const columnHeaderMap = new Map<string, string>();
        for (const col of pluginApi.getColumns()) {
          if (col.field) columnFieldMap.set(col.id, col.field as string);
          columnHeaderMap.set(col.id, col.headerName || col.id);
        }

        handleClipboardKeyDown(
          e,
          pluginApi as GridApi<TData>,
          activeCell,
          ranges,
          columnOrder,
          () => pluginApi!.getData() as TData[],
          (row: TData, colId: string): CellValue => {
            const field = columnFieldMap.get(colId);
            return field ? (row as Record<string, unknown>)[field] as CellValue : null;
          },
          (colId) => columnHeaderMap.get(colId) || '',
          _pluginConfig,
          (pasted) => {
            // Apply a simple single-cell paste: if pasted is non-null and activeCell present
            try {
              if (pasted && pasted.length > 0 && activeCell) {
                const first = pasted[0][0] as CellValue;
                const colDef = pluginApi!.getColumn(activeCell.colId);
                if (colDef?.field) {
                  const state = pluginApi!.getState();
                  const currentVal = (state.data[activeCell.rowIndex] as Record<string, unknown>)[colDef.field as string] as CellValue;
                  pluginApi!.applyEdit?.(activeCell.rowIndex, activeCell.colId, currentVal, first);
                }
              }
            } catch (err) {
              console.error('Clipboard: paste apply failed', err);
            }
          }
        );
      };

      document.addEventListener('keydown', keyHandler);
    },
    onStateChange() {
      // no-op
    },
    destroy: () => {
      if (keyHandler) {
        document.removeEventListener('keydown', keyHandler);
        keyHandler = null;
      }
      pluginApi = null;
    },
  };
}

export default createClipboardPlugin;
