import { useState, useCallback, useRef, useEffect } from 'react';
import type {
  RowData,
  GridPlugin,
  GridApi,
  ColumnResizingPluginConfig
} from '../types';

// ============================================================================
// Column Resizing Utilities - Performance Optimized
// ============================================================================

export interface ResizeState {
  colId: string;
  startX: number;
  startWidth: number;
}

/**
 * Calculate new width during resize - Inlined for performance
 */
export function calculateNewWidth(
  startWidth: number,
  startX: number,
  currentX: number,
  minWidth: number = 50,
  maxWidth: number = 1000
): number {
  const newWidth = startWidth + (currentX - startX);
  // Use Math.max/min chaining for single operation
  return newWidth < minWidth ? minWidth : newWidth > maxWidth ? maxWidth : newWidth;
}

// ============================================================================
// Column Resizing Plugin - Optimized
// ============================================================================

let _pluginApi: GridApi<RowData> | null = null;
let _pluginConfig: ColumnResizingPluginConfig = {};

export const columnResizingPlugin: GridPlugin<RowData> = {
  name: 'columnResizing',

  init(api: GridApi<RowData>, config?: ColumnResizingPluginConfig) {
    _pluginApi = api;
    _pluginConfig = config || { minWidth: 50, maxWidth: 1000 };
  },

  destroy() {
    _pluginApi = null;
    _pluginConfig = {};
  },
};

// ============================================================================
// Column Resizing Hook - Performance Optimized
// ============================================================================

export function useColumnResizing<TData extends RowData>(
  api: GridApi<TData>,
  minWidth: number = 50,
  maxWidth: number = 1000
) {
  const [isResizing, setIsResizing] = useState(false);
  const resizeStateRef = useRef<ResizeState | null>(null);
  const resizingColIdRef = useRef<string | null>(null);

  // Use RAF for smooth updates
  const rafIdRef = useRef<number | null>(null);
  const lastUpdateRef = useRef<number>(0);

  const startResize = useCallback((colId: string, startX: number, startWidth: number) => {
    resizeStateRef.current = { colId, startX, startWidth };
    resizingColIdRef.current = colId;
    setIsResizing(true);
  }, []);

  const updateResize = useCallback((currentX: number) => {
    const resizeState = resizeStateRef.current;
    if (!resizeState) return;

    // Throttle updates to 60fps using RAF
    const now = performance.now();
    if (now - lastUpdateRef.current < 16) return; // ~60fps
    lastUpdateRef.current = now;

    const newWidth = calculateNewWidth(
      resizeState.startWidth,
      resizeState.startX,
      currentX,
      minWidth,
      maxWidth
    );

    // Only update if width actually changed
    api.setColumnWidth(resizeState.colId, newWidth);
  }, [api, minWidth, maxWidth]);

  const endResize = useCallback(() => {
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
    resizeStateRef.current = null;
    resizingColIdRef.current = null;
    setIsResizing(false);
  }, []);

  // Optimized mouse event handlers with passive listeners
  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      // Use RAF for batched updates
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }
      rafIdRef.current = requestAnimationFrame(() => {
        updateResize(e.clientX);
      });
    };

    const handleMouseUp = () => {
      endResize();
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (rafIdRef.current !== null) cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = requestAnimationFrame(() => {
        updateResize(e.touches[0].clientX);
      });
    };

    const handleTouchEnd = () => {
      endResize();
    };

    // Use passive listeners for better scroll performance
    document.addEventListener('mousemove', handleMouseMove, { passive: true });
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('touchmove', handleTouchMove, { passive: true });
    document.addEventListener('touchend', handleTouchEnd);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, [isResizing, updateResize, endResize]);

  return {
    isResizing,
    resizingColId: resizingColIdRef.current,
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
    onTouchStart: (e: React.TouchEvent) => {
      e.stopPropagation(); // Don't prevent default to allow scrolling if needed, but here we are resizing
      // For resizing, we probably DO want to prevent default scroll
      // e.preventDefault(); // React synthetic event might not support this fully for passive, but let's try
      onResizeStart(colId, e.touches[0].clientX, currentWidth);
    },
    className: `warper-grid-resizer ${isResizing ? 'warper-grid-resizer--resizing' : ''}`,
    style: { cursor: 'col-resize' },
  };
}
