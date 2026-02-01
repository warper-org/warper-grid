import type {
  RowData,
  GridPlugin,
  GridApi,
  CellValue,
} from '../types';

// ============================================================================
// Cell Selection Types
// ============================================================================

export interface CellRange {
  /** Starting row index */
  startRow: number;
  /** Ending row index */
  endRow: number;
  /** Starting column id */
  startColId: string;
  /** Ending column id */
  endColId: string;
}

export interface CellPosition {
  rowIndex: number;
  colId: string;
}

export interface CellSelectionState {
  /** Currently selected cell ranges */
  ranges: CellRange[];
  /** Active cell (for editing) */
  activeCell: CellPosition | null;
  /** Anchor cell (start of range selection) */
  anchorCell: CellPosition | null;
  /** Focus cell (current position in range) */
  focusCell: CellPosition | null;
  /** Whether currently selecting */
  isSelecting: boolean;
}

export interface CellSelectionPluginConfig {
  /** Enable range selection */
  enableRangeSelection?: boolean;
  /** Enable multi-range selection with Ctrl */
  enableMultiRangeSelection?: boolean;
  /** Enable fill handle for range filling */
  enableFillHandle?: boolean;
  /** Callback when selection changes */
  onRangeSelectionChanged?: (ranges: CellRange[]) => void;
}

// ============================================================================
// Cell Selection Utilities - Performance Optimized
// ============================================================================

// Cache for column order lookups
let cachedColumnOrder: string[] | null = null;
let cachedColumnIndexMap: Map<string, number> | null = null;

/**
 * Get column index map for O(1) lookups - with caching
 */
function getColumnIndexMap(columnOrder: string[]): Map<string, number> {
  if (cachedColumnOrder === columnOrder && cachedColumnIndexMap) {
    return cachedColumnIndexMap;
  }
  
  const indexMap = new Map<string, number>();
  for (let i = 0; i < columnOrder.length; i++) {
    indexMap.set(columnOrder[i], i);
  }
  
  cachedColumnOrder = columnOrder;
  cachedColumnIndexMap = indexMap;
  return indexMap;
}

/**
 * Normalize a range to ensure start <= end
 */
export function normalizeRange(range: CellRange): CellRange {
  return {
    startRow: Math.min(range.startRow, range.endRow),
    endRow: Math.max(range.startRow, range.endRow),
    startColId: range.startColId,
    endColId: range.endColId,
  };
}

/**
 * Check if a cell is within a range - Optimized with index map
 */
export function isCellInRange(
  cell: CellPosition,
  range: CellRange,
  columnOrder: string[]
): boolean {
  const indexMap = getColumnIndexMap(columnOrder);
  const normalized = normalizeRange(range);
  
  const startColIndex = indexMap.get(normalized.startColId);
  const endColIndex = indexMap.get(normalized.endColId);
  const cellColIndex = indexMap.get(cell.colId);
  
  if (startColIndex === undefined || endColIndex === undefined || cellColIndex === undefined) {
    return false;
  }
  
  const minCol = Math.min(startColIndex, endColIndex);
  const maxCol = Math.max(startColIndex, endColIndex);
  
  return (
    cell.rowIndex >= normalized.startRow &&
    cell.rowIndex <= normalized.endRow &&
    cellColIndex >= minCol &&
    cellColIndex <= maxCol
  );
}

/**
 * Check if a cell is in any of the ranges - Optimized with early return
 */
export function isCellSelectedInRanges(
  cell: CellPosition,
  ranges: CellRange[],
  columnOrder: string[]
): boolean {
  // Early return for common case
  if (ranges.length === 0) return false;
  
  for (let i = 0; i < ranges.length; i++) {
    if (isCellInRange(cell, ranges[i], columnOrder)) {
      return true;
    }
  }
  return false;
}

/**
 * Get all cells in a range - Optimized with pre-allocation
 */
