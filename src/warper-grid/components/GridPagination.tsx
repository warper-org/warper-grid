import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { usePagination } from '../plugins/pagination';
import type { RowData, GridApi } from '../types';

// ============================================================================
// Grid Pagination Component
// ============================================================================

interface GridPaginationProps<TData extends RowData> {
  api: GridApi<TData>;
  pageSizes?: number[];
}

export function GridPagination<TData extends RowData>({
  api,
  pageSizes = [10, 25, 50, 100, 500, 1000, 5000, 10000, 100000],
}: GridPaginationProps<TData>) {
  const pagination = usePagination(api);
  // Use actual total row count (pre-filter) for "All" option
  const totalRows = api.getRowCount();

  // Adapt page sizes to dataset size and current selection
  let availableSizes = pageSizes.filter(size => size < totalRows);
  if (!availableSizes.includes(pagination.pageSize)) availableSizes.push(pagination.pageSize);
  if (!availableSizes.includes(totalRows)) availableSizes.push(totalRows);
  // Include previous custom page size if present
  const prevSize = api.getPreviousPageSize?.();
  if (prevSize && !availableSizes.includes(prevSize) && prevSize <= totalRows) availableSizes.push(prevSize);
  // Remove any 0 or negative, dedupe, and sort
  availableSizes = Array.from(new Set(availableSizes)).filter(x => x > 0 && x <= totalRows).sort((a, b) => a - b);

  return (
    <div className="warper-grid-pagination">
      {/* Page info */}
      <div className="text-sm text-[var(--muted-foreground)]">
        Showing {pagination.startRow} to {pagination.endRow} of {pagination.totalRows} rows
      </div>

      {/* Page controls */}
      <div className="flex items-center gap-2">
        {/* Page size selector */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-[var(--muted-foreground)]">Rows per page:</span>
          <select
            value={pagination.pageSize === totalRows ? 'All' : pagination.pageSize}
            onChange={e => {
              const val = e.target.value;
              if (val === 'restore') {
                const prev = api.getPreviousPageSize?.();
                if (prev) pagination.setPageSize(prev);
                return;
              }
              const value = val === 'All' ? totalRows : Number(val);
              pagination.setPageSize(value);
            }}
            className="h-8 px-2 text-sm border border-[var(--border)] rounded bg-[var(--background)] text-[var(--foreground)]"
          >
            {availableSizes.map((size) => (
              <option key={size} value={size === totalRows ? 'All' : size}>
                {size === totalRows ? 'All' : size}
              </option>
            ))}
            {prevSize && pagination.pageSize === totalRows && prevSize !== totalRows && (
              <option value="restore">Restore ({prevSize})</option>
            )}
          </select>
        </div>

        {/* Navigation buttons */}
        <div className="flex items-center gap-1">
          {/* First page */}
          <button
            onClick={pagination.firstPage}
            disabled={pagination.isFirstPage}
            className="h-8 w-8 flex items-center justify-center border border-[var(--border)] rounded hover:bg-[var(--accent)] disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="First page"
          >
            <ChevronsLeft className="h-4 w-4" />
          </button>

          {/* Previous page */}
          <button
            onClick={pagination.previousPage}
            disabled={!pagination.hasPrevPage}
            className="h-8 w-8 flex items-center justify-center border border-[var(--border)] rounded hover:bg-[var(--accent)] disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Previous page"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          {/* Page numbers */}
          <div className="flex items-center gap-1">
            {pagination.pageNumbers.map((page, index) => {
              if (page === 'ellipsis') {
                return (
                  <span key={`ellipsis-${index}`} className="px-2 text-[var(--muted-foreground)]">
                    ...
                  </span>
                );
              }

              const isCurrentPage = page === pagination.currentPage;
              return (
                <button
                  key={page}
                  onClick={() => pagination.setPage(page)}
                  className={`h-8 min-w-8 px-2 flex items-center justify-center border rounded text-sm ${
                    isCurrentPage
                      ? 'bg-[var(--primary)] text-[var(--primary-foreground)] border-[var(--primary)]'
                      : 'border-[var(--border)] hover:bg-[var(--accent)]'
                  }`}
                >
                  {page + 1}
                </button>
              );
            })}
          </div>

          {/* Next page */}
          <button
            onClick={pagination.nextPage}
            disabled={!pagination.hasNextPage}
            className="h-8 w-8 flex items-center justify-center border border-[var(--border)] rounded hover:bg-[var(--accent)] disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Next page"
          >
            <ChevronRight className="h-4 w-4" />
          </button>

          {/* Last page */}
          <button
            onClick={pagination.lastPage}
            disabled={pagination.isLastPage}
            className="h-8 w-8 flex items-center justify-center border border-[var(--border)] rounded hover:bg-[var(--accent)] disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Last page"
          >
            <ChevronsRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
