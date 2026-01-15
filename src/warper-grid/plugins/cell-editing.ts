import type {
  RowData,
  GridPlugin,
  GridApi,
  CellValue,
  ColumnDef,
  CellEditorParams,
} from '../types';
import type { CellPosition } from './cell-selection';

// ============================================================================
// Cell Editing Types
// ============================================================================

export type EditTrigger = 'click' | 'doubleClick' | 'keyPress' | 'f2' | 'enter';

export interface CellEditingPluginConfig {
  /** Trigger to start editing */
  editTrigger?: EditTrigger;
  /** Enable editing */
  enabled?: boolean;
  /** Enable undo/redo */
  undoRedo?: boolean;
  /** Max undo stack size */
  undoStackSize?: number;
  /** Callback before edit starts */
  onEditStart?: (params: EditStartParams) => boolean | void;
  /** Callback when edit completes */
  onEditComplete?: (params: EditCompleteParams) => void;
  /** Callback when edit is cancelled */
  onEditCancel?: (params: EditCancelParams) => void;
}

export interface EditStartParams {
  rowIndex: number;
  colId: string;
  value: CellValue;
}

export interface EditCompleteParams extends EditStartParams {
  newValue: CellValue;
  oldValue: CellValue;
}

export interface EditCancelParams extends EditStartParams {
  originalValue: CellValue;
}

export interface EditingState {
  isEditing: boolean;
  editingCell: CellPosition | null;
  originalValue: CellValue;
}

export interface UndoRedoAction {
  type: 'cell-edit';
  rowIndex: number;
  colId: string;
  oldValue: CellValue;
  newValue: CellValue;
}

export interface UndoRedoState {
  undoStack: UndoRedoAction[];
  redoStack: UndoRedoAction[];
}

// ============================================================================
// Built-in Cell Editors
// ============================================================================

export type BuiltInEditor = 'text' | 'number' | 'date' | 'checkbox' | 'select' | 'largeText';

export interface TextEditorParams {
  maxLength?: number;
  placeholder?: string;
}

export interface NumberEditorParams {
  min?: number;
  max?: number;
  step?: number;
  precision?: number;
}

export interface SelectEditorParams {
  options: { value: CellValue; label: string }[];
  multiple?: boolean;
}

export interface DateEditorParams {
  format?: string;
  min?: Date;
  max?: Date;
}

// ============================================================================
// Cell Editing Utilities
// ============================================================================

/**
 * Check if a column is editable
 */
export function isColumnEditable<TData extends RowData>(
  column: ColumnDef<TData>,
  rowData: TData,
  rowIndex: number
): boolean {
  if (typeof column.editable === 'function') {
    return column.editable;
  }
  return column.editable === true;
}

/**
 * Get cell value for editing
 */
export function getCellValueForEdit<TData extends RowData>(
  rowData: TData,
  column: ColumnDef<TData>
): CellValue {
  if (column.field) {
    return (rowData as Record<string, unknown>)[column.field as string] as CellValue;
  }
  return null;
}

/**
 * Validate cell value
 */
export function validateCellValue(
  value: CellValue,
  column: ColumnDef<RowData>
): { valid: boolean; message?: string } {
  // Basic validation based on filter type (which indicates data type)
  if (column.filterType === 'number' && typeof value !== 'number') {
    const parsed = parseFloat(String(value));
    if (isNaN(parsed)) {
      return { valid: false, message: 'Value must be a number' };
    }
  }
  
  return { valid: true };
}

/**
 * Parse input value based on column type
 */
export function parseInputValue(
  inputValue: string,
  column: ColumnDef<RowData>
): CellValue {
  switch (column.filterType) {
    case 'number':
      const num = parseFloat(inputValue);
      return isNaN(num) ? null : num;
    case 'boolean':
      return inputValue.toLowerCase() === 'true';
    case 'date':
      const date = new Date(inputValue);
      return isNaN(date.getTime()) ? null : date;
    default:
      return inputValue;
  }
}

