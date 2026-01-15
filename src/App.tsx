import { useRef, useMemo, useCallback, useState, useEffect, memo } from 'react';
import { WarperGrid, type WarperGridRef, type ColumnDef } from './warper-grid';
import { SqlQueryPanel } from './warper-grid/components/SqlQueryPanel';
import { PerformanceMonitor, useLiveUpdate, type LiveUpdateConfig } from './warper-grid/components/LiveUpdatePanel';
import { createSqlDatabaseManager, type SqlDatabaseManager } from './warper-grid/plugins/sql-query';
import { 
  Moon, Sun, HelpCircle, X, Keyboard, MousePointer2, 
  Copy, Clipboard, Edit3, Filter, ArrowUpDown, Columns3,
  FileSpreadsheet, CheckSquare, Grid3X3,
  Zap, ExternalLink, Github, Sparkles, LayoutGrid,
  Download, RefreshCw, ArrowUp, ArrowDown, Search,
  Database, Play, Pause
} from 'lucide-react';

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
  
  const positionClasses: Record<string, string> = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  const arrowClasses: Record<string, string> = {
    top: 'top-full left-1/2 -translate-x-1/2 -mt-1',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 -mb-1',
    left: 'left-full top-1/2 -translate-y-1/2 -ml-1',
    right: 'right-full top-1/2 -translate-y-1/2 -mr-1',
  };
  
  return (
    <div 
      className="relative inline-flex"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      {show && (
        <div className={'absolute z-50 px-2 py-1 text-xs font-medium text-white bg-gray-900 dark:bg-gray-700 rounded shadow-lg whitespace-nowrap pointer-events-none ' + positionClasses[position]}>
          {content}
          <div className={'absolute w-2 h-2 bg-gray-900 dark:bg-gray-700 rotate-45 ' + arrowClasses[position]} />
        </div>
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
// Quick Actions Bar
// ============================================================================

interface QuickActionsProps {
  gridRef: React.RefObject<WarperGridRef<Person> | null>;
  dataLength: number;
  onHelp: () => void;
}

const QuickActions = memo(function QuickActions({ gridRef, dataLength, onHelp }: QuickActionsProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Tooltip content="Scroll to first row">
        <button onClick={() => gridRef.current?.api.scrollToRow(0)} className="h-9 px-3 flex items-center gap-2 border border-(--border) rounded-lg bg-(--background) text-(--foreground) hover:bg-(--accent) transition-colors">
          <ArrowUp className="w-4 h-4" />
          <span className="hidden sm:inline">Top</span>
        </button>
      </Tooltip>
      
      <Tooltip content="Scroll to last row">
        <button onClick={() => gridRef.current?.api.scrollToRow(dataLength - 1)} className="h-9 px-3 flex items-center gap-2 border border-(--border) rounded-lg bg-(--background) text-(--foreground) hover:bg-(--accent) transition-colors">
          <ArrowDown className="w-4 h-4" />
          <span className="hidden sm:inline">Bottom</span>
        </button>
      </Tooltip>
      
      <Tooltip content="Refresh data">
        <button onClick={() => gridRef.current?.api.refreshCells()} className="h-9 px-3 flex items-center gap-2 border border-(--border) rounded-lg bg-(--background) text-(--foreground) hover:bg-(--accent) transition-colors">
          <RefreshCw className="w-4 h-4" />
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </Tooltip>
      
      <div className="w-px h-6 bg-(--border) hidden sm:block" />
      
      <Tooltip content="Export to CSV">
        <button onClick={() => gridRef.current?.api.exportToCsv({ fileName: 'employees.csv' })} className="h-9 px-3 flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors">
          <Download className="w-4 h-4" />
          <span className="hidden sm:inline">Export CSV</span>
        </button>
      </Tooltip>
      
      <Tooltip content="Open help (keyboard shortcuts, features)">
        <button onClick={onHelp} className="h-9 px-3 flex items-center gap-2 border border-emerald-500 text-emerald-600 dark:text-emerald-400 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors">
          <HelpCircle className="w-4 h-4" />
          <span className="hidden sm:inline">Help</span>
        </button>
      </Tooltip>
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
    <div className="flex flex-wrap items-center gap-4 text-sm">
      <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg">
        <LayoutGrid className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
        <span className="text-(--foreground) font-medium">{totalRows.toLocaleString()} rows</span>
      </div>
      
      {renderTime && (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <Zap className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <span className="text-(--foreground) font-medium">{renderTime}ms render</span>
        </div>
      )}
      
      <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
        <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
        <span className="text-(--foreground) font-medium">WASM Virtualized</span>
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
// Feature Tips Banner
// ============================================================================

const FeatureTipsBanner = memo(function FeatureTipsBanner() {
  const [currentTip, setCurrentTip] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  
  const tips = [
    { icon: <MousePointer2 className="w-4 h-4" />, text: '💡 Right-click any cell to open the context menu' },
    { icon: <Grid3X3 className="w-4 h-4" />, text: '💡 Click and drag to select a range of cells' },
    { icon: <Edit3 className="w-4 h-4" />, text: '💡 Double-click a cell to start editing' },
    { icon: <Keyboard className="w-4 h-4" />, text: '💡 Press Ctrl+C to copy, Ctrl+V to paste' },
    { icon: <ArrowUpDown className="w-4 h-4" />, text: '💡 Click column headers to sort, Shift+Click for multi-sort' },
  ];
  
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTip((prev) => (prev + 1) % tips.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [tips.length]);
  
  if (!isVisible) return null;
  
  return (
    <div className="relative flex items-center justify-center gap-2 px-4 py-2 bg-linear-to-r from-emerald-500/10 via-emerald-500/5 to-emerald-500/10 border border-emerald-500/20 rounded-lg overflow-hidden">
      <div className="flex items-center gap-2 text-sm text-emerald-700 dark:text-emerald-300 transition-all duration-500">
        {tips[currentTip].icon}
        <span>{tips[currentTip].text}</span>
      </div>
      <button onClick={() => setIsVisible(false)} className="absolute right-2 p-1 hover:bg-emerald-500/20 rounded transition-colors">
        <X className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
      </button>
    </div>
  );
});

// ============================================================================
// Demo App
// ============================================================================

function App() {
  const gridRef = useRef<WarperGridRef<Person>>(null);
  const [rowCount, setRowCount] = useState(10000); // Start with 10K for better performance
  const [isDark, setIsDark] = useDarkMode();
  const [isGenerating, setIsGenerating] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showSqlPanel, setShowSqlPanel] = useState(false);
  const [renderTime, setRenderTime] = useState<number>();
  const [quickFilter, setQuickFilter] = useState('');
  const [liveUpdateConfig, setLiveUpdateConfig] = useState<LiveUpdateConfig>({
    interval: 1000,
    rowsPerTick: 10,
    mode: 'random',
    updateFields: ['salary', 'performance'],
  });
  
  const [data, setData] = useState<Person[]>(() => {
    const start = performance.now();
    const result = generateData(rowCount);
    console.log(`Initial data generation: ${(performance.now() - start).toFixed(2)}ms`);
    return result;
  });
  
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
    setData(newData);
  }, [rowCount]);

  // SQL Database Manager
  const sqlManager = useMemo<SqlDatabaseManager<Person>>(() => {
    return createSqlDatabaseManager<Person>({ tableName: 'employees', maxRows: 50000 });
  }, []);

  // Sync SQL database when data changes
  useEffect(() => {
    sqlManager.syncData(data, columns);
  }, [data, sqlManager, columns]);

  // Live update hook
  const {
    isLiveUpdating,
    metrics,
    toggle: toggleLiveUpdate,
    setConfig: setLiveConfig,
  } = useLiveUpdate({
    data,
    setData,
    config: liveUpdateConfig,
  });

  const handleGridReady = useCallback(() => {
    if (gridRef.current) {
      gridRef.current.attach(['*'], {
        pagination: { pageSize: 100, pageSizes: [50, 100, 500, 1000] },
        selection: { mode: 'multiple', checkboxSelection: true },
        sorting: { multiSort: true },
        filtering: { debounce: 300, quickFilter: true },
        columnResizing: { minWidth: 50, maxWidth: 500 },
        cellSelection: { enableRangeSelection: true, enableFillHandle: true },
        clipboard: { copyHeadersToClipboard: true },
        cellEditing: { editType: 'singleCell', undoRedoCellEditing: true },
        contextMenu: { enabled: true },
        statusBar: { enabled: true },
      });
    }
  }, []);

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
      if (e.key === '?' && !e.ctrlKey && !e.metaKey) {
        setShowHelp(true);
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
      
      <div className="max-w-[1600px] mx-auto p-4 md:p-6 lg:p-8">
        <header className="mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-linear-to-br from-emerald-500 to-emerald-600 rounded-2xl shadow-lg shadow-emerald-500/20">
                <Grid3X3 className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-(--foreground) flex items-center gap-2">
                  WarperGrid
                  <span className="px-2 py-0.5 text-xs font-medium bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-full">DEMO</span>
                </h1>
                <p className="text-sm md:text-base text-(--muted-foreground)">High-performance React data grid powered by Warper WASM virtualization</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Tooltip content="View on GitHub">
                <a href="https://github.com/warper-org/warper-grid" target="_blank" rel="noopener noreferrer" className="h-10 w-10 flex items-center justify-center rounded-lg border border-(--border) bg-(--background) text-(--foreground) hover:bg-(--accent) transition-colors">
                  <Github className="w-5 h-5" />
                </a>
              </Tooltip>
              
              <Tooltip content={isDark ? 'Switch to light mode' : 'Switch to dark mode'}>
                <button onClick={() => setIsDark(!isDark)} className="h-10 w-10 flex items-center justify-center rounded-lg border border-(--border) bg-(--background) text-(--foreground) hover:bg-(--accent) transition-colors" aria-label="Toggle dark mode">
                  {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </button>
              </Tooltip>
            </div>
          </div>
          
          <FeatureTipsBanner />
        </header>

        {/* Performance Monitor - Live Updates */}
        <div className="mb-4">
          <PerformanceMonitor
            isLiveUpdating={isLiveUpdating}
            metrics={metrics}
            onToggle={toggleLiveUpdate}
            onConfigChange={(newConfig) => {
              setLiveUpdateConfig(prev => ({ ...prev, ...newConfig }));
              setLiveConfig(newConfig);
            }}
            config={liveUpdateConfig}
          />
        </div>

        <div className="mb-4 p-4 bg-(--card) border border-(--border) rounded-xl">
          <div className="flex flex-col lg:flex-row lg:items-center gap-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-(--muted-foreground) whitespace-nowrap">Rows:</label>
                <select value={rowCount} onChange={(e) => handleRowCountChange(Number(e.target.value))} disabled={isGenerating || isLiveUpdating} className="h-9 px-3 border border-(--border) rounded-lg bg-(--background) text-(--foreground) font-medium focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all disabled:opacity-50">
                  <option value={1000}>1K</option>
                  <option value={10000}>10K</option>
                  <option value={100000}>100K</option>
                  <option value={500000}>500K</option>
                  <option value={1000000}>1M</option>
                  <option value={5000000}>5M</option>
                  <option value={10000000}>10M</option>
                </select>
                {isGenerating && (
                  <div className="flex items-center gap-2 text-sm text-(--muted-foreground)">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Generating...
                  </div>
                )}
              </div>
              
              <div className="relative flex-1 min-w-[200px] max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-(--muted-foreground)" />
                <input type="text" placeholder="Quick filter..." value={quickFilter} onChange={(e) => { setQuickFilter(e.target.value); gridRef.current?.api.setQuickFilter(e.target.value); }} className="w-full h-9 pl-9 pr-3 border border-(--border) rounded-lg bg-(--background) text-(--foreground) placeholder:text-(--muted-foreground) focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all" />
              </div>
            </div>
            
            <div className="flex-1 flex flex-wrap justify-end gap-2">
              {/* SQL Query Button */}
              <Tooltip content="Open SQL Query Console">
                <button onClick={() => setShowSqlPanel(true)} className="h-9 px-3 flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
                  <Database className="w-4 h-4" />
                  <span className="hidden sm:inline">SQL Query</span>
                </button>
              </Tooltip>
              
              <QuickActions gridRef={gridRef} dataLength={data.length} onHelp={() => setShowHelp(true)} />
            </div>
          </div>
        </div>

        <div className="mb-4 flex flex-wrap gap-2">
          <Tooltip content="SQL Query - Query data with SQL" position="bottom">
            <button onClick={() => setShowSqlPanel(true)} className="flex items-center gap-1.5 px-3 py-1.5 bg-(--card) border border-(--border) rounded-lg text-sm cursor-pointer hover:border-blue-500/50 transition-colors">
              <Database className="w-4 h-4 text-blue-500" />
              <span>SQL Query</span>
            </button>
          </Tooltip>
          
          <Tooltip content="Live Updates - Real-time data changes" position="bottom">
            <button onClick={toggleLiveUpdate} className={'flex items-center gap-1.5 px-3 py-1.5 bg-(--card) border rounded-lg text-sm cursor-pointer transition-colors ' + (isLiveUpdating ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' : 'border-(--border) hover:border-emerald-500/50')}>
              {isLiveUpdating ? <Pause className="w-4 h-4 text-emerald-500" /> : <Play className="w-4 h-4 text-emerald-500" />}
              <span>{isLiveUpdating ? 'Live' : 'Start Live'}</span>
            </button>
          </Tooltip>
        
          <Tooltip content="Context Menu - Right-click on cells" position="bottom">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-(--card) border border-(--border) rounded-lg text-sm cursor-help hover:border-emerald-500/50 transition-colors">
              <MousePointer2 className="w-4 h-4 text-emerald-500" />
              <span>Right-click</span>
            </div>
          </Tooltip>
          
          <Tooltip content="Cell Selection - Click and drag" position="bottom">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-(--card) border border-(--border) rounded-lg text-sm cursor-help hover:border-blue-500/50 transition-colors">
              <Grid3X3 className="w-4 h-4 text-blue-500" />
              <span>Click+Drag</span>
            </div>
          </Tooltip>
          
          <Tooltip content="Cell Editing - Double-click to edit" position="bottom">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-(--card) border border-(--border) rounded-lg text-sm cursor-help hover:border-purple-500/50 transition-colors">
              <Edit3 className="w-4 h-4 text-purple-500" />
              <span>Double-click</span>
            </div>
          </Tooltip>
          
          <Tooltip content="Sorting - Click column headers" position="bottom">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-(--card) border border-(--border) rounded-lg text-sm cursor-help hover:border-orange-500/50 transition-colors">
              <ArrowUpDown className="w-4 h-4 text-orange-500" />
              <span>Click Header</span>
            </div>
          </Tooltip>
          
          <Tooltip content="Copy/Paste - Ctrl+C / Ctrl+V" position="bottom">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-(--card) border border-(--border) rounded-lg text-sm cursor-help hover:border-cyan-500/50 transition-colors">
              <Copy className="w-4 h-4 text-cyan-500" />
              <span>Ctrl+C/V</span>
            </div>
          </Tooltip>
          
          <Tooltip content="Column Menu - Click ⋮ in headers" position="bottom">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-(--card) border border-(--border) rounded-lg text-sm cursor-help hover:border-pink-500/50 transition-colors">
              <Columns3 className="w-4 h-4 text-pink-500" />
              <span>Column Menu</span>
            </div>
          </Tooltip>
        </div>

        <div className="border border-(--border) rounded-xl overflow-hidden shadow-xl shadow-black/5 bg-(--card)">
          <WarperGrid
            ref={gridRef}
            data={data}
            columns={columns}
            height={Math.min(600, typeof window !== 'undefined' ? window.innerHeight - 450 : 600)}
            rowHeight={40}
            headerHeight={44}
            overscan={5}
            striped
            onGridReady={handleGridReady}
            onCellClick={(event: { colId: string; value: unknown }) => console.log('Cell clicked:', event.colId, event.value)}
            onRowClick={(event: { rowIndex: number; data: Person }) => console.log('Row clicked:', event.rowIndex, event.data)}
            onSortChanged={(event: { sortModel: unknown }) => console.log('Sort changed:', event.sortModel)}
            onCellDoubleClick={(event: { colId: string }) => console.log('Cell double-clicked:', event.colId, 'Editing enabled')}
          />
        </div>

        <footer className="mt-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <StatsDisplay totalRows={data.length} renderTime={renderTime} />
          
          <div className="flex items-center gap-4 text-sm text-(--muted-foreground)">
            <a href="https://github.com/warper-org/warper-grid" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
              <Github className="w-4 h-4" />
              <span>GitHub</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            <span>•</span>
            <span>Powered by <strong className="text-emerald-600 dark:text-emerald-400">Warper WASM</strong></span>
          </div>
        </footer>

        <div className="fixed bottom-4 right-4 hidden lg:block">
          <Tooltip content="View keyboard shortcuts and help" position="left">
            <button onClick={() => setShowHelp(true)} className="flex items-center gap-2 px-4 py-2 bg-(--card) border border-(--border) rounded-full shadow-lg hover:shadow-xl hover:border-emerald-500/50 transition-all">
              <Keyboard className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span className="text-sm font-medium">Press ? for help</span>
            </button>
          </Tooltip>
        </div>
      </div>
    </div>
  );
}

export default App;
