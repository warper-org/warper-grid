import { useState, useEffect } from 'react';
import { 
  Sparkles, 
  ArrowLeft, 
  BookOpen, 
  Rocket, 
  Columns, 
  Puzzle, 
  Settings, 
  Zap, 
  Palette,
  ChevronRight,
  Menu,
  X,
  MessageCircle
} from 'lucide-react';
import { remark } from 'remark';
import remarkHtml from 'remark-html';
import { createHighlighter, type Highlighter } from 'shiki';

// ============================================================================
// Types
// ============================================================================

interface DocSection {
  title: string;
  icon: typeof Rocket;
  content: string;
}

// ============================================================================
// Documentation Content
// ============================================================================

const docs: Record<string, DocSection> = {
  'getting-started': {
    title: 'Getting Started',
    icon: Rocket,
    content: `
# Getting Started

Welcome to WarperGrid! This guide will help you set up your first data grid in under 5 minutes.

## Prerequisites

- **React 18+** — WarperGrid uses modern React features
- **TypeScript 5.0+** — Recommended for best DX (optional)
- **Tailwind CSS 3.4+** — For styling (optional but recommended)

## Installation

\`\`\`bash
# Using bun (recommended)
bun add @itsmeadarsh/warper-grid

# Using npm
npm install @itsmeadarsh/warper-grid

# Using yarn
yarn add @itsmeadarsh/warper-grid

# Using pnpm
pnpm add @itsmeadarsh/warper-grid
\`\`\`

## Basic Setup

### 1. Import the Grid

\`\`\`tsx
import { WarperGrid, type ColumnDef } from '@itsmeadarsh/warper-grid';
import '@itsmeadarsh/warper-grid/styles.css';
\`\`\`

### 2. Define Your Data

\`\`\`tsx
interface User {
  id: number;
  name: string;
  email: string;
  status: 'active' | 'inactive';
}

const data: User[] = [
  { id: 1, name: 'John Doe', email: 'john@example.com', status: 'active' },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com', status: 'active' },
  { id: 3, name: 'Bob Wilson', email: 'bob@example.com', status: 'inactive' },
];
\`\`\`

### 3. Configure Columns

\`\`\`tsx
const columns: ColumnDef<User>[] = [
  { id: 'id', field: 'id', headerName: 'ID', width: 80 },
  { id: 'name', field: 'name', headerName: 'Name', flex: 1 },
  { id: 'email', field: 'email', headerName: 'Email', flex: 1 },
  { id: 'status', field: 'status', headerName: 'Status', width: 120 },
];
\`\`\`

### 4. Render the Grid

\`\`\`tsx
export default function MyGrid() {
  return (
    <WarperGrid
      data={data}
      columns={columns}
      height={400}
    />
  );
}
\`\`\`

## Enabling Features

Use the \`ref\` to enable plugins after the grid is ready:

\`\`\`tsx
import { useRef } from 'react';
import { WarperGrid, type WarperGridRef } from '@itsmeadarsh/warper-grid';

export default function MyGrid() {
  const gridRef = useRef<WarperGridRef<User>>(null);

  const handleGridReady = () => {
    gridRef.current?.attach([
      'sorting',
      'filtering',
      'pagination',
      'selection',
      'columnResizing'
    ]);
  };

  return (
    <WarperGrid
      ref={gridRef}
      data={data}
      columns={columns}
      height={400}
      onGridReady={handleGridReady}
    />
  );
}
\`\`\`

## Complete Example

Here's a full working example with multiple features:

\`\`\`tsx
import { useRef, useState, useEffect } from 'react';
import { 
  WarperGrid, 
  type WarperGridRef, 
  type ColumnDef 
} from '@itsmeadarsh/warper-grid';

interface Product {
  id: number;
  name: string;
  category: string;
  price: number;
  stock: number;
  status: 'active' | 'discontinued';
}

const columns: ColumnDef<Product>[] = [
  { id: 'id', field: 'id', headerName: 'ID', width: 80 },
  { id: 'name', field: 'name', headerName: 'Product Name', flex: 1 },
  { id: 'category', field: 'category', headerName: 'Category', width: 150 },
  { 
    id: 'price', 
    field: 'price', 
    headerName: 'Price',
    width: 120,
    valueFormatter: ({ value }) => \`$\${(value as number).toFixed(2)}\`
  },
  { 
    id: 'stock', 
    field: 'stock', 
    headerName: 'Stock',
    width: 100,
    cellClass: ({ value }) => (value as number) < 10 ? 'text-red-500 font-bold' : ''
  },
  { 
    id: 'status', 
    field: 'status', 
    headerName: 'Status',
    width: 120,
    cellRenderer: ({ value }) => (
      <span className={\`px-2 py-1 rounded-full text-xs \${
        value === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
      }\`}>
        {value}
      </span>
    )
  },
];

export default function ProductGrid() {
  const gridRef = useRef<WarperGridRef<Product>>(null);
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    // Fetch your data
    fetchProducts().then(setProducts);
  }, []);

  const handleGridReady = () => {
    gridRef.current?.attach([
      'sorting',
      'filtering',
      'pagination',
      'selection',
      'columnResizing',
      'export',
      'cellEditing'
    ]);
  };

  const handleExport = () => {
    gridRef.current?.api.exportToExcel({ fileName: 'products.xlsx' });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={handleExport} className="btn btn-primary">
          Export to Excel
        </button>
      </div>
      <WarperGrid
        ref={gridRef}
        data={products}
        columns={columns}
        height={600}
        onGridReady={handleGridReady}
        onCellValueChanged={({ data, column, newValue }) => {
          console.log(\`Updated \${column.field} to \${newValue}\`);
        }}
      />
    </div>
  );
}
\`\`\`

## Next Steps

- **[Column Definitions](#docs/columns)** — Learn all column options
- **[Plugins](#docs/plugins)** — Enable sorting, filtering, export, and more
- **[API Reference](#docs/api)** — Complete Grid API documentation
- **[Theming](#docs/theming)** — Customize the grid's appearance
`
  },
  'columns': {
    title: 'Column Definitions',
    icon: Columns,
    content: `
# Column Definitions

Columns are the core of WarperGrid. Each column definition controls how data is displayed, edited, and interacted with.

## Basic Column

\`\`\`tsx
const columns: ColumnDef<User>[] = [
  {
    id: 'name',           // Required: unique identifier
    field: 'name',        // Field to read from data
    headerName: 'Name',   // Display name in header
  }
];
\`\`\`

## Column Properties

| Property | Type | Description |
|----------|------|-------------|
| \`id\` | \`string\` | **Required.** Unique identifier for the column |
| \`field\` | \`keyof T\` | Data field key to display |
| \`headerName\` | \`string\` | Text shown in column header |
| \`width\` | \`number\` | Fixed width in pixels |
| \`flex\` | \`number\` | Flexible width ratio (like CSS flex) |
| \`minWidth\` | \`number\` | Minimum column width |
| \`maxWidth\` | \`number\` | Maximum column width |
| \`sortable\` | \`boolean\` | Enable sorting (default: true) |
| \`filter\` | \`boolean\` | Enable filtering |
| \`resizable\` | \`boolean\` | Enable column resizing |
| \`editable\` | \`boolean\` | Enable inline editing |
| \`pinned\` | \`'left' \\| 'right'\` | Pin column to side |
| \`hide\` | \`boolean\` | Hide column |
| \`align\` | \`'left' \\| 'center' \\| 'right'\` | Text alignment |

## Column Sizing

### Fixed Width

\`\`\`tsx
{ id: 'id', field: 'id', headerName: 'ID', width: 80 }
\`\`\`

### Flexible Width

Flex columns share available space proportionally:

\`\`\`tsx
{ id: 'name', field: 'name', headerName: 'Name', flex: 1 }
{ id: 'email', field: 'email', headerName: 'Email', flex: 2 } // 2x wider
\`\`\`

### Min/Max Constraints

\`\`\`tsx
{
  id: 'description',
  field: 'description',
  headerName: 'Description',
  flex: 1,
  minWidth: 100,
  maxWidth: 500
}
\`\`\`

## Value Transformation

### valueGetter

Compute or extract values from row data:

\`\`\`tsx
{
  id: 'fullName',
  headerName: 'Full Name',
  valueGetter: ({ data }) => \`\${data.firstName} \${data.lastName}\`
}
\`\`\`

\`\`\`tsx
// Access nested properties
{
  id: 'city',
  headerName: 'City',
  valueGetter: ({ data }) => data.address?.city ?? 'N/A'
}
\`\`\`

### valueFormatter

Format values for display (original value preserved for sorting/filtering):

\`\`\`tsx
{
  id: 'salary',
  field: 'salary',
  headerName: 'Salary',
  valueFormatter: ({ value }) => 
    new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD' 
    }).format(value as number)
}
\`\`\`

\`\`\`tsx
// Date formatting
{
  id: 'createdAt',
  field: 'createdAt',
  headerName: 'Created',
  valueFormatter: ({ value }) => 
    new Date(value as string).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
}
\`\`\`

## Custom Renderers

### cellRenderer

Full control over cell content with React components:

\`\`\`tsx
{
  id: 'status',
  field: 'status',
  headerName: 'Status',
  cellRenderer: ({ value, data }) => {
    const colors: Record<string, string> = {
      active: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      inactive: 'bg-gray-100 text-gray-800',
    };
    return (
      <span className={\`px-2 py-1 rounded-full text-xs font-medium \${colors[value as string]}\`}>
        {value}
      </span>
    );
  }
}
\`\`\`

### Progress Bar Example

\`\`\`tsx
{
  id: 'progress',
  field: 'progress',
  headerName: 'Progress',
  width: 150,
  cellRenderer: ({ value }) => {
    const percent = value as number;
    const color = percent >= 80 ? 'bg-green-500' 
                : percent >= 50 ? 'bg-yellow-500' 
                : 'bg-red-500';
    return (
      <div className="flex items-center gap-2">
        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div className={\`h-full \${color}\`} style={{ width: \`\${percent}%\` }} />
        </div>
        <span className="text-xs text-gray-500 w-8">{percent}%</span>
      </div>
    );
  }
}
\`\`\`

### Avatar Example

\`\`\`tsx
{
  id: 'user',
  headerName: 'User',
  width: 200,
  cellRenderer: ({ data }) => (
    <div className="flex items-center gap-3">
      <img 
        src={data.avatar} 
        alt={data.name}
        className="w-8 h-8 rounded-full object-cover"
      />
      <div>
        <div className="font-medium text-sm">{data.name}</div>
        <div className="text-xs text-gray-500">{data.email}</div>
      </div>
    </div>
  )
}
\`\`\`

### headerRenderer

Custom header content:

\`\`\`tsx
{
  id: 'priority',
  field: 'priority',
  headerRenderer: () => (
    <div className="flex items-center gap-1.5">
      <Flag className="w-4 h-4 text-red-500" />
      <span>Priority</span>
    </div>
  )
}
\`\`\`

## Cell Styling

### Static Class

\`\`\`tsx
{
  id: 'name',
  field: 'name',
  headerName: 'Name',
  cellClass: 'font-bold text-blue-600',
  headerClass: 'bg-blue-50'
}
\`\`\`

### Dynamic Class

\`\`\`tsx
{
  id: 'stock',
  field: 'stock',
  headerName: 'Stock',
  cellClass: ({ value }) => {
    const stock = value as number;
    if (stock === 0) return 'bg-red-100 text-red-800 font-bold';
    if (stock < 10) return 'bg-yellow-100 text-yellow-800';
    return 'text-green-600';
  }
}
\`\`\`

### Dynamic Style

\`\`\`tsx
{
  id: 'change',
  field: 'change',
  headerName: 'Change %',
  cellStyle: ({ value }) => ({
    color: (value as number) >= 0 ? '#16a34a' : '#dc2626',
    fontWeight: 'bold',
    backgroundColor: (value as number) >= 0 ? '#f0fdf4' : '#fef2f2',
  })
}
\`\`\`

## Column Features

### Sortable

\`\`\`tsx
{ id: 'name', field: 'name', sortable: true }   // Enable (default)
{ id: 'actions', headerName: 'Actions', sortable: false }  // Disable
\`\`\`

### Custom Comparator

\`\`\`tsx
{
  id: 'date',
  field: 'date',
  headerName: 'Date',
  comparator: (a, b) => new Date(a).getTime() - new Date(b).getTime()
}
\`\`\`

### Editable

\`\`\`tsx
{ id: 'quantity', field: 'quantity', editable: true }
\`\`\`

### Pinned

\`\`\`tsx
{ id: 'id', field: 'id', pinned: 'left' }
{ id: 'actions', headerName: 'Actions', pinned: 'right' }
\`\`\`
`
  },
  'plugins': {
    title: 'Plugins',
    icon: Puzzle,
    content: `
# Plugins

WarperGrid uses a modular plugin system. Enable only what you need for optimal bundle size and performance.

## Enabling Plugins

\`\`\`tsx
const gridRef = useRef<WarperGridRef<User>>(null);

const handleGridReady = () => {
  gridRef.current?.attach([
    'sorting',
    'filtering',
    'pagination',
    'selection',
    'columnResizing',
    'export'
  ]);
};
\`\`\`

## Available Plugins

### sorting

Multi-column sorting with keyboard support.

\`\`\`tsx
gridRef.current?.attach(['sorting']);
\`\`\`

**Interactions:**
- Click header → Sort ascending
- Click again → Sort descending  
- Click again → Clear sort
- Shift+Click → Add to multi-sort

**API:**
\`\`\`tsx
// Set sort programmatically
api.setSortModel([
  { colId: 'name', sort: 'asc' },
  { colId: 'date', sort: 'desc' }
]);

// Get current sort
const sortModel = api.getSortModel();
\`\`\`

---

### filtering

Text, number, and date filters with custom filter UI.

\`\`\`tsx
gridRef.current?.attach(['filtering']);
\`\`\`

**API:**
\`\`\`tsx
// Set filters
api.setFilterModel({
  name: { type: 'contains', filter: 'john' },
  age: { type: 'greaterThan', filter: 25 },
  status: { type: 'equals', filter: 'active' }
});

// Get filters
const filterModel = api.getFilterModel();

// Clear all filters
api.setFilterModel({});
\`\`\`

---

### pagination

Client-side pagination with configurable page sizes.

\`\`\`tsx
gridRef.current?.attach([{
  name: 'pagination',
  options: {
    pageSize: 25,
    pageSizeOptions: [10, 25, 50, 100]
  }
}]);
\`\`\`

**API:**
\`\`\`tsx
api.goToPage(3);
api.nextPage();
api.previousPage();
api.setPageSize(50);

const { currentPage, pageSize, totalPages, totalRows } = api.getPaginationState();
\`\`\`

---

### selection

Row selection with single/multi modes.

\`\`\`tsx
gridRef.current?.attach([{
  name: 'selection',
  options: {
    mode: 'multiple',        // 'single' | 'multiple'
    showCheckbox: true       // Show checkbox column
  }
}]);
\`\`\`

**Interactions:**
- Click → Select row
- Ctrl/Cmd + Click → Toggle selection
- Shift + Click → Range selection
- Checkbox → Toggle without clearing

**API:**
\`\`\`tsx
const selected = api.getSelectedRows();
api.selectAll();
api.deselectAll();
api.selectRows([1, 2, 3]); // By ID
\`\`\`

---

### columnResizing

Drag column borders to resize.

\`\`\`tsx
gridRef.current?.attach(['columnResizing']);
\`\`\`

**API:**
\`\`\`tsx
api.setColumnWidth('name', 200);
api.autoSizeColumn('name');
api.autoSizeAllColumns();
\`\`\`

---

### columnDragging

Drag column headers to reorder.

\`\`\`tsx
gridRef.current?.attach(['columnDragging']);
\`\`\`

**API:**
\`\`\`tsx
api.moveColumn('email', 0); // Move to first position
\`\`\`

---

### columnMenu

Right-click or button menu for column options.

\`\`\`tsx
gridRef.current?.attach(['columnMenu']);
\`\`\`

Menu includes: Sort, Filter, Hide, Pin, Auto-size.

---

### cellEditing

Double-click to edit cells inline.

\`\`\`tsx
gridRef.current?.attach(['cellEditing']);
\`\`\`

**Interactions:**
- Double-click or Enter → Start editing
- Tab → Save and move to next cell
- Shift+Tab → Save and move to previous cell
- Enter → Save and move down
- Escape → Cancel editing

**API:**
\`\`\`tsx
api.startEditing(rowId, 'name');
api.stopEditing();        // Save
api.stopEditing(true);    // Cancel
\`\`\`

---

### cellSelection

Excel-like cell range selection.

\`\`\`tsx
gridRef.current?.attach(['cellSelection']);
\`\`\`

**Interactions:**
- Click + Drag → Select range
- Shift + Click → Extend selection
- Ctrl/Cmd + Click → Add to selection

---

### clipboard

Copy and paste with keyboard shortcuts.

\`\`\`tsx
gridRef.current?.attach(['clipboard']);
\`\`\`

**Shortcuts:**
- Ctrl/Cmd + C → Copy selected cells
- Ctrl/Cmd + V → Paste into cells

---

### contextMenu

Right-click context menu with common actions.

\`\`\`tsx
gridRef.current?.attach(['contextMenu']);
\`\`\`

Menu includes: Copy, Paste, Export selection, Delete rows.

---

### export

Export grid data to multiple formats.

\`\`\`tsx
gridRef.current?.attach(['export']);
\`\`\`

**API:**
\`\`\`tsx
// CSV
api.exportToCsv({ fileName: 'data.csv' });

// Excel (.xlsx)
api.exportToExcel({ 
  fileName: 'data.xlsx',
  sheetName: 'Users'
});

// JSON
api.exportToJson({ fileName: 'data.json' });

// PDF
api.exportToPdf({ 
  fileName: 'report.pdf',
  title: 'User Report',
  orientation: 'landscape'
});
\`\`\`

---

### masterDetail

Expandable detail rows with custom content.

\`\`\`tsx
gridRef.current?.attach([{
  name: 'masterDetail',
  options: {
    detailRenderer: ({ data }) => (
      <div className="p-4 bg-gray-50">
        <h3 className="font-bold mb-2">Order Details</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>Customer: {data.customerName}</div>
          <div>Total: \${data.total}</div>
        </div>
        <OrderItemsTable items={data.items} />
      </div>
    )
  }
}]);
\`\`\`

---

### statusBar

Bottom status bar with row count and selection info.

\`\`\`tsx
gridRef.current?.attach(['statusBar']);
\`\`\`

Shows: Total rows, Selected rows, Filtered rows.

---

### sqlQuery

Run SQL queries directly on grid data using sql.js.

\`\`\`tsx
gridRef.current?.attach(['sqlQuery']);
\`\`\`

**API:**
\`\`\`tsx
api.openSqlPanel();

// Execute query
const results = await api.executeSql(
  'SELECT * FROM data WHERE status = "active" ORDER BY name'
);
\`\`\`

---

### rowGrouping

Group rows by column values with aggregation.

\`\`\`tsx
gridRef.current?.attach([{
  name: 'rowGrouping',
  options: {
    groupBy: ['department', 'status']
  }
}]);
\`\`\`

## Plugin Configuration

Pass options when attaching:

\`\`\`tsx
gridRef.current?.attach([
  'sorting',
  'filtering',
  {
    name: 'pagination',
    options: { pageSize: 50 }
  },
  {
    name: 'selection',
    options: { mode: 'multiple', showCheckbox: true }
  },
  {
    name: 'masterDetail',
    options: { detailRenderer: MyDetailComponent }
  }
]);
\`\`\`

## Detaching Plugins

\`\`\`tsx
// Remove specific plugins
gridRef.current?.detach(['sorting', 'filtering']);

// Remove all plugins
gridRef.current?.detachAll();
\`\`\`
`
  },
  'api': {
    title: 'API Reference',
    icon: Settings,
    content: `
# Grid API Reference

Access the Grid API through a ref or the \`onGridReady\` callback.

## Accessing the API

\`\`\`tsx
const gridRef = useRef<WarperGridRef<User>>(null);

// Via ref
gridRef.current?.api.getSelectedRows();

// Via onGridReady
<WarperGrid
  onGridReady={({ api }) => {
    // Store api reference
    apiRef.current = api;
  }}
/>
\`\`\`

## Data Methods

### setRowData

Replace all grid data.

\`\`\`tsx
api.setRowData(newData);
\`\`\`

### getRowData

Get all current rows (respects filters).

\`\`\`tsx
const data = api.getRowData();
const allData = api.getRowData({ includeFiltered: true });
\`\`\`

### applyTransaction

Add, update, or remove rows efficiently.

\`\`\`tsx
api.applyTransaction({
  add: [
    { id: 100, name: 'New User', email: 'new@example.com' }
  ],
  update: [
    { id: 1, name: 'Updated Name' }  // Matches by id
  ],
  remove: [
    { id: 2 }  // Removes row with id: 2
  ]
});
\`\`\`

### getRowNode

Get a row by its ID.

\`\`\`tsx
const row = api.getRowNode(123);
console.log(row.data);
\`\`\`

### forEachNode

Iterate over all rows.

\`\`\`tsx
api.forEachNode((node, index) => {
  console.log(node.data);
});
\`\`\`

---

## Column Methods

### getColumns

Get all column definitions.

\`\`\`tsx
const columns = api.getColumns();
\`\`\`

### getColumn

Get a specific column.

\`\`\`tsx
const nameCol = api.getColumn('name');
\`\`\`

### setColumnVisible

Show or hide columns.

\`\`\`tsx
api.setColumnVisible('email', false);
api.setColumnsVisible(['phone', 'address'], false);
\`\`\`

### setColumnWidth

Set column width programmatically.

\`\`\`tsx
api.setColumnWidth('name', 200);
\`\`\`

### autoSizeColumn

Auto-size to fit content.

\`\`\`tsx
api.autoSizeColumn('name');
api.autoSizeAllColumns();
\`\`\`

### moveColumn

Reorder columns.

\`\`\`tsx
api.moveColumn('email', 0);  // Move to first position
\`\`\`

### pinColumn

Pin columns to edges.

\`\`\`tsx
api.pinColumn('id', 'left');
api.pinColumn('actions', 'right');
api.pinColumn('name', null);  // Unpin
\`\`\`

---

## Selection Methods

### getSelectedRows

Get data from selected rows.

\`\`\`tsx
const selected = api.getSelectedRows();
console.log(\`Selected \${selected.length} rows\`);
\`\`\`

### getSelectedNodes

Get row nodes (includes metadata).

\`\`\`tsx
const nodes = api.getSelectedNodes();
nodes.forEach(node => {
  console.log(node.id, node.data, node.rowIndex);
});
\`\`\`

### selectAll / deselectAll

\`\`\`tsx
api.selectAll();
api.deselectAll();
\`\`\`

### selectRows

Select specific rows by ID.

\`\`\`tsx
api.selectRows([1, 2, 3]);
api.selectRows([1, 2, 3], { clearExisting: false });  // Add to selection
\`\`\`

---

## Sorting Methods

### setSortModel

Set sort state.

\`\`\`tsx
api.setSortModel([
  { colId: 'name', sort: 'asc' },
  { colId: 'date', sort: 'desc' }
]);
\`\`\`

### getSortModel

Get current sort state.

\`\`\`tsx
const sortModel = api.getSortModel();
// [{ colId: 'name', sort: 'asc' }]
\`\`\`

### clearSort

\`\`\`tsx
api.clearSort();
\`\`\`

---

## Filter Methods

### setFilterModel

Set filters.

\`\`\`tsx
api.setFilterModel({
  name: { type: 'contains', filter: 'john' },
  age: { type: 'greaterThan', filter: 25 },
  status: { type: 'equals', filter: 'active' }
});
\`\`\`

### getFilterModel

Get current filters.

\`\`\`tsx
const filters = api.getFilterModel();
\`\`\`

### clearFilters

\`\`\`tsx
api.clearFilters();
api.clearFilter('name');  // Clear specific column
\`\`\`

### isAnyFilterPresent

\`\`\`tsx
if (api.isAnyFilterPresent()) {
  // Show "Clear Filters" button
}
\`\`\`

---

## Pagination Methods

### goToPage

\`\`\`tsx
api.goToPage(3);
api.goToFirstPage();
api.goToLastPage();
\`\`\`

### nextPage / previousPage

\`\`\`tsx
api.nextPage();
api.previousPage();
\`\`\`

### setPageSize

\`\`\`tsx
api.setPageSize(50);
\`\`\`

### getPaginationState

\`\`\`tsx
const { 
  currentPage, 
  pageSize, 
  totalPages, 
  totalRows,
  startRow,
  endRow 
} = api.getPaginationState();
\`\`\`

---

## Export Methods

### exportToCsv

\`\`\`tsx
api.exportToCsv({
  fileName: 'data.csv',
  columnKeys: ['name', 'email'],  // Optional: specific columns
  onlySelected: true,             // Optional: selected rows only
});
\`\`\`

### exportToExcel

\`\`\`tsx
api.exportToExcel({
  fileName: 'data.xlsx',
  sheetName: 'Users',
  columnKeys: ['name', 'email', 'status'],
});
\`\`\`

### exportToJson

\`\`\`tsx
api.exportToJson({
  fileName: 'data.json',
  onlySelected: true,
});
\`\`\`

### exportToPdf

\`\`\`tsx
api.exportToPdf({
  fileName: 'report.pdf',
  title: 'User Report',
  orientation: 'landscape',  // 'portrait' | 'landscape'
});
\`\`\`

---

## State Methods

### getState

Save complete grid state.

\`\`\`tsx
const state = api.getState();
localStorage.setItem('gridState', JSON.stringify(state));
\`\`\`

### setState

Restore grid state.

\`\`\`tsx
const state = JSON.parse(localStorage.getItem('gridState') || '{}');
api.setState(state);
\`\`\`

State includes: sort, filter, column order, column widths, column visibility, pagination.

---

## Editing Methods

### startEditing

\`\`\`tsx
api.startEditing(rowId, 'name');
\`\`\`

### stopEditing

\`\`\`tsx
api.stopEditing();         // Save changes
api.stopEditing(true);     // Cancel changes
\`\`\`

### getEditingCell

\`\`\`tsx
const cell = api.getEditingCell();
if (cell) {
  console.log(cell.rowId, cell.colId, cell.value);
}
\`\`\`

---

## Scroll Methods

### ensureRowVisible

Scroll to make a row visible.

\`\`\`tsx
api.ensureRowVisible(rowId);
api.ensureRowVisible(rowId, 'middle');  // 'top' | 'middle' | 'bottom'
\`\`\`

### ensureColumnVisible

\`\`\`tsx
api.ensureColumnVisible('email');
\`\`\`

### scrollToTop / scrollToBottom

\`\`\`tsx
api.scrollToTop();
api.scrollToBottom();
\`\`\`

---

## Refresh Methods

### refreshCells

Re-render cells.

\`\`\`tsx
api.refreshCells();
api.refreshCells({ columns: ['status', 'price'] });
api.refreshCells({ rowNodes: [node1, node2] });
\`\`\`

### redrawRows

Force complete re-render.

\`\`\`tsx
api.redrawRows();
api.redrawRows({ rowNodes: [node] });
\`\`\`
`
  },
  'events': {
    title: 'Events',
    icon: Zap,
    content: `
# Events

WarperGrid provides events to respond to user interactions and grid state changes.

## Event Usage

Pass event handlers as props to the grid:

\`\`\`tsx
<WarperGrid
  data={data}
  columns={columns}
  onGridReady={handleGridReady}
  onCellClick={handleCellClick}
  onSelectionChanged={handleSelectionChanged}
  onCellValueChanged={handleCellValueChanged}
/>
\`\`\`

## Grid Lifecycle

### onGridReady

Fired when the grid is fully initialized.

\`\`\`tsx
const handleGridReady = ({ api, columnApi }) => {
  // Grid is ready - attach plugins
  api.attach(['sorting', 'filtering', 'pagination']);
  
  // Load saved state
  const state = localStorage.getItem('gridState');
  if (state) api.setState(JSON.parse(state));
};
\`\`\`

---

## Cell Events

### onCellClick

Fired when a cell is clicked.

\`\`\`tsx
interface CellClickEvent<T> {
  data: T;              // Row data
  column: ColumnDef<T>; // Column definition
  value: unknown;       // Cell value
  rowIndex: number;     // Row index
  event: MouseEvent;    // Native event
}

const handleCellClick = ({ data, column, value, event }: CellClickEvent<User>) => {
  if (column.id === 'email') {
    window.location.href = \`mailto:\${value}\`;
  }
};
\`\`\`

### onCellDoubleClick

\`\`\`tsx
const handleCellDoubleClick = ({ data, column }) => {
  if (column.id === 'name') {
    openEditModal(data);
  }
};
\`\`\`

### onCellValueChanged

Fired after a cell edit is complete.

\`\`\`tsx
interface CellValueChangedEvent<T> {
  data: T;              // Updated row data
  column: ColumnDef<T>; // Column definition
  oldValue: unknown;    // Previous value
  newValue: unknown;    // New value
  rowIndex: number;
}

const handleCellValueChanged = async ({ 
  data, 
  column, 
  oldValue, 
  newValue 
}: CellValueChangedEvent<User>) => {
  console.log(\`\${column.field}: \${oldValue} → \${newValue}\`);
  
  // Save to backend
  await updateUser(data.id, { [column.field]: newValue });
};
\`\`\`

### onCellEditingStarted

\`\`\`tsx
const handleCellEditingStarted = ({ data, column, value }) => {
  console.log(\`Started editing \${column.field}\`);
};
\`\`\`

### onCellEditingStopped

\`\`\`tsx
const handleCellEditingStopped = ({ data, column, oldValue, newValue, cancelled }) => {
  if (cancelled) {
    console.log('Edit was cancelled');
  }
};
\`\`\`

---

## Row Events

### onRowClick

\`\`\`tsx
interface RowClickEvent<T> {
  data: T;
  rowIndex: number;
  event: MouseEvent;
}

const handleRowClick = ({ data, event }: RowClickEvent<User>) => {
  if (!event.ctrlKey && !event.metaKey) {
    setSelectedUser(data);
  }
};
\`\`\`

### onRowDoubleClick

\`\`\`tsx
const handleRowDoubleClick = ({ data }) => {
  router.push(\`/users/\${data.id}\`);
};
\`\`\`

---

## Selection Events

### onSelectionChanged

Fired when row selection changes.

\`\`\`tsx
interface SelectionChangedEvent<T> {
  selectedRows: T[];
  api: GridApi<T>;
}

const handleSelectionChanged = ({ selectedRows }: SelectionChangedEvent<User>) => {
  setSelectedCount(selectedRows.length);
  setCanDelete(selectedRows.length > 0);
};
\`\`\`

---

## Sort & Filter Events

### onSortChanged

\`\`\`tsx
interface SortChangedEvent {
  sortModel: Array<{ colId: string; sort: 'asc' | 'desc' }>;
  api: GridApi;
}

const handleSortChanged = ({ sortModel }) => {
  console.log('Sort changed:', sortModel);
  // Maybe fetch new data from server
};
\`\`\`

### onFilterChanged

\`\`\`tsx
interface FilterChangedEvent {
  filterModel: Record<string, FilterModel>;
  api: GridApi;
}

const handleFilterChanged = ({ filterModel }) => {
  const activeFilters = Object.keys(filterModel).length;
  setFilterBadge(activeFilters);
};
\`\`\`

---

## Column Events

### onColumnResized

\`\`\`tsx
const handleColumnResized = ({ column, newWidth, finished }) => {
  if (finished) {
    // Save column width preference
    saveColumnWidth(column.id, newWidth);
  }
};
\`\`\`

### onColumnMoved

\`\`\`tsx
const handleColumnMoved = ({ column, fromIndex, toIndex }) => {
  console.log(\`Moved \${column.field} from \${fromIndex} to \${toIndex}\`);
};
\`\`\`

### onColumnVisible

\`\`\`tsx
const handleColumnVisible = ({ column, visible }) => {
  console.log(\`\${column.field} is now \${visible ? 'visible' : 'hidden'}\`);
};
\`\`\`

### onColumnPinned

\`\`\`tsx
const handleColumnPinned = ({ column, pinned }) => {
  console.log(\`\${column.field} pinned: \${pinned}\`); // 'left' | 'right' | null
};
\`\`\`

---

## Pagination Events

### onPageChanged

\`\`\`tsx
interface PageChangedEvent {
  currentPage: number;
  pageSize: number;
  totalPages: number;
  totalRows: number;
}

const handlePageChanged = ({ currentPage, totalPages }) => {
  console.log(\`Page \${currentPage} of \${totalPages}\`);
};
\`\`\`

---

## TypeScript Types

All events are fully typed:

\`\`\`tsx
import type {
  GridReadyEvent,
  CellClickEvent,
  CellDoubleClickEvent,
  CellValueChangedEvent,
  RowClickEvent,
  RowDoubleClickEvent,
  SelectionChangedEvent,
  SortChangedEvent,
  FilterChangedEvent,
  ColumnResizedEvent,
  ColumnMovedEvent,
  PageChangedEvent,
} from '@itsmeadarsh/warper-grid';

// Use with your data type
const handleCellClick = (event: CellClickEvent<User>) => {
  // event.data is typed as User
};
\`\`\`
`
  },
  'theming': {
    title: 'Theming',
    icon: Palette,
    content: `
# Theming & Styling

WarperGrid is built with Tailwind CSS and can be fully customized to match your design system.

## CSS Variables

Override these variables to change the grid's appearance:

\`\`\`css
.warper-grid {
  /* Background colors */
  --wg-background: #ffffff;
  --wg-header-bg: #f9fafb;
  --wg-row-hover: #f3f4f6;
  --wg-row-stripe: #fafafa;
  
  /* Selection colors */
  --wg-row-selected: #dbeafe;
  --wg-cell-selected: #bfdbfe;
  --wg-cell-active: #93c5fd;
  
  /* Border colors */
  --wg-border-color: #e5e7eb;
  --wg-header-border: #d1d5db;
  
  /* Text colors */
  --wg-header-text: #111827;
  --wg-cell-text: #374151;
  --wg-cell-text-muted: #6b7280;
  
  /* Accent color */
  --wg-primary: #3b82f6;
  --wg-primary-hover: #2563eb;
  
  /* Sizing */
  --wg-header-height: 44px;
  --wg-row-height: 40px;
  --wg-font-size: 14px;
}
\`\`\`

## Dark Mode

\`\`\`css
.dark .warper-grid,
[data-theme="dark"] .warper-grid {
  --wg-background: #1f2937;
  --wg-header-bg: #111827;
  --wg-row-hover: #374151;
  --wg-row-stripe: #1a1a2e;
  
  --wg-row-selected: #1e3a5f;
  --wg-cell-selected: #1e40af;
  --wg-cell-active: #1d4ed8;
  
  --wg-border-color: #374151;
  --wg-header-border: #4b5563;
  
  --wg-header-text: #f9fafb;
  --wg-cell-text: #d1d5db;
  --wg-cell-text-muted: #9ca3af;
  
  --wg-primary: #60a5fa;
  --wg-primary-hover: #3b82f6;
}
\`\`\`

## Grid Props

### className

Add custom CSS classes:

\`\`\`tsx
<WarperGrid
  className="my-grid shadow-lg rounded-lg overflow-hidden"
/>
\`\`\`

### striped

Alternating row colors:

\`\`\`tsx
<WarperGrid striped />
\`\`\`

### bordered

Show cell borders:

\`\`\`tsx
<WarperGrid bordered />
\`\`\`

### compact

Reduced row height for dense data:

\`\`\`tsx
<WarperGrid compact />
\`\`\`

## Custom Themes

### Blue Theme

\`\`\`css
.warper-grid.theme-blue {
  --wg-primary: #2563eb;
  --wg-header-bg: #eff6ff;
  --wg-header-text: #1e40af;
  --wg-row-selected: #dbeafe;
  --wg-border-color: #bfdbfe;
}
\`\`\`

### Green Theme

\`\`\`css
.warper-grid.theme-green {
  --wg-primary: #16a34a;
  --wg-header-bg: #f0fdf4;
  --wg-header-text: #166534;
  --wg-row-selected: #dcfce7;
  --wg-border-color: #bbf7d0;
}
\`\`\`

### Purple Theme

\`\`\`css
.warper-grid.theme-purple {
  --wg-primary: #9333ea;
  --wg-header-bg: #faf5ff;
  --wg-header-text: #6b21a8;
  --wg-row-selected: #f3e8ff;
  --wg-border-color: #e9d5ff;
}
\`\`\`

Usage:

\`\`\`tsx
<WarperGrid className="theme-purple" />
\`\`\`

## Column Styling

### Static Styles

\`\`\`tsx
{
  id: 'name',
  field: 'name',
  headerName: 'Name',
  cellClass: 'font-bold text-blue-600',
  headerClass: 'bg-blue-50',
  cellStyle: {
    fontFamily: 'monospace'
  }
}
\`\`\`

### Dynamic Styles

\`\`\`tsx
{
  id: 'stock',
  field: 'stock',
  cellClass: ({ value }) => {
    const v = value as number;
    if (v === 0) return 'bg-red-100 text-red-800 font-bold';
    if (v < 10) return 'bg-yellow-100 text-yellow-800';
    return 'text-green-600';
  },
  cellStyle: ({ value }) => ({
    fontWeight: (value as number) < 10 ? 'bold' : 'normal'
  })
}
\`\`\`

## Custom Cell Renderers

### Status Badge

\`\`\`tsx
cellRenderer: ({ value }) => {
  const colors: Record<string, string> = {
    active: 'bg-green-100 text-green-800 border-green-200',
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    inactive: 'bg-gray-100 text-gray-600 border-gray-200',
  };
  return (
    <span className={\`
      px-2 py-0.5 rounded-full text-xs font-medium 
      border \${colors[value as string]}
    \`}>
      {value}
    </span>
  );
}
\`\`\`

### Progress Bar

\`\`\`tsx
cellRenderer: ({ value }) => {
  const percent = value as number;
  const color = percent >= 80 ? 'bg-green-500' 
              : percent >= 50 ? 'bg-yellow-500' 
              : 'bg-red-500';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-gray-200 rounded-full">
        <div 
          className={\`h-full rounded-full \${color}\`} 
          style={{ width: \`\${percent}%\` }} 
        />
      </div>
      <span className="text-xs text-gray-500 w-8 text-right">
        {percent}%
      </span>
    </div>
  );
}
\`\`\`

### Rating Stars

\`\`\`tsx
cellRenderer: ({ value }) => {
  const rating = value as number;
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(star => (
        <Star
          key={star}
          className={\`w-4 h-4 \${
            star <= rating 
              ? 'fill-yellow-400 text-yellow-400' 
              : 'text-gray-300'
          }\`}
        />
      ))}
    </div>
  );
}
\`\`\`

## Global Styles

Apply styles to all cells:

\`\`\`tsx
<WarperGrid
  cellStyle={{
    fontSize: '13px',
    padding: '8px 12px',
  }}
  cellClass="font-mono"
/>
\`\`\`

Or dynamically:

\`\`\`tsx
<WarperGrid
  cellStyle={({ value, column }) => ({
    textAlign: column.align || 'left',
    opacity: value === null ? 0.5 : 1,
  })}
/>
\`\`\`

## Animation

Add smooth transitions:

\`\`\`css
.warper-grid .wg-row {
  transition: background-color 0.15s ease;
}

.warper-grid .wg-cell {
  transition: all 0.1s ease;
}

/* Highlight updated cells */
.warper-grid .wg-cell--updated {
  animation: highlight 1s ease-out;
}

@keyframes highlight {
  0% { background-color: #fef08a; }
  100% { background-color: transparent; }
}
\`\`\`
`
  }
};

