<div align="center">

# WarperGrid

### The Professional React Data Grid

A powerful, feature-rich data grid for React applications with TypeScript support, modular plugins, and beautiful UI components.

[![npm version](https://img.shields.io/npm/v/@itsmeadarsh/warper-grid.svg?style=flat-square)](https://www.npmjs.com/package/@itsmeadarsh/warper-grid)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg?style=flat-square)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18%2B-61DAFB.svg?style=flat-square)](https://reactjs.org/)
[![License](https://img.shields.io/badge/license-Commercial-orange.svg?style=flat-square)](https://warpergrid.com/license)

[Website](https://warpergrid.com) • [Documentation](#documentation) • [Discord](https://discord.gg/WC5npzPx3s) • [Get a License](https://warpergrid.com)

</div>

---

## 📖 Table of Contents

- [Features](#-features)
- [Quick Start](#-quick-start)
- [Installation](#-installation)
- [Basic Usage](#-basic-usage)
- [Column Definitions](#-column-definitions)
- [Plugin System](#-plugin-system)
- [API Reference](#-api-reference)
- [Events](#-events)
- [Theming & Styling](#-theming--styling)
- [Licensing](#-licensing)
- [Support](#-support)

---

## ✨ Features

### Core Features
- **🔄 Sorting** — Single and multi-column sorting with custom comparators
- **🔍 Filtering** — Text, number, date, boolean, and select filters with quick filter search
- **📄 Pagination** — Flexible page sizes with "Show All" option
- **☑️ Selection** — Row and cell selection with keyboard support
- **✏️ Cell Editing** — Inline editing with undo/redo support
- **📋 Clipboard** — Copy, cut, and paste with Ctrl+C/X/V

### Column Features
- **↔️ Column Resizing** — Drag to resize with min/max constraints
- **🔀 Column Dragging** — Reorder columns via drag and drop
- **📌 Column Pinning** — Pin columns to left or right
- **📊 Column Menu** — Built-in column menu with sorting, filtering, visibility controls

### Advanced Features
- **📤 Export** — Export to CSV, Excel, JSON, and PDF
- **🗃️ Master-Detail** — Expandable rows with nested grids
- **🔍 SQL Query Panel** — Query your data with SQL syntax
- **📊 Row Grouping** — Group data by columns (via SQL GROUP BY)
- **📈 Status Bar** — Row count, selection info, and grid statistics
- **🎯 Context Menu** — Right-click actions on cells and rows

### Developer Experience
- **📦 TypeScript First** — Full type safety with comprehensive type definitions
- **🔌 Plugin Architecture** — Enable only the features you need
- **🎨 Tailwind CSS** — Beautiful, customizable styling
- **⚛️ React 18+** — Modern React with hooks and concurrent features

---

## 🚀 Quick Start

```tsx
import { WarperGrid } from '@itsmeadarsh/warper-grid';
import '@itsmeadarsh/warper-grid/styles';

const data = [
  { id: 1, name: 'John Doe', email: 'john@example.com', age: 28 },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com', age: 34 },
  { id: 3, name: 'Bob Johnson', email: 'bob@example.com', age: 45 },
];

const columns = [
  { id: 'id', field: 'id', headerName: 'ID', width: 80 },
  { id: 'name', field: 'name', headerName: 'Name', flex: 1 },
  { id: 'email', field: 'email', headerName: 'Email', flex: 1 },
  { id: 'age', field: 'age', headerName: 'Age', width: 100 },
];

function App() {
  return (
    <WarperGrid
      data={data}
      columns={columns}
      height={400}
    />
  );
}
```

---

## 📦 Installation

```bash
# Using npm
npm install @itsmeadarsh/warper-grid

# Using yarn
yarn add @itsmeadarsh/warper-grid

# Using pnpm
pnpm add @itsmeadarsh/warper-grid

# Using bun
bun add @itsmeadarsh/warper-grid
```

### Peer Dependencies

WarperGrid requires React 18 or later:

```bash
npm install react react-dom
```

---

## 📖 Basic Usage

### Import Styles

Always import the styles at the top of your app:

```tsx
import '@itsmeadarsh/warper-grid/styles';
```

### Simple Grid

```tsx
import { WarperGrid } from '@itsmeadarsh/warper-grid';

function MyGrid() {
  const data = [
    { id: 1, name: 'Product A', price: 99.99, stock: 150 },
    { id: 2, name: 'Product B', price: 149.99, stock: 75 },
  ];

  const columns = [
    { id: 'id', field: 'id', headerName: 'ID' },
    { id: 'name', field: 'name', headerName: 'Product Name' },
    { id: 'price', field: 'price', headerName: 'Price' },
    { id: 'stock', field: 'stock', headerName: 'In Stock' },
  ];

  return <WarperGrid data={data} columns={columns} height={400} />;
}
```

### With Sorting and Filtering

```tsx
<WarperGrid
  data={data}
  columns={columns.map(col => ({
    ...col,
    sortable: true,
    filterable: true,
  }))}
  height={400}
/>
```

### With Pagination

```tsx
<WarperGrid
  data={data}
  columns={columns}
  height={400}
  pluginConfig={{
    pagination: {
      pageSize: 25,
      pageSizes: [10, 25, 50, 100],
    },
  }}
/>
```

---

## 📋 Column Definitions

Columns are defined using the `ColumnDef` interface:

```tsx
interface ColumnDef<TData> {
  // Required
  id: string;                    // Unique column identifier
  
  // Basic
  field?: string;                // Field key in row data
  headerName?: string;           // Display name in header
  
  // Sizing
  width?: number;                // Fixed width in pixels
  minWidth?: number;             // Minimum width
  maxWidth?: number;             // Maximum width
  flex?: number;                 // Flex grow factor
  
  // Alignment
  align?: 'left' | 'center' | 'right';
  headerAlign?: 'left' | 'center' | 'right';
  
  // Features
  sortable?: boolean;            // Enable sorting
  filterable?: boolean;          // Enable filtering
  filterType?: 'text' | 'number' | 'date' | 'boolean' | 'select';
  resizable?: boolean;           // Enable resizing
  editable?: boolean;            // Enable editing
  pinned?: 'left' | 'right' | false;
  hide?: boolean;                // Hide column
  
  // Custom Rendering
  valueGetter?: (params) => CellValue;
  valueFormatter?: (params) => string;
  cellRenderer?: (params) => ReactNode;
  headerRenderer?: (params) => ReactNode;
  cellEditor?: (params) => ReactNode;
  
  // Styling
  cellClass?: string | ((params) => string);
  headerClass?: string | ((params) => string);
  cellStyle?: CSSProperties | ((params) => CSSProperties);
  
  // Sorting
  comparator?: (a, b, rowA, rowB) => number;
  
  // Filtering
  filterFn?: (value, filterValue, row) => boolean;
}
```

### Column Examples

#### Value Formatter

```tsx
{
  id: 'price',
  field: 'price',
  headerName: 'Price',
  valueFormatter: ({ value }) => `$${value.toFixed(2)}`,
}
```

#### Custom Cell Renderer

```tsx
{
  id: 'status',
  field: 'status',
  headerName: 'Status',
  cellRenderer: ({ value }) => (
    <span className={`badge badge-${value}`}>
      {value}
    </span>
  ),
}
```

#### Editable Column

```tsx
{
  id: 'quantity',
  field: 'quantity',
  headerName: 'Qty',
  editable: true,
  filterType: 'number',
}
```

#### Computed Column

```tsx
{
  id: 'total',
  headerName: 'Total',
  valueGetter: ({ data }) => data.price * data.quantity,
  valueFormatter: ({ value }) => `$${value.toFixed(2)}`,
}
```

---

## 🔌 Plugin System

WarperGrid uses a modular plugin system. Enable only the features you need:

### Available Plugins

| Plugin | Description |
|--------|-------------|
| `sorting` | Column sorting with multi-sort support |
| `filtering` | Column filters and quick search |
| `pagination` | Page navigation and page size selection |
| `selection` | Row and cell selection |
| `columnResizing` | Drag to resize columns |
| `columnDragging` | Drag to reorder columns |
| `columnMenu` | Column header menu |
| `cellEditing` | Inline cell editing with undo/redo |
| `cellSelection` | Range selection for cells |
| `clipboard` | Copy, cut, paste operations |
| `contextMenu` | Right-click context menu |
| `export` | Export to CSV, Excel, JSON, PDF |
| `masterDetail` | Expandable detail rows |
| `statusBar` | Grid statistics bar |
| `sqlQuery` | SQL query panel |
| `rowGrouping` | Group rows by columns |

### Plugin Configuration

```tsx
<WarperGrid
  data={data}
  columns={columns}
  pluginConfig={{
    sorting: {
      multiSort: true,
    },
    filtering: {
      debounce: 300,
      quickFilter: true,
    },
    pagination: {
      pageSize: 50,
      pageSizes: [25, 50, 100, 250],
    },
    selection: {
      mode: 'multiple',
      checkboxSelection: true,
    },
    cellEditing: {
      editTrigger: 'doubleClick',
      undoRedo: true,
    },
    export: {
      fileName: 'my-data',
    },
  }}
/>
```

---

## 📚 API Reference

### Grid Props

```tsx
interface WarperGridProps<TData> {
  // Required
  data: TData[];                 // Row data
  columns: ColumnDef<TData>[];   // Column definitions
  
  // Sizing
  height?: number | string;      // Grid height
  width?: number | string;       // Grid width
  rowHeight?: number;            // Row height (default: 40)
  headerHeight?: number;         // Header height (default: 44)
  
  // Virtualization
  overscan?: number;             // Extra rows to render
  
  // Appearance
  striped?: boolean;             // Alternating row colors
  bordered?: boolean;            // Show cell borders
  compact?: boolean;             // Compact row height
  className?: string;            // Custom CSS class
  style?: CSSProperties;         // Inline styles
  
  // State
  loading?: boolean;             // Show loading state
  emptyMessage?: string;         // Empty state text
  loadingComponent?: ReactNode;  // Custom loading UI
  emptyComponent?: ReactNode;    // Custom empty UI
  
  // Row identification
  getRowId?: (data, index) => string | number;
  
  // Plugin configuration
  pluginConfig?: PluginConfig;
  
  // Event handlers (see Events section)
  onCellClick?: (event) => void;
  onCellDoubleClick?: (event) => void;
  onCellValueChanged?: (event) => void;
  onRowClick?: (event) => void;
  onSelectionChanged?: (event) => void;
  onSortChanged?: (event) => void;
  onFilterChanged?: (event) => void;
  onColumnResized?: (event) => void;
  onPageChanged?: (event) => void;
  onGridReady?: (api) => void;
}
```

### Grid API

Access the Grid API via `onGridReady` or a ref:

```tsx
function MyGrid() {
  const gridRef = useRef<WarperGridRef>(null);

  const handleExport = () => {
    gridRef.current?.api.exportToCsv({ fileName: 'export' });
  };

  return (
    <>
      <button onClick={handleExport}>Export CSV</button>
      <WarperGrid ref={gridRef} data={data} columns={columns} />
    </>
  );
}
```

#### API Methods

```tsx
interface GridApi<TData> {
  // Data
  getData(): TData[];
  setData(data: TData[]): void;
  getDisplayedData(): TData[];
  getRowCount(): number;
  refreshCells(params?): void;
  
  // Columns
  getColumns(): ColumnDef<TData>[];
  getColumn(colId: string): ColumnDef<TData> | undefined;
  setColumnDefs(columns: ColumnDef<TData>[]): void;
  setColumnWidth(colId: string, width: number): void;
  setColumnVisible(colId: string, visible: boolean): void;
  setColumnPinned(colId: string, pinned: 'left' | 'right' | false): void;
  autoSizeColumn(colId: string): void;
  autoSizeAllColumns(): void;
  moveColumn(fromIdx: number, toIdx: number): void;
  
  // Sorting
  getSortModel(): SortModel[];
  setSortModel(model: SortModel[]): void;
  
  // Filtering
  getFilterModel(): FilterModel[];
  setFilterModel(model: FilterModel[]): void;
  setQuickFilter(text: string): void;
  
  // Selection
  getSelectedRows(): TData[];
  getSelectedRowIndices(): number[];
  selectRow(index: number, clearOthers?: boolean): void;
  deselectRow(index: number): void;
  selectAll(): void;
  deselectAll(): void;
  
  // Pagination
  getPage(): number;
  setPage(page: number): void;
  getPageSize(): number;
  setPageSize(size: number): void;
  getTotalPages(): number;
  nextPage(): void;
  previousPage(): void;
  firstPage(): void;
  lastPage(): void;
  
  // Scrolling
  scrollToRow(index: number): void;
  scrollToColumn(colId: string): void;
  scrollToCell(rowIndex: number, colId: string): void;
  
  // Editing
  startEditing(rowIndex: number, colId: string): void;
  stopEditing(cancel?: boolean): void;
  undo(): void;
  redo(): void;
  canUndo(): boolean;
  canRedo(): boolean;
  
  // Export
  exportToCsv(params?: ExportParams): void;
  exportToExcel(params?: ExportParams): Promise<void>;
  exportToJson(params?: ExportParams): void;
  exportToPdf(params?: ExportParams): Promise<void>;
  
  // State
  getState(): GridState<TData>;
  subscribe(listener: (state) => void): () => void;
}
```

---

## 📡 Events

### Event Handlers

```tsx
<WarperGrid
  data={data}
  columns={columns}
  
  onCellClick={(event) => {
    console.log('Cell clicked:', event.rowIndex, event.colId, event.value);
  }}
  
  onCellDoubleClick={(event) => {
    console.log('Cell double-clicked:', event.colId);
  }}
  
  onCellValueChanged={(event) => {
    console.log('Value changed:', event.oldValue, '->', event.newValue);
  }}
  
  onRowClick={(event) => {
    console.log('Row clicked:', event.data);
  }}
  
  onSelectionChanged={(event) => {
    console.log('Selected rows:', event.selectedRows.length);
  }}
  
  onSortChanged={(event) => {
    console.log('Sort changed:', event.sortModel);
  }}
  
  onFilterChanged={(event) => {
    console.log('Filter changed:', event.filterModel);
  }}
  
  onColumnResized={(event) => {
    console.log('Column resized:', event.colId, event.width);
  }}
  
  onPageChanged={(event) => {
    console.log('Page changed:', event.page, event.pageSize);
  }}
  
  onGridReady={(api) => {
    console.log('Grid ready, row count:', api.getRowCount());
  }}
/>
```

### Event Types

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

interface CellValueChangedEvent<TData> {
  type: 'cellValueChanged';
  rowIndex: number;
  colId: string;
  oldValue: CellValue;
  newValue: CellValue;
  data: TData;
  api: GridApi<TData>;
}

interface SelectionChangedEvent<TData> {
  type: 'selectionChanged';
  selectedRows: TData[];
  selectedIndices: number[];
  api: GridApi<TData>;
}

interface SortChangedEvent<TData> {
  type: 'sortChanged';
  sortModel: SortModel[];
  api: GridApi<TData>;
}

interface FilterChangedEvent<TData> {
  type: 'filterChanged';
  filterModel: FilterModel[];
  api: GridApi<TData>;
}
```

---

## 🎨 Theming & Styling

### CSS Variables

Customize the grid appearance with CSS variables:

```css
.warper-grid {
  --wg-background: #ffffff;
  --wg-border-color: #e5e7eb;
  --wg-header-bg: #f9fafb;
  --wg-header-text: #111827;
  --wg-cell-text: #374151;
  --wg-row-hover: #f3f4f6;
  --wg-row-selected: #dbeafe;
  --wg-cell-selected: #bfdbfe;
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
  --wg-cell-selected: #1e40af;
}
```

### Custom Cell Styles

```tsx
{
  id: 'price',
  field: 'price',
  headerName: 'Price',
  cellStyle: ({ value }) => ({
    color: value > 100 ? 'green' : 'red',
    fontWeight: 'bold',
  }),
}
```

### Row Striping

```tsx
<WarperGrid
  data={data}
  columns={columns}
  striped
/>
```


## 📄 License

WarperGrid is proprietary software. See [LICENSE](https://warpergrid.com/license) for terms.

Copyright © 2024-2026 WarperGrid. All rights reserved.