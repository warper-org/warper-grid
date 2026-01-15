import type { 
  RowData, 
  GridPlugin, 
  GridApi, 
  SortModel, 
  SortDirection, 
  CellValue,
  SortingPluginConfig 
} from '../types';

// ============================================================================
// Sorting Utilities
// ============================================================================

/**
 * Default comparator for sorting values
 */
export function defaultComparator(valueA: CellValue, valueB: CellValue): number {
  // Handle null/undefined
  if (valueA == null && valueB == null) return 0;
  if (valueA == null) return 1;
  if (valueB == null) return -1;

  // Handle dates
  if (valueA instanceof Date && valueB instanceof Date) {
    return valueA.getTime() - valueB.getTime();
  }

  // Handle numbers
  if (typeof valueA === 'number' && typeof valueB === 'number') {
    return valueA - valueB;
  }

  // Handle booleans
  if (typeof valueA === 'boolean' && typeof valueB === 'boolean') {
    return valueA === valueB ? 0 : valueA ? -1 : 1;
  }

  // Default to string comparison
  const strA = String(valueA).toLowerCase();
  const strB = String(valueB).toLowerCase();
  return strA.localeCompare(strB);
}

/**
 * Sort data by sort model
 */
export function sortData<TData extends RowData>(
  data: TData[],
  sortModel: SortModel[],
  getColumnValue: (row: TData, colId: string) => CellValue,
  getComparator?: (colId: string) => ((a: CellValue, b: CellValue, rowA: TData, rowB: TData) => number) | undefined
): TData[] {
  if (sortModel.length === 0) {
    return data;
  }

  return [...data].sort((a, b) => {
    for (const { colId, sort } of sortModel) {
      if (!sort) continue;

      const valueA = getColumnValue(a, colId);
      const valueB = getColumnValue(b, colId);
      
      const comparator = getComparator?.(colId) || defaultComparator;
      const result = comparator(valueA, valueB, a, b);
      
      if (result !== 0) {
        return sort === 'asc' ? result : -result;
      }
    }
    return 0;
  });
}

/**
 * Toggle sort direction
 */
export function getNextSortDirection(current: SortDirection): SortDirection {
  if (current === null) return 'asc';
  if (current === 'asc') return 'desc';
  return null;
}

/**
 * Update sort model with new column sort
 */
export function updateSortModel(
  sortModel: SortModel[],
  colId: string,
  multiSort: boolean
): SortModel[] {
  const existingIndex = sortModel.findIndex(s => s.colId === colId);
  const existing = sortModel[existingIndex];
  const nextDirection = getNextSortDirection(existing?.sort ?? null);

  if (multiSort) {
    // Multi-sort: update or add column
    if (existingIndex >= 0) {
      if (nextDirection === null) {
        // Remove from sort model
        return sortModel.filter((_, i) => i !== existingIndex);
      }
      // Update existing
      return sortModel.map((s, i) => 
        i === existingIndex ? { ...s, sort: nextDirection } : s
      );
    }
    // Add new
    if (nextDirection !== null) {
      return [...sortModel, { colId, sort: nextDirection }];
    }
    return sortModel;
  } else {
    // Single sort: replace entire model
    if (nextDirection === null) {
      return [];
    }
    return [{ colId, sort: nextDirection }];
  }
}

// ============================================================================
// Sorting Plugin
// ============================================================================

let pluginApi: GridApi<RowData> | null = null;
let pluginConfig: SortingPluginConfig = {};

export const sortingPlugin: GridPlugin<RowData> = {
  name: 'sorting',

  init(api: GridApi<RowData>, config?: SortingPluginConfig) {
    pluginApi = api;
    pluginConfig = config || {};
    
    // Apply default sort if provided
    if (pluginConfig.defaultSort && pluginConfig.defaultSort.length > 0) {
      api.setSortModel(pluginConfig.defaultSort);
    }
  },

  destroy() {
    pluginApi = null;
    pluginConfig = {};
  },
};

// ============================================================================
// Sorting Hook
// ============================================================================

export function useSorting<TData extends RowData>(api: GridApi<TData>, multiSort = false) {
  const toggleSort = (colId: string) => {
    const currentModel = api.getSortModel();
    const newModel = updateSortModel(currentModel, colId, multiSort);
    api.setSortModel(newModel);
  };

  const clearSort = () => {
    api.setSortModel([]);
  };

  const getSortDirection = (colId: string): SortDirection => {
    const model = api.getSortModel();
    return model.find(s => s.colId === colId)?.sort ?? null;
  };

  const getSortIndex = (colId: string): number => {
    const model = api.getSortModel();
    return model.findIndex(s => s.colId === colId);
  };

  return {
    toggleSort,
    clearSort,
    getSortDirection,
    getSortIndex,
    sortModel: api.getSortModel(),
  };
}
