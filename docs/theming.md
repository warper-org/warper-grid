# Theming & Styling

WarperGrid is built with Tailwind CSS and can be fully customized to match your application's design.

## CSS Variables

Override these CSS variables to change the grid's appearance:

```css
/* Add to your global CSS */
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
```

## Dark Mode

Add dark mode support:

```css
/* Dark mode variables */
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
```

## Custom Themes

### Blue Theme

```css
.warper-grid.theme-blue {
  --wg-primary: #2563eb;
  --wg-header-bg: #eff6ff;
  --wg-header-text: #1e40af;
  --wg-row-selected: #dbeafe;
  --wg-border-color: #bfdbfe;
}
```

### Green Theme

```css
.warper-grid.theme-green {
  --wg-primary: #16a34a;
  --wg-header-bg: #f0fdf4;
  --wg-header-text: #166534;
  --wg-row-selected: #dcfce7;
  --wg-border-color: #bbf7d0;
}
```

### Purple Theme

```css
.warper-grid.theme-purple {
  --wg-primary: #9333ea;
  --wg-header-bg: #faf5ff;
  --wg-header-text: #6b21a8;
  --wg-row-selected: #f3e8ff;
  --wg-border-color: #e9d5ff;
}
```

Apply themes:

```tsx
<WarperGrid
  data={data}
  columns={columns}
  className="theme-blue"
/>
```

## Grid Props for Styling

### className

Add custom CSS classes:

```tsx
<WarperGrid
  data={data}
  columns={columns}
  className="my-custom-grid shadow-lg rounded-lg"
/>
```

### style

Inline styles:

```tsx
<WarperGrid
  data={data}
  columns={columns}
  style={{ border: '2px solid #3b82f6' }}
/>
```

### striped

Enable alternating row colors:

```tsx
<WarperGrid
  data={data}
  columns={columns}
  striped
/>
```

### bordered

Show cell borders:

```tsx
<WarperGrid
  data={data}
  columns={columns}
  bordered
/>
```

### compact

Reduce row height for dense data:

```tsx
<WarperGrid
  data={data}
  columns={columns}
  compact
/>
```

## Column Styling

### Static Cell Class

```tsx
{
  id: 'name',
  field: 'name',
  headerName: 'Name',
  cellClass: 'font-bold text-blue-600',
  headerClass: 'bg-blue-50',
}
```

### Dynamic Cell Class

```tsx
{
  id: 'stock',
  field: 'stock',
  headerName: 'Stock',
  cellClass: ({ value }) => {
    const stock = value as number;
    if (stock === 0) return 'bg-red-100 text-red-800 font-bold';
    if (stock < 10) return 'bg-yellow-100 text-yellow-800';
    return 'text-green-600';
  },
}
```

### Static Cell Style

```tsx
{
  id: 'price',
  field: 'price',
  headerName: 'Price',
  cellStyle: {
    fontFamily: 'monospace',
    textAlign: 'right',
    fontWeight: 500,
  },
}
```

### Dynamic Cell Style

```tsx
{
  id: 'change',
  field: 'change',
  headerName: 'Change %',
  cellStyle: ({ value }) => ({
    color: (value as number) >= 0 ? '#16a34a' : '#dc2626',
    fontWeight: 'bold',
    backgroundColor: (value as number) >= 0 ? '#f0fdf4' : '#fef2f2',
  }),
}
```

### Global Cell Style

Apply styles to all cells:

```tsx
<WarperGrid
  data={data}
  columns={columns}
  cellStyle={{
    fontSize: '13px',
    padding: '8px 12px',
  }}
/>
```

Or dynamically:

```tsx
<WarperGrid
  data={data}
  columns={columns}
  cellStyle={({ value, column }) => ({
    textAlign: column.align || 'left',
    opacity: value === null ? 0.5 : 1,
  })}
/>
```

## Custom Cell Renderers

Create visually rich cells:

### Status Badge

