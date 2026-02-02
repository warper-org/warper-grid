WarperGrid Features & Quick Reference

This file documents useful features, keyboard shortcuts, and tips for using WarperGrid features (formulas, quick filters, editing, and plugins).

Quick Filter (search)
- Supports normal token search: "john sales" matches rows containing both tokens.
- Quoted phrases: """exact phrase""" will search for the exact phrase.
- Negation: prefix with '-' to exclude rows containing a token, e.g. "-temp".
- OR groups: use pipe `|` inside a token to match any term, e.g. "john|jane".
- Regex: wrap your pattern in slashes to run a regex against the whole row, e.g. `/^Amelia/` or `/\d{3}@company\.com/i`.

Formulas
- Enter formulas in a cell by starting your value with `=`.
- Examples:
  - `=SUM(A1:A10)` — sums values in a range
  - `=AVG(B2:B10)` — average
  - `=SUM(A1, 10, B2)` — mixed args
  - Use cell references like `A1`, `B2` and ranges `A1:B10`.
- If a formula fails it will display `#ERROR` and a console warning will be printed.

Editing & Shortcuts
- Enter or F2 to start editing the active cell.
- Esc cancels editing.
- While editing, type and press Enter or click outside to commit.
- Copy: Cmd/Ctrl+C — Copies cell or first selected range.
- Paste: Cmd/Ctrl+V — Pastes into active cell (range paste coming soon).

Plugins
- Built-in plugins available and enabled via `gridRef.current?.attach(['*'])` or individually:
  - sorting, filtering, pagination, selection, columnResizing, columnMoving, export, contextMenu, clipboard, columnMenu, cellEditing, statusBar
- To customize behavior, pass plugin config when attaching, e.g. `gridRef.current?.attach(['clipboard'], { clipboard: { includeHeaders: true } })`

Export Formats
- **CSV Export**: `api.exportToCsv()` or context menu → Export → CSV Export
- **Excel Export**: `api.exportToExcel()` or context menu → Export → Excel Export
  - Supports styled headers, auto-width columns, and alternate row colors
  - Options: `{ sheetName, includeStyles, headerBgColor, alternateRowColor, autoWidth }`
- **JSON Export**: `api.exportToJson()` or context menu → Export → JSON Export
  - Options: `{ pretty, includeMetadata }` - set `includeMetadata: true` to include column definitions
- **PDF Export**: `api.exportToPdf()` or context menu → Export → PDF Export
  - Options: `{ orientation, pageSize, title, fontSize, headerBgColor, alternateRowColors }`
- All export methods support `onlySelected: true` to export only selected rows

Column Pinning
- Pin columns to left or right via:
  - Column menu → Pin Column → Pin Left/Pin Right
  - Context menu → Pin Column → Pin Left/Pin Right
  - API: `api.setColumnPinned(colId, 'left' | 'right' | false)`
- Pinned columns stay visible when scrolling horizontally

Notes & Roadmap
- Range paste/apply and advanced clipboard paste behavior will be extended to support multi-cell paste in a future update.
- Formula support uses formulajs where available; some functions have limited behavior (array arguments, ranges).
- For feedback or bug reports, open an issue in the repository with reproduction steps.
