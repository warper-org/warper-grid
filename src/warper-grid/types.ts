import type { ReactNode, CSSProperties } from 'react';

// ============================================================================
// Core Data Types
// ============================================================================

/** Generic row data type - can be any object with string keys */
export type RowData = Record<string, unknown>;

/** Cell value can be any primitive or object */
export type CellValue = string | number | boolean | Date | null | undefined | object;

// ============================================================================
// Column Definition Types
// ============================================================================

/** Column alignment options */
export type ColumnAlign = 'left' | 'center' | 'right';

/** Column pin position */
export type ColumnPin = 'left' | 'right' | false;

/** Sort direction */
export type SortDirection = 'asc' | 'desc' | null;

/** Filter type */
export type FilterType = 'text' | 'number' | 'date' | 'boolean' | 'select' | 'multi-select';

/** Column definition for WarperGrid */
export interface ColumnDef<TData extends RowData = RowData> {
  /** Unique identifier for the column */
  id: string;
  
  /** Field key to access data from row object */
  field?: keyof TData | string;
  
  /** Display header text */
  headerName?: string;
  
  /** Column width in pixels */
  width?: number;
  
  /** Minimum column width */
  minWidth?: number;
  
  /** Maximum column width */
  maxWidth?: number;
  
  /** Flex grow factor for auto-sizing */
  flex?: number;
  
  /** Text alignment */
  align?: ColumnAlign;
  
  /** Header text alignment */
  headerAlign?: ColumnAlign;
  
  /** Pin column to left or right */
  pinned?: ColumnPin;
  
  /** Enable sorting */
  sortable?: boolean;
  
  /** Enable filtering */
  filterable?: boolean;
  
  /** Filter type */
  filterType?: FilterType;
  
  /** Enable resizing */
  resizable?: boolean;
  
  /** Enable cell editing */
  editable?: boolean;
  
  /** Hide column */
  hide?: boolean;
  
  /** Lock column visibility (cannot be hidden) */
  lockVisible?: boolean;
  
  /** Lock column position (cannot be moved) */
  lockPosition?: boolean;
  
  /** Custom value getter */
  valueGetter?: (params: ValueGetterParams<TData>) => CellValue;
  
  /** Custom value formatter */
  valueFormatter?: (params: ValueFormatterParams<TData>) => string;
  
  /** Custom cell renderer component */
  cellRenderer?: CellRenderer<TData>;
  
  /** Custom cell renderer params */
  cellRendererParams?: Record<string, unknown>;
  
  /** Custom header renderer component */
  headerRenderer?: HeaderRenderer<TData>;
  
  /** Custom cell editor component */
  cellEditor?: CellEditor<TData>;
  
  /** CSS class for header cell */
  headerClass?: string | ((params: HeaderClassParams<TData>) => string);
  
  /** CSS class for body cells */
  cellClass?: string | ((params: CellClassParams<TData>) => string);
  
  /** CSS style for header cell */
  headerStyle?: CSSProperties | ((params: HeaderClassParams<TData>) => CSSProperties);
  
  /** CSS style for body cells */
  cellStyle?: CSSProperties | ((params: CellClassParams<TData>) => CSSProperties);
  
  /** Tooltip value getter */
  tooltipValueGetter?: (params: TooltipParams<TData>) => string;
  
  /** Column group id for grouped headers */
  columnGroupId?: string;
  
  /** Child columns for grouped headers */
  children?: ColumnDef<TData>[];
  
  /** Comparator function for custom sorting */
  comparator?: (valueA: CellValue, valueB: CellValue, nodeA: TData, nodeB: TData) => number;
  
  /** Custom filter function */
  filterFn?: (value: CellValue, filterValue: unknown, row: TData) => boolean;
  
  /** Aggregation function for grouped rows */
  aggFunc?: 'sum' | 'avg' | 'count' | 'min' | 'max' | 'first' | 'last' | ((values: CellValue[]) => CellValue);
}

// ============================================================================
// Callback Parameter Types
// ============================================================================

