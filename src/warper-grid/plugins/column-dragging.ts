import type { RowData, GridPlugin, GridApi } from '../types';

export interface ColumnDraggingPluginConfig {
  animation?: boolean;
}

export function createColumnDraggingPlugin<TData extends RowData = RowData>(
  config?: ColumnDraggingPluginConfig
): GridPlugin<TData> {
  let api: GridApi<TData> | null = null;

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
      const ondragstart: EventListener = (e) => {
        const event = e as DragEvent;
        event.dataTransfer?.setData('text/plain', String(idx));
        header.classList.add('dragging');
      };
      const ondragend: EventListener = () => {
        header.classList.remove('dragging');
      };
      const ondragover: EventListener = (e) => {
        e.preventDefault();
        header.classList.add('drag-over');
      };
      const ondragleave: EventListener = () => {
        header.classList.remove('drag-over');
      };
      const ondrop: EventListener = (e) => {
        e.preventDefault();
        header.classList.remove('drag-over');
        const event = e as DragEvent;
        const fromIdx = Number(event.dataTransfer?.getData('text/plain'));
        const toIdx = idx;
        if (fromIdx !== toIdx && api && typeof api.moveColumn === 'function') {
          api.moveColumn(fromIdx, toIdx, config?.animation ?? true);
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
      api = gridApi;
      setTimeout(attachDragListeners, 100);
    },
    destroy: () => {
      api = null;
    },
  };
}
export default createColumnDraggingPlugin;
