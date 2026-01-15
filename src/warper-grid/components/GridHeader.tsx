import { useCallback, useState, type ReactNode } from 'react';
import { ArrowUp, ArrowDown, ArrowUpDown, MoreVertical, Filter } from 'lucide-react';
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
}

export function GridHeader<TData extends RowData>({
  columns,
  totalWidth,
  headerHeight,
  api,
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
              className={cn(
                'warper-grid-header-cell group',
                isSortable && 'warper-grid-header-cell--sortable',
                sortDirection && 'warper-grid-header-cell--sorted'
              )}
              style={{
                width: col.computedWidth,
                minWidth: col.minWidth,
                maxWidth: col.maxWidth,
                position: 'relative',
                textAlign: col.headerAlign || col.align || 'left',
                ...(typeof col.headerStyle === 'function'
                  ? col.headerStyle({ column: col, columnIndex: index, api })
                  : col.headerStyle),
              }}
              onClick={() => isSortable && handleSort(col.id)}
            >
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
                <span className="ml-1 flex-shrink-0">
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
                className="ml-1 p-0.5 rounded hover:bg-black/10 dark:hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                onClick={(e) => handleOpenColumnMenu(e, col.id)}
                title="Column menu"
              >
                <MoreVertical className="h-4 w-4" />
              </button>

              {/* Filter Indicator */}
              {col.filterable && (
                <span className="ml-1 flex-shrink-0 opacity-50">
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
