# WarperGrid

<p align="center">
  <strong>The Ultimate React Data Grid</strong>
</p>

<p align="center">
  High-performance, full-featured React data grid built on the <a href="https://github.com/warper-org/warper">Warper</a> virtualization library.
</p>

<p align="center">
  10M+ rows • 120+ FPS • Modular Plugins • shadcn/ui Components
</p>

---

## ✨ Features

- **Ultra-Fast Rendering**: Powered by Warper's Rust/WASM virtualization engine
- **10,000,000+ Rows**: Handle massive datasets effortlessly
- **120+ FPS**: Smooth scrolling even with millions of items
- **O(1) Fixed-Height Lookups**: Instant row access
- **O(log N) Variable-Height**: Efficient Fenwick tree algorithms
- **Plugin Architecture**: Attach only the features you need
- **shadcn/ui Design**: Beautiful, accessible components out of the box

## 📦 Installation

```bash
bun add warper-grid @itsmeadarsh/warper
```

## 🚀 Quick Start

```tsx
import { useRef } from 'react';
import { WarperGrid, type WarperGridRef, type ColumnDef } from 'warper-grid';

interface Person {
  id: number;
  name: string;
  email: string;
  age: number;
}

const data: Person[] = [
  { id: 1, name: 'John Doe', email: 'john@example.com', age: 32 },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com', age: 28 },
  // ... more data
];

const columns: ColumnDef<Person>[] = [
  { id: 'id', field: 'id', headerName: 'ID', width: 80 },
  { id: 'name', field: 'name', headerName: 'Name', width: 150 },
  { id: 'email', field: 'email', headerName: 'Email', width: 200 },
  { id: 'age', field: 'age', headerName: 'Age', width: 80 },
];

function App() {
  const gridRef = useRef<WarperGridRef<Person>>(null);

  // Attach plugins after grid is ready
  const handleGridReady = () => {
    gridRef.current?.attach(['sorting', 'filtering', 'pagination']);
  };

  return (
    <WarperGrid
      ref={gridRef}
      data={data}
      columns={columns}
      height={600}
      onGridReady={handleGridReady}
    />
  );
}
```

## 🔌 Plugin System

WarperGrid uses a modular plugin architecture. Attach only the features you need:

```tsx
// Attach specific plugins
gridRef.current?.attach(['sorting', 'filtering', 'pagination']);

// Or load all plugins
gridRef.current?.attach(['*']);

// With configuration
gridRef.current?.attach(['pagination'], {
  pagination: {
    pageSize: 50,
    pageSizes: [25, 50, 100],
  },
});
```

### Available Plugins

| Plugin | Description |
|--------|-------------|
| `sorting` | Multi-column sorting with customizable comparators |
| `filtering` | Column filters (text, number, date, select) + quick filter |
| `pagination` | Client-side pagination with configurable page sizes |
| `selection` | Row and cell selection (single/multiple modes) |
| `columnResizing` | Drag-to-resize column widths |
| `export` | Export to CSV with selected rows support |

## 📊 Column Definition

```tsx
const columns: ColumnDef<Person>[] = [
  {
    id: 'name',
    field: 'name',
    headerName: 'Full Name',
    width: 200,
    minWidth: 100,
    maxWidth: 400,
    sortable: true,
    filterable: true,
    resizable: true,
    align: 'left',
    
    // Custom value getter
    valueGetter: ({ data }) => `${data.firstName} ${data.lastName}`,
    
    // Custom formatter
    valueFormatter: ({ value }) => value?.toUpperCase(),
    
    // Custom cell renderer
    cellRenderer: ({ value }) => <span className="font-bold">{value}</span>,
    
    // Custom comparator for sorting
    comparator: (a, b) => a.localeCompare(b),
  },
];
```

## 🎨 Theming

WarperGrid uses shadcn/ui components with CSS variables for theming:

```css
:root {
  --primary: oklch(0.696 0.17 162.48);
  --primary-foreground: oklch(0.982 0.018 155.826);
  --background: oklch(1 0 0);
  --foreground: oklch(0.141 0.005 285.823);
  --border: oklch(0.92 0.004 286.32);
  /* ... more variables */
}

.dark {
  --background: oklch(0.141 0.005 285.823);
  --foreground: oklch(0.985 0 0);
  /* ... dark mode variables */
}
```

## 🛠️ Grid API

Access the grid API through the ref:

```tsx
const gridRef = useRef<WarperGridRef<Person>>(null);

// Data operations
gridRef.current?.api.getData();
gridRef.current?.api.setData(newData);
gridRef.current?.api.getDisplayedData();

// Sorting
gridRef.current?.api.setSortModel([{ colId: 'name', sort: 'asc' }]);

// Filtering
gridRef.current?.api.setFilterModel([{ colId: 'age', filterType: 'number', value: 30, operator: 'greaterThan' }]);
gridRef.current?.api.setQuickFilter('search text');

// Selection
gridRef.current?.api.selectAll();
gridRef.current?.api.deselectAll();
gridRef.current?.api.getSelectedRows();

// Pagination
gridRef.current?.api.setPage(2);
gridRef.current?.api.setPageSize(50);
gridRef.current?.api.nextPage();

// Scrolling
gridRef.current?.api.scrollToRow(1000);

// Export
gridRef.current?.api.exportToCsv({ fileName: 'export.csv' });
```

## 📖 Events

```tsx
<WarperGrid
  data={data}
  columns={columns}
  onCellClick={(event) => console.log('Cell:', event.colId, event.value)}
  onRowClick={(event) => console.log('Row:', event.data)}
  onSortChanged={(event) => console.log('Sort:', event.sortModel)}
  onFilterChanged={(event) => console.log('Filter:', event.filterModel)}
  onSelectionChanged={(event) => console.log('Selection:', event.selectedRows)}
  onPageChanged={(event) => console.log('Page:', event.page)}
  onGridReady={(api) => console.log('Grid ready!')}
/>
```

## 🏗️ Development

```bash
# Install dependencies
bun install

# Start dev server
bun dev

# Build
bun run build
```

## 📜 License

MIT © [warper-org](https://github.com/warper-org)

