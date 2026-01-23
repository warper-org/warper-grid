import React from 'react';
import { cn } from '@/lib/utils';
import type {
  RowData,
  GridApi,
} from '../types';
import type {
  StatusPanelConfig,
  StatusPanelParams,
  RangeStatistics,
} from '../plugins/status-bar';
import { formatStatNumber } from '../plugins/status-bar';
import type { CellRange } from '../plugins/cell-selection';
import { LARGE_DATASET_THRESHOLD } from '../constants';

// ============================================================================
// Status Bar Props
// ============================================================================

interface StatusBarProps<TData extends RowData = RowData> {
  api?: GridApi<TData>;
  totalRows: number;
  displayedRows: number;
  selectedRows?: number;
  selectedCells?: number;
  selectedRanges?: CellRange[];
  rangeStats?: RangeStatistics | null;
  panels?: StatusPanelConfig<TData>[];
  className?: string;
}

// ============================================================================
// Built-in Panel Components
// ============================================================================

function TotalRowsPanel<TData extends RowData>({ 
  totalRows, 
  displayedRows 
}: StatusPanelParams<TData>) {
  return (
    <div className="warper-status-panel">
      <span className="warper-status-label">Total Rows:</span>
      <span className="warper-status-value">{totalRows.toLocaleString()}</span>
      {displayedRows !== totalRows && (
        <>
          <span className="warper-status-separator">|</span>
          <span className="warper-status-label">Showing:</span>
          <span className="warper-status-value">{displayedRows.toLocaleString()}</span>
        </>
      )}
      {totalRows > LARGE_DATASET_THRESHOLD && (
        <span className="warper-status-warning"> • Large dataset mode</span>
      )}
    </div>
  );
}

function FilteredRowsPanel<TData extends RowData>({ 
  totalRows, 
  displayedRows 
}: StatusPanelParams<TData>) {
  const filtered = totalRows - displayedRows;
  if (filtered === 0) return null;
  
  return (
    <div className="warper-status-panel">
      <span className="warper-status-label">Filtered:</span>
      <span className="warper-status-value">{filtered.toLocaleString()}</span>
    </div>
  );
}

function SelectedRowsPanel<TData extends RowData>({ 
  selectedRows,
  selectedCells,
}: StatusPanelParams<TData>) {
  if (selectedRows === 0 && selectedCells === 0) return null;
  
  return (
    <div className="warper-status-panel">
      {selectedRows > 0 && (
        <>
          <span className="warper-status-label">Selected Rows:</span>
          <span className="warper-status-value">{selectedRows.toLocaleString()}</span>
        </>
      )}
      {selectedCells > 0 && (
        <>
          {selectedRows > 0 && <span className="warper-status-separator">|</span>}
          <span className="warper-status-label">Cells:</span>
          <span className="warper-status-value">{selectedCells.toLocaleString()}</span>
        </>
      )}
    </div>
  );
}

function SelectedCellsPanel<TData extends RowData>({ 
  selectedCells 
}: StatusPanelParams<TData>) {
  if (selectedCells === 0) return null;
  
  return (
    <div className="warper-status-panel">
      <span className="warper-status-label">Selected Cells:</span>
      <span className="warper-status-value">{selectedCells.toLocaleString()}</span>
    </div>
  );
}

