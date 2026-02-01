import type { 
  RowData, 
  GridPlugin, 
  GridApi, 
  SelectionPluginConfig,
  SelectionState 
} from '../types';

// ============================================================================
// Selection Utilities - Performance Optimized
// ============================================================================

/**
 * Handle row selection with modifiers - Optimized with reduced object creation
 */
export function handleRowSelection(
  currentSelection: SelectionState,
  rowIndex: number,
  mode: 'single' | 'multiple' | 'none',
  shiftKey: boolean = false,
  ctrlKey: boolean = false,
  _totalRows: number = 0
): SelectionState {
  // Fast path: no-op for none mode
  if (mode === 'none') {
    return currentSelection;
  }

  // Single selection mode - always replace
  if (mode === 'single') {
    // Check if already selected to avoid unnecessary object creation
    if (currentSelection.selectedRows.size === 1 && currentSelection.selectedRows.has(rowIndex)) {
      return currentSelection;
    }
    return {
      ...currentSelection,
      selectedRows: new Set([rowIndex]),
      anchorCell: { rowIndex, colId: '' },
      allSelected: false,
    };
  }

  // Multiple selection mode
  let newSelectedRows: Set<number>;

  if (shiftKey && currentSelection.anchorCell !== null) {
    // Range selection
    const anchorIndex = currentSelection.anchorCell.rowIndex;
    const start = Math.min(anchorIndex, rowIndex);
    const end = Math.max(anchorIndex, rowIndex);
    
    if (ctrlKey) {
      // Add to existing selection
      newSelectedRows = new Set(currentSelection.selectedRows);
      for (let i = start; i <= end; i++) {
        newSelectedRows.add(i);
      }
    } else {
      // Replace selection with range
      newSelectedRows = new Set<number>();
      for (let i = start; i <= end; i++) {
        newSelectedRows.add(i);
      }
    }
  } else if (ctrlKey) {
    // Toggle single row
    newSelectedRows = new Set(currentSelection.selectedRows);
    if (newSelectedRows.has(rowIndex)) {
      newSelectedRows.delete(rowIndex);
    } else {
      newSelectedRows.add(rowIndex);
    }
  } else {
    // Single click - replace selection
    newSelectedRows = new Set([rowIndex]);
  }

  return {
    ...currentSelection,
    selectedRows: newSelectedRows,
    anchorCell: { rowIndex, colId: '' },
    allSelected: false,
  };
}

/**
 * Handle cell selection for range selection - Optimized
 */
export function handleCellSelection(
  currentSelection: SelectionState,
  rowIndex: number,
  colId: string,
  shiftKey: boolean = false,
  ctrlKey: boolean = false
): SelectionState {
  const cellKey = `${rowIndex}:${colId}`;

  if (shiftKey && currentSelection.anchorCell !== null) {
    // Range selection - simplified for single cell (column ordering handled by caller)
    const newSelectedCells = ctrlKey 
      ? new Set(currentSelection.selectedCells)
      : new Set<string>();
    newSelectedCells.add(cellKey);
    
    return {
      ...currentSelection,
      selectedCells: newSelectedCells,
      anchorCell: currentSelection.anchorCell, // Keep anchor
    };
  } else if (ctrlKey) {
    // Toggle cell selection
    const newSelectedCells = new Set(currentSelection.selectedCells);
    if (newSelectedCells.has(cellKey)) {
      newSelectedCells.delete(cellKey);
    } else {
      newSelectedCells.add(cellKey);
    }
    
    return {
      ...currentSelection,
      selectedCells: newSelectedCells,
      anchorCell: { rowIndex, colId },
    };
  } else {
    // Single click - replace selection
    return {
      ...currentSelection,
      selectedCells: new Set([cellKey]),
      anchorCell: { rowIndex, colId },
    };
  }
}

/**
 * Check if a row is selected - Inlined for performance
 */
export function isRowSelected(selection: SelectionState, rowIndex: number): boolean {
  return selection.allSelected === true || selection.selectedRows.has(rowIndex);
}

/**
 * Check if a cell is selected - Inlined for performance
 */
export function isCellSelected(selection: SelectionState, rowIndex: number, colId: string): boolean {
  return selection.selectedCells.has(`${rowIndex}:${colId}`);
}

// ============================================================================
// Selection Plugin
// ============================================================================

let _pluginApi: GridApi<RowData> | null = null;
let _pluginConfig: SelectionPluginConfig = {};

export const selectionPlugin: GridPlugin<RowData> = {
  name: 'selection',

  init(api: GridApi<RowData>, config?: SelectionPluginConfig) {
    _pluginApi = api;
    _pluginConfig = config || { mode: 'multiple' };
  },

  destroy() {
    _pluginApi = null;
    _pluginConfig = {};
  },
};

// ============================================================================
// Selection Hook
// ============================================================================

export function useSelection<TData extends RowData>(
  api: GridApi<TData>,
  mode: 'single' | 'multiple' | 'none' = 'multiple'
) {
  const state = api.getState();
  const selection = state.selection;

  const handleSelect = (
    rowIndex: number,
    shiftKey: boolean = false,
    ctrlKey: boolean = false
  ) => {
    const newSelection = handleRowSelection(
      selection,
      rowIndex,
      mode,
      shiftKey,
      ctrlKey,
      api.getDisplayedRowCount()
    );
    
    api.setState({ selection: newSelection });
  };

  const toggleRowSelection = (rowIndex: number) => {
    if (selection.selectedRows.has(rowIndex)) {
      api.deselectRow(rowIndex);
    } else {
      api.selectRow(rowIndex, mode === 'single');
    }
  };

  const isSelected = (rowIndex: number) => isRowSelected(selection, rowIndex);

  const selectedCount = selection.allSelected ? api.getDisplayedRowCount() : selection.selectedRows.size;
  
  const allSelected = selection.allSelected || (selectedCount > 0 && selectedCount === api.getDisplayedRowCount());
  
  const someSelected = selectedCount > 0 && !allSelected;

  return {
    selectedRows: selection.selectedRows,
    selectedCount,
    allSelected,
    someSelected,
    handleSelect,
    toggleRowSelection,
    isSelected,
    selectAll: api.selectAll.bind(api),
    deselectAll: api.deselectAll.bind(api),
    getSelectedRows: api.getSelectedRows.bind(api),
    getSelectedRowIndices: api.getSelectedRowIndices.bind(api),
  };
}
