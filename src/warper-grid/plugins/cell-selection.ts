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
// Cell Selection Utilities
// ============================================================================

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
 * Check if a cell is within a range
 */
export function isCellInRange(
  cell: CellPosition,
  range: CellRange,
  columnOrder: string[]
): boolean {
  const normalized = normalizeRange(range);
  const startColIndex = columnOrder.indexOf(normalized.startColId);
  const endColIndex = columnOrder.indexOf(normalized.endColId);
  const cellColIndex = columnOrder.indexOf(cell.colId);
  
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
 * Check if a cell is in any of the ranges
 */
export function isCellSelected(
  cell: CellPosition,
  ranges: CellRange[],
  columnOrder: string[]
): boolean {
  return ranges.some(range => isCellInRange(cell, range, columnOrder));
}

/**
 * Get all cells in a range
 */
export function getCellsInRange(
  range: CellRange,
  columnOrder: string[]
): CellPosition[] {
  const normalized = normalizeRange(range);
  const cells: CellPosition[] = [];
  
  const startColIndex = columnOrder.indexOf(normalized.startColId);
  const endColIndex = columnOrder.indexOf(normalized.endColId);
  const minCol = Math.min(startColIndex, endColIndex);
  const maxCol = Math.max(startColIndex, endColIndex);
  
  for (let row = normalized.startRow; row <= normalized.endRow; row++) {
    for (let col = minCol; col <= maxCol; col++) {
      cells.push({ rowIndex: row, colId: columnOrder[col] });
    }
  }
  
  return cells;
}

/**
 * Get values from cells in a range
 */
export function getRangeValues<TData extends RowData>(
  range: CellRange,
  data: TData[],
  columnOrder: string[],
  getFieldValue: (row: TData, colId: string) => CellValue
): CellValue[][] {
  const normalized = normalizeRange(range);
  const values: CellValue[][] = [];
  
  const startColIndex = columnOrder.indexOf(normalized.startColId);
  const endColIndex = columnOrder.indexOf(normalized.endColId);
  const minCol = Math.min(startColIndex, endColIndex);
  const maxCol = Math.max(startColIndex, endColIndex);
  
  for (let row = normalized.startRow; row <= normalized.endRow; row++) {
    const rowValues: CellValue[] = [];
    for (let col = minCol; col <= maxCol; col++) {
      const colId = columnOrder[col];
      rowValues.push(getFieldValue(data[row], colId));
    }
    values.push(rowValues);
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
 * Get selection bounds
 */
export function getSelectionBounds(
  ranges: CellRange[],
  columnOrder: string[]
): { minRow: number; maxRow: number; minCol: number; maxCol: number } | null {
  if (ranges.length === 0) return null;
  
  let minRow = Infinity;
  let maxRow = -Infinity;
  let minCol = Infinity;
  let maxCol = -Infinity;
  
  for (const range of ranges) {
    const normalized = normalizeRange(range);
    minRow = Math.min(minRow, normalized.startRow);
    maxRow = Math.max(maxRow, normalized.endRow);
    
    const startColIndex = columnOrder.indexOf(normalized.startColId);
    const endColIndex = columnOrder.indexOf(normalized.endColId);
    minCol = Math.min(minCol, startColIndex, endColIndex);
    maxCol = Math.max(maxCol, startColIndex, endColIndex);
  }
  
  return { minRow, maxRow, minCol, maxCol };
}

// ============================================================================
// Cell Selection Plugin
// ============================================================================

export function createCellSelectionPlugin<TData extends RowData = RowData>(
  config?: CellSelectionPluginConfig
): GridPlugin<TData> {
  let api: GridApi<TData> | null = null;
  const pluginConfig = {
    enableRangeSelection: true,
    enableMultiRangeSelection: true,
    enableFillHandle: true,
    ...config,
  };

  return {
    name: 'selection',
    init: (gridApi) => {
      api = gridApi;
    },
    destroy: () => {
      api = null;
    },
  };
}

export default createCellSelectionPlugin;
