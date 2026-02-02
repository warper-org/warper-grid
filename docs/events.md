# Events

WarperGrid emits events for user interactions and state changes. Handle these via props on the `WarperGrid` component.

## Event Handler Props

### onGridReady

Fired when the grid is initialized and the API is available.

```tsx
<WarperGrid
  data={data}
  columns={columns}
  onGridReady={(api) => {
    console.log('Grid ready!');
    console.log('Row count:', api.getRowCount());
    
    // Store API reference for later use
    setGridApi(api);
  }}
/>
```

---

### onCellClick

Fired when a cell is clicked.

```tsx
<WarperGrid
  data={data}
  columns={columns}
  onCellClick={(event) => {
    console.log('Cell clicked:');
    console.log('  Row:', event.rowIndex);
    console.log('  Column:', event.colId);
    console.log('  Value:', event.value);
    console.log('  Row data:', event.data);
    
    // Access the native mouse event
    if (event.event.ctrlKey) {
      console.log('Ctrl was held');
    }
  }}
/>
```

**Event Type:**
```tsx
interface CellClickEvent<TData> {
  type: 'cellClick';
  rowIndex: number;
  colId: string;
  value: CellValue;
  data: TData;
  event: React.MouseEvent;
  api: GridApi<TData>;
}
```

---

### onCellDoubleClick

Fired when a cell is double-clicked.

```tsx
<WarperGrid
  data={data}
  columns={columns}
  onCellDoubleClick={(event) => {
    console.log('Double-clicked:', event.colId, event.value);
    
    // Start editing if column is editable
    if (columns.find(c => c.id === event.colId)?.editable) {
      event.api.startEditing(event.rowIndex, event.colId);
    }
  }}
/>
```

---

### onCellValueChanged

Fired when a cell value is changed (after editing).

```tsx
<WarperGrid
  data={data}
  columns={columns}
  onCellValueChanged={(event) => {
    console.log('Value changed:');
    console.log('  Row:', event.rowIndex);
    console.log('  Column:', event.colId);
    console.log('  Old value:', event.oldValue);
    console.log('  New value:', event.newValue);
    
    // Update your data source
    updateData(event.data.id, event.colId, event.newValue);
  }}
/>
```

**Event Type:**
```tsx
interface CellValueChangedEvent<TData> {
  type: 'cellValueChanged';
  rowIndex: number;
  colId: string;
  oldValue: CellValue;
  newValue: CellValue;
  data: TData;
  api: GridApi<TData>;
}
```

---

### onRowClick

Fired when a row is clicked (anywhere in the row).

```tsx
<WarperGrid
  data={data}
  columns={columns}
  onRowClick={(event) => {
    console.log('Row clicked:', event.rowIndex);
    console.log('Row data:', event.data);
    
    // Navigate to detail view
    navigate(`/products/${event.data.id}`);
  }}
/>
```

**Event Type:**
```tsx
interface RowClickEvent<TData> {
  type: 'rowClick';
  rowIndex: number;
  data: TData;
  event: React.MouseEvent;
  api: GridApi<TData>;
}
```

---

### onSelectionChanged

Fired when row selection changes.

```tsx
<WarperGrid
  data={data}
  columns={columns}
  pluginConfig={{
    selection: { mode: 'multiple', checkboxSelection: true }
  }}
  onSelectionChanged={(event) => {
    console.log('Selection changed:');
    console.log('  Selected count:', event.selectedRows.length);
    console.log('  Selected rows:', event.selectedRows);
    console.log('  Selected indices:', event.selectedIndices);
    
    // Update parent state
    setSelectedProducts(event.selectedRows);
  }}
/>
```

**Event Type:**
```tsx
interface SelectionChangedEvent<TData> {
  type: 'selectionChanged';
  selectedRows: TData[];
  selectedIndices: number[];
  api: GridApi<TData>;
}
```

---

### onSortChanged

Fired when sorting changes.

```tsx
<WarperGrid
  data={data}
  columns={columns}
  onSortChanged={(event) => {
    console.log('Sort changed:', event.sortModel);
    // [{ colId: 'name', sort: 'asc' }]
    
    // For server-side sorting
    if (serverSide) {
      fetchData({ sort: event.sortModel });
    }
  }}
/>
```

**Event Type:**
```tsx
interface SortChangedEvent<TData> {
  type: 'sortChanged';
  sortModel: SortModel[];
  api: GridApi<TData>;
}

interface SortModel {
  colId: string;
  sort: 'asc' | 'desc' | null;
}
```

---

### onFilterChanged

Fired when filters change.

```tsx
<WarperGrid
  data={data}
  columns={columns}
  onFilterChanged={(event) => {
    console.log('Filter changed:', event.filterModel);
    
    // For server-side filtering
    if (serverSide) {
      fetchData({ filter: event.filterModel });
    }
  }}
/>
```

**Event Type:**
```tsx
interface FilterChangedEvent<TData> {
  type: 'filterChanged';
  filterModel: FilterModel[];
  api: GridApi<TData>;
}

interface FilterModel {
  colId: string;
  filterType: 'text' | 'number' | 'date' | 'boolean' | 'select';
  value: unknown;
  operator?: string;
}
```

