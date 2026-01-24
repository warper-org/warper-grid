import { useCallback, useState, type ReactNode, type RefObject } from 'react';
import { ArrowUp, ArrowDown, ArrowUpDown, MoreVertical, Filter, Grip } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useColumnResizing, getResizerProps } from '../plugins/column-resizing';
import { ColumnMenu } from './ColumnMenu';
import type { RowData, GridApi, ComputedColumn, SortDirection, HeaderRendererParams } from '../types';
import type { ColumnMenuState } from '../plugins/column-menu';

// ============================================================================
// Grid Header Component
// ============================================================================

interface GridHeaderProps<TData extends RowData> {
  columns: ComputedColumn<TData>[];
  totalWidth: number;
  headerHeight: number;
  api: GridApi<TData>;
  /** Optional ref to the header scroll container used for horizontal sync */
  headerScrollRef?: RefObject<HTMLDivElement | null>;
}

export function GridHeader<TData extends RowData>({
  columns,
  totalWidth,
  headerHeight,
  api,
  headerScrollRef,
}: GridHeaderProps<TData>) {
  const { resizingColId, startResize } = useColumnResizing(api);
  const [columnMenu, setColumnMenu] = useState<ColumnMenuState>({
    isOpen: false,
    x: 0,
    y: 0,
    colId: null,
  });

  const handleOpenColumnMenu = useCallback((e: React.MouseEvent, colId: string) => {
    e.stopPropagation();
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    setColumnMenu({
      isOpen: true,
      x: rect.right,
      y: rect.bottom,
      colId,
    });
  }, []);

  const handleCloseColumnMenu = useCallback(() => {
    setColumnMenu(prev => ({ ...prev, isOpen: false }));
  }, []);

  const handleSort = useCallback((colId: string) => {
    const currentModel = api.getSortModel();
    const existing = currentModel.find(s => s.colId === colId);
    
    let newDirection: SortDirection;
    if (!existing?.sort) {
      newDirection = 'asc';
    } else if (existing.sort === 'asc') {
      newDirection = 'desc';
    } else {
      newDirection = null;
    }

    if (newDirection === null) {
      api.setSortModel(currentModel.filter(s => s.colId !== colId));
    } else {
      const newModel = currentModel.filter(s => s.colId !== colId);
      newModel.push({ colId, sort: newDirection });
      api.setSortModel(newModel);
    }
  }, [api]);

  const getSortDirection = (colId: string): SortDirection => {
    const model = api.getSortModel();
    return model.find(s => s.colId === colId)?.sort ?? null;
  };

  return (
    <div
      className="warper-grid-header"
      style={{ height: headerHeight }}
    >
      <div
        ref={headerScrollRef}
        className="warper-grid-header-scroll"
        style={{ overflowX: 'auto', overflowY: 'hidden', width: '100%' }}
      >
        <div
          className="warper-grid-header-row"
          style={{ width: totalWidth, height: '100%' }}
        >
          {columns.map((col, index) => {
            const sortDirection = getSortDirection(col.id);
            const isSortable = col.sortable !== false;
            const isColumnResizing = resizingColId === col.id;

            return (
              <div
                key={col.id}
                data-col-id={col.id}
                className={cn(
                  'warper-grid-header-cell group',
                  isSortable && 'warper-grid-header-cell--sortable',
                  sortDirection && 'warper-grid-header-cell--sorted',
                  col.pinned === 'left' && 'warper-grid-pinned-left',
                  col.pinned === 'right' && 'warper-grid-pinned-right'
                )}
                draggable={false}
                style={{
                  width: col.computedWidth,
                  minWidth: col.minWidth,
                  maxWidth: col.maxWidth,
                  position: 'relative',
                  textAlign: col.headerAlign || col.align || 'left',
                  display: 'flex',
                  alignItems: 'center',
                  /* Pinned columns are now normal columns (no sticky positioning) */
                  /* Keep visual treatment via classes only */
                  /* offsets are preserved in order but not overlaid */
                  ...(typeof col.headerStyle === 'function'
                    ? col.headerStyle({ column: col, columnIndex: index, api })
                    : col.headerStyle),
                  ...(typeof col.headerStyle === 'function'
                    ? col.headerStyle({ column: col, columnIndex: index, api })
                    : col.headerStyle),
                }}
                onClick={() => isSortable && handleSort(col.id)}
              >
                {/* Drag Handle */}
                <span
                  className="drag-handle mr-1 shrink-0 cursor-grab hover:bg-black/10 dark:hover:bg-white/10 rounded p-0.5"
                  title="Drag to move column"
                  tabIndex={0}
                  role="button"
                  aria-label="Drag to move column"
                  style={{ WebkitUserSelect: 'none', userSelect: 'none', touchAction: 'none' }}
                >
                  <Grip className="h-4 w-4 pointer-events-none" />
                </span>
                {/* Header Content */}
                <span className="flex-1 truncate">
                  {col.headerRenderer && typeof col.headerRenderer === 'function' ? (
                    (col.headerRenderer as (params: HeaderRendererParams<TData>) => ReactNode)({
                      column: col,
                      columnIndex: index,
                      api,
                      sortDirection,
                      toggleSort: () => handleSort(col.id),
                      isResizing: isColumnResizing,
                    })
                  ) : (
                    col.headerName || col.id
                  )}
                </span>

                {/* Sort Indicator */}
                {isSortable && (
                  <span className="ml-1 shrink-0">
                    {sortDirection === 'asc' ? (
                      <ArrowUp className="h-4 w-4" />
                    ) : sortDirection === 'desc' ? (
                      <ArrowDown className="h-4 w-4" />
                    ) : (
                      <ArrowUpDown className="h-4 w-4 opacity-30" />
                    )}
                  </span>
                )}

                {/* Column Menu Button */}
                <button
                  className="ml-1 p-0.5 rounded hover:bg-black/10 dark:hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                  onClick={(e) => handleOpenColumnMenu(e, col.id)}
                  title="Column menu"
                >
                  <MoreVertical className="h-4 w-4" />
                </button>

                {/* Filter Indicator */}
                {col.filterable && (
                  <span className="ml-1 shrink-0 opacity-50">
                    <Filter className="h-3 w-3" />
                  </span>
                )}

                {/* Resize Handle */}
                {col.resizable !== false && (
                  <div
                    {...getResizerProps(
                      col.id,
                      col.computedWidth,
                      startResize,
                      isColumnResizing
                    )}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Column Menu */}
      {columnMenu.isOpen && (
        <ColumnMenu
          state={columnMenu}
          api={api}
          column={columns.find(c => c.id === columnMenu.colId) || null}
          onClose={handleCloseColumnMenu}
        />
      )}
    </div>
  );
}
