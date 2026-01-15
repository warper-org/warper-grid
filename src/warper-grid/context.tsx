import { createContext, useContext, useRef, useMemo, type ReactNode } from 'react';
import type {
  RowData,
  GridState,
  GridApi,
  ColumnDef,
  SortModel,
  FilterModel,
  ColumnPin,
  SelectionState,
  ExportParams,
} from './types';

// ============================================================================
// Grid Context
// ============================================================================

interface GridContextValue<TData extends RowData = RowData> {
  state: GridState<TData>;
  api: GridApi<TData>;
  dispatch: (action: GridAction<TData>) => void;
}

const GridContext = createContext<GridContextValue<RowData> | null>(null);

// ============================================================================
// Grid Actions
// ============================================================================

export type GridAction<TData extends RowData = RowData> =
  | { type: 'SET_DATA'; payload: TData[] }
  | { type: 'SET_COLUMNS'; payload: ColumnDef<TData>[] }
  | { type: 'SET_SORT_MODEL'; payload: SortModel[] }
  | { type: 'SET_FILTER_MODEL'; payload: FilterModel[] }
  | { type: 'SET_QUICK_FILTER'; payload: string }
  | { type: 'SET_PAGE'; payload: number }
  | { type: 'SET_PAGE_SIZE'; payload: number }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_COLUMN_WIDTH'; payload: { colId: string; width: number } }
  | { type: 'SET_COLUMN_VISIBLE'; payload: { colId: string; visible: boolean } }
  | { type: 'SET_COLUMN_PINNED'; payload: { colId: string; pinned: ColumnPin } }
  | { type: 'SELECT_ROW'; payload: { rowIndex: number; clearOthers: boolean } }
  | { type: 'DESELECT_ROW'; payload: number }
  | { type: 'SELECT_ALL' }
  | { type: 'DESELECT_ALL' }
  | { type: 'SET_SELECTION'; payload: SelectionState }
  | { type: 'UPDATE_PROCESSED_DATA'; payload: TData[] };

// ============================================================================
// Grid Reducer
// ============================================================================

export function gridReducer<TData extends RowData>(
  state: GridState<TData>,
  action: GridAction<TData>
): GridState<TData> {
  switch (action.type) {
    case 'SET_DATA':
      return { ...state, data: action.payload };
    
    case 'SET_COLUMNS':
      return { ...state, columns: action.payload };
    
    case 'SET_SORT_MODEL':
      return { ...state, sortModel: action.payload };
    
    case 'SET_FILTER_MODEL':
      return { ...state, filterModel: action.payload };
    
    case 'SET_QUICK_FILTER':
      return { ...state, quickFilterText: action.payload };
    
    case 'SET_PAGE':
      return { ...state, page: action.payload };
    
    case 'SET_PAGE_SIZE':
      return { ...state, pageSize: action.payload, page: 0 };
    
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    
    case 'SET_COLUMN_WIDTH': {
      const newColumnState = new Map(state.columnState);
      const existing = newColumnState.get(action.payload.colId) || { colId: action.payload.colId };
      newColumnState.set(action.payload.colId, { ...existing, width: action.payload.width });
      return { ...state, columnState: newColumnState };
    }
    
    case 'SET_COLUMN_VISIBLE': {
      const newColumnState = new Map(state.columnState);
      const existing = newColumnState.get(action.payload.colId) || { colId: action.payload.colId };
      newColumnState.set(action.payload.colId, { ...existing, hide: !action.payload.visible });
      return { ...state, columnState: newColumnState };
    }
    
    case 'SET_COLUMN_PINNED': {
      const newColumnState = new Map(state.columnState);
      const existing = newColumnState.get(action.payload.colId) || { colId: action.payload.colId };
      newColumnState.set(action.payload.colId, { ...existing, pinned: action.payload.pinned });
      return { ...state, columnState: newColumnState };
    }
    
    case 'SELECT_ROW': {
      const newSelectedRows = action.payload.clearOthers 
        ? new Set<number>([action.payload.rowIndex])
        : new Set(state.selection.selectedRows).add(action.payload.rowIndex);
      return {
        ...state,
        selection: { ...state.selection, selectedRows: newSelectedRows },
      };
    }
    
    case 'DESELECT_ROW': {
      const newSelectedRows = new Set(state.selection.selectedRows);
      newSelectedRows.delete(action.payload);
      return {
        ...state,
        selection: { ...state.selection, selectedRows: newSelectedRows },
      };
    }
    
    case 'SELECT_ALL': {
      const allIndices = new Set(state.processedData.map((_, i) => i));
      return {
        ...state,
        selection: { ...state.selection, selectedRows: allIndices },
      };
    }
    
    case 'DESELECT_ALL':
      return {
        ...state,
        selection: { ...state.selection, selectedRows: new Set(), selectedCells: new Set() },
      };
    
    case 'SET_SELECTION':
      return { ...state, selection: action.payload };
    
    case 'UPDATE_PROCESSED_DATA':
      return { ...state, processedData: action.payload };
    
    default:
      return state;
  }
}

