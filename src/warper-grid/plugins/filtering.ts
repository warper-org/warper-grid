import type { 
  RowData, 
  GridPlugin, 
  GridApi, 
  FilterModel, 
  FilterType, 
  CellValue,
  FilteringPluginConfig 
} from '../types';

// ============================================================================
// Filter Utilities - Performance Optimized
// ============================================================================

/**
 * Check if a value matches a text filter - Optimized with early returns
 */
export function matchesTextFilter(
  value: CellValue,
  filterValue: string,
  operator: string = 'contains'
): boolean {
  // Fast path: empty filter matches everything
  if (filterValue === '' || filterValue == null) return true;
  
  // Handle blank check before string conversion
  if (operator === 'blank') return value == null || String(value).trim() === '';
  if (operator === 'notBlank') return value != null && String(value).trim() !== '';
  
  // Null check after blank operators
  if (value == null) return false;

  // Convert to lowercase strings once
  const strValue = String(value).toLowerCase();
  const filterStr = filterValue.toLowerCase();

  // Use switch with most common cases first
  switch (operator) {
    case 'contains':
      return strValue.includes(filterStr);
    case 'equals':
      return strValue === filterStr;
    case 'startsWith':
      return strValue.startsWith(filterStr);
    case 'endsWith':
      return strValue.endsWith(filterStr);
    case 'notEquals':
      return strValue !== filterStr;
    case 'notContains':
      return !strValue.includes(filterStr);
    default:
      return strValue.includes(filterStr);
  }
}

/**
 * Check if a value matches a number filter - Optimized
 */
export function matchesNumberFilter(
  value: CellValue,
  filterValue: unknown,
  operator: string = 'equals'
): boolean {
  // Fast path for empty filter
  if (filterValue == null || filterValue === '') return true;
  
  // Handle blank operators
  if (operator === 'blank') return value == null || (typeof value === 'number' && Number.isNaN(value));
  if (operator === 'notBlank') return value != null && !(typeof value === 'number' && Number.isNaN(value));
  
  if (value == null) return false;

  // Use direct number check first, then parse
  const numValue = typeof value === 'number' ? value : parseFloat(String(value));
  if (Number.isNaN(numValue)) return false;

  const filterNum = typeof filterValue === 'number' ? filterValue : parseFloat(String(filterValue));
  if (Number.isNaN(filterNum) && operator !== 'between') return false;

  switch (operator) {
    case 'equals':
      return numValue === filterNum;
    case 'greaterThan':
      return numValue > filterNum;
    case 'lessThan':
      return numValue < filterNum;
    case 'greaterThanOrEqual':
      return numValue >= filterNum;
    case 'lessThanOrEqual':
      return numValue <= filterNum;
    case 'notEquals':
      return numValue !== filterNum;
    case 'between':
      if (Array.isArray(filterValue) && filterValue.length === 2) {
        const min = Number(filterValue[0]);
        const max = Number(filterValue[1]);
        return numValue >= min && numValue <= max;
      }
      return true;
    default:
      return numValue === filterNum;
  }
}

/**
 * Check if a value matches a date filter - Optimized
 */
export function matchesDateFilter(
  value: CellValue,
  filterValue: unknown,
  operator: string = 'equals'
): boolean {
  if (filterValue == null) return true;
  
  if (operator === 'blank') return value == null;
  if (value == null) return false;

  // Optimize date parsing
  const dateValue = value instanceof Date ? value : new Date(String(value));
  if (Number.isNaN(dateValue.getTime())) return operator === 'blank';

  const filterDate = filterValue instanceof Date ? filterValue : new Date(String(filterValue));
  if (Number.isNaN(filterDate.getTime()) && operator !== 'between') return true;

  // Pre-compute date-only comparison values
  const getDateOnly = (d: Date) => {
    const year = d.getFullYear();
    const month = d.getMonth();
    const day = d.getDate();
    return year * 10000 + month * 100 + day;
  };

  switch (operator) {
    case 'equals':
      return getDateOnly(dateValue) === getDateOnly(filterDate);
    case 'notEquals':
      return getDateOnly(dateValue) !== getDateOnly(filterDate);
    case 'lessThan':
      return dateValue.getTime() < filterDate.getTime();
    case 'lessThanOrEqual':
      return dateValue.getTime() <= filterDate.getTime();
    case 'greaterThan':
      return dateValue.getTime() > filterDate.getTime();
    case 'greaterThanOrEqual':
      return dateValue.getTime() >= filterDate.getTime();
    case 'between':
      if (Array.isArray(filterValue) && filterValue.length === 2) {
        const start = new Date(filterValue[0]).getTime();
        const end = new Date(filterValue[1]).getTime();
        const time = dateValue.getTime();
        return time >= start && time <= end;
      }
      return true;
    default:
      return true;
  }
}

