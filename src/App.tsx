import { useRef, useMemo, useCallback, useState, useEffect, memo } from 'react';

import { WarperGrid, type WarperGridRef, type ColumnDef } from './warper-grid';
import { cn } from './lib/utils';
import { SqlQueryPanel } from './warper-grid/components/SqlQueryPanel';
import GroupPanel from './warper-grid/components/GroupPanel';
import { useLiveUpdate, type LiveUpdateConfig } from './warper-grid/components/LiveUpdatePanel';
import { createSqlDatabaseManager, type SqlDatabaseManager } from './warper-grid/plugins/sql-query';
import { Moon, Sun, HelpCircle, X, Keyboard, MousePointer2, Clipboard, Edit3, Filter, ArrowUpDown, Columns3, FileSpreadsheet, CheckSquare, Grid3X3, Zap, ExternalLink, Sparkles, LayoutGrid, Download, RefreshCw, ArrowUp, ArrowDown, CornerUpLeft, CornerDownRight, Search, Database, Play, Pause, List } from 'lucide-react';

// ============================================================================
// Demo Data Types
// ============================================================================

interface Person {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  age: number;
  salary: number;
  department: string;
  joinDate: string;
  isActive: boolean;
  performance: number;
  [key: string]: unknown;
}

// ============================================================================
// Demo Data Generator
// ============================================================================

const firstNames = ['James', 'Mary', 'John', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Linda', 'William', 'Elizabeth', 'David', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica', 'Thomas', 'Sarah', 'Charles', 'Karen', 'Emma', 'Olivia', 'Ava', 'Isabella', 'Sophia', 'Mia', 'Charlotte', 'Amelia', 'Harper', 'Evelyn'];
const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson'];
const departments = ['Engineering', 'Sales', 'Marketing', 'HR', 'Finance', 'Operations', 'Legal', 'Support', 'Product', 'Design', 'R&D', 'Quality'];
let seed = 12345;
function seededRandom() {
  seed = (seed * 16807) % 2147483647;
  return (seed - 1) / 2147483646;
}

function generateData(count: number): Person[] {
  seed = 12345;
  const data: Person[] = new Array(count);
  const now = Date.now();
  const fiveYears = 5 * 365 * 24 * 60 * 60 * 1000;

  for (let i = 0; i < count; i++) {
    const firstName = firstNames[Math.floor(seededRandom() * firstNames.length)];
    const lastName = lastNames[Math.floor(seededRandom() * lastNames.length)];
    data[i] = {
      id: i + 1,
      firstName,
      lastName,
      email: firstName.toLowerCase() + '.' + lastName.toLowerCase() + i + '@company.com',
      age: Math.floor(seededRandom() * 40) + 22,
      salary: Math.floor(seededRandom() * 150000) + 40000,
      department: departments[Math.floor(seededRandom() * departments.length)],
      joinDate: new Date(now - seededRandom() * fiveYears).toISOString().split('T')[0],
      isActive: seededRandom() > 0.2,
      performance: Math.floor(seededRandom() * 100) + 1,
    };
  }
  return data;
}

// ============================================================================
// Custom Cell Renderers
// ============================================================================

const StatusBadge = memo(function StatusBadge({ value }: { value: boolean }) {
  return (
    <span
      className={
        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ' +
        (value
          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'
          : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400')
      }
    >
      {value ? 'Active' : 'Inactive'}
    </span>
  );
});

const SalaryCell = memo(function SalaryCell({ value }: { value: number }) {
  return (
    <span className="font-mono text-emerald-600 dark:text-emerald-400">
      {'$' + value.toLocaleString()}
    </span>
  );
});

const PerformanceBar = memo(function PerformanceBar({ value }: { value: number }) {
  const getColor = () => {
    if (value >= 80) return 'bg-emerald-500';
    if (value >= 60) return 'bg-blue-500';
    if (value >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className={'h-full transition-all duration-300 ' + getColor()}
          style={{ width: value + '%' }}
        />
      </div>
      <span className="text-xs font-medium w-8 text-right">{value}%</span>
    </div>
  );
});

// ============================================================================
// Tooltip Component
// ============================================================================

import { createPortal } from 'react-dom';
const Tooltip = memo(function Tooltip({
  children,
  content,
  position = 'top'
}: {
  children: React.ReactNode;
  content: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
}) {
  const [show, setShow] = useState(false);
  const [coords, setCoords] = useState<{ top: number, left: number, width: number, height: number } | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  const handleMouseEnter = () => {
    setShow(true);
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect();
      setCoords({
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
      });
    }
  };
  const handleMouseLeave = () => setShow(false);

  const getTooltipStyle = () => {
    if (!coords) return {};
    switch (position) {
      case 'top':
        return { left: coords.left + coords.width / 2, top: coords.top - 8, transform: 'translateX(-50%)', position: 'fixed' };
      case 'bottom':
        return { left: coords.left + coords.width / 2, top: coords.top + coords.height + 8, transform: 'translateX(-50%)', position: 'fixed' };
      case 'left':
        return { left: coords.left - 8, top: coords.top + coords.height / 2, transform: 'translateY(-50%)', position: 'fixed' };
      case 'right':
        return { left: coords.left + coords.width + 8, top: coords.top + coords.height / 2, transform: 'translateY(-50%)', position: 'fixed' };
      default:
        return {};
    }
  };

  return (
    <div ref={ref} className="relative inline-flex" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
      {children}
      {show && coords && createPortal(
        <div
          className="z-50 px-2 py-1 text-xs font-medium text-white bg-gray-900 dark:bg-gray-700 rounded shadow-lg whitespace-nowrap pointer-events-none"
          style={getTooltipStyle() as React.CSSProperties}
        >
          {content}
        </div>,
        document.body
      )}
    </div>
  );
});

// ============================================================================
// Feature Card Component
// ============================================================================

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  tip: string;
  shortcut?: string;
}

