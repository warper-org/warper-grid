# WarperGrid

A professional, feature-rich React data grid with TypeScript support, modular plugins, and beautiful UI.

## Features

**Core**
- Sorting — Single and multi-column with custom comparators
- Filtering — Text, number, date, and select filters
- Pagination — Flexible page sizes with configurable options
- Selection — Row and cell selection with keyboard support
- Cell Editing — Inline editing with validation
- Clipboard — Copy, cut, paste with Ctrl+C/X/V

**Columns**
- Resizing — Drag to resize with min/max constraints
- Dragging — Reorder columns via drag and drop
- Pinning — Pin columns to left or right
- Menu — Sorting, filtering, and visibility controls

**Advanced**
- Export — CSV, Excel, JSON, and PDF
- Master-Detail — Expandable rows with nested content
- SQL Query — Query data with SQL syntax
- Row Grouping — Group by columns with aggregation
- Status Bar — Row count and selection info
- Context Menu — Right-click actions

## Installation

```bash
bun add @itsmeadarsh/warper-grid

# or npm
npm install @itsmeadarsh/warper-grid
```

Requires React 18+.

## Quick Start

```tsx
import { WarperGrid } from '@itsmeadarsh/warper-grid';
import '@itsmeadarsh/warper-grid/styles';

const data = [
  { id: 1, name: 'John Doe', email: 'john@example.com', age: 28 },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com', age: 34 },
];

const columns = [
  { id: 'id', field: 'id', headerName: 'ID', width: 80 },
  { id: 'name', field: 'name', headerName: 'Name', flex: 1 },
  { id: 'email', field: 'email', headerName: 'Email', flex: 1 },
  { id: 'age', field: 'age', headerName: 'Age', width: 100 },
];

function App() {
  return <WarperGrid data={data} columns={columns} height={400} />;
}
```

## Column Definitions

```tsx
const columns = [
  {
    id: 'name',
    field: 'name',
    headerName: 'Name',
    width: 200,
    sortable: true,
    filterable: true,
  },
  {
    id: 'price',
    field: 'price',
    headerName: 'Price',
    valueFormatter: ({ value }) => `$${value.toFixed(2)}`,
  },
  {
    id: 'status',
    field: 'status',
    headerName: 'Status',
    cellRenderer: ({ value }) => (
      <span className={`badge badge-${value}`}>{value}</span>
    ),
  },
  {
    id: 'total',
    headerName: 'Total',
    valueGetter: ({ data }) => data.price * data.quantity,
  },
];
```

### Column Options

| Property | Type | Description |
|----------|------|-------------|
| `id` | `string` | Unique column identifier (required) |
| `field` | `string` | Data field key |
| `headerName` | `string` | Display name |
| `width` | `number` | Fixed width in pixels |
| `flex` | `number` | Flex grow factor |
| `sortable` | `boolean` | Enable sorting |
| `filterable` | `boolean` | Enable filtering |
| `editable` | `boolean` | Enable editing |
| `pinned` | `'left' \| 'right'` | Pin column |
| `hide` | `boolean` | Hide column |
| `valueGetter` | `function` | Compute cell value |
| `valueFormatter` | `function` | Format display value |
| `cellRenderer` | `function` | Custom cell component |

## Plugins

Enable features via the plugin system:

```tsx
<WarperGrid
  data={data}
  columns={columns}
  pluginConfig={{
    sorting: { multiSort: true },
    filtering: { quickFilter: true },
    pagination: { pageSize: 50 },
    selection: { mode: 'multiple' },
    export: { fileName: 'my-data' },
  }}
/>
```

### Available Plugins

| Plugin | Description |
|--------|-------------|
| `sorting` | Column sorting |
| `filtering` | Column filters |
| `pagination` | Page navigation |
| `selection` | Row/cell selection |
| `columnResizing` | Drag to resize |
| `columnDragging` | Drag to reorder |
| `columnMenu` | Header menu |
| `cellEditing` | Inline editing |
| `clipboard` | Copy/paste |
| `contextMenu` | Right-click menu |
| `export` | CSV/Excel/JSON/PDF |
| `masterDetail` | Expandable rows |
| `statusBar` | Grid statistics |
| `sqlQuery` | SQL query panel |

## Grid API

Access the API via ref:

```tsx
const gridRef = useRef<WarperGridRef>(null);

// Get data
gridRef.current?.api.getData();
gridRef.current?.api.getDisplayedData();

// Selection
gridRef.current?.api.getSelectedRows();
gridRef.current?.api.selectAll();
gridRef.current?.api.deselectAll();

// Sorting & Filtering
gridRef.current?.api.setSortModel([{ colId: 'name', sort: 'asc' }]);
gridRef.current?.api.setQuickFilter('search term');

// Pagination
gridRef.current?.api.setPage(2);
gridRef.current?.api.setPageSize(50);

// Export
gridRef.current?.api.exportToCsv({ fileName: 'export' });
gridRef.current?.api.exportToExcel({ fileName: 'export' });
```

## Events

```tsx
<WarperGrid
  data={data}
  columns={columns}
  onCellClick={({ rowIndex, colId, value }) => {
    console.log('Clicked:', rowIndex, colId, value);
  }}
  onCellValueChanged={({ oldValue, newValue }) => {
    console.log('Changed:', oldValue, '->', newValue);
  }}
  onSelectionChanged={({ selectedRows }) => {
    console.log('Selected:', selectedRows.length);
  }}
  onSortChanged={({ sortModel }) => {
    console.log('Sort:', sortModel);
  }}
  onFilterChanged={({ filterModel }) => {
    console.log('Filter:', filterModel);
  }}
  onGridReady={(api) => {
    console.log('Ready, rows:', api.getRowCount());
  }}
/>
```

## Theming

Customize with CSS variables:

```css
.warper-grid {
  --wg-background: #ffffff;
  --wg-border-color: #e5e7eb;
  --wg-header-bg: #f9fafb;
  --wg-header-text: #111827;
  --wg-cell-text: #374151;
  --wg-row-hover: #f3f4f6;
  --wg-row-selected: #dbeafe;
  --wg-primary: #3b82f6;
}

/* Dark mode */
.dark .warper-grid {
  --wg-background: #1f2937;
  --wg-border-color: #374151;
  --wg-header-bg: #111827;
  --wg-header-text: #f9fafb;
  --wg-cell-text: #d1d5db;
  --wg-row-hover: #374151;
  --wg-row-selected: #1e3a5f;
}
```

## Grid Props

| Prop | Type | Description |
|------|------|-------------|
| `data` | `T[]` | Row data (required) |
| `columns` | `ColumnDef[]` | Column definitions (required) |
| `height` | `number \| string` | Grid height |
| `rowHeight` | `number` | Row height (default: 40) |
| `headerHeight` | `number` | Header height (default: 44) |
| `striped` | `boolean` | Alternating row colors |
| `bordered` | `boolean` | Show cell borders |
| `loading` | `boolean` | Loading state |
| `emptyMessage` | `string` | Empty state text |
| `pluginConfig` | `object` | Plugin configuration |

## License

WarperGrid is proprietary software.

Copyright © 2024-2026 WarperGrid. All rights reserved.
