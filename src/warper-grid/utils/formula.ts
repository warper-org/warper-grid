import * as Formula from '@formulajs/formulajs';
import type { RowData, ColumnDef, CellValue } from '../types';

function columnLetterToIndex(letters: string): number {
  let index = 0;
  for (let i = 0; i < letters.length; i++) {
    index = index * 26 + (letters.charCodeAt(i) - 64);
  }
  return index - 1; // A -> 0
}

function parseCellRef(token: string): { col: number; row: number } | null {
  const m = token.toUpperCase().match(/^([A-Z]+)(\d+)$/);
  if (!m) return null;
  return { col: columnLetterToIndex(m[1]), row: parseInt(m[2], 10) - 1 };
}

function expandRangeToken(token: string): { colFrom: number; rowFrom: number; colTo: number; rowTo: number } | null {
  const m = token.toUpperCase().match(/^([A-Z]+\d+):([A-Z]+\d+)$/);
  if (!m) return null;
  const a = parseCellRef(m[1])!;
  const b = parseCellRef(m[2])!;
  return {
    colFrom: Math.min(a.col, b.col),
    rowFrom: Math.min(a.row, b.row),
    colTo: Math.max(a.col, b.col),
    rowTo: Math.max(a.row, b.row),
  };
}

export function evaluateFormula(
  formula: string,
  rowIndex: number,
  colId: string,
  processedData: RowData[],
  columns: ColumnDef[]
): CellValue {
  // Support simple "=FUNC(arg1,arg2,...)" patterns and numeric expressions
  const trimmed = formula.trim();
  if (!trimmed.startsWith('=')) return formula;
  const body = trimmed.slice(1).trim();

  // If simple function call like SUM(A1:A10, B1)
  const funcMatch = body.match(/^([A-Z_]+)\((.*)\)$/i);
  if (funcMatch) {
    const fnName = funcMatch[1];
    const argsStr = funcMatch[2];
    const args: any[] = [];
    // Split args by comma but naive split (no nested handling)
    const argTokens = argsStr.split(',').map(s => s.trim()).filter(Boolean);
    for (const tok of argTokens) {
      // range
      const range = expandRangeToken(tok);
      if (range) {
        const values: number[] = [];
        for (let r = range.rowFrom; r <= range.rowTo; r++) {
          for (let c = range.colFrom; c <= range.colTo; c++) {
            const col = columns[c];
            if (!col || !col.field) continue;
            const row = processedData[r];
            if (!row) continue;
            const val = (row as Record<string, unknown>)[String(col.field)];
            if (typeof val === 'number') values.push(val);
            else if (!isNaN(Number(val))) values.push(Number(val));
          }
        }
        args.push(values);
        continue;
      }

      const cellRef = parseCellRef(tok);
      if (cellRef) {
        const col = columns[cellRef.col];
        const row = processedData[cellRef.row];
        if (col && col.field && row) {
          const v = (row as Record<string, unknown>)[String(col.field)];
          if (typeof v === 'number') args.push(v);
          else if (!isNaN(Number(v))) args.push(Number(v));
          else args.push(0);
        } else {
          args.push(0);
        }
        continue;
      }

      // number literal
      if (!isNaN(Number(tok))) { args.push(Number(tok)); continue; }

      // fallback: string
      args.push(tok.replace(/^"|"$/g, ''));
    }

    const fn = (Formula as any)[fnName.toLowerCase()] || (Formula as any)[fnName.toUpperCase()];
    try {
      if (typeof fn === 'function') {
        // Some functions accept arrays (SUM), others accept varargs
        // Try to call with spread
        const result = fn.apply(null, args);
        return result as CellValue;
      }
    } catch (err) {
      console.warn('[Formula] evaluation error', err);
      return '#ERROR';
    }
  }

  // Fallback: try to evaluate as a JS expression (only numeric ops) replacing A1 refs
  let expr = body.replace(/([A-Z]+\d+)(:[A-Z]+\d+)?/g, (m) => {
    const range = expandRangeToken(m);
    if (range) {
      // sum range
      const values: number[] = [];
      for (let r = range.rowFrom; r <= range.rowTo; r++) {
        for (let c = range.colFrom; c <= range.colTo; c++) {
          const col = columns[c];
          const row = processedData[r];
          if (!col || !col.field || !row) continue;
          const v = (row as Record<string, unknown>)[String(col.field)];
          values.push(Number(v) || 0);
        }
      }
      return String(values.reduce((s, x) => s + x, 0));
    }
    const cellRef = parseCellRef(m);
    if (cellRef) {
      const col = columns[cellRef.col];
      const row = processedData[cellRef.row];
      const v = col && col.field && row ? (row as Record<string, unknown>)[String(col.field)] : 0;
      return String(Number(v) || 0);
    }
    return '0';
  });

  try {
    // eslint-disable-next-line no-eval
    const val = eval(expr);
    return val as CellValue;
  } catch (err) {
    return '#ERROR';
  }
}
