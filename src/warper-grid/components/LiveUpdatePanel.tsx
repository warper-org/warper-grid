import { useState, useEffect, useCallback, useRef, memo } from 'react';
import { cn } from '@/lib/utils';
import {
  Play,
  Pause,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Activity,
  Clock,
  BarChart3,
  Settings,
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
  fps: number;
  avgFps: number;
  updateTime: number;
  avgUpdateTime: number;
  totalUpdates: number;
  rowsUpdated: number;
  memoryUsage?: number;
}

// ============================================================================
// FPS Counter Hook
// ============================================================================

function useFpsCounter() {
  const [fps, setFps] = useState(0);
  const [avgFps, setAvgFps] = useState(0);
  const frameCount = useRef(0);
  const lastTime = useRef(performance.now());
  const fpsHistory = useRef<number[]>([]);
  const rafId = useRef<number | null>(null);

  useEffect(() => {
    const measure = () => {
      frameCount.current++;
      const now = performance.now();
      const elapsed = now - lastTime.current;

      if (elapsed >= 1000) {
        const currentFps = Math.round((frameCount.current * 1000) / elapsed);
        setFps(currentFps);
        
        fpsHistory.current.push(currentFps);
        if (fpsHistory.current.length > 30) {
          fpsHistory.current.shift();
        }
        
        const avg = fpsHistory.current.reduce((a, b) => a + b, 0) / fpsHistory.current.length;
        setAvgFps(Math.round(avg));
        
        frameCount.current = 0;
        lastTime.current = now;
      }

      rafId.current = requestAnimationFrame(measure);
    };

    rafId.current = requestAnimationFrame(measure);

    return () => {
      if (rafId.current !== null) {
        cancelAnimationFrame(rafId.current);
      }
    };
  }, []);

  return { fps, avgFps };
}

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
  const [showSettings, setShowSettings] = useState(false);
  const [interval, setInterval] = useState(config.interval ?? 1000);
  const [rowsPerTick, setRowsPerTick] = useState(config.rowsPerTick ?? 10);
  
  const handleApplySettings = useCallback(() => {
    onConfigChange?.({ ...config, interval, rowsPerTick });
    setShowSettings(false);
  }, [config, interval, rowsPerTick, onConfigChange]);
  
  const getFpsColor = (fps: number) => {
    if (fps >= 55) return 'text-emerald-600 dark:text-emerald-400';
    if (fps >= 30) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };
  
  const getFpsBgColor = (fps: number) => {
    if (fps >= 55) return 'bg-emerald-500';
    if (fps >= 30) return 'bg-yellow-500';
    return 'bg-red-500';
  };
  
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
        
        <div className="flex items-center gap-1.5 px-2 py-1 bg-(--muted)/50 rounded-lg">
          <Activity className={cn('w-4 h-4', getFpsColor(metrics.fps))} />
          <span className={cn('font-mono text-sm font-medium', getFpsColor(metrics.fps))}>
            {metrics.fps} FPS
          </span>
        </div>
      </div>
    );
  }
  
  return (
    <div className={cn('relative', className)}>
      <div className="p-4 bg-(--card) border border-(--border) rounded-xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Activity className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="font-semibold text-(--foreground)">Live Performance</h3>
              <p className="text-xs text-(--muted-foreground)">Real-time metrics</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 hover:bg-(--accent) rounded-lg transition-colors"
            >
              <Settings className="w-4 h-4" />
            </button>
            
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
        </div>
        
        {/* Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {/* FPS */}
          <div className="p-3 bg-(--muted)/30 rounded-lg">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-(--muted-foreground)">Current FPS</span>
              {metrics.fps > metrics.avgFps ? (
                <TrendingUp className="w-3 h-3 text-emerald-500" />
              ) : (
                <TrendingDown className="w-3 h-3 text-red-500" />
              )}
            </div>
            <div className="flex items-baseline gap-1">
              <span className={cn('text-2xl font-bold font-mono', getFpsColor(metrics.fps))}>
                {metrics.fps}
              </span>
              <span className="text-xs text-(--muted-foreground)">fps</span>
            </div>
            <div className="mt-2 h-1.5 bg-(--muted) rounded-full overflow-hidden">
              <div
                className={cn('h-full transition-all duration-300', getFpsBgColor(metrics.fps))}
                style={{ width: `${Math.min(100, (metrics.fps / 120) * 100)}%` }}
              />
            </div>
          </div>
          
          {/* Avg FPS */}
          <div className="p-3 bg-(--muted)/30 rounded-lg">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-(--muted-foreground)">Avg FPS (30s)</span>
              <BarChart3 className="w-3 h-3 text-(--muted-foreground)" />
            </div>
            <div className="flex items-baseline gap-1">
              <span className={cn('text-2xl font-bold font-mono', getFpsColor(metrics.avgFps))}>
                {metrics.avgFps}
              </span>
              <span className="text-xs text-(--muted-foreground)">fps</span>
            </div>
          </div>
          
          {/* Update Time */}
          <div className="p-3 bg-(--muted)/30 rounded-lg">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-(--muted-foreground)">Update Time</span>
              <Clock className="w-3 h-3 text-(--muted-foreground)" />
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold font-mono text-(--foreground)">
                {metrics.updateTime.toFixed(1)}
              </span>
              <span className="text-xs text-(--muted-foreground)">ms</span>
            </div>
          </div>
          
          {/* Total Updates */}
          <div className="p-3 bg-(--muted)/30 rounded-lg">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-(--muted-foreground)">Rows Updated</span>
              <RefreshCw className={cn('w-3 h-3', isLiveUpdating && 'animate-spin text-blue-500')} />
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold font-mono text-(--foreground)">
                {metrics.rowsUpdated.toLocaleString()}
              </span>
            </div>
          </div>
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
            </span>
          </div>
        )}
      </div>
      
      {/* Settings Panel */}
      {showSettings && (
        <div className="absolute top-full left-0 right-0 mt-2 p-4 bg-(--card) border border-(--border) rounded-xl shadow-xl z-10">
          <h4 className="font-medium text-(--foreground) mb-3">Update Settings</h4>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm text-(--muted-foreground) mb-1 block">
                Update Interval: {interval}ms
              </label>
              <input
                type="range"
                min="100"
                max="5000"
                step="100"
                value={interval}
                onChange={(e) => setInterval(Number(e.target.value))}
                className="w-full accent-emerald-500"
              />
              <div className="flex justify-between text-xs text-(--muted-foreground) mt-1">
                <span>100ms (fast)</span>
                <span>5000ms (slow)</span>
              </div>
            </div>
            
            <div>
              <label className="text-sm text-(--muted-foreground) mb-1 block">
                Rows per Tick: {rowsPerTick}
              </label>
              <input
                type="range"
                min="1"
                max="100"
                step="1"
                value={rowsPerTick}
                onChange={(e) => setRowsPerTick(Number(e.target.value))}
                className="w-full accent-emerald-500"
              />
              <div className="flex justify-between text-xs text-(--muted-foreground) mt-1">
                <span>1 row</span>
                <span>100 rows</span>
              </div>
            </div>
            
            <button
              onClick={handleApplySettings}
              className="w-full px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
            >
              Apply Settings
            </button>
          </div>
        </div>
      )}
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
    fps: 0,
    avgFps: 0,
    updateTime: 0,
    avgUpdateTime: 0,
    totalUpdates: 0,
    rowsUpdated: 0,
  });
  
  const { fps, avgFps } = useFpsCounter();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const updateTimesRef = useRef<number[]>([]);
  const totalRowsUpdatedRef = useRef(0);
  const totalUpdatesRef = useRef(0);
  const configRef = useRef(config);
  
  // Keep config ref updated
  useEffect(() => {
    configRef.current = config;
  }, [config]);
  
  // Update FPS in metrics
  useEffect(() => {
    setMetrics(prev => ({ ...prev, fps, avgFps }));
  }, [fps, avgFps]);
  
  // Default update function - updates numeric fields with random variance
  const defaultUpdateFn = useCallback((row: TData, _index: number): TData => {
    const updated = { ...row } as Record<string, unknown>;
    const fields = configRef.current.updateFields ?? ['salary', 'performance', 'age'];
    
    for (const field of fields) {
      if (field in updated && typeof updated[field] === 'number') {
        const currentValue = updated[field] as number;
        const variance = currentValue * 0.02; // 2% variance
        updated[field] = currentValue + (Math.random() - 0.5) * variance;
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
      const newData = [...prevData];
      const dataLength = newData.length;
      
      if (dataLength === 0) return newData;
      
      const rowsToUpdate = Math.min(rowsPerTick, dataLength);
      
      if (mode === 'random') {
        // Update random rows
        for (let i = 0; i < rowsToUpdate; i++) {
          const idx = Math.floor(Math.random() * dataLength);
          newData[idx] = updater(newData[idx], idx);
        }
      } else if (mode === 'sequential') {
        // Update sequential rows
        const startIdx = totalUpdatesRef.current % dataLength;
        for (let i = 0; i < rowsToUpdate; i++) {
          const idx = (startIdx + i) % dataLength;
          newData[idx] = updater(newData[idx], idx);
        }
      } else if (mode === 'batch') {
        // Update a batch starting from random position
        const startIdx = Math.floor(Math.random() * dataLength);
        for (let i = 0; i < rowsToUpdate; i++) {
          const idx = (startIdx + i) % dataLength;
          newData[idx] = updater(newData[idx], idx);
        }
      }
      
      return newData;
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
