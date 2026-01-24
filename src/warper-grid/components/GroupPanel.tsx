import React, { useCallback, useMemo } from 'react';
import { X } from 'lucide-react';
import type { GridApi } from '../types';

type AnyGridApi = GridApi<any> | undefined;
import { cn } from '@/lib/utils';

export function GroupPanel({ api }: { api?: AnyGridApi }) {
  const groupCols = api?.getState().grouping?.groupBy ?? [];

  const handleRemove = useCallback((colId: string) => {
    const next = (api?.getState().grouping?.groupBy ?? []).filter(c => c !== colId);
    api?.setGroupColumns?.(next as any);
  }, [api]);

  const [over, setOver] = React.useState(false);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setOver(false);
    let colId = '';

    // Prefer structured application type if present
    const tryParse = (txt?: string | null) => {
      if (!txt) return '';
      try {
        const parsed = JSON.parse(txt);
        return parsed?.colId || parsed?.id || parsed || '';
      } catch {
        return txt || '';
      }
    };

    const dt = e.dataTransfer;
    // try multiple types
    const candidates = [
      dt.getData('application/warper-col') || null,
      dt.getData('text/warper-col') || null,
      dt.getData('text/plain') || null,
      dt.getData('text') || null,
    ];

    for (const c of candidates) {
      const parsed = tryParse(c);
      if (parsed) { colId = parsed; break; }
    }

    // Fallback: if DataTransferItem available, try to read as string
    if (!colId && dt.items) {
      for (let i = 0; i < dt.items.length; i++) {
        try {
          const it = dt.items[i];
          if (it.kind === 'string') {
            it.getAsString((s) => {
              const p = tryParse(s);
              if (p && api) {
                const next = Array.from(new Set([...(api.getState().grouping?.groupBy ?? []), p]));
                api.setGroupColumns?.(next as any);
              }
            });
            return;
          }
        } catch (err) { /* ignore */ }
      }
    }

    if (!colId) return;
    const next = Array.from(new Set([...(api?.getState().grouping?.groupBy ?? []), colId]));
    api?.setGroupColumns?.(next as any);
  }, [api]);

  const onDragOver = useCallback((e: React.DragEvent) => { e.preventDefault(); setOver(true); }, []);
  const onDragLeave = useCallback((e: React.DragEvent) => { e.preventDefault(); setOver(false); }, []);

  if (!api) return null;

  return (
    <div className={cn('group-panel p-2 flex items-center gap-2', over && 'group-panel--over')} onDrop={onDrop} onDragOver={onDragOver} onDragLeave={onDragLeave} onDragEnter={onDragOver}>
      <div className="text-xs text-(--muted-foreground) mr-2">Group by:</div>
      <div className="flex items-center gap-2">
        {groupCols.length === 0 && <div className="text-xs text-(--muted-foreground)">Drop a column here</div>}
        {groupCols.map(col => (
          <div key={col} className="inline-flex items-center gap-1 px-2 py-1 bg-(--background) border border-(--border) rounded text-sm">
            <span className="text-xs">{col}</span>
            <button onClick={() => handleRemove(col)} className="p-0.5 rounded hover:bg-black/10 dark:hover:bg-white/10" aria-label={`Remove ${col}`}>
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default GroupPanel;