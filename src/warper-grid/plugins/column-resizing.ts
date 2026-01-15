import { useState, useCallback, useRef, useEffect } from 'react';
import type { 
  RowData, 
  GridPlugin, 
  GridApi, 
  ColumnResizingPluginConfig 
} from '../types';

// ============================================================================
// Column Resizing Utilities
// ============================================================================

export interface ResizeState {
  colId: string;
  startX: number;
  startWidth: number;
}

/**
 * Calculate new width during resize
 */
export function calculateNewWidth(
  startWidth: number,
  startX: number,
  currentX: number,
  minWidth: number = 50,
  maxWidth: number = 1000
): number {
  const delta = currentX - startX;
  const newWidth = startWidth + delta;
  return Math.min(Math.max(newWidth, minWidth), maxWidth);
}

// ============================================================================
// Column Resizing Plugin
// ============================================================================

let pluginApi: GridApi<RowData> | null = null;
let pluginConfig: ColumnResizingPluginConfig = {};

export const columnResizingPlugin: GridPlugin<RowData> = {
  name: 'columnResizing',

  init(api: GridApi<RowData>, config?: ColumnResizingPluginConfig) {
    pluginApi = api;
    pluginConfig = config || { minWidth: 50, maxWidth: 1000 };
  },

  destroy() {
    pluginApi = null;
    pluginConfig = {};
  },
};

// ============================================================================
// Column Resizing Hook
// ============================================================================

export function useColumnResizing<TData extends RowData>(
  api: GridApi<TData>,
  minWidth: number = 50,
  maxWidth: number = 1000
) {
  const [resizeState, setResizeState] = useState<ResizeState | null>(null);
  const [isResizing, setIsResizing] = useState(false);
  
  const startResize = useCallback((colId: string, startX: number, startWidth: number) => {
    setResizeState({ colId, startX, startWidth });
    setIsResizing(true);
  }, []);

  const updateResize = useCallback((currentX: number) => {
    if (!resizeState) return;
    
    const newWidth = calculateNewWidth(
      resizeState.startWidth,
      resizeState.startX,
      currentX,
      minWidth,
      maxWidth
    );
    
    api.setColumnWidth(resizeState.colId, newWidth);
  }, [resizeState, api, minWidth, maxWidth]);

  const endResize = useCallback(() => {
    setResizeState(null);
    setIsResizing(false);
  }, []);

  // Setup mouse event handlers
  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      updateResize(e.clientX);
    };

    const handleMouseUp = () => {
      endResize();
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, updateResize, endResize]);

  return {
    isResizing,
    resizingColId: resizeState?.colId ?? null,
    startResize,
    updateResize,
    endResize,
  };
}

// ============================================================================
// Resizer Component Props
// ============================================================================

export interface ResizerProps {
  colId: string;
  onResizeStart: (colId: string, startX: number, startWidth: number) => void;
  currentWidth: number;
  isResizing: boolean;
}

/**
 * Get resizer handle props
 */
export function getResizerProps(
  colId: string,
  currentWidth: number,
  onResizeStart: (colId: string, startX: number, startWidth: number) => void,
  isResizing: boolean
) {
  return {
    onMouseDown: (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      onResizeStart(colId, e.clientX, currentWidth);
    },
    className: `warper-grid-resizer ${isResizing ? 'warper-grid-resizer--resizing' : ''}`,
    style: { cursor: 'col-resize' },
  };
}
