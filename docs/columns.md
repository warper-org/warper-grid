# Column Definitions

This guide covers all the options available when defining columns in WarperGrid.

## Basic Column Definition

Every column requires an `id`. All other properties are optional:

```tsx
interface ColumnDef<TData> {
  id: string;          // Required: Unique identifier
  field?: string;      // Field name in your data object
  headerName?: string; // Display name in the header
}
```

## Column Sizing

### Fixed Width

```tsx
{ id: 'id', field: 'id', headerName: 'ID', width: 80 }
```

### Min/Max Width

```tsx
{ 
  id: 'name', 
  field: 'name', 
  headerName: 'Name', 
  width: 200,
  minWidth: 100,
  maxWidth: 400,
}
```

### Flex Sizing

Flex columns automatically fill available space:

```tsx
// Takes 1 part of remaining space
{ id: 'name', field: 'name', headerName: 'Name', flex: 1 }

// Takes 2 parts of remaining space (twice as wide as flex: 1)
{ id: 'description', field: 'description', headerName: 'Description', flex: 2 }
```

## Column Alignment

```tsx
// Cell alignment
{ id: 'price', field: 'price', headerName: 'Price', align: 'right' }

// Header alignment
{ id: 'price', field: 'price', headerName: 'Price', headerAlign: 'center' }

// Options: 'left' | 'center' | 'right'
```

## Column Pinning

Pin columns to stay visible while scrolling:

```tsx
// Pin to left
{ id: 'id', field: 'id', headerName: 'ID', pinned: 'left' }

// Pin to right
{ id: 'actions', headerName: 'Actions', pinned: 'right' }
```

## Column Visibility

```tsx
// Hidden column (still in data, just not displayed)
{ id: 'internalId', field: 'internalId', hide: true }

// Lock visibility (cannot be hidden by user)
{ id: 'name', field: 'name', headerName: 'Name', lockVisible: true }

// Lock position (cannot be moved by user)
{ id: 'id', field: 'id', headerName: 'ID', lockPosition: true }
```

## Feature Toggles

### Sorting

```tsx
{ 
  id: 'name', 
  field: 'name', 
  headerName: 'Name',
  sortable: true,
}
```

### Filtering

```tsx
{ 
  id: 'name', 
  field: 'name', 
  headerName: 'Name',
  filterable: true,
  filterType: 'text', // 'text' | 'number' | 'date' | 'boolean' | 'select'
}
```

### Resizing

```tsx
{ 
  id: 'name', 
  field: 'name', 
  headerName: 'Name',
  resizable: true,
}
```

### Editing

```tsx
{ 
  id: 'quantity', 
  field: 'quantity', 
  headerName: 'Qty',
  editable: true,
}
```

## Custom Value Getter

Get the cell value from complex data structures:

```tsx
{
  id: 'fullName',
  headerName: 'Full Name',
  valueGetter: ({ data }) => `${data.firstName} ${data.lastName}`,
}
```

## Value Formatter

Format the display value without changing the underlying data:

```tsx
{
  id: 'price',
  field: 'price',
  headerName: 'Price',
  valueFormatter: ({ value }) => `$${(value as number).toFixed(2)}`,
}
```

```tsx
{
  id: 'date',
  field: 'createdAt',
  headerName: 'Created',
  valueFormatter: ({ value }) => new Date(value as string).toLocaleDateString(),
}
```

## Custom Cell Renderer

Render custom React components in cells:

```tsx
{
  id: 'status',
  field: 'status',
  headerName: 'Status',
  cellRenderer: ({ value }) => (
    <span className={`badge ${value === 'active' ? 'badge-green' : 'badge-red'}`}>
      {value}
    </span>
  ),
}
```

### With Actions

```tsx
{
  id: 'actions',
  headerName: 'Actions',
  width: 120,
  cellRenderer: ({ data, api }) => (
    <div className="flex gap-2">
      <button onClick={() => handleEdit(data)}>Edit</button>
      <button onClick={() => handleDelete(data)}>Delete</button>
    </div>
  ),
}
```

### With Progress Bar

```tsx
{
  id: 'progress',
  field: 'progress',
  headerName: 'Progress',
  cellRenderer: ({ value }) => (
    <div className="w-full bg-gray-200 rounded-full h-2.5">
      <div 
        className="bg-blue-600 h-2.5 rounded-full" 
        style={{ width: `${value}%` }}
      />
    </div>
  ),
}
```

## Custom Header Renderer

```tsx
{
  id: 'name',
  field: 'name',
  headerName: 'Name',
  headerRenderer: ({ column, sortDirection, toggleSort }) => (
    <div className="flex items-center gap-2 cursor-pointer" onClick={toggleSort}>
      <span>{column.headerName}</span>
      {sortDirection === 'asc' && <ArrowUp className="w-4 h-4" />}
      {sortDirection === 'desc' && <ArrowDown className="w-4 h-4" />}
    </div>
  ),
}
```

