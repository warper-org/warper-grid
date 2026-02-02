# Getting Started with WarperGrid

This guide will help you set up WarperGrid in your React project in just a few minutes.

## Prerequisites

- Node.js 18 or later
- React 18 or later
- A package manager (npm, yarn, pnpm, or bun)

## Installation

Install WarperGrid using your preferred package manager:

```bash
# npm
npm install @itsmeadarsh/warper-grid

# yarn
yarn add @itsmeadarsh/warper-grid

# pnpm
pnpm add @itsmeadarsh/warper-grid

# bun
bun add @itsmeadarsh/warper-grid
```

## Basic Setup

### 1. Import Styles

First, import the WarperGrid styles in your app's entry point (e.g., `main.tsx` or `App.tsx`):

```tsx
import '@itsmeadarsh/warper-grid/styles';
```

### 2. Create Your First Grid

```tsx
import { WarperGrid } from '@itsmeadarsh/warper-grid';

// Define your data
const data = [
  { id: 1, name: 'Alice Johnson', email: 'alice@example.com', department: 'Engineering' },
  { id: 2, name: 'Bob Smith', email: 'bob@example.com', department: 'Marketing' },
  { id: 3, name: 'Carol Williams', email: 'carol@example.com', department: 'Sales' },
  { id: 4, name: 'David Brown', email: 'david@example.com', department: 'Engineering' },
  { id: 5, name: 'Eva Martinez', email: 'eva@example.com', department: 'HR' },
];

// Define your columns
const columns = [
  { id: 'id', field: 'id', headerName: 'ID', width: 80 },
  { id: 'name', field: 'name', headerName: 'Name', flex: 1 },
  { id: 'email', field: 'email', headerName: 'Email', flex: 1 },
  { id: 'department', field: 'department', headerName: 'Department', width: 150 },
];

function App() {
  return (
    <div className="p-4">
      <h1>My First WarperGrid</h1>
      <WarperGrid
        data={data}
        columns={columns}
        height={400}
      />
    </div>
  );
}

export default App;
```

## Adding Features

### Enable Sorting

Make columns sortable by adding `sortable: true`:

```tsx
const columns = [
  { id: 'id', field: 'id', headerName: 'ID', width: 80, sortable: true },
  { id: 'name', field: 'name', headerName: 'Name', flex: 1, sortable: true },
  { id: 'email', field: 'email', headerName: 'Email', flex: 1, sortable: true },
  { id: 'department', field: 'department', headerName: 'Department', width: 150, sortable: true },
];
```

### Enable Filtering

Add `filterable: true` to columns you want to filter:

```tsx
const columns = [
  { id: 'id', field: 'id', headerName: 'ID', width: 80, sortable: true, filterable: true, filterType: 'number' },
  { id: 'name', field: 'name', headerName: 'Name', flex: 1, sortable: true, filterable: true },
  { id: 'email', field: 'email', headerName: 'Email', flex: 1, sortable: true, filterable: true },
  { id: 'department', field: 'department', headerName: 'Department', width: 150, sortable: true, filterable: true },
];
```

### Enable Pagination

Add pagination configuration:

```tsx
<WarperGrid
  data={data}
  columns={columns}
  height={400}
  pluginConfig={{
    pagination: {
      pageSize: 10,
      pageSizes: [10, 25, 50, 100],
    },
  }}
/>
```

### Enable Row Selection

```tsx
<WarperGrid
  data={data}
  columns={columns}
  height={400}
  pluginConfig={{
    selection: {
      mode: 'multiple',
      checkboxSelection: true,
    },
  }}
  onSelectionChanged={(event) => {
    console.log('Selected rows:', event.selectedRows);
  }}
/>
```

## TypeScript Support

WarperGrid is built with TypeScript. Define your data type for full type safety:

```tsx
import { WarperGrid, type ColumnDef } from '@itsmeadarsh/warper-grid';

// Define your data type
interface Employee {
  id: number;
  name: string;
  email: string;
  department: string;
  salary: number;
  startDate: Date;
}

// Type-safe columns
const columns: ColumnDef<Employee>[] = [
  { id: 'id', field: 'id', headerName: 'ID', width: 80 },
  { id: 'name', field: 'name', headerName: 'Name', flex: 1 },
  { id: 'email', field: 'email', headerName: 'Email', flex: 1 },
  { id: 'department', field: 'department', headerName: 'Department', width: 150 },
  { 
    id: 'salary', 
    field: 'salary', 
    headerName: 'Salary',
    valueFormatter: ({ value }) => `$${(value as number).toLocaleString()}`,
  },
  { 
    id: 'startDate', 
    field: 'startDate', 
    headerName: 'Start Date',
    valueFormatter: ({ value }) => (value as Date).toLocaleDateString(),
  },
];

function App() {
  const employees: Employee[] = [
    // ... your data
  ];

  return <WarperGrid<Employee> data={employees} columns={columns} height={400} />;
}
```

## Next Steps

- [Column Definitions](./columns.md) - Learn about all column options
- [Plugin System](./plugins.md) - Enable advanced features
- [API Reference](./api.md) - Programmatic grid control
- [Events](./events.md) - Handle user interactions
- [Theming](./theming.md) - Customize the appearance
