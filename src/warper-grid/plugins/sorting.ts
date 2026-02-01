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
// Sorting Utilities - Performance Optimized
// ============================================================================

// Pre-allocated collator for string comparison (reused across sorts)
const stringCollator = new Intl.Collator(undefined, { 
  sensitivity: 'base', 
  numeric: true 
});

/**
 * Default comparator for sorting values - Optimized for performance
 * Uses type-specific fast paths and pre-allocated collator
 */
export function defaultComparator(valueA: CellValue, valueB: CellValue): number {
  // Fast path: identical values
  if (valueA === valueB) return 0;
  
  // Handle null/undefined - use nullish coalescing for speed
  const aIsNull = valueA == null;
  const bIsNull = valueB == null;
  if (aIsNull && bIsNull) return 0;
  if (aIsNull) return 1;
  if (bIsNull) return -1;

  // Type-specific fast paths using typeof (faster than instanceof for primitives)
  const typeA = typeof valueA;
  const typeB = typeof valueB;
  
  // Numbers - most common case, optimized first
  if (typeA === 'number' && typeB === 'number') {
    return (valueA as number) - (valueB as number);
  }

  // Booleans
  if (typeA === 'boolean' && typeB === 'boolean') {
    return (valueA as boolean) === (valueB as boolean) ? 0 : (valueA as boolean) ? -1 : 1;
  }
  
  // Strings - use pre-allocated collator
  if (typeA === 'string' && typeB === 'string') {
    return stringCollator.compare(valueA as string, valueB as string);
  }

  // Handle dates - check constructor name for speed
  if (valueA instanceof Date && valueB instanceof Date) {
    return valueA.getTime() - valueB.getTime();
  }

  // Fallback to string comparison with collator
  return stringCollator.compare(String(valueA), String(valueB));
}

/**
 * Sort data by sort model - Optimized with pre-computation and reduced allocations
 */
export function sortData<TData extends RowData>(
  data: TData[],
  sortModel: SortModel[],
  getColumnValue: (row: TData, colId: string) => CellValue,
  getComparator?: (colId: string) => ((a: CellValue, b: CellValue, rowA: TData, rowB: TData) => number) | undefined
): TData[] {
  // Early return for no sorting or empty data
  if (sortModel.length === 0 || data.length === 0) {
    return data;
  }

  // Pre-compute comparators and directions to avoid repeated lookups
  const sortConfig = sortModel
    .filter(s => s.sort !== null)
    .map(({ colId, sort }) => ({
      colId,
      direction: sort === 'asc' ? 1 : -1,
      comparator: getComparator?.(colId) ?? defaultComparator,
    }));

  // Skip if no active sorts
  if (sortConfig.length === 0) {
    return data;
  }

  // For single-column sort, use optimized path
  if (sortConfig.length === 1) {
    const { colId, direction, comparator } = sortConfig[0];
    
    // Pre-extract values for better cache locality
    const indexed = data.map((row, idx) => ({
      row,
      value: getColumnValue(row, colId),
      idx,
    }));
    
    indexed.sort((a, b) => {
      const result = comparator(a.value, b.value, a.row, b.row);
      return result * direction;
    });
    
    return indexed.map(item => item.row);
  }

  // Multi-column sort with pre-extracted values
  const indexed = data.map((row, idx) => {
    const values: CellValue[] = new Array(sortConfig.length);
    for (let i = 0; i < sortConfig.length; i++) {
      values[i] = getColumnValue(row, sortConfig[i].colId);
    }
    return { row, values, idx };
  });

  indexed.sort((a, b) => {
    for (let i = 0; i < sortConfig.length; i++) {
      const { direction, comparator } = sortConfig[i];
      const result = comparator(a.values[i], b.values[i], a.row, b.row);
      if (result !== 0) {
        return result * direction;
      }
    }
    // Stable sort: preserve original order for equal elements
    return a.idx - b.idx;
  });

  return indexed.map(item => item.row);
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

let _pluginApi: GridApi<RowData> | null = null;
let _pluginConfig: SortingPluginConfig = {};

export const sortingPlugin: GridPlugin<RowData> = {
  name: 'sorting',

  init(api: GridApi<RowData>, config?: SortingPluginConfig) {
    _pluginApi = api;
    _pluginConfig = config || {};
    
    // Apply default sort if provided
    if (_pluginConfig.defaultSort && _pluginConfig.defaultSort.length > 0) {
      api.setSortModel(_pluginConfig.defaultSort);
    }
  },

  destroy() {
    _pluginApi = null;
    _pluginConfig = {};
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
