import { useState, useCallback, useEffect, useMemo, memo, useRef } from 'react';
import { cn } from '@/lib/utils';
import { EditorView, basicSetup } from 'codemirror';
import { sql, SQLite } from '@codemirror/lang-sql';
import { autocompletion, CompletionContext } from '@codemirror/autocomplete';
import type { CompletionResult } from '@codemirror/autocomplete';
import { coolGlow } from 'thememirror';
import { keymap } from '@codemirror/view';
import {
  Play,
  History,
  Table2,
  Code,
  Copy,
  Download,
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Database,
  Clock,
  Filter,
  BarChart3,
  Layers,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import type { SqlQueryResult, SqlDatabaseManager } from '../plugins/sql-query';
import type { RowData } from '../types';

// ============================================================================
// SQL Query Panel Props
// ============================================================================

type SqlMode = 'shallow' | 'analysis';

interface SqlQueryPanelProps<TData extends RowData = RowData> {
  sqlManager: SqlDatabaseManager<TData>;
  tableName?: string;
  isOpen: boolean;
  onClose: () => void;
  onApplyResults?: (result: SqlQueryResult) => void;
  onFilterByQuery?: (whereClause: string) => void;
  schema?: { columnName: string; type: string }[];
  embedded?: boolean;
}

// ============================================================================
// Query History Item
// ============================================================================

interface QueryHistoryItemProps {
  query: string;
  onSelect: (query: string) => void;
  onRemove: (query: string) => void;
}

const QueryHistoryItem = memo(function QueryHistoryItem({
  query,
  onSelect,
  onRemove,
}: QueryHistoryItemProps) {
  return (
    <div className="group flex items-center gap-2 px-3 py-2 hover:bg-(--accent) rounded-lg transition-colors">
      <Code className="w-4 h-4 text-(--muted-foreground) shrink-0" />
      <span
        className="flex-1 text-sm font-mono truncate cursor-pointer"
        onClick={() => onSelect(query)}
      >
        {query}
      </span>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onRemove(query);
        }}
        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-(--destructive)/10 rounded transition-all"
      >
        <X className="w-3 h-3 text-(--destructive)" />
      </button>
    </div>
  );
});

// ============================================================================
// Results Table
// ============================================================================

interface ResultsTableProps {
  result: SqlQueryResult;
  compact?: boolean;
}

