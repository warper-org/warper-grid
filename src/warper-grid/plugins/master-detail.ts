import type {
  RowData,
  GridPlugin,
  GridApi,
  ColumnDef,
} from '../types';

// ============================================================================
// Master-Detail Types
// ============================================================================

export interface MasterDetailPluginConfig<TData extends RowData = RowData> {
  /** Enable master-detail */
  enabled?: boolean;
  /** Detail row height (or 'auto') */
  detailRowHeight?: number | 'auto';
  /** Get detail data for a row */
  getDetailRowData?: (params: GetDetailRowDataParams<TData>) => Promise<unknown[]> | unknown[];
  /** Detail grid columns */
  detailColumns?: ColumnDef<RowData>[];
  /** Custom detail renderer */
  detailRenderer?: React.ComponentType<DetailRendererParams<TData>>;
  /** Auto-expand first row */
  expandFirstRow?: boolean;
  /** Keep detail state when scrolling */
  keepDetailRows?: boolean;
  /** Max concurrent detail rows */
  maxConcurrentDetailRows?: number;
  /** Callback when detail opened */
  onDetailOpened?: (params: DetailOpenedParams<TData>) => void;
  /** Callback when detail closed */
  onDetailClosed?: (params: DetailClosedParams<TData>) => void;
}

export interface GetDetailRowDataParams<TData extends RowData = RowData> {
  /** Master row data */
  data: TData;
  /** Master row index */
  rowIndex: number;
  /** Grid API */
  api: GridApi<TData>;
}

export interface DetailRendererParams<TData extends RowData = RowData> {
  /** Master row data */
  masterData: TData;
  /** Master row index */
  masterRowIndex: number;
  /** Detail data (from getDetailRowData) */
  detailData: unknown[];
  /** Detail columns */
  detailColumns: ColumnDef<RowData>[];
  /** Grid API */
  api: GridApi<TData>;
  /** Close detail */
  closeDetail: () => void;
}

export interface DetailOpenedParams<TData extends RowData = RowData> {
  data: TData;
  rowIndex: number;
}

export interface DetailClosedParams<TData extends RowData = RowData> {
  data: TData;
  rowIndex: number;
}

export interface MasterDetailState {
  /** Set of expanded row indices */
  expandedRows: Set<number>;
  /** Cached detail data by row index */
  detailDataCache: Map<number, unknown[]>;
  /** Loading state by row index */
  loadingRows: Set<number>;
}

// ============================================================================
// Master-Detail Row Type
// ============================================================================

export interface MasterRow<TData extends RowData = RowData> {
  /** Type discriminator */
  __isMasterRow: true;
  /** Original data */
  data: TData;
  /** Row index in original data */
  originalIndex: number;
  /** Whether detail is expanded */
  isExpanded: boolean;
  /** Whether detail is loading */
  isLoading: boolean;
  /** Cached detail data */
  detailData?: unknown[];
}

export interface DetailRow<TData extends RowData = RowData> {
  /** Type discriminator */
  __isDetailRow: true;
  /** Master row data */
  masterData: TData;
  /** Master row index */
  masterRowIndex: number;
  /** Detail data */
  detailData: unknown[];
}

export type MasterDetailRow<TData extends RowData = RowData> = 
  | MasterRow<TData>
  | DetailRow<TData>;

// ============================================================================
// Master-Detail Utilities
// ============================================================================

/**
 * Check if row is a master row
 */
export function isMasterRow<TData extends RowData>(
  row: TData | MasterDetailRow<TData>
): row is MasterRow<TData> {
  return (row as MasterRow<TData>).__isMasterRow === true;
}

/**
 * Check if row is a detail row
 */
export function isDetailRow<TData extends RowData>(
  row: TData | MasterDetailRow<TData>
): row is DetailRow<TData> {
  return (row as DetailRow<TData>).__isDetailRow === true;
}

/**
 * Transform data to include master-detail structure
 */
export function transformToMasterDetail<TData extends RowData>(
  data: TData[],
  state: MasterDetailState
): (MasterRow<TData> | DetailRow<TData>)[] {
  const result: (MasterRow<TData> | DetailRow<TData>)[] = [];
  
  for (let i = 0; i < data.length; i++) {
    const isExpanded = state.expandedRows.has(i);
    const isLoading = state.loadingRows.has(i);
    const detailData = state.detailDataCache.get(i);
    
    // Add master row
    const masterRow: MasterRow<TData> = {
      __isMasterRow: true,
      data: data[i],
      originalIndex: i,
      isExpanded,
      isLoading,
      detailData,
    };
    result.push(masterRow);
    
    // Add detail row if expanded and data available
    if (isExpanded && detailData && !isLoading) {
      const detailRow: DetailRow<TData> = {
        __isDetailRow: true,
        masterData: data[i],
        masterRowIndex: i,
        detailData,
      };
      result.push(detailRow);
    }
  }
  
  return result;
}

/**
 * Calculate total row count including expanded details
 */
export function calculateTotalRowCount<TData extends RowData>(
  dataCount: number,
  expandedRows: Set<number>,
  detailDataCache: Map<number, unknown[]>
): number {
  let total = dataCount;
  
  for (const rowIndex of expandedRows) {
    if (detailDataCache.has(rowIndex)) {
      total += 1; // One detail row per expanded master
    }
  }
  
  return total;
}

/**
 * Get row height for master-detail
 */
export function getMasterDetailRowHeight(
  rowIndex: number,
  baseHeight: number,
  detailHeight: number | 'auto',
  expandedRows: Set<number>,
  detailDataCache: Map<number, unknown[]>
): number {
  // This is simplified - actual implementation would track which
  // virtual indices map to detail rows
  return baseHeight;
}

// ============================================================================
// Default Detail Renderer
// ============================================================================

export function DefaultDetailRenderer<TData extends RowData>({
  masterData,
  detailData,
  detailColumns,
  closeDetail,
}: DetailRendererParams<TData>) {
  // This would render a nested WarperGrid
  return null;
}

// ============================================================================
// Master-Detail Plugin
// ============================================================================

export function createMasterDetailPlugin<TData extends RowData = RowData>(
  config?: MasterDetailPluginConfig<TData>
): GridPlugin<TData> {
  let pluginApi: GridApi<TData> | null = null;
  
  const _pluginConfig: MasterDetailPluginConfig<TData> = {
    enabled: true,
    detailRowHeight: 200,
    expandFirstRow: false,
    keepDetailRows: true,
    maxConcurrentDetailRows: 10,
    ...config,
  };

  return {
    name: 'masterDetail',
    init: (gridApi) => {
      pluginApi = gridApi;
    },
    destroy: () => {
      pluginApi = null;
    },
  };
}

export default createMasterDetailPlugin;