const FeatureCard = memo(function FeatureCard({ icon, title, description, tip, shortcut }: FeatureCardProps) {
  return (
    <div className="group p-4 bg-(--card) border border-(--border) rounded-xl hover:border-emerald-500/50 hover:shadow-lg hover:shadow-emerald-500/5 transition-all duration-200">
      <div className="flex items-start gap-3">
        <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-(--foreground) mb-1">{title}</h3>
          <p className="text-sm text-(--muted-foreground) mb-2">{description}</p>
          <div className="flex items-center gap-2 text-xs">
            <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded">
              💡 {tip}
            </span>
            {shortcut && (
              <kbd className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded font-mono border border-gray-200 dark:border-gray-700">
                {shortcut}
              </kbd>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

// ============================================================================
// Help Modal Component
// ============================================================================

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const HelpModal = memo(function HelpModal({ isOpen, onClose }: HelpModalProps) {
  const [activeTab, setActiveTab] = useState<'features' | 'shortcuts' | 'tips'>('features');

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const shortcuts = [
    { keys: 'Click + Drag', action: 'Select range of cells' },
    { keys: 'Shift + Click', action: 'Extend selection' },
    { keys: 'Ctrl + Click', action: 'Add to selection' },
    { keys: 'Ctrl + C', action: 'Copy selected cells' },
    { keys: 'Ctrl + V', action: 'Paste from clipboard' },
    { keys: 'Ctrl + X', action: 'Cut selected cells' },
    { keys: 'Ctrl + Z', action: 'Undo last edit' },
    { keys: 'Ctrl + Y', action: 'Redo last edit' },
    { keys: 'Ctrl + A', action: 'Select all cells' },
    { keys: 'Enter', action: 'Start editing / Confirm edit' },
    { keys: 'Escape', action: 'Cancel editing' },
    { keys: 'Tab', action: 'Move to next cell' },
    { keys: 'Shift + Tab', action: 'Move to previous cell' },
    { keys: 'Arrow Keys', action: 'Navigate cells' },
    { keys: 'Double Click', action: 'Edit cell' },
    { keys: 'Right Click', action: 'Open context menu' },
    { keys: 'Delete', action: 'Clear cell content' },
    { keys: 'F2', action: 'Edit current cell' },
    { keys: 'Home', action: 'Go to first cell in row' },
    { keys: 'End', action: 'Go to last cell in row' },
    { keys: 'Ctrl + Home', action: 'Go to first cell' },
    { keys: 'Ctrl + End', action: 'Go to last cell' },
    { keys: 'Page Up', action: 'Scroll up one page' },
    { keys: 'Page Down', action: 'Scroll down one page' },
  ];

  const tips = [
    { icon: <MousePointer2 className="w-4 h-4" />, tip: 'Right-click any cell to access the context menu with copy, cut, paste, and export options.' },
    { icon: <Grid3X3 className="w-4 h-4" />, tip: 'Click and drag across cells to select a range. Use Shift+Click to extend your selection.' },
    { icon: <ArrowUpDown className="w-4 h-4" />, tip: 'Click column headers to sort. Hold Shift and click multiple columns for multi-sort.' },
    { icon: <Filter className="w-4 h-4" />, tip: 'Use the filter icon in column headers to filter data. Supports text, number, and date filters.' },
    { icon: <Columns3 className="w-4 h-4" />, tip: 'Drag column borders to resize. Double-click to auto-fit column width.' },
    { icon: <Edit3 className="w-4 h-4" />, tip: 'Double-click a cell or press Enter to start editing. Press Escape to cancel.' },
    { icon: <Clipboard className="w-4 h-4" />, tip: 'Use Ctrl+C/V to copy and paste cells. Data is copied in a format compatible with Excel.' },
    { icon: <CheckSquare className="w-4 h-4" />, tip: 'Use checkboxes for row selection. Ctrl+Click to select multiple non-contiguous rows.' },
    { icon: <FileSpreadsheet className="w-4 h-4" />, tip: 'Export data to CSV or Excel using the Export button or context menu.' },
    { icon: <Zap className="w-4 h-4" />, tip: 'WarperGrid uses WASM virtualization to handle millions of rows at 120 FPS!' },
  ];

  const tabConfig = [
    { id: 'features', label: 'Features', icon: <LayoutGrid className="w-4 h-4" /> },
    { id: 'shortcuts', label: 'Keyboard Shortcuts', icon: <Keyboard className="w-4 h-4" /> },
    { id: 'tips', label: 'Pro Tips', icon: <Sparkles className="w-4 h-4" /> },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-3xl max-h-[85vh] bg-(--background) border border-(--border) rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-(--border)">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl">
              <HelpCircle className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-(--foreground)">WarperGrid Help</h2>
              <p className="text-sm text-(--muted-foreground)">Learn how to use all features</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-(--accent) rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex border-b border-(--border)">
          {tabConfig.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={
                'flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ' +
                (activeTab === tab.id
                  ? 'text-emerald-600 dark:text-emerald-400 border-b-2 border-emerald-500 bg-emerald-50/50 dark:bg-emerald-900/10'
                  : 'text-(--muted-foreground) hover:text-(--foreground) hover:bg-(--accent)')
              }
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'features' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FeatureCard icon={<MousePointer2 className="w-5 h-5" />} title="Context Menu" description="Full-featured right-click menu with copy, cut, paste, and export options." tip="Right-click any cell" shortcut="Right Click" />
              <FeatureCard icon={<Grid3X3 className="w-5 h-5" />} title="Cell Selection" description="Select individual cells or ranges with mouse drag and keyboard." tip="Click and drag" shortcut="Shift+Click" />
              <FeatureCard icon={<Clipboard className="w-5 h-5" />} title="Clipboard" description="Copy, cut, and paste cells with Excel-compatible format." tip="Works with Excel" shortcut="Ctrl+C/V" />
              <FeatureCard icon={<Columns3 className="w-5 h-5" />} title="Column Menu" description="Pin, hide, auto-size columns from the column header menu." tip="Click the ⋮ icon" />
              <FeatureCard icon={<ArrowUpDown className="w-5 h-5" />} title="Column Dragging" description="Reorder columns by dragging the column headers. Animated transitions included." tip="Click and drag a column header. Cursor changes to grab when hovering." shortcut="Drag header" />
              <FeatureCard icon={<Edit3 className="w-5 h-5" />} title="Cell Editing" description="Edit cells inline with undo/redo support and validation." tip="Double-click to edit" shortcut="Enter / F2" />
              <FeatureCard icon={<ArrowUpDown className="w-5 h-5" />} title="Sorting" description="Sort by one or multiple columns with visual indicators." tip="Click column header" shortcut="Shift+Click" />
              <FeatureCard icon={<Filter className="w-5 h-5" />} title="Filtering" description="Filter data with text, number, and date conditions." tip="Use filter icon" />
              <FeatureCard icon={<CheckSquare className="w-5 h-5" />} title="Row Selection" description="Select single or multiple rows with checkbox selection." tip="Click checkboxes" shortcut="Ctrl+Click" />
              <FeatureCard icon={<Download className="w-5 h-5" />} title="Export" description="Export selected data or entire grid to CSV or Excel." tip="Use Export button" />
              <FeatureCard icon={<Zap className="w-5 h-5" />} title="WASM Performance" description="Handle 10M+ rows at 120 FPS with Warper virtualization." tip="Try 10M rows!" />
            </div>
          )}

          {activeTab === 'shortcuts' && (
            <div className="grid grid-cols-2 gap-x-8 gap-y-1">
              {shortcuts.map((shortcut, index) => (
                <div key={index} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-(--accent) transition-colors">
                  <span className="text-sm text-(--muted-foreground)">{shortcut.action}</span>
                  <kbd className="px-2 py-1 text-xs font-mono bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded">
                    {shortcut.keys}
                  </kbd>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'tips' && (
            <div className="space-y-3">
              {tips.map((item, index) => (
                <div key={index} className="flex items-start gap-3 p-4 bg-linear-to-r from-emerald-50/50 to-transparent dark:from-emerald-900/10 border border-emerald-100 dark:border-emerald-900/30 rounded-xl">
                  <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg text-emerald-600 dark:text-emerald-400 shrink-0">
                    {item.icon}
                  </div>
                  <p className="text-sm text-(--foreground) leading-relaxed">{item.tip}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-(--border) bg-(--accent)/30">
          <p className="text-center text-sm text-(--muted-foreground)">
            Press <kbd className="px-1.5 py-0.5 mx-1 text-xs font-mono bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded">Esc</kbd> to close
          </p>
        </div>
      </div>
    </div>
  );
});



// ============================================================================
// Stats Display
// ============================================================================

interface StatsDisplayProps {
  totalRows: number;
  renderTime?: number;
}

const StatsDisplay = memo(function StatsDisplay({ totalRows, renderTime }: StatsDisplayProps) {
  return (
    <div className="flex items-center gap-3 text-xs">
      <div className="flex items-center gap-1 px-2 py-1 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-md">
        <LayoutGrid className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
        <span className="text-(--foreground) font-medium">{totalRows.toLocaleString()} rows</span>
      </div>

      {renderTime && (
        <div className="flex items-center gap-1 px-2 py-1 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
          <Zap className="w-3 h-3 text-blue-600 dark:text-blue-400" />
          <span className="text-(--foreground) font-medium">{renderTime}ms</span>
        </div>
      )}

      <div className="flex items-center gap-1 px-2 py-1 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-md">
        <Sparkles className="w-3 h-3 text-purple-600 dark:text-purple-400" />
        <span className="text-(--foreground) font-medium">WASM</span>
      </div>
    </div>
  );
});

// ============================================================================
// Dark Mode Hook
// ============================================================================

function useDarkMode() {
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark' ||
        (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  return [isDark, setIsDark] as const;
}



// ============================================================================
// Demo App
// ============================================================================

function App() {
  const gridRef = useRef<WarperGridRef<Person>>(null);
  const [rowCount, setRowCount] = useState(10000); // Start with 10K for better performance
  const [isDark, setIsDark] = useDarkMode();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true); // Loading state for SQL sync
  const [showHelp, setShowHelp] = useState(false);
  const [showSqlPanel, setShowSqlPanel] = useState(false);
  const [renderTime, setRenderTime] = useState<number>();
  const [quickFilter, setQuickFilter] = useState('');
  const [liveUpdateConfig, _setLiveUpdateConfig] = useState<LiveUpdateConfig>({
    interval: 1000,
    rowsPerTick: 10,
    mode: 'random',
    updateFields: ['salary', 'performance'],
  });

  const [groupBy, setGroupBy] = useState<string[]>([]);
  const [rawData, setRawData] = useState<Person[]>(() => {
    const start = performance.now();
    const result = generateData(rowCount);
    console.log(`Initial data generation: ${(performance.now() - start).toFixed(2)}ms`);
    return result;
  });
  // State for SQL results
  const [data, setData] = useState<any[]>([]);
  const [sqlColumns, setSqlColumns] = useState<string[]>([]);

  // Track updated cells for highlight (batched via ref)
  const [updatedCells, setUpdatedCells] = useState<{ [key: string]: number }>({});
  const updatedCellsRef = useRef<{ [key: string]: number }>({});

  // Define columns first (needed by SQL sync)
  const columns = useMemo<ColumnDef<Person>[]>(() => [
    { id: 'id', field: 'id', headerName: 'ID', width: 80, sortable: true, align: 'right', pinned: 'left' },
    { id: 'firstName', field: 'firstName', headerName: 'First Name', width: 130, sortable: true, filterable: true, editable: true },
    { id: 'lastName', field: 'lastName', headerName: 'Last Name', width: 130, sortable: true, filterable: true, editable: true },
    { id: 'email', field: 'email', headerName: 'Email', width: 280, sortable: true, filterable: true },
    { id: 'age', field: 'age', headerName: 'Age', width: 80, sortable: true, align: 'right', editable: true },
    { id: 'salary', field: 'salary', headerName: 'Salary', width: 130, sortable: true, align: 'right', cellRenderer: ({ value }) => <SalaryCell value={value as number} /> },
    { id: 'department', field: 'department', headerName: 'Department', width: 140, sortable: true, filterable: true, editable: true },
    { id: 'joinDate', field: 'joinDate', headerName: 'Join Date', width: 120, sortable: true },
    { id: 'performance', field: 'performance', headerName: 'Performance', width: 150, sortable: true, cellRenderer: ({ value }) => <PerformanceBar value={value as number} /> },
    { id: 'isActive', field: 'isActive', headerName: 'Status', width: 100, sortable: true, cellRenderer: ({ value }) => <StatusBadge value={value as boolean} /> },
  ], []);

  // Regenerate data when rowCount changes

  useEffect(() => {
    const start = performance.now();
    const newData = generateData(rowCount);
    setRenderTime(Math.round(performance.now() - start));
    setRawData(newData);
  }, [rowCount]);

  // SQL Database Manager
  const sqlManager = useMemo<SqlDatabaseManager<Person>>(() => {
    return createSqlDatabaseManager<Person>({ tableName: 'employees', maxRows: 50000 });
  }, []);

  // Sync rawData to SQL and execute query
  const executeQuery = useCallback(async () => {
    let result;
    if (!groupBy.length) {
      result = await sqlManager.executeQuery(`SELECT * FROM employees LIMIT 1000`);
    } else {
      const groupCols = groupBy.map(col => `"${col}"`).join(', ');
      result = await sqlManager.executeQuery(`SELECT ${groupCols}, COUNT(*) as count, AVG(salary) as avg_salary FROM employees GROUP BY ${groupCols} LIMIT 1000`);
    }
    if (result) {
      setSqlColumns(result.columns);
      const rows = result.values.map(row => {
        const obj: any = {};
        result.columns.forEach((col, i) => { obj[col] = row[i]; });
        return obj;
      });
      setData(rows);
      // Debug: log SQL result
      console.log('SQL Query Result:', rows);
    }
  }, [groupBy, sqlManager]);

  useEffect(() => {
    const sync = async () => {
      setIsLoadingData(true);
      try {
        await sqlManager.syncData(rawData, columns);
        await executeQuery();
      } finally {
        setIsLoadingData(false);
      }
    };
    // Run sync immediately when rawData changes (no delay)
    sync();
  }, [rawData, sqlManager, columns, executeQuery]);

  // When groupBy changes, re-execute query
  useEffect(() => {
    executeQuery();
  }, [groupBy, executeQuery]);

  // Live update hook
  const {
    isLiveUpdating,
    metrics,
    toggle: toggleLiveUpdate,
    setConfig: _setLiveConfig,
  } = useLiveUpdate({
    data,
    setData: (updater) => {
      setData(prev => {
        const next = typeof updater === 'function' ? updater(prev) : updater;
        // Find changed cells and mark for highlight (batched via ref)
        const now = Date.now();
        for (let i = 0; i < prev.length; i++) {
          for (const col of columns) {
            const key = `${i}:${col.id}`;
            if (prev[i][col.id] !== next[i][col.id]) {
              updatedCellsRef.current[key] = now;
            }
          }
        }
        return next;
      });
    },
    config: liveUpdateConfig,
  });

  // Throttle updatedCells state update from ref
  useEffect(() => {
    if (!isLiveUpdating) return;
    const interval = setInterval(() => {
      setUpdatedCells((old) => {
        // Only update if changed
        const refKeys = Object.keys(updatedCellsRef.current);
        const oldKeys = Object.keys(old);
        if (refKeys.length === 0 && oldKeys.length === 0) return old;
        if (refKeys.length === oldKeys.length && refKeys.every(k => old[k] === updatedCellsRef.current[k])) return old;
        // Remove highlights older than 1s
        const now = Date.now();
        const filtered: { [key: string]: number } = {};
        for (const k in updatedCellsRef.current) {
          if (now - updatedCellsRef.current[k] < 1000) filtered[k] = updatedCellsRef.current[k];
        }
        updatedCellsRef.current = filtered;
        return filtered;
      });
    }, 200);
    return () => clearInterval(interval);
  }, [isLiveUpdating]);

  // Default plugins to enable at grid ready
  const defaultPlugins: Array<import('./warper-grid/types').PluginName> = [
    'sorting', 'filtering', 'pagination', 'selection', 'columnResizing', 'columnMoving', 'export', 'contextMenu', 'clipboard', 'columnMenu', 'cellEditing', 'statusBar'
  ];

  const [pluginsEnabled, setPluginsEnabled] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    for (const p of defaultPlugins) initial[p] = false;
    return initial;
  });

  // Undo/Redo reactive state
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const undoSubRef = useRef<(() => void) | undefined>(undefined);

  const [gridApi, setGridApi] = useState<any>(null);

  const handleGridReady = useCallback(() => {
    if (gridRef.current && gridRef.current.api !== gridApi) {
      setGridApi(gridRef.current.api);
      // Attach default plugins with sensible configs
      gridRef.current.attach(defaultPlugins, {
        pagination: { pageSize: 100, pageSizes: [50, 100, 500, 1000] },
        selection: { mode: 'multiple', checkboxSelection: true },
        sorting: { multiSort: true },
        filtering: { debounce: 300, quickFilter: true },
        columnResizing: { minWidth: 50, maxWidth: 500 },
        cellSelection: { enableRangeSelection: true, enableFillHandle: true },
        clipboard: { copyHeadersToClipboard: true },
        cellEditing: { editType: 'singleCell', undoRedoCellEditing: true },
        contextMenu: {},
        statusBar: {},
      });

      // Reflect attached plugins in local state
      setPluginsEnabled(prev => {
        const next = { ...prev };
        for (const p of defaultPlugins) next[p] = true;
        return next;
      });

      // Subscribe to state changes to update undo/redo button state reactively
      // Unsubscribe previous if any
      if (undoSubRef.current) undoSubRef.current();
      const unsub = gridRef.current.api.subscribe((state) => {
        setCanUndo((state.undoRedo?.undoStack.length ?? 0) > 0);
        setCanRedo((state.undoRedo?.redoStack.length ?? 0) > 0);
      });
      undoSubRef.current = unsub;

      // Initialize availability
      setCanUndo(!!gridRef.current.api.canUndo?.());
      setCanRedo(!!gridRef.current.api.canRedo?.());
    }
  }, [gridApi]);

  // Cleanup subscription on unmount
  useEffect(() => {
    return () => {
      if (undoSubRef.current) undoSubRef.current();
    };
  }, []);

  const togglePlugin = useCallback((pluginName: import('./warper-grid/types').PluginName) => {
    if (!gridRef.current) return;
    const isEnabled = pluginsEnabled[pluginName];
    if (isEnabled) {
      gridRef.current.detach([pluginName]);
      setPluginsEnabled(prev => ({ ...prev, [pluginName]: false }));
    } else {
      gridRef.current.attach([pluginName as any]);
      setPluginsEnabled(prev => ({ ...prev, [pluginName]: true }));
    }
  }, [pluginsEnabled]);

  const handleRowCountChange = useCallback((newCount: number) => {
    if (newCount >= 1000000) {
      setIsGenerating(true);
      setTimeout(() => {
        setRowCount(newCount);
        setIsGenerating(false);
      }, 0);
    } else {
      setRowCount(newCount);
    }
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Show help on '?'
      if (e.key === '?' && !e.ctrlKey && !e.metaKey) {
        setShowHelp(true);
        return;
      }

      // Ignore when focus is in an editable field
      const active = document.activeElement as HTMLElement | null;
      const isEditingField = !!active && (
        active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.isContentEditable
      );
      if (isEditingField) return;

      // Undo (Ctrl/Cmd+Z) and Redo (Ctrl/Cmd+Y or Ctrl/Cmd+Shift+Z)
      if ((e.ctrlKey || e.metaKey) && !e.altKey) {
        const k = e.key.toLowerCase();
        if (k === 'z' && !e.shiftKey) {
          e.preventDefault();
          gridRef.current?.api.undo?.();
          return;
        }
        if (k === 'y' || (k === 'z' && e.shiftKey)) {
          e.preventDefault();
          gridRef.current?.api.redo?.();
          return;
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="min-h-screen bg-(--background) transition-colors duration-200">
      <HelpModal isOpen={showHelp} onClose={() => setShowHelp(false)} />
      <SqlQueryPanel
        sqlManager={sqlManager}
        tableName="employees"
        isOpen={showSqlPanel}
        onClose={() => setShowSqlPanel(false)}
      />

      <div className="w-full mx-auto p-4 md:p-6 lg:p-8">
        <header className="mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-linear-to-br from-emerald-500 to-emerald-600 rounded-xl shadow-lg shadow-emerald-500/20">
                <Grid3X3 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-(--foreground) flex items-center gap-2">
                  WarperGrid
                  <span className="px-2 py-0.5 text-xs font-medium bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-full">DEMO</span>
                </h1>
                <p className="text-xs text-(--muted-foreground)">High-performance data grid with WASM virtualization</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Tooltip content={isDark ? 'Switch to light mode' : 'Switch to dark mode'}>
                <button onClick={() => setIsDark(!isDark)} className="h-8 w-8 flex items-center justify-center rounded-lg border border-(--border) bg-(--background) text-(--foreground) hover:bg-(--accent) transition-colors" aria-label="Toggle dark mode">
                  {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </button>
              </Tooltip>
            </div>
          </div>
        </header>

        {/* Compact Grid with Integrated Controls */}
        <div className="border border-(--border) rounded-xl overflow-hidden shadow-xl shadow-black/5 bg-(--card)">
          {/* Integrated Grid Header with All Controls */}
          <div className="border-b border-(--border) bg-(--background)/50 backdrop-blur-sm">
            <div className="p-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                {/* Left Section: Live Updates & Row Count */}
                <div className="flex items-center gap-3">
                  {/* Compact Live Updates */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={toggleLiveUpdate}
                      className={cn(
                        'flex items-center gap-1.5 px-2 py-1 text-xs font-medium rounded-md transition-all',
                        isLiveUpdating
                          ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50'
                          : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-900/50'
                      )}
                    >
                      {isLiveUpdating ? (
                        <>
                          <Pause className="w-3 h-3" />
                          Stop
                        </>
                      ) : (
                        <>
                          <Play className="w-3 h-3" />
                          Live
                        </>
                      )}
                    </button>

                    {isLiveUpdating && (
                      <div className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                        </span>
                        <span>{metrics.rowsUpdated} updates</span>
                      </div>
                    )}
                  </div>

                  {/* Row Count Selector */}
                  <div className="flex items-center gap-1 sm:gap-2">
                    <label className="text-xs font-medium text-(--muted-foreground) hidden sm:inline">Rows:</label>
                    <select
                      value={rowCount}
                      onChange={(e) => handleRowCountChange(Number(e.target.value))}
                      disabled={isGenerating || isLiveUpdating}
                      className="h-7 px-1.5 sm:px-2 text-xs border border-(--border) rounded bg-(--background) text-(--foreground) focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none disabled:opacity-50"
                    >
                      <option value={1000}>1K</option>
                      <option value={10000}>10K</option>
                      <option value={100000}>100K</option>
                      <option value={500000}>500K</option>
                      <option value={1000000}>1M</option>
                      <option value={5000000}>5M</option>
                      <option value={10000000}>10M</option>
                    </select>
                    {isGenerating && (
                      <RefreshCw className="w-3 h-3 animate-spin text-(--muted-foreground)" />
                    )}
                  </div>
                </div>

                {/* Center Section: Search - Hidden on very small screens */}
                <div className="flex-1 max-w-sm hidden sm:block">
                  <div className="relative">
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-(--muted-foreground)" />
                    <input
                      type="text"
                      placeholder="Filter..."
                      value={quickFilter}
                      onChange={(e) => { setQuickFilter(e.target.value); gridRef.current?.api.setQuickFilter(e.target.value); }}
                      className="w-full h-7 pl-6 pr-2 text-xs border border-(--border) rounded bg-(--background) text-(--foreground) placeholder:text-(--muted-foreground) focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                    />
                  </div>
                </div>

                {/* Right Section: Actions */}
                <div className="flex items-center gap-1">
                  {/* Quick Actions: Scroll + Undo / Redo - Hidden on mobile */}
                  <div className="hidden sm:flex items-center gap-1">
                    <Tooltip content="Scroll to top">
                      <button onClick={() => gridRef.current?.api.scrollToRow(0)} className="h-7 w-7 flex items-center justify-center border border-(--border) rounded bg-(--background) text-(--foreground) hover:bg-(--accent) transition-colors">
                        <ArrowUp className="w-3 h-3" />
                      </button>
                    </Tooltip>

                    <Tooltip content="Scroll to bottom">
                      <button onClick={() => gridRef.current?.api.scrollToRow(data.length - 1)} className="h-7 w-7 flex items-center justify-center border border-(--border) rounded bg-(--background) text-(--foreground) hover:bg-(--accent) transition-colors">
                        <ArrowDown className="w-3 h-3" />
                      </button>
                    </Tooltip>

                    <div className="w-px h-4 bg-(--border) mx-1" />

                    <Tooltip content="Undo (Ctrl+Z)">
                      <button
                        onClick={() => gridRef.current?.api.undo?.()}
                        className={cn(
                          'h-7 w-7 flex items-center justify-center border rounded transition-colors bg-(--background) text-(--foreground) border-(--border) hover:bg-(--accent)'
                        )}
                        aria-label="Undo"
                      >
                        <CornerUpLeft className="w-3 h-3" />
                      </button>
                    </Tooltip>

                    <Tooltip content="Redo (Ctrl+Y)">
                      <button
                        onClick={() => gridRef.current?.api.redo?.()}
                        className={cn(
                          'h-7 w-7 flex items-center justify-center border rounded transition-colors bg-(--background) text-(--foreground) border-(--border) hover:bg-(--accent)'
                        )}
                        aria-label="Redo"
                      >
                        <CornerDownRight className="w-3 h-3" />
                      </button>
                    </Tooltip>

                    <div className="w-px h-4 bg-(--border) mx-1" />
                  </div>

                  {/* SQL Query */}
                  <Tooltip content="SQL Query Console">
                    <button onClick={() => setShowSqlPanel(true)} className="h-7 px-2 flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium transition-colors">
                      <Database className="w-3 h-3" />
                      SQL
                    </button>
                  </Tooltip>

                  {/* Export */}
                  <Tooltip content="Export to CSV">
                    <button onClick={() => gridRef.current?.api.exportToCsv({ fileName: 'employees.csv' })} className="h-7 px-2 flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-medium transition-colors">
                      <Download className="w-3 h-3" />
                      CSV
                    </button>
                  </Tooltip>

                  {/* Plugin Toggles - Hidden on mobile */}
                  <div className="hidden md:flex items-center gap-1 ml-1">
                    <Tooltip content="Toggle Filtering">
                      <button
                        onClick={() => togglePlugin('filtering')}
                        className={cn(
                          'h-7 w-7 flex items-center justify-center border rounded transition-colors',
                          pluginsEnabled.filtering ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-(--background) text-(--foreground) border-(--border) hover:bg-(--accent)'
                        )}
                      >
                        <Filter className="w-3 h-3" />
                      </button>
                    </Tooltip>

                    <Tooltip content="Toggle Selection">
                      <button
                        onClick={() => togglePlugin('selection')}
                        className={cn(
                          'h-7 w-7 flex items-center justify-center border rounded transition-colors',
                          pluginsEnabled.selection ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-(--background) text-(--foreground) border-(--border) hover:bg-(--accent)'
                        )}
                      >
                        <Grid3X3 className="w-3 h-3" />
                      </button>
                    </Tooltip>

                    <Tooltip content="Toggle Column Moving">
                      <button
                        onClick={() => togglePlugin('columnMoving')}
                        className={cn(
                          'h-7 w-7 flex items-center justify-center border rounded transition-colors',
                          pluginsEnabled.columnMoving ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-(--background) text-(--foreground) border-(--border) hover:bg-(--accent)'
                        )}
                      >
                        <Columns3 className="w-3 h-3" />
                      </button>
                    </Tooltip>

                    <Tooltip content="Toggle Column Resizing">
                      <button
                        onClick={() => togglePlugin('columnResizing')}
                        className={cn(
                          'h-7 w-7 flex items-center justify-center border rounded transition-colors',
                          pluginsEnabled.columnResizing ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-(--background) text-(--foreground) border-(--border) hover:bg-(--accent)'
                        )}
                      >
                        <Columns3 className="w-3 h-3" />
                      </button>
                    </Tooltip>

                    <Tooltip content="Toggle Clipboard">
                      <button
                        onClick={() => togglePlugin('clipboard')}
                        className={cn(
                          'h-7 w-7 flex items-center justify-center border rounded transition-colors',
                          pluginsEnabled.clipboard ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-(--background) text-(--foreground) border-(--border) hover:bg-(--accent)'
                        )}
                      >
                        <Clipboard className="w-3 h-3" />
                      </button>
                    </Tooltip>

                    <Tooltip content="Toggle Cell Editing">
                      <button
                        onClick={() => togglePlugin('cellEditing')}
                        className={cn(
                          'h-7 w-7 flex items-center justify-center border rounded transition-colors',
                          pluginsEnabled.cellEditing ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-(--background) text-(--foreground) border-(--border) hover:bg-(--accent)'
                        )}
                      >
                        <Edit3 className="w-3 h-3" />
                      </button>
                    </Tooltip>

                    <Tooltip content="Toggle Status Bar">
                      <button
                        onClick={() => togglePlugin('statusBar')}
                        className={cn(
                          'h-7 w-7 flex items-center justify-center border rounded transition-colors',
                          pluginsEnabled.statusBar ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-(--background) text-(--foreground) border-(--border) hover:bg-(--accent)'
                        )}
                      >
                        <LayoutGrid className="w-3 h-3" />
                      </button>
                    </Tooltip>

                    <Tooltip content="Toggle Row Grouping">
                      <button
                        onClick={() => togglePlugin('rowGrouping')}
                        className={cn(
                          'h-7 w-7 flex items-center justify-center border rounded transition-colors',
                          pluginsEnabled.rowGrouping ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-(--background) text-(--foreground) border-(--border) hover:bg-(--accent)'
                        )}
                      >
                        <List className="w-3 h-3" />
                      </button>
                    </Tooltip>
                  </div>

                  {/* Help - Hidden on mobile */}
                  <Tooltip content="Help & Shortcuts">
                    <button onClick={() => setShowHelp(true)} className="hidden sm:flex h-7 w-7 items-center justify-center border border-(--border) rounded bg-(--background) text-(--foreground) hover:bg-(--accent) transition-colors">
                      <HelpCircle className="w-3 h-3" />
                    </button>
                  </Tooltip>
                </div>
              </div>
            </div>
          </div>

          {/* Group Panel (drag columns here) */}
          {pluginsEnabled.rowGrouping && (
            <div className="px-3 py-2 border-b border-(--border) bg-(--background)/30">
              <GroupPanel groupBy={groupBy} setGroupBy={setGroupBy} />
            </div>
          )}

          {/* Grid Content */}
          {/* Dynamically build columns from SQL result if grouping, else use default columns */}
          {isLoadingData ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <RefreshCw className="w-8 h-8 animate-spin text-emerald-600 dark:text-emerald-400 mb-3" />
              <div className="text-lg text-(--foreground)">Loading data...</div>
              <div className="text-xs text-(--muted-foreground) mt-1">Initializing SQL database</div>
            </div>
          ) : data.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center text-lg text-red-500">
              <div>No data returned from SQL query.</div>
              <div className="text-xs text-gray-400 mt-2">Check the SQL query, data sync, or open the browser console for details.</div>
            </div>
          ) : (
            <WarperGrid
              ref={gridRef}
              data={data}
              columns={groupBy.length ? sqlColumns.map(col => ({ id: col, field: col, headerName: col, width: 130 })) : columns}
              height={Math.min(650, typeof window !== 'undefined' ? window.innerHeight - 300 : 650)}
              rowHeight={40}
              headerHeight={44}
              overscan={5}
              striped
              renderTime={renderTime}
              useWasm={true}
              actualTotalRows={rawData.length}
              onGridReady={handleGridReady}
              onCellClick={(event: { colId: string; value: unknown }) => console.log('Cell clicked:', event.colId, event.value)}
              onRowClick={(event: { rowIndex: number; data: Person }) => console.log('Row clicked:', event.rowIndex, event.data)}
              onSortChanged={(event: { sortModel: unknown }) => console.log('Sort changed:', event.sortModel)}
              onCellDoubleClick={(event: { colId: string }) => console.log('Cell double-clicked:', event.colId, 'Editing enabled')}
              cellStyle={({ rowIndex, column }) => {
                const key = `${rowIndex}:${column.id}`;
                if (typeof updatedCells !== 'undefined' && updatedCells[key]) {
                  return { color: '#eab308', fontWeight: 700, background: 'rgba(234,179,8,0.08)' };
                }
                return {};
              }}
            />
          )}
        </div>

        <footer className="mt-3 hidden sm:flex items-center justify-between">
          <StatsDisplay totalRows={rawData.length} renderTime={renderTime} />

          <div className="flex items-center gap-3 text-xs text-(--muted-foreground)">
            <span>Powered by <strong className="text-emerald-600 dark:text-emerald-400">Warper WASM</strong></span>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default App;