## Custom Cell Editor

```tsx
{
  id: 'category',
  field: 'category',
  headerName: 'Category',
  editable: true,
  cellEditor: ({ value, stopEditing, setValue }) => (
    <select
      defaultValue={value as string}
      onChange={(e) => setValue(e.target.value)}
      onBlur={() => stopEditing()}
      autoFocus
    >
      <option value="electronics">Electronics</option>
      <option value="clothing">Clothing</option>
      <option value="food">Food</option>
    </select>
  ),
}
```

## Cell Styling

### Static Class

```tsx
{
  id: 'name',
  field: 'name',
  headerName: 'Name',
  cellClass: 'font-bold text-blue-600',
}
```

### Dynamic Class

```tsx
{
  id: 'stock',
  field: 'stock',
  headerName: 'Stock',
  cellClass: ({ value }) => {
    if ((value as number) < 10) return 'text-red-600 font-bold';
    if ((value as number) < 50) return 'text-yellow-600';
    return 'text-green-600';
  },
}
```

### Static Style

```tsx
{
  id: 'price',
  field: 'price',
  headerName: 'Price',
  cellStyle: { fontWeight: 'bold', textAlign: 'right' },
}
```

### Dynamic Style

```tsx
{
  id: 'change',
  field: 'change',
  headerName: 'Change',
  cellStyle: ({ value }) => ({
    color: (value as number) >= 0 ? 'green' : 'red',
    fontWeight: 'bold',
  }),
}
```

## Custom Comparator

Override the default sorting behavior:

```tsx
{
  id: 'priority',
  field: 'priority',
  headerName: 'Priority',
  sortable: true,
  comparator: (a, b) => {
    const order = { high: 0, medium: 1, low: 2 };
    return order[a as keyof typeof order] - order[b as keyof typeof order];
  },
}
```

## Custom Filter Function

```tsx
{
  id: 'tags',
  field: 'tags',
  headerName: 'Tags',
  filterable: true,
  filterFn: (value, filterValue, row) => {
    const tags = value as string[];
    return tags.some(tag => 
      tag.toLowerCase().includes((filterValue as string).toLowerCase())
    );
  },
}
```

## Tooltips

```tsx
{
  id: 'description',
  field: 'description',
  headerName: 'Description',
  tooltipValueGetter: ({ value }) => `Full description: ${value}`,
}
```

## Column Groups

Group related columns under a parent header:

```tsx
{
  id: 'contactInfo',
  headerName: 'Contact Information',
  children: [
    { id: 'email', field: 'email', headerName: 'Email', flex: 1 },
    { id: 'phone', field: 'phone', headerName: 'Phone', width: 150 },
    { id: 'address', field: 'address', headerName: 'Address', flex: 1 },
  ],
}
```

## Complete Example

```tsx
import { WarperGrid, type ColumnDef } from '@itsmeadarsh/warper-grid';

interface Product {
  id: number;
  name: string;
  category: string;
  price: number;
  stock: number;
  status: 'active' | 'inactive';
}

const columns: ColumnDef<Product>[] = [
  { 
    id: 'id', 
    field: 'id', 
    headerName: 'ID', 
    width: 80,
    pinned: 'left',
    sortable: true,
  },
  { 
    id: 'name', 
    field: 'name', 
    headerName: 'Product Name', 
    flex: 1,
    sortable: true,
    filterable: true,
    editable: true,
  },
  { 
    id: 'category', 
    field: 'category', 
    headerName: 'Category', 
    width: 150,
    sortable: true,
    filterable: true,
    filterType: 'select',
  },
  { 
    id: 'price', 
    field: 'price', 
    headerName: 'Price', 
    width: 120,
    align: 'right',
    sortable: true,
    filterable: true,
    filterType: 'number',
    valueFormatter: ({ value }) => `$${(value as number).toFixed(2)}`,
    editable: true,
  },
  { 
    id: 'stock', 
    field: 'stock', 
    headerName: 'Stock', 
    width: 100,
    align: 'center',
    sortable: true,
    cellStyle: ({ value }) => ({
      color: (value as number) < 10 ? 'red' : 'inherit',
      fontWeight: (value as number) < 10 ? 'bold' : 'normal',
    }),
  },
  { 
    id: 'status', 
    field: 'status', 
    headerName: 'Status', 
    width: 100,
    cellRenderer: ({ value }) => (
      <span className={`badge ${value === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
        {value}
      </span>
    ),
  },
  { 
    id: 'actions', 
    headerName: 'Actions', 
    width: 120,
    pinned: 'right',
    cellRenderer: ({ data }) => (
      <div className="flex gap-2">
        <button onClick={() => console.log('Edit:', data)}>✏️</button>
        <button onClick={() => console.log('Delete:', data)}>🗑️</button>
      </div>
    ),
  },
];
```
