import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { usePagination, getPageNumbers } from '../plugins/pagination';
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
  pageSizes = [10, 25, 50, 100, 500],
}: GridPaginationProps<TData>) {
  const pagination = usePagination(api);

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
            value={pagination.pageSize}
            onChange={(e) => pagination.setPageSize(Number(e.target.value))}
            className="h-8 px-2 text-sm border border-[var(--border)] rounded bg-[var(--background)] text-[var(--foreground)]"
          >
            {pageSizes.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
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
