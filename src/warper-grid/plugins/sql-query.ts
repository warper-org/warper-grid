import type {
  RowData,
  GridPlugin,
  GridApi,
  GridState,
  ColumnDef,
  CellValue,
} from '../types';

// ============================================================================
// SQL Query Types
// ============================================================================

export interface SqlQueryConfig {
  /** Table name to use in SQL queries (default: 'grid_data') */
  tableName?: string;
  /** Enable auto-completion hints */
  enableAutoComplete?: boolean;
  /** Max rows to return from query (default: 10000) */
  maxRows?: number;
  /** Enable query history */
  enableHistory?: boolean;
  /** Max history entries (default: 50) */
  maxHistoryEntries?: number;
}

export interface SqlQueryResult {
  columns: string[];
  values: unknown[][];
  rowCount: number;
  executionTime: number;
  error?: string;
}

export interface SqlQueryState {
  query: string;
  result: SqlQueryResult | null;
  isExecuting: boolean;
  history: string[];
}

// ============================================================================
// SQL Type Mapping
// ============================================================================

function inferSqlType(value: CellValue): string {
  if (value === null || value === undefined) return 'TEXT';
  if (typeof value === 'number') {
    return Number.isInteger(value) ? 'INTEGER' : 'REAL';
  }
  if (typeof value === 'boolean') return 'INTEGER'; // SQLite stores booleans as 0/1
  if (value instanceof Date) return 'TEXT';
  return 'TEXT';
}

function toSqlValue(value: CellValue): string | number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'boolean') return value ? 1 : 0;
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'object') return JSON.stringify(value);
  return value as string | number;
}

// ============================================================================
// SQL Database Manager
// ============================================================================

export interface SqlDatabaseManager<TData extends RowData> {
  /** Initialize/sync the database with grid data */
  syncData: (data: TData[], columns: ColumnDef<TData>[]) => Promise<void>;
  /** Execute a SQL query */
  executeQuery: (sql: string) => Promise<SqlQueryResult>;
  /** Get table schema */
  getSchema: () => Promise<{ columnName: string; type: string }[]>;
  /** Get sample queries */
  getSampleQueries: () => string[];
  /** Close database */
  close: () => void;
}

let sqlJsPromise: Promise<typeof import('sql.js')> | null = null;

async function initSqlJs() {
  if (!sqlJsPromise) {
    sqlJsPromise = import('sql.js').then(async (SQL) => {
      // Initialize with the WASM file
      const sqlPromise = SQL.default({
        locateFile: (file: string) => `https://sql.js.org/dist/${file}`,
      });
      return sqlPromise as unknown as typeof import('sql.js');
    });
  }
  return sqlJsPromise;
}