// ============================================================================
// Initial State Factory
// ============================================================================

export function createInitialState<TData extends RowData>(
  data: TData[],
  columns: ColumnDef<TData>[]
): GridState<TData> {
  return {
    data,
    processedData: data,
    columns,
    columnState: new Map(),
    sortModel: [],
    filterModel: [],
    selection: {
      selectedRows: new Set(),
      selectedCells: new Set(),
      anchorCell: null,
    },
    page: 0,
    pageSize: 100,
    isLoading: false,
    quickFilterText: '',
  };
}

// ============================================================================
// Grid API Factory
// ============================================================================

export function createGridApi<TData extends RowData>(
  stateRef: React.MutableRefObject<GridState<TData>>,
  dispatch: (action: GridAction<TData>) => void,
  scrollToIndexFn?: (index: number, behavior?: ScrollBehavior) => void
): GridApi<TData> {
  const getState = () => stateRef.current;
  
  return {
    // Data operations
    getData: () => getState().data,
    
    setData: (data: TData[]) => {
      dispatch({ type: 'SET_DATA', payload: data });
    },
    
    getDisplayedData: () => getState().processedData,
    
    getRowCount: () => getState().data.length,
    
    getDisplayedRowCount: () => getState().processedData.length,
    
    refreshCells: () => {
      // Trigger a re-render by setting data to itself
      dispatch({ type: 'SET_DATA', payload: [...getState().data] });
    },
    
    // Column operations
    getColumns: () => getState().columns,
    
    getColumn: (colId: string) => getState().columns.find(c => c.id === colId),
    
    setColumnDefs: (columns: ColumnDef<TData>[]) => {
      dispatch({ type: 'SET_COLUMNS', payload: columns });
    },
    
    setColumnWidth: (colId: string, width: number) => {
      dispatch({ type: 'SET_COLUMN_WIDTH', payload: { colId, width } });
    },
    
    setColumnVisible: (colId: string, visible: boolean) => {
      dispatch({ type: 'SET_COLUMN_VISIBLE', payload: { colId, visible } });
    },
    
    setColumnPinned: (colId: string, pinned: ColumnPin) => {
      dispatch({ type: 'SET_COLUMN_PINNED', payload: { colId, pinned } });
    },
    
    autoSizeColumn: (colId: string) => {
      // TODO: Implement auto-sizing based on content
      const column = getState().columns.find(c => c.id === colId);
      if (column) {
        dispatch({ type: 'SET_COLUMN_WIDTH', payload: { colId, width: column.width || 150 } });
      }
    },
    
    autoSizeAllColumns: () => {
      // TODO: Implement auto-sizing for all columns
    },
    
    // Sorting
    getSortModel: () => getState().sortModel,
    
    setSortModel: (sortModel: SortModel[]) => {
      dispatch({ type: 'SET_SORT_MODEL', payload: sortModel });
    },
    
    // Filtering
    getFilterModel: () => getState().filterModel,
    
    setFilterModel: (filterModel: FilterModel[]) => {
      dispatch({ type: 'SET_FILTER_MODEL', payload: filterModel });
    },
    
    setQuickFilter: (text: string) => {
      dispatch({ type: 'SET_QUICK_FILTER', payload: text });
    },
    
    // Selection
    getSelectedRows: () => {
      const state = getState();
      return Array.from(state.selection.selectedRows).map(i => state.processedData[i]);
    },
    
    getSelectedRowIndices: () => Array.from(getState().selection.selectedRows),
    
    selectRow: (rowIndex: number, clearOthers = false) => {
      dispatch({ type: 'SELECT_ROW', payload: { rowIndex, clearOthers } });
    },
    
    deselectRow: (rowIndex: number) => {
      dispatch({ type: 'DESELECT_ROW', payload: rowIndex });
    },
    
    selectAll: () => {
      dispatch({ type: 'SELECT_ALL' });
    },
    
    deselectAll: () => {
      dispatch({ type: 'DESELECT_ALL' });
    },
    
    // Pagination
    getPage: () => getState().page,
    
    setPage: (page: number) => {
      dispatch({ type: 'SET_PAGE', payload: page });
    },
    
    getPageSize: () => getState().pageSize,
    
    setPageSize: (pageSize: number) => {
      dispatch({ type: 'SET_PAGE_SIZE', payload: pageSize });
    },
    
    getTotalPages: () => {
      const state = getState();
      return Math.ceil(state.processedData.length / state.pageSize);
    },
    
    nextPage: () => {
      const state = getState();
      const totalPages = Math.ceil(state.processedData.length / state.pageSize);
      if (state.page < totalPages - 1) {
        dispatch({ type: 'SET_PAGE', payload: state.page + 1 });
      }
    },
    
    previousPage: () => {
      const state = getState();
      if (state.page > 0) {
        dispatch({ type: 'SET_PAGE', payload: state.page - 1 });
      }
    },
    
    firstPage: () => {
      dispatch({ type: 'SET_PAGE', payload: 0 });
    },
    
    lastPage: () => {
      const state = getState();
      const totalPages = Math.ceil(state.processedData.length / state.pageSize);
      dispatch({ type: 'SET_PAGE', payload: totalPages - 1 });
    },
    
    // Scrolling
    scrollToRow: (rowIndex: number, behavior?: ScrollBehavior) => {
      scrollToIndexFn?.(rowIndex, behavior);
    },
    
    scrollToColumn: () => {
      // TODO: Implement horizontal scrolling
    },
    
    scrollToCell: (rowIndex: number) => {
      scrollToIndexFn?.(rowIndex);
    },
    
    // Cell editing
    startEditing: () => {
      // TODO: Implement cell editing
    },
    
    stopEditing: () => {
      // TODO: Implement cell editing
    },
    
    // Export
    exportToCsv: (params?: ExportParams) => {
      const state = getState();
      const columns = state.columns.filter(c => !c.hide);
      const data = params?.onlySelected 
        ? Array.from(state.selection.selectedRows).map(i => state.processedData[i])
        : state.processedData;
      
      const separator = params?.columnSeparator || ',';
      const rows: string[] = [];
      
      // Header row
      if (!params?.skipHeader) {
        rows.push(columns.map(c => `"${c.headerName || c.id}"`).join(separator));
      }
      
      // Data rows
      for (const row of data) {
        const values = columns.map(col => {
          const value = col.field ? (row as Record<string, unknown>)[col.field as string] : '';
          const strValue = String(value ?? '');
          return `"${strValue.replace(/"/g, '""')}"`;
        });
        rows.push(values.join(separator));
      }
      
      const csv = rows.join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = params?.fileName || 'export.csv';
      link.click();
      URL.revokeObjectURL(link.href);
    },
    
    // State
    getState: () => getState(),
    
    setState: (newState: Partial<GridState<TData>>) => {
      if (newState.data !== undefined) dispatch({ type: 'SET_DATA', payload: newState.data });
      if (newState.columns !== undefined) dispatch({ type: 'SET_COLUMNS', payload: newState.columns });
      if (newState.sortModel !== undefined) dispatch({ type: 'SET_SORT_MODEL', payload: newState.sortModel });
      if (newState.filterModel !== undefined) dispatch({ type: 'SET_FILTER_MODEL', payload: newState.filterModel });
      if (newState.page !== undefined) dispatch({ type: 'SET_PAGE', payload: newState.page });
      if (newState.pageSize !== undefined) dispatch({ type: 'SET_PAGE_SIZE', payload: newState.pageSize });
      if (newState.isLoading !== undefined) dispatch({ type: 'SET_LOADING', payload: newState.isLoading });
      if (newState.quickFilterText !== undefined) dispatch({ type: 'SET_QUICK_FILTER', payload: newState.quickFilterText });
      if (newState.selection !== undefined) dispatch({ type: 'SET_SELECTION', payload: newState.selection });
    },
  };
}

// ============================================================================
// Context Hook
// ============================================================================

export function useGridContext<TData extends RowData = RowData>(): GridContextValue<TData> {
  const context = useContext(GridContext);
  if (!context) {
    throw new Error('useGridContext must be used within a GridProvider');
  }
  return context as unknown as GridContextValue<TData>;
}

// ============================================================================
// Grid Provider
// ============================================================================

interface GridProviderProps<TData extends RowData> {
  children: ReactNode;
  state: GridState<TData>;
  dispatch: (action: GridAction<TData>) => void;
  scrollToIndex?: (index: number, behavior?: ScrollBehavior) => void;
}

export function GridProvider<TData extends RowData>({
  children,
  state,
  dispatch,
  scrollToIndex,
}: GridProviderProps<TData>) {
  const stateRef = useRef(state);
  stateRef.current = state;
  
  const api = useMemo(
    () => createGridApi(stateRef, dispatch, scrollToIndex),
    [dispatch, scrollToIndex]
  );
  
  const value = useMemo(
    () => ({ state, api, dispatch }),
    [state, api, dispatch]
  );
  
  return (
    <GridContext.Provider value={value as unknown as GridContextValue<RowData>}>
      {children}
    </GridContext.Provider>
  );
}