function RangeStatsPanel<TData extends RowData>({ 
  rangeStats 
}: StatusPanelParams<TData>) {
  if (!rangeStats || rangeStats.count === 0) return null;
  
  return (
    <div className="warper-status-panel warper-status-panel--stats">
      <span className="warper-status-stat">
        <span className="warper-status-stat-label">Sum:</span>
        <span className="warper-status-stat-value">{formatStatNumber(rangeStats.sum)}</span>
      </span>
      <span className="warper-status-stat">
        <span className="warper-status-stat-label">Avg:</span>
        <span className="warper-status-stat-value">{formatStatNumber(rangeStats.average)}</span>
      </span>
      <span className="warper-status-stat">
        <span className="warper-status-stat-label">Count:</span>
        <span className="warper-status-stat-value">{rangeStats.count}</span>
      </span>
      <span className="warper-status-stat">
        <span className="warper-status-stat-label">Min:</span>
        <span className="warper-status-stat-value">{formatStatNumber(rangeStats.min)}</span>
      </span>
      <span className="warper-status-stat">
        <span className="warper-status-stat-label">Max:</span>
        <span className="warper-status-stat-value">{formatStatNumber(rangeStats.max)}</span>
      </span>
    </div>
  );
}

function AggregationPanel<TData extends RowData>({ 
  rangeStats 
}: StatusPanelParams<TData>) {
  if (!rangeStats) return null;
  
  return (
    <div className="warper-status-panel">
      <span className="warper-status-label">Σ</span>
      <span className="warper-status-value">{formatStatNumber(rangeStats.sum)}</span>
    </div>
  );
}

// ============================================================================
// Panel Renderer
// ============================================================================

const builtInPanels: Record<string, React.ComponentType<StatusPanelParams<RowData>>> = {
  totalRows: TotalRowsPanel,
  filteredRows: FilteredRowsPanel,
  selectedRows: SelectedRowsPanel,
  selectedCells: SelectedCellsPanel,
  rangeStats: RangeStatsPanel,
  aggregation: AggregationPanel,
};

function renderPanel<TData extends RowData>(
  config: StatusPanelConfig<TData>,
  params: StatusPanelParams<TData>
): React.ReactNode {
  if (typeof config.component === 'string') {
    const BuiltInPanel = builtInPanels[config.component] as React.ComponentType<StatusPanelParams<TData>>;
    if (BuiltInPanel) {
      return <BuiltInPanel {...params} />;
    }
    return null;
  }
  
  const CustomPanel = config.component;
  return <CustomPanel {...params} />;
}

// ============================================================================
// Status Bar Component
// ============================================================================

export function StatusBar<TData extends RowData = RowData>({
  api,
  totalRows,
  displayedRows,
  selectedRows = 0,
  selectedCells = 0,
  selectedRanges = [],
  rangeStats = null,
  panels = [],
  className,
}: StatusBarProps<TData>) {
  // Use default panels if none provided
  const defaultPanels: StatusPanelConfig<TData>[] = [
    { id: 'totalRows', component: 'totalRows', align: 'left' },
    { id: 'selectedRows', component: 'selectedRows', align: 'right' },
  ];
  const activePanels: StatusPanelConfig<TData>[] = panels.length > 0 ? panels : defaultPanels;

  const leftPanels = activePanels.filter(p => p.align === 'left' || !p.align);
  const centerPanels = activePanels.filter(p => p.align === 'center');
  const rightPanels = activePanels.filter(p => p.align === 'right');

  const panelParams: StatusPanelParams<TData> = {
    api: api as GridApi<TData>,
    totalRows,
    displayedRows,
    selectedRows,
    selectedCells,
    selectedRanges,
    rangeStats,
  };

  return (
    <div className={cn('warper-status-bar', className)}>
      <div className="warper-status-bar-left">
        {leftPanels.map((config) => (
          <React.Fragment key={config.id}>
            {renderPanel(config, { ...panelParams, params: config.params || {} })}
          </React.Fragment>
        ))}
      </div>
      
      <div className="warper-status-bar-center">
        {centerPanels.map((config) => (
          <React.Fragment key={config.id}>
            {renderPanel(config, { ...panelParams, params: config.params || {} })}
          </React.Fragment>
        ))}
      </div>
      
      <div className="warper-status-bar-right">
        {rightPanels.map((config) => (
          <React.Fragment key={config.id}>
            {renderPanel(config, { ...panelParams, params: config.params || {} })}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

export default StatusBar;
