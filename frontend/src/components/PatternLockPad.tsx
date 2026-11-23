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
          <span className="text-[11px] font-semibold text-indigo-300">
            {selectedNodes.length} dot{selectedNodes.length === 1 ? '' : 's'}
          </span>
          {selectedNodes.length > 0 && (
            <button
              type="button"
              disabled={disabled}
              onClick={() => {
                sequenceRef.current = [];
                onChange('');
              }}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-white/[0.06] hover:bg-white/10 border border-white/10 text-[11px] font-bold text-zinc-300 transition disabled:opacity-50"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      <div
        ref={gridRef}
        onPointerMove={handlePointerMoveGrid}
        className="relative mx-auto w-[216px] h-[216px] p-2 rounded-2xl bg-black/25 border border-white/10 touch-none select-none"
      >
        <svg
          viewBox="0 0 300 300"
          className="pointer-events-none absolute inset-0 w-full h-full z-0"
        >
          {selectedNodes.map((node, index) => {
            if (index === 0) return null;
            const prev = NODE_COORDS[selectedNodes[index - 1]];
            const curr = NODE_COORDS[node];
            if (!prev || !curr) return null;
            return (
              <line
                key={`${selectedNodes[index - 1]}-${node}`}
                x1={prev.x}
                y1={prev.y}
                x2={curr.x}
                y2={curr.y}
                stroke="#6366f1"
                strokeWidth="8"
                strokeLinecap="round"
                strokeOpacity="0.85"
              />
            );
          })}
        </svg>

        <div className="relative z-10 grid grid-cols-3 grid-rows-3 w-full h-full place-items-center">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((nodeId) => {
            const orderIdx = selectedNodes.indexOf(nodeId);
            const active = orderIdx !== -1;
            return (
              <button
                key={nodeId}
                type="button"
                data-pattern-node={nodeId}
                aria-label={`Pattern dot ${nodeId}`}
                disabled={disabled}
                onPointerDown={(e) => handlePointerDownNode(nodeId, e)}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                  active
                    ? 'bg-indigo-500/25 border-2 border-indigo-400 shadow-[0_0_16px_rgba(99,102,241,0.5)] scale-105'
                    : 'bg-white/[0.04] border border-white/20 hover:border-indigo-400/60'
                }`}
              >
                <span
                  className={`w-3.5 h-3.5 rounded-full transition-all ${
                    active ? 'bg-indigo-400 scale-110' : 'bg-zinc-400/70'
                  }`}
                />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