/** Base params available in all callbacks */
export interface BaseParams<TData extends RowData = RowData> {
  /** Column definition */
  column: ColumnDef<TData>;
  /** Column index */
  columnIndex: number;
  /** Grid API reference */
  api: GridApi<TData>;
}

/** Params for value getter */
export interface ValueGetterParams<TData extends RowData = RowData> extends BaseParams<TData> {
  /** Row data */
  data: TData;
  /** Row index */
  rowIndex: number;
}

/** Params for value formatter */
export interface ValueFormatterParams<TData extends RowData = RowData> extends ValueGetterParams<TData> {
  /** Raw cell value */
  value: CellValue;
}

/** Params for cell class */
export interface CellClassParams<TData extends RowData = RowData> extends ValueFormatterParams<TData> {}

/** Params for header class */
export interface HeaderClassParams<TData extends RowData = RowData> extends BaseParams<TData> {}

/** Params for tooltip */
export interface TooltipParams<TData extends RowData = RowData> extends ValueFormatterParams<TData> {}

/** Params for cell renderer */
export interface CellRendererParams<TData extends RowData = RowData> extends ValueFormatterParams<TData> {
  /** Custom params passed to renderer */
  params?: Record<string, unknown>;
  /** Refresh the cell */
  refreshCell: () => void;
  /** Set cell value */
  setValue: (value: CellValue) => void;
}

/** Params for header renderer */
export interface HeaderRendererParams<TData extends RowData = RowData> extends BaseParams<TData> {
  /** Current sort direction */
  sortDirection: SortDirection;
  /** Toggle sort */
  toggleSort: () => void;
  /** Is column being resized */
  isResizing: boolean;
}

/** Params for cell editor */
export interface CellEditorParams<TData extends RowData = RowData> extends CellRendererParams<TData> {
  /** Stop editing and save value */
  stopEditing: (cancel?: boolean) => void;
  /** Original value before editing */
  originalValue: CellValue;
}

// ============================================================================
// Renderer Types
// ============================================================================

export type CellRenderer<TData extends RowData = RowData> = 
  | React.ComponentType<CellRendererParams<TData>>
  | ((params: CellRendererParams<TData>) => ReactNode);

export type HeaderRenderer<TData extends RowData = RowData> = 
  | React.ComponentType<HeaderRendererParams<TData>>
  | ((params: HeaderRendererParams<TData>) => ReactNode);

export type CellEditor<TData extends RowData = RowData> = 
  | React.ComponentType<CellEditorParams<TData>>
  | ((params: CellEditorParams<TData>) => ReactNode);

// ============================================================================
// Grid State Types
// ============================================================================

/** Sort model for a column */
export interface SortModel {
  colId: string;
  sort: SortDirection;
}

/** Filter model for a column */
export interface FilterModel {
  colId: string;
  filterType: FilterType;
  value: unknown;
  operator?: 'equals' | 'notEquals' | 'contains' | 'notContains' | 'startsWith' | 'endsWith' | 'lessThan' | 'lessThanOrEqual' | 'greaterThan' | 'greaterThanOrEqual' | 'between' | 'blank' | 'notBlank';
}

/** Selection state */
export interface SelectionState {
  selectedRows: Set<number>;
  selectedCells: Set<string>; // Format: "rowIndex:colId"
  anchorCell: { rowIndex: number; colId: string } | null;
  /** Marker that all rows are selected without materializing the index set */
  allSelected?: boolean;
}

/** Column state */
export interface ColumnState {
  colId: string;
  width?: number;
  pinned?: ColumnPin;
  hide?: boolean;
  sort?: SortDirection;
  sortIndex?: number;
}

/** Grid state */
export interface GridState<TData extends RowData = RowData> {
  /** Current data */
  data: TData[];
  /** Processed (filtered/sorted) data */
  processedData: TData[];
  /** Column definitions */
  columns: ColumnDef<TData>[];
  /** Column state overrides */
  columnState: Map<string, ColumnState>;
  /** Sort model */
  sortModel: SortModel[];
  /** Filter model */
  filterModel: FilterModel[];
  /** Selection state */
  selection: SelectionState;
  /** Current page (0-indexed) */
  page: number;
  /** Page size */
  pageSize: number;
  /** Previous non-'All' page size (useful when toggling 'All') */
  previousPageSize?: number;
  /** Is loading */
  isLoading: boolean;
  /** Quick filter text */
  quickFilterText: string;
}

