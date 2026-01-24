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
// Filter Utilities
// ============================================================================

/**
 * Check if a value matches a text filter
 */
export function matchesTextFilter(
  value: CellValue,
  filterValue: string,
  operator: string = 'contains'
): boolean {
  if (filterValue === '' || filterValue == null) return true;
  if (value == null) return operator === 'blank';

  const strValue = String(value).toLowerCase();
  const filterStr = String(filterValue).toLowerCase();

  switch (operator) {
    case 'equals':
      return strValue === filterStr;
    case 'notEquals':
      return strValue !== filterStr;
    case 'contains':
      return strValue.includes(filterStr);
    case 'notContains':
      return !strValue.includes(filterStr);
    case 'startsWith':
      return strValue.startsWith(filterStr);
    case 'endsWith':
      return strValue.endsWith(filterStr);
    case 'blank':
      return strValue.trim() === '';
    case 'notBlank':
      return strValue.trim() !== '';
    default:
      return strValue.includes(filterStr);
  }
}

/**
 * Check if a value matches a number filter
 */
export function matchesNumberFilter(
  value: CellValue,
  filterValue: unknown,
  operator: string = 'equals'
): boolean {
  if (filterValue == null || filterValue === '') return true;
  if (value == null) return operator === 'blank';

  const numValue = typeof value === 'number' ? value : parseFloat(String(value));
  
  if (isNaN(numValue)) {
    return operator === 'blank';
  }

  const filterNum = typeof filterValue === 'number' ? filterValue : parseFloat(String(filterValue));

  switch (operator) {
    case 'equals':
      return numValue === filterNum;
    case 'notEquals':
      return numValue !== filterNum;
    case 'lessThan':
      return numValue < filterNum;
    case 'lessThanOrEqual':
      return numValue <= filterNum;
    case 'greaterThan':
      return numValue > filterNum;
    case 'greaterThanOrEqual':
      return numValue >= filterNum;
    case 'between':
      if (Array.isArray(filterValue) && filterValue.length === 2) {
        return numValue >= filterValue[0] && numValue <= filterValue[1];
      }
      return true;
    case 'blank':
      return isNaN(numValue);
    case 'notBlank':
      return !isNaN(numValue);
    default:
      return numValue === filterNum;
  }
}

/**
 * Check if a value matches a date filter
 */