---

### onColumnResized

Fired when a column is resized.

```tsx
<WarperGrid
  data={data}
  columns={columns}
  onColumnResized={(event) => {
    console.log('Column resized:');
    console.log('  Column:', event.colId);
    console.log('  New width:', event.width);
    
    // Persist column widths
    saveColumnWidth(event.colId, event.width);
  }}
/>
```

**Event Type:**
```tsx
interface ColumnResizedEvent<TData> {
  type: 'columnResized';
  colId: string;
  width: number;
  api: GridApi<TData>;
}
```

---

### onPageChanged

Fired when pagination changes (page or page size).

```tsx
<WarperGrid
  data={data}
  columns={columns}
  onPageChanged={(event) => {
    console.log('Page changed:');
    console.log('  Page:', event.page);
    console.log('  Page size:', event.pageSize);
    
    // For server-side pagination
    if (serverSide) {
      fetchData({ page: event.page, pageSize: event.pageSize });
    }
  }}
/>
```

**Event Type:**
```tsx
interface PageChangedEvent<TData> {
  type: 'pageChanged';
  page: number;
  pageSize: number;
  api: GridApi<TData>;
}
```

---

## Complete Example

```tsx
import { useState, useCallback } from 'react';
import { WarperGrid, type GridApi } from '@itsmeadarsh/warper-grid';

interface Product {
  id: number;
  name: string;
  price: number;
  stock: number;
}

function ProductGrid() {
  const [gridApi, setGridApi] = useState<GridApi<Product> | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);
  const [lastAction, setLastAction] = useState<string>('');

  const handleGridReady = useCallback((api: GridApi<Product>) => {
    setGridApi(api);
    setLastAction(`Grid ready with ${api.getRowCount()} rows`);
  }, []);

  const handleCellClick = useCallback((event) => {
    setLastAction(`Clicked cell: ${event.colId} = ${event.value}`);
  }, []);

  const handleCellValueChanged = useCallback((event) => {
    setLastAction(`Changed ${event.colId}: ${event.oldValue} → ${event.newValue}`);
    
    // Update backend
    updateProduct(event.data.id, { [event.colId]: event.newValue });
  }, []);

  const handleSelectionChanged = useCallback((event) => {
    setSelectedProducts(event.selectedRows);
    setLastAction(`Selected ${event.selectedRows.length} products`);
  }, []);

  const handleSortChanged = useCallback((event) => {
    const sortDesc = event.sortModel
      .map(s => `${s.colId} ${s.sort}`)
      .join(', ') || 'none';
    setLastAction(`Sorted by: ${sortDesc}`);
  }, []);

  const handleFilterChanged = useCallback((event) => {
    setLastAction(`Applied ${event.filterModel.length} filters`);
  }, []);

  const handlePageChanged = useCallback((event) => {
    setLastAction(`Page ${event.page + 1}, showing ${event.pageSize} rows`);
  }, []);

  return (
    <div>
      {/* Status bar */}
      <div className="mb-4 p-2 bg-gray-100 rounded">
        <span className="text-sm text-gray-600">Last action: {lastAction}</span>
      </div>

      {/* Selection info */}
      {selectedProducts.length > 0 && (
        <div className="mb-4 p-2 bg-blue-100 rounded">
          <span className="font-bold">{selectedProducts.length} selected</span>
          <button 
            className="ml-4 text-blue-600"
            onClick={() => gridApi?.deselectAll()}
          >
            Clear selection
          </button>
        </div>
      )}

      {/* Grid */}
      <WarperGrid
        data={products}
        columns={columns}
        height={500}
        pluginConfig={{
          selection: { mode: 'multiple', checkboxSelection: true },
          pagination: { pageSize: 25 },
          cellEditing: { editTrigger: 'doubleClick' },
        }}
        onGridReady={handleGridReady}
        onCellClick={handleCellClick}
        onCellValueChanged={handleCellValueChanged}
        onSelectionChanged={handleSelectionChanged}
        onSortChanged={handleSortChanged}
        onFilterChanged={handleFilterChanged}
        onPageChanged={handlePageChanged}
      />
    </div>
  );
}
```

---

## Server-Side Integration

Use events to implement server-side data operations:

```tsx
function ServerSideGrid() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [params, setParams] = useState({
    page: 0,
    pageSize: 25,
    sortModel: [],
    filterModel: [],
  });

  // Fetch data when params change
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/products', {
          method: 'POST',
          body: JSON.stringify(params),
        });
        const result = await response.json();
        setData(result.data);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [params]);

  return (
    <WarperGrid
      data={data}
      columns={columns}
      loading={loading}
      onSortChanged={(e) => setParams(p => ({ ...p, sortModel: e.sortModel }))}
      onFilterChanged={(e) => setParams(p => ({ ...p, filterModel: e.filterModel }))}
      onPageChanged={(e) => setParams(p => ({ ...p, page: e.page, pageSize: e.pageSize }))}
    />
  );
}
```
