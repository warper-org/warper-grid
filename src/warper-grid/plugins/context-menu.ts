import type {
  RowData,
  GridPlugin,
  GridApi,
  CellValue,
} from '../types';

// ============================================================================
// Context Menu Types
// ============================================================================

export interface ContextMenuItem<TData extends RowData = RowData> {
  /** Unique identifier */
  id: string;
  /** Display name */
  name: string;
  /** Icon component or element */
  icon?: React.ReactNode;
  /** Keyboard shortcut display */
  shortcut?: string;
  /** Whether item is disabled */
  disabled?: boolean | ((params: ContextMenuParams<TData>) => boolean);
  /** Whether to show item */
  hidden?: boolean | ((params: ContextMenuParams<TData>) => boolean);
  /** CSS class */
  cssClass?: string;
  /** Sub-menu items */
  subMenu?: ContextMenuItem<TData>[];
  /** Separator before this item */
  separator?: boolean;
  /** Action when clicked */
  action?: (params: ContextMenuParams<TData>) => void;
}

export interface ContextMenuParams<TData extends RowData = RowData> {
  /** Row index where context menu was triggered */
  rowIndex: number | null;
  /** Column id where context menu was triggered */
  colId: string | null;
  /** Cell value */
  value: CellValue;
  /** Row data */
  data: TData | null;
  /** Grid API */
  api: GridApi<TData>;
  /** Original mouse event */
  event: React.MouseEvent;
  /** Selected rows */
  selectedRows: TData[];
  /** Close the context menu */
  closeMenu: () => void;
}

export interface ContextMenuPluginConfig<TData extends RowData = RowData> {
  /** Custom menu items (replaces default) */
  items?: ContextMenuItem<TData>[] | ((params: ContextMenuParams<TData>) => ContextMenuItem<TData>[]);
  /** Additional menu items (appended to default) */
  extraItems?: ContextMenuItem<TData>[];
  /** Suppress default items */
  suppressDefaultItems?: boolean;
}

export interface ContextMenuState {
  isOpen: boolean;
  x: number;
  y: number;
  rowIndex: number | null;
  colId: string | null;
  value: CellValue;
}

// ============================================================================
// Default Context Menu Items
// ============================================================================

export function getDefaultContextMenuItems<TData extends RowData = RowData>(): ContextMenuItem<TData>[] {
  return [
    {
      id: 'copy',
      name: 'Copy',
      shortcut: '⌘C',
      action: (params) => {
        if (params.value != null) {
          navigator.clipboard.writeText(String(params.value));
        }
      },
    },
    {
      id: 'copyWithHeaders',
      name: 'Copy with Headers',
      shortcut: '⌘⇧C',
      action: (params) => {
        const col = params.api.getColumn(params.colId || '');
        const header = col?.headerName || col?.id || '';
        const text = `${header}\n${params.value ?? ''}`;
        navigator.clipboard.writeText(text);
      },
    },
    {
      id: 'copyRow',
      name: 'Copy Row',
      action: (params) => {
        if (params.data) {
          const columns = params.api.getColumns();
          const values = columns.map(col => {
            const field = col.field as string;
            return field ? (params.data as Record<string, unknown>)[field] : '';
          });
          navigator.clipboard.writeText(values.join('\t'));
        }
      },
    },
    {
      id: 'separator1',
      name: '',
      separator: true,
    },
    {
      id: 'paste',
      name: 'Paste',
      shortcut: '⌘V',
      disabled: true, // Will be enabled by clipboard plugin
      action: async (params) => {
        // Clipboard plugin will handle this
      },
    },
    {
      id: 'separator2',
      name: '',
      separator: true,
    },
    {
      id: 'export',
      name: 'Export',
      subMenu: [
        {
          id: 'exportCsv',
          name: 'CSV Export',
          action: (params) => {
            params.api.exportToCsv();
          },
        },
        {
          id: 'exportSelectedCsv',
          name: 'CSV Export (Selected Only)',
          disabled: (params) => params.selectedRows.length === 0,
          action: (params) => {
            params.api.exportToCsv({ onlySelected: true });
          },
        },
      ],
    },
    {
      id: 'separator3',
      name: '',
      separator: true,
    },
    {
      id: 'selectAll',
      name: 'Select All',
      shortcut: '⌘A',
      action: (params) => {
        params.api.selectAll();
      },
    },
    {
      id: 'deselectAll',
      name: 'Deselect All',
      action: (params) => {
        params.api.deselectAll();
      },
    },
  ];
}

// ============================================================================
// Context Menu Plugin
// ============================================================================

export function createContextMenuPlugin<TData extends RowData = RowData>(
  config?: ContextMenuPluginConfig<TData>
): GridPlugin<TData> {
  let pluginApi: GridApi<TData> | null = null;

  return {
    name: 'contextMenu',
    init: (gridApi, pluginConfig) => {
      pluginApi = gridApi;
      // Plugin initialized - state management happens in React component
    },
    destroy: () => {
      pluginApi = null;
    },
  };
}

export default createContextMenuPlugin;
