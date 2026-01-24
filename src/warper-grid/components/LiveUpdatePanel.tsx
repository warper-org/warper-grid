import { useState, useEffect, useCallback, useRef, memo } from 'react';
import { cn } from '@/lib/utils';
import {
  Play,
  Pause,
  RefreshCw,
} from 'lucide-react';

// ============================================================================
// Live Update Types
// ============================================================================

export interface LiveUpdateConfig {
  /** Update interval in milliseconds (default: 1000) */
  interval?: number;
  /** Number of rows to update per tick (default: 10) */
  rowsPerTick?: number;
  /** Update mode */
  mode?: 'random' | 'sequential' | 'batch';
  /** Fields to update */
  updateFields?: string[];
}

export interface PerformanceMetrics {
  updateTime: number;
  avgUpdateTime: number;
  totalUpdates: number;
  rowsUpdated: number;
  memoryUsage?: number;
}

// ============================================================================
// ============================================================================
// Performance Monitor Props
// ============================================================================

interface PerformanceMonitorProps {
  isLiveUpdating: boolean;
  metrics: PerformanceMetrics;
  onToggle: () => void;
  onConfigChange?: (config: LiveUpdateConfig) => void;
  config?: LiveUpdateConfig;
  className?: string;
  compact?: boolean;
}

// ============================================================================
// Performance Monitor Component
// ============================================================================

export const PerformanceMonitor = memo(function PerformanceMonitor({
  isLiveUpdating,
  metrics,
  onToggle,
  onConfigChange,
  config = {},
  className,
  compact = false,
}: PerformanceMonitorProps) {
  // Settings UI state are currently unused in the demo; prefix with underscore to satisfy strict checks
  const [_showSettings, _setShowSettings] = useState(false);
  const [_interval, _setInterval] = useState(config.interval ?? 1000);
  const [_rowsPerTick, _setRowsPerTick] = useState(config.rowsPerTick ?? 10);
  
  const _handleApplySettings = useCallback(() => {
    onConfigChange?.({ ...config, interval: _interval, rowsPerTick: _rowsPerTick });
    _setShowSettings(false);
  }, [config, _interval, _rowsPerTick, onConfigChange]);
  
  if (compact) {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <button
          onClick={onToggle}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-all',
            isLiveUpdating
              ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50'
              : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-900/50'
          )}
        >
          {isLiveUpdating ? (
            <>
              <Pause className="w-4 h-4" />
              Stop
            </>
          ) : (
            <>
              <Play className="w-4 h-4" />
              Live
            </>
          )}
        </button>
      </div>
    );
  }
  
  return (
    <div className={cn('relative', className)}>
      <div className="p-4 bg-(--card) border border-(--border) rounded-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <RefreshCw className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="font-semibold text-(--foreground)">Live Updates</h3>
              <p className="text-xs text-(--muted-foreground)">Real-time data updates</p>
            </div>
          </div>

          <button
            onClick={onToggle}
            className={cn(
              'flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg transition-all',
              isLiveUpdating
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
            )}
          >
            {isLiveUpdating ? (
              <>
                <Pause className="w-4 h-4" />
                Stop Updates
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                Start Live Updates
              </>
            )}
          </button>
        </div>

        {/* Live indicator */}
        {isLiveUpdating && (
          <div className="mt-3 flex items-center gap-2 text-sm">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
            </span>
            <span className="text-emerald-600 dark:text-emerald-400 font-medium">
              Live updating every {config.interval ?? 1000}ms ({config.rowsPerTick ?? 10} rows/tick)
              <span className="ml-2 text-xs opacity-75">
                • {metrics.rowsUpdated} rows updated • {metrics.totalUpdates} total updates
              </span>
            </span>
          </div>
        )}
      </div>
    </div>
  );
});

// ============================================================================
// Live Update Hook
// ============================================================================

export interface UseLiveUpdateOptions<TData> {
  data: TData[];
  setData: React.Dispatch<React.SetStateAction<TData[]>>;
  config?: LiveUpdateConfig;
  updateFn?: (row: TData, index: number) => TData;
}

