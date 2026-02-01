import type {
  RowData,
  GridPlugin,
  GridApi,
  CellValue,
} from '../types';
import type { CellRange } from './cell-selection';

// ============================================================================
// Status Bar Types
// ============================================================================

export interface StatusBarPluginConfig<TData extends RowData = RowData> {
  /** Show status bar */
  enabled?: boolean;
  /** Status bar position */
  position?: 'top' | 'bottom';
  /** Panels to show */
  panels?: StatusPanelConfig<TData>[];
  /** Custom CSS class */
  className?: string;
}

export interface StatusPanelConfig<TData extends RowData = RowData> {
  /** Panel id */
  id: string;
  /** Panel component */
  component: StatusPanelType | React.ComponentType<StatusPanelParams<TData>>;
  /** Panel position */
  align?: 'left' | 'center' | 'right';
  /** Custom props */
  params?: Record<string, unknown>;
}

export type StatusPanelType = 
  | 'totalRows'
  | 'filteredRows'
  | 'selectedRows'
  | 'selectedCells'
  | 'rangeStats'
  | 'aggregation';

export interface StatusPanelParams<TData extends RowData = RowData> {
  /** Grid API */
  api: GridApi<TData>;
  /** Total row count */
  totalRows: number;
  /** Displayed row count */
  displayedRows: number;
  /** Selected row count */
  selectedRows: number;
  /** Selected cell count */
  selectedCells: number;
  /** Selected ranges */
  selectedRanges: CellRange[];
  /** Range statistics */
  rangeStats: RangeStatistics | null;
  /** Custom params */
  params?: Record<string, unknown>;
}

export interface RangeStatistics {
  /** Sum of numeric values */
  sum: number;
  /** Average of numeric values */
  average: number;
  /** Count of values */
  count: number;
  /** Min numeric value */
  min: number;
  /** Max numeric value */
  max: number;
}

// ============================================================================
// Status Bar Utilities - Performance Optimized
// ============================================================================

/**
 * Calculate statistics for selected range - Optimized single-pass algorithm
 */
export function calculateRangeStatistics(values: CellValue[]): RangeStatistics | null {
  const len = values.length;
  if (len === 0) {
    return {
      sum: 0,
      average: 0,
      count: 0,
      min: 0,
      max: 0,
    };
  }
  
  // Single pass through the array
  let sum = 0;
  let count = 0;
  let min = Infinity;
  let max = -Infinity;
  
  for (let i = 0; i < len; i++) {
    const v = values[i];
    if (typeof v === 'number' && !isNaN(v)) {
      sum += v;
      count++;
      if (v < min) min = v;
      if (v > max) max = v;
    }
  }
  
  if (count === 0) {
    return {
      sum: 0,
      average: 0,
      count: len,
      min: 0,
      max: 0,
    };
  }
  
  return {
    sum,
    average: sum / count,
    count: len,
    min,
    max,
  };
}

/**
 * Format number for display
 */
export function formatStatNumber(value: number, precision: number = 2): string {
  if (Math.abs(value) >= 1000000) {
    return (value / 1000000).toFixed(precision) + 'M';
  }
  if (Math.abs(value) >= 1000) {
    return (value / 1000).toFixed(precision) + 'K';
  }
  return value.toFixed(precision);
}

// ============================================================================
// Default Status Panels
// ============================================================================

export function getTotalRowsPanel<TData extends RowData = RowData>(): StatusPanelConfig<TData> {
  return {
    id: 'totalRows',
    component: 'totalRows',
    align: 'left',
  };
}

export function getFilteredRowsPanel<TData extends RowData = RowData>(): StatusPanelConfig<TData> {
  return {
    id: 'filteredRows',
    component: 'filteredRows',
    align: 'left',
  };
}

export function getSelectedRowsPanel<TData extends RowData = RowData>(): StatusPanelConfig<TData> {
  return {
    id: 'selectedRows',
    component: 'selectedRows',
    align: 'center',
  };
}

export function getRangeStatsPanel<TData extends RowData = RowData>(): StatusPanelConfig<TData> {
  return {
    id: 'rangeStats',
    component: 'rangeStats',
    align: 'right',
  };
}

export function getDefaultStatusPanels<TData extends RowData = RowData>(): StatusPanelConfig<TData>[] {
  return [
    getTotalRowsPanel(),
    getSelectedRowsPanel(),
    getRangeStatsPanel(),
  ];
}

// ============================================================================
// Status Bar Plugin
// ============================================================================

export function createStatusBarPlugin<TData extends RowData = RowData>(
  config?: StatusBarPluginConfig<TData>
): GridPlugin<TData> {
  let pluginApi: GridApi<TData> | null = null;
  
  const _pluginConfig: StatusBarPluginConfig<TData> = {
    enabled: true,
    position: 'bottom',
    panels: getDefaultStatusPanels(),
    ...config,
  };

  return {
    name: 'statusBar',
    init: (gridApi) => {
      pluginApi = gridApi;
    },
    destroy: () => {
      pluginApi = null;
    },
  };
}

export default createStatusBarPlugin;
