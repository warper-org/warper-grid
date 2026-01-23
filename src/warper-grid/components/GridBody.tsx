import type { RowData, GridApi, ComputedColumn, CellValue } from '../types';
import { cn } from '@/lib/utils';

// ============================================================================
// Grid Body Component
// ============================================================================

interface GridBodyProps<TData extends RowData> {
  data: TData[];
  columns: ComputedColumn<TData>[];
  range: {
    items: number[];
    offsets: number[];
    sizes: number[];
  };
  totalHeight: number;
  totalWidth: number;
  striped: boolean;
  selectedRows: Set<number>;
  api: GridApi<TData>;
  getRowId?: (data: TData, index: number) => string | number;
  onRowClick?: (rowIndex: number, data: TData, event: React.MouseEvent) => void;
  onCellClick?: (rowIndex: number, colId: string, value: CellValue, data: TData, event: React.MouseEvent) => void;
  onCellDoubleClick?: (rowIndex: number, colId: string, value: CellValue, data: TData, event: React.MouseEvent) => void;
}

export function GridBody<TData extends RowData>({
  data,
  columns,
  range,
  totalHeight,
  totalWidth,
  striped,
  selectedRows,
  api,
  getRowId,
  onRowClick,
  onCellClick,
  onCellDoubleClick,
}: GridBodyProps<TData>) {
  // Detect global all-selected marker
  const selectedRowsAll = api.getState().selection.allSelected ?? false;

  return (
    <div
      style={{
        height: totalHeight,
        width: totalWidth,
        position: 'relative',
      }}
    >
      {range.items.map((rowIndex, i) => {
        const rowData = data[rowIndex];
        if (!rowData) return null;

        const isSelected = selectedRowsAll ? true : selectedRows.has(rowIndex);
        const rowId = getRowId ? getRowId(rowData, rowIndex) : rowIndex;

        return (
          <GridRow
            key={rowId}
            rowIndex={rowIndex}
            data={rowData}
            columns={columns}
            offset={range.offsets[i]}
            height={range.sizes[i]}
            totalWidth={totalWidth}
            isSelected={isSelected}
            striped={striped}
            api={api}
            onRowClick={onRowClick}
            onCellClick={onCellClick}
            onCellDoubleClick={onCellDoubleClick}
          />
        );
      })}
    </div>
  );
}

// ============================================================================
// Grid Row Component
// ============================================================================

interface GridRowProps<TData extends RowData> {
  rowIndex: number;
  data: TData;
  columns: ComputedColumn<TData>[];
  offset: number;
  height: number;
  totalWidth: number;
  isSelected: boolean;
  striped: boolean;
  api: GridApi<TData>;
  onRowClick?: (rowIndex: number, data: TData, event: React.MouseEvent) => void;
  onCellClick?: (rowIndex: number, colId: string, value: CellValue, data: TData, event: React.MouseEvent) => void;
  onCellDoubleClick?: (rowIndex: number, colId: string, value: CellValue, data: TData, event: React.MouseEvent) => void;
}

function GridRow<TData extends RowData>({
  rowIndex,
  data,
  columns,
  offset,
  height,
  totalWidth,
  isSelected,
  striped,
  api,
  onRowClick,
  onCellClick,
  onCellDoubleClick,
}: GridRowProps<TData>) {
  return (
    <div
      className={cn(
        'warper-grid-row',
        isSelected && 'warper-grid-row--selected',
        striped && 'warper-grid-row--striped'
      )}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        transform: `translateY(${offset}px)`,
        height,
        width: totalWidth,
        display: 'flex',
      }}
      onClick={(e) => onRowClick?.(rowIndex, data, e)}
    >
      {columns.map((col, colIndex) => (
        <GridCell
          key={col.id}
          column={col}
          columnIndex={colIndex}
          rowIndex={rowIndex}
          data={data}
          api={api}
          onCellClick={onCellClick}
          onCellDoubleClick={onCellDoubleClick}
        />
      ))}
    </div>
  );
}

// ============================================================================
// Grid Cell Component
// ============================================================================

interface GridCellProps<TData extends RowData> {
  column: ComputedColumn<TData>;
  columnIndex: number;
  rowIndex: number;
  data: TData;
  api: GridApi<TData>;
  onCellClick?: (rowIndex: number, colId: string, value: CellValue, data: TData, event: React.MouseEvent) => void;
  onCellDoubleClick?: (rowIndex: number, colId: string, value: CellValue, data: TData, event: React.MouseEvent) => void;
}

function GridCell<TData extends RowData>({
  column,
  columnIndex,
  rowIndex,
  data,
  api,
  onCellClick,
  onCellDoubleClick,
}: GridCellProps<TData>) {
  // Get raw value
  let value: CellValue;
  if (column.valueGetter) {
    value = column.valueGetter({
      data,
      column,
      columnIndex,
      rowIndex,
      api,
    });
  } else if (column.field) {
    value = (data as Record<string, unknown>)[column.field as string] as CellValue;
  } else {
    value = null;
  }

  // Format value
  let displayValue: string | CellValue = value;
  if (column.valueFormatter) {
    displayValue = column.valueFormatter({
      value,
      data,
      column,
      columnIndex,
      rowIndex,
      api,
    });
  }

  // Get cell class
  const cellClass = typeof column.cellClass === 'function'
    ? column.cellClass({ value, data, column, columnIndex, rowIndex, api })
    : column.cellClass;

  // Get cell style
  const cellStyle = typeof column.cellStyle === 'function'
    ? column.cellStyle({ value, data, column, columnIndex, rowIndex, api })
    : column.cellStyle;

  return (
    <div
      className={cn('warper-grid-cell', cellClass)}
      style={{
        width: column.computedWidth,
        minWidth: column.minWidth,
        maxWidth: column.maxWidth,
        textAlign: column.align || 'left',
        ...cellStyle,
      }}
      onClick={(e) => {
        e.stopPropagation();
        onCellClick?.(rowIndex, column.id, value, data, e);
      }}
      onDoubleClick={(e) => {
        e.stopPropagation();
        onCellDoubleClick?.(rowIndex, column.id, value, data, e);
      }}
    >
      {column.cellRenderer ? (
        (() => {
          const Renderer = column.cellRenderer;
          const rendererParams = {
            value,
            data,
            column,
            columnIndex,
            rowIndex,
            api,
            params: column.cellRendererParams,
            refreshCell: () => api.refreshCells({ rowIndices: [rowIndex], columns: [column.id] }),
            setValue: () => {},
          };
          // Check if it's a class component by looking for prototype.isReactComponent
          if (Renderer.prototype && Renderer.prototype.isReactComponent) {
            const Component = Renderer as React.ComponentClass<typeof rendererParams>;
            return <Component {...rendererParams} />;
          }
          // Otherwise treat it as a function (stateless component or render function)
          return (Renderer as (params: typeof rendererParams) => React.ReactNode)(rendererParams);
        })()
      ) : (
        <span className="truncate">
          {displayValue != null ? String(displayValue) : ''}
        </span>
      )}
    </div>
  );
}
