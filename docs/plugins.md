# Plugin System

WarperGrid's modular plugin system lets you enable only the features you need, keeping your bundle size small and performance high.

## Overview

Plugins are configured via the `pluginConfig` prop on `WarperGrid`. Each plugin can be enabled with default settings or customized with specific options.

```tsx
<WarperGrid
  data={data}
  columns={columns}
  pluginConfig={{
    sorting: { multiSort: true },
    filtering: { quickFilter: true },
    pagination: { pageSize: 25 },
  }}
/>
```

## Available Plugins

### Sorting

Enable column sorting with single or multi-column support.

```tsx
pluginConfig={{
  sorting: {
    multiSort: true,           // Allow sorting by multiple columns
    defaultSort: [             // Initial sort state
      { colId: 'name', sort: 'asc' }
    ],
  },
}}
```

**Usage:**
- Click a column header to sort
- Shift+click to add secondary sort (multi-sort)
- Click again to toggle ascending/descending/none

---

### Filtering

Add column filters and quick search.

```tsx
pluginConfig={{
  filtering: {
    debounce: 300,    // Delay before applying filter (ms)
    quickFilter: true, // Enable toolbar search box
  },
}}
```

**Filter Types:**
- `text` - Text contains, equals, starts with, ends with
- `number` - Equals, greater than, less than, between
- `date` - Equals, before, after, between
- `boolean` - True/false
- `select` - Dropdown with predefined options

---

### Pagination

Split large datasets into pages.

```tsx
pluginConfig={{
  pagination: {
    pageSize: 25,                    // Default rows per page
    pageSizes: [10, 25, 50, 100],    // Available page size options
  },
}}
```

**Features:**
- Navigate between pages
- Change page size
- "Show All" option
- Keyboard navigation

---

### Selection

Enable row and/or cell selection.

```tsx
pluginConfig={{
  selection: {
    mode: 'multiple',       // 'single' | 'multiple' | 'none'
    checkboxSelection: true, // Show checkbox column
    headerCheckbox: true,    // Show "select all" in header
  },
}}
```

**Events:**
```tsx
onSelectionChanged={(event) => {
  console.log('Selected rows:', event.selectedRows);
  console.log('Selected indices:', event.selectedIndices);
}}
```

---

### Column Resizing

Allow users to resize columns by dragging.

```tsx
pluginConfig={{
  columnResizing: {
    minWidth: 50,   // Minimum column width
    maxWidth: 500,  // Maximum column width
  },
}}
```

Also set per-column limits:
```tsx
{ id: 'name', field: 'name', minWidth: 100, maxWidth: 300, resizable: true }
```

---

### Column Dragging

Enable drag-and-drop column reordering.

```tsx
// No configuration needed, just include it
<WarperGrid
  data={data}
  columns={columns}
/>
```

Columns can be locked from moving:
```tsx
{ id: 'id', field: 'id', lockPosition: true }
```

---

### Column Menu

Add a dropdown menu to column headers.

```tsx
pluginConfig={{
  columnMenu: {
    suppressColumnMenu: false, // Set true to disable
  },
}}
```

**Default menu items:**
- Sort ascending/descending
- Clear sort
- Filter
- Hide column
- Pin left/right
- Auto-size column

---

### Cell Editing

Enable inline editing of cell values.

```tsx
pluginConfig={{
  cellEditing: {
    editTrigger: 'doubleClick', // 'click' | 'doubleClick' | 'keyPress'
    undoRedo: true,             // Enable Ctrl+Z / Ctrl+Y
    undoStackSize: 50,          // Max undo steps
  },
}}
```

Mark columns as editable:
```tsx
{ id: 'name', field: 'name', editable: true }
```

**Events:**
```tsx
onCellValueChanged={(event) => {
  console.log(`Changed ${event.colId} from ${event.oldValue} to ${event.newValue}`);
}}
```

---

### Cell Selection

Enable range selection for cells (Excel-like).

```tsx
pluginConfig={{
  cellSelection: {
    enableRangeSelection: true,
    enableFillHandle: true,  // Drag to fill cells
  },
}}
```

**Keyboard shortcuts:**
- Arrow keys to navigate
- Shift+Arrow to extend selection
- Ctrl+Shift+End to select to end

---

### Clipboard

Copy, cut, and paste cell values.

```tsx
pluginConfig={{
  clipboard: {
    enableCopy: true,
    enablePaste: true,
    enableCut: true,
    includeHeaders: false,  // Include headers when copying
  },
}}
```