/**
 * Check if a value matches a boolean filter
 */
export function matchesBooleanFilter(
  value: CellValue,
  filterValue: unknown
): boolean {
  if (filterValue == null) return true;
  
  const boolValue = value === true || value === 'true' || value === 1;
  const filterBool = filterValue === true || filterValue === 'true' || filterValue === 1;
  
  return boolValue === filterBool;
}

/**
 * Check if a value matches a select filter - Optimized
 */
export function matchesSelectFilter(
  value: CellValue,
  filterValue: unknown
): boolean {
  if (filterValue == null || filterValue === '') return true;
  
  const strValue = String(value ?? '');
  
  if (Array.isArray(filterValue)) {
    if (filterValue.length === 0) return true;
    // Use Set for O(1) lookup on large arrays
    if (filterValue.length > 10) {
      const filterSet = new Set(filterValue.map(String));
      return filterSet.has(strValue);
    }
    return filterValue.some(f => String(f) === strValue);
  }
  
  return strValue === String(filterValue);
}

/**
 * Apply a single filter to a value - Optimized with lookup table
 */
const filterFnMap: Record<string, (value: CellValue, filter: FilterModel) => boolean> = {
  text: (value, filter) => matchesTextFilter(value, filter.value as string, filter.operator),
  number: (value, filter) => matchesNumberFilter(value, filter.value, filter.operator),
  date: (value, filter) => matchesDateFilter(value, filter.value, filter.operator),
  boolean: (value, filter) => matchesBooleanFilter(value, filter.value),
  select: (value, filter) => matchesSelectFilter(value, filter.value),
  'multi-select': (value, filter) => matchesSelectFilter(value, filter.value),
};

export function applyFilter(value: CellValue, filter: FilterModel): boolean {
  const fn = filterFnMap[filter.filterType];
  if (fn) return fn(value, filter);
  return matchesTextFilter(value, String(filter.value ?? ''), filter.operator);
}

/**
 * Apply quick filter to data - Performance Optimized
 * Supports regex literals, quoted phrases, negation, and OR groups
 */
export function applyQuickFilter<TData extends RowData>(
  data: TData[],
  quickFilterText: string,
  getRowValues: (row: TData) => CellValue[]
): TData[] {
  // Fast path: empty filter
  const trimmed = quickFilterText?.trim();
  if (!trimmed) return data;

  // Fast path: empty data
  if (data.length === 0) return data;

  // Check for regex literal: /pattern/flags
  const regexMatch = trimmed.match(/^\/(.*)\/([gimsuy]*)$/);
  if (regexMatch) {
    try {
      const rx = new RegExp(regexMatch[1], regexMatch[2] || 'i');
      return data.filter(row => {
        const values = getRowValues(row);
        // Optimize: use find instead of join for early exit
        return values.some(v => rx.test(String(v ?? ''))) ||
               rx.test(values.map(v => String(v ?? '')).join(' '));
      });
    } catch {
      // Invalid regex, fall through to token parsing
    }
  }

  // Parse tokens with support for quoted phrases, negation, and OR groups
  const tokens: Array<{
    type: 'include' | 'exclude' | 'or';
    values: string[];
  }> = [];
  
  const tokenRegex = /"([^"]+)"|'([^']+)'|([^\s]+)/g;
  let match: RegExpExecArray | null = tokenRegex.exec(trimmed);
  
  while (match !== null) {
    const tokenRaw = (match[1] ?? match[2] ?? match[3]).trim();
    if (tokenRaw) {
      if (tokenRaw.startsWith('-') && tokenRaw.length > 1) {
        // Negation token
        tokens.push({ type: 'exclude', values: [tokenRaw.slice(1).toLowerCase()] });
      } else if (tokenRaw.includes('|')) {
        // OR group
        tokens.push({ type: 'or', values: tokenRaw.split('|').map(p => p.toLowerCase()) });
      } else {
        // Include token
        tokens.push({ type: 'include', values: [tokenRaw.toLowerCase()] });
      }
    }
    match = tokenRegex.exec(trimmed);
  }

  // No valid tokens
  if (tokens.length === 0) return data;

  // Pre-compile for batch processing
  return data.filter(row => {
    const values = getRowValues(row);
    const rowText = values.map(v => String(v ?? '')).join(' ').toLowerCase();

    // All tokens must match their conditions
    return tokens.every(token => {
      switch (token.type) {
        case 'include':
          return rowText.includes(token.values[0]);
        case 'exclude':
          return !rowText.includes(token.values[0]);
        case 'or':
          return token.values.some(v => rowText.includes(v));
        default:
          return true;
      }
    });
  });
}