// ============================================================================
// Keyboard Navigation
// ============================================================================

export type NavigationDirection = 'up' | 'down' | 'left' | 'right' | 'tab' | 'shiftTab';

export function getNextEditableCell<TData extends RowData>(
  currentCell: CellPosition,
  direction: NavigationDirection,
  columns: ColumnDef<TData>[],
  rowCount: number
): CellPosition | null {
  const visibleColumns = columns.filter(col => !col.hide);
  const currentColIndex = visibleColumns.findIndex(col => col.id === currentCell.colId);
  
  if (currentColIndex === -1) return null;
  
  let nextRow = currentCell.rowIndex;
  let nextColIndex = currentColIndex;
  
  switch (direction) {
    case 'up':
      nextRow = Math.max(0, currentCell.rowIndex - 1);
      break;
    case 'down':
      nextRow = Math.min(rowCount - 1, currentCell.rowIndex + 1);
      break;
    case 'left':
      nextColIndex = Math.max(0, currentColIndex - 1);
      break;
    case 'right':
      nextColIndex = Math.min(visibleColumns.length - 1, currentColIndex + 1);
      break;
    case 'tab':
      nextColIndex++;
      if (nextColIndex >= visibleColumns.length) {
        nextColIndex = 0;
        nextRow = Math.min(rowCount - 1, currentCell.rowIndex + 1);
      }
      break;
    case 'shiftTab':
      nextColIndex--;
      if (nextColIndex < 0) {
        nextColIndex = visibleColumns.length - 1;
        nextRow = Math.max(0, currentCell.rowIndex - 1);
      }
      break;
  }
  
  if (nextRow === currentCell.rowIndex && nextColIndex === currentColIndex) {
    return null;
  }
  
  return {
    rowIndex: nextRow,
    colId: visibleColumns[nextColIndex].id,
  };
}

// ============================================================================
// Undo/Redo Manager
// ============================================================================

export class UndoRedoManager {
  private undoStack: UndoRedoAction[] = [];
  private redoStack: UndoRedoAction[] = [];
  private maxSize: number;
  
  constructor(maxSize: number = 100) {
    this.maxSize = maxSize;
  }
  
  push(action: UndoRedoAction): void {
    this.undoStack.push(action);
    if (this.undoStack.length > this.maxSize) {
      this.undoStack.shift();
    }
    // Clear redo stack on new action
    this.redoStack = [];
  }
  
  undo(): UndoRedoAction | null {
    const action = this.undoStack.pop();
    if (action) {
      this.redoStack.push(action);
      return action;
    }
    return null;
  }
  
  redo(): UndoRedoAction | null {
    const action = this.redoStack.pop();
    if (action) {
      this.undoStack.push(action);
      return action;
    }
    return null;
  }
  
  canUndo(): boolean {
    return this.undoStack.length > 0;
  }
  
  canRedo(): boolean {
    return this.redoStack.length > 0;
  }
  
  clear(): void {
    this.undoStack = [];
    this.redoStack = [];
  }
}

// ============================================================================
// Cell Editing Plugin
// ============================================================================

export function createCellEditingPlugin<TData extends RowData = RowData>(
  config?: CellEditingPluginConfig
): GridPlugin<TData> {
  let api: GridApi<TData> | null = null;
  const undoRedoManager = new UndoRedoManager(config?.undoStackSize || 100);
  
  const pluginConfig: CellEditingPluginConfig = {
    editTrigger: 'doubleClick',
    enabled: true,
    undoRedo: true,
    undoStackSize: 100,
    ...config,
  };

  return {
    name: 'cellEditing',
    init: (gridApi) => {
      api = gridApi;
    },
    destroy: () => {
      api = null;
      undoRedoManager.clear();
    },
  };
}

export default createCellEditingPlugin;