export function matchesDateFilter(
  value: CellValue,
  filterValue: unknown,
  operator: string = 'equals'
): boolean {
  if (filterValue == null) return true;
  if (value == null) return operator === 'blank';

  const dateValue = value instanceof Date ? value : new Date(String(value));
  
  if (isNaN(dateValue.getTime())) {
    return operator === 'blank';
  }

  const filterDate = filterValue instanceof Date ? filterValue : new Date(String(filterValue));

  // Compare dates without time
  const dateOnly = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

  switch (operator) {
    case 'equals':
      return dateOnly(dateValue) === dateOnly(filterDate);
    case 'notEquals':
      return dateOnly(dateValue) !== dateOnly(filterDate);
    case 'lessThan':
      return dateValue < filterDate;
    case 'lessThanOrEqual':
      return dateValue <= filterDate;
    case 'greaterThan':
      return dateValue > filterDate;
    case 'greaterThanOrEqual':
      return dateValue >= filterDate;
    case 'between':
      if (Array.isArray(filterValue) && filterValue.length === 2) {
        const start = new Date(filterValue[0]);
        const end = new Date(filterValue[1]);
        return dateValue >= start && dateValue <= end;
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
 * Check if a value matches a select filter
 */
export function matchesSelectFilter(
  value: CellValue,
  filterValue: unknown
): boolean {
  if (filterValue == null || filterValue === '') return true;
  
  const strValue = String(value ?? '');
  
  if (Array.isArray(filterValue)) {
    // Multi-select
    return filterValue.length === 0 || filterValue.some(f => String(f) === strValue);
  }
  
  return strValue === String(filterValue);
}

/**
 * Apply a single filter to a value
 */
export function applyFilter(
  value: CellValue,
  filter: FilterModel
): boolean {
  const { filterType, value: filterValue, operator } = filter;
  
  switch (filterType) {
    case 'text':
      return matchesTextFilter(value, filterValue as string, operator);
    case 'number':
      return matchesNumberFilter(value, filterValue, operator);
    case 'date':
      return matchesDateFilter(value, filterValue, operator);
    case 'boolean':
      return matchesBooleanFilter(value, filterValue);
    case 'select':
    case 'multi-select':
      return matchesSelectFilter(value, filterValue);
    default:
      return matchesTextFilter(value, String(filterValue ?? ''), operator);
  }
}

/**
 * Apply quick filter to data
 */
export function applyQuickFilter<TData extends RowData>(
  data: TData[],
  quickFilterText: string,
  getRowValues: (row: TData) => CellValue[]
): TData[] {
  if (!quickFilterText || quickFilterText.trim() === '') {
    return data;
  }

  const trimmed = quickFilterText.trim();

  // If user provided a regex literal: /pattern/flags
  const regexLiteral = trimmed.match(/^\/(.*)\/(i?)$/i);
  if (regexLiteral) {
    try {
      const pattern = regexLiteral[1];
      const flags = regexLiteral[2] || '';
      const rx = new RegExp(pattern, flags);
      return data.filter(row => {
        const values = getRowValues(row);
        const rowText = values.map(v => String(v ?? '')).join(' ');
        return rx.test(rowText);
      });
    } catch (err) {
      // Fall through to token parsing on invalid regex
      console.warn('[QuickFilter] invalid regex', err);
    }
  }

  // Tokenize with support for quoted phrases ("..."), negation (-term), and OR groups (a|b)
  const tokens: string[] = [];
  const tokenRegex = /"([^"]+)"|'([^']+)'|([^\s]+)/g;
  let m: RegExpExecArray | null;
  while ((m = tokenRegex.exec(trimmed)) !== null) {
    tokens.push(m[1] ?? m[2] ?? m[3]);
  }

  return data.filter(row => {
    const values = getRowValues(row);
    const rowText = values.map(v => String(v ?? '')).join(' ').toLowerCase();

    // All tokens must match (unless negated)
    return tokens.every(tokenRaw => {
      if (!tokenRaw) return true;
      const token = tokenRaw.trim();

      // Negation
      if (token.startsWith('-') && token.length > 1) {
        const t = token.slice(1).toLowerCase();
        return !rowText.includes(t);
      }

      // OR group e.g. a|b (match any)
      if (token.includes('|')) {
        const parts = token.split('|').map(p => p.toLowerCase());
        return parts.some(p => rowText.includes(p));
      }

      // Default partial match
      return rowText.includes(token.toLowerCase());
    });
  });
}

/**
 * Filter data by filter model
 */
export function filterData<TData extends RowData>(
  data: TData[],
  filterModel: FilterModel[],
  quickFilterText: string,
  getColumnValue: (row: TData, colId: string) => CellValue,
  getRowValues: (row: TData) => CellValue[]
): TData[] {
  let filtered = data;

  // Apply column filters
  if (filterModel.length > 0) {
    filtered = filtered.filter(row => {
      return filterModel.every(filter => {
        const value = getColumnValue(row, filter.colId);
        return applyFilter(value, filter);
      });
    });
  }

  // Apply quick filter
  if (quickFilterText) {
    filtered = applyQuickFilter(filtered, quickFilterText, getRowValues);
  }

  return filtered;
}

// ============================================================================
// Filtering Plugin
// ============================================================================

let pluginApi: GridApi<RowData> | null = null;
let pluginConfig: FilteringPluginConfig = {};
let debounceTimer: ReturnType<typeof setTimeout> | null = null;

export const filteringPlugin: GridPlugin<RowData> = {
  name: 'filtering',

  init(api: GridApi<RowData>, config?: FilteringPluginConfig) {
    pluginApi = api;
    pluginConfig = config || {};
  },

  destroy() {
    pluginApi = null;
    pluginConfig = {};
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
