import {
  useReducer,
  useRef,
  useEffect,
  useMemo,
  forwardRef,
  useImperativeHandle,
  useCallback,
  useState,
  memo,
  type ForwardedRef,
  type ReactNode,
} from 'react';
import { useDebouncedCallback } from 'use-debounce';
import { useVirtualizer } from '@itsmeadarsh/warper';
import { cn } from '@/lib/utils';
import { evaluateFormula } from './utils/formula';
import {
  gridReducer,
  createInitialState,
  createGridApi,
  GridProvider,
  type GridAction,
} from './context';
import { sortData } from './plugins/sorting';
import { filterData } from './plugins/filtering';
import { paginateData } from './plugins/pagination';
import { GridHeader } from './components/GridHeader';
import { GridPagination } from './components/GridPagination';
import { ContextMenu } from './components/ContextMenu';
import { StatusBar } from './components/StatusBar';
import { PluginManager } from './plugin-manager';
import type {
  RowData,
  WarperGridProps,
  GridApi,
  CellValue,
  PluginName,
  PluginConfig,
  ComputedColumn,
  CellRendererParams,
  ColumnPin,
} from './types';
import { parseInputValue } from './plugins/cell-editing';
import type { ContextMenuState } from './plugins/context-menu';
import type { CellPosition } from './plugins/cell-selection';

// ============================================================================
// Performance-Optimized Grid Cell Component
// ============================================================================

interface GridCellProps<TData extends RowData> {
  col: ComputedColumn<TData>;
  colIndex: number;
  rowIndex: number;
  rowData: TData;
  api: GridApi<TData>;
  isSelected?: boolean;
  isActive?: boolean;
  isCut?: boolean;
  onCellClick?: (rowIndex: number, colId: string, value: CellValue, data: TData, event: React.MouseEvent) => void;
  onCellDoubleClick?: (rowIndex: number, colId: string, value: CellValue, data: TData, event: React.MouseEvent) => void;
  onCellMouseDown?: (rowIndex: number, colId: string, event: React.MouseEvent) => void;
  onCellMouseEnter?: (rowIndex: number, colId: string, event: React.MouseEvent) => void;
  onCellTouchStart?: (rowIndex: number, colId: string, event: React.TouchEvent) => void;
  globalCellStyle?: WarperGridProps<TData>['cellStyle'];
}

function GridCellInner<TData extends RowData>({
  col,
  colIndex,
  rowIndex,
  rowData,
  api,
  isSelected,
  isActive,
  isCut,
  onCellClick,
  onCellDoubleClick,
  onCellMouseDown,
  onCellMouseEnter,
  onCellTouchStart,
  globalCellStyle,
}: GridCellProps<TData>) {
  const value = col.field
    ? (rowData as Record<string, unknown>)[col.field as string] as CellValue
    : null;

  // Compute display value only if formatter exists
  const displayValue = col.valueFormatter
    ? col.valueFormatter({ value, data: rowData, column: col, columnIndex: colIndex, rowIndex, api })
    : value;

  // Pre-compute styles only if dynamic
  const cellClass = typeof col.cellClass === 'function'
    ? col.cellClass({ value, data: rowData, column: col, columnIndex: colIndex, rowIndex, api })
    : col.cellClass;

  const colCellStyle = typeof col.cellStyle === 'function'
    ? col.cellStyle({ value, data: rowData, column: col, columnIndex: colIndex, rowIndex, api })
    : col.cellStyle;
  const globalStyle = typeof globalCellStyle === 'function'
    ? globalCellStyle({ value, data: rowData, column: col, columnIndex: colIndex, rowIndex, api })
    : globalCellStyle;
  const cellStyle = { ...(colCellStyle || {}), ...(globalStyle || {}) } as React.CSSProperties;

  return (
    <div
      className={cn(
        'warper-grid-cell',
        cellClass,
        isSelected && 'warper-grid-cell--selected',
        isActive && 'warper-grid-cell--active',
        isCut && 'warper-grid-cell--cut',
        col.pinned === 'left' && 'warper-grid-cell--pinned-left',
        col.pinned === 'right' && 'warper-grid-cell--pinned-right'
      )}
      style={{
        width: col.computedWidth,
        minWidth: col.minWidth,
        maxWidth: col.maxWidth,
        textAlign: col.align || 'left',
        /* Pinned columns are not sticky anymore — they appear inline in the column order */
        ...(cellStyle),
        ...cellStyle,
      }}
      onClick={onCellClick ? (e) => { e.stopPropagation(); onCellClick(rowIndex, col.id, value, rowData, e); } : undefined}
      onDoubleClick={onCellDoubleClick ? (e) => { e.stopPropagation(); onCellDoubleClick(rowIndex, col.id, value, rowData, e); } : undefined}
      onMouseDown={onCellMouseDown ? (e) => { onCellMouseDown(rowIndex, col.id, e); } : undefined}
      onMouseEnter={onCellMouseEnter ? (e) => { onCellMouseEnter(rowIndex, col.id, e); } : undefined}
      onTouchStart={onCellTouchStart ? (e) => { onCellTouchStart(rowIndex, col.id, e); } : undefined}
    >
      {col.cellRenderer ? (
        (col.cellRenderer as (params: CellRendererParams<TData>) => ReactNode)({
          value,
          data: rowData,
          column: col,
          columnIndex: colIndex,
          rowIndex,
          api,
          params: col.cellRendererParams,
          refreshCell: () => { },
          setValue: () => { },
        })
      ) : (
        // Show editor if this cell is currently being edited
        api.getState().editing?.isEditing && api.getState().editing?.editingCell?.rowIndex === rowIndex && api.getState().editing?.editingCell?.colId === col.id ? (
          <input
            autoFocus
            className="w-full h-full px-2"
            defaultValue={displayValue != null ? String(displayValue) : ''}
            onBlur={(e) => {
              const newVal = e.target.value;
              // commit via dispatch
              const state = api.getState();
              const colDef = state.columns[colIndex];
              const parsed = parseInputValue(newVal, colDef as any);
              // Handle formula vs literal
              let commitValue: any = parsed;
              if (typeof newVal === 'string' && newVal.trim().startsWith('=')) {
                // Evaluate formula
                commitValue = evaluateFormula(newVal, rowIndex, col.id, state.processedData, state.columns as any);
              }
              api.applyEdit?.(rowIndex, col.id, api.getState().editing?.originalValue, commitValue);
              api.stopEditing();
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                (e.target as HTMLInputElement).blur();
              } else if (e.key === 'Escape') {
                api.stopEditing?.(true);
              }
            }}
          />
        ) : (
          <span className="truncate">
            {displayValue != null ? String(displayValue) : ''}
          </span>
        )
      )}
    </div>
  );
}