export function createSqlDatabaseManager<TData extends RowData>(
  config: SqlQueryConfig = {}
): SqlDatabaseManager<TData> {
  const { tableName = 'grid_data', maxRows = 10000 } = config;
  
  let db: import('sql.js').Database | null = null;
  let isInitialized = false;

  const syncData = async (data: TData[], cols: ColumnDef<TData>[]) => {
    const start = performance.now();
    
    // Get SQL.js
    const SQL = await initSqlJs();
    
    // Close existing database
    if (db) {
      db.close();
    }
    
    // Create new database
    db = new (SQL as unknown as { Database: new () => import('sql.js').Database }).Database();
    
    if (data.length === 0) {
      isInitialized = true;
      return;
    }
    
    // Build CREATE TABLE statement
    const visibleColumns = cols.filter(c => !c.hide && c.field);
    const columnDefs = visibleColumns.map(col => {
      const sampleValue = data[0] && col.field 
        ? (data[0] as Record<string, unknown>)[String(col.field)] as CellValue
        : null;
      const sqlType = inferSqlType(sampleValue);
      return `"${String(col.field)}" ${sqlType}`;
    });
    
    const createSql = `CREATE TABLE IF NOT EXISTS "${tableName}" (${columnDefs.join(', ')})`;
    db.run(createSql);
    
    // Insert data in batches for performance
    const batchSize = 1000;
    const limitedData = data.slice(0, maxRows);
    const fieldNames = visibleColumns.map(c => `"${String(c.field)}"`).join(', ');
    const placeholders = visibleColumns.map(() => '?').join(', ');
    
    const insertSql = `INSERT INTO "${tableName}" (${fieldNames}) VALUES (${placeholders})`;
    const stmt = db.prepare(insertSql);
    
    for (let i = 0; i < limitedData.length; i += batchSize) {
      const batch = limitedData.slice(i, i + batchSize);
      for (const row of batch) {
        const values = visibleColumns.map(col => {
          const value = col.field 
            ? (row as Record<string, unknown>)[col.field as string] as CellValue
            : null;
          return toSqlValue(value);
        });
        stmt.run(values);
      }
    }
    
    stmt.free();
    isInitialized = true;
    
    console.log(`[SQL] Synced ${limitedData.length} rows in ${(performance.now() - start).toFixed(2)}ms`);
  };

  const executeQuery = async (sql: string): Promise<SqlQueryResult> => {
    const start = performance.now();
    
    if (!db || !isInitialized) {
      return {
        columns: [],
        values: [],
        rowCount: 0,
        executionTime: 0,
        error: 'Database not initialized. Please wait for data sync.',
      };
    }
    
    try {
      const results = db.exec(sql);
      const executionTime = performance.now() - start;
      
      if (results.length === 0) {
        return {
          columns: [],
          values: [],
          rowCount: 0,
          executionTime,
        };
      }
      
      const result = results[0];
      return {
        columns: result.columns,
        values: result.values,
        rowCount: result.values.length,
        executionTime,
      };
    } catch (error) {
      return {
        columns: [],
        values: [],
        rowCount: 0,
        executionTime: performance.now() - start,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  };

  const getSchema = async () => {
    if (!db || !isInitialized) return [];
    
    try {
      const result = db.exec(`PRAGMA table_info("${tableName}")`);
      if (result.length === 0) return [];
      
      return result[0].values.map(row => ({
        columnName: String(row[1]),
        type: String(row[2]),
      }));
    } catch {
      return [];
    }
  };

  const getSampleQueries = () => [
    `SELECT * FROM ${tableName} LIMIT 100`,
    `SELECT COUNT(*) as total FROM ${tableName}`,
    `SELECT DISTINCT department FROM ${tableName}`,
    `SELECT department, COUNT(*) as count, AVG(salary) as avg_salary FROM ${tableName} GROUP BY department`,
    `SELECT * FROM ${tableName} WHERE salary > 100000 ORDER BY salary DESC`,
    `SELECT firstName, lastName, salary FROM ${tableName} WHERE isActive = 1 ORDER BY salary DESC LIMIT 10`,
    `SELECT department, SUM(salary) as total_salary FROM ${tableName} GROUP BY department ORDER BY total_salary DESC`,
    `SELECT * FROM ${tableName} WHERE age BETWEEN 25 AND 35`,
  ];

  const close = () => {
    if (db) {
      db.close();
      db = null;
      isInitialized = false;
    }
  };

  return {
    syncData,
    executeQuery,
    getSchema,
    getSampleQueries,
    close,
  };
}

// ============================================================================
// SQL Query Plugin
// ============================================================================

export function createSqlQueryPlugin<TData extends RowData>(
  config: SqlQueryConfig = {}
): GridPlugin<TData> {
  let manager: SqlDatabaseManager<TData> | null = null;

  return {
    name: 'sqlQuery',
    
    init(api: GridApi<TData>) {
      manager = createSqlDatabaseManager<TData>(config);
      
      // Sync initial data
      const state = api.getState();
      manager.syncData(state.data, state.columns);
      
      // Extend API with SQL query capabilities
      (api as GridApi<TData> & { 
        sqlQuery: SqlDatabaseManager<TData>;
      }).sqlQuery = manager;
    },
    
    destroy() {
      if (manager) {
        manager.close();
        manager = null;
      }
    },
    
    // Sync data when state changes
    onStateChange(state: GridState<TData>) {
      if (manager) {
        manager.syncData(state.data, state.columns);
      }
    },
  };
}

export default createSqlQueryPlugin;