// ============================================================================
// Grid API Types
// ============================================================================

/** Grid API for programmatic control */
export interface GridApi<TData extends RowData = RowData> {
  // Data operations
  getData: () => TData[];
  setData: (data: TData[]) => void;
  getDisplayedData: () => TData[];
  getRowCount: () => number;
  getDisplayedRowCount: () => number;
  refreshCells: (params?: { rowIndices?: number[]; columns?: string[] }) => void;
  
  // Column operations
  getColumns: () => ColumnDef<TData>[];
  getColumn: (colId: string) => ColumnDef<TData> | undefined;
  setColumnDefs: (columns: ColumnDef<TData>[]) => void;
  setColumnWidth: (colId: string, width: number) => void;
  setColumnVisible: (colId: string, visible: boolean) => void;
  setColumnPinned: (colId: string, pinned: ColumnPin) => void;
  autoSizeColumn: (colId: string) => void;
  autoSizeAllColumns: () => void;
  moveColumn: (fromIdx: number, toIdx: number, animation?: boolean) => void;
  
  // Sorting
  getSortModel: () => SortModel[];
  setSortModel: (sortModel: SortModel[]) => void;
  
  // Filtering
  getFilterModel: () => FilterModel[];
  setFilterModel: (filterModel: FilterModel[]) => void;
  setQuickFilter: (text: string) => void;
  
  // Selection
  getSelectedRows: () => TData[];
  getSelectedRowIndices: () => number[];
  selectRow: (rowIndex: number, clearOthers?: boolean) => void;
  deselectRow: (rowIndex: number) => void;
  selectAll: () => void;
  deselectAll: () => void;
  
  // Pagination
  getPage: () => number;
  setPage: (page: number) => void;
  getPageSize: () => number;
  setPageSize: (pageSize: number) => void;
  /** Get the last non-'All' page size (if available) */
  getPreviousPageSize: () => number | undefined;
  getTotalPages: () => number;
  nextPage: () => void;
  previousPage: () => void;
  firstPage: () => void;
  lastPage: () => void;
  
  // Scrolling
  scrollToRow: (rowIndex: number, behavior?: ScrollBehavior) => void;
  scrollToColumn: (colId: string) => void;
  scrollToCell: (rowIndex: number, colId: string) => void;
  
  // Cell editing
  startEditing: (rowIndex: number, colId: string) => void;
  stopEditing: (cancel?: boolean) => void;
  
  // Export
  exportToCsv: (params?: ExportParams) => void;
  
  // State
  getState: () => GridState<TData>;
  setState: (state: Partial<GridState<TData>>) => void;
}

// ============================================================================
// Event Types
// ============================================================================

/** Base event params */
export interface GridEventParams<TData extends RowData = RowData> {
  api: GridApi<TData>;
  type: string;
}

/** Cell click event */
export interface CellClickEvent<TData extends RowData = RowData> extends GridEventParams<TData> {
  type: 'cellClick';
  rowIndex: number;
  colId: string;
  value: CellValue;
  data: TData;
  event: React.MouseEvent;
}

/** Cell double click event */
export interface CellDoubleClickEvent<TData extends RowData = RowData> extends GridEventParams<TData> {
  type: 'cellDoubleClick';
  rowIndex: number;
  colId: string;
  value: CellValue;
  data: TData;
  event: React.MouseEvent;
}

/** Cell value change event */
export interface CellValueChangedEvent<TData extends RowData = RowData> extends GridEventParams<TData> {
  type: 'cellValueChanged';
  rowIndex: number;
  colId: string;
  oldValue: CellValue;
  newValue: CellValue;
  data: TData;
}

/** Row click event */
export interface RowClickEvent<TData extends RowData = RowData> extends GridEventParams<TData> {
  type: 'rowClick';
  rowIndex: number;
  data: TData;
  event: React.MouseEvent;
}

