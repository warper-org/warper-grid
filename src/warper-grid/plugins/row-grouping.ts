import type {
  RowData,
  GridPlugin,
  GridApi,
  CellValue,
  ColumnDef,
} from '../types';

// ============================================================================
// Row Grouping Types
// ============================================================================

export interface RowGroupingPluginConfig {
  /** Columns to group by initially */
  groupBy?: string[];
  /** Whether to auto-expand groups */
  autoExpandGroups?: boolean;
  /** Max group depth */
  maxGroupDepth?: number;
  /** Show group row count */
  showGroupRowCount?: boolean;
  /** Custom group row renderer */
  groupRowRenderer?: React.ComponentType<GroupRowRendererParams>;
  /** Enable drag to group panel */
  enableGroupPanel?: boolean;
  /** Callback when grouping changes */
  onGroupingChanged?: (groupBy: string[]) => void;
}

export interface GroupRowRendererParams<TData extends RowData = RowData> {
  /** Group key value */
  groupKey: CellValue;
  /** Column being grouped */
  column: ColumnDef<TData>;
  /** Aggregated values */
  aggregations: Record<string, CellValue>;
  /** Child row count */
  childCount: number;
  /** Current depth level */
  depth: number;
  /** Whether expanded */
  isExpanded: boolean;
  /** Toggle expanded state */
  toggleExpand: () => void;
}

export interface GroupRow<TData extends RowData = RowData> {
  /** Type discriminator */
  __isGroupRow: true;
  /** Group key value */
  groupKey: CellValue;
  /** Column id being grouped */
  groupColId: string;
  /** Group depth level */
  depth: number;
  /** Parent group key path */
  parentPath: CellValue[];
  /** Full path including current */
  path: CellValue[];
  /** Child data rows */
  children: (TData | GroupRow<TData>)[];
  /** Leaf row count */
  leafCount: number;
  /** Aggregated values */
  aggregations: Record<string, CellValue>;
  /** Whether expanded */
  isExpanded: boolean;
}

export interface GroupingState {
  /** Columns being grouped */
  groupBy: string[];
  /** Expanded group paths */
  expandedGroups: Set<string>;
}

// ============================================================================
// Aggregation Functions
// ============================================================================

export type AggregationFunction = 'sum' | 'avg' | 'count' | 'min' | 'max' | 'first' | 'last';

export const aggregationFunctions: Record<AggregationFunction, (values: CellValue[]) => CellValue> = {
  sum: (values) => {
    const nums = values.filter(v => typeof v === 'number') as number[];
    return nums.reduce((a, b) => a + b, 0);
  },
  avg: (values) => {
    const nums = values.filter(v => typeof v === 'number') as number[];
    if (nums.length === 0) return null;
    return nums.reduce((a, b) => a + b, 0) / nums.length;
  },
  count: (values) => values.length,
  min: (values) => {
    const nums = values.filter(v => typeof v === 'number') as number[];
    if (nums.length === 0) return null;
    return Math.min(...nums);
  },
  max: (values) => {
    const nums = values.filter(v => typeof v === 'number') as number[];
    if (nums.length === 0) return null;
    return Math.max(...nums);
  },
  first: (values) => values[0] ?? null,
  last: (values) => values[values.length - 1] ?? null,
};

/**
 * Calculate aggregation for a group
 */
export function calculateAggregation(
  aggFunc: AggregationFunction | ((values: CellValue[]) => CellValue),
  values: CellValue[]
): CellValue {
  if (typeof aggFunc === 'function') {
    return aggFunc(values);
  }
  return aggregationFunctions[aggFunc]?.(values) ?? null;
}

// ============================================================================
// Grouping Utilities
// ============================================================================

/**
 * Create group path string for Set storage
 */
export function createGroupPath(path: CellValue[]): string {
  return path.map(v => String(v)).join('|||');
}

/**
 * Check if a row is a group row
 */
export function isGroupRow<TData extends RowData>(
  row: TData | GroupRow<TData>
): row is GroupRow<TData> {
  return (row as GroupRow<TData>).__isGroupRow === true;
}

/**
 * Group data by columns
 */
