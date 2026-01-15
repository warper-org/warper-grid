import type { 
  RowData, 
  GridPlugin, 
  GridApi, 
  SelectionPluginConfig,
  SelectionState 
} from '../types';

// ============================================================================
// Selection Utilities
// ============================================================================

/**
 * Handle row selection with modifiers
 */
export function handleRowSelection(
  currentSelection: SelectionState,
  rowIndex: number,
  mode: 'single' | 'multiple' | 'none',
  shiftKey: boolean = false,
  ctrlKey: boolean = false,
  totalRows: number = 0
): SelectionState {
  if (mode === 'none') {
    return currentSelection;
  }

  const newSelectedRows = new Set(currentSelection.selectedRows);

  if (mode === 'single') {
    // Single selection mode
    newSelectedRows.clear();
    newSelectedRows.add(rowIndex);
  } else {
    // Multiple selection mode
    if (shiftKey && currentSelection.anchorCell !== null) {
      // Range selection
      const anchorIndex = currentSelection.anchorCell.rowIndex;
      const start = Math.min(anchorIndex, rowIndex);
      const end = Math.max(anchorIndex, rowIndex);
      
      if (!ctrlKey) {
        newSelectedRows.clear();
      }
      
      for (let i = start; i <= end; i++) {
        newSelectedRows.add(i);
      }
    } else if (ctrlKey) {
      // Toggle selection
      if (newSelectedRows.has(rowIndex)) {
        newSelectedRows.delete(rowIndex);
      } else {
        newSelectedRows.add(rowIndex);
      }
    } else {
      // Single click - clear and select
      newSelectedRows.clear();
      newSelectedRows.add(rowIndex);
    }
  }

  return {
    ...currentSelection,
    selectedRows: newSelectedRows,
    anchorCell: { rowIndex, colId: '' },
  };
}

/**
 * Handle cell selection for range selection
 */
export function handleCellSelection(
  currentSelection: SelectionState,
  rowIndex: number,
  colId: string,
  shiftKey: boolean = false,
  ctrlKey: boolean = false
): SelectionState {
  const newSelectedCells = new Set(currentSelection.selectedCells);
  const cellKey = `${rowIndex}:${colId}`;

  if (shiftKey && currentSelection.anchorCell !== null) {
    // Range selection would require column ordering - simplified here
    if (!ctrlKey) {
      newSelectedCells.clear();
    }
    newSelectedCells.add(cellKey);
  } else if (ctrlKey) {
    // Toggle cell selection
    if (newSelectedCells.has(cellKey)) {
      newSelectedCells.delete(cellKey);
    } else {
      newSelectedCells.add(cellKey);
    }
  } else {
    // Single click
    newSelectedCells.clear();
    newSelectedCells.add(cellKey);
  }

  return {
    ...currentSelection,
    selectedCells: newSelectedCells,
    anchorCell: { rowIndex, colId },
  };
}

/**
 * Check if a row is selected
 */
export function isRowSelected(selection: SelectionState, rowIndex: number): boolean {
  return selection.selectedRows.has(rowIndex);
}

/**
 * Check if a cell is selected
 */
export function isCellSelected(selection: SelectionState, rowIndex: number, colId: string): boolean {
  return selection.selectedCells.has(`${rowIndex}:${colId}`);
}

// ============================================================================
// Selection Plugin
// ============================================================================

let pluginApi: GridApi<RowData> | null = null;
let pluginConfig: SelectionPluginConfig = {};

export const selectionPlugin: GridPlugin<RowData> = {
  name: 'selection',

  init(api: GridApi<RowData>, config?: SelectionPluginConfig) {
    pluginApi = api;
    pluginConfig = config || { mode: 'multiple' };
  },

  destroy() {
    pluginApi = null;
    pluginConfig = {};
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

  const selectedCount = selection.selectedRows.size;
  
  const allSelected = selectedCount > 0 && selectedCount === api.getDisplayedRowCount();
  
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