const ResultsTable = memo(function ResultsTable({ result, compact = false }: ResultsTableProps) {
  const [page, setPage] = useState(0);
  const pageSize = compact ? 20 : 50;
  const totalPages = Math.ceil(result.values.length / pageSize);
  
  const displayedRows = result.values.slice(page * pageSize, (page + 1) * pageSize);
  
  if (result.columns.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-4 text-(--muted-foreground)">
        <Table2 className="w-8 h-8 mb-2 opacity-50" />
        <p className="text-sm">No results</p>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col h-full w-full max-w-full overflow-x-auto">
      <div className="flex-1 overflow-auto">
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-(--background) border-b border-(--border)">
            <tr>
              {result.columns.map((col, i) => (
                <th
                  key={i}
                  className="px-2 py-1.5 text-left font-medium text-(--foreground) bg-(--muted)/30"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {displayedRows.map((row, rowIdx) => (
              <tr
                key={rowIdx}
                className="border-b border-(--border) hover:bg-(--accent)/30 transition-colors"
              >
                {row.map((cell, cellIdx) => (
                  <td
                    key={cellIdx}
                    className="px-2 py-1 text-(--foreground) font-mono"
                  >
                    {cell === null ? (
                      <span className="text-(--muted-foreground) italic">NULL</span>
                    ) : typeof cell === 'boolean' ? (
                      cell ? 'true' : 'false'
                    ) : (
                      String(cell).slice(0, 50)
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-2 py-1 border-t border-(--border) bg-(--muted)/20 text-xs">
          <span className="text-(--muted-foreground)">
            {page * pageSize + 1}-{Math.min((page + 1) * pageSize, result.values.length)} of {result.values.length}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              className="px-2 py-0.5 border border-(--border) rounded hover:bg-(--accent) disabled:opacity-50 transition-colors"
            >
              Prev
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="px-2 py-0.5 border border-(--border) rounded hover:bg-(--accent) disabled:opacity-50 transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
});

// ============================================================================
// Ultra-Fast SQL Editor (Native CodeMirror - Zero React Re-renders)
// ============================================================================

interface SqlEditorProps {
  initialValue: string;
  onExecute: (query: string) => void;
  schema: { columnName: string; type: string }[];
  tableName: string;
  height?: string;
  compact?: boolean;
}

const SqlEditor = memo(function SqlEditor({
  initialValue,
  onExecute,
  schema,
  tableName,
  height = '150px',
  compact = false,
}: SqlEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const queryRef = useRef(initialValue);

  // Create completion source (memoized for performance)
  const getCompletions = useCallback((context: CompletionContext): CompletionResult | null => {
    const word = context.matchBefore(/\w*/);
    if (!word || (word.from === word.to && !context.explicit)) return null;

    const tableCompletion = { label: tableName, type: 'keyword', info: 'Main data table' };
    const columnCompletions = schema.map(col => ({
      label: col.columnName,
      type: 'property',
      info: `Column (${col.type})`,
      boost: 2, // Boost column completions
    }));

    const keywordCompletions = [
      { label: 'SELECT', type: 'keyword' },
      { label: 'FROM', type: 'keyword' },
      { label: 'WHERE', type: 'keyword' },
      { label: 'AND', type: 'keyword' },
      { label: 'OR', type: 'keyword' },
      { label: 'ORDER BY', type: 'keyword' },
      { label: 'GROUP BY', type: 'keyword' },
      { label: 'HAVING', type: 'keyword' },
      { label: 'LIMIT', type: 'keyword' },
      { label: 'OFFSET', type: 'keyword' },
      { label: 'ASC', type: 'keyword' },
      { label: 'DESC', type: 'keyword' },
      { label: 'COUNT', type: 'function' },
      { label: 'SUM', type: 'function' },
      { label: 'AVG', type: 'function' },
      { label: 'MIN', type: 'function' },
      { label: 'MAX', type: 'function' },
      { label: 'DISTINCT', type: 'keyword' },
      { label: 'LIKE', type: 'keyword' },
      { label: 'IN', type: 'keyword' },
      { label: 'BETWEEN', type: 'keyword' },
      { label: 'IS NULL', type: 'keyword' },
      { label: 'IS NOT NULL', type: 'keyword' },
    ];

    return {
      from: word.from,
      options: [tableCompletion, ...columnCompletions, ...keywordCompletions],
      validFor: /^\w*$/,
    };
  }, [schema, tableName]);

  // Initialize editor (only once)
  useEffect(() => {
    if (!containerRef.current) return;

    // Destroy previous instance
    if (viewRef.current) {
      viewRef.current.destroy();
    }

    const executeKeymap = keymap.of([
      {
        key: 'Ctrl-Enter',
        mac: 'Cmd-Enter',
        run: () => {
          onExecute(queryRef.current);
          return true;
        },
      },
    ]);

    const view = new EditorView({
      doc: initialValue,
      extensions: [
        basicSetup,
        sql({ dialect: SQLite }),
        autocompletion({
          override: [getCompletions],
          activateOnTyping: false, // Only on explicit trigger for performance
          maxRenderedOptions: 15,
        }),
        coolGlow,
        executeKeymap,
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            queryRef.current = update.state.doc.toString();
          }
        }),
        EditorView.theme({
          '&': {
            height,
            fontSize: compact ? '12px' : '13px',
            fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Monaco, Inconsolata, "Roboto Mono", "Source Code Pro", monospace'
          },
          '.cm-scroller': { overflow: 'auto' },
          '.cm-content': { padding: '8px 0' },
          '.cm-line': { padding: '0 8px' },
          '.cm-focused': { outline: 'none' },
        }),
      ],
      parent: containerRef.current,
    });

    viewRef.current = view;

    return () => {
      view.destroy();
      viewRef.current = null;
    };
  }, []); // Empty dependency array - only initialize once

  // Update query when initialValue changes (but not during typing)
  useEffect(() => {
    if (viewRef.current && initialValue !== queryRef.current) {
      const currentDoc = viewRef.current.state.doc.toString();
      if (currentDoc !== initialValue) {
        viewRef.current.dispatch({
          changes: { from: 0, to: currentDoc.length, insert: initialValue },
        });
        queryRef.current = initialValue;
      }
    }
  }, [initialValue]);

  return (
    <div
      ref={containerRef}
      className="border border-(--border) rounded-lg overflow-hidden bg-(--background)"
      style={{ height }}
    />
  );
});

// ============================================================================
// SQL Query Panel Component (Enhanced with CodeMirror)
// ============================================================================

export function SqlQueryPanel<TData extends RowData = RowData>({
  sqlManager,
  tableName = 'grid_data',
  isOpen,
  onClose,
  onApplyResults,
  onFilterByQuery,
  schema = [],
  embedded = false,
}: SqlQueryPanelProps<TData>) {
  const [mode, setMode] = useState<SqlMode>('analysis');
  const [result, setResult] = useState<SqlQueryResult | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showSamples, setShowSamples] = useState(false);
  const [localSchema, setLocalSchema] = useState<{ columnName: string; type: string }[]>(schema);
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Use refs for query values to avoid re-renders on typing
  const queryRef = useRef(`SELECT * FROM ${tableName} LIMIT 100`);
  const shallowQueryRef = useRef('');
  const editorContainerRef = useRef<HTMLDivElement>(null);
  const embeddedEditorRef = useRef<HTMLDivElement>(null);
  
  // Load schema on mount
  useEffect(() => {
    if (isOpen && schema.length === 0) {
      sqlManager.getSchema().then(setLocalSchema);
    } else if (schema.length > 0) {
      setLocalSchema(schema);
    }
  }, [isOpen, sqlManager, schema]);
  
  // Execute query
  const executeQuery = useCallback(async (queryOverride?: string) => {
    const currentQuery = queryOverride ?? (mode === 'shallow' 
      ? `SELECT * FROM ${tableName} WHERE ${shallowQueryRef.current || '1=1'} LIMIT 1000`
      : queryRef.current);
    
    if (!currentQuery.trim()) return;
    
    setIsExecuting(true);
    
    try {
      const queryResult = await sqlManager.executeQuery(currentQuery);
      setResult(queryResult);
      
      // Add to history (avoid duplicates)
      const historyQuery = mode === 'shallow' ? shallowQueryRef.current : queryRef.current;
      if (historyQuery && !history.includes(historyQuery)) {
        setHistory(prev => [historyQuery, ...prev.slice(0, 49)]);
      }
    } catch (error) {
      setResult({
        columns: [],
        values: [],
        rowCount: 0,
        executionTime: 0,
        error: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setIsExecuting(false);
    }
  }, [mode, sqlManager, history, tableName]);
  
  // Handle keyboard shortcuts (only for shallow mode since CodeMirror handles its own)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      
      // Escape to close (only if not embedded)
      if (e.key === 'Escape' && !embedded) {
        onClose();
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, executeQuery, onClose, embedded]);
  
  // Copy results to clipboard
  const copyResults = useCallback(() => {
    if (!result || result.columns.length === 0) return;
    
    const header = result.columns.join('\t');
    const rows = result.values.map(row => row.map(cell => cell ?? '').join('\t'));
    const tsv = [header, ...rows].join('\n');
    
    navigator.clipboard.writeText(tsv);
  }, [result]);
  
  // Export results to CSV
  const exportResults = useCallback(() => {
    if (!result || result.columns.length === 0) return;
    
    const escapeCSV = (val: unknown) => {
      const str = String(val ?? '');
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };
    
    const header = result.columns.map(escapeCSV).join(',');
    const rows = result.values.map(row => row.map(escapeCSV).join(','));
    const csv = [header, ...rows].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'query_results.csv';
    link.click();
    URL.revokeObjectURL(link.href);
  }, [result]);

  // Apply filter to grid
  const applyToGrid = useCallback(() => {
    if (mode === 'shallow' && onFilterByQuery) {
      onFilterByQuery(shallowQueryRef.current);
    } else if (result && onApplyResults) {
      onApplyResults(result);
    }
  }, [mode, result, onFilterByQuery, onApplyResults]);
  
  // Handle query from SqlEditor
  const handleExecuteQuery = useCallback((query: string) => {
    queryRef.current = query;
    executeQuery(query);
  }, [executeQuery]);
  
  const sampleQueries = useMemo(() => mode === 'shallow' 
    ? [
        'salary > 100000',
        "department = 'Engineering'",
        'age BETWEEN 25 AND 35',
        'isActive = 1',
        "firstName LIKE 'J%'",
        'performance >= 80',
      ]
    : sqlManager.getSampleQueries()
  , [mode, sqlManager]);
  
  if (!isOpen) return null;

  // Embedded mode - compact inline panel
  if (embedded) {
    return (
      <div className={cn(
        'bg-(--card) border border-(--border) rounded-lg overflow-hidden transition-all',
        isExpanded ? 'h-96' : 'h-56'
      )}>
        {/* Mode Tabs */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-(--border) bg-(--muted)/20">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setMode('shallow')}
              className={cn(
                'flex items-center gap-1.5 px-2 py-1 text-xs font-medium rounded transition-colors',
                mode === 'shallow'
                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                  : 'hover:bg-(--accent)'
              )}
            >
              <Filter className="w-3 h-3" />
              Filter Rows
            </button>
            <button
              onClick={() => setMode('analysis')}
              className={cn(
                'flex items-center gap-1.5 px-2 py-1 text-xs font-medium rounded transition-colors',
                mode === 'analysis'
                  ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400'
                  : 'hover:bg-(--accent)'
              )}
            >
              <BarChart3 className="w-3 h-3" />
              Analysis
            </button>
          </div>
          
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 hover:bg-(--accent) rounded transition-colors"
            >
              {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            <button onClick={onClose} className="p-1 hover:bg-(--accent) rounded transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        {/* Query Input */}
        <div className="p-2 border-b border-(--border)">
          {mode === 'shallow' ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-(--muted-foreground) whitespace-nowrap">WHERE</span>
              <input
                defaultValue={shallowQueryRef.current}
                onChange={(e) => { shallowQueryRef.current = e.target.value; }}
                onKeyDown={(e) => {
                  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                    e.preventDefault();
                    executeQuery();
                  }
                }}
                placeholder="e.g., salary > 100000 AND department = 'Engineering'"
                className="flex-1 px-2 py-1 text-sm font-mono bg-(--background) border border-(--border) rounded focus:ring-1 focus:ring-blue-500 outline-none"
              />
              <button
                onClick={() => executeQuery()}
                disabled={isExecuting}
                className="px-2 py-1 text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors disabled:opacity-50"
              >
                {isExecuting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <div className="flex-1" ref={embeddedEditorRef}>
                <SqlEditor
                  initialValue={queryRef.current}
                  onExecute={handleExecuteQuery}
                  schema={localSchema}
                  tableName={tableName}
                  height={isExpanded ? '120px' : '60px'}
                  compact
                />
              </div>
              <button
                onClick={() => executeQuery()}
                disabled={isExecuting}
                className="px-3 py-1 text-xs font-medium bg-purple-600 hover:bg-purple-700 text-white rounded transition-colors disabled:opacity-50 self-start"
              >
                {isExecuting ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Run'}
              </button>
            </div>
          )}
        </div>
        
        {/* Results */}
        <div className="flex-1 overflow-auto" style={{ height: isExpanded ? 'calc(100% - 120px)' : 'calc(100% - 88px)' }}>
          {result ? (
            result.error ? (
              <div className="p-2 text-xs text-red-600 dark:text-red-400">
                <AlertCircle className="w-4 h-4 inline mr-1" />
                {result.error}
              </div>
            ) : (
              <ResultsTable result={result} compact />
            )
          ) : (
            <div className="flex flex-col items-center justify-center h-full py-4 text-(--muted-foreground)">
              <Database className="w-6 h-6 mb-1 opacity-30" />
              <p className="text-xs">Run a query to see results</p>
            </div>
          )}
        </div>
      </div>
    );
  }
  
  // Full modal mode
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-5xl max-h-[90vh] bg-(--background) border border-(--border) rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-(--border)">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
              <Database className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-(--foreground)">SQL Query Console</h2>
              <p className="text-sm text-(--muted-foreground)">Query your grid data with SQL (powered by sql.js)</p>
            </div>
          </div>
          
          {/* Mode Toggle */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 p-1 bg-(--muted)/30 rounded-lg">
              <button
                onClick={() => setMode('shallow')}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded transition-colors',
                  mode === 'shallow'
                    ? 'bg-blue-600 text-white'
                    : 'text-(--muted-foreground) hover:text-(--foreground)'
                )}
              >
                <Filter className="w-4 h-4" />
                Filter Rows
              </button>
              <button
                onClick={() => setMode('analysis')}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded transition-colors',
                  mode === 'analysis'
                    ? 'bg-purple-600 text-white'
                    : 'text-(--muted-foreground) hover:text-(--foreground)'
                )}
              >
                <BarChart3 className="w-4 h-4" />
                Analysis
              </button>
            </div>
            
            <button
              onClick={onClose}
              className="p-2 hover:bg-(--accent) rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        {/* Query Editor */}
        <div className="p-4 border-b border-(--border)">
          {mode === 'shallow' ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-(--foreground)">SELECT * FROM {tableName} WHERE</span>
              </div>
              <div className="flex gap-2">
                <input
                  defaultValue={shallowQueryRef.current}
                  onChange={(e) => { shallowQueryRef.current = e.target.value; }}
                  onKeyDown={(e) => {
                    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                      e.preventDefault();
                      executeQuery();
                    }
                  }}
                  placeholder="e.g., salary > 100000 AND department = 'Engineering'"
                  className="flex-1 px-3 py-2 font-mono text-sm bg-(--muted)/30 border border-(--border) rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                />
                <button
                  onClick={() => executeQuery()}
                  disabled={isExecuting}
                  className={cn(
                    'flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg transition-all',
                    isExecuting
                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  )}
                >
                  {isExecuting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Play className="w-4 h-4" />
                  )}
                  Filter
                </button>
              </div>
              <p className="text-xs text-(--muted-foreground)">
                💡 Enter a WHERE clause to filter grid rows. Available columns: {localSchema.map(s => s.columnName).join(', ')}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div ref={editorContainerRef}>
                <SqlEditor
                  initialValue={queryRef.current}
                  onExecute={handleExecuteQuery}
                  schema={localSchema}
                  tableName={tableName}
                  height="150px"
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowSamples(!showSamples)}
                    className={cn(
                      'flex items-center gap-1.5 px-3 py-1.5 text-sm border border-(--border) rounded-lg transition-colors',
                      showSamples ? 'bg-(--accent)' : 'hover:bg-(--accent)'
                    )}
                  >
                    <Sparkles className="w-4 h-4 text-purple-500" />
                    Examples
                  </button>
                  
                  <button
                    onClick={() => setShowHistory(!showHistory)}
                    className={cn(
                      'flex items-center gap-1.5 px-3 py-1.5 text-sm border border-(--border) rounded-lg transition-colors',
                      showHistory ? 'bg-(--accent)' : 'hover:bg-(--accent)'
                    )}
                  >
                    <History className="w-4 h-4 text-orange-500" />
                    History ({history.length})
                  </button>
                </div>
                
                <button
                  onClick={() => executeQuery()}
                  disabled={isExecuting}
                  className={cn(
                    'flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg transition-all',
                    isExecuting
                      ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600'
                      : 'bg-purple-600 hover:bg-purple-700 text-white'
                  )}
                >
                  {isExecuting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Play className="w-4 h-4" />
                  )}
                  Run Query
                  <span className="text-xs opacity-70 ml-1">Ctrl+Enter</span>
                </button>
              </div>
            </div>
          )}
          
          {/* Sample queries dropdown */}
          {showSamples && (
            <div className="mt-3 p-3 bg-(--muted)/30 border border-(--border) rounded-lg">
              <div className="text-sm font-medium text-(--foreground) mb-2">
                {mode === 'shallow' ? 'Example Filters' : 'Sample Queries'}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
                {sampleQueries.map((sample, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      if (mode === 'shallow') {
                        shallowQueryRef.current = sample;
                      } else {
                        queryRef.current = sample;
                        // Update editor if present
                        const editor = editorContainerRef.current?.querySelector('.cm-content');
                        if (editor) {
                          // The SqlEditor will handle the update via its setValue method
                        }
                      }
                      setShowSamples(false);
                    }}
                    className="text-left px-3 py-2 text-sm font-mono bg-(--background) hover:bg-(--accent) border border-(--border) rounded transition-colors truncate"
                  >
                    {sample}
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {/* History dropdown */}
          {showHistory && history.length > 0 && (
            <div className="mt-3 p-3 bg-(--muted)/30 border border-(--border) rounded-lg max-h-48 overflow-y-auto">
              <div className="text-sm font-medium text-(--foreground) mb-2">Query History</div>
              {history.map((q, i) => (
                <QueryHistoryItem
                  key={i}
                  query={q}
                  onSelect={(selected) => {
                    if (mode === 'shallow') {
                      shallowQueryRef.current = selected;
                    } else {
                      queryRef.current = selected;
                    }
                    setShowHistory(false);
                  }}
                  onRemove={(toRemove) => {
                    setHistory(prev => prev.filter(h => h !== toRemove));
                  }}
                />
              ))}
            </div>
          )}
        </div>
        
        {/* Results */}
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {/* Results header */}
          {result && (
            <div className="flex items-center justify-between px-4 py-2 border-b border-(--border) bg-(--muted)/20">
              <div className="flex items-center gap-4">
                {result.error ? (
                  <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                    <AlertCircle className="w-4 h-4" />
                    <span className="text-sm font-medium">Error</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="w-4 h-4" />
                    <span className="text-sm font-medium">{result.rowCount} rows</span>
                  </div>
                )}
                
                <div className="flex items-center gap-1.5 text-sm text-(--muted-foreground)">
                  <Clock className="w-4 h-4" />
                  {result.executionTime.toFixed(2)}ms
                </div>
              </div>
              
              {!result.error && result.columns.length > 0 && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={copyResults}
                    className="flex items-center gap-1.5 px-2 py-1 text-sm hover:bg-(--accent) rounded transition-colors"
                  >
                    <Copy className="w-4 h-4" />
                    Copy
                  </button>
                  <button
                    onClick={exportResults}
                    className="flex items-center gap-1.5 px-2 py-1 text-sm hover:bg-(--accent) rounded transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Export CSV
                  </button>
                  {(onApplyResults || onFilterByQuery) && (
                    <button
                      onClick={applyToGrid}
                      className="flex items-center gap-1.5 px-3 py-1 text-sm bg-emerald-600 hover:bg-emerald-700 text-white rounded transition-colors"
                    >
                      <Layers className="w-4 h-4" />
                      Apply to Grid
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
          
          {/* Results content */}
          <div className="flex-1 overflow-auto">
            {result ? (
              result.error ? (
                <div className="p-4">
                  <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                      <div>
                        <div className="font-medium text-red-800 dark:text-red-300">Query Error</div>
                        <pre className="mt-2 text-sm text-red-700 dark:text-red-400 whitespace-pre-wrap font-mono">
                          {result.error}
                        </pre>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <ResultsTable result={result} />
              )
            ) : (
              <div className="flex flex-col items-center justify-center h-full py-12 text-(--muted-foreground)">
                <Database className="w-16 h-16 mb-4 opacity-30" />
                <p className="text-lg font-medium">
                  {mode === 'shallow' ? 'Enter a filter condition' : 'Run a query to see results'}
                </p>
                <p className="text-sm mt-1">
                  {mode === 'shallow' ? 'Filter rows using SQL WHERE syntax' : 'Press Ctrl+Enter or click Run'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default SqlQueryPanel;