**Keyboard shortcuts:**
- Ctrl+C - Copy selected cells
- Ctrl+X - Cut selected cells
- Ctrl+V - Paste

---

### Context Menu

Add right-click context menus.

```tsx
pluginConfig={{
  contextMenu: {
    suppressContextMenu: false,
  },
}}
```

**Default menu items:**
- Copy / Copy with headers
- Cut
- Paste
- Export selection
- Separator
- Column operations

---

### Export

Export grid data to various formats.

```tsx
pluginConfig={{
  export: {
    fileName: 'my-data',
    includeHeaders: true,
  },
}}
```

**API Methods:**
```tsx
// Access via grid API
gridRef.current?.api.exportToCsv({ fileName: 'export' });
gridRef.current?.api.exportToExcel({ fileName: 'export' });
gridRef.current?.api.exportToJson({ fileName: 'export' });
gridRef.current?.api.exportToPdf({ fileName: 'export' });
```

**Export Options:**
```tsx
const exportParams = {
  fileName: 'my-export',
  columnKeys: ['name', 'email', 'department'], // Specific columns
  onlySelected: true,  // Export only selected rows
  skipHeader: false,   // Include header row
};
gridRef.current?.api.exportToCsv(exportParams);
```

---

### Master-Detail

Expandable rows with nested content.

```tsx
pluginConfig={{
  masterDetail: {
    enabled: true,
    detailRowHeight: 200,
    getDetailRowData: async ({ data }) => {
      // Fetch detail data
      const response = await fetch(`/api/orders/${data.id}`);
      return response.json();
    },
    detailColumns: [
      { id: 'orderId', field: 'orderId', headerName: 'Order ID' },
      { id: 'product', field: 'product', headerName: 'Product' },
      { id: 'quantity', field: 'quantity', headerName: 'Qty' },
    ],
  },
}}
```

---

### Status Bar

Show grid statistics at the bottom.

```tsx
pluginConfig={{
  statusBar: {
    statusPanels: [
      { component: 'agTotalRowCountComponent' },
      { component: 'agFilteredRowCountComponent' },
      { component: 'agSelectedRowCountComponent' },
    ],
  },
}}
```

**Displays:**
- Total row count
- Filtered row count
- Selected row count
- Aggregation values (sum, avg, etc.)

---

### SQL Query

Query your data using SQL syntax.

```tsx
pluginConfig={{
  sqlQuery: {
    tableName: 'my_data',
    enableAutoComplete: true,
    maxRows: 10000,
    enableHistory: true,
  },
}}
```

**Features:**
- SQL editor with syntax highlighting
- Auto-completion for columns
- Query history
- Execute with Ctrl+Enter

**Example queries:**
```sql
SELECT * FROM my_data WHERE age > 30 ORDER BY name
SELECT department, COUNT(*) FROM my_data GROUP BY department
SELECT * FROM my_data WHERE name LIKE '%Smith%'
```

---

### Row Grouping

Group rows by column values.

```tsx
pluginConfig={{
  rowGrouping: {
    rowGroupPanelShow: 'always', // 'always' | 'onlyWhenGrouping' | 'never'
    groupDefaultExpanded: 1,      // Expand first level by default
  },
}}
```

**Note:** Row grouping uses SQL GROUP BY under the hood for performance.

---

## Combining Plugins

Plugins work together seamlessly:

```tsx
<WarperGrid
  data={data}
  columns={columns}
  height={600}
  pluginConfig={{
    // Core features
    sorting: { multiSort: true },
    filtering: { quickFilter: true },
    pagination: { pageSize: 50 },
    
    // Selection & editing
    selection: { mode: 'multiple', checkboxSelection: true },
    cellEditing: { editTrigger: 'doubleClick', undoRedo: true },
    cellSelection: { enableRangeSelection: true },
    clipboard: { enableCopy: true, enablePaste: true },
    
    // Column features
    columnResizing: { minWidth: 50 },
    columnMenu: {},
    
    // Advanced
    export: { fileName: 'my-export' },
    statusBar: {},
    contextMenu: {},
  }}
  onCellValueChanged={(e) => console.log('Changed:', e)}
  onSelectionChanged={(e) => console.log('Selected:', e.selectedRows)}
/>
```

## Performance Tips

1. **Enable only what you need** - Each plugin adds some overhead
2. **Use pagination for large datasets** - Reduces DOM nodes
3. **Debounce filtering** - Prevent excessive re-renders
4. **Virtualization is automatic** - Don't worry about rendering thousands of rows
