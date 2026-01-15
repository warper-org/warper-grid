// ============================================================================
// WarperGrid - High-performance React Data Grid
// Built on the Warper virtualization library
// ============================================================================

// Main Component
export { WarperGrid, type WarperGridRef } from './WarperGrid';

// Types
export type {
  // Core types
  RowData,
  CellValue,
  ColumnDef,
  ColumnAlign,
  ColumnPin,
  SortDirection,
  FilterType,
  
  // Callback params
  ValueGetterParams,
  ValueFormatterParams,
  CellRendererParams,
  HeaderRendererParams,
  CellEditorParams,
  CellClassParams,
  HeaderClassParams,
  TooltipParams,
  
  // Renderer types
  CellRenderer,
  HeaderRenderer,
  CellEditor,
  
  // State types
  GridState,
  SortModel,
  FilterModel,
  SelectionState,
  ColumnState,
  
  // API types
  GridApi,
  
  // Event types
  GridEventParams,
  CellClickEvent,
  CellDoubleClickEvent,
  CellValueChangedEvent,
  RowClickEvent,
  SelectionChangedEvent,
  SortChangedEvent,
  FilterChangedEvent,
  ColumnResizedEvent,
  PageChangedEvent,
  GridEvent,
  
  // Export types
  ExportParams,
  
  // Plugin types
  PluginName,
  PluginConfig,
  GridPlugin,
  SortingPluginConfig,
  FilteringPluginConfig,
  PaginationPluginConfig,
  SelectionPluginConfig,
  ColumnResizingPluginConfig,
  ExportPluginConfig,
  
  // Props types
  WarperGridProps,
  ComputedColumn,
} from './types';

// Context
export { useGridContext, GridProvider } from './context';

// Plugin system
export { 
  PluginManager, 
  createPluginManager,
  registerPlugin,
  unregisterPlugin,
  getRegisteredPlugins,
} from './plugin-manager';

// Plugin hooks
export {
  // Sorting
  useSorting,
  sortData,
  defaultComparator,
  updateSortModel,
  getNextSortDirection,
} from './plugins/sorting';

export {
  // Filtering
  useFiltering,
  filterData,
  applyFilter,
  applyQuickFilter,
  matchesTextFilter,
  matchesNumberFilter,
  matchesDateFilter,
  matchesBooleanFilter,
  matchesSelectFilter,
} from './plugins/filtering';

export {
  // Pagination
  usePagination,
  paginateData,
  getPaginationInfo,
  getPageNumbers,
} from './plugins/pagination';

export {
  // Selection
  useSelection,
  handleRowSelection,
  handleCellSelection,
  isRowSelected,
  isCellSelected,
} from './plugins/selection';

export {
  // Column Resizing
  useColumnResizing,
  calculateNewWidth,
  getResizerProps,
} from './plugins/column-resizing';

export {
  // Export
  useExport,
  dataToCSV,
  downloadCSV,
  copyToClipboard,
  escapeCsvValue,
} from './plugins/export';

// Components
export {
  GridHeader,
  GridBody,
  GridPagination,
  GridToolbar,
  QuickFilter,
} from './components';