export function groupData<TData extends RowData>(
  data: TData[],
  groupBy: string[],
  columns: ColumnDef<TData>[],
  expandedGroups: Set<string>,
  getFieldValue: (row: TData, colId: string) => CellValue
): (TData | GroupRow<TData>)[] {
  if (groupBy.length === 0) {
    return data;
  }

  const groupColumn = groupBy[0];
  const remainingGroups = groupBy.slice(1);
  
  // Group by first column
  const groups = new Map<string, TData[]>();
  
  for (const row of data) {
    const value = getFieldValue(row, groupColumn);
    const key = String(value ?? '__null__');
    
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(row);
  }
  
  // Create group rows
  const result: (TData | GroupRow<TData>)[] = [];
  
  for (const [key, children] of groups) {
    const groupKey = key === '__null__' ? null : key;
    const path = [groupKey];
    const pathStr = createGroupPath(path);
    const isExpanded = expandedGroups.has(pathStr);
    
    // Calculate aggregations
    const aggregations: Record<string, CellValue> = {};
    for (const col of columns) {
      if (col.aggFunc) {
        const values = children.map(row => getFieldValue(row, col.id));
        aggregations[col.id] = calculateAggregation(col.aggFunc, values);
      }
    }
    
    // Recursively group children if more group levels
    let groupedChildren: (TData | GroupRow<TData>)[] = children;
    if (remainingGroups.length > 0 && isExpanded) {
      groupedChildren = groupDataRecursive(
        children,
        remainingGroups,
        columns,
        expandedGroups,
        getFieldValue,
        path,
        1
      );
    }
    
    const groupRow: GroupRow<TData> = {
      __isGroupRow: true,
      groupKey,
      groupColId: groupColumn,
      depth: 0,
      parentPath: [],
      path,
      children: isExpanded ? groupedChildren : children,
      leafCount: children.length,
      aggregations,
      isExpanded,
    };
    
    result.push(groupRow);
    
    // Add children if expanded
    if (isExpanded) {
      if (remainingGroups.length > 0) {
        result.push(...groupedChildren);
      } else {
        result.push(...children);
      }
    }
  }
  
  return result;
}

function groupDataRecursive<TData extends RowData>(
  data: TData[],
  groupBy: string[],
  columns: ColumnDef<TData>[],
  expandedGroups: Set<string>,
  getFieldValue: (row: TData, colId: string) => CellValue,
  parentPath: CellValue[],
  depth: number
): (TData | GroupRow<TData>)[] {
  if (groupBy.length === 0) {
    return data;
  }

  const groupColumn = groupBy[0];
  const remainingGroups = groupBy.slice(1);
  
  const groups = new Map<string, TData[]>();
  
  for (const row of data) {
    const value = getFieldValue(row, groupColumn);
    const key = String(value ?? '__null__');
    
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(row);
  }
  
  const result: (TData | GroupRow<TData>)[] = [];
  
  for (const [key, children] of groups) {
    const groupKey = key === '__null__' ? null : key;
    const path = [...parentPath, groupKey];
    const pathStr = createGroupPath(path);
    const isExpanded = expandedGroups.has(pathStr);
    
    const aggregations: Record<string, CellValue> = {};
    for (const col of columns) {
      if (col.aggFunc) {
        const values = children.map(row => getFieldValue(row, col.id));
        aggregations[col.id] = calculateAggregation(col.aggFunc, values);
      }
    }
    
    let groupedChildren: (TData | GroupRow<TData>)[] = children;
    if (remainingGroups.length > 0 && isExpanded) {
      groupedChildren = groupDataRecursive(
        children,
        remainingGroups,
        columns,
        expandedGroups,
        getFieldValue,
        path,
        depth + 1
      );
    }
    
    const groupRow: GroupRow<TData> = {
      __isGroupRow: true,
      groupKey,
      groupColId: groupColumn,
      depth,
      parentPath,
      path,
      children: isExpanded ? groupedChildren : children,
      leafCount: children.length,
      aggregations,
      isExpanded,
    };
    
    result.push(groupRow);
    
    if (isExpanded) {
      if (remainingGroups.length > 0) {
        result.push(...groupedChildren);
      } else {
        result.push(...children);
      }
    }
  }
  
  return result;
}

/**
 * Flatten grouped data for display
 */
export function flattenGroupedData<TData extends RowData>(
  groupedData: (TData | GroupRow<TData>)[]
): (TData | GroupRow<TData>)[] {
  const result: (TData | GroupRow<TData>)[] = [];
  
  function flatten(items: (TData | GroupRow<TData>)[]) {
    for (const item of items) {
      result.push(item);
      if (isGroupRow(item) && item.isExpanded) {
        flatten(item.children);
      }
    }
  }
  
  flatten(groupedData);
  return result;
}

// ============================================================================
// Row Grouping Plugin
// ============================================================================

export function createRowGroupingPlugin<TData extends RowData = RowData>(
  config?: RowGroupingPluginConfig
): GridPlugin<TData> {
  let api: GridApi<TData> | null = null;
  
  const pluginConfig: RowGroupingPluginConfig = {
    groupBy: [],
    autoExpandGroups: false,
    maxGroupDepth: 10,
    showGroupRowCount: true,
    enableGroupPanel: true,
    ...config,
  };

  return {
    name: 'rowGrouping',
    init: (gridApi) => {
      api = gridApi;
    },
    destroy: () => {
      api = null;
    },
  };
}

export default createRowGroupingPlugin;
