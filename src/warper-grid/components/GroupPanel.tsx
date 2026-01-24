import React, { useCallback } from 'react';
import { X, GripHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';

export function GroupPanel({ groupBy, setGroupBy }: { groupBy: string[]; setGroupBy: (cols: string[]) => void }) {
  const groupCols = groupBy;

  const handleRemove = useCallback((colId: string) => {
    const next = groupBy.filter(c => c !== colId);
    setGroupBy(next);
  }, [groupBy, setGroupBy]);

  const [over, setOver] = React.useState(false);
  const [insertIndex, setInsertIndex] = React.useState<number | null>(null);

  // Parse payload helper
  const tryParse = useCallback((txt?: string | null) => {
    if (!txt) return '';
    try {
      const parsed = JSON.parse(txt);
      return parsed?.colId || parsed?.id || parsed || '';
    } catch {
      return txt || '';
    }
  }, []);

  const computeInsertIndex = useCallback((e: React.DragEvent) => {
    const container = e.currentTarget.querySelector('.group-pills');
    if (!container) return null;
    const children = Array.from(container.children) as HTMLElement[];
    if (children.length === 0) return 0;
    for (let i = 0; i < children.length; i++) {
      const rect = children[i].getBoundingClientRect();
      if (e.clientX < rect.left + rect.width / 2) return i;
    }
    return children.length;
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setOver(false);
    setInsertIndex(null);

    const dt = e.dataTransfer;
    // Attempt known types
    const candidates = [
      dt.getData('application/warper-col') || null,
      dt.getData('text/warper-col') || null,
      dt.getData('text/plain') || null,
      dt.getData('text') || null,
      dt.getData('application/warper-group') || null,
    ];

    let colId = '';
    // Prefer the internal group payload (preserves fromIndex)
    let payloadOriginalIdx: number | null = null;
    const rawGroup = dt.getData('application/warper-group') || null;
    if (rawGroup) {
      try {
        const parsed = JSON.parse(rawGroup);
        if (parsed && parsed.colId) {
          colId = parsed.colId;
          payloadOriginalIdx = parsed.fromIndex ?? null;
        }
      } catch {
        // fall back to tryParse below
      }
    }

    if (!colId) {
      for (const c of candidates) {
        const p = tryParse(c);
        if (p) { colId = p; break; }
      }
    }

    if (!colId) return;

    const current = groupBy;
    const idx = computeInsertIndex(e) ?? current.length;

    let next: string[];
    if (payloadOriginalIdx != null) {
      // reorder
      const tmp = current.slice();
      const moving = tmp.splice(payloadOriginalIdx, 1)[0];
      let newIdx = idx;
      if (payloadOriginalIdx < idx) newIdx = Math.max(0, idx - 1);
      tmp.splice(newIdx, 0, moving);
      next = tmp;
    } else {
      // Insert if not present
      const before = current.slice(0, idx);
      const after = current.slice(idx);
      next = [...before, colId, ...after].filter(Boolean);
      // unique
      next = Array.from(new Set(next));
    }

    setGroupBy(next);
  }, [groupBy, setGroupBy, computeInsertIndex, tryParse]);

  const onDragOver = useCallback((e: React.DragEvent) => { e.preventDefault(); setOver(true); const idx = computeInsertIndex(e); setInsertIndex(idx); }, [computeInsertIndex]);
  const onDragLeave = useCallback((e: React.DragEvent) => { e.preventDefault(); setOver(false); setInsertIndex(null); }, []);

  const onPillDragStart = useCallback((e: React.DragEvent, colId: string, index: number) => {
    const payload = JSON.stringify({ colId, fromIndex: index });
    e.dataTransfer.setData('application/warper-group', payload);
    e.dataTransfer.setData('text/plain', payload);
  }, []);

  const onPillDragEnd = useCallback(() => { setInsertIndex(null); }, []);

  return (
    <div className={cn('group-panel p-2 flex items-center gap-2', over && 'group-panel--over')} onDrop={onDrop} onDragOver={onDragOver} onDragLeave={onDragLeave} onDragEnter={onDragOver}>
      <div className="text-xs text-(--muted-foreground) mr-2">Group by:</div>
      <div className="flex items-center gap-2 group-pills">
        {groupCols.length === 0 && <div className="text-xs text-(--muted-foreground)">Drop a column here</div>}
        {groupCols.map((col, i) => (
          <React.Fragment key={col}>
            {insertIndex === i && <div className="w-0.5 bg-(--primary) h-6 rounded-sm mx-1" />}
            <div
              className="group-pill inline-flex items-center gap-2 px-2 py-1 bg-(--background) border border-(--border) rounded text-sm cursor-move"
              draggable
              onDragStart={(e) => onPillDragStart(e, col, i)}
              onDragEnd={onPillDragEnd}
            >
              <GripHorizontal className="w-3 h-3 opacity-60" />
              <span className="text-xs truncate max-w-35">{col}</span>
              <button type="button" onClick={() => handleRemove(col)} className="p-0.5 rounded hover:bg-black/10 dark:hover:bg-white/10" aria-label={`Remove ${col}`}>
                <X className="w-3 h-3" />
              </button>
            </div>
            {i < groupCols.length - 1 && <div className="group-sep text-(--muted-foreground) px-1">›</div>}
          </React.Fragment>
        ))}
        {insertIndex === (groupCols.length) && <div className="w-0.5 bg-(--primary) h-6 rounded-sm mx-1" /> }
      </div>
    </div>
  );
}

export default GroupPanel;