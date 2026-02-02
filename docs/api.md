# Grid API Reference

The Grid API provides programmatic control over all grid functionality. Access it via `onGridReady` or a ref.

## Accessing the API

### Via onGridReady

```tsx
import { WarperGrid, type GridApi } from '@itsmeadarsh/warper-grid';

function MyGrid() {
  const [api, setApi] = useState<GridApi<MyData> | null>(null);

  return (
    <WarperGrid
      data={data}
      columns={columns}
      onGridReady={(gridApi) => {
        setApi(gridApi);
        console.log('Grid ready with', gridApi.getRowCount(), 'rows');
      }}
    />
  );
}
```

### Via Ref

```tsx
import { useRef } from 'react';
import { WarperGrid, type WarperGridRef } from '@itsmeadarsh/warper-grid';

function MyGrid() {
  const gridRef = useRef<WarperGridRef<MyData>>(null);

  const handleClick = () => {
    const api = gridRef.current?.api;
    if (api) {
      console.log('Row count:', api.getRowCount());
    }
  };

  return (
    <>
      <button onClick={handleClick}>Get Row Count</button>
      <WarperGrid ref={gridRef} data={data} columns={columns} />
    </>
  );
}
```

---

## Data Methods

### getData()

Returns the original data array.

```tsx
const allData = api.getData();
console.log('Total rows:', allData.length);
```

### setData(data)

Replace the grid's data.

```tsx
const newData = await fetch('/api/data').then(r => r.json());
api.setData(newData);
```

### getDisplayedData()

Returns currently visible data (after filtering, sorting, and pagination).

```tsx
const visibleData = api.getDisplayedData();
console.log('Visible rows:', visibleData.length);
```

### getRowCount()

Returns total row count.

```tsx
const total = api.getRowCount();
```

### getDisplayedRowCount()

Returns visible row count (after filtering).

```tsx
const filtered = api.getDisplayedRowCount();
console.log(`Showing ${filtered} of ${api.getRowCount()} rows`);
```

### refreshCells(params?)

Force refresh of specific cells.

```tsx
// Refresh all cells
api.refreshCells();

// Refresh specific rows
api.refreshCells({ rowIndices: [0, 1, 2] });

// Refresh specific columns
api.refreshCells({ columns: ['price', 'stock'] });

// Refresh specific cells
api.refreshCells({ rowIndices: [0, 1], columns: ['price'] });
```

---

## Column Methods

### getColumns()

Returns all column definitions.

```tsx
const columns = api.getColumns();
columns.forEach(col => console.log(col.id, col.headerName));
```

### getColumn(colId)

Get a specific column by ID.

```tsx
const nameColumn = api.getColumn('name');
if (nameColumn) {
  console.log('Name column width:', nameColumn.width);
}
```

### setColumnDefs(columns)

Replace all column definitions.

```tsx
const newColumns = [...columns, { id: 'newCol', field: 'newField', headerName: 'New' }];
api.setColumnDefs(newColumns);
```

### setColumnWidth(colId, width)

Set column width programmatically.

```tsx
api.setColumnWidth('name', 200);
```

### setColumnVisible(colId, visible)

Show or hide a column.

```tsx
// Hide column
api.setColumnVisible('internalId', false);

// Show column
api.setColumnVisible('internalId', true);
```

### setColumnPinned(colId, pinned)

Pin or unpin a column.

```tsx
// Pin to left
api.setColumnPinned('id', 'left');

// Pin to right
api.setColumnPinned('actions', 'right');

// Unpin
api.setColumnPinned('id', false);
```

### autoSizeColumn(colId)

Auto-size a column to fit its content.

```tsx
api.autoSizeColumn('name');
```

### autoSizeAllColumns()

Auto-size all columns.

```tsx
api.autoSizeAllColumns();
```

### moveColumn(fromIdx, toIdx)

Move a column to a new position.

```tsx
// Move column from index 2 to index 0
api.moveColumn(2, 0);
```

---

## Sorting Methods

### getSortModel()

Get current sort state.

```tsx
const sortModel = api.getSortModel();
// [{ colId: 'name', sort: 'asc' }, { colId: 'age', sort: 'desc' }]
```

### setSortModel(model)

Set sort state programmatically.

```tsx
// Single column sort
api.setSortModel([{ colId: 'name', sort: 'asc' }]);

// Multi-column sort
api.setSortModel([
  { colId: 'department', sort: 'asc' },
  { colId: 'name', sort: 'asc' }
]);

// Clear sorting
api.setSortModel([]);
```

---

## Filtering Methods

### getFilterModel()

Get current filter state.

```tsx
const filterModel = api.getFilterModel();
```

### setFilterModel(model)

Set filters programmatically.

```tsx
api.setFilterModel([
  { colId: 'status', filterType: 'text', value: 'active', operator: 'equals' },
  { colId: 'age', filterType: 'number', value: 30, operator: 'greaterThan' },
]);

// Clear all filters
api.setFilterModel([]);
```

### setQuickFilter(text)

Set the quick filter (search all columns).

```tsx
api.setQuickFilter('search term');

// Clear quick filter
api.setQuickFilter('');
```

---

## Selection Methods

### getSelectedRows()

Get selected row data.

```tsx
const selectedData = api.getSelectedRows();
console.log('Selected:', selectedData);
```

### getSelectedRowIndices()