```tsx
{
  id: 'status',
  field: 'status',
  headerName: 'Status',
  cellRenderer: ({ value }) => {
    const colors = {
      active: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      inactive: 'bg-gray-100 text-gray-800',
      error: 'bg-red-100 text-red-800',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[value as string]}`}>
        {value}
      </span>
    );
  },
}
```

### Progress Bar

```tsx
{
  id: 'progress',
  field: 'progress',
  headerName: 'Progress',
  cellRenderer: ({ value }) => {
    const percent = value as number;
    const color = percent >= 80 ? 'bg-green-500' : percent >= 50 ? 'bg-yellow-500' : 'bg-red-500';
    return (
      <div className="flex items-center gap-2">
        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div className={`h-full ${color}`} style={{ width: `${percent}%` }} />
        </div>
        <span className="text-xs text-gray-500 w-10 text-right">{percent}%</span>
      </div>
    );
  },
}
```

### Avatar with Name

```tsx
{
  id: 'user',
  headerName: 'User',
  cellRenderer: ({ data }) => (
    <div className="flex items-center gap-2">
      <img 
        src={data.avatar} 
        alt={data.name}
        className="w-8 h-8 rounded-full object-cover"
      />
      <div>
        <div className="font-medium">{data.name}</div>
        <div className="text-xs text-gray-500">{data.email}</div>
      </div>
    </div>
  ),
}
```

### Rating Stars

```tsx
{
  id: 'rating',
  field: 'rating',
  headerName: 'Rating',
  cellRenderer: ({ value }) => {
    const rating = value as number;
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map(star => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  },
}
```

## Responsive Design

### Adapt to Container

```tsx
<div className="w-full h-[calc(100vh-200px)]">
  <WarperGrid
    data={data}
    columns={columns}
    height="100%"
    width="100%"
  />
</div>
```

### Hide Columns on Mobile

```tsx
const columns = [
  { id: 'id', field: 'id', headerName: 'ID', width: 60 },
  { id: 'name', field: 'name', headerName: 'Name', flex: 1 },
  // Hide on mobile
  { id: 'email', field: 'email', headerName: 'Email', flex: 1, hide: isMobile },
  { id: 'phone', field: 'phone', headerName: 'Phone', width: 150, hide: isMobile },
  { id: 'actions', headerName: 'Actions', width: 80 },
];
```

## Animation

Add smooth transitions:

```css
.warper-grid .warper-grid-row {
  transition: background-color 0.15s ease;
}

.warper-grid .warper-grid-cell {
  transition: all 0.1s ease;
}

/* Highlight newly updated cells */
.warper-grid .warper-grid-cell--updated {
  animation: highlight 1s ease-out;
}

@keyframes highlight {
  0% { background-color: #fef08a; }
  100% { background-color: transparent; }
}
```

## Complete Theme Example

```css
/* Custom corporate theme */
.warper-grid.corporate-theme {
  /* Typography */
  --wg-font-size: 13px;
  font-family: 'Inter', system-ui, sans-serif;
  
  /* Colors */
  --wg-background: #ffffff;
  --wg-header-bg: linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%);
  --wg-header-text: #0f172a;
  --wg-cell-text: #334155;
  
  /* Borders */
  --wg-border-color: #e2e8f0;
  --wg-header-border: #cbd5e1;
  
  /* Selection */
  --wg-row-selected: #e0f2fe;
  --wg-cell-selected: #bae6fd;
  --wg-primary: #0284c7;
  
  /* Sizing */
  --wg-header-height: 48px;
  --wg-row-height: 44px;
  
  /* Shadows */
  box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
  border-radius: 8px;
  overflow: hidden;
}

.corporate-theme .warper-grid-header {
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-size: 11px;
}

.corporate-theme .warper-grid-row:hover {
  background-color: #f8fafc;
}

.corporate-theme .warper-grid-cell {
  border-right: 1px solid var(--wg-border-color);
}
```

Usage:

```tsx
<WarperGrid
  data={data}
  columns={columns}
  className="corporate-theme"
  striped
/>
```