export function getCellsInRange(
  range: CellRange,
  columnOrder: string[]
): CellPosition[] {
  const indexMap = getColumnIndexMap(columnOrder);
  const normalized = normalizeRange(range);
  
  const startColIndex = indexMap.get(normalized.startColId);
  const endColIndex = indexMap.get(normalized.endColId);
  
  if (startColIndex === undefined || endColIndex === undefined) {
    return [];
  }
  
  const minCol = Math.min(startColIndex, endColIndex);
  const maxCol = Math.max(startColIndex, endColIndex);
  
  const rowCount = normalized.endRow - normalized.startRow + 1;
  const colCount = maxCol - minCol + 1;
  const totalCells = rowCount * colCount;
  
  // Pre-allocate array
  const cells: CellPosition[] = new Array(totalCells);
  let idx = 0;
  
  for (let row = normalized.startRow; row <= normalized.endRow; row++) {
    for (let col = minCol; col <= maxCol; col++) {
      cells[idx++] = { rowIndex: row, colId: columnOrder[col] };
    }
  }
  
  return cells;
}

/**
 * Get values from cells in a range - Optimized with pre-allocation
 */
export function getRangeValues<TData extends RowData>(
  range: CellRange,
  data: TData[],
  columnOrder: string[],
  getFieldValue: (row: TData, colId: string) => CellValue
): CellValue[][] {
  const indexMap = getColumnIndexMap(columnOrder);
  const normalized = normalizeRange(range);
  
  const startColIndex = indexMap.get(normalized.startColId);
  const endColIndex = indexMap.get(normalized.endColId);
  
  if (startColIndex === undefined || endColIndex === undefined) {
    return [];
  }
  
  const minCol = Math.min(startColIndex, endColIndex);
  const maxCol = Math.max(startColIndex, endColIndex);
  const colCount = maxCol - minCol + 1;
  
  const rowCount = normalized.endRow - normalized.startRow + 1;
  const values: CellValue[][] = new Array(rowCount);
  
  for (let r = 0; r < rowCount; r++) {
    const row = normalized.startRow + r;
    const rowValues: CellValue[] = new Array(colCount);
    
    for (let c = 0; c < colCount; c++) {
      const col = minCol + c;
      rowValues[c] = getFieldValue(data[row], columnOrder[col]);
    }
    values[r] = rowValues;
  }
  
  return values;
}

/**
 * Create range from anchor and focus
 */
export function createRange(
  anchor: CellPosition,
  focus: CellPosition
): CellRange {
  return {
    startRow: anchor.rowIndex,
    endRow: focus.rowIndex,
    startColId: anchor.colId,
    endColId: focus.colId,
  };
}

/**
 * Get selection bounds - Optimized with index map
 */
export function getSelectionBounds(
  ranges: CellRange[],
  columnOrder: string[]
): { minRow: number; maxRow: number; minCol: number; maxCol: number } | null {
  if (ranges.length === 0) return null;
  
  const indexMap = getColumnIndexMap(columnOrder);
  
  let minRow = Infinity;
  let maxRow = -Infinity;
  let minCol = Infinity;
  let maxCol = -Infinity;
  
  for (let i = 0; i < ranges.length; i++) {
    const range = ranges[i];
    const normalized = normalizeRange(range);
    
    minRow = Math.min(minRow, normalized.startRow);
    maxRow = Math.max(maxRow, normalized.endRow);
    
    const startColIndex = indexMap.get(normalized.startColId);
    const endColIndex = indexMap.get(normalized.endColId);
    
    if (startColIndex !== undefined && endColIndex !== undefined) {
      minCol = Math.min(minCol, startColIndex, endColIndex);
      maxCol = Math.max(maxCol, startColIndex, endColIndex);
    }
  }
  
  if (minCol === Infinity) return null;
  
  return { minRow, maxRow, minCol, maxCol };
}

// ============================================================================
// Cell Selection Plugin
// ============================================================================

export function createCellSelectionPlugin<TData extends RowData = RowData>(
  config?: CellSelectionPluginConfig
): GridPlugin<TData> {
  // Internal API reference (unused in current implementation)
  let pluginApi: GridApi<TData> | null = null;
  const _pluginConfig = {
    enableRangeSelection: true,
    enableMultiRangeSelection: true,
    enableFillHandle: true,
    ...config,
  };

  return {
    name: 'selection',
    init: (gridApi) => {
      pluginApi = gridApi;
    },
    destroy: () => {
      pluginApi = null;
    },
  };
}

export default createCellSelectionPlugin;
