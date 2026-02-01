import type { RowData, GridPlugin, GridApi } from '../types';

export interface ColumnDraggingPluginConfig {
  animation?: boolean;
  animationDuration?: number;
}

/**
 * Column Dragging Plugin - Performance Optimized
 * Uses native drag-and-drop with visual feedback and smooth animations
 */
export function createColumnDraggingPlugin<TData extends RowData = RowData>(
  config?: ColumnDraggingPluginConfig
): GridPlugin<TData> {
  let pluginApi: GridApi<TData> | null = null;
  let isInitialized = false;
  let observer: MutationObserver | null = null;
  
  // Configuration with defaults
  const animationEnabled = config?.animation ?? true;
  const animationDuration = config?.animationDuration ?? 200;

  // WeakMaps for efficient listener management
  const dragStartListeners = new WeakMap<Element, (e: DragEvent) => void>();
  const dragEndListeners = new WeakMap<Element, () => void>();
  const dragOverListeners = new WeakMap<Element, (e: DragEvent) => void>();
  const dragLeaveListeners = new WeakMap<Element, () => void>();
  const dropListeners = new WeakMap<Element, (e: DragEvent) => void>();

  // Current drag state
  let dragSourceIndex: number = -1;
  let dragGhost: HTMLElement | null = null;

  function moveColumn(fromIdx: number, toIdx: number) {
    if (pluginApi && typeof pluginApi.moveColumn === 'function') {
      pluginApi.moveColumn(fromIdx, toIdx, animationEnabled);
    }
  }

  function cleanupGhost() {
    if (dragGhost?.parentNode) {
      dragGhost.parentNode.removeChild(dragGhost);
    }
    dragGhost = null;
  }

  function attachDragListeners() {
    if (!isInitialized) return;
    
    const headers = document.querySelectorAll('.warper-grid-header-cell');
    
    headers.forEach((header, idx) => {
      const handle = header.querySelector('.drag-handle');
      if (!handle) return;

      // Remove existing listeners to prevent duplicates
      const prevDragStart = dragStartListeners.get(handle);
      if (prevDragStart) handle.removeEventListener('dragstart', prevDragStart as EventListener);
      
      const prevDragEnd = dragEndListeners.get(handle);
      if (prevDragEnd) handle.removeEventListener('dragend', prevDragEnd as EventListener);
      
      const prevDragOver = dragOverListeners.get(header);
      if (prevDragOver) header.removeEventListener('dragover', prevDragOver as EventListener);
      
      const prevDragLeave = dragLeaveListeners.get(header);
      if (prevDragLeave) header.removeEventListener('dragleave', prevDragLeave as EventListener);
      
      const prevDrop = dropListeners.get(header);
      if (prevDrop) header.removeEventListener('drop', prevDrop as EventListener);

      // Set draggable attributes
      (handle as HTMLElement).setAttribute('draggable', 'true');
      header.setAttribute('draggable', 'false');

      // Drag start handler
      const onDragStart = (e: DragEvent) => {
        e.stopPropagation();
        dragSourceIndex = idx;
        const colId = (header as HTMLElement).dataset.colId || '';
        
        // Set transfer data
        const payload = JSON.stringify({ idx, colId });
        e.dataTransfer?.setData('application/warper-col', payload);
        e.dataTransfer?.setData('text/plain', payload);
        e.dataTransfer!.effectAllowed = 'move';
        
        // Add dragging class
        header.classList.add('dragging');

        // Create lightweight ghost
        try {
          cleanupGhost();
          dragGhost = (header as HTMLElement).cloneNode(true) as HTMLElement;
          Object.assign(dragGhost.style, {
            position: 'fixed',
            top: '-9999px',
            left: '-9999px',
            opacity: '0.9',
            pointerEvents: 'none',
            zIndex: '9999',
          });
          dragGhost.classList.add('drag-ghost');
          document.body.appendChild(dragGhost);
          
          if (e.dataTransfer && dragGhost) {
            e.dataTransfer.setDragImage(
              dragGhost,
              Math.floor(dragGhost.offsetWidth / 2),
              Math.floor(dragGhost.offsetHeight / 2)
            );
          }
        } catch {
          // Ignore drag image errors on older browsers
        }
      };

      // Drag end handler
      const onDragEnd = () => {
        header.classList.remove('dragging', 'drag-over-left', 'drag-over-right');
        cleanupGhost();
        dragSourceIndex = -1;
      };

      // Drag over handler with throttling
      let lastDragOver = 0;
      const onDragOver = (e: DragEvent) => {
        e.preventDefault();
        e.dataTransfer!.dropEffect = 'move';
        
        // Throttle class updates to 60fps
        const now = performance.now();
        if (now - lastDragOver < 16) return;
        lastDragOver = now;
        
        const rect = (header as HTMLElement).getBoundingClientRect();
        const midX = rect.left + rect.width / 2;
        
        if (e.clientX < midX) {
          header.classList.add('drag-over-left');
          header.classList.remove('drag-over-right');
        } else {
          header.classList.add('drag-over-right');
          header.classList.remove('drag-over-left');
        }
      };

      // Drag leave handler
      const onDragLeave = () => {
        header.classList.remove('drag-over-left', 'drag-over-right');
      };

      // Drop handler
      const onDrop = (e: DragEvent) => {
        e.preventDefault();
        header.classList.remove('drag-over-left', 'drag-over-right');
        
        // Get source index from transfer data
        let fromIdx = dragSourceIndex;
        try {
          const payload = JSON.parse(
            e.dataTransfer?.getData('application/warper-col') || 
            e.dataTransfer?.getData('text/plain') || 
            'null'
          );
          if (payload?.idx !== undefined) fromIdx = payload.idx;
        } catch {
          // Use dragSourceIndex as fallback
        }
        
        if (fromIdx < 0) return;
        
        // Determine target index based on drop position
        const rect = (header as HTMLElement).getBoundingClientRect();
        const midX = rect.left + rect.width / 2;
        let toIdx = idx;
        if (e.clientX >= midX) toIdx = idx + 1;
        
        // Normalize indices
        const totalCols = headers.length;
        if (toIdx > totalCols) toIdx = totalCols;
        
        // Only move if position actually changes
        if (fromIdx !== toIdx && fromIdx !== toIdx - 1) {
          const adjustedToIdx = toIdx - (fromIdx < toIdx ? 1 : 0);
          moveColumn(fromIdx, adjustedToIdx);
          
          // Re-attach listeners after DOM update
          requestAnimationFrame(() => {
            setTimeout(attachDragListeners, 50);
          });
        }
      };

      // Store and attach listeners
      dragStartListeners.set(handle, onDragStart);
      dragEndListeners.set(handle, onDragEnd);
      dragOverListeners.set(header, onDragOver);
      dragLeaveListeners.set(header, onDragLeave);
      dropListeners.set(header, onDrop);

      handle.addEventListener('dragstart', onDragStart as EventListener);
      handle.addEventListener('dragend', onDragEnd as EventListener);
      header.addEventListener('dragover', onDragOver as EventListener);
      header.addEventListener('dragleave', onDragLeave as EventListener);
      header.addEventListener('drop', onDrop as EventListener);
    });
  }

  return {
    name: 'columnMoving',
    
    init: (gridApi) => {
      pluginApi = gridApi;
      isInitialized = true;
      
      // Initial attachment with delay for DOM readiness
      requestAnimationFrame(() => {
        setTimeout(attachDragListeners, 100);
      });
      
      // Watch for header changes using MutationObserver
      observer = new MutationObserver((mutations) => {
        const hasRelevantChange = mutations.some(m => 
          m.type === 'childList' || 
          (m.type === 'attributes' && m.attributeName === 'data-col-id')
        );
        if (hasRelevantChange) {
          requestAnimationFrame(attachDragListeners);
        }
      });
      
      const headerRow = document.querySelector('.warper-grid-header-row');
      if (headerRow) {
        observer.observe(headerRow, { 
          childList: true, 
          subtree: true, 
          attributes: true 
        });
      }
    },
    
    destroy: () => {
      isInitialized = false;
      pluginApi = null;
      cleanupGhost();
      
      if (observer) {
        observer.disconnect();
        observer = null;
      }
    },
  };
}

export default createColumnDraggingPlugin;