// ============================================================================
// Markdown Rendering with Shiki
// ============================================================================

// Cached highlighter instance
let highlighterPromise: Promise<Highlighter> | null = null;

async function getHighlighter(): Promise<Highlighter> {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighter({
      themes: ['github-dark'],
      langs: ['typescript', 'tsx', 'javascript', 'jsx', 'bash', 'css', 'json', 'html', 'text'],
    });
  }
  return highlighterPromise;
}

async function highlightCode(code: string, lang: string): Promise<string> {
  try {
    const highlighter = await getHighlighter();
    const validLang = highlighter.getLoadedLanguages().includes(lang as never) ? lang : 'text';
    const html = highlighter.codeToHtml(code, {
      lang: validLang,
      theme: 'github-dark',
    });
    return html;
  } catch {
    // Fallback for unsupported languages
    return `<pre class="shiki github-dark"><code>${escapeHtml(code)}</code></pre>`;
  }
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

async function renderMarkdown(content: string): Promise<string> {
  // First, extract code blocks and replace with placeholders
  const codeBlocks: Array<{ lang: string; code: string }> = [];
  const contentWithPlaceholders = content.replace(
    /```(\w*)\n([\s\S]*?)```/g,
    (_, lang, code) => {
      const index = codeBlocks.length;
      codeBlocks.push({ lang: lang || 'text', code: code.trim() });
      return `<!--CODE_BLOCK_${index}-->`;
    }
  );

  // Process markdown with remark
  const result = await remark()
    .use(remarkHtml, { sanitize: false })
    .process(contentWithPlaceholders);

  let html = String(result);

  // Replace placeholders with syntax-highlighted code
  for (let i = 0; i < codeBlocks.length; i++) {
    const { lang, code } = codeBlocks[i];
    const highlighted = await highlightCode(code, lang);
    const langLabel = lang ? `<span class="code-lang-label">${lang}</span>` : '';
    html = html.replace(
      `<!--CODE_BLOCK_${i}-->`,
      `<div class="code-block-wrapper" data-lang="${lang}">${langLabel}${highlighted}</div>`
    );
  }

  return html;
}

// ============================================================================
// Components
// ============================================================================

function Navbar({ currentDoc, onNavigate }: { currentDoc: string; onNavigate: (doc: string) => void }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-800/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <a href="/" className="flex items-center gap-3 group">
            <div className="relative">
              <div className="absolute inset-0 bg-emerald-500/20 rounded-xl blur-xl group-hover:bg-emerald-500/30 transition-all duration-500" />
              <div className="relative p-2.5 bg-zinc-900 border border-zinc-800 rounded-xl group-hover:border-emerald-500/50 transition-all duration-300">
                <Sparkles className="w-5 h-5 text-emerald-400" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold tracking-tight">
                Warper<span className="text-emerald-400">Grid</span>
              </span>
              <span className="text-xs text-zinc-500 border border-zinc-800 px-2 py-0.5 rounded">
                Docs
              </span>
            </div>
          </a>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {Object.entries(docs).map(([key, doc]) => (
              <button
                type="button"
                key={key}
                onClick={() => onNavigate(key)}
                className={`px-3 py-2 text-sm rounded-lg transition-all duration-300 ${
                  currentDoc === key 
                    ? 'text-emerald-400 bg-emerald-500/10' 
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
                }`}
              >
                {doc.title}
              </button>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            <a 
              href="https://discord.gg/WC5npzPx3s"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 sm:p-2.5 text-zinc-400 hover:text-white hover:bg-zinc-800/50 rounded-xl transition-all duration-300"
              title="Join Discord"
            >
              <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5" />
            </a>

            <a 
              href="/"
              className="hidden sm:flex items-center gap-2 px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white font-medium text-sm rounded-xl transition-all duration-300"
            >
              <ArrowLeft className="w-4 h-4" />
              Home
            </a>

            <button
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              className="md:hidden p-2.5 text-zinc-400 hover:text-white hover:bg-zinc-800/50 rounded-xl transition-all duration-300"
            >
              {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Nav */}
        <div className={`md:hidden overflow-hidden transition-all duration-500 ${isOpen ? 'max-h-96 pb-4' : 'max-h-0'}`}>
          <div className="pt-2 space-y-1">
            {Object.entries(docs).map(([key, doc]) => (
              <button
                type="button"
                key={key}
                onClick={() => {
                  onNavigate(key);
                  setIsOpen(false);
                }}
                className={`block w-full text-left px-4 py-2.5 text-sm rounded-xl transition-all duration-300 ${
                  currentDoc === key 
                    ? 'text-emerald-400 bg-emerald-500/10' 
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
                }`}
              >
                {doc.title}
              </button>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
}

function Sidebar({ currentDoc, onNavigate }: { currentDoc: string; onNavigate: (doc: string) => void }) {
  return (
    <aside className="hidden lg:block w-64 shrink-0">
      <div className="sticky top-24 space-y-2">
        <div className="flex items-center gap-2 text-emerald-400 text-sm font-medium mb-4">
          <BookOpen className="w-4 h-4" />
          Documentation
        </div>
        
        {Object.entries(docs).map(([key, doc]) => {
          const Icon = doc.icon;
          return (
            <button
              type="button"
              key={key}
              onClick={() => onNavigate(key)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-300 ${
                currentDoc === key
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-sm font-medium">{doc.title}</span>
              {currentDoc === key && (
                <ChevronRight className="w-4 h-4 ml-auto" />
              )}
            </button>
          );
        })}
      </div>
    </aside>
  );
}

function DocContent({ content }: { content: string }) {
  const [html, setHtml] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    renderMarkdown(content).then((result) => {
      setHtml(result);
      setLoading(false);
    });
  }, [content]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <article 
      className="doc-content prose prose-invert max-w-none"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

// ============================================================================
// Styles
// ============================================================================

const styles = `
  .doc-content {
    color: #d1d5db;
    line-height: 1.8;
  }
  
  .doc-content h1 {
    font-size: 2.5rem;
    font-weight: 700;
    color: white;
    margin-bottom: 1.5rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid #27272a;
    line-height: 1.2;
  }
  
  .doc-content h2 {
    font-size: 1.5rem;
    font-weight: 600;
    color: white;
    margin-top: 3rem;
    margin-bottom: 1rem;
    padding-bottom: 0.5rem;
    border-bottom: 1px solid #27272a;
  }
  
  .doc-content h3 {
    font-size: 1.25rem;
    font-weight: 600;
    color: #e4e4e7;
    margin-top: 2rem;
    margin-bottom: 0.75rem;
  }
  
  .doc-content h4 {
    font-size: 1.1rem;
    font-weight: 600;
    color: #a1a1aa;
    margin-top: 1.5rem;
    margin-bottom: 0.5rem;
  }
  
  .doc-content p {
    margin-bottom: 1rem;
  }
  
  .doc-content ul, .doc-content ol {
    margin-bottom: 1rem;
    padding-left: 1.5rem;
  }
  
  .doc-content li {
    margin-bottom: 0.5rem;
  }
  
  .doc-content ul li {
    list-style-type: disc;
  }
  
  .doc-content ol li {
    list-style-type: decimal;
  }
  
  .doc-content strong {
    color: white;
    font-weight: 600;
  }
  
  .doc-content em {
    color: #a1a1aa;
  }
  
  .doc-content a {
    color: #10b981;
    text-decoration: none;
    transition: color 0.2s;
  }
  
  .doc-content a:hover {
    color: #34d399;
    text-decoration: underline;
  }
  
  .doc-content code:not(pre code) {
    background: #27272a;
    color: #10b981;
    padding: 0.2rem 0.4rem;
    border-radius: 0.25rem;
    font-family: 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;
    font-size: 0.875em;
  }
  
  .doc-content .code-block-wrapper {
    position: relative;
    margin: 1.5rem 0;
    border-radius: 0.75rem;
    overflow: hidden;
    border: 1px solid #27272a;
    background: #0d1117;
  }
  
  .doc-content .code-lang-label {
    position: absolute;
    top: 0;
    right: 0;
    padding: 0.25rem 0.75rem;
    font-size: 0.7rem;
    font-family: 'JetBrains Mono', 'Fira Code', monospace;
    color: #6b7280;
    background: #161b22;
    border-bottom-left-radius: 0.5rem;
    border-left: 1px solid #27272a;
    border-bottom: 1px solid #27272a;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    user-select: none;
  }
  
  .doc-content .code-block-wrapper pre {
    margin: 0 !important;
    padding: 1.25rem 1.5rem !important;
    padding-top: 1.75rem !important;
    background: #0d1117 !important;
    overflow-x: auto;
  }
  
  .doc-content .code-block-wrapper pre::-webkit-scrollbar {
    height: 6px;
  }
  
  .doc-content .code-block-wrapper pre::-webkit-scrollbar-track {
    background: #161b22;
    border-radius: 3px;
  }
  
  .doc-content .code-block-wrapper pre::-webkit-scrollbar-thumb {
    background: #30363d;
    border-radius: 3px;
  }
  
  .doc-content .code-block-wrapper pre::-webkit-scrollbar-thumb:hover {
    background: #484f58;
  }
  
  .doc-content .code-block-wrapper code {
    font-family: 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;
    font-size: 0.875rem;
    line-height: 1.7;
  }
  
  .doc-content .code-block-wrapper .line {
    display: inline;
  }
  
  .doc-content .shiki {
    background: #0d1117 !important;
  }
  
  .doc-content .shiki .line {
    line-height: 1.7;
  }
  
  .doc-content hr {
    border: none;
    border-top: 1px solid #27272a;
    margin: 2rem 0;
  }
  
  .doc-content table {
    width: 100%;
    border-collapse: collapse;
    margin: 1.5rem 0;
    font-size: 0.875rem;
  }
  
  .doc-content th,
  .doc-content td {
    padding: 0.75rem 1rem;
    text-align: left;
    border: 1px solid #27272a;
  }
  
  .doc-content th {
    background: #18181b;
    color: white;
    font-weight: 600;
  }
  
  .doc-content td {
    background: #09090b;
  }
  
  .doc-content td code {
    background: #27272a;
    color: #10b981;
    padding: 0.125rem 0.375rem;
    border-radius: 0.25rem;
    font-family: 'JetBrains Mono', 'Fira Code', monospace;
    font-size: 0.8em;
  }
  
  .doc-content blockquote {
    border-left: 4px solid #10b981;
    padding-left: 1rem;
    margin: 1.5rem 0;
    color: #a1a1aa;
    font-style: italic;
  }
`;

// ============================================================================
// Main Component
// ============================================================================

export default function DocsPage() {
  const [currentDoc, setCurrentDoc] = useState(() => {
    const hash = window.location.hash;
    const docKey = hash.replace('#docs/', '').replace('#docs-', '');
    return docs[docKey] ? docKey : 'getting-started';
  });

  useEffect(() => {
    // Inject styles
    const styleEl = document.createElement('style');
    styleEl.textContent = styles;
    document.head.appendChild(styleEl);
    return () => styleEl.remove();
  }, []);

  useEffect(() => {
    // Update hash when doc changes
    window.location.hash = `docs/${currentDoc}`;
    window.scrollTo(0, 0);
  }, [currentDoc]);

  const handleNavigate = (doc: string) => {
    setCurrentDoc(doc);
  };

  const doc = docs[currentDoc];
  const docKeys = Object.keys(docs);
  const currentIndex = docKeys.indexOf(currentDoc);

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <Navbar currentDoc={currentDoc} onNavigate={handleNavigate} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">
        <div className="flex gap-12">
          <Sidebar currentDoc={currentDoc} onNavigate={handleNavigate} />
          
          <main className="flex-1 min-w-0">
            <DocContent content={doc.content} />
            
            {/* Navigation */}
            <div className="mt-16 pt-8 border-t border-zinc-800 flex justify-between">
              {currentIndex > 0 && (
                <button
                  type="button"
                  onClick={() => handleNavigate(docKeys[currentIndex - 1])}
                  className="flex items-center gap-2 text-zinc-400 hover:text-emerald-400 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span className="text-sm">{docs[docKeys[currentIndex - 1]].title}</span>
                </button>
              )}
              
              <div className="flex-1" />
              
              {currentIndex < docKeys.length - 1 && (
                <button
                  type="button"
                  onClick={() => handleNavigate(docKeys[currentIndex + 1])}
                  className="flex items-center gap-2 text-zinc-400 hover:text-emerald-400 transition-colors"
                >
                  <span className="text-sm">{docs[docKeys[currentIndex + 1]].title}</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
