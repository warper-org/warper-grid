import { useState, useCallback, useEffect, useRef, memo } from 'react';
import { cn } from '@/lib/utils';
import {
  Play,
  History,
  Table2,
  Code,
  ChevronDown,
  ChevronUp,
  Copy,
  Download,
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Database,
  Clock,
} from 'lucide-react';
import type { SqlQueryResult, SqlDatabaseManager } from '../plugins/sql-query';
import type { RowData } from '../types';

// ============================================================================
// SQL Query Panel Props
// ============================================================================

interface SqlQueryPanelProps<TData extends RowData = RowData> {
  sqlManager: SqlDatabaseManager<TData>;
  tableName?: string;
  isOpen: boolean;
  onClose: () => void;
  onApplyResults?: (result: SqlQueryResult) => void;
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
}

const ResultsTable = memo(function ResultsTable({ result }: ResultsTableProps) {
  const [page, setPage] = useState(0);
  const pageSize = 50;
  const totalPages = Math.ceil(result.values.length / pageSize);
  
  const displayedRows = result.values.slice(page * pageSize, (page + 1) * pageSize);
  
  if (result.columns.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-(--muted-foreground)">
        <Table2 className="w-12 h-12 mb-2 opacity-50" />
        <p>No results to display</p>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-(--background) border-b border-(--border)">
            <tr>
              {result.columns.map((col, i) => (
                <th
                  key={i}
                  className="px-3 py-2 text-left font-medium text-(--foreground) bg-(--muted)/30"
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
                    className="px-3 py-2 text-(--foreground) font-mono text-xs"
                  >
                    {cell === null ? (
                      <span className="text-(--muted-foreground) italic">NULL</span>
                    ) : typeof cell === 'boolean' ? (
                      cell ? 'true' : 'false'
                    ) : (
                      String(cell)
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-3 py-2 border-t border-(--border) bg-(--muted)/30">
          <span className="text-sm text-(--muted-foreground)">
            Showing {page * pageSize + 1}-{Math.min((page + 1) * pageSize, result.values.length)} of {result.values.length}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              className="px-2 py-1 text-sm border border-(--border) rounded hover:bg-(--accent) disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            <span className="text-sm text-(--muted-foreground)">
              Page {page + 1} of {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="px-2 py-1 text-sm border border-(--border) rounded hover:bg-(--accent) disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
// SQL Query Panel Component
// ============================================================================

export function SqlQueryPanel<TData extends RowData = RowData>({
  sqlManager,
  tableName = 'grid_data',
  isOpen,
  onClose,
  onApplyResults,
}: SqlQueryPanelProps<TData>) {
  const [query, setQuery] = useState(`SELECT * FROM ${tableName} LIMIT 100`);
  const [result, setResult] = useState<SqlQueryResult | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showSamples, setShowSamples] = useState(false);
  const [schema, setSchema] = useState<{ columnName: string; type: string }[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Load schema on mount
  useEffect(() => {
    if (isOpen) {
      sqlManager.getSchema().then(setSchema);
    }
  }, [isOpen, sqlManager]);
  
  // Execute query
  const executeQuery = useCallback(async () => {
    if (!query.trim()) return;
    
    setIsExecuting(true);
    
    try {
      const queryResult = await sqlManager.executeQuery(query);
      setResult(queryResult);
      
      // Add to history (avoid duplicates)
      if (!history.includes(query)) {
        setHistory(prev => [query, ...prev.slice(0, 49)]);
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
  }, [query, sqlManager, history]);
  
  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      
      // Ctrl/Cmd + Enter to execute
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        executeQuery();
      }
      
      // Escape to close
      if (e.key === 'Escape') {
        onClose();
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, executeQuery, onClose]);
  
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
  
  const sampleQueries = sqlManager.getSampleQueries();
  
  if (!isOpen) return null;
  
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
              <p className="text-sm text-(--muted-foreground)">Query your grid data using SQL (powered by sql.js)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-(--accent) rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Query Editor */}
        <div className="p-4 border-b border-(--border)">
          <div className="relative">
            <textarea
              ref={textareaRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Enter your SQL query..."
              className="w-full h-32 p-3 pr-24 font-mono text-sm bg-(--muted)/30 border border-(--border) rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
            />
            <div className="absolute top-2 right-2 flex flex-col gap-1">
              <button
                onClick={executeQuery}
                disabled={isExecuting || !query.trim()}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-all',
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
                Run
              </button>
              <span className="text-xs text-(--muted-foreground) text-center">
                Ctrl+Enter
              </span>
            </div>
          </div>
          
          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2 mt-3">
            <button
              onClick={() => setShowSamples(!showSamples)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 text-sm border border-(--border) rounded-lg transition-colors',
                showSamples ? 'bg-(--accent)' : 'hover:bg-(--accent)'
              )}
            >
              <Sparkles className="w-4 h-4 text-purple-500" />
              Sample Queries
              {showSamples ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
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
              {showHistory ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            
            <div className="flex-1" />
            
            {schema.length > 0 && (
              <div className="flex items-center gap-2 text-xs text-(--muted-foreground)">
                <Table2 className="w-4 h-4" />
                <span>Columns: {schema.map(s => s.columnName).join(', ')}</span>
              </div>
            )}
          </div>
          
          {/* Sample queries dropdown */}
          {showSamples && (
            <div className="mt-3 p-3 bg-(--muted)/30 border border-(--border) rounded-lg">
              <div className="text-sm font-medium text-(--foreground) mb-2">Sample Queries</div>
              <div className="grid grid-cols-1 gap-1">
                {sampleQueries.map((sample, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setQuery(sample);
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
                    setQuery(selected);
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
                  {onApplyResults && (
                    <button
                      onClick={() => onApplyResults(result)}
                      className="flex items-center gap-1.5 px-3 py-1 text-sm bg-emerald-600 hover:bg-emerald-700 text-white rounded transition-colors"
                    >
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
                <p className="text-lg font-medium">Run a query to see results</p>
                <p className="text-sm mt-1">Press Ctrl+Enter or click Run</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default SqlQueryPanel;
