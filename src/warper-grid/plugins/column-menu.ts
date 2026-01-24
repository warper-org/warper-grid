import type {
  RowData,
  GridPlugin,
  GridApi,
  ColumnDef,
  SortDirection,
  ColumnPin,
} from '../types';

// ============================================================================
// Column Menu Types
// ============================================================================

export interface ColumnMenuItem<TData extends RowData = RowData> {
  /** Unique identifier */
  id: string;
  /** Display name */
  name: string;
  /** Icon */
  icon?: React.ReactNode;
  /** Whether item is disabled */
  disabled?: boolean | ((params: ColumnMenuParams<TData>) => boolean);
  /** Whether to show item */
  hidden?: boolean | ((params: ColumnMenuParams<TData>) => boolean);
  /** Sub-menu items */
  subMenu?: ColumnMenuItem<TData>[];
  /** Separator before this item */
  separator?: boolean;
  /** Checkbox state */
  checked?: boolean | ((params: ColumnMenuParams<TData>) => boolean);
  /** Action when clicked */
  action?: (params: ColumnMenuParams<TData>) => void;
}

export interface ColumnMenuParams<TData extends RowData = RowData> {
  /** Column definition */
  column: ColumnDef<TData>;
  /** Column id */
  colId: string;
  /** Grid API */
  api: GridApi<TData>;
  /** Close the menu */
  closeMenu: () => void;
}

export interface ColumnMenuState {
  isOpen: boolean;
  x: number;
  y: number;
  colId: string | null;
}

export interface ColumnMenuPluginConfig<TData extends RowData = RowData> {
  /** Custom menu items */
  items?: ColumnMenuItem<TData>[] | ((params: ColumnMenuParams<TData>) => ColumnMenuItem<TData>[]);
  /** Extra items to append */
  extraItems?: ColumnMenuItem<TData>[];
  /** Suppress default items */
  suppressDefaultItems?: boolean;
  /** Show filter in menu */
  showFilter?: boolean;
  /** Menu tabs */
  tabs?: ('general' | 'filter' | 'columns')[];
}

// ============================================================================
// Default Column Menu Items
// ============================================================================

export function getDefaultColumnMenuItems<TData extends RowData = RowData>(): ColumnMenuItem<TData>[] {
  return [
    // Sorting
    {
      id: 'sortAsc',
      name: 'Sort Ascending',
      action: (params) => {
        params.api.setSortModel([{ colId: params.colId, sort: 'asc' }]);
        params.closeMenu();
      },
    },
    {
      id: 'sortDesc',
      name: 'Sort Descending',
      action: (params) => {
        params.api.setSortModel([{ colId: params.colId, sort: 'desc' }]);
        params.closeMenu();
      },
    },
    {
      id: 'clearSort',
      name: 'Clear Sort',
      disabled: (params) => {
        const sortModel = params.api.getSortModel();
        return !sortModel.some(s => s.colId === params.colId);
      },
      action: (params) => {
        const sortModel = params.api.getSortModel().filter(s => s.colId !== params.colId);
        params.api.setSortModel(sortModel);
        params.closeMenu();
      },
    },
    {
      id: 'separator1',
      name: '',
      separator: true,
    },
    // Pinning
    {
      id: 'pinning',
      name: 'Pin Column',
      subMenu: [
        {
          id: 'pinLeft',
          name: 'Pin Left',
          action: (params) => {
            params.api.setColumnPinned(params.colId, 'left');
            params.closeMenu();
          },
        },
        {
          id: 'pinRight',
          name: 'Pin Right',
          action: (params) => {
            params.api.setColumnPinned(params.colId, 'right');
            params.closeMenu();
          },
        },
        {
          id: 'unpin',
          name: 'No Pin',
          action: (params) => {
            params.api.setColumnPinned(params.colId, false);
            params.closeMenu();
          },
        },
      ],
    },
    {
      id: 'separator2',
      name: '',
      separator: true,
    },
    // Sizing
    {
      id: 'autoSize',
      name: 'Auto-size Column',
      action: (params) => {
        params.api.autoSizeColumn(params.colId);
        params.closeMenu();
      },
    },
    {
      id: 'autoSizeAll',
      name: 'Auto-size All Columns',
      action: (params) => {
        params.api.autoSizeAllColumns();
        params.closeMenu();
      },
    },
    {
      id: 'resetColumns',
      name: 'Reset Columns',
      action: (params) => {
        // Reset all column state
        const columns = params.api.getColumns();
        columns.forEach(col => {
          params.api.setColumnWidth(col.id, col.width || 150);
          params.api.setColumnPinned(col.id, col.pinned || false);
          params.api.setColumnVisible(col.id, !col.hide);
        });
        params.closeMenu();
      },
    },
    {
      id: 'separator3',
      name: '',
      separator: true,
    },
    // Visibility
    {
      id: 'hideColumn',
      name: 'Hide Column',
      disabled: (params) => params.column.lockVisible === true,
      action: (params) => {
        params.api.setColumnVisible(params.colId, false);
        params.closeMenu();
      },
    },
  ];
}

/**
 * Get column visibility submenu items
 */
export function getColumnVisibilityItems<TData extends RowData = RowData>(
  api: GridApi<TData>
): ColumnMenuItem<TData>[] {
  const columns = api.getColumns();
  
  return columns
    .filter(col => !col.lockVisible)
    .map(col => ({
      id: `visibility-${col.id}`,
      name: col.headerName || col.id,
      checked: (params: ColumnMenuParams<TData>) => {
        // Check if column is visible using the API to get current state
        const currentCol = params.api.getColumns().find(c => c.id === col.id);
        const colState = params.api.getState().columnState.get(col.id);
        // Column is visible if not hidden in definition and not hidden in state
        const isHidden = colState?.hide ?? currentCol?.hide ?? false;
        return !isHidden;
      },
      action: (params: ColumnMenuParams<TData>) => {
        const colState = params.api.getState().columnState.get(col.id);
        const currentCol = params.api.getColumns().find(c => c.id === col.id);
        const isCurrentlyHidden = colState?.hide ?? currentCol?.hide ?? false;
        params.api.setColumnVisible(col.id, isCurrentlyHidden);
      },
    }));
}

// ============================================================================
// Column Menu Plugin
// ============================================================================

export function createColumnMenuPlugin<TData extends RowData = RowData>(
  config?: ColumnMenuPluginConfig<TData>
): GridPlugin<TData> {
  let pluginApi: GridApi<TData> | null = null;

  return {
    name: 'columnMenu',
    init: (gridApi) => {
      pluginApi = gridApi;
    },
    destroy: () => {
      pluginApi = null;
    },
  };
}

export default createColumnMenuPlugin;