/**
 * Filter data by filter model - Performance Optimized
 * Uses batched processing and early exit strategies
 */
export function filterData<TData extends RowData>(
  data: TData[],
  filterModel: FilterModel[],
  quickFilterText: string,
  getColumnValue: (row: TData, colId: string) => CellValue,
  getRowValues: (row: TData) => CellValue[]
): TData[] {
  // Fast paths
  if (data.length === 0) return data;
  
  const hasColumnFilters = filterModel.length > 0;
  const hasQuickFilter = !!quickFilterText?.trim();
  
  if (!hasColumnFilters && !hasQuickFilter) return data;

  let filtered = data;

  // Apply column filters with optimized batch processing
  if (hasColumnFilters) {
    // Pre-compute filter functions for each column filter
    const filterChecks = filterModel.map(filter => ({
      colId: filter.colId,
      check: (row: TData) => applyFilter(getColumnValue(row, filter.colId), filter),
    }));

    filtered = filtered.filter(row => {
      // Use every() for short-circuit evaluation
      return filterChecks.every(fc => fc.check(row));
    });
  }

  // Apply quick filter
  if (hasQuickFilter) {
    filtered = applyQuickFilter(filtered, quickFilterText, getRowValues);
  }

  return filtered;
}

// ============================================================================
// Filtering Plugin
// ============================================================================

let _pluginApi: GridApi<RowData> | null = null;
let _pluginConfig: FilteringPluginConfig = {};
let debounceTimer: ReturnType<typeof setTimeout> | null = null;

export const filteringPlugin: GridPlugin<RowData> = {
  name: 'filtering',

  init(api: GridApi<RowData>, config?: FilteringPluginConfig) {
    _pluginApi = api;
    _pluginConfig = config || {};
  },

  destroy() {
    _pluginApi = null;
    _pluginConfig = {};
    if (debounceTimer) {
      clearTimeout(debounceTimer);
      debounceTimer = null;
    }
  },
};

// ============================================================================
// Filtering Hook
// ============================================================================

export function useFiltering<TData extends RowData>(api: GridApi<TData>) {
  const setFilter = (colId: string, filterType: FilterType, value: unknown, operator?: FilterModel['operator']) => {
    const currentModel = api.getFilterModel();
    const existingIndex = currentModel.findIndex(f => f.colId === colId);
    
    if (value == null || value === '' || (Array.isArray(value) && value.length === 0)) {
      // Remove filter
      if (existingIndex >= 0) {
        api.setFilterModel(currentModel.filter((_, i) => i !== existingIndex));
      }
    } else {
      // Add or update filter
      const newFilter: FilterModel = { colId, filterType, value, operator };
      if (existingIndex >= 0) {
        api.setFilterModel(currentModel.map((f, i) => i === existingIndex ? newFilter : f));
      } else {
        api.setFilterModel([...currentModel, newFilter]);
      }
    }
  };

  const clearFilter = (colId: string) => {
    const currentModel = api.getFilterModel();
    api.setFilterModel(currentModel.filter(f => f.colId !== colId));
  };

  const clearAllFilters = () => {
    api.setFilterModel([]);
    api.setQuickFilter('');
  };

  const getFilter = (colId: string): FilterModel | undefined => {
    return api.getFilterModel().find(f => f.colId === colId);
  };

  const isFiltered = (colId: string): boolean => {
    return api.getFilterModel().some(f => f.colId === colId);
  };

  return {
    setFilter,
    clearFilter,
    clearAllFilters,
    getFilter,
    isFiltered,
    setQuickFilter: api.setQuickFilter.bind(api),
    filterModel: api.getFilterModel(),
  };
}