const GridCell = memo(GridCellInner) as typeof GridCellInner;

// ============================================================================
// Performance-Optimized Grid Row Component
// ============================================================================

interface GridRowProps<TData extends RowData> {
  rowIndex: number;
  rowData: TData;
  rowId: string | number;
  columns: ComputedColumn<TData>[];
  totalWidth: number;
  offset: number;
  height: number;
  isSelected: boolean;
  striped: boolean;
  api: GridApi<TData>;
  selectedCells?: Set<string>;
  activeCell?: CellPosition | null;
  cutCells?: Set<string>;
  onRowClick?: (rowIndex: number, data: TData, event: React.MouseEvent) => void;
  onCellClick?: (rowIndex: number, colId: string, value: CellValue, data: TData, event: React.MouseEvent) => void;
  onCellDoubleClick?: (rowIndex: number, colId: string, value: CellValue, data: TData, event: React.MouseEvent) => void;
  onCellMouseDown?: (rowIndex: number, colId: string, event: React.MouseEvent) => void;
  onCellMouseEnter?: (rowIndex: number, colId: string, event: React.MouseEvent) => void;
  onCellTouchStart?: (rowIndex: number, colId: string, event: React.TouchEvent) => void;
  globalCellStyle?: WarperGridProps<TData>['cellStyle'];
}


function GridRowInner<TData extends RowData>({
  rowIndex,
  rowData,
  columns,
  totalWidth,
  offset,
  height,
  isSelected,
  striped,
  api,
  selectedCells,
  activeCell,
  cutCells,
  onRowClick,
  onCellClick,
  onCellDoubleClick,
  onCellMouseDown,
  onCellMouseEnter,
  onCellTouchStart,
  globalCellStyle,
}: GridRowProps<TData>) {
  // All rows are now flat SQL results. Render as normal rows.
  return (
    <div
      className={cn(
        'warper-grid-row',
        isSelected && 'warper-grid-row--selected',
        striped && 'warper-grid-row--striped'
      )}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        transform: `translateY(${offset}px)`,
        height,
        width: totalWidth,
        display: 'flex',
      }}
      onClick={onRowClick ? (e) => onRowClick(rowIndex, rowData, e) : undefined}
    >
      {columns.map((col, colIndex) => {
        const cellKey = `${rowIndex}:${col.id}`;
        const isCellSelected = selectedCells?.has(cellKey) ?? false;
        const isCellActive = activeCell?.rowIndex === rowIndex && activeCell?.colId === col.id;
        const isCellCut = cutCells?.has(cellKey) ?? false;
        return (
          <GridCell
            key={col.id}
            col={col}
            colIndex={colIndex}
            rowIndex={rowIndex}
            rowData={rowData}
            api={api}
            isSelected={isCellSelected}
            isActive={isCellActive}
            isCut={isCellCut}
            onCellClick={onCellClick}
            onCellDoubleClick={onCellDoubleClick}
            onCellMouseDown={onCellMouseDown}
            onCellMouseEnter={onCellMouseEnter}
            onCellTouchStart={onCellTouchStart}
            globalCellStyle={globalCellStyle}
          />
        );
      })}
    </div>
  );
}

const GridRow = memo(GridRowInner, (prev, next) => {
  // Custom comparison for better performance
  return (
    prev.rowIndex === next.rowIndex &&
    prev.offset === next.offset &&
    prev.height === next.height &&
    prev.isSelected === next.isSelected &&
    prev.totalWidth === next.totalWidth &&
    prev.rowData === next.rowData &&
    prev.columns === next.columns &&
    prev.selectedCells === next.selectedCells &&
    prev.activeCell === next.activeCell &&
    prev.cutCells === next.cutCells
  );
}) as typeof GridRowInner;

// ============================================================================
// WarperGrid Component
// ============================================================================

export interface WarperGridRef<TData extends RowData = RowData> {
  /** Grid API for programmatic control */
  api: GridApi<TData>;
  /** Attach plugins */
  attach: (plugins: PluginName[], config?: PluginConfig) => void;
  /** Detach plugins */
  detach: (plugins: PluginName[]) => void;
}