Get selected row indices.

```tsx
const indices = api.getSelectedRowIndices();
console.log('Selected indices:', indices);
```

### selectRow(rowIndex, clearOthers?)

Select a row.

```tsx
// Select row, keeping existing selection
api.selectRow(5);

// Select row, clearing existing selection
api.selectRow(5, true);
```

### deselectRow(rowIndex)

Deselect a specific row.

```tsx
api.deselectRow(5);
```

### selectAll()

Select all rows.

```tsx
api.selectAll();
```

### deselectAll()

Clear selection.

```tsx
api.deselectAll();
```

---

## Pagination Methods

### getPage()

Get current page (0-indexed).

```tsx
const currentPage = api.getPage(); // 0, 1, 2, ...
```

### setPage(page)

Navigate to a specific page.

```tsx
api.setPage(0); // First page
api.setPage(2); // Third page
```

### getPageSize()

Get current page size.

```tsx
const pageSize = api.getPageSize(); // 25, 50, 100, ...
```

### setPageSize(size)

Change page size.

```tsx
api.setPageSize(100);
```

### getTotalPages()

Get total number of pages.

```tsx
const totalPages = api.getTotalPages();
```

### nextPage()

Navigate to next page.

```tsx
api.nextPage();
```

### previousPage()

Navigate to previous page.

```tsx
api.previousPage();
```

### firstPage()

Navigate to first page.

```tsx
api.firstPage();
```

### lastPage()

Navigate to last page.

```tsx
api.lastPage();
```

---

## Scrolling Methods

### scrollToRow(rowIndex)

Scroll to a specific row.

```tsx
api.scrollToRow(100);
```

### scrollToColumn(colId)

Scroll to a specific column.

```tsx
api.scrollToColumn('email');
```

### scrollToCell(rowIndex, colId)

Scroll to a specific cell.

```tsx
api.scrollToCell(50, 'email');
```

---

## Editing Methods

### startEditing(rowIndex, colId)

Start editing a cell.

```tsx
api.startEditing(0, 'name');
```

### stopEditing(cancel?)

Stop editing.

```tsx
// Save changes
api.stopEditing();

// Cancel changes
api.stopEditing(true);
```

### undo()

Undo the last edit.

```tsx
if (api.canUndo()) {
  api.undo();
}
```

### redo()

Redo the last undone edit.

```tsx
if (api.canRedo()) {
  api.redo();
}
```

### canUndo()

Check if undo is available.

```tsx
const undoButton = <button disabled={!api.canUndo()} onClick={() => api.undo()}>Undo</button>;
```

### canRedo()

Check if redo is available.

```tsx
const redoButton = <button disabled={!api.canRedo()} onClick={() => api.redo()}>Redo</button>;
```

---

## Export Methods

### exportToCsv(params?)

Export data to CSV.

```tsx
api.exportToCsv({
  fileName: 'my-export',
  columnKeys: ['name', 'email'],
  onlySelected: true,
});
```

### exportToExcel(params?)

Export data to Excel (.xlsx).

```tsx
await api.exportToExcel({
  fileName: 'my-export',
  sheetName: 'Data',
});
```

### exportToJson(params?)

Export data to JSON.

```tsx
api.exportToJson({
  fileName: 'my-export',
  pretty: true,
});
```

### exportToPdf(params?)

Export data to PDF.

```tsx
await api.exportToPdf({
  fileName: 'my-export',
  orientation: 'landscape',
  pageSize: 'A4',
});
```

---

## State Methods

### getState()

Get the complete grid state.

```tsx
const state = api.getState();
console.log('Sort model:', state.sortModel);
console.log('Filter model:', state.filterModel);
console.log('Page:', state.page);
console.log('Selection:', state.selection);
```

### subscribe(listener)

Subscribe to state changes.

```tsx
const unsubscribe = api.subscribe((state) => {
  console.log('State changed:', state);
});

// Later, to unsubscribe
unsubscribe();
```

---

## Complete Example

```tsx
import { useRef, useCallback } from 'react';
import { WarperGrid, type WarperGridRef } from '@itsmeadarsh/warper-grid';

interface Product {
  id: number;
  name: string;
  price: number;
  stock: number;
}

function ProductGrid() {
  const gridRef = useRef<WarperGridRef<Product>>(null);

  const handleExport = useCallback(() => {
    gridRef.current?.api.exportToCsv({ fileName: 'products' });
  }, []);

  const handleSelectLowStock = useCallback(() => {
    const api = gridRef.current?.api;
    if (!api) return;

    api.deselectAll();
    
    const data = api.getData();
    data.forEach((item, index) => {
      if (item.stock < 10) {
        api.selectRow(index);
      }
    });
  }, []);

  const handleClearFilters = useCallback(() => {
    const api = gridRef.current?.api;
    if (!api) return;

    api.setFilterModel([]);
    api.setQuickFilter('');
    api.setSortModel([]);
    api.firstPage();
  }, []);

  return (
    <div>
      <div className="toolbar">
        <button onClick={handleExport}>Export CSV</button>
        <button onClick={handleSelectLowStock}>Select Low Stock</button>
        <button onClick={handleClearFilters}>Clear All</button>
      </div>
      
      <WarperGrid
        ref={gridRef}
        data={products}
        columns={columns}
        height={500}
      />
    </div>
  );
}
```