/** Row selection changed event */
export interface SelectionChangedEvent<TData extends RowData = RowData> extends GridEventParams<TData> {
  type: 'selectionChanged';
  selectedRows: TData[];
  selectedIndices: number[];
}

/** Sort changed event */
export interface SortChangedEvent<TData extends RowData = RowData> extends GridEventParams<TData> {
  type: 'sortChanged';
  sortModel: SortModel[];
}

/** Filter changed event */
export interface FilterChangedEvent<TData extends RowData = RowData> extends GridEventParams<TData> {
  type: 'filterChanged';
  filterModel: FilterModel[];
}

/** Column resized event */
export interface ColumnResizedEvent<TData extends RowData = RowData> extends GridEventParams<TData> {
  type: 'columnResized';
  colId: string;
  width: number;
}

/** Page changed event */
export interface PageChangedEvent<TData extends RowData = RowData> extends GridEventParams<TData> {
  type: 'pageChanged';
  page: number;
  pageSize: number;
}

/** All grid events union type */
export type GridEvent<TData extends RowData = RowData> =
  | CellClickEvent<TData>
  | CellDoubleClickEvent<TData>
  | CellValueChangedEvent<TData>
  | RowClickEvent<TData>
  | SelectionChangedEvent<TData>
  | SortChangedEvent<TData>
  | FilterChangedEvent<TData>
  | ColumnResizedEvent<TData>
  | PageChangedEvent<TData>;

// ============================================================================
// Export Types
// ============================================================================

export interface ExportParams {
  fileName?: string;
  columnKeys?: string[];
  onlySelected?: boolean;
  skipHeader?: boolean;
  columnSeparator?: string;
}

// ============================================================================
// Plugin Types
// ============================================================================

/** Plugin feature names */
export type PluginName =
  | 'sorting'
  | 'filtering'
  | 'pagination'
  | 'selection'
  | 'columnResizing'
  | 'columnPinning'
  | 'columnMoving'
  | 'rowPinning'
  | 'cellEditing'
  | 'rowGrouping'
  | 'aggregation'
  | 'pivot'
  | 'export'
  | 'clipboard'
  | 'contextMenu'
  | 'columnMenu'
  | 'statusBar'
  | 'sideBar'
  | 'masterDetail'
  | 'treeData'
  | 'charts'
  | 'sparklines'
  | 'sqlQuery'
  | 'liveUpdate'
  | '*';

/** Plugin configuration */
export interface PluginConfig {
  sorting?: SortingPluginConfig;
  filtering?: FilteringPluginConfig;
  pagination?: PaginationPluginConfig;
  selection?: SelectionPluginConfig;
  columnResizing?: ColumnResizingPluginConfig;
  export?: ExportPluginConfig;
  contextMenu?: ContextMenuPluginConfig;
  cellSelection?: CellSelectionPluginConfig;
  clipboard?: ClipboardPluginConfig;
  columnMenu?: ColumnMenuPluginConfig;
  cellEditing?: CellEditingPluginConfig;
  rowGrouping?: RowGroupingPluginConfig;
  masterDetail?: MasterDetailPluginConfig;
  statusBar?: StatusBarPluginConfig;
  [key: string]: unknown;
}

export interface SortingPluginConfig {
  multiSort?: boolean;
  defaultSort?: SortModel[];
}

export interface FilteringPluginConfig {
  debounce?: number;
  quickFilter?: boolean;
}

export interface PaginationPluginConfig {
  pageSize?: number;
  pageSizes?: number[];
}

export interface SelectionPluginConfig {
  mode?: 'single' | 'multiple' | 'none';
  checkboxSelection?: boolean;
  headerCheckbox?: boolean;
}

export interface ColumnResizingPluginConfig {
  minWidth?: number;
  maxWidth?: number;
}

export interface ExportPluginConfig {
  fileName?: string;
  includeHeaders?: boolean;
}

export interface ContextMenuPluginConfig {
  suppressContextMenu?: boolean;
  getContextMenuItems?: (params: unknown) => unknown[];
}

export interface CellSelectionPluginConfig {
  enableRangeSelection?: boolean;
  enableFillHandle?: boolean;
  suppressMultiRangeSelection?: boolean;
}