function WarperGridInner<TData extends RowData>(
  props: WarperGridProps<TData>,
  ref: ForwardedRef<WarperGridRef<TData>>
) {
  const {
    data,
    columns,
    rowHeight = 40,
    headerHeight = 44,
    height = '100%',
    width = '100%',
    overscan = 10, // Increased for smoother scrolling
    striped = false,
    bordered = true,
    compact = false,
    loading = false,
    emptyMessage = 'No data to display',
    loadingComponent,
    emptyComponent,
    className,
    style,
    getRowId,
    onCellClick,
    onCellDoubleClick,
    cellStyle: globalCellStyle,
    onRowClick,
    onSelectionChanged,
    onSortChanged,
    onFilterChanged,
    onPageChanged,
    onGridReady,
    maxClientSideRows = 10000,
    renderTime,
    useWasm = true,
    actualTotalRows,
  } = props;

  // Initialize state
  const [state, dispatch] = useReducer(
    gridReducer<TData>,
    { data, columns },
    ({ data, columns }) => createInitialState(data, columns)
  );

  // Context menu state
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({
    isOpen: false,
    x: 0,
    y: 0,
    rowIndex: null,
    colId: null,
    value: null,
  });

  // Cell selection state
  const [cellSelection, setCellSelection] = useState<{
    selectedCells: Set<string>;
    activeCell: CellPosition | null;
    anchorCell: CellPosition | null;
    isSelecting: boolean;
  }>({
    selectedCells: new Set(),
    activeCell: null,
    anchorCell: null,
    isSelecting: false,
  });

  // Currently focused cell for context menu
  const focusedCellRef = useRef<{ rowIndex: number; colId: string; data: TData | null }>({
    rowIndex: -1,
    colId: '',
    data: null,
  });

  // Plugin manager - singleton per grid instance
  const pluginManagerRef = useRef<PluginManager<TData> | null>(null);
  if (!pluginManagerRef.current) {
    pluginManagerRef.current = new PluginManager<TData>();
  }

  // Virtualizer ref for scrolling
  const scrollToIndexRef = useRef<((index: number, behavior?: ScrollBehavior) => void) | null>(null);

  // State ref for API
  const stateRef = useRef(state);
  stateRef.current = state;

  // Create grid API (memoized)
  const api = useMemo(
    () => createGridApi<TData>(
      stateRef as React.MutableRefObject<typeof state>,
      dispatch,
      (index, behavior) => scrollToIndexRef.current?.(index, behavior)
    ),
    []
  );

  // Notify plugins on every state update so plugins can react to edit/selection changes
  useEffect(() => {
    if (pluginManagerRef.current) {
      try {
        pluginManagerRef.current.notifyStateChange(state);
      } catch (err) {
        // swallow plugin errors to avoid breaking grid
        console.error('Plugin onStateChange error:', err);
      }
    }
  }, [state]);

  // Initialize plugin manager
  useEffect(() => {
    pluginManagerRef.current!.init(api);
  }, [api]);

  // Warn about large datasets without pagination - with throttling to avoid spam
  const warnedAboutLargeDataset = useRef(false);
  useEffect(() => {
    const isPaginationEnabled = pluginManagerRef.current!.isLoaded('pagination');
    const isLargeDataset = state.data.length > maxClientSideRows;

    if (isLargeDataset && !isPaginationEnabled && !warnedAboutLargeDataset.current) {
      warnedAboutLargeDataset.current = true;
      console.warn(
        `⚠️ WarperGrid Performance Warning:\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `Large dataset detected: ${state.data.length.toLocaleString()} rows\n` +
        `Maximum recommended for client-side: ${maxClientSideRows.toLocaleString()} rows\n\n` +
        `Recommendations:\n` +
        `  1. Enable pagination plugin: attach(['pagination'])\n` +
        `  2. Use server-side filtering/sorting for better performance\n` +
        `  3. Consider reducing dataset size or implementing virtual scrolling\n\n` +
        `Note: Client-side sorting/filtering is disabled for datasets exceeding the limit.`
      );
    }

    // Reset warning flag if dataset becomes smaller
    if (!isLargeDataset) {
      warnedAboutLargeDataset.current = false;
    }
  }, [state.data.length, maxClientSideRows]);

  // Expose ref methods
  useImperativeHandle(ref, () => ({
    api,
    attach: (plugins: PluginName[], config?: PluginConfig) => {
      pluginManagerRef.current!.attach(plugins, config);
    },
    detach: (plugins: PluginName[]) => {
      pluginManagerRef.current!.detach(plugins);
    },
  }), [api]);

  // Sync data prop to state (batch update)
  useEffect(() => {
    if (data !== state.data) {
      dispatch({ type: 'SET_DATA', payload: data });
    }
  }, [data]);

  // Sync columns prop to state
  useEffect(() => {
    if (columns !== state.columns) {
      dispatch({ type: 'SET_COLUMNS', payload: columns });
    }
  }, [columns]);

  // Memoized column value getter
  const getColumnValue = useCallback((row: TData, colId: string): CellValue => {
    const col = state.columns.find(c => c.id === colId);
    if (!col) return null;

    if (col.valueGetter) {
      return col.valueGetter({
        data: row,
        column: col,
        columnIndex: state.columns.indexOf(col),
        rowIndex: 0,
        api,
      });
    }

    if (col.field) {
      return (row as Record<string, unknown>)[col.field as string] as CellValue;
    }

    return null;
  }, [state.columns, api]);


  // Debounced filter/sort for 0% performance loss
  // IMPORTANT: Sort and filter the FULL dataset first, pagination is applied separately during render
  const [processedData, setProcessedData] = useState(state.data);
  const debouncedProcessData = useDebouncedCallback(() => {
    const hasFilters = state.filterModel.length > 0 || state.quickFilterText;
    const hasSorts = state.sortModel.length > 0;

    // If no filters/sorts, processedData should reflect the full dataset
    // Pagination will be applied separately when rendering via paginatedData
    if (!hasFilters && !hasSorts) {
      setProcessedData(state.data);
      return;
    }

    // For large datasets without pagination, skip processing and warn
    if (state.data.length > maxClientSideRows && !pluginManagerRef.current!.isLoaded('pagination')) {
      console.warn(
        `WarperGrid: Dataset has ${state.data.length} rows, exceeding maxClientSideRows (${maxClientSideRows}). ` +
        'Client-side filtering and sorting are disabled for performance. ' +
        'Consider using server-side processing or pagination for large datasets.'
      );
      setProcessedData(state.data);
      return;
    }

    // Process the FULL dataset - pagination happens separately at render time
    let result = state.data;

    // Apply filters first (reduces dataset for sorting)
    if (hasFilters) {
      const getRowValues = (row: TData): CellValue[] => {
        return state.columns.map(col => getColumnValue(row, col.id));
      };
      result = filterData(
        result,
        state.filterModel,
        state.quickFilterText,
        getColumnValue,
        getRowValues
      );
    }

    // Apply sorting on the filtered (or full) dataset
    if (hasSorts) {
      result = sortData(
        result,
        state.sortModel,
        getColumnValue,
        (colId) => state.columns.find(c => c.id === colId)?.comparator
      );
    }

    setProcessedData(result);
  }, 0, { maxWait: 16 }); // 0ms wait, but batch within a frame

  useEffect(() => {
    debouncedProcessData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.data, state.filterModel, state.quickFilterText, state.sortModel, state.columns, getColumnValue]);


  // Sync processedData into grid state for plugins that read state.processedData
  useEffect(() => {
    const stateProcessed = state.processedData;
    // Only dispatch when the processed data differs to avoid update loops
    if (stateProcessed.length !== processedData.length || stateProcessed !== processedData) {
      dispatch({ type: 'UPDATE_PROCESSED_DATA', payload: processedData });
    }
  }, [processedData, state.processedData, dispatch]);




  // Intelligent rendering: use paginated data if pagination is enabled, else full data
  const isPaginationEnabled = pluginManagerRef.current!.isLoaded('pagination');
  const paginatedData = useMemo(() => {
    if (!isPaginationEnabled) return processedData;
    // If 'All' is selected, return all processed rows
    if (state.pageSize === 0 || state.pageSize >= processedData.length) return processedData;
    return paginateData(processedData, state.page, state.pageSize);
  }, [processedData, state.page, state.pageSize, isPaginationEnabled]);


  // If 'All' is selected, treat as infinite scroll over the full dataset (use total rows)
  const totalRowsCount = processedData.length;
  const isAllRows = isPaginationEnabled && (state.pageSize === 0 || state.pageSize >= totalRowsCount);
  // If 'All' is selected, show all processed rows; otherwise, show only the paginated slice
  const virtualRows = isPaginationEnabled && !isAllRows ? paginatedData : processedData;
  const virtualItemCount = virtualRows.length;

  // If 'All' is selected, hide pagination UI and always show all rows
  const showPagination = isPaginationEnabled && !isAllRows;

  // Compute column widths (memoized) and handle pinned columns
  const computedColumns = useMemo((): ComputedColumn<TData>[] => {
    const allVisible = state.columns.filter(col => {
      const colState = state.columnState.get(col.id);
      return !(col.hide || colState?.hide);
    });

    const getPinned = (c: typeof allVisible[0]) => (state.columnState.get(c.id)?.pinned ?? c.pinned) as ColumnPin;

    const leftPinned = allVisible.filter(c => getPinned(c) === 'left');
    const rightPinned = allVisible.filter(c => getPinned(c) === 'right');
    const normal = allVisible.filter(c => getPinned(c) !== 'left' && getPinned(c) !== 'right');

    const leftComputed: ComputedColumn<TData>[] = [];
    let leftOffset = 0;
    for (const col of leftPinned) {
      const colState = state.columnState.get(col.id);
      const computedWidth = colState?.width ?? col.width ?? 150;
      leftComputed.push({ ...col, computedWidth, offsetLeft: leftOffset });
      leftOffset += computedWidth;
    }

    const normalComputed: ComputedColumn<TData>[] = [];
    let normalOffset = leftOffset;
    for (const col of normal) {
      const colState = state.columnState.get(col.id);
      const computedWidth = colState?.width ?? col.width ?? 150;
      normalComputed.push({ ...col, computedWidth, offsetLeft: normalOffset });
      normalOffset += computedWidth;
    }

    // Right pinned: compute widths first, we'll calculate their offsetLeft from the right edge
    const rightComputed: ComputedColumn<TData>[] = [];
    let rightTotalWidth = 0;
    for (let i = rightPinned.length - 1; i >= 0; i--) {
      const col = rightPinned[i];
      const colState = state.columnState.get(col.id);
      const computedWidth = colState?.width ?? col.width ?? 150;
      rightComputed.unshift({ ...col, computedWidth, offsetLeft: -1 }); // placeholder
      rightTotalWidth += computedWidth;
    }

    // Merge to compute total width
    const merged = [...leftComputed, ...normalComputed, ...rightComputed];
    const totalWidthCalculated = merged.reduce((s, c) => s + c.computedWidth, 0);

    // Assign offsetLeft and offsetRight for right pinned columns from right edge
    let accFromRight = 0;
    for (let i = rightComputed.length - 1; i >= 0; i--) {
      const c = rightComputed[i];
      accFromRight += c.computedWidth;
      // place from left = totalWidth - accFromRight
      (c as ComputedColumn<TData>).offsetLeft = totalWidthCalculated - accFromRight;
      // offsetRight = accFromRight - width
      (c as any).offsetRight = accFromRight - c.computedWidth;
    }

    return [...leftComputed, ...normalComputed, ...rightComputed];
  }, [state.columns, state.columnState]);

  // Total row width
  const totalWidth = useMemo(() =>
    computedColumns.reduce((sum, col) => sum + col.computedWidth, 0),
    [computedColumns]);

  // Setup virtualizer


  // Virtualizer only allocates for visible rows (paginated or full)
  const {
    scrollElementRef,
    range,
    totalHeight,
    isLoading: wasmLoading,
    error: wasmError,
    scrollToIndex,
  } = useVirtualizer({
    itemCount: virtualItemCount,
    estimateSize: () => rowHeight,
    overscan,
  });

  // Store scrollToIndex ref
  useEffect(() => {
    scrollToIndexRef.current = scrollToIndex;
  }, [scrollToIndex]);


  // Keyboard shortcuts
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      // If the user is typing in an input/textarea/contentEditable, ignore global shortcuts
      const activeEl = document.activeElement as HTMLElement | null;
      if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || activeEl.isContentEditable)) return;

      const mod = e.ctrlKey || e.metaKey;

      // Toggle All/Restore page size: Ctrl+Shift+A
      if (mod && e.shiftKey && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        const totalRowsCount = state.data.length;
        const current = api.getPageSize();
        const prev = api.getPreviousPageSize?.();
        if (current === totalRowsCount) {
          // Restore
          if (prev) api.setPageSize(prev);
        } else {
          // Set All
          api.setPageSize(totalRowsCount);
        }
        return;
      }

      // Undo/Redo: Ctrl+Z / Ctrl+Y
      if (mod && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        api.undo?.();
        return;
      }
      if (mod && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        api.redo?.();
        return;
      }

      // Start editing: Enter or F2 when a cell is active
      if ((e.key === 'Enter' || e.key === 'F2') && cellSelection.activeCell) {
        e.preventDefault();
        api.startEditing(cellSelection.activeCell.rowIndex, cellSelection.activeCell.colId);
        return;
      }

      // If editing, confirm or cancel with Enter/Escape
      if (api.getState().editing?.isEditing) {
        if (e.key === 'Escape') {
          e.preventDefault();
          dispatch({ type: 'CANCEL_EDITING' });
          return;
        }
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [api, state.data.length, cellSelection.activeCell, dispatch]);

  // Event callbacks (stable references)
  const handleRowClick = useCallback((rowIndex: number, data: TData, event: React.MouseEvent) => {
    onRowClick?.({
      type: 'rowClick',
      rowIndex,
      data,
      event,
      api,
    });
  }, [onRowClick, api]);

  const handleCellClick = useCallback((rowIndex: number, colId: string, value: CellValue, data: TData, event: React.MouseEvent) => {
    onCellClick?.({
      type: 'cellClick',
      rowIndex,
      colId,
      value,
      data,
      event,
      api,
    });


  }, [onCellClick, api]);

  const handleCellDoubleClick = useCallback((rowIndex: number, colId: string, value: CellValue, data: TData, event: React.MouseEvent) => {
    onCellDoubleClick?.({
      type: 'cellDoubleClick',
      rowIndex,
      colId,
      value,
      data,
      event,
      api,
    });
    api.startEditing(rowIndex, colId);
  }, [onCellDoubleClick, api]);

  // Cell selection handlers
  const handleCellMouseDown = useCallback((rowIndex: number, colId: string, event: React.MouseEvent) => {
    // Cell selection is always enabled for spreadsheet-like experience
    const cellKey = `${rowIndex}:${colId}`;
    const newPosition: CellPosition = { rowIndex, colId };

    if (event.shiftKey && cellSelection.anchorCell) {
      // Range selection with shift
      const newSelectedCells = new Set<string>();
      const startRow = Math.min(cellSelection.anchorCell.rowIndex, rowIndex);
      const endRow = Math.max(cellSelection.anchorCell.rowIndex, rowIndex);

      // Get column indices
      const anchorColIdx = computedColumns.findIndex(c => c.id === cellSelection.anchorCell!.colId);
      const currentColIdx = computedColumns.findIndex(c => c.id === colId);
      const startColIdx = Math.min(anchorColIdx, currentColIdx);
      const endColIdx = Math.max(anchorColIdx, currentColIdx);

      for (let r = startRow; r <= endRow; r++) {
        for (let c = startColIdx; c <= endColIdx; c++) {
          newSelectedCells.add(`${r}:${computedColumns[c].id}`);
        }
      }

      setCellSelection(prev => ({
        ...prev,
        selectedCells: newSelectedCells,
        activeCell: newPosition,
        isSelecting: true,
      }));
    } else if (event.ctrlKey || event.metaKey) {
      // Toggle single cell with ctrl/cmd
      setCellSelection(prev => {
        const newSelectedCells = new Set(prev.selectedCells);
        if (newSelectedCells.has(cellKey)) {
          newSelectedCells.delete(cellKey);
        } else {
          newSelectedCells.add(cellKey);
        }
        return {
          ...prev,
          selectedCells: newSelectedCells,
          activeCell: newPosition,
          anchorCell: newPosition,
          isSelecting: true,
        };
      });
    } else {
      // Single cell selection
      setCellSelection({
        selectedCells: new Set([cellKey]),
        activeCell: newPosition,
        anchorCell: newPosition,
        isSelecting: true,
      });
    }
  }, [cellSelection.anchorCell, computedColumns]);

  const handleCellMouseEnter = useCallback((rowIndex: number, colId: string, _event: React.MouseEvent) => {
    if (!cellSelection.isSelecting || !cellSelection.anchorCell) return;

    // Update range selection during drag
    const newSelectedCells = new Set<string>();
    const startRow = Math.min(cellSelection.anchorCell.rowIndex, rowIndex);
    const endRow = Math.max(cellSelection.anchorCell.rowIndex, rowIndex);

    const anchorColIdx = computedColumns.findIndex(c => c.id === cellSelection.anchorCell!.colId);
    const currentColIdx = computedColumns.findIndex(c => c.id === colId);
    const startColIdx = Math.min(anchorColIdx, currentColIdx);
    const endColIdx = Math.max(anchorColIdx, currentColIdx);

    for (let r = startRow; r <= endRow; r++) {
      for (let c = startColIdx; c <= endColIdx; c++) {
        newSelectedCells.add(`${r}:${computedColumns[c].id}`);
      }
    }

    setCellSelection(prev => ({
      ...prev,
      selectedCells: newSelectedCells,
      activeCell: { rowIndex, colId },
    }));
  }, [cellSelection.isSelecting, cellSelection.anchorCell, computedColumns]);

  // Touch handler for cell selection on mobile - maps to mouse down behavior
  const handleCellTouchStart = useCallback((rowIndex: number, colId: string, _event: React.TouchEvent) => {
    // On touch, select the single cell (simpler than mouse for mobile UX)
    const cellKey = `${rowIndex}:${colId}`;
    const newPosition: CellPosition = { rowIndex, colId };

    setCellSelection({
      selectedCells: new Set([cellKey]),
      activeCell: newPosition,
      anchorCell: newPosition,
      isSelecting: false, // Don't start drag selection on touch - let native scroll work
    });
  }, []);

  // Global mouse/touch up handler for ending selection - handles both mouse and touch
  useEffect(() => {
    const handleSelectionEnd = () => {
      if (cellSelection.isSelecting) {
        setCellSelection(prev => ({ ...prev, isSelecting: false }));
      }
    };

    // Listen for both mouse and touch end events
    document.addEventListener('mouseup', handleSelectionEnd);
    document.addEventListener('touchend', handleSelectionEnd);
    document.addEventListener('touchcancel', handleSelectionEnd);

    // Also handle when mouse leaves the window
    document.addEventListener('mouseleave', handleSelectionEnd);

    return () => {
      document.removeEventListener('mouseup', handleSelectionEnd);
      document.removeEventListener('touchend', handleSelectionEnd);
      document.removeEventListener('touchcancel', handleSelectionEnd);
      document.removeEventListener('mouseleave', handleSelectionEnd);
    };
  }, [cellSelection.isSelecting]);

  // Clipboard state for cut operation
  const [clipboardData, setClipboardData] = useState<{
    cells: Set<string>;
    isCut: boolean;
    data: Map<string, CellValue>;
  } | null>(null);

  // Get selected cells data for clipboard
  const getSelectedCellsData = useCallback(() => {
    if (cellSelection.selectedCells.size === 0) return '';

    // Parse selected cells to get row/col bounds
    const cells = Array.from(cellSelection.selectedCells).map(key => {
      const [row, col] = key.split(':');
      return { row: parseInt(row), col };
    });

    const minRow = Math.min(...cells.map(c => c.row));
    const maxRow = Math.max(...cells.map(c => c.row));
    const colIds = [...new Set(cells.map(c => c.col))];

    // Sort columns by their position
    const sortedColIds = colIds.sort((a, b) => {
      const aIdx = computedColumns.findIndex(c => c.id === a);
      const bIdx = computedColumns.findIndex(c => c.id === b);
      return aIdx - bIdx;
    });

    // Build TSV data
    const rows: string[] = [];
    for (let r = minRow; r <= maxRow; r++) {
      // Use processedData (global indices) when building TSV
      const rowData = processedData[r];
      if (!rowData) continue;

      const rowValues: string[] = [];
      for (const colId of sortedColIds) {
        const col = computedColumns.find(c => c.id === colId);
        if (col?.field) {
          const value = (rowData as Record<string, unknown>)[col.field as string];
          rowValues.push(value != null ? String(value) : '');
        } else {
          rowValues.push('');
        }
      }
      rows.push(rowValues.join('\t'));
    }

    return rows.join('\n');
  }, [cellSelection.selectedCells, computedColumns, processedData]);

  // Keyboard handler for cell navigation and actions
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // If typing in an input/textarea/contentEditable, don't intercept keystrokes
      const activeEl = document.activeElement as HTMLElement | null;
      if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || activeEl.isContentEditable)) return;

      // Only handle if we have selected cells
      if (cellSelection.selectedCells.size === 0 && !cellSelection.activeCell) return;

      const activeCell = cellSelection.activeCell;
      if (!activeCell) return;

      const currentRowIdx = activeCell.rowIndex;
      const currentColIdx = computedColumns.findIndex(c => c.id === activeCell.colId);

      // Ctrl/Cmd + C: Copy
      if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
        e.preventDefault();
        const data = getSelectedCellsData();
        navigator.clipboard.writeText(data).then(() => {
          // Store for internal paste
          const cellData = new Map<string, CellValue>();
          cellSelection.selectedCells.forEach(key => {
            const [row, col] = key.split(':');
            const rowData = processedData[parseInt(row)];
            const column = computedColumns.find(c => c.id === col);
            if (rowData && column?.field) {
              cellData.set(key, (rowData as Record<string, unknown>)[column.field as string] as CellValue);
            }
          });
          setClipboardData({
            cells: new Set(cellSelection.selectedCells),
            isCut: false,
            data: cellData,
          });
        });
        return;
      }

      // Ctrl/Cmd + X: Cut
      if ((e.ctrlKey || e.metaKey) && e.key === 'x') {
        e.preventDefault();
        const data = getSelectedCellsData();
        navigator.clipboard.writeText(data).then(() => {
          const cellData = new Map<string, CellValue>();
          cellSelection.selectedCells.forEach(key => {
            const [row, col] = key.split(':');
            const rowData = processedData[parseInt(row)];
            const column = computedColumns.find(c => c.id === col);
            if (rowData && column?.field) {
              cellData.set(key, (rowData as Record<string, unknown>)[column.field as string] as CellValue);
            }
          });
          setClipboardData({
            cells: new Set(cellSelection.selectedCells),
            isCut: true,
            data: cellData,
          });
        });
        return;
      }

      // Ctrl/Cmd + A: Select All
      if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
        e.preventDefault();
        const allCells = new Set<string>();
        // If pagination is enabled, select only the current page rows; otherwise select all displayed rows
        const pageStart = (isPaginationEnabled && !isAllRows) ? state.page * state.pageSize : 0;
        const pageEnd = (isPaginationEnabled && !isAllRows) ? Math.min(processedData.length - 1, pageStart + state.pageSize - 1) : processedData.length - 1;
        for (let r = pageStart; r <= pageEnd; r++) {
          for (const col of computedColumns) {
            allCells.add(`${r}:${col.id}`);
          }
        }
        setCellSelection(prev => ({
          ...prev,
          selectedCells: allCells,
          anchorCell: { rowIndex: pageStart, colId: computedColumns[0]?.id || '' },
        }));
        return;
      }

      // Delete/Backspace: Clear cells (would need data mutation support)
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        // This would clear cell contents - needs data mutation API
        console.log('Delete pressed - would clear', cellSelection.selectedCells.size, 'cells');
        return;
      }

      // Escape: Clear selection
      if (e.key === 'Escape') {
        e.preventDefault();
        setCellSelection({
          selectedCells: new Set(),
          activeCell: null,
          anchorCell: null,
          isSelecting: false,
        });
        setClipboardData(null);
        return;
      }

      // Arrow key navigation
      let newRowIdx = currentRowIdx;
      let newColIdx = currentColIdx;

      // Compute page bounds for navigation
      const pageStart = (isPaginationEnabled && !isAllRows) ? state.page * state.pageSize : 0;
      const pageEnd = (isPaginationEnabled && !isAllRows) ? Math.min(processedData.length - 1, pageStart + state.pageSize - 1) : processedData.length - 1;
      const maxColIdx = computedColumns.length - 1;

      // Helper to handle Ctrl (Jump) navigation
      const isCtrl = e.ctrlKey || e.metaKey;
      const isShift = e.shiftKey;

      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          if (isCtrl) newRowIdx = pageStart;
          else newRowIdx = Math.max(pageStart, currentRowIdx - 1);
          break;
        case 'ArrowDown':
          e.preventDefault();
          if (isCtrl) newRowIdx = pageEnd;
          else newRowIdx = Math.min(pageEnd, currentRowIdx + 1);
          break;
        case 'ArrowLeft':
          e.preventDefault();
          if (isCtrl) newColIdx = 0;
          else newColIdx = Math.max(0, currentColIdx - 1);
          break;
        case 'ArrowRight':
          e.preventDefault();
          if (isCtrl) newColIdx = maxColIdx;
          else newColIdx = Math.min(maxColIdx, currentColIdx + 1);
          break;
        case 'Tab':
          e.preventDefault();
          if (isShift) {
            // Move left, wrap to previous row
            if (currentColIdx > 0) newColIdx = currentColIdx - 1;
            else if (currentRowIdx > pageStart) {
              newRowIdx = currentRowIdx - 1;
              newColIdx = maxColIdx;
            }
          } else {
            // Move right, wrap to next row
            if (currentColIdx < maxColIdx) newColIdx = currentColIdx + 1;
            else if (currentRowIdx < pageEnd) {
              newRowIdx = currentRowIdx + 1;
              newColIdx = 0;
            }
          }
          break;
        case 'Enter':
          e.preventDefault();
          if (isShift) {
            // Move up
            newRowIdx = Math.max(pageStart, currentRowIdx - 1);
          } else {
            // Move down
            newRowIdx = Math.min(pageEnd, currentRowIdx + 1);
          }
          break;
        case 'Home':
          e.preventDefault();
          if (isCtrl) { newRowIdx = pageStart; newColIdx = 0; }
          else newColIdx = 0;
          break;
        case 'End':
          e.preventDefault();
          if (isCtrl) { newRowIdx = pageEnd; newColIdx = maxColIdx; }
          else newColIdx = maxColIdx;
          break;
        case 'PageUp':
          e.preventDefault();
          newRowIdx = Math.max(pageStart, currentRowIdx - 20);
          break;
        case 'PageDown':
          e.preventDefault();
          newRowIdx = Math.min(pageEnd, currentRowIdx + 20);
          break;
        default:
          return;
      }

      // Update selection based on Shift key (Range Selection)
      const newColId = computedColumns[newColIdx]?.id;
      if (newColId) {
        const newPosition: CellPosition = { rowIndex: newRowIdx, colId: newColId };

        if (isShift && cellSelection.anchorCell) {
          // Extend selection from anchor
          const newSelectedCells = new Set<string>();
          const anchorRow = cellSelection.anchorCell.rowIndex;
          const anchorColIdx = computedColumns.findIndex(c => c.id === cellSelection.anchorCell!.colId);

          const startRow = Math.min(anchorRow, newRowIdx);
          const endRow = Math.max(anchorRow, newRowIdx);
          const startCol = Math.min(anchorColIdx, newColIdx);
          const endCol = Math.max(anchorColIdx, newColIdx);

          for (let r = startRow; r <= endRow; r++) {
            for (let c = startCol; c <= endCol; c++) {
              newSelectedCells.add(`${r}:${computedColumns[c].id}`);
            }
          }

          setCellSelection(prev => ({
            ...prev,
            selectedCells: newSelectedCells,
            activeCell: newPosition,
            // Keep existing anchor
          }));

          // Ensure visible
          api.scrollToRow(newRowIdx);
        } else {
          // Single cell selection (reset anchor)
          const newKey = `${newRowIdx}:${newColId}`;
          setCellSelection({
            selectedCells: new Set([newKey]),
            activeCell: newPosition,
            anchorCell: newPosition,
            isSelecting: false,
          });

          // Ensure visible
          api.scrollToRow(newRowIdx);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [cellSelection, computedColumns, paginatedData, getSelectedCellsData, scrollToIndex]);

  // Context menu handler
  const handleContextMenu = useCallback((event: React.MouseEvent) => {
    // Only show if contextMenu plugin is loaded
    if (!pluginManagerRef.current?.isLoaded('contextMenu')) {
      return;
    }

    event.preventDefault();

    // Get the cell that was right-clicked
    const target = event.target as HTMLElement;
    const cellElement = target.closest('.warper-grid-cell');
    const rowElement = target.closest('.warper-grid-row');

    let rowIndex: number | null = null;
    let colId: string | null = null;
    let value: CellValue = null;
    let rowData: TData | null = null;

    if (rowElement && cellElement) {
      // Find rowIndex from the visible rows
      const rowElements = Array.from(document.querySelectorAll('.warper-grid-row'));
      const rowIdx = rowElements.indexOf(rowElement);
      if (rowIdx >= 0 && range.items[rowIdx] !== undefined) {
        rowIndex = range.items[rowIdx];
        rowData = paginatedData[rowIndex] || null;
      }

      // Find colId from cell position
      const cellElements = Array.from(rowElement.querySelectorAll('.warper-grid-cell'));
      const cellIdx = cellElements.indexOf(cellElement);
      if (cellIdx >= 0 && computedColumns[cellIdx]) {
        const col = computedColumns[cellIdx];
        colId = col.id;
        if (rowData && col.field) {
          value = (rowData as Record<string, unknown>)[col.field as string] as CellValue;
        }
      }
    }

    // Store focused cell info
    focusedCellRef.current = { rowIndex: rowIndex ?? -1, colId: colId ?? '', data: rowData };

    setContextMenu({
      isOpen: true,
      x: event.clientX,
      y: event.clientY,
      rowIndex,
      colId,
      value,
    });
  }, [range.items, paginatedData, computedColumns]);

  // Close context menu
  const handleCloseContextMenu = useCallback(() => {
    setContextMenu(prev => ({ ...prev, isOpen: false }));
  }, []);

  // Emit sort changed event
  useEffect(() => {
    onSortChanged?.({
      type: 'sortChanged',
      sortModel: state.sortModel,
      api,
    });
  }, [state.sortModel, onSortChanged, api]);

  // Emit filter changed event
  useEffect(() => {
    onFilterChanged?.({
      type: 'filterChanged',
      filterModel: state.filterModel,
      api,
    });
  }, [state.filterModel, onFilterChanged, api]);

  // Emit selection changed event
  useEffect(() => {
    onSelectionChanged?.({
      type: 'selectionChanged',
      selectedRows: Array.from(state.selection.selectedRows).map(i => paginatedData[i]),
      selectedIndices: Array.from(state.selection.selectedRows),
      api,
    });
  }, [state.selection.selectedRows, paginatedData, onSelectionChanged, api]);

  // Emit page changed event
  useEffect(() => {
    onPageChanged?.({
      type: 'pageChanged',
      page: state.page,
      pageSize: state.pageSize,
      api,
    });
  }, [state.page, state.pageSize, onPageChanged, api]);

  // Grid ready callback
  useEffect(() => {
    onGridReady?.(api);
  }, [api, onGridReady]);

  // Handle loading state

  // Handle empty state
  if (paginatedData.length === 0) {
    return (
      <div className={cn('warper-grid', className)} style={{ height, width, ...style }}>
        <GridHeader
          columns={computedColumns}
          totalWidth={totalWidth}
          headerHeight={headerHeight}
          api={api}
          headerScrollRef={headerScrollRef}
        />
        <div className="warper-grid-empty">
          {emptyComponent || emptyMessage}
        </div>
      </div>
    );
  }

  return (
    <GridProvider state={state} dispatch={dispatch as (action: GridAction<TData>) => void} scrollToIndex={scrollToIndex}>
      <div
        className={cn(
          'warper-grid',
          bordered && 'warper-grid--bordered',
          compact && 'warper-grid--compact',
          className
        )}
        style={{ height, width, display: 'flex', flexDirection: 'column', position: 'relative', ...style }}
      >
        {/* Loading Overlay */}
        {(loading || wasmLoading) && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/50 dark:bg-black/50 backdrop-blur-sm transition-opacity duration-200">
            <div className="warper-grid-loading">
              {loadingComponent || (
                <div className="flex flex-col items-center gap-2">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
                  <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">Loading data...</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Error Overlay */}
        {wasmError && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/80 dark:bg-black/80">
            <div className="warper-grid-loading text-red-500 font-medium">
              Error: {wasmError.message}
            </div>
          </div>
        )}
        {/* Grid Body - Virtualized */}
        <div
          ref={scrollElementRef}
          className="warper-grid-body"
          style={{ flex: 1, minHeight: 0, overflow: 'auto' }}
          onContextMenu={handleContextMenu}
        >
          {/* Sticky Header */}
          <div style={{ position: 'sticky', top: 0, zIndex: 20, width: totalWidth }}>
            <GridHeader
              columns={computedColumns}
              totalWidth={totalWidth}
              headerHeight={headerHeight}
              api={api}
            />
          </div>

          <div
            style={{
              height: totalHeight,
              width: totalWidth,
              position: 'relative',
              paddingBottom: 40, // Ensure space for last row and scrolling
            }}
          >
            {/* Viewport with paddingTop offset */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${range.paddingTop}px)`,
                willChange: 'transform',
              }}
            >
              {range.items.map((virtualIdx, i) => {
                // When 'All' is selected, source rows directly from the full dataset
                const rowData = isAllRows ? state.data[virtualIdx] : virtualRows[virtualIdx];
                if (!rowData) return null;

                // Compute the global index into processedData (used for selection and APIs)
                const globalRowIndex = isAllRows ? virtualIdx : (isPaginationEnabled ? state.page * state.pageSize + virtualIdx : virtualIdx);

                // Row key: allow user-supplied getRowId, pass global index
                const rowId = getRowId ? getRowId(rowData, globalRowIndex) : globalRowIndex;

                return (
                  <GridRow
                    key={rowId}
                    rowIndex={globalRowIndex}
                    rowData={rowData}
                    rowId={rowId}
                    columns={computedColumns}
                    totalWidth={totalWidth}
                    offset={range.offsets[i]}
                    height={range.sizes[i]}
                    isSelected={state.selection.allSelected ? true : state.selection.selectedRows.has(globalRowIndex)}
                    striped={striped}
                    api={api}
                    selectedCells={cellSelection.selectedCells}
                    activeCell={cellSelection.activeCell}
                    cutCells={clipboardData?.isCut ? clipboardData.cells : undefined}
                    globalCellStyle={globalCellStyle}
                    onRowClick={onRowClick ? handleRowClick : undefined}
                    onCellClick={handleCellClick}
                    onCellDoubleClick={onCellDoubleClick ? handleCellDoubleClick : undefined}
                    onCellMouseDown={handleCellMouseDown}
                    onCellMouseEnter={handleCellMouseEnter}
                    onCellTouchStart={handleCellTouchStart}
                  />
                );
              })}
            </div>
          </div>
        </div>

        {/* Grid Pagination */}
        {showPagination && (
          <GridPagination api={api} />
        )}

        {/* Status Bar */}
        {pluginManagerRef.current!.isLoaded('statusBar') && (
          <StatusBar
            totalRows={actualTotalRows ?? state.data.length}
            displayedRows={processedData.length}
            selectedRows={state.selection.allSelected ? processedData.length : state.selection.selectedRows.size}
            selectedCells={cellSelection.selectedCells.size}
            renderTime={renderTime}
            useWasm={useWasm}
          />
        )}

        {/* Context Menu */}
        {contextMenu.isOpen && (
          <ContextMenu
            state={contextMenu}
            api={api}
            data={focusedCellRef.current.data}
            onClose={handleCloseContextMenu}
          />
        )}
      </div>
    </GridProvider>
  );
}

// Forward ref with generic support
export const WarperGrid = forwardRef(WarperGridInner) as <TData extends RowData = RowData>(
  props: WarperGridProps<TData> & { ref?: ForwardedRef<WarperGridRef<TData>> }
) => ReturnType<typeof WarperGridInner>;
