# WarperGrid: The Ultimate React Data Grid

WarperGrid is a high-performance, full-featured **React** data grid built on the **Warper** virtualization library. It is designed as a closed-source, AG Grid competitor that emphasizes extreme performance (10M+ rows at 120+ FPS), modularity, and ease of use. By default, it is plug-and-play: you instantiate the grid with your data/columns and then **attach** only the features you need. WarperGrid uses [shadcn/ui](https://ui.shadcn.com/docs) components for its UI, ensuring beautiful, accessible styling out of the box. The core rendering engine is a Rust/WebAssembly virtualizer (already built by Warper) that guarantees ultra-low-latency scrolling and updates. WarperGrid targets modern browsers (Chrome, Firefox, Safari, Edge) on desktop and mobile, and is fully responsive and touch-friendly.

## Core Virtualization (Warper Engine)

- **Ultra-Fast Rendering**: WarperGrid’s core is the Warper virtualization library – a Rust/WASM engine that renders only visible rows/columns. It handles 10,000,000+ rows effortlessly. Performance benchmarks claim “120+ FPS – smooth scrolling even with millions of items”.

- **Efficient Algorithms**: Lookup operations on fixed-height grids are O(1), and variable-size rows use a Fenwick tree in O(log N) time. Smart overscan and “skip-render” optimizations minimize wasted work.

- **Cross-Browser & Lightweight**: Fully tested on all major browsers. The core is tiny (~6KB gzipped) and written in TypeScript for strong typings.

- **Real-Time & Reactive**: WarperGrid supports real-time data updates (e.g., via WebSockets) with minimal overhead. Reactivity and change detection are optimized for massive grids.

## Feature Set (All AG Grid Features)

WarperGrid will implement *all* of AG Grid’s core **Community** and advanced **Enterprise** features via modular plugins. Key features include:

- **Data Sorting & Filtering**: Multi-column sorting, flexible filtering (text, number, date, set, multi-filter, floating filters, quick-filter bar). All column filters (including Excel-style filter and custom filter components).

- **Columns & Layout**: Column resizing, moving, grouping (header groups), pinning (freeze left/right), and spanning. Support for column auto-sizing and total row spans.

- **Row Operations**: Pagination, infinite/incremental loading (Client/Server-side row models), row pinning (top/bottom), full-width rows. Master–detail (nested) row views and tree data hierarchies for parent/child records.

- **Grouping, Aggregation & Pivot**: Hierarchical row grouping (multi-level), automatic aggregations (sum/avg/count/min/max or custom). Built-in pivot tables to pivot and aggregate columns. “Drag & drop” group panel for ad-hoc grouping.

- **Cell Editing & Custom Rendering**: Rich cell editing with various built-in editors (text, number, date picker, checkbox, select, large text, etc.) and validation. Undo/redo support. Custom cell renderers (React components) and formatters. Conditional styling and tooltips.

- **Selection & Range**: Row selection (single/multi), cell selection, and Excel-style **range selection** with fill-handle. Clipboard operations: copy/paste between cells or to/from Excel.

- **Theming & Styling**: Multiple built-in themes (light, dark, compact, material-like) and Tailwind-based theming via shadcn/ui. Full CSS-vars and theming API for custom themes. Responsive design for mobile/tablet.

- **Accessibility & Internationalization**: Full ARIA support, keyboard navigation, screen reader compatibility. Right-to-left (RTL) text support and customizable locale/language strings.

- **Charts & Sparklines**: Integrated charting (Coming Soon) – users can select cells/ranges and generate charts in-place. Sparkline mini-charts within cells.

- **Export/Import**: CSV export and **Excel export** (including styles, multiple sheets, formulas) for enterprise. Printing support and copy-paste integration with spreadsheets. (Importing Excel/CSV can be done via plugins, e.g., using SheetJS.)

- **Tool Panels & Menus**: Configurable sidebars and floating panels (column selector panel, filter panel). Custom context menus and column menu. Status bar showing counts or aggregations.

- **Formulas & AI (Future)**: Enterprise features like spreadsheet formulas inside cells, and an AI Toolkit for natural-language interaction with the grid (chat-like filtering/sorting) – to be added in later versions.

These features are implemented as **plugins**. For example:

```javascript
const grid = WarperGrid.create({ data, columns });
grid.attach(['sorting', 'filtering', 'pivot', 'charts']);
// or to load all built-in features by default:
grid.attach(['*']);
```

Each plugin lives in its own folder/module, so features can be easily added, configured, or removed without bloating the core. By default, WarperGrid is “base grid only” (virtualized table structure), and functionality is opt-in via `attach()`.

## Plugin System and Extensibility

WarperGrid uses a **module/plugin architecture**:

- **Modular Plugins**: Every feature (sorting, filtering, grouping, etc.) is a self-contained plugin. You import or attach only what you need. This keeps the core light and allows tree-shaking of unused parts.

- **Attach/Detach API**: The `attach(pluginList, config?)` method loads plugins into a grid instance. Use `attach(['*'])` to load all official plugins with default config. Plugins can also be attached later to an existing grid.

- **Custom Plugins**: Developers can write their own plugins. A plugin consists of React components (e.g., a filter dropdown), state logic, and integration hooks. The grid exposes a plugin registration API for custom plugins.

- **Configuration**: Each plugin accepts optional configuration. For example, `attach(['filtering'], { filtering: { debounce: 300 } })`.

- **Future-Proof**: New features (e.g., advanced analytics, custom cell types) can be released as additional plugins, easily integrated. This avoids monolithic updates and allows clients to ship only needed code.

## React & UI Framework (shadcn/ui)

WarperGrid is **React-only** (no Angular/Vue support). It leverages [shadcn/ui](https://ui.shadcn.com/docs), a Tailwind CSS-based component system, for all its UI widgets.

### Default Theming & Initialization

To initialize WarperGrid with the default Emerald theme and JetBrains Mono font, use the following command:

```bash
bunx --bun shadcn@latest create --preset "https://ui.shadcn.com/init?base=radix&style=vega&baseColor=zinc&theme=emerald&iconLibrary=lucide&font=jetbrains-mono&menuAccent=subtle&menuColor=inverted&radius=none&template=vite" --template vite
```

- **Open Code Components**: shadcn/ui provides the actual component code for things like tables, buttons, dropdowns, etc. We use and customize these for WarperGrid’s controls.

- **Beautiful Defaults**: Default styles are clean and consistent, giving WarperGrid a polished look out of the box.

- **Theming and Customization**: Since shadcn/ui is open source, developers can tweak any component. WarperGrid will provide theme variables (colors, spacing) compatible with shadcn’s theming system.

- **Accessible UI**: The components are ARIA-compliant and keyboard-friendly by design.

- **Distribution Schema**: We can use shadcn’s CLI/schema to manage component versions if needed.

### Example usage in React:

```jsx
import React from 'react';
import { WarperGrid } from 'warper-grid';

function App() {
  const data = [ /* array of row objects */ ];
  const columns = [ /* column definitions */ ];

  const gridRef = React.useRef();
  React.useEffect(() => {
    gridRef.current.attach(['sorting','filtering','pagination']);
  }, []);

  return (
    <div>
      <WarperGrid ref={gridRef} data={data} columns={columns} />
    </div>
  );
}
```

## Client-Side SQL Engine

An optional “SQL Playground” plugin will let users write SQL queries against the grid’s data (rows/columns). We will integrate an existing in-browser SQL engine, since building one from scratch is impractical. Good options include:

- **DuckDB-WASM**: A high-performance, columnar OLAP database compiled to WebAssembly. It supports SQL queries over large datasets (CSV, Parquet, Arrow, JSON) right in the browser. DuckDB-WASM automatically uses multi-threading (via WASM workers) and is ideal for analytics-style queries. The SQLPlayground plugin could spin up a DuckDB instance, ingest the grid data into a table, and execute user queries, returning result rows back to the grid.

- **SQLite (sql.js)**: SQLite compiled to JavaScript/WASM. It lets you create an in-memory SQL database entirely in the browser. Good for transactional queries or smaller datasets. The grid data can be loaded into the sql.js database; then arbitrary SELECT/UPDATE/DELETE queries can be run. Everything stays client-side (data is lost on refresh, but that may be fine).

- **Other (Less Recommended)**: AlaSQL or Lovefield are alternatives, but SQL.js and DuckDB have stronger community support and performance. (We avoid AlaSQL due to support concerns.)

The SQL plugin will offer a query editor UI (free-text SQL input) and a results view. For example, a user could type `SELECT Name, Age FROM grid WHERE Country='USA' ORDER BY Age DESC;` and the plugin would filter/highlight those rows. (This is optional – clients who don’t need SQL can skip loading that plugin.)

## Example Applications

WarperGrid will include various example projects in an `examples/` folder to demonstrate usage:

- **Basic Grid**: Minimal setup with static data, attaching core plugins.

- **HTML Table Adapter**: Convert an existing `<table>` element into a WarperGrid (showing how to "upgrade" legacy tables).

- **Excel/CSV Import**: Load a `.xlsx` or `.csv` file (using e.g., [SheetJS]) and display it. This example shows a plugin that parses a file and then feeds the data to WarperGrid.

- **Remote Data & Server-side**: Example with large data loaded via an API, demonstrating pagination or server-side row models.

- **Mobile/Responsive Demo**: Showcase WarperGrid on mobile devices with responsive layout and touch support.

Each example will use `attach()` to pick features. For instance:

```javascript
const grid = WarperGrid.create({ data, columns });
grid.attach(['sorting', 'filtering', 'export', 'columnMenu']);
```

The examples will also illustrate good code organization (e.g., separate files for column definitions, plugin configs, React components).

## Summary

In summary, WarperGrid aims to be a drop-in replacement for AG Grid in React projects, with a focus on simplicity and performance. By leveraging Warper’s WASM virtualization and a plugin-based design, it will support every AG Grid feature (sorting, filtering, grouping, pivot, charts, etc.) while staying modular. Shadcn/ui provides the polished UI components. Developers can get started with one command (install & import), and then include only the functionality they need via `attach()`. With WarperGrid, the goal is “AG Grid – all the power, but open design, React-first, and blazing-fast”.

---

### References & Citations

1. **Warper Virtualization Library**: [GitHub - warper-org/warper](https://github.com/warper-org/warper)

1. **shadcn/ui Documentation**: [Introduction - shadcn/ui](https://ui.shadcn.com/docs)

1. **AG Grid Features**: [Community vs. Enterprise | AG Grid](https://www.ag-grid.com/angular-data-grid/community-vs-enterprise/)

1. **AG Grid Enterprise**: [Advanced Data Grid Features](https://www.ag-grid.com/landing-pages/enterprise-data-grid/)

1. **DuckDB-Wasm**: [Efficient Analytical SQL in the Browser](https://duckdb.org/2021/10/29/duckdb-wasm)

1. **sql.js**: [SQLite for JavaScript](https://github.com/sql-js/sql.js)