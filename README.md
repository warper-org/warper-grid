
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

## Table of Contents

- [Features](#features)
- [Architecture Overview](#architecture-overview)
- [Installation](#installation)
- [Getting Started](#getting-started)
- [Column Definitions](#column-definitions)
- [Plugin System](#plugin-system)
- [API Reference](#api-reference)
- [Events](#events)
- [Theming](#theming)
- [Advanced Usage](#advanced-usage)
- [Troubleshooting & FAQ](#troubleshooting--faq)
- [Development](#development)
- [Contributing](#contributing)
- [License](#license)

---

## ✨ Features

- **Ultra-Fast Rendering**: Powered by Warper's Rust/WASM virtualization engine
- **10,000,000+ Rows**: Handle massive datasets effortlessly
- **120+ FPS**: Smooth scrolling even with millions of items
- **O(1) Fixed-Height Lookups**: Instant row access
- **O(log N) Variable-Height**: Efficient Fenwick tree algorithms
- **Plugin Architecture**: Attach only the features you need
- **shadcn/ui Design**: Beautiful, accessible components out of the box
- **TypeScript First**: Full type safety and autocompletion
- **Headless Core**: UI-agnostic logic for custom rendering
- **Accessible**: Keyboard navigation, screen reader support

---

## 🏗️ Architecture Overview

WarperGrid is built for performance and extensibility:

- **Virtualization**: Uses the [Warper](https://github.com/warper-org/warper) Rust/WASM engine for blazing-fast row/column virtualization.
- **Plugin System**: All features (sorting, filtering, selection, etc.) are modular plugins. Attach only what you need.
- **Headless Logic**: Core grid logic is UI-agnostic, enabling custom rendering or integration with any design system.
- **shadcn/ui**: Default UI built with [shadcn/ui](https://ui.shadcn.com/) for beautiful, accessible components.

---

## 📦 Installation

```bash
bun add warper-grid @itsmeadarsh/warper
# or
pnpm add warper-grid @itsmeadarsh/warper
# or
yarn add warper-grid @itsmeadarsh/warper
# or
npm install warper-grid @itsmeadarsh/warper
```

---

## 🚀 Getting Started

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

---

## 📊 Column Definitions

Columns are defined using the `ColumnDef<T>` type. Each column supports rich configuration:

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

**Column Options:**

- `id` (string): Unique column id
- `field` (string): Field in data object
- `headerName` (string): Column header
- `width`, `minWidth`, `maxWidth` (number): Sizing
- `sortable`, `filterable`, `resizable` (boolean)
- `align` ('left' | 'center' | 'right')
- `valueGetter`, `valueFormatter`, `cellRenderer`, `comparator` (functions)

---

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

WarperGrid’s plugin system is fully modular. Here are all the plugins you can attach:

| Plugin             | Description                                                                 |
|--------------------|-----------------------------------------------------------------------------|
| `cell-editing`     | Inline editing of cell values with keyboard and mouse support                |
| `cell-selection`   | Fine-grained cell selection (single/multi, keyboard navigation)              |
| `clipboard`        | Copy and paste cell values to/from clipboard                                |
| `column-dragging`  | Drag and reorder columns via the header                                     |
| `column-menu`      | Column header menu with actions (sort, filter, hide, etc.)                  |
| `column-resizing`  | Drag to resize column widths                                                 |
| `context-menu`     | Right-click context menus for rows/cells                                    |
| `export`           | Export grid data to CSV (with selected rows support)                        |
| `filtering`        | Column filters (text, number, date, select) and global quick filter         |
| `master-detail`    | Expandable master-detail rows for nested data                               |
| `pagination`       | Client-side pagination with configurable page sizes                         |
| `row-grouping`     | Group rows by column values, with expand/collapse support                   |
| `selection`        | Row selection (single/multi, checkbox, API)                                |
| `sorting`          | Multi-column sorting with customizable comparators                          |
| `sql-query`        | SQL-like querying interface for advanced filtering and sorting              |
| `status-bar`       | Customizable status bar for summary, info, and custom widgets               |

> **Note:** Attach only the plugins you need for maximum performance. All plugins are optional and can be combined as required.

#### Plugin Configuration Example

```tsx
gridRef.current?.attach(['pagination', 'sorting'], {
  pagination: { pageSize: 100 },
  sorting: { multi: true },
});
```

---

## 🛠️ API Reference

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

### API Methods

- `getData()`: Returns all grid data
- `setData(data)`: Replace grid data
- `getDisplayedData()`: Returns currently displayed (filtered/sorted/paged) data
- `setSortModel(model)`: Set sort state
- `setFilterModel(model)`: Set filter state
- `setQuickFilter(text)`: Set global quick filter
- `selectAll()`, `deselectAll()`, `getSelectedRows()`
- `setPage(page)`, `setPageSize(size)`, `nextPage()`
- `scrollToRow(index)`
- `exportToCsv(options)`

---

## 📖 Events

Listen to grid events via props:

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

---

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

Override variables in your app’s CSS to customize the look and feel.

---

## ⚡ Advanced Usage

### Custom Cell Renderers

```tsx
const columns = [
  {
    id: 'actions',
    headerName: 'Actions',
    cellRenderer: ({ data }) => (
      <button onClick={() => alert(data.id)}>View</button>
    ),
  },
];
```

### Headless Mode

Use the core logic without UI for custom rendering:

```tsx
import { useWarperGridCore } from 'warper-grid';
const { rows, columns, api } = useWarperGridCore({ ... });
// Render your own table using rows/columns
```

### Server-Side Data

WarperGrid is UI-agnostic and can be used with server-side data fetching. Use the API to update data, sort/filter models, and pagination.

---

## ❓ Troubleshooting & FAQ

**Q: The grid is slow with 1M+ rows!**
A: Make sure virtualization is enabled and avoid using custom cell renderers that are expensive to render.

**Q: How do I use custom themes?**
A: Override the CSS variables in your app’s stylesheet.

**Q: Can I use WarperGrid with Next.js?**
A: Yes! WarperGrid works with any React framework. For SSR, render the grid only on the client.

**Q: How do I add my own plugin?**
A: See the [Plugin Authoring Guide](./docs/plugins.md) (coming soon).

---

## 🏗️ Development

```bash
# Install dependencies
bun install

# Start dev server
bun dev

# Build
bun run build
```

---

## 🤝 Contributing

Contributions are welcome! Please open issues and pull requests. For major changes, open an issue first to discuss what you’d like to change.

---

## 📜 License

MIT © [warper-org](https://github.com/warper-org)