export function useLiveUpdate<TData>({
  // data parameter intentionally unused - kept for API consistency
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  data: _data,
  setData,
  config = {},
  updateFn,
}: UseLiveUpdateOptions<TData>) {
  const [isLiveUpdating, setIsLiveUpdating] = useState(false);
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    updateTime: 0,
    avgUpdateTime: 0,
    totalUpdates: 0,
    rowsUpdated: 0,
  });
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const updateTimesRef = useRef<number[]>([]);
  const totalRowsUpdatedRef = useRef(0);
  const totalUpdatesRef = useRef(0);
  const configRef = useRef(config);
  
  // Keep config ref updated
  useEffect(() => {
    configRef.current = config;
  }, [config]);
  
  // Default update function - updates numeric fields with random variance
  const defaultUpdateFn = useCallback((row: TData, _index: number): TData => {
    const updated = { ...row } as Record<string, unknown>;
    const fields = configRef.current.updateFields ?? ['salary', 'performance', 'age'];
    
    for (const field of fields) {
      if (field in updated && typeof updated[field] === 'number') {
        const currentValue = updated[field] as number;
        // Increased variance from 2% to 10% for more visible changes
        const variance = currentValue * 0.10; // 10% variance
        const newValue = Math.max(0, currentValue + (Math.random() - 0.5) * variance);
        updated[field] = newValue;
        
        // Debug logging (remove in production)
        if (_index < 3) { // Only log first few updates to avoid spam
          console.log(`Updated row ${_index} ${field}: ${currentValue.toFixed(2)} → ${newValue.toFixed(2)}`);
        }
      }
    }
    
    return updated as TData;
  }, []);
  
  // Perform update tick
  const performUpdate = useCallback(() => {
    const start = performance.now();
    const { rowsPerTick = 10, mode = 'random' } = configRef.current;
    const updater = updateFn ?? defaultUpdateFn;
    
    setData(prevData => {
      if (!Array.isArray(prevData)) return [];
      const newData = [...prevData];
      const dataLength = newData.length;
      if (dataLength === 0) return newData;
      const rowsToUpdate = Math.min(rowsPerTick, dataLength);
      if (mode === 'random') {
        for (let i = 0; i < rowsToUpdate; i++) {
          const idx = Math.floor(Math.random() * dataLength);
          newData[idx] = updater(newData[idx], idx);
        }
      } else if (mode === 'sequential') {
        const startIdx = totalUpdatesRef.current % dataLength;
        for (let i = 0; i < rowsToUpdate; i++) {
          const idx = (startIdx + i) % dataLength;
          newData[idx] = updater(newData[idx], idx);
        }
      } else if (mode === 'batch') {
        const startIdx = Math.floor(Math.random() * dataLength);
        for (let i = 0; i < rowsToUpdate; i++) {
          const idx = (startIdx + i) % dataLength;
          newData[idx] = updater(newData[idx], idx);
        }
      }
      return Array.isArray(newData) ? newData : [];
    });
    
    const updateTime = performance.now() - start;
    updateTimesRef.current.push(updateTime);
    if (updateTimesRef.current.length > 30) {
      updateTimesRef.current.shift();
    }
    
    const avgUpdateTime = updateTimesRef.current.reduce((a, b) => a + b, 0) / updateTimesRef.current.length;
    totalRowsUpdatedRef.current += rowsPerTick;
    totalUpdatesRef.current++;
    
    setMetrics(prev => ({
      ...prev,
      updateTime,
      avgUpdateTime,
      totalUpdates: totalUpdatesRef.current,
      rowsUpdated: totalRowsUpdatedRef.current,
    }));
  }, [setData, updateFn, defaultUpdateFn]);
  
  // Start/stop live updates
  useEffect(() => {
    if (isLiveUpdating) {
      const { interval = 1000 } = configRef.current;
      intervalRef.current = setInterval(performUpdate, interval);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isLiveUpdating, performUpdate]);
  
  const toggle = useCallback(() => {
    setIsLiveUpdating(prev => !prev);
  }, []);
  
  const start = useCallback(() => {
    setIsLiveUpdating(true);
  }, []);
  
  const stop = useCallback(() => {
    setIsLiveUpdating(false);
  }, []);
  
  const reset = useCallback(() => {
    totalRowsUpdatedRef.current = 0;
    totalUpdatesRef.current = 0;
    updateTimesRef.current = [];
    setMetrics(prev => ({
      ...prev,
      updateTime: 0,
      avgUpdateTime: 0,
      totalUpdates: 0,
      rowsUpdated: 0,
    }));
  }, []);
  
  return {
    isLiveUpdating,
    metrics,
    toggle,
    start,
    stop,
    reset,
    setConfig: (newConfig: LiveUpdateConfig) => {
      configRef.current = { ...configRef.current, ...newConfig };
    },
  };
}

export default PerformanceMonitor;
