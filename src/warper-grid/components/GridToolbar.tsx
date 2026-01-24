import { useState, useCallback } from 'react';
import { Search, X, Download } from 'lucide-react';
import type { RowData, GridApi } from '../types';

// ============================================================================
// Grid Toolbar Component
// ============================================================================

interface GridToolbarProps<TData extends RowData> {
  api: GridApi<TData>;
  showQuickFilter?: boolean;
  showExport?: boolean;
}

export function GridToolbar<TData extends RowData>({
  api,
  showQuickFilter = true,
  showExport = true,
}: GridToolbarProps<TData>) {
  const [quickFilterValue, setQuickFilterValue] = useState('');

  const handleQuickFilterChange = useCallback(
    (value: string) => {
      setQuickFilterValue(value);
      api.setQuickFilter(value);
    },
    [api]
  );

  const clearQuickFilter = useCallback(() => {
    setQuickFilterValue('');
    api.setQuickFilter('');
  }, [api]);

  const handleExport = useCallback(() => {
    api.exportToCsv({ fileName: 'grid-export.csv' });
  }, [api]);

  return (
    <div className="warper-grid-toolbar flex items-center gap-4 px-4 py-2 border-b border-[var(--border)] bg-[var(--muted)]">
      {/* Quick Filter */}
      {showQuickFilter && (
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted-foreground)]" />
            <input
              type="text"
              placeholder={'Quick filter (supports /regex/, -negation, "phrase", OR with |)'}
              value={quickFilterValue}
              onChange={(e) => handleQuickFilterChange(e.target.value)}
              className="w-full h-9 pl-9 pr-9 text-sm border border-[var(--border)] rounded-md bg-[var(--background)] text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
            />
            {quickFilterValue && (
              <button
                onClick={clearQuickFilter}
                className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => api.undo?.()}
          disabled={!api.canUndo?.()}
          className="h-9 px-3 flex items-center gap-2 text-sm border border-[var(--border)] rounded-md bg-[var(--background)] text-[var(--foreground)] hover:bg-[var(--accent)] disabled:opacity-50"
          title="Undo (Ctrl+Z)"
        >
          ⎌ Undo
        </button>

        <button
          onClick={() => api.redo?.()}
          disabled={!api.canRedo?.()}
          className="h-9 px-3 flex items-center gap-2 text-sm border border-[var(--border)] rounded-md bg-[var(--background)] text-[var(--foreground)] hover:bg-[var(--accent)] disabled:opacity-50"
          title="Redo (Ctrl+Y)"
        >
          ↺ Redo
        </button>

        {showExport && (
          <button
            onClick={handleExport}
            className="h-9 px-3 flex items-center gap-2 text-sm border border-[var(--border)] rounded-md bg-[var(--background)] text-[var(--foreground)] hover:bg-[var(--accent)]"
          >
            <Download className="h-4 w-4" />
            Export
          </button>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Quick Filter Component (Standalone)
// ============================================================================

interface QuickFilterProps<TData extends RowData> {
  api: GridApi<TData>;
  placeholder?: string;
  className?: string;
}

export function QuickFilter<TData extends RowData>({
  api,
  placeholder = 'Search...',
  className,
}: QuickFilterProps<TData>) {
  const [value, setValue] = useState('');

  const handleChange = useCallback(
    (newValue: string) => {
      setValue(newValue);
      api.setQuickFilter(newValue);
    },
    [api]
  );

  const clear = useCallback(() => {
    setValue('');
    api.setQuickFilter('');
  }, [api]);

  return (
    <div className={`relative ${className}`}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted-foreground)]" />
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        className="w-full h-9 pl-9 pr-9 text-sm border border-[var(--border)] rounded-md bg-[var(--background)] text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
      />
      {value && (
        <button
          onClick={clear}
          className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
