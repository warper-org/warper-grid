import type { 
  RowData, 
  GridPlugin, 
  GridApi, 
  PaginationPluginConfig 
} from '../types';

// ============================================================================
// Pagination Utilities
// ============================================================================

/**
 * Get paginated data
 */

export function paginateData<TData>(
  data: TData[],
  page: number,
  pageSize: number
): TData[] {
  // If 'All' is selected (pageSize >= data.length), return all rows
  if (pageSize >= data.length) return data;
  const start = page * pageSize;
  const end = start + pageSize;
  return data.slice(start, end);
}

/**
 * Calculate pagination info
 */
export function getPaginationInfo(
  totalRows: number,
  page: number,
  pageSize: number
) {
  const totalPages = Math.ceil(totalRows / pageSize);
  const startRow = page * pageSize + 1;
  const endRow = Math.min((page + 1) * pageSize, totalRows);
  
  return {
    totalRows,
    totalPages,
    currentPage: page,
    pageSize,
    startRow,
    endRow,
    hasNextPage: page < totalPages - 1,
    hasPrevPage: page > 0,
    isFirstPage: page === 0,
    isLastPage: page >= totalPages - 1,
  };
}

/**
 * Generate page numbers for pagination UI
 */
export function getPageNumbers(
  currentPage: number,
  totalPages: number,
  maxButtons: number = 7
): (number | 'ellipsis')[] {
  if (totalPages <= maxButtons) {
    return Array.from({ length: totalPages }, (_, i) => i);
  }

  const pages: (number | 'ellipsis')[] = [];
  const half = Math.floor(maxButtons / 2);
  
  // Always show first page
  pages.push(0);
  
  let start = Math.max(1, currentPage - half + 1);
  let end = Math.min(totalPages - 2, currentPage + half - 1);
  
  // Adjust if near the start
  if (currentPage < half) {
    end = Math.min(totalPages - 2, maxButtons - 2);
  }
  
  // Adjust if near the end
  if (currentPage > totalPages - half - 1) {
    start = Math.max(1, totalPages - maxButtons + 1);
  }
  
  // Add ellipsis if needed at start
  if (start > 1) {
    pages.push('ellipsis');
  }
  
  // Add middle pages
  for (let i = start; i <= end; i++) {
    pages.push(i);
  }
  
  // Add ellipsis if needed at end
  if (end < totalPages - 2) {
    pages.push('ellipsis');
  }
  
  // Always show last page
  if (totalPages > 1) {
    pages.push(totalPages - 1);
  }
  
  return pages;
}

// ============================================================================
// Pagination Plugin
// ============================================================================

let pluginApi: GridApi<RowData> | null = null;
let _pluginConfig: PaginationPluginConfig = {};

export const paginationPlugin: GridPlugin<RowData> = {
  name: 'pagination',

  init(api: GridApi<RowData>, config?: PaginationPluginConfig) {
    pluginApi = api;
    _pluginConfig = config || {};
    
    // Apply default page size if provided
    if (_pluginConfig.pageSize) {
      api.setPageSize(_pluginConfig.pageSize);
    }
  },

  destroy() {
    pluginApi = null;
    _pluginConfig = {};
  },
};

// ============================================================================
// Pagination Hook
// ============================================================================

export function usePagination<TData extends RowData>(api: GridApi<TData>) {
  const totalRows = api.getRowCount();
  const page = api.getPage();
  const pageSize = api.getPageSize();

  // Compute effective pageSize and use full totalRows for pagination calculations
  const effectivePageSize = (pageSize === 0 || pageSize >= totalRows) ? totalRows : pageSize;
  const info = getPaginationInfo(totalRows, page, effectivePageSize);
  
  return {
    ...info,
    pageNumbers: getPageNumbers(page, info.totalPages),
    setPage: api.setPage.bind(api),
    setPageSize: api.setPageSize.bind(api),
    nextPage: api.nextPage.bind(api),
    previousPage: api.previousPage.bind(api),
    firstPage: api.firstPage.bind(api),
    lastPage: api.lastPage.bind(api),
  };
}
