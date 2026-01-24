import type { RowData, GridPlugin, GridApi } from '../types';

export interface ColumnDraggingPluginConfig {
  animation?: boolean;
}

export function createColumnDraggingPlugin<TData extends RowData = RowData>(
  config?: ColumnDraggingPluginConfig
): GridPlugin<TData> {
  let pluginApi: GridApi<TData> | null = null;
  // Helper to move column via API if available (defensive)
  function safeMoveColumn(fromIdx: number, toIdx: number, animation?: boolean) {
    if (pluginApi && typeof pluginApi.moveColumn === 'function') {
      pluginApi.moveColumn(fromIdx, toIdx, animation);
    }
  }

  // Use WeakMaps to store listeners for each element
  const dragStartListeners = new WeakMap<EventTarget, EventListener>();
  const dragEndListeners = new WeakMap<EventTarget, EventListener>();
  const dragOverListeners = new WeakMap<EventTarget, EventListener>();
  const dragLeaveListeners = new WeakMap<EventTarget, EventListener>();
  const dropListeners = new WeakMap<EventTarget, EventListener>();

  function attachDragListeners() {
    const headers = document.querySelectorAll('.warper-grid-header-cell');
    headers.forEach((header, idx) => {
      const handle = header.querySelector('.drag-handle');
      if (!handle) return;
      // Remove previous listeners to avoid duplicates
      const prevDragStart = dragStartListeners.get(handle);
      if (prevDragStart) handle.removeEventListener('dragstart', prevDragStart);
      const prevDragEnd = dragEndListeners.get(handle);
      if (prevDragEnd) handle.removeEventListener('dragend', prevDragEnd);
      const prevDragOver = dragOverListeners.get(header);
      if (prevDragOver) header.removeEventListener('dragover', prevDragOver);
      const prevDragLeave = dragLeaveListeners.get(header);
      if (prevDragLeave) header.removeEventListener('dragleave', prevDragLeave);
      const prevDrop = dropListeners.get(header);
      if (prevDrop) header.removeEventListener('drop', prevDrop);

      (handle as HTMLElement).setAttribute('draggable', 'true');
      header.setAttribute('draggable', 'false');

      // Define listeners
      // Drag start: set data and create a drag ghost for better visuals
      let ghost: HTMLElement | null = null;
      const ondragstart: EventListener = (e) => {
        const event = e as DragEvent;
        const colId = (header as HTMLElement).getAttribute('data-col-id') || '';
        const payload = JSON.stringify({ idx, colId });
        event.dataTransfer?.setData('application/warper-col', payload);
        event.dataTransfer?.setData('text/plain', payload);
        header.classList.add('dragging');

        // Create a lightweight ghost image of the header
        try {
          ghost = (header as HTMLElement).cloneNode(true) as HTMLElement;
          ghost.style.position = 'absolute';
          ghost.style.top = '-9999px';
          ghost.style.left = '-9999px';
          ghost.style.opacity = '0.95';
          ghost.style.pointerEvents = 'none';
          ghost.classList.add('drag-ghost');
          document.body.appendChild(ghost);
          if (event.dataTransfer && ghost) {
            // Use center of ghost as hotspot
            event.dataTransfer.setDragImage(ghost, Math.floor(ghost.offsetWidth / 2), Math.floor(ghost.offsetHeight / 2));
          }
        } catch (err) {
          // ignore setDragImage errors on older browsers
        }
      };

      const ondragend: EventListener = () => {
        header.classList.remove('dragging');
        header.classList.remove('drag-over-left');
        header.classList.remove('drag-over-right');
        if (ghost && ghost.parentNode) ghost.parentNode.removeChild(ghost);
        ghost = null;
      };

      const ondragover: EventListener = (e) => {
        e.preventDefault();
        // Determine whether the drop would insert before or after this header
        const event = e as DragEvent;
        const rect = (header as HTMLElement).getBoundingClientRect();
        const midX = rect.left + rect.width / 2;
        if (event.clientX < midX) {
          header.classList.add('drag-over-left');
          header.classList.remove('drag-over-right');
        } else {
          header.classList.add('drag-over-right');
          header.classList.remove('drag-over-left');
        }
      };

      const ondragleave: EventListener = () => {
        header.classList.remove('drag-over-left');
        header.classList.remove('drag-over-right');
      };

      const ondrop: EventListener = (e) => {
        e.preventDefault();
        header.classList.remove('drag-over-left');
        header.classList.remove('drag-over-right');
        const event = e as DragEvent;
        let fromIdx = Number(event.dataTransfer?.getData('text/plain'));
        try {
          const payload = JSON.parse(event.dataTransfer?.getData('application/warper-col') || event.dataTransfer?.getData('text/plain') || 'null');
          if (payload && typeof payload.idx === 'number') fromIdx = payload.idx;
        } catch (err) {
          // ignore
        }
        // Choose target index based on insertion side
        const rect = (header as HTMLElement).getBoundingClientRect();
        const midX = rect.left + rect.width / 2;
        let toIdx = idx;
        if (event.clientX >= midX) toIdx = idx + 1; // insert after
        // Normalize to bounds
        if (toIdx > (document.querySelectorAll('.warper-grid-header-cell').length)) {
          toIdx = document.querySelectorAll('.warper-grid-header-cell').length;
        }
        if (fromIdx !== toIdx && fromIdx !== toIdx - 1) {
          safeMoveColumn(fromIdx, toIdx - (fromIdx < toIdx ? 1 : 0), config?.animation ?? true);
          setTimeout(attachDragListeners, 0);
        }
      };

      // Store listeners for removal
      dragStartListeners.set(handle, ondragstart);
      dragEndListeners.set(handle, ondragend);
      dragOverListeners.set(header, ondragover);
      dragLeaveListeners.set(header, ondragleave);
      dropListeners.set(header, ondrop);

      // Attach listeners
      handle.addEventListener('dragstart', ondragstart);
      handle.addEventListener('dragend', ondragend);
      header.addEventListener('dragover', ondragover);
      header.addEventListener('dragleave', ondragleave);
      header.addEventListener('drop', ondrop);
    });
  }

  return {
    name: 'columnMoving',
    init: (gridApi) => {
      pluginApi = gridApi;
      setTimeout(attachDragListeners, 100);
    },
    destroy: () => {
      pluginApi = null;
    },
  };
}
export default createColumnDraggingPlugin;
