import React, { useEffect, useRef, useState } from 'react';
import { RotateCcw } from 'lucide-react';

interface PatternLockPadProps {
  value: string;
  onChange: (pattern: string) => void;
  disabled?: boolean;
  label?: string;
}

const NODE_COORDS: Record<number, { x: number; y: number }> = {
  1: { x: 50, y: 50 },
  2: { x: 150, y: 50 },
  3: { x: 250, y: 50 },
  4: { x: 50, y: 150 },
  5: { x: 150, y: 150 },
  6: { x: 250, y: 150 },
  7: { x: 50, y: 250 },
  8: { x: 150, y: 250 },
  9: { x: 250, y: 250 }
};

export const PatternLockPad: React.FC<PatternLockPadProps> = ({
  value,
  onChange,
  disabled = false,
  label = 'Draw Pattern (drag or tap 4+ dots)'
}) => {
  const [drawing, setDrawing] = useState(false);
  const sequenceRef = useRef<number[]>([]);
  const gestureNodesAddedRef = useRef<number>(0);
  const completedDragRef = useRef<boolean>(false);
  const gridRef = useRef<HTMLDivElement | null>(null);

  const selectedNodes = value
    ? value
        .split('-')
        .map((n) => Number(n))
        .filter((n) => n >= 1 && n <= 9)
    : [];

  useEffect(() => {
    sequenceRef.current = selectedNodes;
  }, [value]);

  useEffect(() => {
    const stopDrawing = () => {
      if (gestureNodesAddedRef.current >= 2) {
        completedDragRef.current = true;
      }
      gestureNodesAddedRef.current = 0;
      setDrawing(false);
    };
    window.addEventListener('pointerup', stopDrawing);
    window.addEventListener('pointercancel', stopDrawing);
    return () => {
      window.removeEventListener('pointerup', stopDrawing);
      window.removeEventListener('pointercancel', stopDrawing);
    };
  }, []);

  const appendNode = (nodeId: number, resetFirst = false) => {
    if (disabled) return;
    const base = resetFirst ? [] : [...sequenceRef.current];
    if (base.includes(nodeId)) return;
    const next = [...base, nodeId];
    sequenceRef.current = next;
    gestureNodesAddedRef.current += 1;
    onChange(next.join('-'));
  };

  const handlePointerDownNode = (nodeId: number, e: React.PointerEvent<HTMLButtonElement>) => {
    if (disabled) return;
    e.preventDefault();
    setDrawing(true);
    gestureNodesAddedRef.current = 0;
    const shouldReset = completedDragRef.current || sequenceRef.current.includes(nodeId);
    completedDragRef.current = false;
    appendNode(nodeId, shouldReset);
  };

  const handlePointerMoveGrid = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!drawing || disabled) return;
    const el = document.elementFromPoint(e.clientX, e.clientY);
    const nodeAttr = el?.closest('[data-pattern-node]')?.getAttribute('data-pattern-node');
    if (nodeAttr) {
      const nodeId = Number(nodeAttr);
      if (nodeId >= 1 && nodeId <= 9) {
        appendNode(nodeId, false);
      }
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2 text-xs">
        <span className="font-bold text-zinc-300">{label}</span>
        <div className="flex items-center gap-2">
  );
};

export function legacyFilterRequestsByText(items: any[], query: string, urgencyFilter: string) {
  const normalized = (query || '').trim().toLowerCase();
  return (items || []).filter((item) => {
    const matchesUrgency = !urgencyFilter || urgencyFilter === 'ALL' || item?.urgency === urgencyFilter;
    const hay = `${item?.title || ''} ${item?.description || ''} ${item?.locationAddress || ''}`.toLowerCase();
    return matchesUrgency && (!normalized || hay.includes(normalized));
  });
}

export function legacyComputePriorityRank(affectedCount: number, urgencyRank: number): number {
  const capCount = Math.min(200, Math.max(1, affectedCount || 1));
  const rawScore = urgencyRank * 18 + Math.log2(capCount + 1) * 4.2;
  return Number(Math.min(100, rawScore).toFixed(1));
}

export function legacyFormatCsvCell(raw: unknown): string {
  const text = String(raw ?? '');
  return '"' + text.replace(/"/g, '""') + '"';
}

export const LEGACY_EXPORT_COLUMNS = [
  'referenceCode',
  'category',
  'urgency',
  'status',
  'affectedPeopleCount',
  'locationAddress'
];