export interface ClipboardPluginConfig {
  copyHeadersToClipboard?: boolean;
  clipboardDelimiter?: string;
  suppressCopyRowsToClipboard?: boolean;
  processCellForClipboard?: (params: unknown) => unknown;
  processCellFromClipboard?: (params: unknown) => unknown;
}

export interface ColumnMenuPluginConfig {
  suppressColumnMenu?: boolean;
  mainMenuItems?: unknown[];
}

export interface CellEditingPluginConfig {
  editType?: 'fullRow' | 'singleCell';
  singleClickEdit?: boolean;
  enterMovesDown?: boolean;
  undoRedoCellEditing?: boolean;
  undoRedoCellEditingLimit?: number;
}

export interface RowGroupingPluginConfig {
  rowGroupPanelShow?: 'always' | 'onlyWhenGrouping' | 'never';
  groupDefaultExpanded?: number;
  autoGroupColumnDef?: unknown;
}

export interface MasterDetailPluginConfig {
  masterDetail?: boolean;
  detailRowHeight?: number;
  detailCellRendererParams?: unknown;
  keepDetailRows?: boolean;
}

export interface StatusBarPluginConfig {
  statusPanels?: unknown[];
}

/** Plugin interface */
export interface GridPlugin<TData extends RowData = RowData> {
  name: PluginName;
  init?: (api: GridApi<TData>, config?: unknown) => void;
  destroy?: () => void;
  onStateChange?: (state: GridState<TData>) => void;
  headerComponent?: React.ComponentType<unknown>;
  cellComponent?: React.ComponentType<unknown>;
  panelComponent?: React.ComponentType<unknown>;
  toolbarComponent?: React.ComponentType<unknown>;
}

// ============================================================================
// Grid Props Types
// ============================================================================

/** Main WarperGrid props */
export interface WarperGridProps<TData extends RowData = RowData> {
  /** Row data array */
  data: TData[];
  
  /** Column definitions */
  columns: ColumnDef<TData>[];
  
  /** Row height in pixels */
  rowHeight?: number;
  
  /** Header height in pixels */
  headerHeight?: number;
  
  /** Grid height */
  height?: number | string;
  
  /** Grid width */
  width?: number | string;
  
  /** Overscan count for virtualization */
  overscan?: number;
  
  /** Enable row striping */
  striped?: boolean;
  
  /** Show borders */
  bordered?: boolean;
  
  /** Compact mode */
  compact?: boolean;
  
  /** Loading state */
  loading?: boolean;
  
  /** Empty state message */
  emptyMessage?: string;
  
  /** Loading component */
  loadingComponent?: ReactNode;
  
  /** Empty component */
  emptyComponent?: ReactNode;
  
  /** Custom class name */
  className?: string;
  
  /** Custom styles */
  style?: CSSProperties;
  
  /** Get row id for React keys */
  getRowId?: (data: TData, index: number) => string | number;
  
  // Event handlers
  onCellClick?: (event: CellClickEvent<TData>) => void;
  onCellDoubleClick?: (event: CellDoubleClickEvent<TData>) => void;
  onCellValueChanged?: (event: CellValueChangedEvent<TData>) => void;
  onRowClick?: (event: RowClickEvent<TData>) => void;
  onSelectionChanged?: (event: SelectionChangedEvent<TData>) => void;
  onSortChanged?: (event: SortChangedEvent<TData>) => void;
  onFilterChanged?: (event: FilterChangedEvent<TData>) => void;
  onColumnResized?: (event: ColumnResizedEvent<TData>) => void;
  onPageChanged?: (event: PageChangedEvent<TData>) => void;
  
  /** Grid ready callback with API */
  onGridReady?: (api: GridApi<TData>) => void;
}

// ============================================================================
// Internal Types
// ============================================================================

/** Internal row data with index */
export interface InternalRowData<TData extends RowData = RowData> {
  data: TData;
  rowIndex: number;
  originalIndex: number;
}

/** Computed column with resolved widths */
export interface ComputedColumn<TData extends RowData = RowData> extends ColumnDef<TData> {
  computedWidth: number;
  offsetLeft: number;
}
